// app/(protected)/strategic/kpis/[id]/readings/new/page.tsx
// Server Component shell — fetches KPI for context and checks canRecord before showing ReadingForm.
// Auth check: non-owner non-admin sees inline error (better UX than silent redirect — plan spec).
// SECURITY: force-dynamic prevents ISR caching; getUser() not getSession().
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReadingForm } from './ReadingForm'
import type { AppMetadata } from '@/types/auth'
import type { KpiFrequency } from '@/types/strategic'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Record Reading — GRC-Nexus' }

interface PageProps {
  params: { id: string }
}

export default async function NewReadingPage({ params }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kpi } = await supabase
    .from('kpis')
    .select('id, title, reporting_frequency, unit_of_measure, owner_id, target_value')
    .eq('id', params.id)
    .single()

  if (!kpi) redirect('/strategic')

  const appMeta = user.app_metadata as Partial<AppMetadata>
  const activeRole = appMeta?.active_role
  const canRecord = activeRole === 'admin' || kpi.owner_id === user.id

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-navy-900 font-body">Record Reading</h1>
        <p className="text-[14px] text-navy-mid mt-1">
          KPI: <strong>{kpi.title}</strong> — Target: {kpi.target_value} {kpi.unit_of_measure}
        </p>
      </div>
      {!canRecord ? (
        <div className="bg-err/10 border border-err/30 rounded-[8px] p-4 text-err text-[14px]">
          Only the KPI owner or an administrator can record readings.
        </div>
      ) : (
        <ReadingForm
          kpiId={kpi.id}
          frequency={kpi.reporting_frequency as KpiFrequency}
          unit={kpi.unit_of_measure}
        />
      )}
    </div>
  )
}
