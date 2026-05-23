// app/(protected)/admin/audit-log/page.tsx
// Audit log viewer — accessible to admin and audit-officer roles.
// Fetches events server-side with URL filter params applied.
// SECURITY: force-dynamic prevents ISR caching of audit data.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FilterBar } from './FilterBar'
import { AuditLogTable } from './AuditLogTable'
import type { AppRole } from '@/types/auth'
import type { Database } from '@/types/supabase'
import { parseAuditMetadata } from '@/lib/audit/filter-utils'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Audit Log — GRC-Nexus',
}

const ALLOWED_ROLES: AppRole[] = ['admin', 'audit-officer']
const PAGE_SIZE = 25
type AuditAction = Database['public']['Enums']['audit_action']
const AUDIT_ACTIONS: AuditAction[] = ['INSERT', 'UPDATE', 'DELETE', 'AUTH']

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const appMeta = user.app_metadata as Record<string, unknown>
  const activeRole = appMeta?.active_role as AppRole | undefined

  if (!activeRole || !ALLOWED_ROLES.includes(activeRole)) {
    redirect('/dashboard')
  }

  // Parse filter params from URL
  const actor = searchParams.actor ?? ''
  const actionParam = searchParams.action ?? ''
  const action = AUDIT_ACTIONS.includes(actionParam as AuditAction)
    ? (actionParam as AuditAction)
    : ''
  const table = searchParams.table ?? ''
  const from = searchParams.from ?? ''
  const to = searchParams.to ?? ''
  const moduleFilter = searchParams.module ?? ''
  const departmentFilter = searchParams.department ?? ''
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  // Build query
  let query = supabase
    .from('audit_events')
    .select(
      'id, actor_id, action, table_name, record_id, before_state, after_state, occurred_at, event_type, metadata',
      { count: 'exact' }
    )
    .order('occurred_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (action) {
    query = query.eq('action', action)
  }
  if (table) {
    query = query.eq('table_name', table)
  }
  if (from) {
    query = query.gte('occurred_at', `${from}T00:00:00.000Z`)
  }
  if (to) {
    query = query.lte('occurred_at', `${to}T23:59:59.999Z`)
  }

  const { data: events, count } = await query

  // Fetch actor display names from auth.users via admin client
  const adminClient = createAdminClient()
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers()

  // Fetch user profiles for names
  const actorIds = [...new Set((events ?? []).map((e) => e.actor_id).filter(Boolean) as string[])]
  let profileMap: Record<string, { first_name: string | null; last_name: string | null; active_role: string | null }> = {}
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, active_role')
      .in('id', actorIds)
    for (const p of profiles ?? []) {
      profileMap[p.id] = p
    }
  }

  // Build auth user email map for actor search filter
  const emailMap: Record<string, string> = {}
  for (const u of authUsers ?? []) {
    emailMap[u.id] = u.email ?? ''
  }

  // Enrich events with actor names, apply actor search filter
  const enrichedEvents = (events ?? [])
    .map((e) => {
      const profile = e.actor_id ? profileMap[e.actor_id] : null
      const email = e.actor_id ? emailMap[e.actor_id] : null
      const actorName = profile
        ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || email || 'System'
        : email || 'System'
      const metadataScope = parseAuditMetadata(e.metadata)
      return {
        ...e,
        actor_name: actorName,
        actor_role: profile?.active_role ?? null,
        module: metadataScope.module,
        department: metadataScope.department,
      }
    })
    .filter((e) => {
      const actorMatches = !actor || (
        e.actor_name?.toLowerCase().includes(actor.toLowerCase()) ||
        e.actor_id?.toLowerCase().includes(actor.toLowerCase())
      )

      const moduleMatches = !moduleFilter || e.module === moduleFilter
      const departmentMatches = !departmentFilter || e.department === departmentFilter

      return actorMatches && moduleMatches && departmentMatches
    })

  const totalCount = count ?? 0

  const exportParams = new URLSearchParams()
  if (action) exportParams.set('action', action)
  if (table) exportParams.set('table', table)
  if (from) exportParams.set('from', from)
  if (to) exportParams.set('to', to)
  if (moduleFilter) exportParams.set('module', moduleFilter)
  if (departmentFilter) exportParams.set('department', departmentFilter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-navy-900 font-body">Audit Log</h1>
          <p className="text-[14px] text-navy-mid mt-1">
            Immutable governance audit trail — {totalCount.toLocaleString()} total events
          </p>
        </div>
        <a
          href={`/api/audit/export${exportParams.toString() ? `?${exportParams.toString()}` : ''}`}
          className="inline-flex items-center px-4 py-2 rounded-[8px] bg-white border border-paper-border shadow-card text-[13px] font-medium text-navy-900 hover:border-navy-mid/40 hover:shadow-auth transition-all"
        >
          Export CSV
        </a>
      </div>

      <FilterBar />

      <AuditLogTable
        events={enrichedEvents}
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}
