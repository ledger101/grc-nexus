// app/(protected)/strategic/page.tsx
// KPI summary dashboard — Server Component. (D-17, STRAT-06)
// Fetches paginated KPIs with readings and renders KpiFilterBar + KpiGrid.
// SECURITY: force-dynamic prevents ISR caching of authenticated responses.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getKpisWithReadings, getObjectives, KPI_PAGE_SIZE } from '@/lib/strategic/queries'
import { KpiGrid } from './KpiGrid'
import { KpiFilterBar } from './KpiFilterBar'
import type { AppRole } from '@/types/auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Strategic KPIs — GRC-Nexus' }

// Roles that can view the KPI dashboard (D-22, D-23)
const ALLOWED_ROLES: AppRole[] = [
  'admin',
  'ceo',
  'risk-officer',
  'audit-officer',
  'board-member',
  'dept-head',
]

export default async function StrategicPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const appMeta = user.app_metadata as Record<string, unknown>
  const activeRole = appMeta?.active_role as AppRole | undefined

  if (!activeRole || !ALLOWED_ROLES.includes(activeRole)) {
    redirect('/dashboard')
  }

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const statusFilter = searchParams.status ?? ''
  const objectiveId = searchParams.objective ?? ''

  const [kpisResult, objectivesResult] = await Promise.all([
    getKpisWithReadings(supabase, { page, objectiveId: objectiveId || undefined }),
    getObjectives(supabase),
  ])

  const { data: kpis, count } = kpisResult
  const objectives = objectivesResult.data.map((o) => ({ id: o.id, title: o.title }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-navy-900 font-body">Strategic KPIs</h1>
          <p className="text-[14px] text-navy-mid mt-1">
            Institution KPI performance dashboard — {(count ?? 0).toLocaleString()} KPIs
          </p>
        </div>
      </div>
      <KpiFilterBar objectives={objectives} />
      <KpiGrid
        kpis={kpis}
        totalCount={count ?? 0}
        page={page}
        pageSize={KPI_PAGE_SIZE}
        statusFilter={statusFilter}
      />
    </div>
  )
}
