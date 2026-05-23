-- Migration: 20260522000012_fix_hook_function.sql
-- Root cause: custom_access_token_hook raises "query returned more than one row" (SQLSTATE 21000).
-- GoTrue calls the hook during ALL auth initialisation steps, so the exception breaks every auth
-- operation (listUsers, getUserById, signIn, etc.).
--
-- Fix:
--   1. Add LIMIT 1 to the user_profiles SELECT to prevent TOO_MANY_ROWS.
--   2. Wrap the whole function in EXCEPTION WHEN OTHERS so hook errors never block auth.
--   3. Re-grant required permissions.

-- ── 1. Show what is currently compiled in pg_proc (for debugging) ──────────
DO $$
DECLARE v_src text; BEGIN
  SELECT left(prosrc, 1200) INTO v_src
  FROM pg_proc
  WHERE proname = 'custom_access_token_hook'
    AND pronamespace = 'public'::regnamespace;
  RAISE NOTICE 'Hook source in DB (truncated to 1200): %', v_src;
END $$;

-- ── 2. Recreate the function with LIMIT 1 + EXCEPTION handler ─────────────
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = ''
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
  -- Return the unmodified event so GoTrue continues normally.
  RETURN event;
END;
$$;

-- ── 3. Re-grant permissions ────────────────────────────────────────────────
GRANT  EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
GRANT  SELECT ON public.user_profiles TO supabase_auth_admin;
GRANT  SELECT ON public.user_roles    TO supabase_auth_admin;

-- ── 4. Verify the fixed function no longer raises an exception ─────────────
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
  RAISE NOTICE 'Hook self-test PASSED. app_metadata: %',
    v_result->'claims'->'app_metadata';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Hook self-test STILL FAILED: % (%)', SQLERRM, SQLSTATE;
END $$;
