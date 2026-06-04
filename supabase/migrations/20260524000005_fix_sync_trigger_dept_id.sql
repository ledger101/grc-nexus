-- Migration: 20260524000005_fix_sync_trigger_dept_id.sql
-- Patch: the original sync_auth_user_metadata() function incorrectly
-- referenced up.department_id; the actual column is up.dept_id.
-- This CREATE OR REPLACE is idempotent — safe to run even if already correct.

CREATE OR REPLACE FUNCTION public.sync_auth_user_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id       uuid;
  v_institution   uuid;
  v_dept          text;
  v_status        text;
  v_roles         text[];
  v_active_role   text;
  v_provider_meta jsonb;
BEGIN
  -- Determine which user changed
  IF TG_TABLE_NAME = 'user_profiles' THEN
    v_user_id := COALESCE(NEW.id, OLD.id);
  ELSE
    -- user_roles table: user_id column
    v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  END IF;

  -- Load profile fields (dept_id is the correct column name)
  SELECT up.institution_id, up.dept_id, up.status
  INTO   v_institution, v_dept, v_status
  FROM   public.user_profiles up
  WHERE  up.id = v_user_id;

  -- Aggregate roles
  SELECT ARRAY_AGG(ur.role_name::text ORDER BY ur.role_name)
  INTO   v_roles
  FROM   public.user_roles ur
  WHERE  ur.user_id = v_user_id;

  v_roles       := COALESCE(v_roles, ARRAY[]::text[]);
  v_active_role := CASE WHEN array_length(v_roles, 1) > 0 THEN v_roles[1] ELSE '' END;

  -- Preserve existing provider meta (provider / providers fields set by GoTrue)
  SELECT raw_app_meta_data - 'active_role' - 'roles' - 'status' - 'institution_id' - 'dept_id'
  INTO   v_provider_meta
  FROM   auth.users
  WHERE  id = v_user_id;

  v_provider_meta := COALESCE(v_provider_meta, '{}'::jsonb);

  -- Merge in the app-level metadata
  UPDATE auth.users
  SET raw_app_meta_data = v_provider_meta
    || jsonb_build_object(
         'active_role',    v_active_role,
         'roles',          to_jsonb(v_roles),
         'status',         COALESCE(v_status, ''),
         'institution_id', COALESCE(v_institution::text, ''),
         'dept_id',        COALESCE(v_dept, '')
       )
  WHERE id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;
