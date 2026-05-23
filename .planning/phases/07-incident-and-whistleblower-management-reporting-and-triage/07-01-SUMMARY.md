---
phase: 07-incident-and-whistleblower-management-reporting-and-triage
plan: 01
subsystem: database
tags: [supabase, postgres, rls, zod, incidents]
requires: []
provides:
  - Incident domain contracts and validation schemas
  - Incident/evidence schema migration with indexes and references
  - RLS, anonymous constraints, and immutable audit triggers for incident tables
affects: [07-02, 07-03, 07-04, incident-module]
tech-stack:
  added: []
  patterns: [institution-scoped RLS, anonymous checks, immutable audit triggers]
key-files:
  created:
    - types/incidents.ts
    - lib/schemas/incidents.ts
    - lib/incidents/incident-utils.ts
    - supabase/migrations/20260523000026_incident_schema.sql
    - supabase/migrations/20260523000027_incident_rls.sql
    - supabase/migrations/20260523000028_incident_triggers.sql
    - tests/incidents/incident-contracts.test.ts
  modified: []
key-decisions:
  - "Enforced absolute anonymity checks using a Postgres table constraint check on `incident_cases`."
  - "Attached standard immutable audit triggers using the existing `audit.attach_audit_trigger` utility."
patterns-established:
  - "Incident module schema design splits migrations into enums/tables, RLS policies, and triggers."
  - "Validation schemas are defined with Zod and colocated under lib/schemas."
requirements-completed: [INCD-01, INCD-02, INCD-03]
duration: 15min
completed: 2026-05-23
---

# Phase 7 Plan 01: Foundation Contracts and DB Security Summary

**Incident and whistleblower persistence foundation shipped with strict TypeScript/Zod contracts, DB-level anonymity validation, investigator RLS policies, and immutable write auditing.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-23T22:35:00Z
- **Completed:** 2026-05-23T22:50:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Created incident domain types, labels, and transition/SLA helpers for downstream service/UI work.
- Created incident schema migration for cases, events, and evidence with operational indexes.
- Enforced absolute database-level whistleblower safety via a `chk_anonymity_integrity` table constraint.
- Configured RLS policies for investigator access control and enabled immutable trigger auditing on all tables.
- Wrote and passed comprehensive unit tests covering enums, schemas, and transition paths.

## Task Commits
1. **Task 1: Define incident contracts first** - Completed files `types/incidents.ts`, `lib/schemas/incidents.ts`, `lib/incidents/incident-utils.ts` and `tests/incidents/incident-contracts.test.ts`
2. **Task 2: Add incident schema migration** - Completed file `supabase/migrations/20260523000026_incident_schema.sql`
3. **Task 3: Add RLS and trigger migrations** - Completed files `supabase/migrations/20260523000027_incident_rls.sql` and `supabase/migrations/20260523000028_incident_triggers.sql`

## Files Created/Modified
- `types/incidents.ts` - Category/status/visibility types, labels, and interfaces.
- `lib/schemas/incidents.ts` - Zod schemas for intake, triage, closure, and evidence.
- `lib/incidents/incident-utils.ts` - Valid transition checks, SLA calculators, and storage path generator.
- `supabase/migrations/20260523000026_incident_schema.sql` - Incidents schema, enums, indexes, and storage bucket.
- `supabase/migrations/20260523000027_incident_rls.sql` - Anonymity constraint, cases/events/evidence RLS, and storage rules.
- `supabase/migrations/20260523000028_incident_triggers.sql` - Trigger attachments.
- `tests/incidents/incident-contracts.test.ts` - Contract validation tests.

## Decisions Made
- Implemented a database constraint to guarantee that no write can store personal info if `is_anonymous` is true.
- Configured public insert access for incidents to support unauthenticated whistleblower submissions safely.

## Deviations from Plan
None.

## Issues Encountered
None.

## User Setup Required
None.

## Threat Flags
None.

## Self-Check: PASSED
- Verified 7 new/modified files exist.
- Verified TypeScript types compile and all 132 tests pass.
