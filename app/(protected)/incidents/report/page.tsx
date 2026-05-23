import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/types/auth'
import { IncidentReportForm } from './IncidentReportForm'

export const dynamic = 'force-dynamic'

const REPORT_ROLES: AppRole[] = [
  'admin',
  'ceo',
  'risk-officer',
  'audit-officer',
  'compliance-officer',
  'dept-head',
  'board-member',
]

export default async function IncidentReportPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role as AppRole | undefined
  const institutionId = appMeta?.institution_id

  if (!activeRole || !REPORT_ROLES.includes(activeRole) || !institutionId) {
    redirect('/dashboard')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-navy-900">Report Incident</h1>
        <p className="mt-1 text-[14px] text-navy-mid">
          Submit a named or anonymous report. Anonymous reports remove submitter identity before investigators can view the case.
        </p>
      </div>

      <IncidentReportForm institutionId={institutionId} />
    </div>
  )
}
