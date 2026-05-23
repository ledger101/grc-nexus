---
phase: 4
slug: compliance-management-obligations-and-evidence
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-23
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) + TypeScript type-check |
| **Config file** | `playwright.config.ts` (existing) |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npx playwright test` |
| **Estimated runtime** | ~30 seconds (tsc) / ~120 seconds (playwright) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npx playwright test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | COMP-01 | T-4-01 | Only compliance_officer/admin can create obligations | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 4-01-02 | 01 | 1 | COMP-01 | T-4-01 | RLS prevents cross-institution reads | migration | `supabase db push` | ✅ | ⬜ pending |
| 4-02-01 | 02 | 2 | COMP-02 | T-4-02 | SHA-256 computed before upload; upsert:false enforced | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 4-02-02 | 02 | 2 | COMP-02 | — | Evidence file not overwritable at same path | manual | N/A | — | ⬜ pending |
| 4-03-01 | 03 | 2 | COMP-03 | T-4-03 | Attestation insert-only; attested_at set server-side | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 4-04-01 | 04 | 3 | COMP-04 | — | Dashboard stat cards show correct posture counts | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 4-05-01 | 05 | 3 | COMP-05 | — | Escalation route returns 200 with correct recipients | manual | N/A | — | ⬜ pending |
| 4-06-01 | 06 | 3 | COMP-06 | T-4-04 | Download route returns 409 on SHA-256 mismatch | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements.

*The project has Playwright + TypeScript already configured. No new framework installs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Evidence file immutability — same path cannot be overwritten | COMP-02 | Requires live Supabase Storage with actual file upload | Upload a file, copy its storage path, attempt to upload a different file to the same path; confirm rejection |
| Escalation email delivery | COMP-05 | Requires live Resend integration and a real due-date trigger | Create an obligation with a past due date, call `/api/compliance/escalate`, verify email arrives at owner address |
| Attestation timestamp in audit trail | COMP-03 | Requires reading Postgres audit log directly | Submit attestation, query `audit.audit_log_entries` for the obligation's UUID, verify `recorded_at` and `actor_id` are correct |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
