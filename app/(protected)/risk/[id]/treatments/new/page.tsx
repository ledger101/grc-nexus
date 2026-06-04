import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/types/auth'
import { getRiskById, listRiskOwners } from '@/lib/risk/queries'
import { TreatmentForm } from './TreatmentForm'

export const dynamic = 'force-dynamic'

const WRITE_ROLES: AppRole[] = ['admin', 'ceo', 'risk-officer']

interface PageProps {
  params: Promise<{ id: string }>
}

type RiskTitleRow = { title: string }
type RiskOwnerRow = { id: string; first_name: string | null; last_name: string | null }

export default async function NewTreatmentPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role as AppRole | undefined

  if (!activeRole || !WRITE_ROLES.includes(activeRole)) {
    redirect('/risk/register')
  }

  const [riskResult, ownersResult] = await Promise.all([
    getRiskById(supabase, id),
    listRiskOwners(supabase),
  ])

  if (!riskResult.data) {
    redirect('/risk/register')
  }

  const risk = riskResult.data as unknown as RiskTitleRow
  const owners = ownersResult.data as unknown as RiskOwnerRow[]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-navy-900">New Treatment</h1>
        <p className="mt-1 text-[14px] text-navy-mid">Risk: {risk.title}</p>
      </div>

      <TreatmentForm
        riskId={id}
        owners={owners.map((row) => ({
          id: row.id,
          first_name: row.first_name,
          last_name: row.last_name,
        }))}
      />
    </div>
  )
}
