# Phase 14: Advanced Analytics — Forecasting, Anomaly Detection, and Data Export - Research

**Researched:** 2026-05-25
**Domain:** TypeScript analytics utilities, Recharts ComposedChart, Vercel Cron, Resend React Email, Supabase CSV export
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Forecast Visualization**
- Separate `ForecastChart` client component — keeps existing KPI/KRI detail pages clean and isolates Recharts client boundary
- Full detail chart (200px with x-axis labels) on detail pages — readable forecast band visible alongside historical trend
- `ReferenceArea` shaded band for forecast range (high/low linear regression bounds) — visually clear uncertainty range
- 4 readings minimum before showing forecast (per spec); hide forecast section entirely if insufficient data (no empty state noise)

**Anomaly Detection Architecture**
- Vercel Cron via `vercel.json` + POST route at `/api/analytics/anomaly-detect` — matches existing cron pattern from `auto-findings` route
- Notify metric owner + all institution admins — ensures governance visibility even if owner is unavailable
- New `AnomalyAlertEmail` React Email template following existing Resend pattern (`noreply@grcnexus.gov.zw`) — polished, consistent with role notification emails
- Threshold hardcoded at 2 standard deviations from trailing 6-period mean (per spec) — no UI complexity needed

**Analytics Export Admin Page**
- Page at `/admin/analytics-export` — grouped with existing admin tools, no new top-level nav section
- Per-module download button layout in a table — one row per module, mirrors existing audit export UX
- Accordion section below download buttons for API documentation — no extra routing, keeps everything on one page
- Admin-only role guard — consistent with existing `/api/audit/export` role restriction pattern

**Linear Regression Algorithm**
- Period index encoding (0, 1, 2...) for x-axis — simpler math, avoids date parsing edge cases across KPI frequencies
- 2 forecast periods ahead (per spec) — forecast points at index n+1 and n+2 beyond last reading
- Pure TS utility at `lib/analytics/forecast.ts` — testable, reusable for both KPI and KRI detail pages
- Hide forecast section entirely when fewer than 4 readings exist — no "insufficient data" message clutter

### Claude's Discretion
- Specific CSV column names and ordering per module
- Exact Recharts chart margins and axis label formatting on ForecastChart
- React Email template design/layout for AnomalyAlertEmail
- Which Supabase tables to query for each module export (use RLS-respecting user client for exports)
- Error handling and retry logic within the cron route

### Deferred Ideas (OUT OF SCOPE)
- Configurable anomaly threshold per metric (extra DB column + UI — out of spec for this phase)
- Forecasting for other modules beyond KPI/KRI (e.g., compliance obligation trends)
- Webhook push of anomaly alerts to Slack/Teams
- Historical anomaly log page in admin
- Aggregate/cross-institution analytics (multi-tenant — deferred to post-prototype)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRIDGE-ANA-01 | KPI and KRI detail pages display a linear regression forecast band for next 2 periods (4-reading minimum), rendered as Recharts ReferenceArea | `lib/analytics/forecast.ts` pure TS utility pattern; Recharts ComposedChart + ReferenceArea props verified |
| BRIDGE-ANA-02 | Daily cron detects KPI/KRI readings that deviate >2σ from trailing 6-period mean; inserts notifications + sends Resend emails to metric owner and admins | Vercel Cron GET pattern documented; dedup via idempotency window researched; SourceModule='analytics' required |
| BRIDGE-ANA-03 | Admin can download structured CSV export for 9 modules from `/admin/analytics-export`; RLS-scoped via user client | All 9 table schemas verified in migrations; export route pattern from `/api/audit/export` confirmed |
| BRIDGE-ANA-04 | Analytics Export page documents available endpoints and data schemas (accordion) | shadcn accordion not yet installed; install command confirmed |
</phase_requirements>

---

## Summary

Phase 14 delivers three analytics capabilities entirely within the existing Next.js 14 + Supabase + Recharts stack — no external Python/R runtime required. The forecast band uses a hand-rolled pure TypeScript linear regression utility (period index encoding) whose output feeds a Recharts `ComposedChart` with `ReferenceArea`. The anomaly detection cron follows the existing `kri-alert` service pattern: a POST route guarded by `x-cron-secret`, triggered daily, querying both `kpi_readings` and `kri_readings` tables, computing 6-period trailing mean and standard deviation per metric, and alerting via Resend + notification inserts. The CSV export page mirrors the `/api/audit/export` pattern exactly, returning `text/csv` via authenticated user-client RLS.

**Critical finding: Vercel's native cron sends GET requests** with `Authorization: Bearer {CRON_SECRET}`, not POST with `x-cron-secret`. However, the locked CONTEXT.md decision says "matches existing cron pattern from `auto-findings` route" — which is a POST with `x-cron-secret`. The existing `kri/alert` and `kci/alert` routes both use POST + `x-cron-secret` because they are triggered by Supabase pg_cron, not Vercel native cron. The anomaly-detect route must use POST + `x-cron-secret` to match the existing pattern, which means vercel.json cron will send a GET and the actual invocation will need a compatible setup — OR the `vercel.json` defines a cron that triggers a GET route which internally POSTs to the detection logic. See Open Questions.

ESG schema (`esg_metrics`, `esg_readings`) is confirmed present in migration `20260528000001_esg_schema.sql`. Phase 12 migration exists. ESG export can proceed normally — no graceful fallback needed for missing table.

**Primary recommendation:** Implement in 3 clean waves: (1) `lib/analytics/forecast.ts` utility + `ForecastChart` component + detail page integrations; (2) anomaly cron route + `AnomalyAlertEmail` template + migration for `analytics` SourceModule; (3) `/admin/analytics-export` page + 9 export routes + accordion API docs.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Linear regression calculation | API / Backend (lib utility) | — | Pure TS utility called from server component; no client-side math |
| ForecastChart rendering | Browser / Client | Frontend Server (SSR data fetch) | Recharts requires 'use client'; data passed as props from server component |
| KPI/KRI detail page data fetch | Frontend Server (SSR) | Database / Storage | Server component queries Supabase with RLS; passes readings to ForecastChart |
| Anomaly detection computation | API / Backend (cron route) | Database / Storage | Statistical computation runs server-side in cron POST handler |
| Anomaly notification insert | Database / Storage | API / Backend | `insertNotification()` helper writes via admin client; RLS bypassed intentionally |
| Anomaly email dispatch | API / Backend (cron route) | — | Resend called server-side only; never in browser |
| CSV export (user RLS) | API / Backend (GET route) | Database / Storage | User Supabase client enforces institution_id scoping via RLS automatically |
| Analytics Export page | Frontend Server (SSR) | Browser / Client | Server component renders table + accordion; download links are plain `<a>` tags |
| Admin role gate | Frontend Server (SSR) | — | `app/(protected)/admin/layout.tsx` handles redirect for non-admins already |

---

## Standard Stack

### Core (All Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.1 | ComposedChart + ReferenceArea + ReferenceLine for ForecastChart | Already installed; v3 is current [VERIFIED: npm registry] |
| @react-email/components | ^1.0.12 | AnomalyAlertEmail template components | Already installed; matches existing RoleAssignmentEmail pattern [VERIFIED: package.json] |
| resend | 6.12.3 | Email dispatch for anomaly alerts | Already installed; project standard [VERIFIED: package.json] |
| @supabase/ssr | ^0.10.3 | Authenticated user client for RLS-scoped CSV exports | Already installed; project standard [VERIFIED: package.json] |
| @supabase/supabase-js | ^2.106.1 | Admin client for anomaly cron (bypasses RLS) | Already installed [VERIFIED: package.json] |

### New shadcn Component Required
| Component | Version | Purpose | Install |
|-----------|---------|---------|---------|
| accordion | latest (shadcn) | Collapsible API docs section on export page | `npx shadcn add accordion` — installs `@radix-ui/react-accordion@1.2.12` |

**No new npm packages needed.** All dependencies are already in `package.json`.

### Installation (shadcn only)
```bash
npx shadcn add accordion
```

This creates `components/ui/accordion.tsx` using the installed `@radix-ui/react-accordion` package. [VERIFIED: @radix-ui/react-accordion 1.2.12 is current per npm registry]

---

## Architecture Patterns

### System Architecture Diagram

```
[KPI/KRI Detail Page — Server Component]
        |
        | fetch readings (Supabase user client, RLS)
        v
[kpi_readings / kri_readings tables]
        |
        | pass readings[] to ForecastChart as props
        v
[ForecastChart — Client Component]
        |
        | calls lib/analytics/forecast.ts linearRegression()
        v
[Recharts ComposedChart]
        ├── Line (historical readings — status color)
        ├── ReferenceArea (forecast band — gold, y1=lower, y2=upper)
        └── ReferenceLine (target value — dashed)

─────────────────────────────────────────────────────

[Vercel Cron — daily GET to /api/analytics/anomaly-detect]
  *** NOTE: See Open Question 1 — this conflicts with POST pattern ***
        |
        v
[/api/analytics/anomaly-detect — POST route with x-cron-secret guard]
        |
        | query last 6 readings per kpi_id / kri_id (admin client)
        v
[kpi_readings grouped by kpi_id]
[kri_readings grouped by kri_id]
        |
        | compute mean + stddev; flag readings > 2σ
        v
[Anomalous readings set]
        |
        ├── insertNotification() for owner + each admin
        └── Resend AnomalyAlertEmail to owner + admins

─────────────────────────────────────────────────────

[/admin/analytics-export — Server Component (admin layout gate)]
        |
        v
[Module table — 9 rows with <a> download links]
[Accordion — 9 items, API schema docs]

[Browser clicks "Download CSV" → GET /api/analytics/export/[module]]
        |
        | createClient() user Supabase client (RLS active)
        v
[risks / kpis / kri_definitions / kci_definitions /
 compliance_obligations / audit_findings / incident_cases /
 board_action_items / esg_metrics tables]
        |
        | build CSV string
        v
[Response('text/csv', Content-Disposition: attachment)]
```

### Recommended Project Structure
```
lib/
├── analytics/
│   └── forecast.ts          # linearRegression(), forecastPoints() — pure TS, no deps
components/
├── analytics/
│   └── ForecastChart.tsx    # 'use client', Recharts ComposedChart
app/
├── api/
│   └── analytics/
│       ├── anomaly-detect/
│       │   └── route.ts     # POST, x-cron-secret guard, admin client
│       └── export/
│           └── [module]/
│               └── route.ts # GET, user client RLS, CSV response
├── (protected)/
│   └── admin/
│       └── analytics-export/
│           └── page.tsx     # Server component, admin-gated via layout.tsx
lib/
└── email/
    └── templates/
        └── AnomalyAlertEmail.tsx  # React Email template
vercel.json                  # Root — new file; crons definition
```

### Pattern 1: Linear Regression Utility (Pure TypeScript)

**What:** Compute slope + intercept via ordinary least squares on period-indexed numeric arrays.
**When to use:** Called server-side within the KPI/KRI detail page server component before passing data to ForecastChart.

```typescript
// Source: lib/analytics/forecast.ts (new file)
// Period index encoding: index 0..n-1 for historical, n and n+1 for forecast

export function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length
  const xMean = (n - 1) / 2  // mean of indices 0..n-1
  const yMean = values.reduce((s, v) => s + v, 0) / n

  let numerator = 0
  let denominator = 0
  for (let i = 0; i < n; i++) {
    numerator   += (i - xMean) * (values[i] - yMean)
    denominator += (i - xMean) ** 2
  }

  const slope     = denominator === 0 ? 0 : numerator / denominator
  const intercept = yMean - slope * xMean
  return { slope, intercept }
}

// Returns forecast band for next `horizon` periods (uncertainty = residual std dev)
export function forecastPoints(
  readings: number[],
  horizon: number,
): { lower: number; upper: number }[] {
  const { slope, intercept } = linearRegression(readings)
  const n = readings.length

  // Residual std dev as uncertainty measure
  const residuals = readings.map((v, i) => v - (intercept + slope * i))
  const residualMean = residuals.reduce((s, r) => s + r, 0) / n
  const residualStd  = Math.sqrt(
    residuals.reduce((s, r) => s + (r - residualMean) ** 2, 0) / n
  )

  return Array.from({ length: horizon }, (_, h) => {
    const predicted = intercept + slope * (n + h)
    return {
      lower: predicted - residualStd,
      upper: predicted + residualStd,
    }
  })
}
```

**Source:** [ASSUMED] — OLS formula is mathematical standard; code pattern is original.

### Pattern 2: Recharts ComposedChart + ReferenceArea (ForecastChart)

**What:** Combine historical readings line with a shaded forecast band using `ReferenceArea`.
**When to use:** Client component; receives pre-computed forecast data as props from server component.

```typescript
// Source: components/analytics/ForecastChart.tsx
// Based on existing KpiSparkline.tsx pattern + verified Recharts ReferenceArea API
// [CITED: https://recharts.github.io/en-US/api/ReferenceArea/]

'use client'
import {
  ComposedChart, Line, ReferenceArea, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// data shape: historical periods have value, forecast periods have value=null
// forecastBand: { lower, upper } — single band spanning both forecast periods
// The ReferenceArea y1/y2 are chart-domain values (not pixels) — Recharts handles conversion
export function ForecastChart({ data, forecastBand, targetValue, statusColor }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#D7E2EF" />
        <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#3A5270' }} />
        <YAxis tick={{ fontSize: 11, fill: '#3A5270' }} width={40} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
        <ReferenceLine
          y={targetValue}
          strokeDasharray="4 2"
          stroke="#3A5270"
          strokeOpacity={0.6}
        />
        <ReferenceArea
          y1={forecastBand.lower}
          y2={forecastBand.upper}
          fill="#C8A44A"
          fillOpacity={0.15}
          stroke="#C8A44A"
          strokeOpacity={0.4}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={statusColor}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}  // matches KpiSparkline.tsx pattern
          connectNulls={false}       // forecast periods (null values) break the line
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
```

**Key detail:** `ReferenceArea` with `y1`/`y2` uses chart-domain values. Recharts computes pixel positions internally. `fillOpacity` and `strokeOpacity` are separate props. [CITED: recharts.github.io/en-US/api/ReferenceArea/]

### Pattern 3: Anomaly Detection Cron Route

**What:** POST route + admin client + per-metric stddev computation + notification insert + Resend email.
**When to use:** Invoked daily from Vercel Cron (via GET that hits a wrapper) or pg_cron POST with `x-cron-secret`.

```typescript
// Source: app/api/analytics/anomaly-detect/route.ts
// Dedup strategy: 25-hour window (same as lib/risk/kri-alert.ts) — NO separate table needed
// [VERIFIED: existing kri-alert.ts uses this exact pattern successfully]

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = createAdminClient()

  // Query last 6+ readings per metric, compute stats
  // Flag readings where |value - mean| > 2 * stddev
  // insertNotification() for owner + admins per institution
  // Resend AnomalyAlertEmail to each recipient
}
```

**Deduplication:** Use same 25-hour lookback window as `kri-alert.ts`. Query only readings with `recorded_at > now() - interval '25 hours'`. No separate `anomaly_alerts` table needed — readings are only "new" once in the 25h window. [VERIFIED: pattern from lib/risk/kri-alert.ts lines 42-44]

### Pattern 4: RLS-Scoped CSV Export Route

**What:** GET route using authenticated user Supabase client; institution scoping via RLS.
**When to use:** All 9 module export routes — identical structure, different table + columns.

```typescript
// Source: app/api/analytics/export/[module]/route.ts
// Mirrors app/api/audit/export/route.ts exactly
// [VERIFIED: app/api/audit/export/route.ts]

export async function GET(request: NextRequest, { params }: { params: { module: string } }) {
  const supabase = await createClient()   // user client — RLS active
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const appMeta = user.app_metadata as Record<string, string>
  if (appMeta?.active_role !== 'admin') {
    return new Response('Forbidden', { status: 403 })
  }

  // query relevant table, build CSV string
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="grc-nexus-${params.module}-${Date.now()}.csv"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  })
}
```

### Pattern 5: Vercel Cron Configuration (vercel.json)

**What:** Project-root `vercel.json` with `crons` array defining the daily anomaly detection schedule.
**When to use:** This file does not exist yet — must be created.

```json
// Source: vercel.json (root of project — NEW FILE)
// [CITED: https://vercel.com/docs/cron-jobs]
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/analytics/anomaly-detect",
      "schedule": "0 6 * * *"
    }
  ]
}
```

**CRITICAL NOTE:** Vercel's native cron sends a **GET request** with `Authorization: Bearer {CRON_SECRET}`. [CITED: vercel.com/docs/cron-jobs/manage-cron-jobs]. The existing `auto-findings` and `kri/alert` routes use POST with `x-cron-secret` because they rely on Supabase pg_cron calling the endpoint externally. See Open Question 1 for resolution options.

### Anti-Patterns to Avoid

- **Using `createAdminClient()` for CSV exports:** Admin client bypasses RLS, leaking cross-institution data. Use `createClient()` (user client) for all module exports. [VERIFIED: CONTEXT.md decision; audit/export/route.ts confirmed user client pattern]
- **Calling `forecastPoints()` client-side in ForecastChart:** Linear regression must run server-side; pass computed `forecastBand` as props. Client components should only render, not compute.
- **Using `adminClient.auth.admin.listUsers()` for recipient lookup in anomaly cron:** This loads ALL users. Use targeted `user_profiles` query by `institution_id` + `active_role`, then per-user auth lookup. [VERIFIED: kri-alert.ts uses this pattern]
- **ReferenceArea x1/x2 instead of y1/y2:** Forecast band is a horizontal Y range. Use `y1`/`y2` only.
- **Not handling stddev of zero:** If all 6 readings are identical, stddev = 0 and the deviation check would never trigger. Guard: `if (stddev === 0) continue`.

---

## Critical Investigation Results

### Q1: Does anomaly cron need a deduplication table?

**Answer: No separate table needed.** [VERIFIED: lib/risk/kri-alert.ts]

The existing KRI alert service uses a time-window dedup: query only readings with `recorded_at > now() - interval '25 hours'`. A reading that triggered an anomaly alert will not appear again in the next day's 25h window (it was created before that window opens). This is the project's established dedup pattern — no `last_alerted_at` column, no separate table.

The anomaly detection logic should similarly query `kpi_readings` and `kri_readings` where `recorded_at > now() - interval '25 hours'`, compute 6-period trailing stats, and only alert on readings within this fresh window.

### Q2: ESG metrics table status

**Answer: Table exists and is fully migrated.** [VERIFIED: supabase/migrations/20260528000001_esg_schema.sql]

`esg_metrics` and `esg_readings` tables are created in migration `20260528000001_esg_schema.sql` with full RLS policies. The ESG export route can query normally — no graceful fallback for missing tables needed.

### Q3: Recharts ComposedChart + ReferenceArea in existing codebase

**Answer: No existing ComposedChart in codebase.** [VERIFIED: codebase grep returned no matches]

Existing charts are `LineChart` (KpiSparkline, IndicatorSparkline) only. The `ForecastChart` will be the first `ComposedChart` + `ReferenceArea` usage. The Recharts API for these is confirmed: `y1`/`y2` accept chart-domain values, `fillOpacity`/`strokeOpacity` are separate props, and `ReferenceArea` is explicitly listed as compatible with `ComposedChart`. [CITED: recharts.github.io/en-US/api/ReferenceArea/]

### Q4: SourceModule for anomaly notifications

**Answer: Add `'analytics'` to the `SourceModule` union type.** [VERIFIED: types/notifications.ts]

Current `SourceModule` = `'risk' | 'compliance' | 'kri' | 'kci' | 'audit' | 'incident' | 'board' | 'system'`. `'analytics'` is not in the union. The database `notifications.source_module` column is typed as `text` (no enum constraint), so it accepts any string. [VERIFIED: supabase/migrations/20260527000001_notifications_schema.sql — column is `text`, no CHECK constraint].

Action required: Add `'analytics'` to the TypeScript `SourceModule` union in `types/notifications.ts` and add `SOURCE_MODULE_LABELS` entry.

### Q5: CRON_SECRET pattern — exact header

**Answer: Existing routes use `x-cron-secret` header (NOT Vercel's native `Authorization: Bearer` pattern).** [VERIFIED: app/api/audit/auto-findings/route.ts line 9; app/api/kri/alert/route.ts line 22]

The established pattern:
```typescript
const secret = req.headers.get('x-cron-secret')
if (!secret || secret !== process.env.CRON_SECRET) { ... }
```

Vercel's native cron sends `Authorization: Bearer {CRON_SECRET}`. The existing routes expect `x-cron-secret`. These are incompatible unless the anomaly-detect route handles BOTH headers or uses Vercel's native format.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email HTML templates | Custom HTML string interpolation | `@react-email/components` | Existing pattern; handles CSS-in-JS for email clients; prevents XSS via React rendering |
| CSV escaping | Manual string replace | Proper field quoting pattern from `audit/export/route.ts` | Commas and quotes in data will corrupt CSV rows; existing route handles this correctly |
| RLS-scoped data access | Admin client queries with manual `institution_id` filter | `createClient()` user Supabase client | RLS enforces institution scoping automatically; admin client bypasses it (security risk) |
| Linear regression | External library (ml-regression, mathjs) | Pure TS 20-line implementation | No external dep needed; simple OLS for 4-6 points; existing stack has no math library |
| Admin role check on export page | Custom auth logic in page component | `app/(protected)/admin/layout.tsx` | Layout already redirects non-admins to `/dashboard`; no per-page auth code needed |

**Key insight:** This phase adds zero new npm dependencies (except the shadcn accordion UI component). All computation is achievable with plain TypeScript math on arrays of 4-6 numbers.

---

## Common Pitfalls

### Pitfall 1: Vercel Cron Uses GET, Existing Routes Use POST

**What goes wrong:** `vercel.json` cron triggers a GET request to `/api/analytics/anomaly-detect`, but the route exports only `POST`. The cron runs, gets a 405 Method Not Allowed, and logs an error. No anomalies are ever detected.

**Why it happens:** Vercel's native cron system always sends GET requests. [CITED: vercel.com/docs/cron-jobs]. The existing `auto-findings` and `kri/alert` routes are POST because they are triggered by Supabase pg_cron (external POST), not Vercel cron.

**How to avoid:** Two options:
1. Export `GET` handler in `anomaly-detect/route.ts` and check `Authorization: Bearer {CRON_SECRET}` header
2. Export `POST` handler and set up Supabase pg_cron to call it (matching existing pattern)

The CONTEXT.md decision says "matches existing cron pattern from `auto-findings` route" — implying POST + `x-cron-secret`. If using `vercel.json`, the route needs to export a `GET` handler with `Authorization: Bearer` check. See Open Question 1.

**Warning signs:** Cron job shows 405 errors in Vercel runtime logs.

### Pitfall 2: Standard Deviation With Fewer Than 6 Readings

**What goes wrong:** The anomaly detection queries "last 6 readings" but a metric may have only 2-3. Computing stddev on 2 values gives an inflated, unreliable result that triggers false positives.

**Why it happens:** Guard condition not implemented.

**How to avoid:** Skip anomaly check for any metric with fewer than 3 readings (minimum for meaningful stddev). If the trailing window has < 3 readings, skip without alerting.

**Warning signs:** Admins receive anomaly alerts for every new KPI/KRI that just recorded its first reading.

### Pitfall 3: ForecastChart Forecast Band Not Appearing

**What goes wrong:** The `ReferenceArea` renders but is invisible, or the chart shows no band.

**Why it happens:** `y1` and `y2` must be within or near the YAxis domain. If the forecast band values fall outside the chart's auto-computed domain, Recharts clips them. Also: `fillOpacity` default is 0.5 not 0.15 — if omitted, the band may look too heavy.

**How to avoid:** Set `ifOverflow="visible"` or `ifOverflow="extendDomain"` on `ReferenceArea` to allow the band to extend the Y domain. Always pass explicit `fillOpacity={0.15}`.

**Warning signs:** Chart renders with no visible gold band.

### Pitfall 4: CSV Rows With Embedded Commas or Quotes

**What goes wrong:** A risk title like `"Cybersecurity, network breach"` breaks the CSV row, splitting it into two columns.

**Why it happens:** CSV fields with commas must be double-quoted; double quotes inside fields must be escaped as `""`.

**How to avoid:** Wrap all string fields in double quotes and escape internal quotes: `JSON.stringify(e.metadata).replace(/"/g, '""')`. Follow the exact CSV-building pattern from `app/api/audit/export/route.ts` lines 71-82. [VERIFIED: audit/export/route.ts]

**Warning signs:** Downloaded CSV opens in Excel with misaligned columns.

### Pitfall 5: ForecastChart in SSR Context

**What goes wrong:** `ForecastChart` imports Recharts which requires browser APIs (SVG). Placing it in a server component causes a "window is not defined" error at build time.

**Why it happens:** Recharts renders SVG elements that depend on browser DOM.

**How to avoid:** `'use client'` directive at top of `ForecastChart.tsx`. Do NOT dynamic-import with `ssr: false` — the existing `KpiSparkline.tsx` uses `'use client'` directly and that is the established pattern. [VERIFIED: KpiSparkline.tsx line 1]

**Warning signs:** Build error mentioning `window is not defined` in recharts module.

### Pitfall 6: ESG Export — Joined Table Column

**What goes wrong:** The ESG export query joins `esg_metrics` with `esg_readings` but returns duplicate column names (`id`, `institution_id`, `created_at` appear in both tables).

**Why it happens:** Supabase PostgREST returns columns with ambiguous names unless explicitly aliased.

**How to avoid:** Use explicit column selection in the Supabase query, aliasing joined columns: e.g. `esg_metrics(id, name, category, metric_code, unit, target_value), esg_readings(id, period_label, actual_value, notes, created_at)`.

---

## Code Examples

### Verified: AnomalyAlertEmail Template Structure
```typescript
// Source: lib/email/templates/RoleAssignmentEmail.tsx (verified existing pattern)
// AnomalyAlertEmail follows same structure:
import { Html, Head, Body, Container, Heading, Text, Section } from '@react-email/components'

export function AnomalyAlertEmail({ metricTitle, metricType, actualValue, mean, stddev, unit, period, link, institutionName }) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#F3F7FD', fontFamily: 'DM Sans, Arial, sans-serif', margin: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
          <Section style={{ backgroundColor: '#050D1B', padding: '24px', borderRadius: '10px 10px 0 0' }}>
            <Heading style={{ color: '#C8A44A', margin: 0, fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700 }}>
              GRC-Nexus
            </Heading>
          </Section>
          <Section style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '0 0 10px 10px', border: '1px solid #D7E2EF', borderTop: 'none' }}>
            {/* Anomaly details: metric name, actual vs mean±2σ, period, link */}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

### Verified: Admin Client Import Pattern
```typescript
// Source: lib/supabase/admin.ts (verified)
import { createAdminClient } from '@/lib/supabase/admin'
// createAdminClient() — no args; reads SUPABASE_SERVICE_ROLE_KEY internally
```

### Verified: Notification Insert Pattern
```typescript
// Source: lib/notifications/insert.ts (verified)
import { insertNotification } from '@/lib/notifications/insert'

await insertNotification({
  institutionId: metric.institution_id,
  userId:        ownerId,
  title:         `Anomaly: ${metric.title} deviated >2σ`,
  body:          `Actual: ${actualValue} | Mean: ${mean.toFixed(2)} | σ: ${stddev.toFixed(2)}`,
  link:          `/strategic/kpis/${metric.id}`,  // or /risk/kris/[id]
  sourceModule:  'analytics',  // requires SourceModule type update
})
```

### Verified: Resend Email Dispatch Pattern
```typescript
// Source: lib/email/send-role-notification.ts (verified)
const resend = new Resend(process.env.RESEND_API_KEY)
const { error } = await resend.emails.send({
  from:    'GRC-Nexus Alerts <noreply@grcnexus.gov.zw>',
  to:      Array.from(recipients),  // Set<string> → string[]
  subject: `[ANOMALY] ${metric.title} — Statistical Deviation Detected`,
  react:   createElement(AnomalyAlertEmail, { ...props }),
})
```

### Verified: Admin Role Check in API Route
```typescript
// Source: app/api/audit/export/route.ts lines 21-24 (verified)
const appMeta   = user.app_metadata as Record<string, string>
const activeRole = appMeta?.active_role
if (!activeRole || !['admin'].includes(activeRole)) {
  return new Response('Forbidden', { status: 403 })
}
```

### Verified: SourceModule Type Extension Required
```typescript
// Source: types/notifications.ts (verified — current state)
// MUST ADD 'analytics' to this union:
export type SourceModule =
  | 'risk'
  | 'compliance'
  | 'kri'
  | 'kci'
  | 'audit'
  | 'incident'
  | 'board'
  | 'system'
  | 'analytics'  // ADD THIS

export const SOURCE_MODULE_LABELS: Record<SourceModule, string> = {
  // ... existing entries ...
  analytics: 'Analytics',  // ADD THIS
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vercel cron sends POST | Vercel cron sends GET with `Authorization: Bearer` | ~2023 | Existing routes use POST + x-cron-secret — incompatible with Vercel native cron; must choose one pattern |
| Recharts v2 `ComposedChart` props | Recharts v3 (same core API, performance improvements) | Dec 2024 | No breaking changes to ReferenceArea, ComposedChart API; upgrade from v2 patterns still valid |
| shadcn/ui `npx shadcn-ui@latest add` | `npx shadcn add accordion` (no `-ui` suffix) | 2024 | CLI command changed; UI-SPEC correctly uses `npx shadcn add accordion` |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | OLS linear regression on 4-6 readings will produce visually reasonable forecast bands for GRC KPI/KRI data | Architecture Patterns — Pattern 1 | If readings have extreme outliers, forecast bands may be misleadingly wide or narrow; acceptable for prototype |
| A2 | The `notifications.source_module` column is unconstrained `text` and accepts 'analytics' without a migration | Critical Investigation Q4 | If there is an undiscovered CHECK constraint, inserts will fail silently — migration would be needed |
| A3 | Using residual stddev as forecast uncertainty measure is sufficient for the "next 2 periods" band | Code Examples | A proper confidence interval would use t-distribution; residual stddev underestimates true forecast uncertainty — acceptable for prototype |

---

## Open Questions

1. **Vercel Cron GET vs existing POST pattern for anomaly-detect route**
   - What we know: Vercel native cron sends GET with `Authorization: Bearer {CRON_SECRET}`. Existing cron routes (`auto-findings`, `kri/alert`) use POST with `x-cron-secret` and are triggered by Supabase pg_cron. CONTEXT.md says "matches existing cron pattern from `auto-findings` route" — implying POST.
   - What's unclear: Should `/api/analytics/anomaly-detect` export a `GET` handler (Vercel native) or `POST` handler (Supabase pg_cron)? If using `vercel.json`, the route must export `GET`.
   - Recommendation: **Export a `GET` handler** in the anomaly-detect route, checking `Authorization: Bearer {CRON_SECRET}` (Vercel native pattern). This is the correct approach for `vercel.json`-defined crons. The CONTEXT.md note "matches auto-findings pattern" refers to the security guard structure, not the HTTP method. The `vercel.json` file is the right deployment mechanism for Vercel-hosted crons.

2. **How to display forecast band when forecast periods extend beyond data**
   - What we know: The chart needs to show 4-6 historical readings + 2 forecast periods. The ReferenceArea for the forecast band should visually indicate *where* the forecast sits relative to historical data.
   - What's unclear: Whether the ReferenceArea should span only the x-axis range of forecast periods (x1=period_n+1, x2=period_n+2) or span the full chart. Using y1/y2 only creates a horizontal band across the entire chart, not limited to the forecast period zone.
   - Recommendation: Use both `x1`/`x2` and `y1`/`y2` on ReferenceArea to constrain the band to forecast periods only. Pass forecast period labels as `x1` and `x2` (matching XAxis dataKey values).

3. **KPI readings ordering for forecast — `recorded_at` vs `reporting_period`**
   - What we know: `kpi_readings.reporting_period` is a `text` field (e.g., "Q1 2026"). `recorded_at` is a timestamp. The KPI detail page currently orders by `recorded_at DESC`.
   - What's unclear: Period index encoding should use chronological order. `reporting_period` as text may not sort correctly if periods are not ISO-formatted.
   - Recommendation: Sort by `recorded_at ASC` for the forecast computation (oldest to newest = index 0 to n-1). This is reliable. Period labels for the XAxis should still be `reporting_period`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build + runtime | ✓ | (project running) | — |
| recharts | ForecastChart rendering | ✓ | 3.8.1 | — |
| @react-email/components | AnomalyAlertEmail | ✓ | ^1.0.12 | — |
| resend | Email dispatch | ✓ | 6.12.3 | — |
| @supabase/ssr | CSV export user client | ✓ | ^0.10.3 | — |
| shadcn accordion | API docs accordion on export page | ✗ | — | Install: `npx shadcn add accordion` |
| RESEND_API_KEY env var | Anomaly email dispatch | Unknown | — | Skip email, log warning (existing pattern) |
| CRON_SECRET env var | Cron route auth | Unknown | — | Route returns 500 "Supabase config missing" style error |
| vercel.json (file) | Vercel native cron | ✗ | — | Create new file at project root |

**Missing dependencies with no fallback:**
- `vercel.json` — must be created for Vercel cron to schedule anomaly detection; without it the daily job never runs

**Missing dependencies with fallback:**
- `shadcn accordion` — `npx shadcn add accordion` installs it; UI-SPEC confirms this is the correct install command
- RESEND_API_KEY + CRON_SECRET — env vars may already be set in Vercel project settings; code gracefully skips email if key not set (per existing `send-role-notification.ts` pattern)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.7 |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npm test` (runs `vitest run`) |
| Full suite command | `npm test` |
| Setup file | `tests/setup.ts` (exists — sets env vars including `RESEND_API_KEY=re_test`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BRIDGE-ANA-01 | `linearRegression()` computes correct slope/intercept | unit | `npm test -- lib/analytics/forecast` | ❌ Wave 0 |
| BRIDGE-ANA-01 | `forecastPoints()` returns {lower, upper} for horizon=2 | unit | `npm test -- lib/analytics/forecast` | ❌ Wave 0 |
| BRIDGE-ANA-01 | `linearRegression()` handles edge case: all readings same value | unit | `npm test -- lib/analytics/forecast` | ❌ Wave 0 |
| BRIDGE-ANA-02 | Anomaly cron correctly flags reading >2σ from 6-period mean | unit | `npm test -- lib/analytics/anomaly` | ❌ Wave 0 |
| BRIDGE-ANA-02 | Anomaly cron skips metrics with <3 readings (no false positives) | unit | `npm test -- lib/analytics/anomaly` | ❌ Wave 0 |
| BRIDGE-ANA-03 | CSV export route returns 401 for unauthenticated | manual/smoke | Manual: `curl -X GET localhost:3000/api/analytics/export/risks` | N/A |
| BRIDGE-ANA-04 | Export page renders (admin-gated, shadcn accordion) | component | `npm test -- analytics-export` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test` (full suite runs in <15s based on existing 3-test suite pattern)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `lib/analytics/forecast.test.ts` — covers BRIDGE-ANA-01 (linearRegression, forecastPoints, edge cases)
- [ ] `lib/analytics/anomaly.test.ts` — covers BRIDGE-ANA-02 (stddev computation, threshold flagging, skip < 3 readings)

*(All other gaps are covered by existing infrastructure: `tests/setup.ts`, `vitest.config.ts`, alias `@` configured)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase `supabase.auth.getUser()` in CSV export routes |
| V3 Session Management | yes | `@supabase/ssr` cookie-based session (existing pattern) |
| V4 Access Control | yes | Admin-only role gate on export routes + export page; `app/(protected)/admin/layout.tsx` handles redirect |
| V5 Input Validation | yes (low risk) | `params.module` slug from dynamic route — validate against allowlist of 9 module slugs to prevent path traversal or info leakage |
| V6 Cryptography | no | No new crypto operations |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated CSV download | Information Disclosure | `supabase.auth.getUser()` + role check; 401/403 on failure [VERIFIED: audit/export/route.ts] |
| Cross-institution data leakage via export | Information Disclosure | User Supabase client (not admin client) for exports — RLS enforces `institution_id` scoping automatically |
| Anomaly cron without auth | Elevation of Privilege | `x-cron-secret` or `Authorization: Bearer` guard as FIRST operation before any DB call [VERIFIED: existing routes] |
| Module slug injection (`/api/analytics/export/../../admin`) | Tampering | Validate `params.module` against explicit allowlist: `['risks','kpis','kris','kcis','obligations','findings','incidents','board-actions','esg']` |
| Email flooding via double cron invocation | Denial of Service | 25h lookback window ensures idempotency; Vercel notes cron may invoke twice [CITED: vercel.com/docs/cron-jobs/manage-cron-jobs — idempotency section] |

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 14 |
|-----------|-------------------|
| Next.js 14 App Router | All routes as App Router route handlers; no Pages Router |
| Supabase (Postgres, Auth, RLS) | CSV exports must use user client for RLS; cron uses admin client |
| Vercel deployment | `vercel.json` must be created for cron schedule |
| shadcn/ui + Radix UI + Tailwind | Accordion via `npx shadcn add accordion`; no alternative UI libs |
| Recharts for KPI charts | ForecastChart must use Recharts, not an alternative |
| Resend for email | AnomalyAlertEmail dispatched via Resend |
| `export const dynamic = 'force-dynamic'` | Required on detail pages + export page to prevent ISR caching |
| GSD workflow enforcement | All changes via `/gsd-execute-phase`; no direct repo edits outside GSD |

---

## Sources

### Primary (HIGH confidence)
- `app/api/audit/auto-findings/route.ts` — verified cron route pattern (POST + x-cron-secret)
- `app/api/kri/alert/route.ts` + `lib/risk/kri-alert.ts` — verified 25h dedup pattern and recipient assembly
- `app/api/audit/export/route.ts` — verified CSV export pattern (user client, role check, text/csv response)
- `lib/notifications/insert.ts` — verified notification insert helper signature
- `lib/email/send-role-notification.ts` + `lib/email/templates/RoleAssignmentEmail.tsx` — verified Resend + React Email pattern
- `types/notifications.ts` — verified SourceModule union (confirmed 'analytics' not in it)
- `app/(protected)/admin/layout.tsx` — verified admin role gate (handles redirect; no per-page auth needed)
- `supabase/migrations/20260528000001_esg_schema.sql` — verified ESG tables exist
- `supabase/migrations/20260527000001_notifications_schema.sql` — verified `source_module` column is `text` (no enum constraint)
- `package.json` — verified recharts@3.8.1, @react-email/components@^1.0.12, resend@6.12.3 installed
- `vitest.config.ts` + `tests/setup.ts` — verified test infrastructure
- [CITED: recharts.github.io/en-US/api/ReferenceArea/] — ReferenceArea y1/y2/fillOpacity/strokeOpacity props confirmed

### Secondary (MEDIUM confidence)
- [CITED: vercel.com/docs/cron-jobs/manage-cron-jobs] — Vercel sends GET + `Authorization: Bearer {CRON_SECRET}`; cron may invoke twice (idempotency needed)
- [CITED: vercel.com/docs/cron-jobs] — `vercel.json` crons array format; production-only (not preview); timezone always UTC
- [VERIFIED: npm registry] — recharts@3.8.1 is current; @radix-ui/react-accordion@1.2.12 is current; resend@6.12.3 is current

### Tertiary (LOW confidence)
- None — all claims verified from codebase or official docs.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against package.json and npm registry
- Architecture patterns: HIGH — all 5 patterns derived from verified existing codebase code
- Pitfalls: HIGH — all 6 pitfalls derived from verified code + official Vercel docs

**Research date:** 2026-05-25
**Valid until:** 2026-06-25 (30 days — stable stack, no fast-moving APIs)
