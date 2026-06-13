# Phase 9: KRI/KCI Framework and Threshold Alerts - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase adds Key Risk Indicators (KRIs) and Key Control Indicators (KCIs) as first-class measurable entities in GRC-Nexus. It delivers:
- `kri_definitions` / `kri_readings` tables (KRIs optionally linked to risks)
- `kci_definitions` / `kci_readings` tables (KCIs linked to risk_treatments as the existing control-analog)
- Daily cron threshold-breach alert service (mirrors compliance/audit escalation)
- KRI sub-section under /risk module + KCI sub-section under /audit module
- KRI stat card on executive dashboard + KCI health grid tile
- Recharts sparkline trend on KRI/KCI detail pages (reuse KpiSparkline)

Out of scope: new `controls` table migration, R/Python analytics, ESG or ISO 9001 metrics (Phase 12–13).

</domain>

<decisions>
## Implementation Decisions

### Data Model
- `kri_definitions`: optional `risk_id` FK (KRI can be standalone or linked to a risk) — mirrors `kpis → strategic_objectives` pattern
- `kci_definitions`: `treatment_id` FK linking to `risk_treatments` (existing control-analog; no new controls table)
- Separate tables for KRI and KCI (not a unified `indicator_definitions` table) — clearer semantics, simpler validation
- Readings tables mirror `kpi_readings` exactly: `period_start`, `period_end`, `actual_value`, `status enum (on_track/at_risk/breached/no_data)`, `notes`
- All new tables: RLS (institution_id scoped), audit triggers via `audit.attach_audit_trigger()`

### Threshold Alert Semantics
- Absolute value thresholds: `alert_threshold` field on definition; user sets "alert if actual < 85"
- `direction` enum on definition: `lower_is_worse` vs `higher_is_worse` (configurable per indicator)
- Daily cron cadence (matches existing compliance/audit escalation pattern; CRON_SECRET protected)
- Alert recipients: KRI/KCI owner + all institution governance officers (matches compliance escalation pattern)
- Alert service path: `lib/risk/kri-alert.ts`, `lib/audit/kci-alert.ts`; API routes: `app/api/kri/alert/route.ts`, `app/api/kci/alert/route.ts`

### Dashboard Integration
- KRI stat card on executive dashboard: 3 counts (on_track / at_risk / breached) using existing status color tokens
- KCI health grid on executive dashboard: % controls green + count breached
- KRI/KCI detail pages show Recharts sparkline trend — reuse `KpiSparkline` with generic props (or thin wrapper)
- Executive dashboard additions are additive stat cards, not layout changes

### Navigation & UX
- KRI definitions: `/risk/kris` (sub-section under Risk module, colocated with heatmap/register)
- KCI definitions: `/audit/kcis` (sub-section under Audit module — KCIs measure control effectiveness)
- Reading entry: KRI/KCI detail page → "Record Reading" button → dedicated form page — mirrors `/strategic/kpis/[id]/readings/new`
- Sidebar nav: add "KRIs" link under Risk section, "KCIs" link under Audit section

### Claude's Discretion
- Migration numbering: continue from `20260524000008` → start at `20260525000001`
- Status enum values: `on_track | at_risk | breached | no_data` (adds `breached` to match threshold semantics beyond KPI's `off_track`)
- Zod schemas follow existing `numericField()` preprocess pattern from Phase 2

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/strategic/kpi-utils.ts` — `calculateKpiStatus()`, `KPI_STATUS_BADGE` pattern to replicate for KRI status
- `app/(protected)/strategic/KpiSparkline.tsx` — Recharts sparkline component; make props generic or create `IndicatorSparkline`
- `lib/compliance/escalation.ts` — full escalation email pattern with `escapeHtml()`, Resend, admin client
- `app/api/compliance/escalate/route.ts` — CRON_SECRET protected POST route pattern
- `components/compliance/ComplianceStatCard.tsx` — stat card pattern for dashboard tiles
- `supabase/migrations/20260522000020_compliance_schema.sql` — migration split template (schema / rls / triggers)

### Established Patterns
- Server Actions: Zod `safeParse` → RLS-aware Supabase insert → `revalidatePath` → return `{ error }` or `{ data }`
- Queries: `getKrisWithReadings()` following `getKpisWithReadings()` — PostgREST latest-reading subquery workaround
- RLS: `(select public.institution_id())` and `(select public.active_role())` helper functions
- All protected pages: `export const dynamic = 'force-dynamic'`

### Integration Points
- `app/(protected)/risk/page.tsx` — add KRI stat tiles and "View KRIs" link
- `app/(protected)/audit/page.tsx` — add KCI health tile and "View KCIs" link
- `app/(protected)/dashboard/page.tsx` — add KRI stat card and KCI health grid
- `app/(protected)/layout.tsx` — add sidebar nav entries for /risk/kris and /audit/kcis

</code_context>

<specifics>
## Specific Ideas

- Status enum uses `breached` (not `off_track`) to distinguish indicator threshold violation from KPI performance degradation — semantically sharper for risk/control context
- `direction` field makes threshold direction explicit: a control pass rate KRI uses `lower_is_worse`; a risk incident count KRI uses `higher_is_worse`
- Alert subject line pattern: "⚠ KRI Alert: [Metric Name] has breached threshold ([actual] vs threshold [threshold])"

</specifics>

<deferred>
## Deferred Ideas

- New standalone `controls` table (independent of risk_treatments) — Phase 10 may revisit if audit programs need it
- Combined KRI/KCI cross-module view — deferred to Phase 11 traceability graph
- Percentage-deviation threshold mode — can be added post-Phase 9 if absolute-value proves insufficient
- KRI/KCI benchmarking across institutions — deferred to multi-tenant milestone

</deferred>
