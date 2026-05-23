import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/types/auth'
import { listObjectiveOptions, listRiskOwners } from '@/lib/risk/queries'
import { RiskForm } from './RiskForm'

export const dynamic = 'force-dynamic'

const CREATE_ROLES: AppRole[] = ['admin', 'ceo', 'risk-officer']

export default async function NewRiskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role as AppRole | undefined

  if (!activeRole || !CREATE_ROLES.includes(activeRole)) {
    redirect('/risk/register')
  }

  const [objectivesResult, ownersResult] = await Promise.all([
    listObjectiveOptions(supabase),
    listRiskOwners(supabase),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-navy-900">New Risk</h1>
        <p className="mt-1 text-[14px] text-navy-mid">Create a risk entry linked to a strategic objective.</p>
      </div>

      <RiskForm
        objectives={objectivesResult.data.map((row) => ({
          id: String(row.id),
          title: String(row.title),
        }))}
        owners={ownersResult.data.map((row) => ({
          id: String(row.id),
          first_name: row.first_name ? String(row.first_name) : null,
          last_name: row.last_name ? String(row.last_name) : null,
        }))}
      />
    </div>
  )
}
