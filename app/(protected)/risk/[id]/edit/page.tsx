import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/types/auth'
import { getRiskById, listObjectiveOptions, listRiskOwners } from '@/lib/risk/queries'
import type { RiskCategory, RiskStatus } from '@/types/risk'
import { RiskEditForm } from './RiskEditForm'

export const dynamic = 'force-dynamic'

const EDIT_ROLES: AppRole[] = ['admin', 'ceo', 'risk-officer']

interface PageProps {
  params: { id: string }
}

type EditableRisk = {
  id: string
  objective_id: string
  title: string
  description: string | null
  category: RiskCategory
  owner_id: string | null
  status: RiskStatus
  inherent_likelihood: number
  inherent_impact: number
  residual_likelihood: number | null
  residual_impact: number | null
  mitigating_controls: string | null
}

export default async function EditRiskPage({ params }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role as AppRole | undefined

  if (!activeRole || !EDIT_ROLES.includes(activeRole)) {
    redirect(`/risk/${params.id}`)
  }

  const [riskResult, objectivesResult, ownersResult] = await Promise.all([
    getRiskById(supabase, params.id),
    listObjectiveOptions(supabase),
    listRiskOwners(supabase),
  ])

  if (riskResult.error || !riskResult.data) {
    redirect('/risk/register')
  }

  const risk = riskResult.data as unknown as EditableRisk
  const objectives = objectivesResult.data as Array<{ id: string; title: string }>
  const owners = ownersResult.data as Array<{ id: string; first_name: string | null; last_name: string | null }>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-navy-900">Edit Risk</h1>
        <p className="mt-1 text-[14px] text-navy-mid">{risk.title}</p>
      </div>

      <RiskEditForm
        riskId={risk.id}
        initialValues={{
          objective_id: risk.objective_id,
          title: risk.title,
          description: risk.description ?? '',
          category: risk.category,
          owner_id: risk.owner_id ?? '',
          status: risk.status,
          inherent_likelihood: risk.inherent_likelihood,
          inherent_impact: risk.inherent_impact,
          residual_likelihood: risk.residual_likelihood,
          residual_impact: risk.residual_impact,
          mitigating_controls: risk.mitigating_controls ?? '',
        }}
        objectives={objectives.map((row) => ({ id: row.id, title: row.title }))}
        owners={owners.map((row) => ({
          id: row.id,
          first_name: row.first_name,
          last_name: row.last_name,
        }))}
      />
    </div>
  )
}
