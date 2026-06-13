import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/types/auth'
import { getRiskById, listRiskTreatments } from '@/lib/risk/queries'
import {
  calculateRiskScore,
  getRiskSeverity,
  isTreatmentOverdue,
  RISK_SEVERITY_BADGE,
  RISK_STATUS_BADGE,
  TREATMENT_STATUS_BADGE,
} from '@/lib/risk/risk-utils'
import { cn } from '@/lib/utils'
import { TreatmentStatusSelect } from '@/components/risk/TreatmentStatusSelect'
import type { RiskCategory, RiskStatus, TreatmentStatus } from '@/types/risk'

export const dynamic = 'force-dynamic'

const VIEW_ROLES: AppRole[] = [
  'admin',
  'ceo',
  'risk-officer',
  'audit-officer',
  'board-member',
  'dept-head',
]

interface PageProps {
  params: Promise<{ id: string }>
}

type RiskDetail = {
  id: string
  title: string
  description: string | null
  category: RiskCategory
  status: RiskStatus
  inherent_likelihood: number
  inherent_impact: number
  residual_likelihood: number | null
  residual_impact: number | null
  mitigating_controls: string | null
  strategic_objectives: { title?: string } | null
  user_profiles: { first_name: string | null; last_name: string | null } | null
}

type RiskTreatmentDetail = {
  id: string
  title: string
  due_date: string
  status: TreatmentStatus
  user_profiles: { first_name: string | null; last_name: string | null } | null
}

export default async function RiskDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role as AppRole | undefined

  if (!activeRole || !VIEW_ROLES.includes(activeRole)) {
    redirect('/risk/register')
  }

  const [riskResult, treatmentsResult] = await Promise.all([
    getRiskById(supabase, id),
    listRiskTreatments(supabase, id),
  ])

  if (!riskResult.data) {
    redirect('/risk/register')
  }

  const risk = riskResult.data as unknown as RiskDetail
  const objective = risk.strategic_objectives?.title ?? 'Unknown Objective'
  const ownerProfile = risk.user_profiles
  const ownerName = [ownerProfile?.first_name, ownerProfile?.last_name].filter(Boolean).join(' ') || 'Unknown Owner'

  const inherentScore = calculateRiskScore(risk.inherent_likelihood, risk.inherent_impact)
  const inherentSeverity = getRiskSeverity(inherentScore)

  const hasResidual = risk.residual_likelihood !== null && risk.residual_impact !== null
  const residualScore = hasResidual
    ? calculateRiskScore(risk.residual_likelihood ?? 0, risk.residual_impact ?? 0)
    : null
  const residualSeverity = residualScore ? getRiskSeverity(residualScore) : null

  const treatments = treatmentsResult.data as unknown as RiskTreatmentDetail[]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-navy-900">{risk.title}</h1>
          <p className="mt-1 text-[14px] text-navy-mid">
            {objective} • Owner: {ownerName}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/risk/${risk.id}/edit`}
            className="inline-flex items-center rounded-[8px] border border-paper-border px-4 py-2 text-[13px] font-medium text-navy-900 hover:bg-paper"
          >
            Edit Risk
          </Link>
          <Link
            href={`/risk/${risk.id}/treatments/new`}
            className="inline-flex items-center rounded-[8px] bg-gold px-4 py-2 text-[13px] font-medium text-navy-950 hover:bg-gold-hi"
          >
            Add Treatment
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-[10px] border border-paper-border bg-white p-6 shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-navy-mid">Status</p>
            <span className={cn('mt-2 inline-flex rounded-[6px] border px-2 py-1 text-[12px] font-medium', RISK_STATUS_BADGE[risk.status])}>
              {risk.status}
            </span>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-navy-mid">Category</p>
            <p className="mt-2 text-[14px] text-navy-900 capitalize">{risk.category}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-navy-mid">Description</p>
            <p className="mt-2 text-[14px] text-navy-900">{risk.description ?? 'No description provided.'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-navy-mid">Mitigating Controls</p>
            <p className="mt-2 text-[14px] text-navy-900">{risk.mitigating_controls ?? 'No controls documented yet.'}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-[10px] border border-paper-border bg-white p-6 shadow-card">
        <div className="min-w-[180px] rounded-[8px] border border-paper-border bg-paper p-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-navy-mid">Inherent Risk</p>
          <p className="mt-1 font-mono text-[28px] font-semibold text-navy-900">{inherentScore}</p>
          <p className="mt-1 text-[12px] text-navy-mid">{risk.inherent_likelihood} x {risk.inherent_impact}</p>
          <span className={cn('mt-2 inline-flex rounded-[6px] border px-2 py-1 text-[12px] font-medium capitalize', RISK_SEVERITY_BADGE[inherentSeverity])}>
            {inherentSeverity}
          </span>
        </div>

        <div className="text-navy-mid">→</div>

        <div className="min-w-[180px] rounded-[8px] border border-paper-border bg-paper p-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-navy-mid">Residual Risk</p>
          {residualScore ? (
            <>
              <p className="mt-1 font-mono text-[28px] font-semibold text-navy-900">{residualScore}</p>
              <p className="mt-1 text-[12px] text-navy-mid">{risk.residual_likelihood} x {risk.residual_impact}</p>
              <span className={cn('mt-2 inline-flex rounded-[6px] border px-2 py-1 text-[12px] font-medium capitalize', RISK_SEVERITY_BADGE[residualSeverity as keyof typeof RISK_SEVERITY_BADGE])}>
                {residualSeverity}
              </span>
            </>
          ) : (
            <>
              <p className="mt-1 font-mono text-[28px] font-semibold text-navy-mid">—</p>
              <p className="mt-1 text-[12px] text-navy-mid">Not yet assessed</p>
            </>
          )}
        </div>
      </div>

      <div className="rounded-[10px] border border-paper-border bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-paper-border px-4 py-3">
          <h2 className="text-[16px] font-semibold text-navy-900">Treatments</h2>
          <span className="text-[13px] text-navy-mid">{treatments.length} total</span>
        </div>

        {treatments.length === 0 ? (
          <div className="px-4 py-8 text-center text-[14px] text-navy-mid">No treatments recorded for this risk.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-paper">
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-navy-mid">Title</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-navy-mid">Owner</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-navy-mid">Due Date</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-navy-mid">Status</th>
                </tr>
              </thead>
              <tbody>
                {treatments.map((treatment) => {
                  const profile = treatment.user_profiles
                  const treatmentOwner = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Unknown Owner'
                  const overdue = isTreatmentOverdue(treatment.status, treatment.due_date)

                  return (
                    <tr key={treatment.id} className={cn('border-t border-paper-border', overdue && 'bg-err/5')}>
                      <td className="px-4 py-3 text-[13px] text-navy-900">{treatment.title}</td>
                      <td className="px-4 py-3 text-[13px] text-navy-900">{treatmentOwner}</td>
                      <td className="px-4 py-3 font-mono text-[13px] text-navy-900">{treatment.due_date}</td>
                      <td className="px-4 py-3">
                        {overdue ? (
                          <span className={cn('inline-flex rounded-[6px] border px-2 py-1 text-[12px] font-semibold', TREATMENT_STATUS_BADGE.overdue)}>
                            Overdue
                          </span>
                        ) : (
                          <TreatmentStatusSelect
                            treatmentId={treatment.id}
                            currentStatus={treatment.status}
                            isOverdue={overdue}
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
