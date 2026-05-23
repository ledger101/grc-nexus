import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/types/auth'
import { listRiskHeatmapPoints } from '@/lib/risk/queries'
import { RiskHeatmap } from '@/app/(protected)/risk/RiskHeatmap'
import type { RiskStatus } from '@/types/risk'

export const dynamic = 'force-dynamic'

const VIEW_ROLES: AppRole[] = [
  'admin',
  'ceo',
  'risk-officer',
  'audit-officer',
  'board-member',
  'dept-head',
]

type HeatmapPoint = {
  id: string
  title: string
  status: RiskStatus
  inherent_likelihood: number
  inherent_impact: number
}

export default async function RiskHeatmapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role as AppRole | undefined

  if (!activeRole || !VIEW_ROLES.includes(activeRole)) {
    redirect('/dashboard')
  }

  const { data: points } = await listRiskHeatmapPoints(supabase)
  const typedPoints = points as unknown as HeatmapPoint[]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-navy-900">Risk Heatmap</h1>
          <p className="mt-1 text-[14px] text-navy-mid">Institutional risks by inherent score (closed risks excluded).</p>
        </div>
        <span className="rounded-[6px] border border-paper-border bg-white px-3 py-1 text-[12px] text-navy-mid">
          Showing {typedPoints.length} active risks
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4 text-[12px] text-navy-mid">
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-ok" />Low (1-4)</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-warn" />Medium (5-9)</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-err/70" />High (10-15)</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-err ring-2 ring-white ring-offset-1 ring-offset-err" />Critical (16-25)</span>
      </div>

      <div className="inline-block rounded-[10px] border border-paper-border bg-white p-6 shadow-card">
        <RiskHeatmap points={typedPoints} />
      </div>
    </div>
  )
}
