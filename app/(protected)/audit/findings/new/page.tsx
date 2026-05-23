import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/types/auth'
import { AuditFindingForm } from './AuditFindingForm'

export const dynamic = 'force-dynamic'

const WRITE_ROLES: AppRole[] = ['admin', 'audit-officer']

type UserProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
}

export default async function NewAuditFindingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role as AppRole | undefined

  if (!activeRole || !WRITE_ROLES.includes(activeRole)) {
    redirect('/audit/findings')
  }

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name')
    .order('first_name', { ascending: true })

  const users = ((profiles ?? []) as UserProfileRow[]).map((profile) => ({
    id: profile.id,
    first_name: profile.first_name,
    last_name: profile.last_name,
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-navy-900">New Audit Finding</h1>
        <p className="mt-1 text-[14px] text-navy-mid">Capture root cause, linkage, and remediation ownership.</p>
      </div>

      <AuditFindingForm users={users} />
    </div>
  )
}
