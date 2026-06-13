# Phase 14: Advanced Analytics — Forecasting, Anomaly Detection, and Data Export - Pattern Map

**Mapped:** 2026-05-25
**Files analyzed:** 13 new/modified files
**Analogs found:** 12 / 13

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `lib/analytics/forecast.ts` | utility | transform | `lib/files/checksum.ts` | role-match (pure TS utility, no deps) |
| `lib/analytics/anomaly.ts` | utility | transform | `lib/risk/kri-alert.ts` | role-match (statistic computation + alerting logic) |
| `lib/analytics/forecast.test.ts` | test | — | `tests/files/checksum.test.ts` | exact (Vitest pure-utility test pattern) |
| `lib/analytics/anomaly.test.ts` | test | — | `tests/files/checksum.test.ts` | exact (Vitest pure-utility test pattern) |
| `components/analytics/ForecastChart.tsx` | component | request-response | `app/(protected)/strategic/KpiSparkline.tsx` | exact (Recharts 'use client' chart component) |
| `app/api/analytics/anomaly-detect/route.ts` | route | event-driven | `app/api/kri/alert/route.ts` + `app/api/audit/auto-findings/route.ts` | exact (cron POST route, x-cron-secret guard) |
| `app/api/analytics/export/[module]/route.ts` | route | file-I/O | `app/api/audit/export/route.ts` | exact (GET, user client, text/csv response) |
| `app/(protected)/admin/analytics-export/page.tsx` | component | request-response | `app/(protected)/admin/audit-log/page.tsx` | exact (admin server component with export link) |
| `vercel.json` | config | — | none (new file) | no-analog |
| `types/notifications.ts` | model | — | `types/notifications.ts` (modify) | exact (union type extension) |
| `app/(protected)/strategic/kpis/[id]/page.tsx` | component | request-response | `app/(protected)/strategic/kpis/[id]/page.tsx` (self) | exact (server component modification) |
| `app/(protected)/risk/kris/[id]/page.tsx` | component | request-response | `app/(protected)/risk/kris/[id]/page.tsx` (self) | exact (server component modification) |
| `lib/email/templates/AnomalyAlertEmail.tsx` | utility | — | `lib/email/templates/RoleAssignmentEmail.tsx` | exact (React Email template structure) |

---

## Pattern Assignments

### `lib/analytics/forecast.ts` (utility, transform)

**Analog:** `lib/files/checksum.ts`

**Pattern context:** Pure TypeScript utility — no external dependencies, no framework imports, exports named functions. No `'use client'` or `'use server'` directives. The `checksum.ts` pattern establishes the project convention for serverside pure utilities.

**Imports pattern** (checksum.ts lines 1–3):
```typescript
// lib/files/checksum.ts — pure TS utility, no deps
import { createHash, timingSafeEqual } from 'crypto'

export function computeSHA256(data: Buffer): string { ... }
export function verifyChecksum(data: Buffer, storedHash: string): boolean { ... }
```

**Core pattern to copy for `forecast.ts`:**
```typescript
// lib/analytics/forecast.ts
// Pure TypeScript linear regression utility — no dependencies, no framework imports.
// SERVER-SIDE: called from KPI/KRI detail server components before passing data to ForecastChart.

export function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length
  const xMean = (n - 1) / 2
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

export function forecastPoints(
  readings: number[],
  horizon: number,
): { lower: number; upper: number }[] {
  const { slope, intercept } = linearRegression(readings)
  const n = readings.length

  const residuals = readings.map((v, i) => v - (intercept + slope * i))
  const residualMean = residuals.reduce((s, r) => s + r, 0) / n
  const residualStd = Math.sqrt(
    residuals.reduce((s, r) => s + (r - residualMean) ** 2, 0) / n
  )

  return Array.from({ length: horizon }, (_, h) => {
    const predicted = intercept + slope * (n + h)
    return { lower: predicted - residualStd, upper: predicted + residualStd }
  })
}
```

**File header comment convention** (from auto-findings/route.ts line 1–2):
```typescript
// lib/analytics/forecast.ts
// Pure TypeScript linear regression utility for KPI/KRI forecast band computation.
// No external dependencies — OLS period-index encoding.
// Called server-side only; pass computed results to ForecastChart as props.
```

---

### `lib/analytics/anomaly.ts` (utility, transform)

**Analog:** `lib/risk/kri-alert.ts`

**Pattern context:** This utility file should contain the computation logic for anomaly detection (mean, stddev, flagging), extracted as a pure function testable without DB calls. The route handler calls it just as `kri/alert/route.ts` calls `sendKriBreachAlerts()`.

**Function signature pattern** (kri-alert.ts lines 39–43):
```typescript
// lib/risk/kri-alert.ts lines 39-43
export async function sendKriBreachAlerts(): Promise<{ sent: number; skipped: number }> {
  const admin = createAdminClient()
  const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
  // ...
}
```

**Stats computation pattern to apply in `anomaly.ts`:**
```typescript
// lib/analytics/anomaly.ts
// Anomaly detection computation — pure stats functions + service function.
// SERVICE FUNCTION uses admin client (service role — bypasses RLS).
// SERVER-SIDE ONLY — never import in client components.

/** Returns true if |value - mean| > threshold * stddev */
export function isAnomaly(value: number, mean: number, stddev: number, threshold = 2): boolean {
  if (stddev === 0) return false          // guard: identical readings never anomalous
  return Math.abs(value - mean) > threshold * stddev
}

/** Compute mean of a numeric array */
export function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length
}

/** Compute population standard deviation */
export function stddev(values: number[], mu?: number): number {
  const m = mu ?? mean(values)
  return Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length)
}
```

**25-hour dedup window pattern** (kri-alert.ts lines 42–44):
```typescript
// lib/risk/kri-alert.ts lines 42-44
const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
// ...
.gte('recorded_at', since)
```

**Recipient assembly pattern** (kri-alert.ts lines 76–98):
```typescript
// lib/risk/kri-alert.ts lines 76-98
const recipients = new Set<string>()

// Add owner email
if (def.owner_id) {
  const { data: ownerUser } = await admin.auth.admin.getUserById(def.owner_id)
  if (ownerUser?.user?.email) recipients.add(ownerUser.user.email)
}

// Add institution admins
const { data: adminProfiles } = await admin
  .from('user_profiles')
  .select('id')
  .eq('institution_id', breach.institution_id)
  .eq('active_role', 'admin')

if (adminProfiles) {
  for (const profile of adminProfiles) {
    const { data: adminUser } = await admin.auth.admin.getUserById(
      (profile as { id: string }).id
    )
    if (adminUser?.user?.email) recipients.add(adminUser.user.email)
  }
}
if (recipients.size === 0) { skipped++; continue }
```

**Error handling pattern** (kri-alert.ts lines 118–129):
```typescript
// lib/risk/kri-alert.ts lines 118-129
try {
  await resend.emails.send({ from: '...', to: Array.from(recipients), subject: '...', html })
  sent++
} catch (emailErr) {
  console.error('[sendKriBreachAlerts] Email send error:', emailErr)
  skipped++
}
```

---

### `lib/analytics/forecast.test.ts` (test, —)

**Analog:** `tests/files/checksum.test.ts`

**Imports pattern** (checksum.test.ts lines 1–2):
```typescript
import { describe, it, expect } from 'vitest'
import { computeSHA256, verifyChecksum } from '@/lib/files/checksum'
```

**Test structure pattern** (checksum.test.ts lines 4–42):
```typescript
describe('SHA-256 checksum', () => {
  it('returns a 64-character hex string', () => {
    const hash = computeSHA256(Buffer.from('test data'))
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })

  it('returns the same hash for the same input', () => { ... })
  it('returns different hashes for different inputs', () => { ... })
  it('verifyChecksum returns true for matching data', () => { ... })
  it('verifyChecksum returns false for tampered data', () => { ... })
})
```

**Test file to produce for `forecast.test.ts`:**
```typescript
import { describe, it, expect } from 'vitest'
import { linearRegression, forecastPoints } from '@/lib/analytics/forecast'

describe('linearRegression', () => {
  it('computes correct slope and intercept for known values', () => { ... })
  it('returns slope=0, intercept=mean when all values identical', () => { ... })
  it('handles 4-point minimum dataset', () => { ... })
})

describe('forecastPoints', () => {
  it('returns array of length equal to horizon', () => { ... })
  it('returns { lower, upper } objects where lower <= upper', () => { ... })
  it('forecast lower/upper equal predicted value when residuals are zero', () => { ... })
})
```

---

### `lib/analytics/anomaly.test.ts` (test, —)

**Analog:** `tests/files/checksum.test.ts`

**Same import/describe/it/expect pattern** as forecast.test.ts above. Test file location: `tests/analytics/anomaly.test.ts` OR `lib/analytics/anomaly.test.ts` (follow RESEARCH.md — uses `lib/analytics/` colocation since anomaly.ts is in lib/analytics/).

**Test cases to cover** (from RESEARCH.md validation map):
```typescript
import { describe, it, expect } from 'vitest'
import { isAnomaly, mean, stddev } from '@/lib/analytics/anomaly'

describe('mean', () => {
  it('computes arithmetic mean', () => { ... })
})

describe('stddev', () => {
  it('returns 0 for identical values', () => { ... })
  it('computes correct population stddev', () => { ... })
})

describe('isAnomaly', () => {
  it('flags value exceeding 2σ from mean', () => { ... })
  it('does not flag value within 2σ', () => { ... })
  it('returns false when stddev is 0 (guard)', () => { ... })
})
```

---

### `components/analytics/ForecastChart.tsx` (component, request-response)

**Analog:** `app/(protected)/strategic/KpiSparkline.tsx`

**Imports pattern** (KpiSparkline.tsx lines 1–7):
```typescript
'use client'
// app/(protected)/strategic/KpiSparkline.tsx
// CRITICAL: isAnimationActive={false} — prevents table cell layout jank during re-renders.
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import type { KpiStatus } from '@/lib/strategic/kpi-utils'
```

**ForecastChart imports to use** (extend the sparkline pattern with ComposedChart):
```typescript
'use client'
// components/analytics/ForecastChart.tsx
// Full forecast chart — 200px height, axes, tooltip, ReferenceArea band.
// CRITICAL: 'use client' required — Recharts uses browser SVG APIs.
// CRITICAL: isAnimationActive={false} — matches KpiSparkline.tsx established pattern.
import {
  ComposedChart, Line, ReferenceArea, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
```

**ResponsiveContainer + no-animation pattern** (KpiSparkline.tsx lines 36–51):
```typescript
// KpiSparkline.tsx lines 36-51
return (
  <div className="w-[80px] h-[32px]">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={SPARKLINE_COLOR[status]}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}   // <-- COPY THIS to ForecastChart
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
)
```

**ForecastChart core pattern** (adapt from KpiSparkline + RESEARCH.md Pattern 2):
```typescript
// Parent div with explicit height required for ResponsiveContainer
return (
  <div className="w-full h-[200px]">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#D7E2EF" />
        <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#3A5270' }} />
        <YAxis tick={{ fontSize: 11, fill: '#3A5270' }} width={40} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
        {targetValue !== undefined && (
          <ReferenceLine y={targetValue} strokeDasharray="4 2" stroke="#3A5270" strokeOpacity={0.6} />
        )}
        {forecastBand && (
          <ReferenceArea
            x1={forecastBand.x1}
            x2={forecastBand.x2}
            y1={forecastBand.lower}
            y2={forecastBand.upper}
            fill="#C8A44A"
            fillOpacity={0.15}
            stroke="#C8A44A"
            strokeOpacity={0.4}
            ifOverflow="extendDomain"  // prevents clipping if band extends Y-axis domain
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke={statusColor}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}   // MATCHES KpiSparkline.tsx established pattern
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
)
```

**Color constants convention** (KpiSparkline.tsx lines 14–21):
```typescript
// KpiSparkline.tsx lines 14-21
// Hex values match tailwind.config.ts token definitions exactly.
// Recharts renders SVG attributes — cannot use Tailwind class names here.
const SPARKLINE_COLOR: Record<KpiStatus, string> = {
  on_track:  '#27AE60',
  at_risk:   '#E67E22',
  off_track: '#E74C3C',
  no_data:   '#D7E2EF',
}
```

---

### `app/api/analytics/anomaly-detect/route.ts` (route, event-driven)

**Analog:** `app/api/kri/alert/route.ts` AND `app/api/audit/auto-findings/route.ts`

**x-cron-secret guard pattern — COPY EXACTLY** (kri/alert/route.ts lines 18–23):
```typescript
// app/api/kri/alert/route.ts lines 18-23
export async function POST(request: Request) {
  // CRON_SECRET guard — FIRST operation before any DB query
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }
  // ...
}
```

**Admin client creation pattern** (auto-findings/route.ts lines 4–21):
```typescript
// app/api/audit/auto-findings/route.ts lines 4-21
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 })
  }

  const admin = createAdminClient(supabaseUrl, serviceKey)
  // ...
}
```

**Alternatively** — prefer `createAdminClient` from `@/lib/supabase/admin` (cleaner, matches kri-alert.ts):
```typescript
// lib/risk/kri-alert.ts line 8 — preferred admin client import
import { createAdminClient } from '@/lib/supabase/admin'
// Then: const admin = createAdminClient()  — no args needed
```

**Response pattern with try/catch** (kri/alert/route.ts lines 25–37):
```typescript
// app/api/kri/alert/route.ts lines 25-37
try {
  const result = await sendKriBreachAlerts()
  return Response.json({
    success:       true,
    emailsSent:    result.sent,
    emailsSkipped: result.skipped,
  })
} catch (err) {
  console.error('[kri/alert] Unexpected error:', err)
  return Response.json({ error: 'Internal server error' }, { status: 500 })
}
```

**IMPORTANT NOTE on HTTP method:** The `vercel.json` cron sends GET requests. The CONTEXT.md decision says "matches existing cron pattern from auto-findings route" (POST + x-cron-secret). The planner must decide: export `GET` (Vercel native) or `POST` (pg_cron). RESEARCH.md Open Question 1 recommends exporting `GET` and checking `Authorization: Bearer {CRON_SECRET}` when using `vercel.json`. However, the established codebase pattern uses POST + x-cron-secret. Either: (a) export both GET (Vercel) and POST (backward compat), or (b) export only GET + update the cron auth check. The planner should use the GET approach to be compatible with vercel.json.

---

### `app/api/analytics/export/[module]/route.ts` (route, file-I/O)

**Analog:** `app/api/audit/export/route.ts`

**Full imports pattern** (export/route.ts lines 1–8):
```typescript
// app/api/audit/export/route.ts lines 1-8
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
```

**Auth + role check pattern** (export/route.ts lines 13–25):
```typescript
// app/api/audit/export/route.ts lines 13-25
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role
  if (!activeRole || !['admin', 'audit-officer'].includes(activeRole)) {
    return new Response('Forbidden', { status: 403 })
  }
  // ...
}
```

**For analytics export — admin-only** (matches admin layout and CONTEXT.md decision):
```typescript
// Copy from export/route.ts lines 21-25 but restrict to 'admin' only:
const appMeta = user.app_metadata as Record<string, string>
const activeRole = appMeta?.active_role
if (!activeRole || activeRole !== 'admin') {
  return new Response('Forbidden', { status: 403 })
}
```

**CSV string building with quote-escape pattern** (export/route.ts lines 66–83):
```typescript
// app/api/audit/export/route.ts lines 66-83
const csvHeaders = 'Timestamp,Actor ID,Action,Table,Record ID,Event Type,Module,Department,Metadata\n'
const csvRows = filteredEvents
  .map((e) => {
    const meta = e.metadata ? JSON.stringify(e.metadata).replace(/"/g, '""') : ''
    return [
      `"${e.occurred_at}"`,
      `"${e.actor_id ?? ''}"`,
      `"${e.action}"`,
      // ... all fields wrapped in double-quotes
    ].join(',')
  })
  .join('\n')
```

**text/csv Response pattern** (export/route.ts lines 88–96):
```typescript
// app/api/audit/export/route.ts lines 88-96
const filename = `grc-nexus-audit-log-${Date.now()}.csv`
return new Response(csv, {
  headers: {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-store, no-cache, must-revalidate',  // SECURITY
  },
})
```

**Dynamic route params pattern** (from RESEARCH.md Pattern 4):
```typescript
// app/api/analytics/export/[module]/route.ts
export async function GET(request: NextRequest, { params }: { params: { module: string } }) {
  // SECURITY: validate module slug against allowlist to prevent path traversal
  const ALLOWED_MODULES = ['risks', 'kpis', 'kris', 'kcis', 'obligations', 'findings', 'incidents', 'board-actions', 'esg']
  if (!ALLOWED_MODULES.includes(params.module)) {
    return new Response('Not Found', { status: 404 })
  }
  // ...
  const filename = `grc-nexus-${params.module}-${Date.now()}.csv`
  // ...
}
```

---

### `app/(protected)/admin/analytics-export/page.tsx` (component, request-response)

**Analog:** `app/(protected)/admin/audit-log/page.tsx`

**Imports + dynamic export pattern** (audit-log/page.tsx lines 1–14):
```typescript
// app/(protected)/admin/audit-log/page.tsx lines 1-14
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
// ... other imports

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Audit Log — GRC-Nexus',
}
```

**Auth guard pattern** (audit-log/page.tsx lines 25–41):
```typescript
// app/(protected)/admin/audit-log/page.tsx lines 25-41
export default async function AuditLogPage(...) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const appMeta = user.app_metadata as Record<string, unknown>
  const activeRole = appMeta?.active_role as AppRole | undefined

  if (!activeRole || !ALLOWED_ROLES.includes(activeRole)) {
    redirect('/dashboard')
  }
  // ...
}
```

**NOTE:** The `app/(protected)/admin/layout.tsx` already handles the admin redirect (lines 14–23). The analytics-export page does NOT need its own auth redirect — the layout covers it. The page can skip the manual role check and just render:
```typescript
// app/(protected)/admin/layout.tsx lines 14-23
// This layout auto-redirects non-admins — analytics-export page inherits this protection
if (!user) { redirect('/login') }
const appMeta = user.app_metadata as Record<string, string>
if (appMeta?.active_role !== 'admin') { redirect('/dashboard') }
return <>{children}</>
```

**Export link pattern** (audit-log/page.tsx lines 153–159):
```typescript
// app/(protected)/admin/audit-log/page.tsx lines 153-159
<a
  href={`/api/audit/export${exportParams.toString() ? `?${exportParams.toString()}` : ''}`}
  className="inline-flex items-center px-4 py-2 rounded-[8px] bg-white border border-paper-border shadow-card text-[13px] font-medium text-navy-900 hover:border-navy-mid/40 hover:shadow-auth transition-all"
>
  Export CSV
</a>
```

**Page header pattern** (audit-log/page.tsx lines 147–161):
```typescript
// app/(protected)/admin/audit-log/page.tsx lines 147-161
<div>
  <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
    <div>
      <h1 className="text-[20px] font-semibold text-navy-900 font-body">Audit Log</h1>
      <p className="text-[14px] text-navy-mid mt-1">...</p>
    </div>
    <a href="..." className="inline-flex items-center px-4 py-2 rounded-[8px] bg-white border border-paper-border shadow-card ...">
      Export CSV
    </a>
  </div>
  ...
</div>
```

---

### `vercel.json` (config, —)

**Analog:** None (new file, no existing analog in codebase)

**Pattern from RESEARCH.md Pattern 5:**
```json
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

**Critical note:** Vercel cron sends GET requests with `Authorization: Bearer {CRON_SECRET}`. The anomaly-detect route must export a `GET` handler to receive these. The schedule `"0 6 * * *"` = 6:00 AM UTC daily. Vercel crons run in production only (not preview deployments).

---

### `types/notifications.ts` (model, —)

**Analog:** `types/notifications.ts` (self-modification)

**Current state** (types/notifications.ts lines 1–35):
```typescript
// types/notifications.ts lines 4-13 — CURRENT (must modify)
export type SourceModule =
  | 'risk'
  | 'compliance'
  | 'kri'
  | 'kci'
  | 'audit'
  | 'incident'
  | 'board'
  | 'system'
```

**Target state — ADD `'analytics'` to both union and labels** (types/notifications.ts lines 26–35):
```typescript
// types/notifications.ts lines 26-35 — CURRENT labels map (must extend)
export const SOURCE_MODULE_LABELS: Record<SourceModule, string> = {
  risk:       'Risk',
  compliance: 'Compliance',
  kri:        'KRI',
  kci:        'KCI',
  audit:      'Audit',
  incident:   'Incident',
  board:      'Board',
  system:     'System',
  // ADD: analytics: 'Analytics',
}
```

**Exact edit required:**
1. Append `| 'analytics'` to the `SourceModule` union type after line 11 (`| 'system'`)
2. Append `analytics: 'Analytics',` to `SOURCE_MODULE_LABELS` after line 34

---

### `app/(protected)/strategic/kpis/[id]/page.tsx` (component, request-response — MODIFY)

**Analog:** `app/(protected)/strategic/kpis/[id]/page.tsx` (self)

**Current structure** (page.tsx lines 43–205): Server Component, fetches KPI + readings, renders detail card + readings table. `ForecastChart` is added after the Reading History section.

**Readings fetch pattern — already present** (page.tsx lines 62–67):
```typescript
// app/(protected)/strategic/kpis/[id]/page.tsx lines 62-67
const { data: readings } = await supabase
  .from('kpi_readings')
  .select('*')
  .eq('kpi_id', params.id)
  .order('recorded_at', { ascending: false })
```

**Insertion point for ForecastChart** (page.tsx lines 159–202): After the closing `</div>` of the "Reading History" section (around line 202), add:
```tsx
{/* Forecast Analytics — only render when >= 4 readings exist */}
{kpiReadings.length >= 4 && (() => {
  const orderedValues = [...kpiReadings]
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
    .map(r => r.actual_value)
  const forecastBand = forecastPoints(orderedValues, 2)
  // build chartData: historical + 2 forecast periods with null values
  return (
    <div className="mt-6">
      <h2 className="text-[16px] font-semibold text-navy-900 mb-4">Forecast (next 2 periods)</h2>
      <div className="bg-white rounded-[10px] border border-paper-border shadow-card p-6">
        <ForecastChart
          readings={kpiReadings}
          forecastBand={{ lower: forecastBand[0].lower, upper: forecastBand[1].upper, x1: '...', x2: '...' }}
          targetValue={kpiRow.target_value}
          statusColor={SPARKLINE_COLOR[status]}
        />
      </div>
    </div>
  )
})()}
```

**dynamic flag already present** (page.tsx line 16):
```typescript
export const dynamic = 'force-dynamic'
```

---

### `app/(protected)/risk/kris/[id]/page.tsx` (component, request-response — MODIFY)

**Analog:** `app/(protected)/risk/kris/[id]/page.tsx` (self)

**Current structure** (page.tsx lines 51–198): Server Component, fetches KRI + readings, renders two-column layout with sparkline + readings table. `ForecastChart` is added to the readings column.

**Readings array pattern — already present** (page.tsx lines 64–67):
```typescript
// app/(protected)/risk/kris/[id]/page.tsx lines 64-67
const readings = (kri.kri_readings ?? []).sort((a, b) =>
  new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
)
```

**Insertion point for ForecastChart** (page.tsx line 185–194): After the Record new reading form (around line 194), add a `ForecastChart` card in the right column:
```tsx
{/* Forecast Analytics */}
{readings.length >= 4 && (
  <div className="rounded-[10px] border border-paper-border bg-white shadow-card p-6">
    <h2 className="text-[13px] font-semibold text-navy-900 uppercase tracking-wide mb-4">
      Forecast (next 2 periods)
    </h2>
    <ForecastChart
      readings={readings}
      forecastBand={...}
      targetValue={kri.target_value}
      statusColor={SPARKLINE_COLOR[status]}
    />
  </div>
)}
```

**Card style to copy** (kris/[id]/page.tsx lines 146–149):
```tsx
// app/(protected)/risk/kris/[id]/page.tsx lines 146-149
<div className="rounded-[10px] border border-paper-border bg-white shadow-card p-6">
  <h2 className="text-[13px] font-semibold text-navy-900 uppercase tracking-wide mb-4">Trend (last 6)</h2>
  ...
</div>
```

---

### `lib/email/templates/AnomalyAlertEmail.tsx` (utility, —)

**Analog:** `lib/email/templates/RoleAssignmentEmail.tsx`

**Full imports pattern** (RoleAssignmentEmail.tsx lines 1–12):
```typescript
// lib/email/templates/RoleAssignmentEmail.tsx lines 1-12
// SERVER-SIDE ONLY — never import in client components.
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
} from '@react-email/components'
```

**Header section pattern — COPY EXACTLY** (RoleAssignmentEmail.tsx lines 26–45):
```tsx
// lib/email/templates/RoleAssignmentEmail.tsx lines 26-45
<Section
  style={{
    backgroundColor: '#050D1B',
    padding: '24px',
    borderRadius: '10px 10px 0 0',
  }}
>
  <Heading
    style={{
      color: '#C8A44A',
      margin: 0,
      fontFamily: 'Georgia, serif',
      fontSize: 24,
      fontWeight: 700,
    }}
  >
    GRC-Nexus
  </Heading>
</Section>
```

**Body section style — COPY EXACTLY** (RoleAssignmentEmail.tsx lines 47–57):
```tsx
// lib/email/templates/RoleAssignmentEmail.tsx lines 47-57
<Section
  style={{
    backgroundColor: '#FFFFFF',
    padding: '32px',
    borderRadius: '0 0 10px 10px',
    border: '1px solid #D7E2EF',
    borderTop: 'none',
  }}
>
```

**Body wrapper style** (RoleAssignmentEmail.tsx line 24):
```tsx
<Body style={{ backgroundColor: '#F3F7FD', fontFamily: 'DM Sans, Arial, sans-serif', margin: 0 }}>
  <Container style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
```

**Text style** (RoleAssignmentEmail.tsx line 70):
```tsx
<Text style={{ color: '#3A5270', fontSize: 14, lineHeight: '1.6' }}>
```

**Info box pattern** (RoleAssignmentEmail.tsx lines 86–107):
```tsx
// lib/email/templates/RoleAssignmentEmail.tsx lines 86-107
<Section
  style={{
    backgroundColor: '#F3F7FD',
    borderRadius: 8,
    padding: '16px 20px',
    marginTop: 24,
    border: '1px solid #D7E2EF',
  }}
>
  <Text style={{ color: '#3A5270', fontSize: 13, margin: 0, lineHeight: '1.5' }}>
    ...
  </Text>
</Section>
```

**AnomalyAlertEmail interface to define:**
```typescript
interface AnomalyAlertEmailProps {
  metricTitle: string
  metricType: 'KPI' | 'KRI'
  actualValue: number
  mean: number
  stddev: number
  unit: string
  period: string
  link: string
  institutionName: string
}
```

---

## Shared Patterns

### Admin Client (service role — bypasses RLS)
**Source:** `lib/supabase/admin.ts` lines 1–19
**Apply to:** `app/api/analytics/anomaly-detect/route.ts`, `lib/analytics/anomaly.ts`
```typescript
// lib/supabase/admin.ts lines 8-19
import { createAdminClient } from '@/lib/supabase/admin'
// Usage: const admin = createAdminClient()  — no args, reads env vars internally
// SECURITY: SERVER-SIDE ONLY — never import in client components or browser context
```

### User Client (RLS-scoped — for exports)
**Source:** `lib/supabase/server.ts` lines 1–34
**Apply to:** `app/api/analytics/export/[module]/route.ts`
```typescript
// lib/supabase/server.ts lines 9-10
import { createClient } from '@/lib/supabase/server'
// Usage: const supabase = await createClient()
// SECURITY: Enforces institution_id RLS automatically — use for all CSV export routes
```

### Auth Check Pattern (API Routes)
**Source:** `app/api/audit/export/route.ts` lines 14–25
**Apply to:** `app/api/analytics/export/[module]/route.ts`, `app/api/analytics/anomaly-detect/route.ts`
```typescript
// app/api/audit/export/route.ts lines 14-25
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return new Response('Unauthorized', { status: 401 })

const appMeta = user.app_metadata as Record<string, string>
const activeRole = appMeta?.active_role
if (!activeRole || !['admin'].includes(activeRole)) {
  return new Response('Forbidden', { status: 403 })
}
```

### Cron Secret Guard (POST routes)
**Source:** `app/api/kri/alert/route.ts` lines 18–23
**Apply to:** `app/api/analytics/anomaly-detect/route.ts`
```typescript
// app/api/kri/alert/route.ts lines 18-23
const secret = request.headers.get('x-cron-secret')
if (!secret || secret !== process.env.CRON_SECRET) {
  return new Response('Unauthorized', { status: 401 })
}
```

### force-dynamic Export
**Source:** `app/(protected)/strategic/kpis/[id]/page.tsx` line 16, `app/(protected)/admin/layout.tsx` line 8
**Apply to:** `app/(protected)/admin/analytics-export/page.tsx`, both modified detail pages
```typescript
export const dynamic = 'force-dynamic'
```

### Resend Email Dispatch
**Source:** `lib/email/send-role-notification.ts` lines 15–37
**Apply to:** `lib/analytics/anomaly.ts` (service function) or `app/api/analytics/anomaly-detect/route.ts`
```typescript
// lib/email/send-role-notification.ts lines 15-37
const resendKey = process.env.RESEND_API_KEY
if (!resendKey || resendKey === 're_xxxx' || resendKey === 're_test') {
  console.warn('[email] RESEND_API_KEY not configured — skipping ...', params.to)
  return  // graceful degradation — do NOT throw
}
const resend = new Resend(resendKey)
const { error } = await resend.emails.send({
  from: 'GRC-Nexus <noreply@grcnexus.gov.zw>',
  to: [params.to],
  subject: '...',
  react: createElement(AnomalyAlertEmail, { ...props }),
})
if (error) { throw new Error(`Resend email error: ${error.message}`) }
```

### insertNotification Helper
**Source:** `lib/notifications/insert.ts` lines 17–31
**Apply to:** `lib/analytics/anomaly.ts` (service function)
```typescript
// lib/notifications/insert.ts lines 17-31
import { insertNotification } from '@/lib/notifications/insert'

await insertNotification({
  institutionId: metric.institution_id,
  userId:        recipientId,
  title:         `Anomaly: ${metricTitle} deviated >2σ`,
  body:          `Actual: ${actualValue} | Mean: ${mean.toFixed(2)} | σ: ${stddev.toFixed(2)}`,
  link:          `/strategic/kpis/${metricId}`,  // or /risk/kris/[id]
  sourceModule:  'analytics',  // requires SourceModule type update in types/notifications.ts
})
// Note: insertNotification never throws — logs error internally, returns void
```

### CSV Field Escaping
**Source:** `app/api/audit/export/route.ts` lines 70–81
**Apply to:** `app/api/analytics/export/[module]/route.ts`
```typescript
// app/api/audit/export/route.ts lines 70-81
// CRITICAL: All string fields must be wrapped in double quotes.
// CRITICAL: Internal double-quotes must be escaped as "" (CSV standard).
const meta = e.metadata ? JSON.stringify(e.metadata).replace(/"/g, '""') : ''
return [
  `"${e.occurred_at}"`,
  `"${e.actor_id ?? ''}"`,
  // wrap all fields: `"${value ?? ''}"`
].join(',')
```

### Vitest Test File Structure
**Source:** `tests/files/checksum.test.ts` lines 1–42
**Apply to:** `lib/analytics/forecast.test.ts`, `lib/analytics/anomaly.test.ts`
```typescript
// tests/files/checksum.test.ts lines 1-2
import { describe, it, expect } from 'vitest'
import { functionUnderTest } from '@/lib/analytics/...'
// No setup file import needed — tests/setup.ts is auto-loaded via vitest.config.ts
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `vercel.json` | config | — | No existing `vercel.json` in project; first Vercel-native cron definition. Use RESEARCH.md Pattern 5. |

---

## Metadata

**Analog search scope:** `app/`, `lib/`, `components/`, `types/`, `tests/` directories
**Files scanned:** 18 source files read directly; 40+ indexed via Glob
**Pattern extraction date:** 2026-05-25

**Key observations:**
- `export const dynamic = 'force-dynamic'` is on ALL admin and detail pages — mandatory for new files
- `isAnimationActive={false}` is used in both sparkline components — must carry forward to ForecastChart
- Admin layout (`app/(protected)/admin/layout.tsx`) handles the admin role redirect centrally — analytics-export page does NOT need its own redirect (but may include one for defense-in-depth)
- `lib/supabase/admin.ts` exports `createAdminClient()` with no args — preferred over inline `createClient(url, key)` used in older auto-findings route
- Resend sender address in kri-alert.ts (`alerts@mail.grc-nexus.app`) differs from send-role-notification.ts (`noreply@grcnexus.gov.zw`) — CONTEXT.md and RESEARCH.md both specify `noreply@grcnexus.gov.zw` for AnomalyAlertEmail; use the newer address
- The `insertNotification()` helper silently logs errors and never throws — call sites do not need try/catch around it
