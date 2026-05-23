---
phase: 03
slug: enterprise-risk-management-risk-register-and-heatmap
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-23
---

# Phase 03 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- tests/risk/risk-utils.test.ts tests/risk/schemas.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~60-180 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- tests/risk/risk-utils.test.ts tests/risk/schemas.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | RISK-01, RISK-02, RISK-03, RISK-05 | T-03-01-01 | Risk/treatment tables are institution-scoped under RLS | integration | `npx supabase db push ; npx supabase migration list` | ✅ | ⬜ pending |
| 03-01-02 | 01 | 1 | RISK-01, RISK-05 | T-03-01-01 | Policies enforce role and institution predicates | integration | `rg "public.institution_id\(\)|public.active_role\(\)" supabase/migrations/20260522000012_risk_rls.sql` | ✅ | ⬜ pending |
| 03-02-01 | 02 | 2 | RISK-04, RISK-05 | T-03-02-04 | Score/severity/overdue helpers are pure and deterministic | unit | `npm test -- tests/risk/risk-utils.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | RISK-01, RISK-02, RISK-03, RISK-05 | T-03-02-02 | Zod schemas enforce 1..5 bounds and nullable residual fields | unit | `npm test -- tests/risk/schemas.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 2 | RISK-01, RISK-05, RISK-07 | T-03-02-01 | Server actions enforce role gate before DB writes | unit/integration | `npm test -- tests/risk/actions.test.ts -t "role gate|overdue escalation"` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | RISK-01, RISK-02, RISK-03 | T-03-03-01 | Forms only submit valid matrix/risk payloads | integration | `npm test -- tests/risk/ui-risk-forms.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 3 | RISK-05, RISK-07 | T-03-03-03 | Inline status updates exclude manual overdue selection | component | `npm test -- tests/risk/treatment-status-select.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 4 | RISK-08 | T-03-04-01 | Register filtering is client-side UX, not auth boundary | component | `npm test -- tests/risk/register-filtering.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-02 | 04 | 4 | RISK-06 | T-03-04-03 | Heatmap orientation/severity zoning matches contract | component | `npm test -- tests/risk/heatmap.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

- [ ] `tests/risk/risk-utils.test.ts` - score, severity, overdue pure-function coverage
- [ ] `tests/risk/schemas.test.ts` - risk/treatment schema boundary and coercion coverage
- [ ] `tests/risk/actions.test.ts` - role gates and escalation branch behavior
- [ ] `tests/risk/ui-risk-forms.test.ts` - create/edit form behavior coverage
- [ ] `tests/risk/treatment-status-select.test.ts` - inline update and overdue read-only behavior
- [ ] `tests/risk/register-filtering.test.ts` - no-reload filtering behavior
- [ ] `tests/risk/heatmap.test.ts` - 5x5 orientation and severity zone mapping

*Existing infrastructure is already present; no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Email delivery to treatment owner and institution manager proxy (`ceo`) on overdue transition | RISK-07 | External provider + recipient config are environment-dependent | Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL`, mark a treatment overdue, verify message received by owner and a `ceo` user in same institution |
| Protected route auth/role UX redirects | RISK-01, RISK-06, RISK-08 | Redirect flow and browser navigation states are best validated in runtime UI | Attempt access to `/risk`, `/risk/register`, `/risk/heatmap` using disallowed role and unauthenticated session; confirm redirect behavior |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing test references
- [x] No watch-mode flags
- [x] Feedback latency < 180s target per quick run
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
