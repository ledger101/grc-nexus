import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/types/auth'
import { listRisks } from '@/lib/risk/queries'
import { RiskRegisterTable } from './RiskRegisterTable'
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

type RegisterRiskRow = {
  id: string
  title: string
  category: RiskCategory
  owner_id: string | null
  status: RiskStatus
  inherent_likelihood: number
  inherent_impact: number
  residual_likelihood: number | null
  residual_impact: number | null
  user_profiles: { first_name: string | null; last_name: string | null } | null
  risk_treatments: Array<{ status: TreatmentStatus }> | null
}

export default async function RiskRegisterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role as AppRole | undefined

  if (!activeRole || !VIEW_ROLES.includes(activeRole)) {
    redirect('/dashboard')
  }

  const { data: rows } = await listRisks(supabase)
  const typedRows = rows as unknown as RegisterRiskRow[]

  const normalizedRows = typedRows.map((row) => {
    const owner = row.user_profiles
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      ownerId: row.owner_id ?? 'unassigned',
      ownerName: [owner?.first_name, owner?.last_name].filter(Boolean).join(' ') || 'Unassigned',
      status: row.status,
      inherentLikelihood: row.inherent_likelihood,
      inherentImpact: row.inherent_impact,
      residualLikelihood: row.residual_likelihood,
      residualImpact: row.residual_impact,
      treatmentsCount: (row.risk_treatments ?? []).length,
    }
  })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-navy-900">Risk Register</h1>
          <p className="mt-1 text-[14px] text-navy-mid">{normalizedRows.length} risks total</p>
        </div>
        <Link
          href="/risk/new"
          className="inline-flex items-center rounded-[8px] bg-gold px-4 py-2 text-[13px] font-medium text-navy-950 hover:bg-gold-hi"
        >
          Add Risk
        </Link>
      </div>

      <RiskRegisterTable rows={normalizedRows} />
    </div>
  )
}
