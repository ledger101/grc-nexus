-- Migration: 20260522000013_auth_deep_diag.sql
-- REPLACED: original diagnostic used RESET ROLE which stripped supabase_admin from the
-- transaction and prevented the migration from being recorded in supabase_migrations.
-- The diagnostic SQL already ran (results appeared as NOTICE on previous push).
-- This stub is a safe no-op so the migration can be properly tracked.
DO $$ BEGIN RAISE NOTICE '000013 diagnostic stub — no schema changes'; END $$;
