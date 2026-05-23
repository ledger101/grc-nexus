# Phase 7: Incident and Whistleblower Management - Research

**Researched:** 2026-05-23
**Domain:** Confidential incident intake, anonymous reporting, investigator triage, role-segregated visibility, immutable closure workflow
**Confidence:** HIGH

---

## Summary

Phase 7 should follow the proven module structure used in phases 4-6:
- SQL-first migrations split into schema, rls, and triggers
- `lib/<module>/` service layer with actions, queries, escalation, and pure utils
- Protected route group pages for dashboard/list/detail workflows
- CRON_SECRET-protected escalation route
- RLS as primary authorization, app-layer checks as defense in depth

The only materially new constraint is anonymity protection:
- Anonymous reports must not persist reporter identity in business tables
- Anonymous reports must not persist reporter identity in audit-triggered records
- Intake must support both named and anonymous submission without leaking identity to investigators

---

## Existing Patterns To Reuse

### Database and Security
- Migration naming and split from compliance/audit:
  - `*_schema.sql`
  - `*_rls.sql`
  - `*_triggers.sql`
- RLS helper conventions:
  - `(select public.institution_id())`
  - `(select public.active_role())`
- Force RLS on every new table.
- Attach immutable triggers via `audit.attach_audit_trigger()`.

### Service Layer
- Action/query/escalation pattern from:
  - `lib/compliance/actions.ts`
  - `lib/compliance/queries.ts`
  - `lib/compliance/escalation.ts`
  - `app/api/compliance/escalate/route.ts`
- Revalidation fanout pattern and typed action result unions.
- `escapeHtml` for HTML email payload safety.

### UI Layer
- Protected page shape from `app/(protected)/compliance/*` and `app/(protected)/audit/*`.
- Table/filter pattern using TanStack Table.
- Stateless badge + stat-card component patterns.
- Upload form checksum approach from evidence workflows.

---

## Recommended Data Model

### Enums
- `incident_category`: `fraud`, `misconduct`, `safety`, `cyber`, `governance`, `other`
- `incident_status`: `new`, `assigned`, `in_investigation`, `escalated`, `closed`
- `incident_visibility`: `investigator_admin_only`, `oversight_visible`

### Tables
1. `incident_cases`
- Core case record including category, status, severity, summary fields
- `is_anonymous boolean not null default false`
- `reported_by_user_id uuid null` (null for anonymous)
- `reporter_name text null` (null for anonymous)
- `reporter_contact text null` (optional; only if submitter provides)
- `assigned_investigator_id uuid null`
- `resolution_summary text null` (required for closed status)

2. `incident_case_events`
- Append-only timeline for triage and investigation actions
- event type, notes, actor id where allowed
- no identity material copied for anonymous reporter

3. `incident_case_evidence`
- Optional closure/investigation evidence metadata
- immutable filename and sha256 hash

### Storage
- private bucket: `incident-evidence`
- path shape: `{institution_id}/{case_id}/{epoch}_{hash16}.{ext}`

---

## Anonymity and Confidentiality Controls

1. Anonymous intake path
- Use intake API/action mode that does not require authenticated reporter identity.
- When `is_anonymous=true`, do not persist `reported_by_user_id`, `reporter_name`, or derived identity fields.

2. Audit trail protection for anonymous reports
- Ensure anonymous intake writes execute with no user identity in auth context so audit actor fields remain null for that intake event.
- Do not include reporter identity in event payload snapshots for anonymous submissions.

3. Investigator visibility
- RLS SELECT policy for `incident_cases` allows:
  - `admin` and `ceo` (oversight)
  - assigned investigator (`assigned_investigator_id = auth.uid()`)
  - triage authority (`compliance-officer`) where explicitly required
- All other roles denied.

4. Status transition guard
- Enforce allowed transitions:
  - `new -> assigned -> in_investigation -> escalated -> closed`
  - reassignment allowed in `assigned` and `in_investigation`
- Closing requires non-empty `resolution_summary`.

---

## Escalation Model

Mirror existing escalation route/service patterns:
- Endpoint: `POST /api/incidents/escalate`
- Header guard: `x-cron-secret === CRON_SECRET`
- Candidate criteria:
  - open non-closed cases near SLA due date
  - overdue investigations
- Recipients:
  - assigned investigator
  - compliance-officer
  - CEO for escalated/critical overdue

---

## Architectural Responsibility Map

- **DB tier (source of truth):** schema, enums, constraints, RLS, trigger attachments
- **Service tier:** input validation, role checks, transition rules, checksum verification, revalidate paths
- **Route tier:** cron secret enforcement, orchestration wrappers
- **UI tier:** intake, triage, and case detail surfaces; must not expose restricted fields to unauthorized roles

---

## Constraints and Pitfalls

1. Do not rely on nav visibility for authorization; RLS and route/action checks are mandatory.
2. Do not let anonymous mode accidentally persist user identity in fallback fields.
3. Do not permit `closed` status without a narrative resolution summary.
4. Do not allow cross-institution investigator assignment reads/writes.
5. Keep protected pages `dynamic = 'force-dynamic'` to avoid cached confidential output.

---

## Suggested Migration Sequence

- `20260523000026_incident_schema.sql`
- `20260523000027_incident_rls.sql`
- `20260523000028_incident_triggers.sql`

---

## Requirement Mapping Support

- `INCD-01`: intake form supports named or anonymous submission, category, description, optional contact
- `INCD-02`: anonymous path stores no submitter identity in domain tables and audit actor context
- `INCD-03`: RLS restricts case visibility to admins/oversight + assigned investigators/triage role
- `INCD-04`: triage, assignment, reassignment, and status progression workflow
- `INCD-05`: closure requires resolution summary and immutable history entry

---

## Canonical References

- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/research/FEATURES.md`
- `.planning/research/PITFALLS.md`
- `types/auth.ts`
- `lib/compliance/actions.ts`
- `lib/compliance/queries.ts`
- `lib/compliance/escalation.ts`
- `lib/audit/actions.ts`
- `lib/audit/queries.ts`
- `app/api/compliance/escalate/route.ts`
- `app/(protected)/compliance/page.tsx`
- `app/(protected)/audit/page.tsx`
- `supabase/migrations/20260522000023_audit_schema.sql`
- `supabase/migrations/20260522000024_audit_rls.sql`
- `supabase/migrations/20260522000025_audit_triggers.sql`
