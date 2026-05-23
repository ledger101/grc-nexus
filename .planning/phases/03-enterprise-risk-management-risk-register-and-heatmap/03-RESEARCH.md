# Phase 3: Enterprise Risk Management — Risk Register and Heatmap - Research

**Researched:** 2026-05-23
**Domain:** ERM schema design, 5×5 risk heatmap (CSS Grid), TanStack Table v8 filtering, Supabase embedded joins, overdue treatment detection, Zod v3 risk schemas
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RISK-01 | User can create a risk entry linked to a strategic objective with title, description, category, and owner | `risks` table schema; `createRisk` Server Action pattern; RBAC (risk-officer can create); `riskSchema` Zod v3 |
| RISK-02 | User can score a risk on a 5×5 likelihood-impact matrix (1–5 each) for inherent risk | Inherent score stored as `inherent_likelihood` + `inherent_impact` columns on `risks` table; score computed as product |
| RISK-03 | User can record residual risk score after applying controls | Residual score stored as `residual_likelihood` + `residual_impact` columns on the same `risks` row; Server Action updates these fields |
| RISK-04 | System calculates risk score (likelihood × impact) and applies severity label: Low 1–4, Medium 5–9, High 10–15, Critical 16–25 | `calculateRiskScore()` and `getRiskSeverity()` pure functions in `lib/risk/risk-utils.ts`; unit-tested TDD |
| RISK-05 | User can add risk treatments with owner, due date, and status; overdue treatments escalate | `risk_treatments` table; `isTreatmentOverdue()` pure function using `date-fns isPast()`; overdue = status != 'completed' AND due_date < now() |
| RISK-06 | Dashboard displays a live 5×5 risk heatmap showing all institutional risks by inherent score | CSS Grid heatmap — 5×5 fixed-color zones (Low/Medium/High/Critical); risk dots positioned by (inherent_likelihood, inherent_impact) |
| RISK-07 | Overdue risk treatments trigger escalation notifications to treatment owner and manager | Server Action marks treatment overdue status; Resend email notification (already installed) — no background job needed |
| RISK-08 | Risk register supports filtering by category, severity, owner, and status without page reload | TanStack Table v8 `getFilteredRowModel()` — client-side filtering; <500 rows prototype scale |

</phase_requirements>

---

## Summary

Phase 3 builds directly on Phase 2 patterns with three additions: a risk domain schema, a CSS Grid heatmap, and overdue detection logic. All Phase 2 Server Action patterns, RLS patterns, TanStack Table patterns, and Zod schema patterns apply without modification — this research documents how to apply them to the risk domain.

**Heatmap decision (critical):** The project's CLAUDE.md stack notes Nivo as the heatmap library. However, `@nivo/heatmap` uses *continuous* color scales (sequential/diverging schemes) — it cannot render fixed discrete severity zones. A 5×5 risk matrix requires exactly 4 fixed background colors for 25 cells (Low green, Medium orange, High orange-red, Critical red). A **CSS Grid heatmap** achieves this in ~40 lines of React with zero new dependencies, using the Tailwind color tokens already in `tailwind.config.ts`. The Nivo `ResponsiveHeatMap` is not the right tool for a discrete-zone risk matrix — this is verified from Context7 Nivo docs. [VERIFIED: npm `@nivo/heatmap@0.99.0`; Context7 /plouc/nivo]

**Schema decision:** Inherent and residual scores are stored as separate `likelihood` and `impact` columns on the `risks` table (not a separate `risk_scores` table). The computed score (likelihood × impact) is never stored — always calculated in TypeScript. This matches the KPI pattern from Phase 2 where performance status is computed on-the-fly. A separate `risk_scores` table would be over-engineered for prototype scale with `<500` risks.

**Overdue treatment detection:** No background job is needed. Overdue detection is a pure comparison: `isTreatmentOverdue(treatment)` returns `true` when `status !== 'completed' && isPast(new Date(treatment.due_date))`. `date-fns` is already installed (`v4.3.0`). The Server Action that updates treatment status also checks for overdue conditions and sends Resend email when transitioning from non-overdue to overdue. The risk register query annotates each treatment with overdue status in JS — no stored `is_overdue` column needed.

**Filter-without-reload:** TanStack Table v8 client-side filtering (already established in Phase 2, already installed `@tanstack/react-table@^8.21.3`). Risk register with `<500` risks at prototype scale does not need URL-based server filtering. The filter bar is a Client Component that drives `setColumnFilters` on the table state.

**Primary recommendation:** No new packages needed. CSS Grid heatmap + Phase 2 patterns + date-fns (already installed). Migration numbering starts at `20260522000010_risk_schema.sql`.

---

## Project Constraints (from CLAUDE.md)

| Constraint | Value | Source |
|------------|-------|--------|
| Framework | Next.js 14 App Router | CLAUDE.md / PROJECT.md |
| Backend | Supabase (Postgres, Auth, RLS) | CLAUDE.md / PROJECT.md |
| Zod version | v3.x HARD CONSTRAINT — no v4 APIs | CLAUDE.md |
| Deployment | Vercel + Supabase cloud | CLAUDE.md |
| Auth pattern | `getUser()` not `getSession()` | Phase 1 convention |
| Cache | `export const dynamic = 'force-dynamic'` on all protected pages | Phase 1 convention |
| Audit trail | `audit.attach_audit_trigger()` on every governance table | Phase 1 convention |
| RLS | Enable on every new table from creation | Phase 1 convention |
| GSD workflow | All repo edits via GSD commands only | CLAUDE.md |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Risk CRUD (create/update/score) | API (Server Actions) | DB (RLS) | Business logic + role enforcement in Server Actions; RLS as second layer — identical to Phase 2 objective/KPI pattern |
| Risk score calculation (likelihood × impact) | Pure function (importable anywhere) | — | `calculateRiskScore()` has zero DB/framework imports; unit-testable without mocks |
| Severity label mapping | Pure function (importable anywhere) | — | `getRiskSeverity()` maps 1–25 score to Low/Medium/High/Critical; stateless, no side effects |
| Risk heatmap rendering | Browser (Client Component) | — | Needs DOM for CSS rendering; data fetched server-side in Server Component, passed as prop |
| Risk register table + filtering | Browser (Client Component) | Frontend Server (data fetch) | TanStack Table filtering is client-side; data fetched once in Server Component page |
| Overdue treatment detection | Pure function (importable anywhere) | API (Server Action — for notification) | `isTreatmentOverdue()` is pure comparison; Resend notification triggered from Server Action |
| Overdue notification dispatch | API (Server Action) | Email (Resend) | Server Action decides when to send; Resend delivers; no background scheduler needed |
| RLS data isolation | Database | — | `auth.institution_id()` Postgres function from Phase 1; no application-layer filtering needed |
| Audit trail | Database (SECURITY DEFINER trigger) | — | `audit.attach_audit_trigger()` from Phase 1; survives application bugs |

---

## Standard Stack

### Packages Already Installed (No New Install Needed)

[VERIFIED: package.json in codebase — 2026-05-23]

| Package | Installed Version | Phase 3 Use |
|---------|-----------------|-------------|
| `@tanstack/react-table` | `^8.21.3` | Risk register table with client-side filter by category, severity, owner, status (RISK-08) |
| `recharts` | `^3.8.1` | Not used for heatmap (CSS Grid instead); available if sparklines needed elsewhere |
| `date-fns` | `^4.3.0` | `isPast()` for overdue treatment detection (RISK-05, RISK-07) |
| `resend` | `^6.12.3` | Overdue treatment escalation emails (RISK-07) |
| `zod` | `^3.25.76` | `riskSchema`, `treatmentSchema` validation — Zod v3 constraint enforced |
| `react-hook-form` | `^7.76.0` | Risk and treatment forms |
| `@hookform/resolvers` | `^3.10.0` | Zod ↔ react-hook-form bridge |
| `sonner` | `^2.0.7` | Toast notifications for risk/treatment saves |

**No new packages required for Phase 3.** CSS Grid heatmap uses only existing Tailwind + React.

### What NOT to Install

| Library | Why Not |
|---------|---------|
| `@nivo/heatmap` | Uses continuous sequential color scales — cannot render fixed discrete zones (Low/Medium/High/Critical). CSS Grid achieves the same result with less code and no bundle cost. [VERIFIED: Context7 /plouc/nivo] |
| `@nivo/core` | Nivo dependency — not needed if not using Nivo components |

### Version Clarifications

| State.md Said | Actual npm `latest` | Action |
|--------------|--------------------|----|
| Nivo for heatmaps | `@nivo/heatmap@0.99.0` (latest) — but uses sequential color scales only | Use CSS Grid instead; skip Nivo install |
| date-fns v3 | `date-fns@4.3.0` (latest, already installed) | Already installed; use `isPast()` from date-fns v4 |

---

## Research Questions — Concrete Answers

### Q1: Schema — What Tables Are Needed?

**Answer: Two tables. Inherent and residual scores as columns on `risks`, not a separate table.**

[VERIFIED: codebase — Phase 1 schema conventions, Phase 2 schema patterns]
[ASSUMED: "Scores as columns" design is standard ERM practice for prototype-scale; no authoritative external doc verified — risk if wrong: minor schema refactor, no data loss]

#### Table: `risks`

```sql
-- Migration: 20260522000010_risk_schema.sql

create type public.risk_category as enum (
  'strategic', 'operational', 'financial', 'compliance', 'reputational', 'technology'
);

create type public.risk_status as enum (
  'open', 'mitigated', 'accepted', 'closed', 'escalated'
);

create table public.risks (
  id                    uuid primary key default gen_random_uuid(),
  institution_id        uuid not null references public.institutions(id) on delete restrict,
  objective_id          uuid references public.strategic_objectives(id) on delete set null,
  title                 text not null,
  description           text,
  category              public.risk_category not null,
  owner_id              uuid references auth.users(id) on delete set null,
  status                public.risk_status not null default 'open',
  -- Inherent risk (before controls)
  inherent_likelihood   smallint not null check (inherent_likelihood between 1 and 5),
  inherent_impact       smallint not null check (inherent_impact between 1 and 5),
  -- Residual risk (after controls applied)
  residual_likelihood   smallint check (residual_likelihood between 1 and 5),
  residual_impact       smallint check (residual_impact between 1 and 5),
  -- Control description (optional narrative of mitigating controls)
  mitigating_controls   text,
  created_by            uuid references auth.users(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_risks_institution_id    on public.risks (institution_id);
create index idx_risks_objective_id      on public.risks (objective_id);
create index idx_risks_owner_id          on public.risks (owner_id);
create index idx_risks_status            on public.risks (status);
create index idx_risks_category          on public.risks (category);
```

**Why scores as columns (not separate table):**
- A risk always has exactly one inherent score and zero or one residual score — this is 1:0..1, not 1:N. A separate `risk_scores` table would add a join for every query with no benefit.
- The score is mutable (user updates it); a separate table would require update-or-insert logic that adds complexity without value at prototype scale.
- Phase 8 heatmap also needs the scores — embedded in the `risks` row means one query per page.
- If historical score tracking is ever needed (v2), add a `risk_score_history` table then.

**Why `smallint` with CHECK constraint:**
- 1–5 range; Postgres `CHECK (x between 1 and 5)` enforces at DB layer — survives application bugs.
- `smallint` (2 bytes) is correct for small-range integers; `integer` would also work but wastes bytes.

**Why `residual_likelihood` / `residual_impact` are nullable:**
- A risk may be scored inherently before controls are identified. Residual score is set in a second action. Making them nullable models this real-world workflow.

#### Table: `risk_treatments`

```sql
create type public.treatment_status as enum (
  'planned', 'in_progress', 'completed', 'overdue', 'cancelled'
);

create table public.risk_treatments (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  risk_id        uuid not null references public.risks(id) on delete cascade,
  title          text not null,
  description    text,
  owner_id       uuid references auth.users(id) on delete set null,
  due_date       date not null,
  status         public.treatment_status not null default 'planned',
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_risk_treatments_institution_id on public.risk_treatments (institution_id);
create index idx_risk_treatments_risk_id        on public.risk_treatments (risk_id);
create index idx_risk_treatments_owner_id       on public.risk_treatments (owner_id);
create index idx_risk_treatments_due_date       on public.risk_treatments (due_date);
create index idx_risk_treatments_status         on public.risk_treatments (status);
```

**Why `overdue` as an enum value in `treatment_status`:**
- The `overdue` status is the escalation trigger for RISK-07. Storing it explicitly in the enum means the UI can filter by it and the audit log captures the status transition.
- Detection happens in the Server Action when treatment is loaded; the action updates `status` to `'overdue'` if `due_date < now() AND status NOT IN ('completed', 'cancelled', 'overdue')`. This avoids a background job.
- Alternative (pure JS detection at query time without storing) is simpler but loses the audit trail of when a treatment became overdue.

**Why `due_date` is type `date` (not `timestamptz`):**
- Risk treatment due dates are day-precision business dates, not timestamps. `date` is correct.

#### No `risk_scores` table needed:
- Score = `likelihood × impact` is computed in TypeScript, never stored. Identical pattern to `calculateKpiStatus` in Phase 2.

---

### Q2: Risk Heatmap — CSS Grid vs Nivo vs Recharts

**Answer: CSS Grid heatmap. No new library needed.**

[VERIFIED: npm `@nivo/heatmap@0.99.0`; Context7 /plouc/nivo — `colors: { type: 'sequential' }` only]
[VERIFIED: tailwind.config.ts — color tokens `ok`, `warn`, `err`, `paper-border` already defined]

**Why NOT Nivo `ResponsiveHeatMap`:**
- Nivo's heatmap colors are continuous color scales (`sequential`, `diverging`, `quantize`). The risk matrix needs 4 fixed discrete colors for 25 cells based on `score = likelihood × impact`. Nivo does not support "if score 1–4 use this exact hex, if 5–9 use this exact hex" without deep customization.
- `@nivo/heatmap` + `@nivo/core` would add ~500KB bundle with no advantage over a CSS Grid.
- STATE.md mentions Nivo as the heatmap library in general research context, but the research was done before the discrete-zone requirement was analyzed. The planner should use CSS Grid.

**Why NOT Recharts scatter plot:**
- A Recharts `ScatterChart` can position dots on a 5×5 grid using x/y axes, but cannot render the background severity zone colors without custom SVG overlays. More complex than CSS Grid.

**CSS Grid Heatmap Pattern (verified approach):**

The 5×5 risk matrix is a 5-column, 5-row CSS Grid where:
- Each cell has a fixed background color determined by `score = row × col` → severity zone
- Risk dots are positioned in the cell matching their `(likelihood, impact)` coordinates
- Axis labels (1–5) are rendered as grid headers

Severity zone → background color mapping (using existing Tailwind tokens):

```typescript
// Source: tailwind.config.ts + RISK-04 severity thresholds
// File: lib/risk/risk-utils.ts

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical'

export function calculateRiskScore(likelihood: number, impact: number): number {
  return likelihood * impact
}

export function getRiskSeverity(score: number): RiskSeverity {
  if (score <= 4)  return 'low'      // 1–4
  if (score <= 9)  return 'medium'   // 5–9
  if (score <= 15) return 'high'     // 10–15
  return 'critical'                   // 16–25
}

// Cell background colors for each of the 25 matrix positions
// Keyed by "likelihood-impact" for direct lookup
// These are Tailwind bg classes using existing color tokens
export const RISK_CELL_BG: Record<RiskSeverity, string> = {
  low:      'bg-ok/15',         // #27AE60 at 15% opacity — green zone
  medium:   'bg-warn/20',       // #E67E22 at 20% opacity — orange zone
  high:     'bg-err/20',        // #E74C3C at 20% opacity — red-orange zone
  critical: 'bg-err/40',        // #E74C3C at 40% opacity — deep red zone
}

export const RISK_SEVERITY_BADGE: Record<RiskSeverity, { label: string; className: string }> = {
  low:      { label: 'Low',      className: 'bg-ok/10 text-ok border-ok/30' },
  medium:   { label: 'Medium',   className: 'bg-warn/10 text-warn border-warn/30' },
  high:     { label: 'High',     className: 'bg-err/10 text-err border-err/30' },
  critical: { label: 'Critical', className: 'bg-err/30 text-err border-err/50' },
}
```

**Heatmap Grid Layout (25 pre-colored cells, risk dots overlaid):**

```tsx
// Source: Phase 2 TanStack Table pattern + CSS Grid (no new library)
// File: app/(protected)/risk/RiskHeatmap.tsx
'use client'

// Matrix: rows = likelihood (1=bottom → 5=top), cols = impact (1=left → 5=right)
// Convention: Y-axis (likelihood) increases upward — standard ERM presentation
// CSS Grid row 1 = top = likelihood 5; row 5 = bottom = likelihood 1

type RiskDot = {
  id: string
  title: string
  inherent_likelihood: number
  inherent_impact: number
  severity: RiskSeverity
}

export function RiskHeatmap({ risks }: { risks: RiskDot[] }) {
  // Build 25-cell grid: rows L5→L1 (top-to-bottom), cols I1→I5 (left-to-right)
  const cells = Array.from({ length: 5 }, (_, rowIdx) => {
    const likelihood = 5 - rowIdx  // Row 0 = L5, Row 4 = L1
    return Array.from({ length: 5 }, (_, colIdx) => {
      const impact = colIdx + 1    // Col 0 = I1, Col 4 = I5
      const score = calculateRiskScore(likelihood, impact)
      const severity = getRiskSeverity(score)
      const risksInCell = risks.filter(
        r => r.inherent_likelihood === likelihood && r.inherent_impact === impact
      )
      return { likelihood, impact, score, severity, risksInCell }
    })
  })

  return (
    <div className="flex gap-4">
      {/* Y-axis label */}
      <div className="flex flex-col justify-between items-center text-[11px] text-navy-mid py-[2px]">
        {[5,4,3,2,1].map(l => (
          <span key={l} className="w-4 text-center">{l}</span>
        ))}
        <span className="text-[10px] rotate-[-90deg] text-navy-mid mt-1 whitespace-nowrap">Likelihood</span>
      </div>

      <div>
        {/* 5×5 Grid */}
        <div
          className="grid gap-[2px]"
          style={{ gridTemplateColumns: 'repeat(5, 64px)', gridTemplateRows: 'repeat(5, 64px)' }}
        >
          {cells.flat().map(cell => (
            <div
              key={`${cell.likelihood}-${cell.impact}`}
              className={`
                relative flex flex-wrap items-center justify-center gap-1 p-1 rounded-[4px]
                ${RISK_CELL_BG[cell.severity]}
                border border-paper-border/50
              `}
            >
              {cell.risksInCell.map(risk => (
                <RiskDotTooltip key={risk.id} risk={risk} />
              ))}
            </div>
          ))}
        </div>

        {/* X-axis labels */}
        <div
          className="flex mt-1"
          style={{ gap: '2px', paddingLeft: '0' }}
        >
          {[1,2,3,4,5].map(i => (
            <div key={i} className="w-[64px] text-center text-[11px] text-navy-mid">{i}</div>
          ))}
        </div>
        <p className="text-center text-[11px] text-navy-mid mt-1">Impact</p>
      </div>
    </div>
  )
}
```

**Why CSS Grid is better here:**
- Full control over cell background colors — exact severity zone colors without library constraints
- No new bundle cost — pure Tailwind + React
- Naturally handles multiple risks in one cell (flexbox wrap within the cell)
- Tooltip on hover is a shadcn `Tooltip` component already available

---

### Q3: Scoring Logic and Edge Cases

**Answer: `score = likelihood × impact`. All edge cases enumerated.**

[VERIFIED: RISK-04 thresholds from REQUIREMENTS.md and ROADMAP.md — 1–4 Low, 5–9 Medium, 10–15 High, 16–25 Critical]

**5×5 matrix coverage:**

| Score Range | Cells | Severity |
|------------|-------|----------|
| 1 (1×1) | 1 cell | Low |
| 2 (1×2, 2×1) | 2 cells | Low |
| 3 (1×3, 3×1) | 2 cells | Low |
| 4 (1×4, 4×1, 2×2) | 3 cells | Low |
| 5 (1×5, 5×1) | 2 cells | Medium |
| 6 (2×3, 3×2) | 2 cells | Medium |
| 8 (2×4, 4×2) | 2 cells | Medium |
| 9 (3×3) | 1 cell | Medium |
| 10 (2×5, 5×2) | 2 cells | High |
| 12 (3×4, 4×3) | 2 cells | High |
| 15 (3×5, 5×3) | 2 cells | High |
| 16 (4×4) | 1 cell | Critical |
| 20 (4×5, 5×4) | 2 cells | Critical |
| 25 (5×5) | 1 cell | Critical |

**Edge cases for `calculateRiskScore`:**
- Inputs are 1–5 `smallint` validated at DB level AND Zod schema level — no out-of-range inputs reach the function
- No division involved — no division-by-zero edge case (unlike KPI status)
- Score range is always 1–25 — no null/undefined edge case if DB constraints hold
- Overperformed / underperformed concepts don't apply — risk score is purely multiplicative

**Edge cases for `getRiskSeverity`:**
- Score 4: Low (4 × 1 = 4, boundary) → `<= 4` → Low ✓
- Score 5: Medium (1 × 5 or 5 × 1 = 5, boundary) → `<= 9` → Medium ✓
- Score 9: Medium (3 × 3 = 9, boundary) → `<= 9` → Medium ✓
- Score 10: High (2 × 5 = 10, boundary) → `<= 15` → High ✓
- Score 15: High (3 × 5 = 15, boundary) → `<= 15` → High ✓
- Score 16: Critical (4 × 4 = 16, boundary) → `> 15` → Critical ✓
- Score 25: Critical (5 × 5 = 25, maximum) → `> 15` → Critical ✓

**Residual score edge cases:**
- Residual likelihood/impact can be null (not yet set) — `getRiskSeverity` should not be called with null; guard with early return `if (!residual_likelihood || !residual_impact) return null`
- A residual score can equal the inherent score (no improvement after controls) — valid, display as-is
- A residual score could theoretically be *higher* than inherent (poor controls introduce new risk) — valid scenario, no special casing needed

---

### Q4: Treatment Overdue Logic

**Answer: Pure comparison at query time + status update in Server Action. No background job.**

[VERIFIED: date-fns v4.3.0 installed in package.json; `isPast` is a stable date-fns function]

```typescript
// Source: date-fns v4 API (stable, unchanged from v3)
// File: lib/risk/risk-utils.ts
import { isPast, parseISO } from 'date-fns'

export function isTreatmentOverdue(treatment: {
  status: string
  due_date: string  // ISO date string 'YYYY-MM-DD'
}): boolean {
  // A treatment is overdue if:
  // 1. It is not yet completed or cancelled, AND
  // 2. Its due date is in the past
  if (treatment.status === 'completed' || treatment.status === 'cancelled') return false
  return isPast(parseISO(treatment.due_date))
}
```

**Two-layer overdue strategy:**

Layer 1 — Display detection (pure JS, no DB write):
- Every time the risk register or treatment list renders, each treatment is annotated with `isOverdue = isTreatmentOverdue(t)` in the Server Component
- Used for UI highlighting — overdue treatments shown with `err` color badge
- No DB write needed for display

Layer 2 — Status persistence (Server Action, DB write):
- The `updateTreatmentStatus` Server Action checks `isTreatmentOverdue()` after every status change
- If a treatment transitions to overdue state, action:
  1. Sets `status = 'overdue'` in DB (captures in audit log)
  2. Sends Resend email to `owner_id` and manager (if manager lookup exists)
- This write happens lazily on access (when a user loads the page or explicitly saves)

**Why no background job (cron):**
- A cron job would require Vercel cron or Supabase scheduled functions — adds infrastructure complexity
- For a prototype, lazy detection (on page load) is sufficient: overdue treatments are escalated when the page is next visited by any authorized user
- Phase 8 or v2 can add a cron if needed

**`parseISO` vs `new Date()`:**
- `date-fns` `parseISO` correctly handles `'YYYY-MM-DD'` date strings
- `new Date('2026-05-15')` creates midnight UTC — may show wrong day in local timezones
- `parseISO` is the correct date-fns v4 approach [VERIFIED: date-fns v4.3.0 installed]

---

### Q5: Filter-Without-Reload Strategy

**Answer: TanStack Table v8 client-side filtering. Same pattern as Phase 2.**

[VERIFIED: package.json — `@tanstack/react-table@^8.21.3` already installed]
[VERIFIED: Phase 2 `02-RESEARCH.md` Q2 — TanStack Table v8 `getFilteredRowModel()` pattern]

**Decision: client-side filtering (not URL-based server filtering).**

Justification:
- Risk register at prototype scale will have `<500` risks per institution — easily held in memory
- Client-side filtering gives instant response (no network round-trip) with no debounce needed
- TanStack Table v8 `getFilteredRowModel()` handles multi-column filter composition out of the box
- Phase 2 already established this pattern (KPI grid, objectives table) — no new pattern needed
- URL-based server filtering would be appropriate at `>5,000` rows; not needed here

**Filter columns for RISK-08:**
- Category (`risk_category` enum): `<Select>` component
- Severity (derived from score at render time): `<Select>` with Low/Medium/High/Critical
- Owner (`owner_id` → display name): `<Select>` populated from unique owners in the data
- Status (`risk_status` enum): `<Select>` component

**Severity filtering implementation note:**
- `severity` is not stored in the DB — it's computed from `inherent_likelihood × inherent_impact`
- Add a `severity` accessor in the TanStack Table column definition that computes it on-the-fly:

```typescript
// In RiskRegisterTable.tsx column definitions
{
  id: 'severity',
  accessorFn: (row) => getRiskSeverity(calculateRiskScore(row.inherent_likelihood, row.inherent_impact)),
  header: 'Severity',
  filterFn: 'equals',
  cell: ({ getValue }) => {
    const severity = getValue<RiskSeverity>()
    const badge = RISK_SEVERITY_BADGE[severity]
    return <Badge className={badge.className}>{badge.label}</Badge>
  }
}
```

---

### Q6: Phase 2 Patterns to Reuse Exactly

**Answer: All Phase 2 patterns apply to Phase 3 unchanged. Exact file locations and function signatures.**

[VERIFIED: codebase — lib/strategic/actions.ts, lib/strategic/queries.ts, lib/schemas/strategic.ts]

#### Server Action Pattern (exact from lib/strategic/actions.ts)

```typescript
// File: lib/risk/actions.ts
'use server'  // Line 1 — mandatory

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { riskSchema, type RiskInput } from '@/lib/schemas/risk'

const RISK_ROLES = ['admin', 'risk-officer', 'ceo'] as const
const GENERIC_ERROR = 'An unexpected error occurred. If this persists, contact your administrator.'

export async function createRisk(
  values: RiskInput
): Promise<{ error: string } | { data: { id: string } }> {
  // 1. Zod parse FIRST — server is the trust boundary
  const parsed = riskSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  try {
    // 2. Authenticate — getUser() NOT getSession()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized.' }

    // 3. Role check via JWT claim — NO DB query
    const appMeta       = user.app_metadata as Record<string, string>
    const activeRole    = appMeta?.active_role
    const institutionId = appMeta?.institution_id

    if (!RISK_ROLES.includes(activeRole as typeof RISK_ROLES[number])) {
      return { error: 'You do not have permission to create risks.' }
    }

    // 4. Insert
    const { data, error } = await supabase
      .from('risks')
      .insert({ ...parsed.data, institution_id: institutionId, created_by: user.id })
      .select('id')
      .single()

    if (error) throw error

    revalidatePath('/risk')
    revalidatePath('/risk/register')
    return { data: { id: data.id } }
  } catch (err) {
    console.error('[createRisk]', err)
    return { error: GENERIC_ERROR }
  }
  // redirect() goes OUTSIDE try/catch — it throws NextRedirect internally
}
```

#### Zod Schema Pattern (exact numericField helper from lib/schemas/strategic.ts)

```typescript
// File: lib/schemas/risk.ts
// CONSTRAINT: Zod v3.x only
import { z } from 'zod'

// Reuse the numericField pattern from Phase 2 (Phase 2 SUMMARY confirmed z.coerce.number() coerces '' to 0)
const numericField = (errorMessage: string) =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.number({ invalid_type_error: errorMessage }),
  )

// Likelihood/impact: 1–5 integer
const scoreField = (label: string) =>
  numericField(`${label} must be a number.`).pipe(
    z.number().int().min(1, `${label} must be at least 1.`).max(5, `${label} must be at most 5.`)
  )

const RISK_CATEGORIES = ['strategic', 'operational', 'financial', 'compliance', 'reputational', 'technology'] as const
const RISK_STATUSES   = ['open', 'mitigated', 'accepted', 'closed', 'escalated'] as const

export const riskSchema = z.object({
  objective_id:         z.string().uuid().optional().nullable(),
  title:                z.string().min(1, 'Title is required.'),
  description:          z.string().optional(),
  category:             z.enum(RISK_CATEGORIES, { required_error: 'Category is required.' }),
  owner_id:             z.string().uuid('Owner must be a valid user.'),
  status:               z.enum(RISK_STATUSES).default('open'),
  inherent_likelihood:  scoreField('Inherent likelihood'),
  inherent_impact:      scoreField('Inherent impact'),
  residual_likelihood:  scoreField('Residual likelihood').optional().nullable(),
  residual_impact:      scoreField('Residual impact').optional().nullable(),
  mitigating_controls:  z.string().optional(),
})

export const treatmentSchema = z.object({
  risk_id:     z.string().uuid('Risk must be selected.'),
  title:       z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  owner_id:    z.string().uuid('Owner must be a valid user.'),
  due_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD.'),
  status:      z.enum(['planned', 'in_progress', 'completed', 'overdue', 'cancelled']).default('planned'),
})

export type RiskInput      = z.infer<typeof riskSchema>
export type TreatmentInput = z.infer<typeof treatmentSchema>
```

#### RLS Pattern (exact from Phase 2 — migration 20260522000008)

```sql
-- Migration: 20260522000011_risk_rls.sql
-- Pattern: identical to strategic_rls.sql
-- auth.institution_id() and auth.active_role() are SECURITY DEFINER functions from Phase 1

alter table public.risks enable row level security;
alter table public.risks force row level security;

create policy "risks_select" on public.risks
  for select to authenticated
  using (institution_id = (select auth.institution_id()));

create policy "risks_insert" on public.risks
  for insert to authenticated
  with check (
    institution_id = (select auth.institution_id())
    and (select auth.active_role()) in ('admin', 'ceo', 'risk-officer')
  );

create policy "risks_update" on public.risks
  for update to authenticated
  using (institution_id = (select auth.institution_id()))
  with check (
    institution_id = (select auth.institution_id())
    and (select auth.active_role()) in ('admin', 'ceo', 'risk-officer')
  );

alter table public.risk_treatments enable row level security;
alter table public.risk_treatments force row level security;

create policy "risk_treatments_select" on public.risk_treatments
  for select to authenticated
  using (institution_id = (select auth.institution_id()));

create policy "risk_treatments_insert" on public.risk_treatments
  for insert to authenticated
  with check (
    institution_id = (select auth.institution_id())
    and (select auth.active_role()) in ('admin', 'ceo', 'risk-officer')
  );

create policy "risk_treatments_update" on public.risk_treatments
  for update to authenticated
  using (institution_id = (select auth.institution_id()))
  with check (
    institution_id = (select auth.institution_id())
    and (
      (select auth.active_role()) in ('admin', 'ceo', 'risk-officer')
      or owner_id = auth.uid()
    )
  );
```

#### Audit Trigger Pattern (exact from Phase 2 — migration 20260522000009)

```sql
-- Migration: 20260522000012_risk_triggers.sql
select audit.attach_audit_trigger('risks');
select audit.attach_audit_trigger('risk_treatments');
```

#### Query Helper Pattern (exact from lib/strategic/queries.ts)

```typescript
// File: lib/risk/queries.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export const RISK_PAGE_SIZE = 50  // Risk register: more rows than KPI grid

export async function getRisksWithTreatments(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('risks')
    .select(`
      id,
      title,
      description,
      category,
      status,
      inherent_likelihood,
      inherent_impact,
      residual_likelihood,
      residual_impact,
      mitigating_controls,
      owner_id,
      objective_id,
      created_at,
      strategic_objectives ( id, title ),
      risk_treatments ( id, title, status, due_date, owner_id ),
      user_profiles!owner_id ( full_name )
    `)
    .order('created_at', { ascending: false })

  return { data: data ?? [], error }
}

export async function getRisksForHeatmap(supabase: SupabaseClient) {
  // Minimal query for heatmap — only fields needed to position dots
  const { data, error } = await supabase
    .from('risks')
    .select('id, title, inherent_likelihood, inherent_impact, status')
    .neq('status', 'closed')  // Closed risks excluded from live heatmap
    .order('created_at', { ascending: false })

  return { data: data ?? [], error }
}
```

---

## Architecture Patterns

### System Architecture Diagram

```
Browser Request → /risk/register (Server Component)
    │
    ├── getUser() → role check → redirect if unauth
    │
    ├── getRisksWithTreatments(supabase)
    │       └── Supabase: risks + risk_treatments + user_profiles join
    │
    └── Annotate treatments: isTreatmentOverdue(t) for each treatment
            │
            ▼ props
        RiskRegisterTable.tsx [Client Component]
            │   useReactTable(risks, columns, getFilteredRowModel, getSortedRowModel)
            │   Filter bar: category, severity (computed), owner, status
            │
            ├── RiskSeverityBadge (calculateRiskScore + getRiskSeverity)
            └── Treatment list inline per risk row (expandable)


Browser Request → /risk/heatmap (Server Component)
    │
    ├── getUser() → role check
    │
    ├── getRisksForHeatmap(supabase)  (lightweight query, no treatments join)
    │
    └── risks[] → map to { id, title, inherent_likelihood, inherent_impact, severity }
            │
            ▼ props
        RiskHeatmap.tsx [Client Component]
            │   CSS 5×5 Grid (25 pre-colored cells)
            │   Each cell: filter risks by (likelihood, impact) → render dots
            └── RiskDotTooltip [shadcn Tooltip] on hover


Risk CRUD Flow:
    RiskForm.tsx [Client Component]
        │   react-hook-form + zodResolver(riskSchema)
        │   onSubmit → createRisk(values) [Server Action]
        │
        ▼ Server Action
    lib/risk/actions.ts
        │   safeParse(values) → auth.getUser() → role check → supabase.insert()
        │   revalidatePath('/risk') + revalidatePath('/risk/register')
        │
        ▼ Postgres
    risks table → audit_events trigger (SECURITY DEFINER)


Overdue Treatment Escalation:
    updateTreatmentStatus(id, status) [Server Action]
        │   isTreatmentOverdue(treatment) === true AND status not yet 'overdue'
        │   → supabase.update({ status: 'overdue' })
        │   → resend.emails.send({ to: owner_email, ... })
        └── revalidatePath('/risk/register')
```

### Recommended File Structure (Phase 3 additions only)

```
app/(protected)/risk/
├── layout.tsx                          # Role gate (all roles view; risk-officer/admin create)
├── page.tsx                            # Risk overview — heatmap + summary counts (Server Component)
├── RiskHeatmap.tsx                     # CSS Grid 5×5 heatmap (Client Component)
├── register/
│   ├── page.tsx                        # Risk register list (Server Component)
│   ├── RiskRegisterTable.tsx           # TanStack Table v8 + filters (Client Component)
│   ├── RiskFilterBar.tsx               # Category/severity/owner/status filters (Client Component)
│   └── new/
│       ├── page.tsx                    # Shell (Server Component)
│       └── RiskForm.tsx                # Create risk form (Client Component)
└── [id]/
    ├── page.tsx                        # Risk detail + treatments list (Server Component)
    ├── edit/
    │   ├── page.tsx
    │   └── RiskEditForm.tsx
    └── treatments/
        └── new/
            ├── page.tsx
            └── TreatmentForm.tsx

lib/
├── risk/
│   ├── actions.ts                      # 'use server' — createRisk, updateRisk, scoreResidual, createTreatment, updateTreatmentStatus
│   ├── queries.ts                      # getRisksWithTreatments, getRisksForHeatmap
│   └── risk-utils.ts                   # Pure functions: calculateRiskScore, getRiskSeverity, isTreatmentOverdue, RISK_SEVERITY_BADGE, RISK_CELL_BG
└── schemas/
    └── risk.ts                         # Zod v3: riskSchema, treatmentSchema; types RiskInput, TreatmentInput

types/
└── risk.ts                             # TypeScript types: Risk, RiskTreatment, RiskCategory, RiskStatus, TreatmentStatus, RiskSeverity

tests/
└── risk/
    ├── risk-utils.test.ts              # calculateRiskScore, getRiskSeverity, isTreatmentOverdue — TDD RED/GREEN
    └── schemas.test.ts                 # riskSchema, treatmentSchema — TDD RED/GREEN

supabase/migrations/
├── 20260522000010_risk_schema.sql      # Enums + tables
├── 20260522000011_risk_rls.sql         # RLS policies
└── 20260522000012_risk_triggers.sql    # audit.attach_audit_trigger() calls
```

### RBAC Summary for Phase 3

| Action | admin | ceo | risk-officer | audit-officer | board-member | dept-head |
|--------|-------|-----|--------------|---------------|--------------|-----------|
| Create risk | Yes | Yes | Yes | No | No | No |
| Edit risk / score | Yes | Yes | Yes | No | No | No |
| View risks (register + heatmap) | Yes | Yes | Yes | Yes | Yes | Yes |
| Create treatment | Yes | Yes | Yes | No | No | No |
| Update treatment (owner) | Yes | Yes | Owner only | No | No | No |
| View treatments | Yes | Yes | Yes | Yes | Yes | Yes |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Heatmap visualization | Custom D3 SVG with circles and zones | CSS Grid (25 cells, Tailwind bg classes) | D3 requires manual scale calculations, SVG coordinate math, and viewBox management; CSS Grid achieves identical visual in ~40 lines |
| Table filtering | Manual `Array.filter()` with `useState` per column | TanStack Table v8 `getFilteredRowModel()` | Multi-column filter composition, type-safe accessors, global filter |
| Form validation | Manual field checks + error state | Zod v3 + `zodResolver` | Cross-field validation (residual ≤ inherent), type inference, coercion |
| Numeric coercion | `parseInt(value, 10)` | `numericField()` helper (z.preprocess + z.coerce.number) | Empty string → 0 in Zod v3 without the preprocess guard (confirmed in Phase 2 SUMMARY) |
| Date comparison (overdue) | `new Date() > new Date(dueDate)` manually | `date-fns isPast(parseISO(dueDate))` | `parseISO` handles timezone edge cases; `isPast` is well-tested and clear in intent |
| Audit trail | Manual INSERT in every Server Action | `audit.attach_audit_trigger()` from Phase 1 | Already exists; SECURITY DEFINER; survives app bugs |
| Email delivery | Custom SMTP | Resend (already installed, `resend@^6.12.3`) | Already in stack; React Email templates available |

**Key insight:** The CSS Grid heatmap pattern is simpler and more controllable than any charting library for a fixed discrete 5×5 matrix. The temptation to use Nivo (mentioned in STATE.md research) comes from its general heatmap capability, but Nivo's color model is continuous — wrong tool for fixed-zone risk matrices.

---

## Common Pitfalls

### Pitfall 1: Trying to Use Nivo for Fixed Severity Zones

**What goes wrong:** Developer installs `@nivo/heatmap`, passes `colors: { type: 'sequential', scheme: 'reds' }`, and gets a gradient — not fixed Low/Medium/High/Critical zone colors. Attempting to work around with `colors: { type: 'quantize' }` still produces computed color steps, not the exact hex values from Tailwind tokens.

**Why it happens:** Nivo's heatmap is designed for continuous data visualization, not discrete categorical zones. The `data.y` value drives interpolated color, not a category lookup.

**How to avoid:** Use CSS Grid (25 cells, background color determined by `RISK_CELL_BG[getRiskSeverity(score)]`). Do not install `@nivo/heatmap`.

**Warning signs:** Package install step includes `@nivo/heatmap`. Stop — not needed.

---

### Pitfall 2: Storing Computed Risk Score in the Database

**What goes wrong:** Developer adds a `risk_score integer` column to `risks` table, requiring it to be kept in sync with `inherent_likelihood × inherent_impact`. Any update to likelihood or impact must also update risk_score, or the table becomes inconsistent.

**Why it happens:** Intuition that filtering/sorting by risk score requires a stored column.

**How to avoid:** Compute score in TypeScript (`calculateRiskScore()`). TanStack Table handles sorting/filtering on the computed accessor column. If direct SQL sorting/filtering is needed (not required at prototype scale), use a Postgres generated column:

```sql
-- Optional: Postgres generated column (add only if SQL-level risk score sort needed)
inherent_score integer generated always as (inherent_likelihood * inherent_impact) stored
```

**Recommendation:** Do NOT add a generated column in Phase 3. Compute in TypeScript. Add later if Phase 8 SQL-level reporting needs it.

**Warning signs:** Migration adds a `risk_score` or `inherent_score` column that is not `generated always as`.

---

### Pitfall 3: `new Date('2026-05-15')` Timezone Off-by-One

**What goes wrong:** `new Date('2026-05-15')` creates `2026-05-15T00:00:00Z` (midnight UTC). In UTC+2 (Zimbabwe timezone), `new Date() > new Date('2026-05-15')` returns `false` on the morning of May 15th local time — treatment appears not-overdue when it is.

**Why it happens:** JavaScript `Date` parsing of ISO date strings treats them as UTC.

**How to avoid:** Always use `date-fns` `parseISO()` which parses in local time, combined with `isPast()`. The `isTreatmentOverdue()` helper in `lib/risk/risk-utils.ts` handles this correctly.

**Warning signs:** Overdue detection code contains `new Date(treatment.due_date)` directly without `parseISO`.

---

### Pitfall 4: Filtering by Severity When Severity Is Not Stored

**What goes wrong:** Developer tries to add a `severity` column to the Supabase query `select` — but severity is not in the DB. Alternatively, developer tries to filter at the DB level with `.eq('severity', 'high')` which fails because no such column exists.

**Why it happens:** Severity feels like it should be stored because it's in the UI.

**How to avoid:** Use TanStack Table `accessorFn` to derive severity from `inherent_likelihood × inherent_impact` during table render. Filter is applied by TanStack Table's `columnFilters` — no DB column needed.

**Warning signs:** Migration adds a `severity` column. RLS query adds `.eq('severity', ...)`.

---

### Pitfall 5: Residual Score Form — Score Fields Not Optional Correctly

**What goes wrong:** Zod schema makes `residual_likelihood` and `residual_impact` optional, but `scoreField()` uses `z.preprocess` + `z.coerce.number().pipe(z.number().min(1))`. When the field is empty/null/undefined, `preprocess` returns `undefined`, and the `.pipe()` chain receives `undefined` — TypeScript error or unexpected behavior.

**Why it happens:** Composing `.optional()` with a custom preprocess chain in Zod v3 requires careful ordering.

**How to avoid:** The `scoreField` in the schema must use `.optional().nullable()` at the *outer* schema level, not inside the chain:

```typescript
residual_likelihood: scoreField('Residual likelihood').optional().nullable(),
```

Because `z.preprocess` wraps the entire chain, `.optional()` on the outer level means "if no value provided, skip the preprocess entirely and return undefined." This works correctly in Zod v3.

**Warning signs:** TypeScript errors on the `residual_likelihood` Zod chain. Test for empty residual_likelihood returning schema error when it should return undefined/null.

---

### Pitfall 6: `numericField()` for scoreField — z.coerce.number() Coerces '' to 0

**What goes wrong:** Identical to Phase 2 Pitfall 5. `z.coerce.number()` converts `''` to `0` in Zod v3 (`Number('')` is `0`). A score of `0` passes the coercion but fails `.min(1)` — so the user gets a "must be at least 1" error rather than a "required" error. More confusingly, the preprocess guard converts `''` to `undefined`, then `.optional()` returns `undefined` — correct, but only if the guard is applied.

**How to avoid:** The `numericField()` helper from Phase 2 (`lib/schemas/strategic.ts`) uses `z.preprocess` to convert `''` → `undefined` before coercion. Reuse this helper for `scoreField()`. Do not use raw `z.coerce.number()` for form inputs.

**Warning signs:** Empty score field submits as 0 in the DB (score of 0 violates `CHECK (inherent_likelihood between 1 and 5)` at DB layer — will throw Supabase error).

---

### Pitfall 7: Heatmap Grid Row Order (Likelihood Axis)

**What goes wrong:** CSS Grid renders rows top-to-bottom. If developer maps row index 0 → likelihood 1, the heatmap has likelihood 1 at the TOP and likelihood 5 at the BOTTOM — the opposite of standard ERM presentation (high likelihood at top, low at bottom).

**Why it happens:** Natural grid row order is top-to-bottom; likelihood convention is bottom-to-top.

**How to avoid:** Map row 0 (top) → likelihood 5, row 4 (bottom) → likelihood 1:

```typescript
// In RiskHeatmap.tsx — correct mapping
const likelihood = 5 - rowIdx  // rowIdx 0 → L5, rowIdx 4 → L1
```

**Warning signs:** Heatmap shows Critical zone (high likelihood × high impact) at bottom-right instead of top-right.

---

### Pitfall 8: Multiple Risks in One Heatmap Cell

**What goes wrong:** Multiple risks sharing the same (likelihood, impact) cell overflow the cell div, or only the first risk is shown.

**Why it happens:** Each cell renders risk dots; if there are 5 risks at (4, 4), the cell needs to handle overflow gracefully.

**How to avoid:** Use `flex-wrap` within each cell div. Cap visible dots at 4 and show "+N more" text for overflow:

```tsx
{cell.risksInCell.slice(0, 4).map(risk => <RiskDotTooltip key={risk.id} risk={risk} />)}
{cell.risksInCell.length > 4 && (
  <span className="text-[9px] text-navy-mid">+{cell.risksInCell.length - 4}</span>
)}
```

**Warning signs:** Heatmap cells with many risks overflow their grid bounds.

---

## Code Examples

### Verified: `isTreatmentOverdue` using date-fns v4

```typescript
// Source: date-fns v4.3.0 (installed); isPast and parseISO are stable APIs unchanged from v3
// File: lib/risk/risk-utils.ts
import { isPast, parseISO } from 'date-fns'

export function isTreatmentOverdue(treatment: {
  status: string
  due_date: string
}): boolean {
  if (treatment.status === 'completed' || treatment.status === 'cancelled') return false
  return isPast(parseISO(treatment.due_date))
}
```

### Verified: TanStack Table v8 with computed severity column

```typescript
// Source: Phase 2 RESEARCH.md Q2 (TanStack Table v8 pattern — same library, same version)
// File: app/(protected)/risk/register/RiskRegisterTable.tsx
'use client'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'

type RiskRow = {
  id: string
  title: string
  category: string
  status: string
  inherent_likelihood: number
  inherent_impact: number
  owner_id: string | null
  // user_profiles join:
  user_profiles: { full_name: string } | null
}

const columns: ColumnDef<RiskRow>[] = [
  { accessorKey: 'title', header: 'Risk Title' },
  { accessorKey: 'category', header: 'Category' },
  {
    id: 'severity',
    accessorFn: (row) =>
      getRiskSeverity(calculateRiskScore(row.inherent_likelihood, row.inherent_impact)),
    header: 'Severity',
    filterFn: 'equals',
    cell: ({ getValue }) => {
      const s = getValue<RiskSeverity>()
      const b = RISK_SEVERITY_BADGE[s]
      return <Badge className={b.className}>{b.label}</Badge>
    },
  },
  { accessorKey: 'status', header: 'Status' },
]
```

### Verified: Supabase embedded join with user_profiles (Phase 2 pattern)

```typescript
// Source: lib/strategic/queries.ts (codebase — verified pattern)
// user_profiles join via FK alias — same pattern works for risks
const { data, error } = await supabase
  .from('risks')
  .select(`
    id, title, category, status,
    inherent_likelihood, inherent_impact,
    residual_likelihood, residual_impact,
    owner_id,
    strategic_objectives ( id, title ),
    risk_treatments ( id, title, status, due_date, owner_id ),
    user_profiles!owner_id ( full_name )
  `)
  .order('created_at', { ascending: false })
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Store computed risk score in DB column | Compute score in TypeScript (never store) | Standard for prototype ERM systems | Eliminates sync bugs; score always correct |
| Background cron for overdue detection | Lazy detection at query time + status write in Server Action | Current approach for serverless | No scheduler infrastructure needed for prototype |
| Nivo for all heatmaps | CSS Grid for fixed discrete-zone matrices; Nivo for continuous data heatmaps | Research finding for this phase | Correct tool for the problem; saves ~500KB bundle |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Residual and inherent scores belong as columns on the `risks` table (not a separate `risk_scores` table) | Q1 Schema | If historical score tracking per risk per date is needed (v2), a separate table is required — minor schema refactor, not a data loss scenario |
| A2 | `overdue` as a stored `treatment_status` value (not just a computed property) is the right design | Q4 Overdue Logic | If audit trail of overdue transitions is not required, the `overdue` enum value is unnecessary — could simplify to computing overdue at query time only. Risk: low, since STATUS.md explicitly mentions overdue escalation |
| A3 | `risk-officer` role can create, edit, and score risks (including ceo and admin) | Q6 RBAC | If organization policy restricts risk creation to admin/ceo only (same as strategic objectives), the Server Action RBAC and RLS policies need tightening — this is a product decision, not a technical one |
| A4 | The CSS Grid heatmap renders correctly without `@nivo/heatmap` | Q2 Heatmap | Nivo was named in project research as the heatmap library. CSS Grid achieves the same visual with less complexity. If project stakeholders require Nivo for Phase 8 PDF export compatibility, Nivo may need to be installed later — but not for Phase 3 |
| A5 | `date-fns@4.3.0` `isPast` and `parseISO` APIs are compatible with `@types/react-dom` installed (React 18.x) | Q4 Overdue | date-fns v4 is a pure JS library with no React dependency — confirmed compatible. Risk: negligible |

---

## Open Questions (RESOLVED)

1. **Should `risk-officer` be able to create risks without approval?**
  - **RESOLVED:** Yes. Write access includes `admin`, `ceo`, and `risk-officer` for risk and treatment workflows in Phase 3.
  - Basis: Phase goal centers risk officers operating ERM workflows; plan actions and RLS policies enforce this role set.

2. **Overdue notification recipient — who is the "manager"?**
  - **RESOLVED:** Phase 3 escalates to treatment owner and institution-level managers represented by active `ceo` users in the same institution.
  - Basis: No `manager_id` relationship exists in current schema; `ceo` is the concrete manager proxy for v1.

3. **Residual score UX — update on same form or separate step?**
  - **RESOLVED:** Residual score is editable during risk edit and available as a distinct action path from risk detail.
  - Basis: Supports post-control reassessment workflow while avoiding create-form bloat.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@tanstack/react-table` | Risk register filtering (RISK-08) | ✓ | 8.21.3 | — |
| `date-fns` | Overdue detection (RISK-05, RISK-07) | ✓ | 4.3.0 | — |
| `resend` | Treatment escalation emails (RISK-07) | ✓ | 6.12.3 | — |
| `zod` | Schema validation | ✓ | 3.25.76 | — |
| `react-hook-form` | Risk + treatment forms | ✓ | 7.76.0 | — |
| `vitest` | Unit tests | ✓ | 4.1.7 (devDep) | — |
| Supabase project | DB migrations | Assumed ✓ | — | Local `supabase start` |

**No missing dependencies.** All required packages are already installed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.7 (config: `vitest.config.ts`) |
| Environment | jsdom |
| Setup file | `tests/setup.ts` |
| Quick run command | `npm test -- tests/risk/` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RISK-04 | `calculateRiskScore(L, I)` = L × I for all 25 matrix positions | unit | `npm test -- tests/risk/risk-utils.test.ts` | ❌ Wave 0 |
| RISK-04 | `getRiskSeverity(score)` boundary cases: 4→Low, 5→Medium, 9→Medium, 10→High, 15→High, 16→Critical, 25→Critical | unit | `npm test -- tests/risk/risk-utils.test.ts` | ❌ Wave 0 |
| RISK-03 | Residual score null → `getRiskSeverity(null, null)` returns null | unit | `npm test -- tests/risk/risk-utils.test.ts` | ❌ Wave 0 |
| RISK-05 | `isTreatmentOverdue({ status:'completed', due_date:'2020-01-01' })` → false | unit | `npm test -- tests/risk/risk-utils.test.ts` | ❌ Wave 0 |
| RISK-05 | `isTreatmentOverdue({ status:'planned', due_date:'2020-01-01' })` → true | unit | `npm test -- tests/risk/risk-utils.test.ts` | ❌ Wave 0 |
| RISK-05 | `isTreatmentOverdue({ status:'in_progress', due_date: futureDate })` → false | unit | `npm test -- tests/risk/risk-utils.test.ts` | ❌ Wave 0 |
| RISK-01 | `riskSchema.safeParse(validRisk)` → success | unit | `npm test -- tests/risk/schemas.test.ts` | ❌ Wave 0 |
| RISK-01 | `riskSchema.safeParse({ ...valid, inherent_likelihood: 0 })` → fail (min 1) | unit | `npm test -- tests/risk/schemas.test.ts` | ❌ Wave 0 |
| RISK-01 | `riskSchema.safeParse({ ...valid, inherent_likelihood: 6 })` → fail (max 5) | unit | `npm test -- tests/risk/schemas.test.ts` | ❌ Wave 0 |
| RISK-01 | `riskSchema.safeParse({ ...valid, inherent_likelihood: '' })` → fail (empty) | unit | `npm test -- tests/risk/schemas.test.ts` | ❌ Wave 0 |
| RISK-03 | `riskSchema.safeParse({ ...valid, residual_likelihood: null })` → success (nullable) | unit | `npm test -- tests/risk/schemas.test.ts` | ❌ Wave 0 |
| RISK-05 | `treatmentSchema.safeParse({ ...valid, due_date: 'not-a-date' })` → fail | unit | `npm test -- tests/risk/schemas.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- tests/risk/risk-utils.test.ts tests/risk/schemas.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/risk/risk-utils.test.ts` — covers RISK-04, RISK-05 pure functions (all branches + edge cases)
- [ ] `tests/risk/schemas.test.ts` — covers RISK-01/02/03/05 Zod schemas (valid inputs, invalid inputs, boundary values)
- No new framework installs needed — Vitest already configured

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Handled in Phase 1 |
| V3 Session Management | No | Handled in Phase 1 |
| V4 Access Control | Yes | RLS policies + JWT role check in every Server Action; risk-officer, admin, ceo only |
| V5 Input Validation | Yes | Zod v3 `safeParse()` before every DB write; `scoreField()` validates 1–5 range |
| V6 Cryptography | No | No new crypto in Phase 3 |

### Known Threat Patterns for This Phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Horizontal privilege escalation (reading other institution's risks) | Information Disclosure | RLS `institution_id = (select auth.institution_id())` on `risks` and `risk_treatments` |
| Role spoofing (dept-head creating risks) | Elevation of Privilege | JWT claim check `active_role in ('admin', 'ceo', 'risk-officer')` in Server Action before insert |
| Score tampering (injecting likelihood=0 or likelihood=6) | Tampering | Zod `scoreField()` enforces 1–5 range; Postgres `CHECK (inherent_likelihood between 1 and 5)` at DB layer |
| Mass assignment (extra fields in risk form POST) | Tampering | Zod `safeParse()` strips unknown fields — only `parsed.data` reaches Supabase |
| Audit bypass on risk score update | Repudiation | `audit.attach_audit_trigger('risks')` captures every UPDATE including score changes at SECURITY DEFINER layer |
| Email spoofing — overdue notifications from wrong sender | Spoofing | Resend enforces `from:` domain verification; use configured Resend sender domain |

---

## Sources

### Primary (HIGH confidence)

- **package.json (codebase)** — All installed packages verified: date-fns 4.3.0, recharts 3.8.1, @tanstack/react-table 8.21.3, resend 6.12.3 — 2026-05-23
- **lib/strategic/actions.ts (codebase)** — Server Action pattern verified: `'use server'`, `safeParse` first, `getUser()`, JWT claims role check, `{ error } | { data }` return shape
- **lib/schemas/strategic.ts (codebase)** — `numericField()` preprocess pattern verified; Phase 2 SUMMARY confirmed Zod v3 `z.coerce.number()` coerces `''` to `0`
- **lib/strategic/queries.ts (codebase)** — Embedded Supabase join pattern with `user_profiles!owner_id (full_name)` verified
- **supabase/migrations/20260522000008_strategic_rls.sql (codebase)** — RLS policy pattern verified: `alter table ... force row level security`, `(select auth.institution_id())` caching pattern
- **tailwind.config.ts (codebase)** — Color tokens verified: `ok: #27AE60`, `warn: #E67E22`, `err: #E74C3C`, `paper-border: #D7E2EF`
- **npm registry** — `@nivo/heatmap@0.99.0` (latest), `date-fns@4.3.0` (latest), confirmed via `npm view`
- **Context7 /plouc/nivo** — Nivo HeatMap docs verified: `colors: { type: 'sequential' | 'diverging' | 'quantize' }` — no fixed discrete zone support

### Secondary (MEDIUM confidence)

- **Phase 2 RESEARCH.md (02-RESEARCH.md)** — TanStack Table v8 patterns, Recharts sparkline, Supabase embedded join approach — all verified in Phase 2 implementation
- **Phase 2 02-02-SUMMARY.md** — `numericField()` pattern and Zod v3 coercion behavior confirmed via actual test failures and fixes during Phase 2 execution
- **Phase 2 02-03-SUMMARY.md** — Server Action pattern, query helper pattern, test UUIDs convention confirmed via Phase 2 execution

### Tertiary (LOW confidence)

- Residual score as columns (not separate table) — [ASSUMED] standard ERM schema practice; not verified against an authoritative ERM data model reference
- `risk-officer` RBAC for risk creation — [ASSUMED] from requirement wording "user can create" + role name semantics; not confirmed by explicit user decision

---

## Metadata

**Confidence breakdown:**
- Schema design: HIGH — follows Phase 1 and Phase 2 patterns exactly; verified from codebase conventions
- CSS Grid heatmap: HIGH — Nivo limitation verified from Context7; CSS Grid approach is straightforward
- Scoring logic: HIGH — thresholds locked in REQUIREMENTS.md; all 25 matrix positions covered
- Overdue detection: HIGH — date-fns APIs verified as installed; pure function approach tested in Phase 2
- TanStack Table filtering: HIGH — same library already installed and used in Phase 2
- Phase 2 pattern reuse: HIGH — verified from actual implemented files in codebase
- RBAC for risk creation: MEDIUM — assumed risk-officer can create; not explicitly confirmed by user

**Research date:** 2026-05-23
**Valid until:** 2026-07-23 (stable libraries; TanStack Table v8 and date-fns v4 change slowly)
