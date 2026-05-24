-- Migration: 20260524000008_fix_all_module_fk_to_user_profiles.sql
-- Problem: All module tables have user-linking columns pointing to auth.users(id).
--   PostgREST resolves user_profiles!<col>() joins by following the FK — when the FK
--   targets auth.users, it cannot find the relationship and throws PGRST200.
-- Fix: Re-point every FK used in a user_profiles!* query join to user_profiles(id).
--   user_profiles.id is a 1-to-1 FK to auth.users.id, so referential integrity and
--   ON DELETE semantics are fully preserved.

BEGIN;

-- ── strategic_objectives ───────────────────────────────────────────────────────
ALTER TABLE public.strategic_objectives
  DROP CONSTRAINT IF EXISTS strategic_objectives_owner_id_fkey,
  DROP CONSTRAINT IF EXISTS strategic_objectives_created_by_fkey;

ALTER TABLE public.strategic_objectives
  ADD CONSTRAINT strategic_objectives_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT strategic_objectives_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ── kpis ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.kpis
  DROP CONSTRAINT IF EXISTS kpis_owner_id_fkey,
  DROP CONSTRAINT IF EXISTS kpis_created_by_fkey;

ALTER TABLE public.kpis
  ADD CONSTRAINT kpis_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT kpis_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ── kpi_readings ───────────────────────────────────────────────────────────────
ALTER TABLE public.kpi_readings
  DROP CONSTRAINT IF EXISTS kpi_readings_recorded_by_fkey;

ALTER TABLE public.kpi_readings
  ADD CONSTRAINT kpi_readings_recorded_by_fkey
    FOREIGN KEY (recorded_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ── risks ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.risks
  DROP CONSTRAINT IF EXISTS risks_owner_id_fkey,
  DROP CONSTRAINT IF EXISTS risks_created_by_fkey;

ALTER TABLE public.risks
  ADD CONSTRAINT risks_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT risks_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ── risk_treatments ────────────────────────────────────────────────────────────
ALTER TABLE public.risk_treatments
  DROP CONSTRAINT IF EXISTS risk_treatments_owner_id_fkey,
  DROP CONSTRAINT IF EXISTS risk_treatments_created_by_fkey;

ALTER TABLE public.risk_treatments
  ADD CONSTRAINT risk_treatments_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT risk_treatments_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ── compliance_obligations ─────────────────────────────────────────────────────
ALTER TABLE public.compliance_obligations
  DROP CONSTRAINT IF EXISTS compliance_obligations_owner_id_fkey,
  DROP CONSTRAINT IF EXISTS compliance_obligations_created_by_fkey;

ALTER TABLE public.compliance_obligations
  ADD CONSTRAINT compliance_obligations_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT compliance_obligations_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ── obligation_evidence ────────────────────────────────────────────────────────
ALTER TABLE public.obligation_evidence
  DROP CONSTRAINT IF EXISTS obligation_evidence_uploaded_by_fkey;

ALTER TABLE public.obligation_evidence
  ADD CONSTRAINT obligation_evidence_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ── obligation_attestations ────────────────────────────────────────────────────
-- attested_by is NOT NULL + RESTRICT — preserve semantics, change target table
ALTER TABLE public.obligation_attestations
  DROP CONSTRAINT IF EXISTS obligation_attestations_attested_by_fkey;

ALTER TABLE public.obligation_attestations
  ADD CONSTRAINT obligation_attestations_attested_by_fkey
    FOREIGN KEY (attested_by) REFERENCES public.user_profiles(id) ON DELETE RESTRICT;

-- ── audit_findings ─────────────────────────────────────────────────────────────
ALTER TABLE public.audit_findings
  DROP CONSTRAINT IF EXISTS audit_findings_remediation_owner_id_fkey,
  DROP CONSTRAINT IF EXISTS audit_findings_created_by_fkey;

ALTER TABLE public.audit_findings
  ADD CONSTRAINT audit_findings_remediation_owner_id_fkey
    FOREIGN KEY (remediation_owner_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT audit_findings_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ── audit_finding_evidence ─────────────────────────────────────────────────────
ALTER TABLE public.audit_finding_evidence
  DROP CONSTRAINT IF EXISTS audit_finding_evidence_uploaded_by_fkey;

ALTER TABLE public.audit_finding_evidence
  ADD CONSTRAINT audit_finding_evidence_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ── incident_cases ─────────────────────────────────────────────────────────────
ALTER TABLE public.incident_cases
  DROP CONSTRAINT IF EXISTS incident_cases_assigned_investigator_id_fkey,
  DROP CONSTRAINT IF EXISTS incident_cases_reported_by_user_id_fkey;

ALTER TABLE public.incident_cases
  ADD CONSTRAINT incident_cases_assigned_investigator_id_fkey
    FOREIGN KEY (assigned_investigator_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT incident_cases_reported_by_user_id_fkey
    FOREIGN KEY (reported_by_user_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ── incident_case_evidence ─────────────────────────────────────────────────────
ALTER TABLE public.incident_case_evidence
  DROP CONSTRAINT IF EXISTS incident_case_evidence_uploaded_by_fkey;

ALTER TABLE public.incident_case_evidence
  ADD CONSTRAINT incident_case_evidence_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- incident_case_events.actor_id is intentionally left pointing to auth.users —
-- it is a system-level audit trail that must survive user profile deletion.

COMMIT;
