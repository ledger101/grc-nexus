---
phase: 04-compliance-management-obligations-and-evidence
plan: 03
subsystem: compliance-evidence-download
tags: [route-handler, sha256, integrity-verification, supabase-storage, trail-04]
dependency_graph:
  requires:
    - 04-01  # obligation_evidence table, sha256_hash column, compliance-evidence bucket
    - 04-02  # next.config.mjs bodySizeLimit already added there
    - 01-01  # createClient, supabase/server, auth patterns
  provides:
    - GET /api/compliance/evidence/[id] route handler with auth guard and SHA-256 integrity check
    - 409 response with integrity_check_failed on tampered file (TRAIL-04)
    - Streamed attachment response on verified download
  affects:
    - app/api/compliance/evidence/[id]/route.ts  # new file
tech_stack:
  added: []
  patterns:
    - Route Handler auth pattern (getUser() never getSession()) mirrored from app/api/audit/export/route.ts
    - verifyChecksum from lib/files/checksum.ts — timing-safe SHA-256 comparison
    - Private Supabase Storage download via authenticated supabase client (never direct URL)
    - Response.json() for 409 machine-readable error body
    - Cache-Control: no-store on all download responses
key_files:
  created:
    - app/api/compliance/evidence/[id]/route.ts
  modified: []
decisions:
  - "EvidenceRecord interface cast used inline — obligation_evidence not yet in generated types/supabase.ts (same pattern as ObligationEscalationTarget in 04-02)"
  - "VIEW_ROLES excludes dept-head — confirmed from D-32 role matrix (board-member can view evidence; dept-head cannot)"
  - "next.config.mjs Task 2 was already completed in plan 04-02 (commit a2bb4ca) — no change needed; documented as pre-existing"
  - "verifyChecksum imported from lib/files/checksum.ts — not re-implemented; uses crypto.timingSafeEqual internally"
metrics:
  duration: ~5 minutes
  completed: "2026-05-23"
  tasks_completed: 2
  files_created: 1
  files_modified: 0
---

# Phase 04 Plan 03: Evidence Download Route with SHA-256 Integrity Verification Summary

GET Route Handler at `/api/compliance/evidence/[id]` that authenticates users, enforces role-based access, downloads files from private Supabase Storage, re-computes SHA-256 on every download, returns HTTP 409 on hash mismatch, and streams the verified file as an attachment. `next.config.mjs` `bodySizeLimit: '26mb'` was already present from plan 04-02.

## What Was Built

### Task 1: Evidence Download Route (committed `409631d`)

**`app/api/compliance/evidence/[id]/route.ts`** — new file

Six-step GET handler implementing TRAIL-04 (evidence file integrity verification on every download):

1. **Auth gate** — `supabase.auth.getUser()` validates JWT on every request; returns 401 for unauthenticated callers
2. **Role gate** — `VIEW_ROLES` check (`admin`, `ceo`, `compliance-officer`, `risk-officer`, `audit-officer`, `board-member`); `dept-head` excluded per D-32; returns 403 for unauthorized roles
3. **DB fetch** — `supabase.from('obligation_evidence').select(...).eq('id', params.id).single()` returns the `storage_path`, `sha256_hash`, `original_filename`, `mime_type` for the requested evidence record; RLS enforces `institution_id` scoping automatically; returns 404 if not found
4. **Storage download** — `supabase.storage.from('compliance-evidence').download(evidence.storage_path)` fetches from the private bucket via the authenticated supabase client; never exposes direct storage URLs (D-31); returns 500 on storage error with logged message
5. **SHA-256 re-verification** — `verifyChecksum(bytes, evidence.sha256_hash)` from `lib/files/checksum.ts` re-computes hash and uses `crypto.timingSafeEqual` for comparison; returns HTTP 409 with `{ error: 'integrity_check_failed', message: '...' }` JSON on mismatch (D-30)
6. **Streamed response** — `new Response(bytes, { headers: { Content-Disposition, Cache-Control: no-store, ... } })` on verified match (D-31); `Cache-Control: no-store, no-cache, must-revalidate` prevents CDN/browser caching (T-4-03-I3)

Security mitigations implemented per threat model:
- T-4-03-S: `getUser()` on every request — not `getSession()`
- T-4-03-T: SHA-256 re-computed on every download via `verifyChecksum`; 409 on mismatch (TRAIL-04)
- T-4-03-I: RLS on `obligation_evidence` enforces institution_id scoping — supabase client inherits user's JWT context
- T-4-03-I2: Private bucket — no public URLs; all downloads proxied through this route
- T-4-03-I3: `Cache-Control: no-store` on all responses

### Task 2: next.config.mjs bodySizeLimit

**Pre-existing — no change needed.**

`bodySizeLimit: '26mb'` was already added to `next.config.mjs` in plan 04-02 (commit `a2bb4ca`) as a Rule 2 auto-fix when implementing `uploadEvidence`. The current state:

```javascript
serverActions: {
  allowedOrigins: ['localhost:3000'],
  bodySizeLimit: '26mb', // 25MB evidence file + overhead (D-14, Pitfall 2)
}
```

Both `allowedOrigins` and `bodySizeLimit` are present and correct. `transpilePackages: ['sonner']` is also preserved. No action taken.

---

## Key Decisions Confirmed During Execution

| Decision | Source | Value |
|----------|--------|-------|
| EvidenceRecord interface cast | TypeScript error TS2345 | `obligation_evidence` not in generated `types/supabase.ts`; inline interface cast same pattern as `ObligationEscalationTarget` in 04-02 |
| VIEW_ROLES excludes dept-head | D-32 role matrix | `board-member` can view evidence; `dept-head` cannot — confirmed from context |
| verifyChecksum not re-implemented | `lib/files/checksum.ts` | Imported directly; uses `crypto.timingSafeEqual` internally (RESEARCH.md: "Don't Hand-Roll") |
| next.config.mjs Task 2 already done | 04-02 SUMMARY | `a2bb4ca` added `bodySizeLimit: '26mb'` as part of `uploadEvidence` implementation |

---

## Deviations from Plan

### Pre-existing Completion

**1. [Pre-existing] Task 2 (next.config.mjs bodySizeLimit) already completed by plan 04-02**
- **Status:** No action taken — requirement already satisfied
- **Evidence:** `next.config.mjs` contains `bodySizeLimit: '26mb'` alongside `allowedOrigins: ['localhost:3000']`; added in commit `a2bb4ca` by plan 04-02 as a Rule 2 auto-fix (missing critical functionality for 25MB evidence uploads)
- **Impact:** None — plan 04-03 Task 2 acceptance criteria are fully met by the existing config

### Auto-fixed Issues

**1. [Rule 1 - Bug] EvidenceRecord interface cast for TypeScript compatibility**
- **Found during:** Task 1 TypeScript verification (`npx tsc --noEmit`)
- **Issue:** Supabase query on `obligation_evidence` (Phase 4 migration table, not yet in `types/supabase.ts`) returned `unknown` typed columns, causing TS2345 on `evidence.storage_path`, `evidence.sha256_hash`, and TS2322 on `Content-Type` header
- **Fix:** Defined inline `EvidenceRecord` interface and cast `evidenceRaw as EvidenceRecord | null` — same pattern as `ObligationEscalationTarget` used in 04-02
- **Files modified:** `app/api/compliance/evidence/[id]/route.ts`
- **Commit:** `409631d`

---

## Known Stubs

None. This plan delivers a complete, functional Route Handler. No UI components, no placeholder data, no stubbed responses.

---

## Threat Surface Scan

New network endpoint introduced: `GET /api/compliance/evidence/[id]`

| Flag | File | Description |
|------|------|-------------|
| New API endpoint | `app/api/compliance/evidence/[id]/route.ts` | GET handler that serves private file bytes; protected by auth gate (401), role gate (403), and SHA-256 integrity check (409). All mitigations from T-4-03 threat register implemented. |

All STRIDE threat register mitigations from plan 04-03 are implemented as specified:

| Threat ID | Mitigation | Implemented |
|-----------|-----------|-------------|
| T-4-03-S | `supabase.auth.getUser()` on every request | Yes — Step 1 |
| T-4-03-T | `verifyChecksum(bytes, evidence.sha256_hash)` re-computed on every download; 409 on mismatch | Yes — Step 5 |
| T-4-03-I | RLS on `obligation_evidence` with institution_id scoping | Yes — supabase client inherits JWT context |
| T-4-03-I2 | Private bucket; all downloads via this route only | Yes — never exposes storage URL |
| T-4-03-I3 | `Cache-Control: no-store, no-cache, must-revalidate` | Yes — all responses |

---

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `app/api/compliance/evidence/[id]/route.ts` | FOUND |
| `verifyChecksum` imported from `lib/files/checksum.ts` | FOUND |
| `integrity_check_failed` in 409 JSON body | FOUND |
| `compliance-evidence` in `.download()` call | FOUND |
| `getUser()` used (not `getSession()`) | FOUND |
| `no-store` in Cache-Control header | FOUND |
| `status: 409` on integrity failure | FOUND |
| VIEW_ROLES does NOT contain `dept-head` | CONFIRMED |
| `next.config.mjs` contains `bodySizeLimit: '26mb'` | FOUND (pre-existing from 04-02) |
| `next.config.mjs` contains `allowedOrigins: ['localhost:3000']` | FOUND (preserved) |
| `npx tsc --noEmit` | PASSED (0 errors) |
| commit `409631d` (evidence download route) | FOUND |
