-- Migration: 20260522000015_hook_security_definer.sql
-- Root cause: custom_access_token_hook returns empty claims at runtime because
-- supabase_auth_admin (the GoTrue caller role) is NOT the `authenticated` role,
-- so the RLS policy "user_profiles_select" (for select to authenticated) does not
-- apply → supabase_auth_admin sees zero rows → all profile values are NULL → defaults.
--
-- Fix: SECURITY DEFINER makes the function run as its owner (postgres), which has
-- BYPASSRLS, so RLS policies are not applied when reading user_profiles / user_roles.
-- search_path = '' is kept to prevent search-path injection attacks.
-- This follows Supabase's own hook documentation best practice.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER                  -- ← run as function owner (postgres/BYPASSRLS)
SET search_path = ''              -- ← prevent search_path injection
AS $$
DECLARE
  v_user_id        uuid;
  v_institution_id uuid;
  v_dept_id        uuid;
  v_roles          text[];
  v_active_role    text;
  v_status         text;
  claims           jsonb;
BEGIN
  v_user_id := (event->>'user_id')::uuid;
  claims    := event->'claims';

  -- Profile lookup — LIMIT 1 guards against any duplicate rows
  -- SECURITY DEFINER bypasses RLS so supabase_auth_admin can read the row
  SELECT
    up.institution_id,
    up.dept_id,
    up.status::text,
    up.active_role::text
  INTO v_institution_id, v_dept_id, v_status, v_active_role
  FROM public.user_profiles up
  WHERE up.id = v_user_id
  LIMIT 1;

  -- Role lookup — array_agg always returns one row; ORDER BY for determinism
  SELECT array_agg(ur.role_name::text ORDER BY ur.role_name)
  INTO v_roles
  FROM public.user_roles ur
  WHERE ur.user_id = v_user_id;

  -- Inject into app_metadata (SECURITY: always app_metadata, never user_metadata)
  claims := jsonb_set(claims, '{app_metadata,institution_id}',
    to_jsonb(coalesce(v_institution_id::text, '')));
  claims := jsonb_set(claims, '{app_metadata,dept_id}',
    to_jsonb(coalesce(v_dept_id::text, '')));
  claims := jsonb_set(claims, '{app_metadata,active_role}',
    to_jsonb(coalesce(v_active_role, '')));
  claims := jsonb_set(claims, '{app_metadata,roles}',
    to_jsonb(coalesce(v_roles, array[]::text[])));
  claims := jsonb_set(claims, '{app_metadata,status}',
    to_jsonb(coalesce(v_status, 'pending')));

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;

EXCEPTION WHEN OTHERS THEN
  -- Safety net: never let a hook error block a sign-in or token refresh.
  RETURN event;
END;
$$;

-- Re-grant (SECURITY DEFINER functions should be owned by postgres; grants remain the same)
GRANT  EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
GRANT  SELECT ON public.user_profiles TO supabase_auth_admin;
GRANT  SELECT ON public.user_roles    TO supabase_auth_admin;

-- Self-test: verify the function now returns correct claims from the DB (not defaults)
DO $$
DECLARE v_result jsonb; BEGIN
  v_result := public.custom_access_token_hook(
    jsonb_build_object(
      'user_id', '00000000-0000-0000-0000-000000000001',
      'claims',  jsonb_build_object(
        'aud',          'authenticated',
        'app_metadata', '{}'::jsonb
      )
    )
  );
  RAISE NOTICE 'Hook self-test app_metadata: %', v_result->'claims'->'app_metadata';

  -- Verify key fields are non-empty
  IF (v_result->'claims'->'app_metadata'->>'institution_id') = ''
     OR (v_result->'claims'->'app_metadata'->>'institution_id') IS NULL THEN
    RAISE WARNING 'HOOK institution_id is still empty — check user_profiles row!';
  ELSE
    RAISE NOTICE 'Hook institution_id OK: %',
      v_result->'claims'->'app_metadata'->>'institution_id';
  END IF;
END $$;
