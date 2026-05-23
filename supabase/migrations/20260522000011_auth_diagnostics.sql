-- Migration: 20260522000011_auth_diagnostics.sql
-- Diagnostic: inspect auth schema state and test hook function.
-- Run output appears in `supabase db push` NOTICE lines.

DO $$
DECLARE
  v_user_count   int;
  v_ident_count  int;
  v_profile_count int;
  v_user_row     record;
  v_ident_row    record;
  v_hook_result  jsonb;
BEGIN
  -- Count rows in each relevant table
  SELECT count(*) INTO v_user_count FROM auth.users;
  SELECT count(*) INTO v_ident_count FROM auth.identities;
  SELECT count(*) INTO v_profile_count FROM public.user_profiles;

  RAISE NOTICE 'auth.users rows: %', v_user_count;
  RAISE NOTICE 'auth.identities rows: %', v_ident_count;
  RAISE NOTICE 'public.user_profiles rows: %', v_profile_count;

  -- Inspect admin user row
  SELECT id, email, aud, role,
         email_confirmed_at IS NOT NULL AS confirmed,
         length(encrypted_password) AS pw_hash_len
  INTO v_user_row
  FROM auth.users
  WHERE id = '00000000-0000-0000-0000-000000000001';

  IF v_user_row IS NULL THEN
    RAISE NOTICE 'Admin user NOT FOUND in auth.users';
  ELSE
    RAISE NOTICE 'Admin user: id=% email=% aud=% confirmed=% pw_len=%',
      v_user_row.id, v_user_row.email, v_user_row.aud,
      v_user_row.confirmed, v_user_row.pw_hash_len;
  END IF;

  -- Inspect identities row for admin
  SELECT id, user_id, provider, provider_id
  INTO v_ident_row
  FROM auth.identities
  WHERE user_id = '00000000-0000-0000-0000-000000000001';

  IF v_ident_row IS NULL THEN
    RAISE NOTICE 'Admin identity NOT FOUND in auth.identities';
  ELSE
    RAISE NOTICE 'Admin identity: id=% provider=% provider_id=%',
      v_ident_row.id, v_ident_row.provider, v_ident_row.provider_id;
  END IF;

  -- Test calling custom_access_token_hook with a synthetic event
  BEGIN
    v_hook_result := public.custom_access_token_hook(
      jsonb_build_object(
        'user_id', '00000000-0000-0000-0000-000000000001',
        'claims',  jsonb_build_object(
          'aud', 'authenticated',
          'app_metadata', '{}'::jsonb
        )
      )
    );
    RAISE NOTICE 'Hook function OK — result keys: %', jsonb_object_keys(v_hook_result)::text;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Hook function FAILED: % — %', SQLERRM, SQLSTATE;
  END;

END $$;
