# GRC-Nexus Build Status

**Last updated:** 2026-05-23
**Prototype target:** 4–6 weeks | **Tech stack:** Next.js 14 + Supabase + Vercel

---

## Overall Progress

| Phase | Name | Status | Plans | Tests |
|-------|------|--------|-------|-------|
| 1 | Foundation — Auth, RLS, Audit Trail | ✅ Complete | 1/1 | 28 passing |
| 2 | Strategic Planning & KPIs | ✅ Complete | 6/6 | 94 passing |
| 3 | Enterprise Risk Management | 🔲 Pending | — | — |
| 4 | Compliance & Policy Management | 🔲 Pending | — | — |
| 5 | Board Management & Governance | 🔲 Pending | — | — |
| 6 | Internal Audit & Findings | 🔲 Pending | — | — |
| 7 | Incident & Whistleblower | 🔲 Pending | — | — |
| 8 | Executive Dashboard & Reporting | 🔲 Pending | — | — |

---

## Phase 2: Strategic Planning & KPIs ✅

**Completed:** 2026-05-23 | **Plans:** 6/6 | **Tests:** 94/94

### What was built

| Wave | Deliverable |
|------|-------------|
| W1: Schema | 3 Supabase migrations — `strategic_objectives`, `kpis`, `kpi_readings` tables with RLS + audit triggers. npm: recharts@^3.8.1, @tanstack/react-table@^8.21.3 |
| W2: Types + Logic | `types/strategic.ts`, `lib/strategic/kpi-utils.ts` (calculateKpiStatus with all edge cases), Zod v3 schemas with numericField() preprocess helper. 39 unit tests. |
| W3: Server Layer | 6 Server Actions (createObjective, updateObjective/Status, createKpi, updateKpi, recordKpiReading) with RBAC + Zod safeParse. Query helpers with PostgREST workaround for latest reading. |
| W4a: Objectives UI | Sidebar nav, objectives list (search + status filter), create form (8 fields + cross-field Zod validation), detail page, edit form. |
| W4b: KPI Dashboard | `strategic/page.tsx` Server Component, TanStack Table v8 grid (7 columns), Recharts sparklines (80×32px, `isAnimationActive=false`), URL-based status + objective filter bar. |
| W5: KPI Forms | KPI create form, KPI detail page with readings history, Record Reading form with ISO period guidance. |

### Key files

- [app/(protected)/strategic/page.tsx](app/(protected)/strategic/page.tsx) — KPI dashboard Server Component
- [app/(protected)/strategic/KpiGrid.tsx](app/(protected)/strategic/KpiGrid.tsx) — TanStack Table v8 grid with status pre-filter
- [app/(protected)/strategic/KpiSparkline.tsx](app/(protected)/strategic/KpiSparkline.tsx) — Recharts mini line chart
- [app/(protected)/strategic/objectives/](app/(protected)/strategic/objectives/) — full objectives CRUD
- [lib/strategic/actions.ts](lib/strategic/actions.ts) — 6 Server Actions
- [lib/strategic/queries.ts](lib/strategic/queries.ts) — getKpisWithReadings, getObjectives, getLatestReading
- [lib/strategic/kpi-utils.ts](lib/strategic/kpi-utils.ts) — calculateKpiStatus, KPI_STATUS_BADGE
- [supabase/migrations/](supabase/migrations/) — migrations 000007–000009

### ⚠ Manual steps required (cumulative — Phase 1 + Phase 2)

1. **Create `.env.local`** from `.env.local.example` template and fill in Supabase credentials
2. **Push migrations:** `npx supabase db push` (runs all 9 migrations)
3. **Generate types:** `npx supabase gen types typescript --linked > types/supabase.ts`
4. **Enable JWT hook:** Supabase Dashboard → Authentication → Hooks → enable `custom_access_token_hook`
5. **Set env vars:** `RESEND_API_KEY`, `DEVICE_TRUST_SECRET` (32-byte hex)
6. **Demo login:** `admin@grcnexus.gov.zw` / `Admin@GRC2026!`

### ⚠ Human UAT pending

- Phase 1: 5 items in `01-HUMAN-UAT.md` (require live Supabase)
- Phase 2: 3 items in `02-HUMAN-UAT.md` (sparkline rendering, status change toast, cross-field validation)

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
- [supabase/migrations/](supabase/migrations/) — 9 SQL migrations ready to push (6 Phase 1 + 3 Phase 2)
- [lib/auth/actions.ts](lib/auth/actions.ts) — signIn, signOut, signUp, selectRole Server Actions
- [lib/auth/mfa-actions.ts](lib/auth/mfa-actions.ts) — TOTP enrollment, email OTP, backup codes
- [app/(auth)/login/](app/(auth)/login/) — login form (Navy/Gold UI per spec)
- [app/(protected)/admin/audit-log/](app/(protected)/admin/audit-log/) — audit log viewer

---

## What's Next — Phase 3: Enterprise Risk Management

Requirements: RISK-01..08
- Risk register per institution (likelihood × impact 5×5 matrix)
- Risk linked to strategic objectives
- Risk heatmap visualization
- Controls and treatment plans
- Risk appetite thresholds

---

*Updated automatically by gsd-autonomous after each phase completes.*
