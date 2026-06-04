-- Migration: 20260522000016_sync_raw_app_meta_data.sql
-- FIX: supabase.auth.getUser() returns raw_app_meta_data from auth.users (DB field),
-- NOT the hook-enriched JWT claims. The app reads active_role / roles / status /
-- institution_id from user.app_metadata via getUser(). Without syncing those fields
-- to raw_app_meta_data, all role-gated pages redirect to /role-select → /register/pending.
--
-- This migration back-fills raw_app_meta_data for the admin seed user and adds a
-- function + trigger that keeps raw_app_meta_data in sync whenever user_profiles or
-- user_roles change. This ensures getUser() always returns correct metadata.

BEGIN;

-- 1. Back-fill admin seed user with correct app_metadata
UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object(
  'provider',        'email',
  'providers',       jsonb_build_array('email'),
  'active_role',     'admin',
  'roles',           jsonb_build_array('admin'),
  'status',          'approved',
  'institution_id',  '00000000-0000-0000-0000-000000000010',
  'dept_id',         ''
)
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. Function to sync user_profiles → auth.users.raw_app_meta_data
-- Called by triggers on user_profiles and user_roles.
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

  -- Load profile fields
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

-- 3. Trigger on user_profiles
DROP TRIGGER IF EXISTS trg_sync_metadata_on_profile ON public.user_profiles;
CREATE TRIGGER trg_sync_metadata_on_profile
  AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_metadata();

-- 4. Trigger on user_roles
DROP TRIGGER IF EXISTS trg_sync_metadata_on_roles ON public.user_roles;
CREATE TRIGGER trg_sync_metadata_on_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_metadata();

COMMIT;
