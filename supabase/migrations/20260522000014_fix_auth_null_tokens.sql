-- Migration: 20260522000014_fix_auth_null_tokens.sql
-- Fix: GoTrue v2.x (Go) cannot scan NULL into string fields.
-- All token columns in auth.users must be '' (empty string), never NULL.
-- Affects any user row created via raw SQL that omitted these columns.
-- See: https://github.com/supabase/auth/issues/1940

DO $$
DECLARE
  v_rows_fixed int;
BEGIN
  UPDATE auth.users SET
    confirmation_token        = COALESCE(confirmation_token, ''),
    recovery_token            = COALESCE(recovery_token, ''),
    email_change              = COALESCE(email_change, ''),
    email_change_token_new    = COALESCE(email_change_token_new, ''),
    email_change_token_current = COALESCE(email_change_token_current, '')
  WHERE
    confirmation_token IS NULL
    OR recovery_token IS NULL
    OR email_change IS NULL
    OR email_change_token_new IS NULL
    OR email_change_token_current IS NULL;

  GET DIAGNOSTICS v_rows_fixed = ROW_COUNT;
  RAISE NOTICE 'auth.users rows patched (NULL tokens → empty string): %', v_rows_fixed;
END $$;
