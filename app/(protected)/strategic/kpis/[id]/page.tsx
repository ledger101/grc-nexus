// app/(protected)/strategic/kpis/[id]/page.tsx
// Server Component — KPI detail page with readings history and role-gated Record Reading link.
// SECURITY: force-dynamic prevents ISR caching; RLS enforces institution_id isolation.
// Status is calculated on-the-fly from latest reading vs target_value (D-14, D-15).
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { calculateKpiStatus, KPI_STATUS_BADGE } from '@/lib/strategic/kpi-utils'
import { getLatestReading } from '@/lib/strategic/queries'
import { KPI_FREQUENCY_LABELS } from '@/types/strategic'
import type { AppRole, AppMetadata } from '@/types/auth'
import type { KpiFrequency } from '@/types/strategic'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

export default async function KpiDetailPage({ params }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const appMeta = user.app_metadata as Partial<AppMetadata>
  const activeRole = appMeta?.active_role as AppRole | undefined

  // Fetch KPI with linked objective title and owner name (RLS enforces institution_id scoping)
  const { data: kpi } = await supabase
    .from('kpis')
    .select('*, strategic_objectives(id, title), user_profiles!owner_id(full_name)')
    .eq('id', params.id)
    .single()

  if (!kpi) redirect('/strategic')

  // Fetch all readings for this KPI for history list — ordered most recent first
  const { data: readings } = await supabase
    .from('kpi_readings')
    .select('*')
    .eq('kpi_id', params.id)
    .order('recorded_at', { ascending: false })

  // Compute status from latest reading (D-14, D-15, D-16)
  const latest = getLatestReading(readings ?? [])
  const status = calculateKpiStatus(latest?.actual_value ?? null, kpi.target_value)
  const badge = KPI_STATUS_BADGE[status]

  // Role gate for Record Reading link (D-13)
  const canRecord = activeRole === 'admin' || user.id === kpi.owner_id

  const ownerName = (kpi.user_profiles as { full_name: string } | null)?.full_name ?? '—'
  const objectiveTitle = (kpi.strategic_objectives as { id: string; title: string } | null)?.title ?? '—'
  const objectiveId = (kpi.strategic_objectives as { id: string; title: string } | null)?.id

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[20px] font-semibold text-navy-900 font-body">{kpi.title}</h1>
            <Badge className={`text-[12px] font-medium border ${badge.className}`}>
              {badge.label}
            </Badge>
          </div>
          <Link
            href="/strategic"
            className="text-[13px] text-navy-mid hover:text-navy-900 transition-colors mt-1 inline-block"
          >
            &larr; Back to KPI Dashboard
          </Link>
        </div>
        {canRecord && (
          <Link
            href={`/strategic/kpis/${params.id}/readings/new`}
            className="inline-flex items-center px-4 py-2 rounded-[8px] bg-gold text-navy-950 hover:bg-gold-hi text-[13px] font-medium shadow-card transition-colors"
          >
            Record Reading
          </Link>
        )}
      </div>

      {/* Detail card */}
      <div className="bg-white rounded-[10px] border border-paper-border shadow-card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {kpi.description && (
            <div className="md:col-span-2">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-navy-mid mb-1">Description</p>
              <p className="text-[14px] text-navy-900">{kpi.description}</p>
            </div>
          )}
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-navy-mid mb-1">Linked Objective</p>
            {objectiveId ? (
              <Link
                href={`/strategic/objectives/${objectiveId}`}
                className="text-[14px] text-navy-900 hover:underline font-medium"
              >
                {objectiveTitle}
              </Link>
            ) : (
              <p className="text-[14px] text-navy-900">{objectiveTitle}</p>
            )}
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-navy-mid mb-1">Owner</p>
            <p className="text-[14px] text-navy-900">{ownerName}</p>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-navy-mid mb-1">Unit of Measure</p>
            <p className="text-[14px] text-navy-900 font-mono">{kpi.unit_of_measure}</p>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-navy-mid mb-1">Reporting Frequency</p>
            <p className="text-[14px] text-navy-900">
              {KPI_FREQUENCY_LABELS[kpi.reporting_frequency as KpiFrequency]}
            </p>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-navy-mid mb-1">Baseline</p>
            <p className="text-[14px] text-navy-900 font-mono">{kpi.baseline_value} {kpi.unit_of_measure}</p>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-navy-mid mb-1">Target</p>
            <p className="text-[14px] text-navy-900 font-mono">{kpi.target_value} {kpi.unit_of_measure}</p>
          </div>
        </div>
      </div>

      {/* Reading History section */}
      <div>
        <h2 className="text-[16px] font-semibold text-navy-900 mb-4">Reading History</h2>

        {(!readings || readings.length === 0) ? (
          <div className="bg-white rounded-[10px] border border-paper-border shadow-card p-8 text-center">
            <p className="text-[14px] text-navy-mid">No readings recorded yet.</p>
            {canRecord && (
              <Link
                href={`/strategic/kpis/${params.id}/readings/new`}
                className="text-[14px] text-navy-900 hover:underline font-medium mt-2 inline-block"
              >
                Record the first reading
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[10px] border border-paper-border shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-paper border-b border-paper-border">
                  <th className="text-left text-[13px] font-semibold uppercase tracking-wider text-navy-mid px-4 py-3">Period</th>
                  <th className="text-left text-[13px] font-semibold uppercase tracking-wider text-navy-mid px-4 py-3">Actual Value</th>
                  <th className="text-left text-[13px] font-semibold uppercase tracking-wider text-navy-mid px-4 py-3">Notes</th>
                  <th className="text-left text-[13px] font-semibold uppercase tracking-wider text-navy-mid px-4 py-3">Recorded At</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => (
                  <tr key={r.id} className="border-b border-paper-border last:border-0">
                    <td className="text-[13px] text-navy-900 px-4 py-3 font-mono">{r.reporting_period}</td>
                    <td className="text-[13px] text-navy-900 px-4 py-3 font-mono">
                      {r.actual_value} {kpi.unit_of_measure}
                    </td>
                    <td className="text-[13px] text-navy-mid px-4 py-3">{r.notes ?? '—'}</td>
                    <td className="text-[13px] text-navy-900 px-4 py-3 font-mono">
                      {format(new Date(r.recorded_at), 'yyyy-MM-dd HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
