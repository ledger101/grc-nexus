---
phase: "02-strategic-planning-objectives-and-kpis"
plan: "04"
subsystem: "strategic-planning"
tags: [ui, react, nextjs, supabase, react-hook-form, zod, shadcn, tanstack-table, rbac, server-components]

dependency_graph:
  requires:
    - "02-02: objectiveSchema, ObjectiveInput from lib/schemas/strategic.ts"
    - "02-02: StrategicObjective, ObjectiveStatus, Nds2Pillar, NDS2_PILLAR_LABELS from types/strategic.ts"
    - "02-03: createObjective, updateObjective, updateObjectiveStatus from lib/strategic/actions.ts"
    - "02-03: getObjectives from lib/strategic/queries.ts"
    - "01-01: createClient() from lib/supabase/server.ts"
  provides:
    - "app/(protected)/layout.tsx: Strategic nav link visible to all authenticated roles"
    - "app/(protected)/strategic/layout.tsx: Auth guard + role-select redirect for /strategic/* routes"
    - "app/(protected)/strategic/objectives/page.tsx: Server Component listing all institution objectives"
    - "app/(protected)/strategic/objectives/ObjectivesTable.tsx: shadcn Table client component with search/status filter and cancel dialog"
    - "app/(protected)/strategic/objectives/new/page.tsx: Role-gated create page (admin/ceo)"
    - "app/(protected)/strategic/objectives/new/ObjectiveForm.tsx: 8-field create form with cross-field NDS2/goal validation"
    - "app/(protected)/strategic/objectives/[id]/page.tsx: Objective detail page with linked KPIs list"
    - "app/(protected)/strategic/objectives/[id]/edit/page.tsx: Role-gated edit page (admin/ceo)"
    - "app/(protected)/strategic/objectives/[id]/edit/ObjectiveEditForm.tsx: Pre-populated edit form calling updateObjective"
  affects:
    - "02-05: KPI dashboard page builds on same /strategic/* route tree"
    - "02-06+: All subsequent plans reference the objectives routes established here"

tech-stack:
  added: []
  patterns:
    - "shadcn Table + manual useState filter (NOT useReactTable) for objectives list — analog to UserManagementTable"
    - "Server Component pages with role-gated UI elements via app_metadata.active_role"
    - "react-hook-form + zodResolver + createObjective/updateObjective Server Action pattern"
    - "Cross-field Zod refine() with path: ['nds2_pillar'] to surface error under the correct form field"
    - "Select component with null-to-empty-string bridging for optional enum fields (nds2_pillar)"

key-files:
  created:
    - "app/(protected)/strategic/layout.tsx"
    - "app/(protected)/strategic/objectives/page.tsx"
    - "app/(protected)/strategic/objectives/ObjectivesTable.tsx"
    - "app/(protected)/strategic/objectives/new/page.tsx"
    - "app/(protected)/strategic/objectives/new/ObjectiveForm.tsx"
    - "app/(protected)/strategic/objectives/[id]/page.tsx"
    - "app/(protected)/strategic/objectives/[id]/edit/page.tsx"
    - "app/(protected)/strategic/objectives/[id]/edit/ObjectiveEditForm.tsx"
  modified:
    - "app/(protected)/layout.tsx"

key-decisions:
  - "ObjectivesTable uses shadcn Table + manual useState (NOT useReactTable) — same pattern as UserManagementTable; TanStack Table v8 is reserved for the KPI dashboard grid (Plan 05)"
  - "Strategic nav link placed after Dashboard and before Admin (role-gated) in sidebar, visible to all authenticated roles per D-27"
  - "Select component for optional nds2_pillar field uses value='' as the empty sentinel (not null) to satisfy SelectValue's string requirement, then converts '' back to null on change"
  - "Objective detail page fetches linked KPIs inline (no separate query helper) — simple enough for prototype scale"

requirements-completed: [STRAT-01, STRAT-02]

duration: "10m"
completed: "2026-05-23"
---

# Phase 02 Plan 04: Strategic Objectives UI Summary

**Complete objectives vertical slice: Strategic sidebar nav, objectives list with status badges and cancel dialog, create/edit forms with 8-field Zod validation, and detail page with linked KPIs — all role-gated via app_metadata.**

## Performance

- **Duration:** ~10 minutes
- **Started:** 2026-05-23T04:49:33Z
- **Completed:** 2026-05-23T04:59:00Z
- **Tasks:** 2 (Task 8 and Task 9)
- **Files created/modified:** 9

## Accomplishments

- Strategic sidebar nav item added to `app/(protected)/layout.tsx`, visible to all authenticated roles
- Complete objectives list page with shadcn Table, search + status filter, status badges, and cancel confirmation dialog
- Create objective form with all 8 fields and cross-field NDS2 pillar / institutional goal validation
- Objective detail page showing linked KPIs table with Add KPI link (role-gated to admin/ceo/risk-officer)
- Edit form pre-populated from existing objective, calling `updateObjective` Server Action

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 8 | Strategic layout, nav item, objectives list, ObjectivesTable | c9f44f0 | app/(protected)/layout.tsx, strategic/layout.tsx, objectives/page.tsx, ObjectivesTable.tsx |
| 9 | Create form, detail page, edit form | f76846c | new/page.tsx, ObjectiveForm.tsx, [id]/page.tsx, [id]/edit/page.tsx, ObjectiveEditForm.tsx |

## Files Created/Modified

- `app/(protected)/layout.tsx` — Added Strategic nav link to sidebar (visible to all roles)
- `app/(protected)/strategic/layout.tsx` — Auth guard + role-select redirect for /strategic/* routes
- `app/(protected)/strategic/objectives/page.tsx` — Server Component with force-dynamic, getObjectives(), role-gated New Objective button
- `app/(protected)/strategic/objectives/ObjectivesTable.tsx` — 'use client' named export, shadcn Table, search/status filter, status badges, cancel confirmation dialog, toast notifications
- `app/(protected)/strategic/objectives/new/page.tsx` — Server Component shell, role-gated admin/ceo, fetches user_profiles for owner selector
- `app/(protected)/strategic/objectives/new/ObjectiveForm.tsx` — 'use client', all 8 fields, cross-field nds2_pillar/institutional_goal validation via Zod refine()
- `app/(protected)/strategic/objectives/[id]/page.tsx` — Objective detail with status badge, detail card, linked KPIs table, role-gated Edit and Add KPI links
- `app/(protected)/strategic/objectives/[id]/edit/page.tsx` — Server Component shell, role-gated admin/ceo, fetches objective + user_profiles
- `app/(protected)/strategic/objectives/[id]/edit/ObjectiveEditForm.tsx` — 'use client', pre-populated from StrategicObjective prop, calls updateObjective, redirects to detail page on success

## Decisions Made

- **ObjectivesTable uses shadcn Table (NOT TanStack useReactTable)** — Per PATTERNS.md, the objectives list analog is UserManagementTable which uses shadcn Table + manual useState filter. TanStack Table v8 is used in Plan 05 for the KPI dashboard grid.
- **Select null bridging pattern** — The `nds2_pillar` field is optional and can be null. shadcn's Select requires a string value; the component bridges null ↔ `''` (empty string) at the Select boundary, then converts back to null before submitting.
- **Sidebar layout added in this plan** — The parent `app/(protected)/layout.tsx` only had a minimal shell (comment: "App shell nav added in a later phase"). This plan adds the real sidebar with nav links because the Strategic link is required by the plan's must_have truths.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added full sidebar navigation to protected layout**
- **Found during:** Task 8 (modifying app/(protected)/layout.tsx)
- **Issue:** The existing layout.tsx had a comment "App shell nav is added in a later phase — Phase 1 uses minimal shell" but the plan requires a Strategic nav link visible to all roles. Adding only a floating link without a sidebar would be non-functional UX.
- **Fix:** Replaced the minimal shell with a proper sidebar layout (fixed 220px sidebar with Dashboard, Strategic, Admin nav links) and offset main content by sidebar width. The sidebar is inline in layout.tsx rather than a separate component — keeping it simple for the prototype.
- **Files modified:** `app/(protected)/layout.tsx`
- **Verification:** TypeScript clean; Strategic link present; Admin link role-gated; Dashboard and Strategic visible to all.
- **Committed in:** c9f44f0

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical UX structure)
**Impact on plan:** Necessary for the Strategic nav link requirement. The sidebar was always needed; the Phase 1 comment was a deferral note that this plan resolves.

## Threat Mitigations Implemented

All `mitigate` dispositions from the plan's threat register are implemented:

| Threat ID | Mitigation |
|-----------|------------|
| T-02-P04-01 | `new/page.tsx` redirects non-admin/non-CEO to /strategic/objectives before rendering form |
| T-02-P04-02 | `[id]/page.tsx` redirects to /strategic/objectives if objective is null (RLS returns nothing for cross-institution access) |
| T-02-P04-03 | Zod resolver client-side + Server Action safeParse server-side strips unknown fields |
| T-02-P04-04 | `user_profiles` fetch in `new/page.tsx` is RLS-scoped to institution_id — only institution users appear |

## Known Stubs

None — all data is wired from actual Supabase queries via Server Components and Server Actions. No placeholder data or hardcoded values flowing to UI rendering.

## Threat Flags

No new threat surface beyond the plan's threat model. All endpoints are within the `app/(protected)/strategic/` route group, covered by the parent `strategic/layout.tsx` auth guard and the outer `(protected)/layout.tsx` defense-in-depth check.

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` — strategic files errors | 0 |
| `force-dynamic` present in layout.tsx and all page.tsx | PASS (5 occurrences) |
| `getSession` calls in strategic files | 0 (only in comments) |
| `'use client'` on ObjectivesTable.tsx line 1 | PASS |
| `'use client'` on ObjectiveForm.tsx line 1 | PASS |
| `'use client'` on ObjectiveEditForm.tsx line 1 | PASS |
| Strategic nav link in app/(protected)/layout.tsx | PASS |
| Role-gate on new/page.tsx (admin/ceo only) | PASS |
| Role-gate on [id]/edit/page.tsx (admin/ceo only) | PASS |
| All 9 files exist | PASS |

## Next Phase Readiness

- `/strategic/objectives` route tree is complete with full CRUD for objectives
- Plan 05 (KPI dashboard) can build the `/strategic` page using TanStack Table v8 with the `getKpisWithReadings` query helper already in place from Plan 03
- KPI create/detail pages (`/strategic/kpis/*`) are referenced from the detail page but not yet built — Plan 05 or 06 will add those

## Self-Check: PASSED

- app/(protected)/layout.tsx: FOUND (modified)
- app/(protected)/strategic/layout.tsx: FOUND
- app/(protected)/strategic/objectives/page.tsx: FOUND
- app/(protected)/strategic/objectives/ObjectivesTable.tsx: FOUND
- app/(protected)/strategic/objectives/new/page.tsx: FOUND
- app/(protected)/strategic/objectives/new/ObjectiveForm.tsx: FOUND
- app/(protected)/strategic/objectives/[id]/page.tsx: FOUND
- app/(protected)/strategic/objectives/[id]/edit/page.tsx: FOUND
- app/(protected)/strategic/objectives/[id]/edit/ObjectiveEditForm.tsx: FOUND
- Commit c9f44f0 (Task 8): FOUND in git log
- Commit f76846c (Task 9): FOUND in git log
- TypeScript errors in own files: 0

---
*Phase: 02-strategic-planning-objectives-and-kpis*
*Completed: 2026-05-23*
