// app/api/audit/export/route.ts
// CSV export route for audit events.
// SECURITY: Requires authenticated admin or audit-officer role.
// SECURITY: Returns 401 for unauthenticated or unauthorized access.
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import { parseAuditMetadata } from '@/lib/audit/filter-utils'

type AuditAction = Database['public']['Enums']['audit_action']
const AUDIT_ACTIONS: AuditAction[] = ['INSERT', 'UPDATE', 'DELETE', 'AUTH']

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role
  if (!activeRole || !['admin', 'audit-officer'].includes(activeRole)) {
    return new Response('Forbidden', { status: 403 })
  }

  // Parse optional filters from query params
  const url = new URL(request.url)
  const actionFilter = url.searchParams.get('action') ?? ''
  const tableFilter = url.searchParams.get('table') ?? ''
  const fromFilter = url.searchParams.get('from') ?? ''
  const toFilter = url.searchParams.get('to') ?? ''
  const moduleFilter = url.searchParams.get('module') ?? ''
  const departmentFilter = url.searchParams.get('department') ?? ''

  let query = supabase
    .from('audit_events')
    .select('occurred_at, actor_id, action, table_name, record_id, event_type, metadata')
    .order('occurred_at', { ascending: false })

  const action = AUDIT_ACTIONS.includes(actionFilter as AuditAction)
    ? (actionFilter as AuditAction)
    : ''

  if (action) query = query.eq('action', action)
  if (tableFilter) query = query.eq('table_name', tableFilter)
  if (fromFilter) query = query.gte('occurred_at', `${fromFilter}T00:00:00.000Z`)
  if (toFilter) query = query.lte('occurred_at', `${toFilter}T23:59:59.999Z`)

  const { data: events, error } = await query

  if (error) {
    return new Response('Failed to fetch audit events', { status: 500 })
  }

  // Build CSV
  const filteredEvents = (events ?? []).filter((event) => {
    const metadataScope = parseAuditMetadata(event.metadata)

    const moduleMatches = !moduleFilter || metadataScope.module === moduleFilter
    const departmentMatches = !departmentFilter || metadataScope.department === departmentFilter

    return moduleMatches && departmentMatches
  })

  const csvHeaders = 'Timestamp,Actor ID,Action,Table,Record ID,Event Type,Module,Department,Metadata\n'
  const csvRows = filteredEvents
    .map((e) => {
      const metadataScope = parseAuditMetadata(e.metadata)
      const meta = e.metadata ? JSON.stringify(e.metadata).replace(/"/g, '""') : ''
      return [
        `"${e.occurred_at}"`,
        `"${e.actor_id ?? ''}"`,
        `"${e.action}"`,
        `"${e.table_name}"`,
        `"${e.record_id ?? ''}"`,
        `"${e.event_type ?? ''}"`,
        `"${metadataScope.module ?? ''}"`,
        `"${metadataScope.department ?? ''}"`,
        `"${meta}"`,
      ].join(',')
    })
    .join('\n')

  const csv = csvHeaders + csvRows
  const filename = `grc-nexus-audit-log-${Date.now()}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      // SECURITY: Prevent caching of audit export
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
