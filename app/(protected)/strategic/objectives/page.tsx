// app/(protected)/strategic/objectives/page.tsx
// Server Component — fetches all institution objectives and delegates to ObjectivesTable.
// SECURITY: force-dynamic prevents ISR caching; getUser() not getSession().
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getObjectives } from '@/lib/strategic/queries'
import { ObjectivesTable } from './ObjectivesTable'
import type { AppRole } from '@/types/auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Strategic Objectives — GRC-Nexus' }

const CREATE_ROLES: AppRole[] = ['admin', 'ceo']

export default async function ObjectivesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role as AppRole | undefined

  const { data: objectives } = await getObjectives(supabase)
  const canCreate = activeRole ? CREATE_ROLES.includes(activeRole) : false

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-navy-900 font-body">Strategic Objectives</h1>
          <p className="text-[14px] text-navy-mid mt-1">NDS2-aligned and institutional strategic objectives</p>
        </div>
        {canCreate && (
          <Link
            href="/strategic/objectives/new"
            className="inline-flex items-center px-4 py-2 rounded-[8px] bg-gold text-navy-950 hover:bg-gold-hi text-[13px] font-medium shadow-card transition-colors"
          >
            New Objective
          </Link>
        )}
      </div>
      <ObjectivesTable objectives={objectives} activeRole={activeRole} />
    </div>
  )
}
