# Phase 4: Compliance Management — Obligations and Evidence - Pattern Map

**Mapped:** 2026-05-23
**Files analyzed:** 28 new/modified files
**Analogs found:** 27 / 28

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `supabase/migrations/20260522000020_compliance_schema.sql` | migration | CRUD | `supabase/migrations/20260522000017_risk_schema.sql` | exact |
| `supabase/migrations/20260522000021_compliance_rls.sql` | migration | CRUD | `supabase/migrations/20260522000018_risk_rls.sql` | exact |
| `supabase/migrations/20260522000022_compliance_triggers.sql` | migration | CRUD | `supabase/migrations/20260522000019_risk_triggers.sql` | exact |
| `lib/compliance/actions.ts` | service | request-response | `lib/risk/actions.ts` | exact |
| `lib/compliance/queries.ts` | service | CRUD | `lib/risk/queries.ts` | exact |
| `lib/compliance/compliance-utils.ts` | utility | transform | `lib/risk/risk-utils.ts` | exact |
| `lib/compliance/escalation.ts` | service | event-driven | `lib/risk/actions.ts` (sendOverdueEscalationEmail) | role-match |
| `lib/schemas/compliance.ts` | utility | transform | `lib/schemas/risk.ts` | exact |
| `lib/files/checksum.ts` | utility | file-I/O | — (already exists — reuse as-is) | no-op |
| `types/compliance.ts` | utility | transform | `types/risk.ts` | exact |
| `types/auth.ts` *(modify)* | utility | transform | `types/auth.ts` (self) | modify |
| `app/(protected)/layout.tsx` *(modify)* | middleware | request-response | `app/(protected)/layout.tsx` (self) | modify |
| `app/(protected)/compliance/page.tsx` | component | request-response | `app/(protected)/risk/page.tsx` | exact |
| `app/(protected)/compliance/obligations/page.tsx` | component | request-response | `app/(protected)/risk/register/page.tsx` | exact |
| `app/(protected)/compliance/obligations/ObligationsTable.tsx` | component | request-response | `app/(protected)/risk/register/RiskRegisterTable.tsx` | exact |
| `app/(protected)/compliance/obligations/new/page.tsx` | component | request-response | `app/(protected)/risk/new/page.tsx` | exact |
| `app/(protected)/compliance/obligations/new/ObligationForm.tsx` | component | request-response | `app/(protected)/risk/new/RiskForm.tsx` | exact |
| `app/(protected)/compliance/obligations/[id]/page.tsx` | component | request-response | `app/(protected)/risk/[id]/page.tsx` | exact |
| `app/(protected)/compliance/obligations/[id]/edit/page.tsx` | component | request-response | `app/(protected)/risk/[id]/edit/page.tsx` | role-match |
| `app/(protected)/compliance/obligations/[id]/edit/ObligationEditForm.tsx` | component | request-response | `app/(protected)/risk/new/RiskForm.tsx` | role-match |
| `app/(protected)/compliance/obligations/[id]/attest/page.tsx` | component | request-response | `app/(protected)/risk/[id]/treatments/new/page.tsx` | role-match |
| `app/(protected)/compliance/obligations/[id]/attest/AttestationForm.tsx` | component | request-response | `app/(protected)/risk/new/RiskForm.tsx` | role-match |
| `app/(protected)/compliance/obligations/[id]/evidence/upload/page.tsx` | component | file-I/O | `app/(protected)/risk/[id]/treatments/new/page.tsx` | role-match |
| `app/(protected)/compliance/obligations/[id]/evidence/upload/EvidenceUploadForm.tsx` | component | file-I/O | `app/(protected)/risk/new/RiskForm.tsx` | role-match |
| `app/api/compliance/evidence/[id]/route.ts` | controller | file-I/O | `app/api/audit/export/route.ts` | role-match |
| `app/api/compliance/escalate/route.ts` | controller | event-driven | `app/api/audit/export/route.ts` | role-match |
| `components/compliance/ComplianceStatCard.tsx` | component | transform | `app/(protected)/risk/page.tsx` (inline StatCard) | role-match |
| `components/compliance/ObligationFilterBar.tsx` | component | request-response | `app/(protected)/risk/register/RiskFilterBar.tsx` | exact |
| `next.config.mjs` *(modify)* | config | — | `next.config.mjs` (self) | modify |

---

## Pattern Assignments

### `supabase/migrations/20260522000020_compliance_schema.sql` (migration, CRUD)

**Analog:** `supabase/migrations/20260522000017_risk_schema.sql`

**Core migration pattern** (lines 1–77):
```sql
-- Migration: 20260522000017_risk_schema.sql
create type public.risk_category as enum ( ... );
create type public.risk_status as enum ( ... );
create type public.treatment_status as enum ( ... );

create table public.risks (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  -- ...domain columns...
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_risks_institution_id on public.risks (institution_id);
create index idx_risks_owner_id       on public.risks (owner_id);
create index idx_risks_status         on public.risks (status);
```

**Apply for Phase 4:** Create three enums (`regulatory_framework`, `obligation_status`, `attestation_status`) and three tables (`compliance_obligations`, `obligation_evidence`, `obligation_attestations`). Follow the exact column order: `id`, `institution_id`, domain columns, `created_by`/`uploaded_by`/`attested_by`, timestamp defaults. Add indexes on `institution_id`, `framework`, `owner_id`, `status`, `due_date` for `compliance_obligations`. Note that `obligation_attestations` has no `updated_at` (append-only, immutable rows). Also add `insert into storage.buckets (id, name, public) values ('compliance-evidence', 'compliance-evidence', false)` at the bottom of this migration.

**Critical note:** `obligation_attestations.attested_at` MUST use `default now()` and be `NOT NULL`. Never accept from client.

---

### `supabase/migrations/20260522000021_compliance_rls.sql` (migration, CRUD)

**Analog:** `supabase/migrations/20260522000018_risk_rls.sql`

**RLS pattern** (lines 1–47):
```sql
alter table public.risks enable row level security;
alter table public.risks force row level security;

create policy "risks_select" on public.risks
  for select to authenticated
  using (institution_id = (select public.institution_id()));

create policy "risks_insert" on public.risks
  for insert to authenticated
  with check (
    institution_id = (select public.institution_id())
    and (select public.active_role()) in ('admin', 'ceo', 'risk-officer')
  );

create policy "risks_update" on public.risks
  for update to authenticated
  using  (institution_id = (select public.institution_id()))
  with check (
    institution_id = (select public.institution_id())
    and (select public.active_role()) in ('admin', 'ceo', 'risk-officer')
  );
```

**Apply for Phase 4:**
- `compliance_obligations`: SELECT = all view roles; INSERT/UPDATE = `admin`, `compliance-officer` (verify hyphen vs underscore against DB enum — see `supabase/migrations/20260522000001_base_schema.sql`).
- `obligation_evidence`: SELECT = broader view roles (admin, ceo, compliance-officer, risk-officer, audit-officer, board-member); INSERT = admin/compliance-officer only; NO UPDATE or DELETE.
- `obligation_attestations`: SELECT = all view roles; INSERT = admin/ceo/compliance-officer; NO UPDATE or DELETE (append-only enforced by omission).
- Add Storage RLS policies for `storage.objects` on `compliance-evidence` bucket. Use `(select auth.jwt() -> 'app_metadata' ->> 'institution_id')` — NOT flat `auth.jwt() ->> 'institution_id'` (see RESEARCH.md Pitfall 1 and `supabase/migrations/20260522000005_custom_access_token_hook.sql`).

---

### `supabase/migrations/20260522000022_compliance_triggers.sql` (migration, CRUD)

**Analog:** `supabase/migrations/20260522000019_risk_triggers.sql`

**Trigger attachment pattern** (lines 1–5):
```sql
-- Migration: 20260522000013_risk_triggers.sql
select audit.attach_audit_trigger('risks');
select audit.attach_audit_trigger('risk_treatments');
```

**Apply for Phase 4:** Three lines — one for each new table:
```sql
select audit.attach_audit_trigger('compliance_obligations');
select audit.attach_audit_trigger('obligation_evidence');
select audit.attach_audit_trigger('obligation_attestations');
```

---

### `lib/compliance/actions.ts` (service, request-response)

**Analog:** `lib/risk/actions.ts`

**Imports pattern** (lines 1–21):
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  obligationSchema,
  attestationSchema,
  evidenceUploadSchema,
  type ObligationInput,
  type AttestationInput,
} from '@/lib/schemas/compliance'
import type { AppRole } from '@/types/auth'
```

**Role constants and getWriteContext pattern** (lines 22–52):
```typescript
const WRITE_ROLES: AppRole[] = ['admin', 'compliance-officer']  // verify hyphen vs underscore
const ATTEST_ROLES: AppRole[] = ['admin', 'ceo', 'compliance-officer']
const GENERIC_ERROR = 'An unexpected error occurred. If this persists, contact your administrator.'

type ActionResult = { error: string } | { data: { id: string } }

async function getWriteContext(allowedRoles = WRITE_ROLES) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' as const }

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role
  const institutionId = appMeta?.institution_id

  if (!activeRole || !allowedRoles.includes(activeRole as AppRole)) {
    return { error: 'You do not have permission to perform this action.' as const }
  }
  if (!institutionId) {
    return { error: 'Institution context is missing from your token.' as const }
  }
  return { supabase, user, institutionId, activeRole }
}
```

**createObligation pattern** — copy from `createRisk` (lines 137–169):
```typescript
export async function createObligation(values: ObligationInput): Promise<ActionResult> {
  const parsed = obligationSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }
  const context = await getWriteContext(WRITE_ROLES)
  if ('error' in context) return { error: context.error }

  try {
    const { data, error } = await context.supabase
      .from('compliance_obligations')
      .insert({
        ...parsed.data,
        institution_id: context.institutionId,
        created_by: context.user.id,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[createObligation] DB error:', error)
      return { error: GENERIC_ERROR }
    }
    revalidateCompliancePaths(data.id)
    return { data: { id: data.id } }
  } catch (err) {
    console.error('[createObligation] Unexpected error:', err)
    return { error: GENERIC_ERROR }
  }
}
```

**revalidatePath helper** — copy from `revalidateRiskPaths` (lines 124–135):
```typescript
function revalidateCompliancePaths(obligationId?: string) {
  revalidatePath('/compliance')
  revalidatePath('/compliance/obligations')
  if (obligationId) {
    revalidatePath(`/compliance/obligations/${obligationId}`)
    revalidatePath(`/compliance/obligations/${obligationId}/attest`)
    revalidatePath(`/compliance/obligations/${obligationId}/evidence/upload`)
  }
}
```

**uploadEvidence action** — new pattern (no exact analog; see RESEARCH.md Pattern 3). Key additions over createObligation: compute `storagePath` from `${institutionId}/${obligationId}/${epoch}_${serverHash.slice(0,16)}.${ext}`, check collision via `supabase.storage.from('compliance-evidence').list(...)`, upload with `{ upsert: false }`, insert evidence record. Reuse `computeFileHash` from `lib/files/checksum.ts` (line 40).

**attestObligation action** — append-only insert then status update (see RESEARCH.md Pattern 6). Call `getWriteContext(ATTEST_ROLES)`. Never pass `attested_at` in the insert — use DB `default now()`.

**sendEscalationEmail helper** — copy from `sendOverdueEscalationEmail` in `lib/risk/actions.ts` (lines 54–122). Mirror the `admin.auth.admin.getUserById` + `user_profiles` lookups. Change recipients to obligation `owner_id` + institution `admin` users. Change subject to obligation-themed copy.

---

### `lib/compliance/queries.ts` (service, CRUD)

**Analog:** `lib/risk/queries.ts`

**Imports and DbClient typedef pattern** (lines 1–6):
```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type DbClient = SupabaseClient<Database>
```

**Query helper pattern** (lines 8–33 for listRisks):
```typescript
export async function listObligations(supabase: DbClient) {
  const { data, error } = await supabase
    .from('compliance_obligations')
    .select(`
      id, institution_id, framework, framework_reference,
      title, description, owner_id, due_date, status, created_at,
      user_profiles!owner_id ( first_name, last_name )
    `)
    .order('due_date', { ascending: true })

  return { data: data ?? [], error }
}
```

**getById pattern** — copy from `getRiskById` (lines 35–61). Use `.eq('id', obligationId).single()`.

**listEvidence and listAttestations** — separate query helpers following same `listRiskTreatments` pattern (lines 64–84): select from `obligation_evidence` and `obligation_attestations` filtered by `obligation_id`, ordered by `uploaded_at`/`attested_at` ascending.

**Dashboard query helpers** — three focused queries (no full row data needed):
```typescript
export async function getComplianceStats(supabase: DbClient) {
  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysOut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [statusData, overdueResult, expiringResult] = await Promise.all([
    supabase.from('compliance_obligations').select('status'),
    supabase.from('compliance_obligations')
      .select('*', { count: 'exact', head: true })
      .lt('due_date', today)
      .not('status', 'in', '("compliant","waived")'),
    supabase.from('compliance_obligations')
      .select('*', { count: 'exact', head: true })
      .gte('due_date', today)
      .lte('due_date', thirtyDaysOut)
      .not('status', 'in', '("compliant","waived")'),
  ])

  return {
    obligations: statusData.data ?? [],
    overdueCount: overdueResult.count ?? 0,
    expiringCount: expiringResult.count ?? 0,
  }
}
```

---

### `lib/compliance/compliance-utils.ts` (utility, transform)

**Analog:** `lib/risk/risk-utils.ts`

**Pure-function file structure** (lines 1–5):
```typescript
// lib/compliance/compliance-utils.ts
// Pure compliance business logic helpers. No Next.js, React, or Supabase imports.
import { isPast, addDays, differenceInDays } from 'date-fns'
import type { ObligationStatus, AttestationStatus } from '@/types/compliance'
```

**Badge map pattern** — copy from `RISK_STATUS_BADGE` (lines 35–41):
```typescript
export const OBLIGATION_STATUS_BADGE: Record<ObligationStatus, string> = {
  pending:              'bg-paper text-navy-mid border-paper-border',
  compliant:            'bg-ok/10 text-ok border-ok/30',
  partially_compliant:  'bg-warn/10 text-warn border-warn/30',
  non_compliant:        'bg-err/10 text-err border-err/30',
  overdue:              'bg-err/30 text-err border-err/50',
  waived:               'bg-gray-100 text-gray-500 border-gray-200',
}
```

**Overdue helper** — copy from `isTreatmentOverdue` (lines 17–26):
```typescript
export function isObligationOverdue(status: ObligationStatus, dueDate: string | Date): boolean {
  if (status === 'compliant' || status === 'waived' || status === 'overdue') return false
  return isPast(new Date(dueDate))
}
```

**Escalation threshold helper** (new — no analog):
```typescript
export function getEscalationThreshold(dueDate: string): 'early_warning' | 'due_today' | 'critical_overdue' | null {
  const diff = differenceInDays(new Date(dueDate), new Date())
  if (diff === -7 || diff < -7) return 'critical_overdue'
  if (diff === 0) return 'due_today'
  if (diff <= 3 && diff > 0) return 'early_warning'
  return null
}
```

**Immutable storage path constructor** (new — no analog):
```typescript
export function buildStoragePath(
  institutionId: string,
  obligationId: string,
  epoch: number,
  sha256Hash: string,
  ext: string,
): string {
  return `${institutionId}/${obligationId}/${epoch}_${sha256Hash.slice(0, 16)}.${ext}`
}
```

---

### `lib/schemas/compliance.ts` (utility, transform)

**Analog:** `lib/schemas/risk.ts`

**File header and import** (lines 1–2):
```typescript
// lib/schemas/compliance.ts
// Zod v3 schemas for compliance domain forms.
import { z } from 'zod'
```

**Enum schema pattern** — copy from `riskSchema` enum fields (line 28):
```typescript
framework: z.enum(['pecoga', 'ppdpa', 'nds2', 'iso_37000', 'king_iv', 'ipsas', 'pfma', 'other']),
```

**Cross-field refinement pattern** — copy from `riskSchema.refine` (lines 36–46):
```typescript
export const obligationSchema = z.object({ ... }).refine(
  (data) => data.framework !== 'other' || (data.framework_reference && data.framework_reference.length > 0),
  { message: 'Regulation reference is required when framework is set to Other.', path: ['framework_reference'] }
)
```

**Evidence upload schema with MIME enum** (new — no direct analog in risk):
```typescript
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'image/jpeg',
  'image/png',
] as const

export const evidenceUploadSchema = z.object({
  obligation_id: z.string().uuid(),
  sha256_hash: z.string().length(64).regex(/^[a-f0-9]+$/, 'Invalid checksum.'),
  mime_type: z.enum(ALLOWED_MIME_TYPES, { errorMap: () => ({ message: 'File type not accepted.' }) }),
  file_size_bytes: z.number().max(25 * 1024 * 1024, 'File size exceeds the 25 MB limit.'),
})
```

**Export types** — copy from bottom of `lib/schemas/risk.ts` (lines 74–78):
```typescript
export type ObligationInput = z.infer<typeof obligationSchema>
export type AttestationInput = z.infer<typeof attestationSchema>
export type EvidenceUploadInput = z.infer<typeof evidenceUploadSchema>
```

---

### `types/compliance.ts` (utility, transform)

**Analog:** `types/risk.ts`

**Type definition pattern** (lines 1–14):
```typescript
// types/compliance.ts
// Types and label maps for Phase 4 compliance domain.

export type RegulatoryFramework =
  | 'pecoga' | 'ppdpa' | 'nds2' | 'iso_37000' | 'king_iv' | 'ipsas' | 'pfma' | 'other'

export type ObligationStatus =
  | 'pending' | 'compliant' | 'partially_compliant' | 'non_compliant' | 'overdue' | 'waived'

export type AttestationStatus = 'compliant' | 'partially_compliant' | 'non_compliant'
```

**Label map pattern** — copy from `RISK_STATUS_LABELS` (lines 23–29):
```typescript
export const OBLIGATION_STATUS_LABELS: Record<ObligationStatus, string> = {
  pending: 'Pending',
  compliant: 'Compliant',
  partially_compliant: 'Partially Compliant',
  non_compliant: 'Non-Compliant',
  overdue: 'Overdue',
  waived: 'Waived',
}
```

**Row type interface** — copy from `RiskRegisterRow` interface (lines 43–58):
```typescript
export interface ObligationRow {
  id: string
  framework: RegulatoryFramework
  framework_reference: string | null
  title: string
  owner_id: string | null
  owner_name: string
  due_date: string
  status: ObligationStatus
  created_at: string
}
```

---

### `types/auth.ts` *(modify)* (utility, transform)

**Analog:** `types/auth.ts` (self — add new role)

**Existing AppRole type** (lines 1–8 — verify role string convention before modifying):
```typescript
export type AppRole =
  | 'admin'
  | 'board-member'
  | 'ceo'
  | 'risk-officer'
  | 'audit-officer'
  | 'dept-head'
```

**Modification:** Add `'compliance-officer'` (or `'compliance_officer'`) — confirm against `supabase/migrations/20260522000001_base_schema.sql` enum definition before choosing hyphen vs underscore. Also add entry to `ROLE_DESCRIPTIONS` constant.

---

### `app/(protected)/layout.tsx` *(modify)* (middleware, request-response)

**Analog:** `app/(protected)/layout.tsx` (self)

**Existing nav item pattern** (lines 43–55):
```tsx
<Link
  href="/risk"
  className="px-3 py-2 rounded-[6px] text-[14px] font-medium text-navy-900 hover:bg-paper transition-colors"
>
  Risk
</Link>
```

**Modification:** Add a "Compliance" nav item immediately after the "Risk" link, using the identical `<Link>` pattern. Wrap in role-gate only if CONTEXT.md D-37 requires restriction (the role matrix shows `dept-head` cannot view compliance dashboard, so gate behind the non-dept-head roles).

---

### `app/(protected)/compliance/page.tsx` (component, request-response)

**Analog:** `app/(protected)/risk/page.tsx`

**Server component structure** (lines 1–104 — full reference):
```typescript
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/types/auth'

export const dynamic = 'force-dynamic'

const VIEW_ROLES: AppRole[] = ['admin', 'ceo', 'compliance-officer', 'risk-officer', 'audit-officer', 'board-member']

export default async function ComplianceDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role as AppRole | undefined
  if (!activeRole || !VIEW_ROLES.includes(activeRole)) redirect('/dashboard')

  // Three parallel queries via getComplianceStats() from lib/compliance/queries.ts
  const stats = await getComplianceStats(supabase)
  const obligations = await listObligations(supabase)
  // ...render stat cards + obligations preview table
}
```

**StatCard inline component** — copy from `RiskOverviewPage`'s inline `StatCard` (lines 97–104):
```tsx
function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-[10px] border border-paper-border bg-white p-4 shadow-card">
      <p className="text-[12px] uppercase tracking-wider text-navy-mid">{label}</p>
      <p className={`mt-2 font-mono text-[28px] font-semibold ${accent}`}>{value}</p>
    </div>
  )
}
```

**Dashboard stat layout** — copy 3-stat grid from `app/(protected)/risk/page.tsx` (lines 60–65):
```tsx
<div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
  <StatCard label="% Compliant" value={compliancePct} accent="text-ok" />
  <StatCard label="Overdue" value={overdueCount} accent="text-err" />
  <StatCard label="Expiring (30 days)" value={expiringCount} accent="text-warn" />
</div>
```

---

### `app/(protected)/compliance/obligations/page.tsx` (component, request-response)

**Analog:** `app/(protected)/risk/register/page.tsx`

**Full page pattern** (lines 1–69 — full reference):
- Copy `export const dynamic = 'force-dynamic'`
- Copy VIEW_ROLES guard pattern (lines 10–30)
- Call `listObligations(supabase)` and normalize rows
- Pass normalized rows to `<ObligationsTable rows={normalizedRows} />`
- Header with "Add Obligation" CTA button (gold, href="/compliance/obligations/new")

---

### `app/(protected)/compliance/obligations/ObligationsTable.tsx` (component, request-response)

**Analog:** `app/(protected)/risk/register/RiskRegisterTable.tsx`

**Full client component pattern** (lines 1–209 — full reference):
```typescript
'use client'

import { useMemo, useState } from 'react'
import {
  createColumnHelper, flexRender, getCoreRowModel,
  getFilteredRowModel, getSortedRowModel, useReactTable,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { ObligationFilterBar } from './ObligationFilterBar'
import { OBLIGATION_STATUS_BADGE } from '@/lib/compliance/compliance-utils'
import { cn } from '@/lib/utils'
import type { ObligationStatus, RegulatoryFramework } from '@/types/compliance'
```

**Column helper and useState pattern** (lines 33–41):
```typescript
const column = createColumnHelper<ObligationRow>()

export function ObligationsTable({ rows }: { rows: ObligationRow[] }) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  // ...
}
```

**Table render pattern** (lines 175–208): copy the `overflow-x-auto rounded-[10px] border` wrapper, `<thead>` with `bg-paper` and uppercase tracking-wider headers, `<tbody>` with empty-state row, hover rows with `border-t border-paper-border`.

**filterFn pattern** (lines 62–65):
```typescript
filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
```

---

### `app/(protected)/compliance/obligations/new/ObligationForm.tsx` (component, request-response)

**Analog:** `app/(protected)/risk/new/RiskForm.tsx`

**Full form component pattern** (lines 1–247 — full reference):
```typescript
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { obligationSchema, type ObligationInput } from '@/lib/schemas/compliance'
import { createObligation } from '@/lib/compliance/actions'
```

**onSubmit / startTransition pattern** (lines 56–67):
```typescript
function onSubmit(values: ObligationInput) {
  setError(null)
  startTransition(async () => {
    const result = await createObligation(values)
    if ('error' in result) {
      setError(result.error)
      return
    }
    router.push('/compliance/obligations')
  })
}
```

**Card wrapper + Alert pattern** (lines 70–75):
```tsx
<div className="max-w-3xl rounded-[10px] border border-paper-border bg-white p-8 shadow-card">
  {error && (
    <Alert variant="destructive" role="alert" aria-live="assertive" className="mb-4">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )}
  {/* conditional framework_reference text field when framework === 'other' */}
```

**Submit button pattern** (lines 235–242):
```tsx
<Button
  type="submit"
  className="mt-6 h-11 bg-gold px-8 text-[14px] font-semibold text-navy-950 hover:bg-gold-hi"
  disabled={isPending}
>
  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Save Obligation
</Button>
```

---

### `app/(protected)/compliance/obligations/[id]/page.tsx` (component, request-response)

**Analog:** `app/(protected)/risk/[id]/page.tsx`

**Parallel query pattern** (lines 45–48):
```typescript
const [obligationResult, evidenceResult, attestationsResult] = await Promise.all([
  getObligationById(supabase, params.id),
  listEvidence(supabase, params.id),
  listAttestations(supabase, params.id),
])
```

**Sub-table pattern** — copy the treatments table from `app/(protected)/risk/[id]/page.tsx` (lines 149–199). Apply twice: once for evidence list, once for attestation history. Evidence rows show filename, size, upload date, download link (`/api/compliance/evidence/{id}`). Attestation rows show status badge, attested-by name, attested-at timestamp, notes.

**CTA buttons pattern** (lines 79–93):
```tsx
<div className="flex gap-2">
  <Link href={`/compliance/obligations/${obligation.id}/attest`} className="inline-flex items-center rounded-[8px] bg-gold px-4 py-2 ...">
    Attest
  </Link>
  <Link href={`/compliance/obligations/${obligation.id}/evidence/upload`} className="inline-flex items-center rounded-[8px] border ...">
    Upload Evidence
  </Link>
</div>
```

---

### `app/(protected)/compliance/obligations/[id]/attest/AttestationForm.tsx` (component, request-response)

**Analog:** `app/(protected)/risk/new/RiskForm.tsx`

Copy the full form pattern. Replace MatrixSelector with a radio group for three attestation statuses (compliant / partially_compliant / non_compliant). Add a `notes` Textarea. Call `attestObligation(obligationId, values)` in `startTransition`. On success `router.push(`/compliance/obligations/${obligationId}`)`.

---

### `app/(protected)/compliance/obligations/[id]/evidence/upload/EvidenceUploadForm.tsx` (component, file-I/O)

**Analog:** `app/(protected)/risk/new/RiskForm.tsx` (form shell) + Web Crypto API pattern (new)

**Form shell** — copy imports and `useForm` setup from `RiskForm.tsx` (lines 1–55). Replace with `evidenceUploadSchema`.

**Browser SHA-256 computation** (new pattern — no codebase analog):
```typescript
'use client'

async function computeSHA256Browser(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
```

**File input onChange handler** (new pattern):
```typescript
async function onFileChange(file: File) {
  setSelectedFile(file)
  setIsHashing(true)
  try {
    const hash = await computeSHA256Browser(file)
    setComputedHash(hash)
    form.setValue('sha256_hash', hash)
    form.setValue('mime_type', file.type as AllowedMimeType)
    form.setValue('file_size_bytes', file.size)
  } finally {
    setIsHashing(false)
  }
}
```

**FormData submission** (differs from regular JSON Server Action):
```typescript
function onSubmit(values: EvidenceUploadInput) {
  startTransition(async () => {
    const fd = new FormData()
    fd.append('file', selectedFile!)
    fd.append('obligation_id', obligationId)
    fd.append('sha256_hash', values.sha256_hash)
    const result = await uploadEvidence(fd)
    if ('error' in result) { setError(result.error); return }
    router.push(`/compliance/obligations/${obligationId}`)
  })
}
```

---

### `app/api/compliance/evidence/[id]/route.ts` (controller, file-I/O)

**Analog:** `app/api/audit/export/route.ts`

**Auth + role guard pattern** (lines 8–20):
```typescript
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyChecksum } from '@/lib/files/checksum'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role
  if (!activeRole || !VIEW_ROLES.includes(activeRole)) {
    return new Response('Forbidden', { status: 403 })
  }
```

**Response with file attachment pattern** — copy from `app/api/audit/export/route.ts` (lines 63–73):
```typescript
return new Response(bytes, {
  headers: {
    'Content-Type': evidence.mime_type,
    'Content-Disposition': `attachment; filename="${evidence.original_filename}"`,
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  },
})
```

**Integrity check response** (new — no codebase analog):
```typescript
if (!isValid) {
  return Response.json(
    { error: 'integrity_check_failed', message: 'File checksum mismatch — evidence may have been modified.' },
    { status: 409 }
  )
}
```

**Supabase Storage download** (new):
```typescript
const { data: blob, error: storageError } = await supabase.storage
  .from('compliance-evidence')
  .download(evidence.storage_path)
if (storageError || !blob) return new Response('Storage error', { status: 500 })
const bytes = Buffer.from(await blob.arrayBuffer())
const isValid = verifyChecksum(bytes, evidence.sha256_hash)  // lib/files/checksum.ts line 20
```

---

### `app/api/compliance/escalate/route.ts` (controller, event-driven)

**Analog:** `app/api/audit/export/route.ts` (auth guard structure)

**CRON_SECRET guard** (new pattern — no codebase analog; add before any logic):
```typescript
export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }
  // ... call lib/compliance/escalation.ts
}
```

**Admin client for escalation emails** — copy `createAdminClient()` import from `lib/risk/actions.ts` (line 6). Use same admin-level user lookup pattern (lines 66–79) to resolve owner email addresses.

---

### `components/compliance/ObligationFilterBar.tsx` (component, request-response)

**Analog:** `app/(protected)/risk/register/RiskFilterBar.tsx`

**Full filter bar pattern** (lines 1–95 — full reference):
Copy the entire component. Replace `category/severity/owner/status` props with `framework/status/owner`. Replace SelectItem values with regulatory framework options and obligation status options. Keep the `hasActiveFilters` check and "Clear filters" button unchanged.

---

### `components/compliance/ComplianceStatCard.tsx` (component, transform)

**Analog:** Inline `StatCard` function in `app/(protected)/risk/page.tsx` (lines 97–104)

Extract into a standalone component:
```tsx
// components/compliance/ComplianceStatCard.tsx
interface ComplianceStatCardProps {
  label: string
  value: number | string
  accent: string
  description?: string
}

export function ComplianceStatCard({ label, value, accent, description }: ComplianceStatCardProps) {
  return (
    <div className="rounded-[10px] border border-paper-border bg-white p-4 shadow-card">
      <p className="text-[12px] uppercase tracking-wider text-navy-mid">{label}</p>
      <p className={`mt-2 font-mono text-[28px] font-semibold ${accent}`}>{value}</p>
      {description && <p className="mt-1 text-[12px] text-navy-mid">{description}</p>}
    </div>
  )
}
```

---

### `next.config.mjs` *(modify)* (config)

**Analog:** `next.config.mjs` (self)

**Current state** (lines 1–10):
```javascript
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}
```

**Modification required** — add `bodySizeLimit` to handle 25 MB evidence uploads (see RESEARCH.md Pitfall 2):
```javascript
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
      bodySizeLimit: '26mb',  // Required for 25 MB evidence file uploads
    },
  },
}
```

---

## Shared Patterns

### Authentication Guard (all Server Components and Route Handlers)

**Source:** `app/(protected)/risk/register/page.tsx` lines 10–30, `app/api/audit/export/route.ts` lines 8–20

**Apply to:** All 6 compliance page files, both API route files

```typescript
// Server Components — redirect pattern
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
const appMeta = user.app_metadata as Record<string, string>
const activeRole = appMeta?.active_role as AppRole | undefined
if (!activeRole || !VIEW_ROLES.includes(activeRole)) redirect('/dashboard')

// Route Handlers — Response pattern
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return new Response('Unauthorized', { status: 401 })
const appMeta = user.app_metadata as Record<string, string>
const activeRole = appMeta?.active_role
if (!activeRole || !ALLOWED_ROLES.includes(activeRole)) return new Response('Forbidden', { status: 403 })
```

### Server Action Role Check via getWriteContext

**Source:** `lib/risk/actions.ts` lines 31–52

**Apply to:** `lib/compliance/actions.ts` — all exported functions call `getWriteContext(roleArray)` first

```typescript
async function getWriteContext(allowedRoles = WRITE_ROLES) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' as const }
  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role
  const institutionId = appMeta?.institution_id
  if (!activeRole || !allowedRoles.includes(activeRole as AppRole)) {
    return { error: 'You do not have permission to perform this action.' as const }
  }
  if (!institutionId) return { error: 'Institution context is missing from your token.' as const }
  return { supabase, user, institutionId, activeRole }
}
```

### Error Handling in Server Actions

**Source:** `lib/risk/actions.ts` lines 145–168 (createRisk)

**Apply to:** All exported functions in `lib/compliance/actions.ts`

```typescript
try {
  const { data, error } = await context.supabase.from('...').insert({ ... }).select('id').single()
  if (error) {
    console.error('[actionName] DB error:', error)
    return { error: GENERIC_ERROR }
  }
  revalidateCompliancePaths(data.id)
  return { data: { id: data.id } }
} catch (err) {
  console.error('[actionName] Unexpected error:', err)
  return { error: GENERIC_ERROR }
}
```

### RLS Convention

**Source:** `supabase/migrations/20260522000018_risk_rls.sql` lines 1–47

**Apply to:** `supabase/migrations/20260522000021_compliance_rls.sql`

Always use `(select public.institution_id())` and `(select public.active_role())` — never inline subqueries. Always call both `enable row level security` and `force row level security`.

### ISR Cache Prevention

**Source:** `app/(protected)/risk/page.tsx` line 9

**Apply to:** All 6 compliance page files under `app/(protected)/compliance/`

```typescript
export const dynamic = 'force-dynamic'
```

### Supabase Client Split

**Source:** `lib/supabase/server.ts` (server), `lib/supabase/client.ts` (browser)

**Apply to:**
- Server Components and Server Actions: `import { createClient } from '@/lib/supabase/server'`
- Client Components (EvidenceUploadForm, ObligationsTable, ObligationFilterBar): `import { createClient } from '@/lib/supabase/client'`
- Admin-level operations (escalation email lookups): `import { createAdminClient } from '@/lib/supabase/admin'`

### Badge Rendering

**Source:** `lib/risk/risk-utils.ts` lines 28–49 (RISK_STATUS_BADGE), `app/(protected)/risk/[id]/page.tsx` lines 99–101

**Apply to:** `ObligationsTable.tsx`, `AttestationRow`, obligation detail page

```tsx
import { cn } from '@/lib/utils'
<span className={cn('inline-flex rounded-[6px] border px-2 py-1 text-[12px] font-medium', OBLIGATION_STATUS_BADGE[status])}>
  {OBLIGATION_STATUS_LABELS[status]}
</span>
```

### Resend Email Pattern

**Source:** `lib/risk/actions.ts` lines 54–122 (`sendOverdueEscalationEmail`)

**Apply to:** `lib/compliance/escalation.ts`

Key steps:
1. `const admin = createAdminClient()`
2. `Promise.all([admin.auth.admin.getUserById(ownerId), admin.from('user_roles').select...eq('role_name','admin'), admin.from('user_profiles').select...])` for owner name
3. Deduplicate into `Set<string>`, then `resend.emails.send({ from, to: Array.from(set), subject, html })`

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `lib/compliance/escalation.ts` | service | event-driven | Has a close analog (sendOverdueEscalationEmail inline in lib/risk/actions.ts) but no standalone escalation.ts file exists yet — planner should extract the email function as a separate module |

---

## Critical Pre-Implementation Checks

Before any Server Action or migration writes role names, verify the convention used in the DB enum:

1. **Check `supabase/migrations/20260522000001_base_schema.sql`** for the `app_role` or `user_role` enum. The existing roles use hyphens (`risk-officer`, `audit-officer`) per `types/auth.ts`. Apply the same convention for `compliance-officer`.

2. **Check `supabase/migrations/20260522000005_custom_access_token_hook.sql`** for the JWT claim path for `institution_id`. Storage RLS policies must use `(select auth.jwt() -> 'app_metadata' ->> 'institution_id')` NOT flat `auth.jwt() ->> 'institution_id'`.

3. **Add `CRON_SECRET` to `.env.local.example`** — this is a net-new environment variable with no fallback. The escalation route is non-functional without it.

---

## Metadata

**Analog search scope:** `lib/risk/`, `lib/schemas/`, `lib/files/`, `lib/supabase/`, `app/(protected)/risk/`, `app/api/`, `types/`, `supabase/migrations/`, `app/(protected)/layout.tsx`, `next.config.mjs`
**Files scanned:** 22 analog files read in full
**Pattern extraction date:** 2026-05-23
