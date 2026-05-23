# Phase 4: Compliance Management — Obligations and Evidence - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 delivers the full Compliance Management module for GRC-Nexus: compliance officers can create and track regulatory obligations (PECOGA, PPDPA, NDS2, etc.), upload evidence files with SHA-256 integrity protection, attest to compliance status with signed timestamps, and view a live compliance posture dashboard. Overdue obligations trigger escalation alerts.

This phase includes:
- Compliance obligations CRUD with framework tagging, due dates, and owner assignment
- Evidence upload with Supabase Storage, immutable filenames (timestamp + SHA-256 hash), and overwrite prevention
- Obligation attestation with Compliant / Partially Compliant / Non-Compliant status and audit trail entry
- Compliance posture dashboard (% met, overdue count, expiring within 30 days)
- Automated escalation alerts at -3 days, on due date, and +7 days overdue (Resend email)
- SHA-256 integrity verification on evidence download with mismatch alert

This phase excludes:
- Cross-institution compliance benchmarking (Phase 8)
- Automated regulation ingestion or API feeds
- Obligation approval workflows or multi-stage review chains
- Bulk obligation import via CSV
- Statutory report generation (Phase 8)

</domain>

<decisions>
## Implementation Decisions

### Regulatory Framework Taxonomy

- **D-01:** Regulatory frameworks stored as a Postgres enum `regulatory_framework`: `pecoga`, `ppdpa`, `nds2`, `iso_37000`, `king_iv`, `ipsas`, `pfma`, `other`. This covers Zimbabwe's primary governance frameworks plus international standards.
- **D-02:** When `other` is selected, a free-text `framework_reference` field captures the specific regulation name — keeps the enum clean without losing flexibility.
- **D-03:** Each obligation belongs to exactly one framework — no multi-tagging in Phase 4 (v2 extension).

### Compliance Obligation Data Model

- **D-04:** `compliance_obligations` table columns: `id uuid`, `institution_id uuid`, `framework regulatory_framework`, `framework_reference text nullable`, `title text`, `description text nullable`, `owner_id uuid` (references `auth.users`), `due_date date`, `status obligation_status`, `created_by uuid`, `created_at timestamptz`, `updated_at timestamptz`.
- **D-05:** `obligation_status` enum: `pending`, `compliant`, `partially_compliant`, `non_compliant`, `overdue`, `waived`.
- **D-06:** Obligations are institution-scoped; `institution_id` carries the same RLS pattern as all prior phases.
- **D-07:** Indexes: by institution/framework/owner/status/due_date — supports dashboard filters and overdue queries.
- **D-08:** Migration numbering starts at `20260522000016_compliance_schema.sql`.

### Evidence File Storage

- **D-09:** Evidence files stored in Supabase Storage bucket `compliance-evidence` with RLS policy scoped to `institution_id`.
- **D-10:** Immutable filename format: `{institution_id}/{obligation_id}/{timestamp_epoch}_{sha256_first16}.{ext}` — timestamp prevents collisions; SHA-256 prefix makes tampering visible from the filename alone.
- **D-11:** `obligation_evidence` table columns: `id uuid`, `institution_id uuid`, `obligation_id uuid`, `storage_path text` (full Supabase Storage path), `original_filename text`, `mime_type text`, `file_size_bytes bigint`, `sha256_hash text` (full 64-char hex), `uploaded_by uuid`, `uploaded_at timestamptz`.
- **D-12:** Overwrite prevention: Server Action checks if a file at the computed storage path already exists before uploading — if it does, returns error "Evidence file already exists; upload a new version."
- **D-13:** Allowed MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.*` (DOCX/XLSX), `application/msword`, `image/jpeg`, `image/png`. Validated in Zod schema before upload.
- **D-14:** Max file size: 25 MB per file (validated client-side and in Server Action).
- **D-15:** SHA-256 computed in the browser using Web Crypto API (`crypto.subtle.digest`) before upload; stored in `obligation_evidence`. Re-computed on download for integrity verification.

### Attestation Model

- **D-16:** `obligation_attestations` table columns: `id uuid`, `institution_id uuid`, `obligation_id uuid`, `attestation_status attestation_status`, `attested_by uuid`, `attested_at timestamptz`, `notes text nullable`.
- **D-17:** `attestation_status` enum: `compliant`, `partially_compliant`, `non_compliant`.
- **D-18:** "Digitally signed" means: attestation row records `attested_by` (user UUID from JWT), `attested_at` (server-side `now()`), and triggers an audit trail entry via `audit.attach_audit_trigger()` — full chain of custody without PKI complexity.
- **D-19:** A new attestation always inserts a new row (append-only history); the obligation's `status` column is updated to match the latest attestation status.
- **D-20:** Only `compliance_officer`, `admin`, and `ceo` roles may attest; enforced in Server Action via `active_role` JWT claims.

### Compliance Posture Dashboard

- **D-21:** Dashboard route: `app/(protected)/compliance/page.tsx` — server component that runs three queries:
  1. Status distribution (count by `obligation_status`)
  2. Overdue count (obligations past `due_date` with status not `compliant` or `waived`)
  3. Expiring within 30 days (due_date BETWEEN today AND today + 30 days, status not `compliant`)
- **D-22:** Dashboard layout: 3-stat row (% obligations compliant, # overdue, # expiring soon) + obligations list table below.
- **D-23:** Stat cards use existing `components/ui/card.tsx` with `ok`/`err`/`warn` color tokens matching Phase 2/3 badge conventions.
- **D-24:** Obligations list uses TanStack Table v8 with client-side filtering by framework, status, and owner — same pattern as Phase 3 risk register.

### Escalation Alert Logic

- **D-25:** Escalation is triggered via a cron-style Server Action route `app/api/compliance/escalate/route.ts` that can be called by a Supabase CRON job (pg_cron) or external scheduler.
- **D-26:** Escalation thresholds: 3 days before due (early warning), 0 days (due today), 7+ days overdue (critical overdue).
- **D-27:** Alert email sent via Resend using the pattern established in Phase 3 treatment escalation — `lib/compliance/escalation.ts` mirrors `lib/risk/escalation.ts`.
- **D-28:** Recipients: obligation `owner_id` email + institution admin emails (queried from `user_profiles`).

### Evidence Integrity Verification on Download

- **D-29:** Download route `app/api/compliance/evidence/[id]/route.ts` fetches file from Supabase Storage, computes SHA-256 of received bytes, compares to stored `sha256_hash`.
- **D-30:** On mismatch: returns HTTP 409 with JSON `{ "error": "integrity_check_failed", "message": "File checksum mismatch — evidence may have been modified." }`.
- **D-31:** On match: returns file as streamed response with `Content-Disposition: attachment; filename="{original_filename}"`.

### RBAC Summary

- **D-32:** Role-to-action matrix:
  | Action | admin | ceo | compliance_officer | risk_officer | audit_officer | board_member | dept_head |
  |--------|-------|-----|--------------------|--------------|---------------|--------------|-----------|
  | Create obligation | Yes | No | Yes | No | No | No | No |
  | Edit obligation | Yes | No | Yes | No | No | No | No |
  | Upload evidence | Yes | No | Yes | No | No | No | No |
  | Attest obligation | Yes | Yes | Yes | No | No | No | No |
  | View compliance dashboard | Yes | Yes | Yes | Yes | Yes | Yes | No |
  | View evidence files | Yes | Yes | Yes | Yes | Yes | No | No |

### Row-Level Security

- **D-33:** All three new tables (`compliance_obligations`, `obligation_evidence`, `obligation_attestations`) use `institution_id = (select public.institution_id())` RLS — identical to Phase 3 pattern.
- **D-34:** Audit triggers attached using `audit.attach_audit_trigger()` on all three tables.
- **D-35:** Supabase Storage RLS policy on `compliance-evidence` bucket: SELECT/INSERT scoped to `institution_id` via the storage path prefix check.

### Routing & Navigation

- **D-36:** Route structure under `app/(protected)/compliance/`:
  - `/compliance` — Compliance posture dashboard
  - `/compliance/obligations` — Obligations list (TanStack Table)
  - `/compliance/obligations/new` — Create obligation form
  - `/compliance/obligations/[id]` — Obligation detail + evidence list + attestation history
  - `/compliance/obligations/[id]/attest` — Attestation form
  - `/compliance/obligations/[id]/evidence/upload` — Evidence upload form
- **D-37:** Navigation item "Compliance" added to protected sidebar (visible to roles with view access).

### Server Actions & Validation

- **D-38:** Server Actions in `lib/compliance/actions.ts` — mirrors `lib/risk/actions.ts` pattern.
- **D-39:** Zod v3 schemas in `lib/schemas/compliance.ts` — `z.coerce` for numeric inputs, regex for date fields, mime-type enum for file type validation.
- **D-40:** File upload Server Action uses `FormData` with `File` object — SHA-256 computed client-side before form submission and included as a hidden field; server re-validates.

### Claude's Discretion

- Exact form field ordering and placeholder copy
- Loading skeleton design for obligation table and dashboard stats
- Empty state design when no obligations have been created
- Exact Supabase Storage bucket configuration (public vs private — use private with signed URLs)
- Migration timestamp selection within `20260522000016` sequence
- Specific TanStack Table column ordering details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Planning Inputs

- `.planning/ROADMAP.md` — Phase 4 goal, dependencies, success criteria (COMP-01 through COMP-06)
- `.planning/REQUIREMENTS.md` — COMP-01 through COMP-06 requirement definitions

### Prior-Phase Patterns to Reuse

- `.planning/phases/01-foundation-authentication-rls-and-audit-trail/01-CONTEXT.md` — Auth, RLS, audit pattern baseline
- `.planning/phases/01-foundation-authentication-rls-and-audit-trail/01-SUMMARY.md` — Implemented baseline; migration conventions
- `.planning/phases/02-strategic-planning-objectives-and-kpis/02-CONTEXT.md` — Server action, Zod, routing conventions
- `.planning/phases/03-enterprise-risk-management-risk-register-and-heatmap/03-CONTEXT.md` — Phase 3 decisions (enums, TanStack Table, escalation pattern with Resend)

### Existing Code References

- `lib/auth/actions.ts` — Server action pattern (role checks via JWT claims)
- `lib/risk/actions.ts` — Reference for domain action structure; mirror for `lib/compliance/actions.ts`
- `lib/supabase/server.ts` and `lib/supabase/client.ts` — Supabase client split
- `app/(protected)/admin/audit-log/AuditLogTable.tsx` — TanStack Table reference
- `supabase/migrations/20260522000011_risk_schema.sql` — Schema/RLS/trigger migration pattern
- `tailwind.config.ts` — Color tokens: `ok`, `warn`, `err`, `paper-border`, `navy-950`, `gold`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `components/ui/badge.tsx` — Status badge; use for Compliant (ok) / Partially Compliant (warn) / Non-Compliant (err) / Pending (paper-border) / Overdue (err)
- `components/ui/card.tsx` — Stat cards on compliance posture dashboard
- `components/ui/table.tsx` + `components/ui/pagination.tsx` — TanStack Table shell
- `components/ui/form.tsx` + `components/ui/input.tsx` — Form stack with react-hook-form
- `components/ui/select.tsx` — Framework selector, status filter
- `components/ui/dialog.tsx` — Confirmation dialogs (delete evidence, waive obligation)
- `lib/risk/actions.ts` — Mirror pattern for `lib/compliance/actions.ts`

### Established Patterns

- **Server Components default** — Pages are async Server Components; Client Components only for interactive TanStack Table, file upload preview, SHA-256 computation
- **Server Actions in `lib/`** with `'use server'`, Zod parse, Supabase call, typed return
- **JWT role check** via `user.app_metadata.active_role` — no DB round-trip for auth
- **Supabase client split** — server client in Server Components/Actions, browser client in Client Components
- **RLS via SQL helpers** `public.institution_id()` and `public.active_role()` — established in Phase 1
- **Audit triggers** via `audit.attach_audit_trigger()` — call in migration for each new table
- **`export const dynamic = 'force-dynamic'`** on all protected pages with live data
- **Resend escalation pattern** from Phase 3 `lib/risk/` — mirror for compliance

### Integration Points

- `app/(protected)/layout.tsx` — Add "Compliance" nav item
- `supabase/migrations/` — Append at `20260522000016_*` sequence
- `types/supabase.ts` — Add types for new tables
- `middleware.ts` — No changes needed; `/(protected)` already guarded

</code_context>

<specifics>
## Specific Ideas

- SHA-256 computed in the browser using Web Crypto API (`crypto.subtle.digest('SHA-256', buffer)`) — no external hash library needed
- Immutable filename construction prevents evidence overwriting at the storage layer (deterministic path from timestamp + hash prefix)
- Attestation history is append-only (never update, never delete) — supports regulatory audit trail requirements
- Dashboard "expiring within 30 days" query uses `BETWEEN NOW()::date AND (NOW() + INTERVAL '30 days')::date` in Supabase query
- Evidence download via API route (not direct Supabase Storage URL) enables integrity check before serving file to browser
- `regulatory_framework` enum includes `other` with free-text fallback — avoids rigid taxonomy while still supporting type-safe filtering

</specifics>

<deferred>
## Deferred Ideas

- Multi-framework tagging per obligation (v2 extension)
- Obligation approval workflow (draft → review → active)
- Bulk obligation import via CSV
- Automated regulation change feed / API ingestion
- Cross-institution compliance benchmarking (Phase 8)
- Statutory compliance report generation (Phase 8)
- Configurable escalation thresholds per institution
- Digital signature via PKI / hardware token (Phase 4 uses DB-level signed timestamp instead)

</deferred>

---

*Phase: 04-compliance-management-obligations-and-evidence*
*Context gathered: 2026-05-23*
