# Phase 3: Enterprise Risk Management - Risk Register and Heatmap - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers the full Enterprise Risk Management module for GRC-Nexus: risk officers and authorized users can create risks linked to strategic objectives, score inherent and residual risk using a 5x5 likelihood-impact model, manage treatment actions, and view a live 5x5 institutional risk heatmap.

This phase includes:
- Risk register CRUD and detail pages
- Inherent and residual risk scoring
- Severity labeling from computed scores
- Treatment management with due dates and status changes
- Overdue treatment escalation flow
- Client-side register filtering without full page reload
- Live risk heatmap view based on inherent scores

This phase excludes:
- Historical risk-score timeline/audit beyond core audit trigger events
- Bulk risk import/export tooling
- Predictive/AI risk scoring
- Cross-institution comparison and consolidated reporting (Phase 8)

</domain>

<decisions>
## Implementation Decisions

### Data Model and Schema

- **D-01:** Create `public.risk_category` enum with values: `strategic`, `operational`, `financial`, `compliance`, `reputational`, `technology`.
- **D-02:** Create `public.risk_status` enum with values: `open`, `mitigated`, `accepted`, `closed`, `escalated`.
- **D-03:** Create `public.treatment_status` enum with values: `planned`, `in_progress`, `completed`, `overdue`, `cancelled`.
- **D-04:** Create `public.risks` table with: `institution_id`, `objective_id`, `title`, `description`, `category`, `owner_id`, `status`, `inherent_likelihood`, `inherent_impact`, `residual_likelihood`, `residual_impact`, `mitigating_controls`, `created_by`, `created_at`, `updated_at`.
- **D-05:** Create `public.risk_treatments` table with: `institution_id`, `risk_id`, `title`, `description`, `owner_id`, `due_date`, `status`, `created_by`, `created_at`, `updated_at`.
- **D-06:** Store inherent/residual dimensions as columns on `risks`; never store computed product score.
- **D-07:** `residual_likelihood` and `residual_impact` are nullable until residual assessment is provided.
- **D-08:** Add indexes: risk by institution/objective/owner/status/category; treatments by institution/risk/owner/due_date/status.
- **D-09:** Migration numbering starts at `20260522000011_risk_schema.sql` because `20260522000010_fix_admin_user.sql` already exists.

### Security, RLS, Audit

- **D-10:** Enable and force RLS on all Phase 3 tables from creation.
- **D-11:** Enforce institution isolation with `(select public.institution_id())` and role checks with `(select public.active_role())`, matching Phase 1/2 SQL helper conventions.
- **D-12:** Attach audit triggers using `audit.attach_audit_trigger()` for `public.risks` and `public.risk_treatments`.
- **D-13:** Role authorization follows existing claims-based checks (`user.app_metadata.active_role`) in Server Actions.

### Score and Severity Logic

- **D-14:** Implement `calculateRiskScore(likelihood, impact) = likelihood * impact` in `lib/risk/risk-utils.ts`.
- **D-15:** Implement `getRiskSeverity(score)` mapping: Low 1-4, Medium 5-9, High 10-15, Critical 16-25.
- **D-16:** Use pure functions for score/severity/overdue helpers with no Supabase/Next imports.

### Treatments and Overdue Behavior

- **D-17:** Overdue detection function: treatment is overdue when status is neither `completed` nor `cancelled`, and due date is in the past.
- **D-18:** Use date-fns (`isPast`) for overdue comparison.
- **D-19:** Overdue treatments surface as `overdue` state in UI and support escalation email path via Resend Server Action flow.
- **D-20:** Inline treatment status editing is required on risk detail treatment rows using Component 28 (Inline Treatment Status Select).
- **D-21:** Overdue treatments render read-only status badge instead of editable select until resolved by allowed workflow.

### UX and Interaction Contracts

- **D-22:** Heatmap implementation is CSS Grid (5x5), not Nivo.
- **D-23:** Heatmap uses fixed severity-zone coloring, not continuous color scale.
- **D-24:** Grid orientation: row top = likelihood 5, bottom = likelihood 1; left-to-right impact 1 to 5.
- **D-25:** Risk register uses TanStack Table v8 client-side filtering by category, severity, owner, and status.
- **D-26:** Filter interactions must not trigger full-page reload.
- **D-27:** New/updated protected risk pages must include `export const dynamic = 'force-dynamic'`.

### Forms, Validation, and App Patterns

- **D-28:** Use react-hook-form + Zod v3 schemas in `lib/schemas/risk.ts`.
- **D-29:** Keep Zod v3-compatible APIs only; do not introduce Zod v4 syntax.
- **D-30:** Server Actions for risk domain live in `lib/risk/actions.ts` with same pattern as `lib/strategic/actions.ts`.
- **D-31:** Continue established Supabase client split: server client in Server Components/Actions, browser client only in Client Components.

### The agent's Discretion

- Final split of plans/waves as long as dependencies are explicit and executable.
- Exact component file boundaries under `components/risk/` as long as they align with UI-SPEC and existing conventions.
- Specific empty/loading state copy and icon selections.
- Minor table column ordering choices where not contractually constrained.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Planning Inputs

- `.planning/ROADMAP.md` - phase goal, dependencies, success criteria for Phase 3
- `.planning/REQUIREMENTS.md` - RISK-01 through RISK-08 requirement definitions
- `.planning/phases/03-enterprise-risk-management-risk-register-and-heatmap/03-RESEARCH.md` - technical decisions and implementation recommendations
- `.planning/phases/03-enterprise-risk-management-risk-register-and-heatmap/03-UI-SPEC.md` - UI contract, component inventory, interaction states
- `.planning/phases/03-enterprise-risk-management-risk-register-and-heatmap/03-VERIFICATION.md` - verification findings context

### Prior-Phase Patterns to Reuse

- `.planning/phases/01-foundation-authentication-rls-and-audit-trail/01-CONTEXT.md` - auth, RLS, audit and protected route conventions
- `.planning/phases/01-foundation-authentication-rls-and-audit-trail/01-SUMMARY.md` - implemented baseline and migration conventions
- `.planning/phases/02-strategic-planning-objectives-and-kpis/02-CONTEXT.md` - strategic module conventions and role gates
- `.planning/phases/02-strategic-planning-objectives-and-kpis/02-PATTERNS.md` - analog code locations and integration patterns

### Existing Code References

- `lib/auth/actions.ts` - server action style, auth/role checks
- `lib/supabase/server.ts` and `lib/supabase/client.ts` - Supabase client usage boundaries
- `app/(protected)/admin/audit-log/AuditLogTable.tsx` - TanStack table pattern
- `supabase/migrations/20260522000001_base_schema.sql` - schema/index style
- `supabase/migrations/20260522000002_rls_policies.sql` - RLS policy style
- `supabase/migrations/20260522000003_audit_triggers.sql` - audit trigger attachment style
- `tailwind.config.ts` - established color/radius/shadow tokens

</canonical_refs>

<specifics>
## Specific Ideas

- Implement `components/risk/TreatmentStatusSelect.tsx` for inline treatment status updates in risk detail view (Component 28).
- Use dedicated helper module `lib/risk/risk-utils.ts` for score/severity/overdue pure logic with unit tests.
- Include shadcn Tooltip setup for heatmap risk-dot hover details before full heatmap implementation if missing.
- Ensure severity badge and treatment status badge styling aligns with UI-SPEC classes/tokens.
- Ensure client filter state updates are instant and stable for typical prototype data volume (<500 risks).

</specifics>

<deferred>
## Deferred Ideas

- Historical timeline table for every score change event (beyond audit events)
- Configurable institution-specific severity thresholds
- Bulk risk/treatment import workflow
- Predictive risk trend modeling and anomaly detection
- Cross-institution risk analytics

</deferred>

---

*Phase: 03-enterprise-risk-management-risk-register-and-heatmap*
*Context gathered: 2026-05-23*
