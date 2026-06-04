-- Migration: 20260524000007_fix_board_fk_to_user_profiles.sql
-- Problem: board_action_items, board_meeting_documents, board_meetings, and
--   board_resolutions all have their user-linking columns (owner_id, uploaded_by,
--   created_by, proposer_id, seconder_id) pointing to auth.users(id).
--   PostgREST resolves the user_profiles!<col>(<fields>) join syntax by following
--   the FK — if the FK points to auth.users, it cannot find the relationship to
--   public.user_profiles and throws PGRST200.
-- Fix: Drop those FK constraints and re-add them pointing to public.user_profiles(id).
--   user_profiles.id is itself a 1-to-1 FK to auth.users.id, so the data remains
--   referentially consistent and the ON DELETE behaviour is preserved.

BEGIN;

-- ── board_action_items ─────────────────────────────────────────────────────────
ALTER TABLE public.board_action_items
  DROP CONSTRAINT IF EXISTS board_action_items_owner_id_fkey,
  DROP CONSTRAINT IF EXISTS board_action_items_created_by_fkey;

ALTER TABLE public.board_action_items
  ADD CONSTRAINT board_action_items_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT board_action_items_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ── board_meeting_documents ────────────────────────────────────────────────────
ALTER TABLE public.board_meeting_documents
  DROP CONSTRAINT IF EXISTS board_meeting_documents_uploaded_by_fkey;

ALTER TABLE public.board_meeting_documents
  ADD CONSTRAINT board_meeting_documents_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ── board_meetings ─────────────────────────────────────────────────────────────
ALTER TABLE public.board_meetings
  DROP CONSTRAINT IF EXISTS board_meetings_created_by_fkey;

ALTER TABLE public.board_meetings
  ADD CONSTRAINT board_meetings_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ── board_resolutions ──────────────────────────────────────────────────────────
ALTER TABLE public.board_resolutions
  DROP CONSTRAINT IF EXISTS board_resolutions_proposer_id_fkey,
  DROP CONSTRAINT IF EXISTS board_resolutions_seconder_id_fkey,
  DROP CONSTRAINT IF EXISTS board_resolutions_created_by_fkey;

ALTER TABLE public.board_resolutions
  ADD CONSTRAINT board_resolutions_proposer_id_fkey
    FOREIGN KEY (proposer_id) REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  ADD CONSTRAINT board_resolutions_seconder_id_fkey
    FOREIGN KEY (seconder_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT board_resolutions_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

COMMIT;
