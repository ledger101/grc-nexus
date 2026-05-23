---
phase: 07-incident-and-whistleblower-management-reporting-and-triage
plan: 04
subsystem: incidents-triage-ui
tags: [dashboard, cases, detail, triage, status]
requires:
  - phase: 07-02
    provides: query and mutation service layer
provides:
  - Incident dashboard and filterable cases list
  - Case detail timeline/evidence view
  - Triage assignment and status progression forms
affects: [investigator-operations, closure-governance]
tech-stack:
  added: []
  patterns: [protected route guard, tanstack table filters, action-backed form updates]
key-files:
  created:
    - app/(protected)/incidents/page.tsx
    - app/(protected)/incidents/cases/page.tsx
    - app/(protected)/incidents/cases/IncidentCasesTable.tsx
    - app/(protected)/incidents/cases/[id]/page.tsx
    - app/(protected)/incidents/cases/[id]/IncidentCaseDetail.tsx
    - app/(protected)/incidents/cases/[id]/triage/TriageForm.tsx
    - app/(protected)/incidents/cases/[id]/status/StatusUpdateForm.tsx
  modified: []
key-decisions:
  - "Status form routes close transitions through closeIncidentCase to enforce required resolution summary."
  - "Investigator candidates are role-filtered in application code to avoid schema union drift issues."
patterns-established:
  - "Incident detail UI co-locates immutable history, triage controls, and status progression in one protected workflow."
requirements-completed: [INCD-03, INCD-04, INCD-05]
duration: 31min
completed: 2026-05-23
---

# Phase 7 Plan 04: Triage and Case Operations UI Summary

**The investigator and triage experience is now complete across incident dashboard, case listing, case detail, assignment, and lifecycle status progression with closure-summary enforcement.**

## Performance
- **Duration:** 31 min
- **Tasks:** 3
- **Files created:** 7

## Accomplishments
- Added `/incidents` dashboard with status and SLA posture cards.
- Added `/incidents/cases` with a filterable TanStack-backed table.
- Added case detail route and screen with confidentiality context, timeline, and evidence metadata.
- Added triage assignment form with assignee/severity/visibility controls.
- Added status transition form that enforces closure narrative via `incidentCloseSchema`.

## Task Commits
1. **Task 1-3: Dashboard/list/detail/triage/status implementation** - `0b11fca` (feat)

## Files Created/Modified
- `app/(protected)/incidents/page.tsx`
- `app/(protected)/incidents/cases/page.tsx`
- `app/(protected)/incidents/cases/IncidentCasesTable.tsx`
- `app/(protected)/incidents/cases/[id]/page.tsx`
- `app/(protected)/incidents/cases/[id]/IncidentCaseDetail.tsx`
- `app/(protected)/incidents/cases/[id]/triage/TriageForm.tsx`
- `app/(protected)/incidents/cases/[id]/status/StatusUpdateForm.tsx`

## Decisions Made
- Kept route/auth defense in depth by combining role checks with backend action checks and RLS.

## Deviations from Plan
None.

## Issues Encountered
None.

## User Setup Required
None.

## Threat Flags
None.

## Self-Check: PASSED
- Verified all created triage UI files exist.
- Verified commit `0b11fca` exists in git history.
- Verified status transitions presented in UI align with legal lifecycle progression.
