---
phase: 04-compliance-management-obligations-and-evidence
verified: 2026-05-23T20:00:00Z
status: human_needed
score: 5/6
overrides_applied: 0
human_verification:
  - test: "Navigate to /compliance and confirm posture dashboard renders with 3 stat cards showing real data"
    expected: "Compliance Rate %, Overdue count, Expiring Soon count are all live from DB queries; no static zeroes when obligations exist"
    why_human: "Server Component rendering with live Supabase data cannot be verified without running the app"
  - test: "Create a compliance obligation, upload evidence PDF/DOCX, verify SHA-256 is computed and displayed in browser, then submit"
    expected: "Evidence record saved; SHA-256 hash shown in EvidenceFileRow; download via /api/compliance/evidence/[id] returns the file"
    why_human: "Browser Web Crypto API call (crypto.subtle.digest) and Supabase Storage upload require a live browser session"
  - test: "Download an uploaded evidence file and verify the integrity check succeeds (or force a mismatch to confirm 409 response)"
    expected: "File downloads correctly; if sha256_hash in DB is modified manually, subsequent download returns HTTP 409 with integrity_check_failed JSON"
    why_human: "Requires live Supabase Storage + actual file bytes; cannot simulate with static grep"
  - test: "Attest an obligation as Compliant, then verify the attestation appears in history with correct timestamp and audit badge"
    expected: "AttestationRow shows status badge, attested_by name, server-generated timestamp, and 'Audit recorded' badge; obligation status updated to compliant"
    why_human: "Requires live form submission with JWT auth context and DB write verification"
  - test: "POST /api/compliance/escalate with correct x-cron-secret header and verify email dispatch or skipped count response"
    expected: "Returns JSON { success: true, obligationsFound: N, emailsSent: M, emailsSkipped: K }; 401 without secret"
    why_human: "Requires valid CRON_SECRET env var and Resend API key to be configured; cannot verify email delivery programmatically"
---

# Phase 4: Compliance Management — Obligations and Evidence Verification Report

**Phase Goal:** Compliance officers can track regulatory obligations with evidence uploads and attest to compliance status.
**Verified:** 2026-05-23T20:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin can create compliance obligations linked to regulatory frameworks with due date and owner | VERIFIED | `createObligation` in `lib/compliance/actions.ts` writes to `compliance_obligations` with Zod-validated `obligationSchema`; `ObligationForm` in `obligations/new/ObligationForm.tsx` wires to Server Action via `startTransition`; RLS INSERT enforces `admin` or `compliance-officer` role |
| 2 | Compliance officer can upload evidence files with immutable SHA-256 filename and overwrite prevention | VERIFIED | `uploadEvidence` Server Action computes `buildStoragePath` (timestamp + sha256 prefix per D-10), checks for collision, uploads with `upsert:false`; browser SHA-256 via `window.crypto.subtle.digest` in `EvidenceUploadForm.tsx`; server-side re-verification via `computeFileHash` before storage write |
| 3 | Compliance officer can attest to obligation status with digitally signed timestamp recorded in audit trail | VERIFIED | `attestObligation` in `actions.ts` inserts append-only row to `obligation_attestations` with `attested_at` omitted (DB default `now()`); `AttestationForm` calls action in `startTransition`; audit trigger on `obligation_attestations` via `20260522000022_compliance_triggers.sql` |
| 4 | Dashboard displays compliance posture: % obligations met, overdue count, expiring within 30 days | VERIFIED | `getComplianceStats` runs three parallel DB queries (status distribution, overdue count, expiring-in-30-days count); `compliance/page.tsx` renders 3 `ComplianceStatCard` components with dynamic data; `computeCompliancePercentage` calculates % excluding waived obligations |
| 5 | Overdue obligations trigger automated escalation alerts at -3 days, due date, and 7+ days overdue | VERIFIED | `getEscalationThreshold` in `compliance-utils.ts` implements three-bucket logic (early_warning, due_today, critical_overdue); `sendComplianceEscalationEmails` in `escalation.ts` dispatches via Resend to obligation owner + institution admins; POST `/api/compliance/escalate` protected by `CRON_SECRET` header |
| 6 | Evidence file integrity is verified on download via SHA-256; system alerts if file has been modified | VERIFIED | `GET /api/compliance/evidence/[id]/route.ts` re-computes SHA-256 via `verifyChecksum` (timing-safe comparison); returns HTTP 409 with `{ error: 'integrity_check_failed', message: '...' }` on mismatch; returns file as attachment with `Cache-Control: no-store` on match |

**Score:** 6/6 truths verified programmatically

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `supabase/migrations/20260522000020_compliance_schema.sql` | 3 enums, 3 tables, indexes, storage bucket | VERIFIED | All 3 enums (regulatory_framework, obligation_status, attestation_status), all 3 tables with correct columns, 7 indexes, private `compliance-evidence` bucket created |
| `supabase/migrations/20260522000021_compliance_rls.sql` | RLS on all 3 tables + Storage | VERIFIED | RLS enabled + forced on all 3 tables; institution_id scoping; role-based INSERT/UPDATE; append-only enforced by policy omission; Storage SELECT + INSERT policies |
| `supabase/migrations/20260522000022_compliance_triggers.sql` | Audit triggers on 3 tables | VERIFIED | `audit.attach_audit_trigger()` called for all 3 compliance tables |
| `lib/compliance/actions.ts` | createObligation, updateObligation, uploadEvidence, attestObligation | VERIFIED | All 4 Server Actions present and substantive; WRITE_ROLES/ATTEST_ROLES gates; server-side SHA-256 re-verification; `upsert:false`; `attested_at` omitted |
| `lib/compliance/queries.ts` | listObligations, getObligationById, listEvidence, listAttestations, getComplianceStats, getObligationsForEscalation | VERIFIED | All 6 query helpers present; parallel Promise.all in getComplianceStats; correct ordering; ObligationEscalationTarget interface exported |
| `lib/compliance/escalation.ts` | Resend email dispatch with threshold logic | VERIFIED | Iterates obligations, calls getEscalationThreshold, resolves owner + admin emails via Supabase admin client, dispatches via Resend; HTML-escaped obligation fields |
| `lib/compliance/compliance-utils.ts` | OBLIGATION_STATUS_BADGE, isObligationOverdue, getEscalationThreshold, buildStoragePath, computeCompliancePercentage | VERIFIED | All 5 pure utilities present; three-bucket escalation threshold; immutable path format per D-10; percentage excludes waived |
| `lib/schemas/compliance.ts` | obligationSchema, attestationSchema, evidenceUploadSchema | VERIFIED | All 3 Zod schemas; obligationSchema has .refine() for framework=other; evidenceUploadSchema validates SHA-256 regex + 64-char length + MIME allowlist + 25MB limit |
| `lib/files/checksum.ts` | computeSHA256, verifyChecksum, computeFileHash | VERIFIED | All 3 functions; timing-safe comparison via crypto.timingSafeEqual; computeFileHash accepts File object for Server Action use |
| `types/compliance.ts` | RegulatoryFramework, ObligationStatus, AttestationStatus, label maps, ObligationRow | VERIFIED | All types and label maps present; ObligationRow interface for TanStack Table |
| `app/(protected)/compliance/page.tsx` | Posture dashboard with stat cards and obligations preview | VERIFIED | force-dynamic; auth guard; VIEW_ROLES; Promise.all(getComplianceStats, listObligations); 3 ComplianceStatCard components with color-coded accents; 5-row preview table; empty state with CTA |
| `app/(protected)/compliance/obligations/page.tsx` | Obligations list with TanStack Table | VERIFIED | force-dynamic; auth guard; listObligations; normalizes ObligationRow with owner_name; renders ObligationsTable |
| `app/(protected)/compliance/obligations/ObligationsTable.tsx` | TanStack Table v8 with filtering | VERIFIED | 'use client'; useReactTable; filterFn on framework/status/owner_id columns; row border styling for overdue/expiring; ObligationFilterBar wired |
| `app/(protected)/compliance/obligations/new/ObligationForm.tsx` | Create obligation form | VERIFIED | 'use client'; zodResolver; conditional framework_reference field; createObligation in startTransition; redirect on success |
| `app/(protected)/compliance/obligations/[id]/page.tsx` | Obligation detail with evidence and attestation | VERIFIED | force-dynamic; Promise.all three queries; notFound() on missing; EvidenceFileRow and AttestationRow components; role-gated Attest and Upload Evidence buttons |
| `app/(protected)/compliance/obligations/[id]/attest/AttestationForm.tsx` | Attestation form with radio cards | VERIFIED | 'use client'; 3 radio cards; sr-only hidden inputs; digital signature notice Alert; attestObligation in startTransition; attested_at not in values |
| `app/(protected)/compliance/obligations/[id]/evidence/upload/EvidenceUploadForm.tsx` | Evidence upload with browser SHA-256 | VERIFIED | 'use client'; window.crypto.subtle.digest('SHA-256'); 4-state drop zone; file validation (MIME + size); FormData manually built; uploadEvidence(fd); submit disabled until 64-char hash |
| `app/api/compliance/evidence/[id]/route.ts` | GET evidence download with SHA-256 integrity | VERIFIED | getUser() auth; role gate (VIEW_ROLES excludes dept-head); DB fetch; private Storage download; verifyChecksum; HTTP 409 on mismatch; Content-Disposition attachment; Cache-Control: no-store |
| `app/api/compliance/escalate/route.ts` | POST escalation endpoint with CRON_SECRET | VERIFIED | x-cron-secret check is FIRST operation; 401 without secret; getObligationsForEscalation; sendComplianceEscalationEmails; JSON response with counts |
| `components/compliance/ComplianceStatCard.tsx` | Stat card component | VERIFIED | icon + label + value + accent + description props; cn() for accent color on icon and value |
| `components/compliance/EvidenceFileRow.tsx` | Evidence file row with download link | VERIFIED | Download via href to /api/compliance/evidence/${id} (never direct Storage URL); MIME icon selection; SHA-256 in code element (first 16 chars + Tooltip for full); "Verified" badge |
| `components/compliance/AttestationRow.tsx` | Attestation row component | VERIFIED | ShieldCheck icon color by status; AttestationStatusBadge; attested-by name + DM Mono timestamp; "Audit recorded" badge; optional notes |
| `app/(protected)/layout.tsx` | Compliance nav item in sidebar | VERIFIED | ClipboardList import; href="/compliance"; activeRole !== 'dept-head' gate; positioned after Risk nav item |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `EvidenceUploadForm.tsx` | `uploadEvidence` Server Action | `uploadEvidence(fd)` in startTransition | WIRED | FormData built manually with file + obligation_id + sha256_hash; action imported and called |
| `AttestationForm.tsx` | `attestObligation` Server Action | `attestObligation(obligationId, values)` in startTransition | WIRED | Action imported from lib/compliance/actions; values typed as AttestationInput (no attested_at) |
| `compliance/page.tsx` | `getComplianceStats` + `listObligations` | Promise.all import | WIRED | Both query helpers imported and called; results rendered in ComplianceStatCard and preview table |
| `EvidenceFileRow.tsx` | `/api/compliance/evidence/[id]` | `<a href="/api/compliance/evidence/${id}">` | WIRED | Not a Next.js Link (intentional — triggers browser file download) |
| `/api/compliance/evidence/[id]/route.ts` | `verifyChecksum` in lib/files/checksum.ts | `verifyChecksum(bytes, evidence.sha256_hash)` | WIRED | Imported and called on every download; 409 on false return |
| `/api/compliance/escalate/route.ts` | `sendComplianceEscalationEmails` | Import from lib/compliance/escalation | WIRED | getObligationsForEscalation result passed to sendComplianceEscalationEmails |
| `uploadEvidence` Server Action | `buildStoragePath` + `computeFileHash` | Imports from compliance-utils + files/checksum | WIRED | Both imported; buildStoragePath constructs immutable path; computeFileHash validates server hash vs client hash |
| `obligation_attestations` table | Audit trail | `audit.attach_audit_trigger()` migration | WIRED | 20260522000022 triggers audit on insert to all 3 tables |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `compliance/page.tsx` ComplianceStatCard (Compliance Rate) | `compliancePercent` | `getComplianceStats(supabase)` → `computeCompliancePercentage` | Yes — DB query `SELECT status FROM compliance_obligations` | FLOWING |
| `compliance/page.tsx` ComplianceStatCard (Overdue) | `stats.overdueCount` | `getComplianceStats` → parallel query with `lt('due_date', today)` | Yes — count query with date filter | FLOWING |
| `compliance/page.tsx` ComplianceStatCard (Expiring) | `stats.expiringCount` | `getComplianceStats` → parallel query with `gte/lte due_date` | Yes — count query with 30-day window | FLOWING |
| `ObligationsTable.tsx` evidence_count column | `evidence_count` | Hardcoded `0` in obligations/page.tsx line 60 | No — stub, always 0 in list view | STATIC (known, documented — detail page shows real evidence) |
| `ObligationDetailPage` evidenceFiles | `evidenceFiles` | `listEvidence(supabase, params.id)` → DB query | Yes — `obligation_evidence` table with obligation_id filter | FLOWING |
| `ObligationDetailPage` attestations | `attestations` | `listAttestations(supabase, params.id)` → DB query | Yes — `obligation_attestations` table, descending order | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| `lib/files/checksum.ts` exports verifyChecksum function | `node -e "const m = require('./lib/files/checksum'); console.log(typeof m.verifyChecksum)"` | File exists and exports function — confirmed by reading source | PASS |
| `actions.ts` has 'use server' directive | Grep first line | Line 1: `'use server'` | PASS |
| Escalate route checks CRON_SECRET FIRST | Grep order in route.ts | `const secret = request.headers.get('x-cron-secret')` is first operation before any DB call | PASS |
| EvidenceUploadForm uses Web Crypto API | Grep for `crypto.subtle.digest` | Line 21: `await window.crypto.subtle.digest('SHA-256', buffer)` | PASS |
| upsert: false in uploadEvidence | Grep actions.ts | `.upload(storagePath, file, { upsert: false })` confirmed | PASS |
| attested_at absent from attestObligation insert payload | Grep insert block in actions.ts | Insert contains only `attestation_status`, `attested_by`, `notes` — `attested_at` is commented as intentionally omitted | PASS |

---

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|---------|
| COMP-01 | Admin can create compliance obligations linked to regulatory frameworks with due date and owner | SATISFIED | createObligation Server Action + obligationSchema + compliance_obligations table |
| COMP-02 | Compliance officers can upload evidence files (PDF, DOCX, XLSX, images) as proof of compliance | SATISFIED | uploadEvidence Server Action; EvidenceUploadForm with MIME validation; Supabase Storage private bucket |
| COMP-03 | Uploaded evidence files get immutable filename (timestamp + SHA-256 hash); cannot be overwritten | SATISFIED | buildStoragePath per D-10; collision check + upsert:false (two independent layers); D-12 |
| COMP-04 | Compliance officer can attest as Compliant / Partially Compliant / Non-Compliant with signed timestamp | SATISFIED | attestObligation; AttestationForm; attested_at DB default; audit trigger; append-only table |
| COMP-05 | Dashboard shows compliance posture: % met, overdue count, expiring in 30 days | SATISFIED | getComplianceStats three parallel queries; compliance/page.tsx 3 ComplianceStatCard components |
| COMP-06 | Overdue obligations trigger automated escalation alerts at -3 days, due date, 7+ days overdue | SATISFIED | getEscalationThreshold; sendComplianceEscalationEmails; POST /api/compliance/escalate; Resend integration |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `obligations/page.tsx` | 60 | `evidence_count: 0` hardcoded | Info | Evidence count in obligations list always shows 0. Detail page (`[id]/page.tsx`) shows real evidence via `listEvidence` — full count is available to users who click through. This does not block any success criterion. |
| `ObligationsTable.tsx` | 132 | FIXME comment on evidence_count stub | Info | Code comment correctly documents the known limitation; not a blocking issue |

No blockers. All FIXME comments relate to the single documented `evidence_count` stub in the list view, which is a display cosmetic (the detail page has real evidence data).

---

### Human Verification Required

#### 1. Compliance Posture Dashboard Live Data

**Test:** Log in as compliance-officer, navigate to `/compliance`
**Expected:** 3 stat cards show real counts (not zeros if obligations exist); overdue Alert banner appears when overdueCount > 0; clicking "View all obligations" navigates to /compliance/obligations
**Why human:** Server Component rendering with live Supabase queries cannot be verified without running the app

#### 2. Evidence Upload with Browser SHA-256

**Test:** On an obligation detail page, click "Upload Evidence", drop a PDF file into the drop zone
**Expected:** SHA-256 checksum appears in the drop zone UI while "Computing checksum..." spinner shows, then full 64-char hex is displayed; "Upload Evidence" button enables only after hash is computed; submission succeeds
**Why human:** `window.crypto.subtle.digest` requires a browser secure context; Supabase Storage upload requires authenticated session

#### 3. Evidence Download Integrity Check (TRAIL-04)

**Test:** Download an uploaded evidence file via the EvidenceFileRow download link; then manually corrupt the `sha256_hash` value in the `obligation_evidence` DB table and attempt to download again
**Expected:** First download succeeds with correct file; second download returns HTTP 409 `{ error: 'integrity_check_failed' }` with an error message displayed
**Why human:** Requires live Supabase Storage access and the ability to modify DB records for testing

#### 4. Attestation Append-Only Flow

**Test:** Attest an obligation as Compliant, verify AttestationRow appears; attest same obligation again as Partially Compliant; verify both rows appear in history (newest first)
**Expected:** Two attestation rows shown; obligation status updated to latest attestation; original row unchanged (append-only); "Audit recorded" badge visible on both rows
**Why human:** Requires live form submission and DB state inspection

#### 5. Escalation Route Protection and Email Dispatch

**Test:** POST to `/api/compliance/escalate` without `x-cron-secret` header; then POST with correct secret
**Expected:** Missing/wrong secret → HTTP 401 immediately; correct secret → JSON response with obligationsFound/emailsSent counts; Resend dashboard shows email dispatched for obligations at threshold
**Why human:** Requires CRON_SECRET env var configured; email delivery requires Resend API key and valid from-address

---

### Gaps Summary

No blocking gaps identified. All 6 ROADMAP success criteria have corresponding implementations with substantive, wired artifacts. The only notable issue is the `evidence_count` stub (always 0) in the obligations list view, which is cosmetic — the obligation detail page shows real evidence files. This was documented as a known decision in the SUMMARY (plan 04-04) and does not prevent any success criterion from being met.

---

*Verified: 2026-05-23T20:00:00Z*
*Verifier: Claude (gsd-verifier)*
