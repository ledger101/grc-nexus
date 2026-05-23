-- Migration: 20260522000010_fix_admin_user.sql
-- Rebuilds the demo admin user so GoTrue can find and authenticate them.
--
-- Problem: seed (000006) created auth.users + auth.identities directly via SQL.
--   1. extensions.crypt() may have produced a hash GoTrue cannot verify.
--   2. auth.identities.provider_id was set to the UUID (not the email),
--      which breaks GoTrue's email-lookup chain.
--   3. Supabase GoTrue admin API may not list users created via raw SQL
--      without all expected columns populated.
--
-- Fix: Delete and cleanly re-create with correct bcrypt hash and provider_id.
-- The CASCADE on auth.users → user_profiles / user_roles is intentional;
-- we re-insert those records immediately after.

BEGIN;

DO $$
DECLARE
  v_admin_id uuid := '00000000-0000-0000-0000-000000000001';
  v_inst_id  uuid := '00000000-0000-0000-0000-000000000010';
BEGIN

  -- 1. Remove any stale identity rows that reference the admin id or email
  DELETE FROM auth.identities
  WHERE user_id = v_admin_id
     OR (provider = 'email' AND provider_id = 'admin@grcnexus.gov.zw');

  -- 2. Remove the user (cascades to user_profiles, user_roles, audit_log, etc.)
  DELETE FROM auth.users WHERE id = v_admin_id;

  -- 3. Re-insert auth.users with all GoTrue-required columns populated
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
  ) VALUES (
    v_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@grcnexus.gov.zw',
    -- pgcrypto bf (blowfish/bcrypt) — GoTrue verifies standard bcrypt hashes
    extensions.crypt('Admin@GRC2026!', extensions.gen_salt('bf', 10)),
    now(),             -- email pre-confirmed
    '',                -- no pending confirmation
    '',                -- no pending recovery
    '',                -- no pending email-change
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('first_name', 'System', 'last_name', 'Administrator'),
    false,
    now(),
    now()
  );

  -- 4. Re-insert auth.identities — provider_id MUST be the email for GoTrue to find the user
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_admin_id,
    jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@grcnexus.gov.zw'),
    'email',
    'admin@grcnexus.gov.zw',   -- correct: email, not UUID
    now(),
    now(),
    now()
  );

  -- 5. Restore user_profiles (was cascade-deleted in step 2)
  INSERT INTO public.user_profiles (
    id, institution_id, first_name, last_name, status, active_role,
    created_at, updated_at
  ) VALUES (
    v_admin_id, v_inst_id, 'System', 'Administrator', 'approved', 'admin',
    now(), now()
  ) ON CONFLICT (id) DO UPDATE SET
    status     = 'approved',
    active_role = 'admin',
    updated_at  = now();

  -- 6. Restore user_roles
  INSERT INTO public.user_roles (user_id, institution_id, role_name, assigned_at)
  VALUES (v_admin_id, v_inst_id, 'admin', now())
  ON CONFLICT (user_id, institution_id, role_name) DO NOTHING;

  RAISE NOTICE 'Admin user rebuilt: % / Admin@GRC2026!', 'admin@grcnexus.gov.zw';
END $$;

COMMIT;
