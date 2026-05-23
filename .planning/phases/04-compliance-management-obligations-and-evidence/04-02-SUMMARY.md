---
phase: 04-compliance-management-obligations-and-evidence
plan: 02
subsystem: compliance-service-layer
tags: [server-actions, queries, escalation, api-route, cron, file-upload, attestation]
dependency_graph:
  requires:
    - 04-01  # compliance schema, types, Zod schemas, compliance-utils
    - 01-01  # supabase/server, supabase/admin client split
    - 03-01  # lib/risk/actions.ts mirror pattern
  provides:
    - createObligation Server Action with WRITE_ROLES gate
    - updateObligation Server Action with institution_id double-check
    - uploadEvidence Server Action with server-side SHA-256 re-verification and upsert:false
    - attestObligation Server Action with ATTEST_ROLES gate, append-only insert, no attested_at in payload
    - listObligations, getObligationById, listEvidence, listAttestations, getComplianceStats query helpers
    - getObligationsForEscalation query helper for cron use
    - sendComplianceEscalationEmails escalation service
    - POST /api/compliance/escalate route protected by CRON_SECRET
  affects:
    - next.config.mjs  # bodySizeLimit increased to 26mb for 25MB evidence uploads
tech_stack:
  added: []
  patterns:
    - Server Actions with 'use server' directive, Zod safeParse, getWriteContext role gate
    - FormData-based Server Action for file upload (no JSON body)
    - Server-side SHA-256 re-verification via computeFileHash before storing hash
    - Supabase Storage upload with upsert:false (two-layer overwrite prevention)
    - Append-only attestation insert (attested_at omitted — DB default now())
    - Parallel query pattern via Promise.all for dashboard stats
    - CRON_SECRET header guard as first operation in API route (no DB query before auth)
    - Admin email resolution via user_profiles.id → auth.admin.getUserById
key_files:
  created:
    - lib/compliance/actions.ts
    - lib/compliance/queries.ts
    - lib/compliance/escalation.ts
    - app/api/compliance/escalate/route.ts
  modified:
    - next.config.mjs  # added serverActions.bodySizeLimit: '26mb'
decisions:
  - "attested_at is NOT in the attestObligation insert payload — DB default now() is the sole source of truth (D-18, T-4-02-R)"
  - "upsert: false is present in uploadEvidence storage upload call — second layer after application collision check (T-4-02-T2)"
  - "ObligationEscalationTarget interface exported from queries.ts — compliance_obligations not yet in generated supabase types; cast avoids unknown[] type error"
  - "user_profiles uses id (PK) not user_id — user_roles has user_id; fixed in escalation.ts admin email lookup"
  - "bodySizeLimit: 26mb added to next.config.mjs — without it, files over ~1MB fail silently before reaching Server Action (Pitfall 2)"
metrics:
  duration: ~10 minutes
  completed: "2026-05-23"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
---

# Phase 04 Plan 02: Compliance Service Layer — Server Actions, Queries, Escalation Summary

Four Server Actions for obligation CRUD, evidence upload with server-side SHA-256 re-verification, and append-only attestation; six query helpers for all compliance views; a standalone escalation email service; and a CRON_SECRET-protected POST route for pg_cron integration.

## What Was Built

### Task 1: Server Actions (committed `a2bb4ca`)

**`lib/compliance/actions.ts`**
- `'use server'` directive as first line
- `createObligation(values: ObligationInput)` — Zod parse + WRITE_ROLES gate + institution_id + created_by insert
- `updateObligation(obligationId, values: ObligationInput)` — Zod parse + WRITE_ROLES gate + institution_id double-check on update
- `uploadEvidence(formData: FormData)` — WRITE_ROLES gate, file size/MIME validation, server-side `computeFileHash` re-verification, collision check, `upsert: false` storage upload, evidence record insert
- `attestObligation(obligationId, values: AttestationInput)` — ATTEST_ROLES gate (admin/ceo/compliance-officer), append-only attestation insert with `attested_at` intentionally omitted, obligation status update

Security controls implemented per threat model:
- T-4-02-S: JWT role check before any file operation
- T-4-02-T: Server-side `computeFileHash` re-verification; client hash compared but never trusted
- T-4-02-T2: `upsert: false` + application collision check (two independent layers)
- T-4-02-R: `attested_at` absent from insert payload — DB `DEFAULT now()` is authoritative
- T-4-02-E: `ATTEST_ROLES = ['admin', 'ceo', 'compliance-officer']` only

**`next.config.mjs`** (modified — Rule 2 auto-fix)
- Added `serverActions.bodySizeLimit: '26mb'` — required for 25 MB evidence uploads per Pitfall 2

### Task 2: Query Helpers, Escalation Service, API Route (committed `41d9909`)

**`lib/compliance/queries.ts`**
- `listObligations(supabase)` — ordered by due_date ascending, joins owner profile
- `getObligationById(supabase, obligationId)` — full detail with owner and created_by profiles
- `listEvidence(supabase, obligationId)` — ordered by uploaded_at ascending
- `listAttestations(supabase, obligationId)` — ordered by attested_at descending (newest first)
- `getComplianceStats(supabase)` — `Promise.all` for three parallel queries: status distribution, overdue count, expiring-in-30-days count
- `getObligationsForEscalation(supabase)` — obligations due within 3 days (including past-due), excludes compliant/waived
- `ObligationEscalationTarget` interface exported — typed cast since `compliance_obligations` is not yet in generated `types/supabase.ts`

**`lib/compliance/escalation.ts`**
- `sendComplianceEscalationEmails(obligations)` — iterates obligations, calls `getEscalationThreshold` per obligation before sending, skips if null threshold
- Recipients: obligation owner (via auth.admin.getUserById) + institution admins (via `user_profiles.id` — not `user_id`)
- Subject map: early_warning / due_today / critical_overdue per D-26
- Returns `{ sent, skipped }` counts for route response

**`app/api/compliance/escalate/route.ts`**
- POST handler — `x-cron-secret` header check is FIRST operation (T-4-02-D)
- Returns HTTP 401 immediately on mismatch, no DB query executed
- On success: queries obligations, sends emails, returns `{ success, obligationsFound, emailsSent, emailsSkipped }`

---

## Key Decisions Confirmed During Execution

| Decision | Source | Value |
|----------|--------|-------|
| `attested_at` NOT in insert payload | D-18, T-4-02-R | Confirmed — only in comments in `attestObligation` |
| `upsert: false` in storage upload | D-12, T-4-02-T2, Pitfall 3 | Confirmed — `.upload(storagePath, file, { upsert: false })` |
| Admin email lookup via `user_profiles.id` | Verified against types/supabase.ts | `user_profiles` PK is `id`; `user_roles` has `user_id` — two separate tables |
| `ObligationEscalationTarget` exported from queries.ts | TypeScript resolution | `compliance_obligations` not yet in generated types; interface bridges the gap |
| `bodySizeLimit: '26mb'` in next.config.mjs | Pitfall 2 auto-fix | Required for Server Actions to receive files up to 25MB |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Added serverActions.bodySizeLimit to next.config.mjs**
- **Found during:** Task 1 implementation review (Pitfall 2 in RESEARCH.md)
- **Issue:** `next.config.mjs` had no `bodySizeLimit` — Next.js default body limit for Server Actions is ~1MB, silently rejecting files over that size before reaching `uploadEvidence`
- **Fix:** Added `serverActions.bodySizeLimit: '26mb'` (25MB file + overhead)
- **Files modified:** `next.config.mjs`
- **Commit:** `a2bb4ca`

**2. [Rule 1 - Bug] Fixed user_profiles column name in escalation.ts**
- **Found during:** Task 2 TypeScript verification
- **Issue:** Plan template used `.select('user_id')` on `user_profiles` but the actual schema (per `types/supabase.ts`) uses `id` as the primary key; `user_id` is on `user_roles` table
- **Fix:** Changed `.select('user_id')` to `.select('id')` and cast as `{ id: string }` in escalation.ts
- **Files modified:** `lib/compliance/escalation.ts`
- **Commit:** `41d9909`

**3. [Rule 1 - Bug] Resolved TypeScript unknown[] type error for escalation obligations**
- **Found during:** Task 2 TypeScript verification
- **Issue:** `compliance_obligations` is not yet in the generated `types/supabase.ts` (added in Phase 4 migrations); Supabase fell back to `Record<string, unknown>` making all selected columns `unknown`, which is incompatible with `ObligationEscalationTarget[]`
- **Fix:** Exported `ObligationEscalationTarget` interface from `queries.ts` with the correct field types; cast the return value of `getObligationsForEscalation`; `escalation.ts` imports the interface from `queries.ts` instead of re-defining it
- **Files modified:** `lib/compliance/queries.ts`, `lib/compliance/escalation.ts`
- **Commit:** `41d9909`

---

## Known Stubs

None. This plan delivers pure service layer (Server Actions, query helpers, escalation service, API route). No UI components, no data wiring stubs.

---

## Threat Surface Scan

New network endpoint introduced: `POST /api/compliance/escalate`

| Flag | File | Description |
|------|------|-------------|
| New API endpoint | `app/api/compliance/escalate/route.ts` | POST handler callable externally; protected by CRON_SECRET header as first operation. Matches T-4-02-D mitigation in plan threat model. No additional threat beyond what was planned. |

All threat mitigations from plan's STRIDE register implemented as specified:

| Threat ID | Mitigation | Implemented |
|-----------|-----------|-------------|
| T-4-02-S | `getWriteContext(WRITE_ROLES)` before any file operation | Yes — first call in `uploadEvidence` |
| T-4-02-T | `computeFileHash(file)` server-side re-verification | Yes — compared against client hash before storage |
| T-4-02-T2 | `upsert: false` + collision check | Yes — two independent layers |
| T-4-02-R | `attested_at` absent from insert payload | Yes — DB `DEFAULT now()` only |
| T-4-02-D | CRON_SECRET check first in escalate route | Yes — returns 401 before any DB work |
| T-4-02-E | ATTEST_ROLES = ['admin', 'ceo', 'compliance-officer'] | Yes — risk-officer and board-member excluded |

---

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `lib/compliance/actions.ts` | FOUND |
| `lib/compliance/queries.ts` | FOUND |
| `lib/compliance/escalation.ts` | FOUND |
| `app/api/compliance/escalate/route.ts` | FOUND |
| `next.config.mjs` (bodySizeLimit added) | FOUND |
| commit `a2bb4ca` (Server Actions) | FOUND |
| commit `41d9909` (queries + escalation + route) | FOUND |
| `npx tsc --noEmit` | PASSED (0 errors) |
