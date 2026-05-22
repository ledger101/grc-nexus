# GRC-Nexus Build Status

**Last updated:** 2026-05-22
**Prototype target:** 4–6 weeks | **Tech stack:** Next.js 14 + Supabase + Vercel

---

## Overall Progress

| Phase | Name | Status | Plans | Tests |
|-------|------|--------|-------|-------|
| 1 | Foundation — Auth, RLS, Audit Trail | ✅ Complete | 1/1 | 28 passing |
| 2 | Strategic Planning & KPIs | 🔲 Pending | — | — |
| 3 | Enterprise Risk Management | 🔲 Pending | — | — |
| 4 | Compliance & Policy Management | 🔲 Pending | — | — |
| 5 | Board Management & Governance | 🔲 Pending | — | — |
| 6 | Internal Audit & Findings | 🔲 Pending | — | — |
| 7 | Incident & Whistleblower | 🔲 Pending | — | — |
| 8 | Executive Dashboard & Reporting | 🔲 Pending | — | — |

---

## Phase 1: Foundation ✅

**Completed:** 2026-05-22 | **Tasks:** 16/16 | **Tests:** 28/28

### What was built

| Milestone | Deliverable |
|-----------|-------------|
| M0: Scaffold | Next.js 14 App Router project, TypeScript, Tailwind with Navy/Gold/Paper tokens, shadcn/ui |
| M1: Database | 6 Supabase migrations: schema (7 tables), RLS policies, SECURITY DEFINER audit triggers, 3-layer audit immutability, JWT custom claims hook, seed data |
| M2: Auth Flow | Login, register (→ pending status), role-select screen, persistent sessions, logout, `/dashboard` |
| M3: MFA System | TOTP enrollment (QR code), custom email OTP via Resend, MFA challenge screen, 30-day device trust, 8 bcrypt-hashed backup codes |
| M4: Admin + Audit | User management table (approve/reject/suspend), role assignment + email notification, filterable audit log viewer with diff expansion + CSV export |

### Key files

- [middleware.ts](middleware.ts) — auth + MFA enforcement on all protected routes
- [supabase/migrations/](supabase/migrations/) — 6 SQL migrations ready to push
- [lib/auth/actions.ts](lib/auth/actions.ts) — signIn, signOut, signUp, selectRole Server Actions
- [lib/auth/mfa-actions.ts](lib/auth/mfa-actions.ts) — TOTP enrollment, email OTP, backup codes
- [app/(auth)/login/](app/(auth)/login/) — login form (Navy/Gold UI per spec)
- [app/(protected)/admin/audit-log/](app/(protected)/admin/audit-log/) — audit log viewer

### ⚠ Manual steps required before first run

1. **Create `.env.local`** from [.env.local.example](.env.local.example) and fill in Supabase credentials
2. **Push migrations:** `npx supabase db push`
3. **Generate types:** `npx supabase gen types typescript --linked > types/supabase.ts`
4. **Enable JWT hook:** Supabase Dashboard → Authentication → Hooks → enable `custom_access_token_hook`
5. **Set env vars:** `RESEND_API_KEY`, `DEVICE_TRUST_SECRET` (32-byte hex)
6. **Demo login:** `admin@grcnexus.gov.zw` / `Admin@GRC2026!`

---

## What's Next — Phase 2: Strategic Planning & KPIs

Requirements: STRAT-01..06
- Strategic objectives linked to NDS2 pillars
- KPI baselines, targets, owners, period readings
- KPI performance status: On Track / At Risk / Off Track
- KPI summary grid with status colors and trend indicators

---

*Updated automatically by gsd-autonomous after each phase completes.*
