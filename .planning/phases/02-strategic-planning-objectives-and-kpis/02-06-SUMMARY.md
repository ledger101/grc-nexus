---
phase: "02-strategic-planning-objectives-and-kpis"
plan: "06"
subsystem: "strategic-planning"
tags: [forms, react-hook-form, zod, server-components, rbac, kpi, readings]

dependency_graph:
  requires:
    - "02-02: kpiSchema, kpiReadingSchema, KpiInput, KpiReadingInput from lib/schemas/strategic.ts"
    - "02-02: KpiFrequency, KPI_FREQUENCY_LABELS from types/strategic.ts"
    - "02-03: createKpi, recordKpiReading Server Actions from lib/strategic/actions.ts"
    - "02-02: calculateKpiStatus, KPI_STATUS_BADGE from lib/strategic/kpi-utils.ts"
    - "02-03: getLatestReading from lib/strategic/queries.ts"
    - "02-01: strategic_objectives, kpis, kpi_readings DB tables"
    - "01-01: createClient() from lib/supabase/server.ts"
  provides:
    - "app/(protected)/strategic/kpis/new/page.tsx: Server Component with role gate + objective/owner fetch"
    - "app/(protected)/strategic/kpis/new/KpiForm.tsx: react-hook-form KPI creation form"
    - "app/(protected)/strategic/kpis/[id]/page.tsx: KPI detail with status badge + readings history"
    - "app/(protected)/strategic/kpis/[id]/readings/new/page.tsx: Server Component with canRecord check"
    - "app/(protected)/strategic/kpis/[id]/readings/new/ReadingForm.tsx: reading entry form with period helper"
  affects:
    - "All authenticated users: /strategic/kpis/new, /strategic/kpis/[id], /strategic/kpis/[id]/readings/new routes now functional"
    - "KPI dashboard (02-05): /strategic/kpis/[id] links from KPI grid title column"

tech-stack:
  added: []
  patterns:
    - "KpiForm: {..field} spread on type=number inputs; numericField() in kpiSchema handles coercion (no manual Number() conversion in form)"
    - "KPI detail: calculateKpiStatus + KPI_STATUS_BADGE for on-the-fly status display (not stored)"
    - "ReadingForm: PERIOD_HELPER Record<KpiFrequency, string> for ISO-period format guidance per D-12"
    - "canRecord check: activeRole === 'admin' || kpi.owner_id === user.id — consistent with recordKpiReading Server Action"
    - "Inline error div for unauthorized on readings/new/page.tsx (not redirect) per plan spec"

key-files:
  created:
    - "app/(protected)/strategic/kpis/new/page.tsx"
    - "app/(protected)/strategic/kpis/new/KpiForm.tsx"
    - "app/(protected)/strategic/kpis/[id]/page.tsx"
    - "app/(protected)/strategic/kpis/[id]/readings/new/page.tsx"
    - "app/(protected)/strategic/kpis/[id]/readings/new/ReadingForm.tsx"
  modified: []

key-decisions:
  - "KpiForm baseline_value and target_value use {..field} spread with type=number — Zod's numericField() preprocess helper (from 02-02) rejects empty strings before z.coerce.number() converts the value; no manual conversion in form component"
  - "PERIOD_HELPER is a module-level Record<KpiFrequency, string> constant — used both for placeholder and help text below the field (per D-12)"
  - "canRecord on readings/new/page.tsx mirrors Server Action logic: admin bypass OR exact owner_id match"
  - "KPI detail redirects to /strategic (dashboard) if KPI not found — not /strategic/kpis which has no list page"
  - "Readings history sorted descending by recorded_at (most recent first) via Supabase .order('recorded_at', { ascending: false })"

requirements-completed: [STRAT-03, STRAT-04]

duration: "12m"
completed: "2026-05-23"
---

# Phase 02 Plan 06: KPI Forms — Creation and Reading Entry Summary

**Five files completing the KPI data-entry workflows: /strategic/kpis/new (role-gated creation form), /strategic/kpis/[id] (detail + readings history), and /strategic/kpis/[id]/readings/new (canRecord-gated reading entry with ISO period helper text).**

## Performance

- **Duration:** 12 minutes
- **Started:** 2026-05-23T07:00:00Z
- **Completed:** 2026-05-23T07:12:00Z
- **Tasks:** 2 (Task 12, Task 13)
- **Files created:** 5

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 12 | KPI creation form — /strategic/kpis/new | a99f347 | app/(protected)/strategic/kpis/new/page.tsx, app/(protected)/strategic/kpis/new/KpiForm.tsx |
| 13 | KPI detail page, record reading page, ReadingForm | 15105de | app/(protected)/strategic/kpis/[id]/page.tsx, app/(protected)/strategic/kpis/[id]/readings/new/page.tsx, app/(protected)/strategic/kpis/[id]/readings/new/ReadingForm.tsx |

## What Was Built

### app/(protected)/strategic/kpis/new/page.tsx

Server Component shell for KPI creation:
- `export const dynamic = 'force-dynamic'` — prevents ISR caching
- Role-gated to `admin`, `ceo`, `risk-officer` (D-10, T-02-P06-01)
- Non-privileged users redirected to `/strategic/objectives`
- Fetches active strategic objectives (`status = 'active'`) for the objective selector
- Fetches user profiles for owner selector
- Both fetches via `Promise.all` for concurrency

### app/(protected)/strategic/kpis/new/KpiForm.tsx

`'use client'` form component:
- `useState` for error + `useTransition` for isPending (RegisterForm.tsx pattern)
- `zodResolver(kpiSchema)` with `mode: 'onBlur'`
- 8 fields in order: objective_id (Select), title (Input), description (Textarea, optional), owner_id (Select), unit_of_measure (Input), baseline_value (Input type=number), target_value (Input type=number), reporting_frequency (Select, default: quarterly)
- `baseline_value` and `target_value` use `{...field}` spread — Zod's `numericField()` helper handles empty-string rejection and string-to-number coercion; no manual conversion in the component
- `onSubmit` calls `createKpi(values)`; redirects to `/strategic/objectives/${values.objective_id}` on success
- Error shown in `<Alert variant="destructive">` above the form
- Submit button shows `Loader2` spinner when `isPending`

### app/(protected)/strategic/kpis/[id]/page.tsx

Server Component KPI detail page:
- `export const dynamic = 'force-dynamic'`
- Fetches KPI with embedded `strategic_objectives(id, title)` and `user_profiles!owner_id(full_name)` joins
- Fetches all KPI readings ordered by `recorded_at` descending
- Computes status via `calculateKpiStatus(latest?.actual_value ?? null, kpi.target_value)` (D-14)
- `getLatestReading(readings)` selects most recent reading for status calculation
- Status badge rendered using `KPI_STATUS_BADGE[status]` (ok/warn/err/no_data colors)
- Detail card: objective, owner, unit, frequency, baseline, target, description
- Readings history table: Period | Actual Value | Notes | Recorded At
- "Record Reading" link shown only if `canRecord` (admin OR owner_id match)
- Empty readings state shows "No readings recorded yet."

### app/(protected)/strategic/kpis/[id]/readings/new/page.tsx

Server Component reading entry shell:
- `export const dynamic = 'force-dynamic'`
- Fetches minimal KPI data (id, title, reporting_frequency, unit_of_measure, owner_id, target_value)
- `canRecord = activeRole === 'admin' || kpi.owner_id === user.id`
- Unauthorized users see inline error div: "Only the KPI owner or an administrator can record readings." (not a redirect — per plan spec)
- Authorized users see `<ReadingForm kpiId frequency unit />`

### app/(protected)/strategic/kpis/[id]/readings/new/ReadingForm.tsx

`'use client'` reading entry form:
- `useState` for error + `useTransition` for isPending
- `zodResolver(kpiReadingSchema)` with `mode: 'onBlur'`
- 3 fields: reporting_period (Input, with PERIOD_HELPER text below), actual_value (Input type=number, label includes unit), notes (Textarea, optional)
- `PERIOD_HELPER: Record<KpiFrequency, string>` provides ISO-period format guidance per D-12
- `onSubmit` calls `recordKpiReading(kpiId, values)`; redirects to `/strategic/kpis/${kpiId}` on success
- Error shown in `<Alert variant="destructive">` above the form
- Submit button: "Record Reading" with Loader2 spinner

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` — kpis/new errors | 0 |
| `npx tsc --noEmit` — kpis/[id] errors | 0 |
| `export const dynamic = 'force-dynamic'` in all 3 page.tsx files | PASS |
| No `getSession()` calls (only in comments) | PASS |
| `PERIOD_HELPER` present in ReadingForm.tsx | PASS (line 28, 89, 94) |
| `canRecord` present in readings/new/page.tsx | PASS (line 33, 43) |
| `objective_id` as Select field in KpiForm.tsx | PASS (lines 45, 65, 84) |
| All 94 unit tests passing | PASS (6 test files, 94 tests) |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all 5 files wire live data sources:
- `objectives` and `owners` props in KpiForm are fetched from Supabase and passed from the Server Component
- KPI detail page fetches live KPI and readings data; status is calculated on-the-fly
- ReadingForm calls `recordKpiReading` Server Action which writes to the database

## Threat Surface Coverage

All `mitigate` dispositions from the threat register are implemented:

| Threat ID | Mitigation | Status |
|-----------|-----------|--------|
| T-02-P06-01 | `CREATE_KPI_ROLES.includes(activeRole)` check in page.tsx | Mitigated |
| T-02-P06-02 | `canRecord` check in readings/new/page.tsx; Server Action also verifies owner_id vs user.id | Mitigated |
| T-02-P06-03 | RLS on kpi_readings enforces institution_id; Server Component relies on Supabase RLS | Mitigated |
| T-02-P06-04 | `{...field}` spread with numericField() in kpiSchema handles type="number" string inputs | Mitigated |

## Threat Flags

No new threat surface beyond what was planned in the threat model.

## Self-Check: PASSED

- app/(protected)/strategic/kpis/new/page.tsx: FOUND
- app/(protected)/strategic/kpis/new/KpiForm.tsx: FOUND
- app/(protected)/strategic/kpis/[id]/page.tsx: FOUND
- app/(protected)/strategic/kpis/[id]/readings/new/page.tsx: FOUND
- app/(protected)/strategic/kpis/[id]/readings/new/ReadingForm.tsx: FOUND
- Commit a99f347 (Task 12): FOUND in git log
- Commit 15105de (Task 13): FOUND in git log
- All 94 tests passing: CONFIRMED
- Zero TypeScript errors on new files: CONFIRMED

---
*Phase: 02-strategic-planning-objectives-and-kpis*
*Completed: 2026-05-23*
