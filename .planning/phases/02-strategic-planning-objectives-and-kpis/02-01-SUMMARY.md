---
phase: "02-strategic-planning-objectives-and-kpis"
plan: "01"
subsystem: "strategic-planning"
tags: [database, migrations, npm, rls, audit, enums]
dependency_graph:
  requires:
    - "01-01: audit.attach_audit_trigger() function (Phase 1 migration 000003)"
    - "01-01: auth.institution_id() and auth.active_role() helpers (Phase 1 migration 000005)"
    - "01-01: public.institutions table (Phase 1 migration 000001)"
  provides:
    - "strategic_objectives table with nds2_pillar enum and RLS"
    - "kpis table linked to strategic_objectives with RLS"
    - "kpi_readings table with owner-gated insert RLS"
    - "audit triggers on all three strategic tables"
    - "recharts@^3.8.1 and @tanstack/react-table@^8.21.3 in package.json"
  affects:
    - "02-02 through 02-06: all subsequent Phase 2 plans depend on this schema"
tech_stack:
  added:
    - "recharts@^3.8.1 — KPI sparkline charts (LineChart, ResponsiveContainer)"
    - "@tanstack/react-table@^8.21.3 — objectives and KPI data grids (v8 stable, not v9 alpha)"
  patterns:
    - "Postgres enum types for NDS2 pillar, objective status, and KPI frequency"
    - "RLS with (select auth.institution_id()) cached wrapper pattern"
    - "audit.attach_audit_trigger() call pattern for new tables"
    - "institution_id FK on all governance tables — isolation at DB layer"
key_files:
  created:
    - "supabase/migrations/20260522000007_strategic_schema.sql"
    - "supabase/migrations/20260522000008_strategic_rls.sql"
    - "supabase/migrations/20260522000009_strategic_triggers.sql"
  modified:
    - "package.json (added recharts, @tanstack/react-table)"
    - "package-lock.json"
decisions:
  - "Used v8.21.3 for TanStack Table (v9 is alpha-only; `latest` npm tag resolves to v8)"
  - "kpi_readings uses recorded_by = auth.uid() for owner-gate in RLS (no cross-institution leakage)"
  - "supabase db push not executed — project not linked in worktree; migration files are the deliverable"
  - "audit trigger count verification counts comment line; actual 3 SELECT calls confirmed correct"
metrics:
  duration: "12m 5s"
  completed_date: "2026-05-22"
  tasks_completed: 3
  tasks_total: 3
  files_created: 3
  files_modified: 2
---

# Phase 02 Plan 01: Strategic Schema Foundation — Dependencies and Database Summary

**One-liner:** Installs recharts@^3.8.1 and @tanstack/react-table@^8.21.3, then creates three sequential Supabase migrations defining the strategic planning schema, RLS policies, and audit triggers.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install recharts and TanStack Table v8 | 25353db | package.json, package-lock.json |
| 2 | Migration 000007 — strategic schema (enums + tables) | ab4706f | supabase/migrations/20260522000007_strategic_schema.sql |
| 3 | Migrations 000008 (RLS) and 000009 (audit triggers) | fe67afa | supabase/migrations/20260522000008_strategic_rls.sql, supabase/migrations/20260522000009_strategic_triggers.sql |

---

## What Was Built

### npm Packages

- **recharts@^3.8.1** — for KPI sparkline charts in the dashboard (STRAT-06). Requires `isAnimationActive={false}` for table cell usage to prevent layout jank.
- **@tanstack/react-table@^8.21.3** — for objectives and KPI data grids (STRAT-06). Pinned to v8 stable; v9.0.0-alpha.49 is the `alpha` tag, not suitable for production.

### Migration 000007: Strategic Schema

Three enums + three tables:

**Enums:**
- `nds2_pillar` — 8 NDS2 2026–2030 pillars (locked values from D-01, using `governance_and_institutions` and `regional_and_international_integration`)
- `objective_status` — draft, active, at_risk, completed, cancelled (D-05)
- `kpi_frequency` — monthly, quarterly, semi_annual, annual (D-09)

**Tables:**
- `strategic_objectives` — links to `institutions`, has `nds2_pillar`, `institutional_goal`, `status`, `owner_id`, date range (D-04)
- `kpis` — links to `strategic_objectives` (cascade delete), has `baseline_value`, `target_value`, `unit_of_measure`, `reporting_frequency` (D-08)
- `kpi_readings` — links to `kpis` (cascade delete), has `reporting_period`, `actual_value`, `recorded_by`, `recorded_at` (D-11)

9 indexes total following `idx_{table}_{column}` naming convention. RLS not in this file.

### Migration 000008: RLS Policies

Enable + force RLS on all 3 tables with `(select auth.institution_id())` cached wrapper:

| Table | Select | Insert | Update |
|-------|--------|--------|--------|
| strategic_objectives | institution scope | admin, ceo (D-07) | admin, ceo |
| kpis | institution scope | admin, ceo, risk-officer (D-10) | admin, ceo, risk-officer |
| kpi_readings | institution scope | admin OR recorded_by = auth.uid() (D-13) | — (no update policy; readings are append-only) |

### Migration 000009: Audit Triggers

Three `select audit.attach_audit_trigger(...)` calls wiring Phase 1's SECURITY DEFINER trigger to all three strategic tables. Audit trail is automatic and bypass-proof at DB layer.

---

## Deviations from Plan

None — plan executed exactly as written. All three tasks match plan specifications.

The `supabase db push` was attempted and returned `Cannot find project ref. Have you run supabase link?` — this is expected in the worktree execution environment. Migration files are the deliverable; push is a deployment step performed by the developer after linking their Supabase project.

---

## Auth Gates

| Gate | Task | What Was Needed | Outcome |
|------|------|-----------------|---------|
| Supabase project link | Task 3 | `supabase link` with project ref and access token | Migration files created; push deferred to developer |

---

## Verification Results

| Check | Result |
|-------|--------|
| recharts in package.json | ^3.8.1 |
| @tanstack/react-table in package.json | ^8.21.3 |
| Three migration files exist (000007, 000008, 000009) | Confirmed |
| 000007 contains `governance_and_institutions` enum value | Confirmed |
| 000007 contains `regional_and_international_integration` enum value | Confirmed |
| 000008 uses `(select auth.institution_id())` wrapper | Confirmed (all occurrences) |
| 000009 has 3 `audit.attach_audit_trigger()` calls | Confirmed (3 SELECT statements) |

---

## Known Stubs

None — this plan delivers schema and package installations only. No UI components or data rendering paths were created.

---

## Threat Flags

No new threat surface introduced beyond what was planned in the threat model. The RLS policies and audit triggers implement all `mitigate` dispositions from the plan's threat register:

- T-02-P01-01: kpi_readings RLS select with institution_id — mitigated
- T-02-P01-02: strategic_objectives insert with role gate — mitigated
- T-02-P01-03: audit trigger attachment — mitigated
- T-02-P01-04: npm integrity — accepted (npm lockfile checksums)

---

## Self-Check: PASSED

- package.json: recharts@^3.8.1 and @tanstack/react-table@^8.21.3 confirmed
- supabase/migrations/20260522000007_strategic_schema.sql: exists (101 lines)
- supabase/migrations/20260522000008_strategic_rls.sql: exists (2946 bytes)
- supabase/migrations/20260522000009_strategic_triggers.sql: exists (426 bytes)
- Task commits confirmed in git log: 25353db, ab4706f, fe67afa
