# Phase 3: Enterprise Risk Management - Risk Register and Heatmap - Pattern Map

**Mapped:** 2026-05-23
**Files analyzed (expected new/updated):** 19
**Analogs found:** 18 / 19

## File Classification

| Target file (expected new/updated) | Role | Data flow | Closest analog file | Match quality |
|---|---|---|---|---|
| `supabase/migrations/20260522000010_risk_schema.sql` | migration | batch | `supabase/migrations/20260522000007_strategic_schema.sql` | exact |
| `supabase/migrations/20260522000011_risk_rls.sql` | migration | batch | `supabase/migrations/20260522000008_strategic_rls.sql` | exact |
| `supabase/migrations/20260522000012_risk_triggers.sql` | migration | batch | `supabase/migrations/20260522000009_strategic_triggers.sql` | exact |
| `lib/schemas/risk.ts` | schema | transform | `lib/schemas/strategic.ts` | exact |
| `lib/risk/actions.ts` | server action | CRUD + event-driven (email escalation) | `lib/strategic/actions.ts` + `lib/auth/admin-actions.ts` | exact |
| `lib/risk/queries.ts` | query helper | request-response | `lib/strategic/queries.ts` | exact |
| `lib/risk/risk-utils.ts` | utility | transform | `lib/strategic/kpi-utils.ts` | role-match |
| `types/risk.ts` | type definition | transform | `types/strategic.ts` | exact |
| `app/(protected)/risk/page.tsx` | protected page (server) | request-response | `app/(protected)/strategic/page.tsx` | exact |
| `app/(protected)/risk/register/page.tsx` | protected page (server) | request-response | `app/(protected)/admin/audit-log/page.tsx` | role-match |
| `app/(protected)/risk/register/RiskRegisterTable.tsx` | table component (client) | CRUD + filter | `app/(protected)/strategic/KpiGrid.tsx` | exact |
| `app/(protected)/risk/register/RiskFilterBar.tsx` | filter component (client) | request-response | `app/(protected)/strategic/KpiFilterBar.tsx` + `app/(protected)/admin/audit-log/FilterBar.tsx` | exact |
| `app/(protected)/risk/new/RiskForm.tsx` | form component (client) | request-response | `app/(protected)/strategic/objectives/new/ObjectiveForm.tsx` | exact |
| `app/(protected)/risk/new/page.tsx` | form shell page (server) | request-response | `app/(protected)/strategic/objectives/new/page.tsx` | exact |
| `app/(protected)/risk/[id]/page.tsx` | detail page (server) | CRUD | `app/(protected)/strategic/objectives/[id]/page.tsx` | role-match |
| `app/(protected)/risk/heatmap/page.tsx` | protected page (server) | request-response | `app/(protected)/strategic/page.tsx` | role-match |
| `app/(protected)/risk/RiskHeatmap.tsx` | visualization component (client) | transform | `app/(protected)/strategic/KpiSparkline.tsx` (visual component conventions only) | partial |
| `components/risk/TreatmentStatusSelect.tsx` | inline editor component (client) | CRUD | `app/(protected)/admin/users/UserManagementTable.tsx` (inline row select/update) | role-match |
| `app/(protected)/layout.tsx` (update nav link + optional role gate) | protected layout | request-response | existing `app/(protected)/layout.tsx` | modify |

## Pattern Assignments

| Target file | Closest analog | Pattern to copy | Exact API/signature or code convention to preserve | Pitfalls to avoid |
|---|---|---|---|---|
| `supabase/migrations/20260522000010_risk_schema.sql` | `supabase/migrations/20260522000007_strategic_schema.sql` | Enum block first, then table DDL, then `idx_{table}_{column}` indexes | Include `institution_id uuid not null references public.institutions(id)` and `created_at/updated_at timestamptz not null default now()` on governance tables | Do not alter existing Phase 1/2 migrations; avoid adding computed score column (`inherent_score`) |
| `supabase/migrations/20260522000011_risk_rls.sql` | `supabase/migrations/20260522000008_strategic_rls.sql` | `enable row level security` + `force row level security` + per-verb policies | Use `(select public.institution_id())` and `(select public.active_role())` wrappers in policy predicates | Do not inline helper calls without `select`; do not omit `to authenticated` |
| `supabase/migrations/20260522000012_risk_triggers.sql` | `supabase/migrations/20260522000009_strategic_triggers.sql` | Trigger-only migration using `audit.attach_audit_trigger('<table>')` per table | Keep file limited to attach statements for `risks` and `risk_treatments` | Do not redefine audit functions; ensure schema migration runs before trigger migration |
| `lib/schemas/risk.ts` | `lib/schemas/strategic.ts` | Zod v3 object schemas + `safeParse` compatibility + exported inferred types | Preserve helper style for numbers: `z.preprocess(..., z.coerce.number(...))`; export `type RiskInput = z.infer<typeof riskSchema>` | Do not introduce Zod v4 APIs; avoid empty-string-to-0 coercion bug |
| `lib/risk/actions.ts` | `lib/strategic/actions.ts` | `'use server'`, Zod parse first, `createClient`, `getUser`, role check via `user.app_metadata.active_role`, `revalidatePath` after writes | Keep union return shape: `Promise<{ error: string } | { data: { id: string } }>` for create/update actions | Do not use `getSession()` for auth trust; do not accept `institution_id` from client payload |
| `lib/risk/actions.ts` (escalation) | `lib/auth/admin-actions.ts` | Side-effect server action (email + audit/event logging) inside action flow with fail-safe logging | Pattern: call notification helper after DB state transition, log non-fatal email errors, still return success when core write succeeds | Do not fail entire transaction only because email send failed |
| `lib/risk/queries.ts` | `lib/strategic/queries.ts` | Request-scoped query helper functions taking `SupabaseClient` argument; embedded relation selects | Preserve signature style: `export async function getX(supabase: SupabaseClient, opts?)` | Avoid creating global Supabase client in helper file |
| `lib/risk/risk-utils.ts` | `lib/strategic/kpi-utils.ts` | Pure functions, no Next/Supabase imports, deterministic return values | `calculateRiskScore(likelihood, impact): number`; `getRiskSeverity(score): 'low'|'medium'|'high'|'critical'`; `isTreatmentOverdue(...)` | Do not store computed score in DB; avoid timezone bugs (`parseISO` + `isPast`) |
| `app/(protected)/risk/page.tsx` | `app/(protected)/strategic/page.tsx` | Server component role gate + parallel data loads + summary/cards composition | Preserve `export const dynamic = 'force-dynamic'` and role allowlist check before rendering | Do not cache authenticated pages with ISR |
| `app/(protected)/risk/register/page.tsx` | `app/(protected)/admin/audit-log/page.tsx` | URL search param parsing + server filtering scaffold + paged query | Keep typed `searchParams` parsing and safe page fallback: `Math.max(1, parseInt(...))` | Do not trust invalid query params; clamp page bounds |
| `app/(protected)/risk/register/RiskRegisterTable.tsx` | `app/(protected)/strategic/KpiGrid.tsx` | TanStack `useReactTable` with `getCoreRowModel/getSortedRowModel/getFilteredRowModel`, memoized columns, empty-row fallback | Preserve `columns = useMemo<ColumnDef<Row>[]>(...)` and filter model wiring | Do not recreate columns on every render; avoid non-memoized expensive cell computations |
| `app/(protected)/risk/register/RiskFilterBar.tsx` | `app/(protected)/strategic/KpiFilterBar.tsx` + `app/(protected)/admin/audit-log/FilterBar.tsx` | Controlled filter state + URL query mutation (`useRouter`, `useSearchParams`) + Apply/Clear buttons | Preserve `new URLSearchParams()`, reset to page 1 on apply | Do not trigger full browser reload; keep client-side navigation via `router.push` |
| `app/(protected)/risk/new/RiskForm.tsx` | `app/(protected)/strategic/objectives/new/ObjectiveForm.tsx` | RHF + `zodResolver` + `useTransition` submit + inline Alert errors + `FormField` composition | Preserve `const form = useForm<...>({ resolver: zodResolver(schema), ... })`; submit pattern uses `startTransition(async () => ...)` | Avoid uncontrolled/controlled mismatch in `Select` and matrix selector values |
| `components/risk/TreatmentStatusSelect.tsx` | `app/(protected)/admin/users/UserManagementTable.tsx` | Inline table-row action control using shadcn `Select` and async update handlers | Pattern: `Select value={...} onValueChange={...}` plus optimistic UI/revert on failure | Do not allow manual selection of `overdue`; render read-only badge when overdue |
| `app/(protected)/risk/[id]/page.tsx` | `app/(protected)/strategic/objectives/[id]/page.tsx` | Detail page: server fetch + role-derived action buttons + relational section cards | Preserve redirect-on-missing strategy (`if (!record) redirect('/risk/register')`) | Do not leak cross-institution existence details via custom error text |
| `app/(protected)/risk/RiskHeatmap.tsx` | `app/(protected)/strategic/KpiSparkline.tsx` (visual style baseline) | Client visualization component pattern (small reusable visual unit, typed props, local formatting logic) | Keep `'use client'` and typed risk-dot payload props | No direct CSS-grid analog exists; avoid adding Nivo for fixed-zone matrix per phase decision |
| `app/(protected)/layout.tsx` (update) | existing `app/(protected)/layout.tsx` | Sidebar link injection + active-role conditionals in layout | Preserve auth gate and `force-dynamic` in layout | Avoid exposing admin-only sections to non-admin roles |

## DB/RLS/Audit Migration Patterns

### 1) Schema migration template (copy from strategic schema migration)
Source analog: `supabase/migrations/20260522000007_strategic_schema.sql`

```sql
-- Migration: 20260522000010_risk_schema.sql
create type public.risk_category as enum (...);
create type public.risk_status as enum (...);
create type public.treatment_status as enum (...);

create table public.risks (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  ...,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_risks_institution_id on public.risks (institution_id);
```

Conventions to preserve:
- Enum types declared before table definitions.
- Governance tables include `institution_id`, `created_by`, `created_at`, `updated_at`.
- Index naming format: `idx_<table>_<column>`.

Pitfalls:
- Migration number collision exists in repo (`20260522000010_fix_admin_user.sql` already present). Keep sequence monotonic and conflict-free.

### 2) RLS migration template
Source analog: `supabase/migrations/20260522000008_strategic_rls.sql`

```sql
alter table public.risks enable row level security;
alter table public.risks force row level security;

create policy "risks_select" on public.risks
  for select to authenticated
  using (institution_id = (select public.institution_id()));
```

Conventions to preserve:
- Always use `(select public.institution_id())` and `(select public.active_role())` wrappers.
- Explicit `to authenticated` in every policy.

### 3) Audit trigger migration template
Source analog: `supabase/migrations/20260522000009_strategic_triggers.sql`

```sql
select audit.attach_audit_trigger('risks');
select audit.attach_audit_trigger('risk_treatments');
```

Conventions to preserve:
- Trigger migration should only attach triggers.
- No redefinition of `audit.*` helper functions.

## Server Action Patterns

Primary analog: `lib/strategic/actions.ts`
Secondary analog for side effects: `lib/auth/admin-actions.ts`

Required action skeleton to preserve:

```ts
'use server'

export async function createRisk(values: RiskInput): Promise<{ error: string } | { data: { id: string } }> {
  const parsed = riskSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' }

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role
  const institutionId = appMeta?.institution_id

  // role gate...

  const { data, error } = await supabase.from('risks').insert({ ...parsed.data, institution_id: institutionId, created_by: user.id }).select('id').single()
  if (error) return { error: GENERIC_ERROR }

  revalidatePath('/risk/register')
  revalidatePath('/risk')
  return { data: { id: (data as { id: string }).id } }
}
```

Conventions to preserve:
- Parse with Zod before any DB calls.
- Use `getUser()` (not `getSession()`) for trust boundary.
- Use app metadata claims for role and institution context.
- Revalidate affected paths after writes.

Pitfalls:
- Mass assignment: never spread raw client object; only `parsed.data`.
- `redirect()` should not be called inside try/catch in server actions.

## Zod and react-hook-form Patterns

Schema analog: `lib/schemas/strategic.ts`
Form analog: `app/(protected)/strategic/objectives/new/ObjectiveForm.tsx`

Required schema convention:

```ts
const numericField = (errorMessage: string) =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.number({ invalid_type_error: errorMessage }),
  )
```

Required form signature convention:

```ts
const form = useForm<RiskInput>({
  resolver: zodResolver(riskSchema),
  defaultValues: { ... },
  mode: 'onBlur',
})
```

Conventions to preserve:
- Keep Zod v3 API compatibility only.
- Use shadcn `FormField` + `FormMessage` for each field.
- Submit with `useTransition` and show non-blocking pending state.

Pitfalls:
- Empty-string numeric inputs silently coercing to `0` if preprocess is omitted.
- Matrix selector values drifting out-of-sync with RHF field state.

## TanStack Register and Filter Pattern

Table analog: `app/(protected)/strategic/KpiGrid.tsx`
Filter analogs: `app/(protected)/strategic/KpiFilterBar.tsx`, `app/(protected)/admin/audit-log/FilterBar.tsx`

Required table wiring:

```ts
const table = useReactTable({
  data,
  columns,
  state: { sorting },
  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
})
```

Required filter-bar behavior:
- Controlled filter state initialized from `useSearchParams()`.
- `handleApply()` writes query params and resets `page=1`.
- `handleClear()` resets local state and routes to base register URL.
- Client navigation only (`router.push`), no hard reload.

Pitfalls:
- Recomputing column definitions every render.
- Filtering by derived severity without stable accessor function.

## Heatmap CSS Grid Pattern Placement

Primary source contract: `.planning/phases/03-enterprise-risk-management-risk-register-and-heatmap/03-RESEARCH.md` and `.planning/phases/03-enterprise-risk-management-risk-register-and-heatmap/03-UI-SPEC.md`

Closest code-style analog (visual component conventions only): `app/(protected)/strategic/KpiSparkline.tsx`

Required placement and orientation contract:
- Component location: `app/(protected)/risk/RiskHeatmap.tsx` (client component).
- Page host: `app/(protected)/risk/heatmap/page.tsx` (server component with `force-dynamic`).
- Grid geometry: 5 columns x 5 rows using CSS grid.
- Orientation: top row likelihood `5`, bottom row likelihood `1`; impact left-to-right `1..5`.

Required grid convention snippet:

```tsx
<div
  className="grid gap-[2px]"
  style={{ gridTemplateColumns: 'repeat(5, 64px)', gridTemplateRows: 'repeat(5, 64px)' }}
>
  {/* 25 severity-zoned cells */}
</div>
```

Pitfalls:
- Do not use Nivo heatmap for this phase requirement (fixed discrete zones required).
- Avoid axis inversion (common bug: rendering likelihood bottom-up incorrectly).

## Inline Treatment Status Select Pattern

Primary analog: `app/(protected)/admin/users/UserManagementTable.tsx` (inline row select + async action)
UI contract source: `.planning/phases/03-enterprise-risk-management-risk-register-and-heatmap/03-UI-SPEC.md` (Component 28)

Required component shape:

```tsx
<Select value={treatment.status} onValueChange={(val) => handleStatusUpdate(treatment.id, val)}>
  <SelectTrigger className="h-7 w-[130px] text-[13px] border-paper-border rounded-grc-sm">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="planned">Planned</SelectItem>
    <SelectItem value="in_progress">In Progress</SelectItem>
    <SelectItem value="completed">Completed</SelectItem>
    <SelectItem value="cancelled">Cancelled</SelectItem>
  </SelectContent>
</Select>
```

Conventions to preserve:
- Async status update should be immediate with optimistic UI behavior.
- For `overdue` status, render read-only badge instead of editable select.

Pitfalls:
- Do not expose `overdue` as user-selectable option.
- Do not force full-page refresh for each status change.

## Shared Cross-Cutting Patterns

### Auth and role-gate checks
Source analogs:
- `middleware.ts`
- `app/(protected)/layout.tsx`
- `app/(protected)/strategic/page.tsx`

Required conventions:
- Protected pages/layouts use `getUser()` and redirect unauthenticated users.
- Role allowlists evaluated from `user.app_metadata.active_role`.
- Protected pages export `dynamic = 'force-dynamic'`.

### Supabase client boundaries
Source analogs:
- `lib/supabase/server.ts`
- `lib/supabase/client.ts`

Required conventions:
- Server components/actions use server client only.
- Client components use browser client only when needed.

### Revalidation strategy
Source analog: `lib/strategic/actions.ts`

Required conventions:
- Revalidate list page + detail page + summary/dashboard page after writes.

## No Direct Analog Found

| Target file | Role | Data flow | Reason |
|---|---|---|---|
| `app/(protected)/risk/RiskHeatmap.tsx` (full 5x5 discrete-zone matrix) | visualization component | transform | Existing code has chart/sparkline visual patterns but no full CSS-grid risk matrix implementation yet |

## Metadata

**Analog search scope:** `supabase/migrations`, `lib/**`, `app/(protected)/**`, `components/ui/**`, `types/**`

**Primary reused references from Phase 2 patterns:**
- `supabase/migrations/20260522000007_strategic_schema.sql`
- `supabase/migrations/20260522000008_strategic_rls.sql`
- `supabase/migrations/20260522000009_strategic_triggers.sql`
- `lib/strategic/actions.ts`
- `lib/schemas/strategic.ts`
- `lib/strategic/queries.ts`
- `app/(protected)/strategic/KpiGrid.tsx`
- `app/(protected)/strategic/KpiFilterBar.tsx`

## PATTERN MAPPING COMPLETE