'use client'
// app/(protected)/admin/audit-log/AuditLogTable.tsx
// Filterable audit log table per UI-SPEC Screen 8.
// Columns: Timestamp, Actor, Action badge, Table, Record ID (truncated), Expand.
// Inline diff row on expand: before/after JSONB side by side.
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Json } from '@/types/supabase'
import { DiffViewer } from './DiffViewer'

type AuditEvent = {
  id: string | number
  actor_id: string | null
  action: string
  table_name: string
  record_id: string | null
  before_state: Json | null
  after_state: Json | null
  occurred_at: string
  event_type: string | null
  metadata: Json | null
  actor_name?: string | null
  actor_role?: string | null
}

const ACTION_BADGE: Record<string, { label: string; className: string }> = {
  INSERT: { label: 'INSERT', className: 'bg-green-100 text-green-800 border-green-300/40' },
  UPDATE: { label: 'UPDATE', className: 'bg-blue-100 text-blue-800 border-blue-300/40' },
  DELETE: { label: 'DELETE', className: 'bg-red-100 text-red-800 border-red-300/40' },
  AUTH: { label: 'AUTH', className: 'bg-gold-pale text-navy-950 border-gold/40' },
}

interface AuditLogTableProps {
  events: AuditEvent[]
  totalCount: number
  page: number
  pageSize: number
}

export function AuditLogTable({ events, totalCount, page, pageSize }: AuditLogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set())

  function toggleRow(id: string | number) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-[10px] border border-paper-border shadow-card">
        <div className="py-20 text-center text-navy-mid text-[14px]">
          No audit events found matching the current filters.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[10px] border border-paper-border shadow-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-paper border-b border-paper-border">
            <th className="text-left text-[12px] font-semibold uppercase tracking-wider text-navy-mid px-4 py-3">
              Timestamp
            </th>
            <th className="text-left text-[12px] font-semibold uppercase tracking-wider text-navy-mid px-4 py-3">
              Actor
            </th>
            <th className="text-left text-[12px] font-semibold uppercase tracking-wider text-navy-mid px-4 py-3">
              Action
            </th>
            <th className="text-left text-[12px] font-semibold uppercase tracking-wider text-navy-mid px-4 py-3">
              Table
            </th>
            <th className="text-left text-[12px] font-semibold uppercase tracking-wider text-navy-mid px-4 py-3">
              Record ID
            </th>
            <th className="text-left text-[12px] font-semibold uppercase tracking-wider text-navy-mid px-4 py-3 w-10">
              {/* expand */}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-paper-border">
          {events.map((event) => {
            const isExpanded = expandedRows.has(event.id)
            const badgeInfo = ACTION_BADGE[event.action] ?? ACTION_BADGE.AUTH
            const actorInitial = event.actor_name
              ? event.actor_name[0].toUpperCase()
              : (event.actor_id ?? '?')[0].toUpperCase()
            const shortId = event.record_id
              ? event.record_id.replace(/-/g, '').slice(0, 8)
              : '—'
            const hasDiff = event.before_state !== null || event.after_state !== null

            return (
              <>
                <tr
                  key={event.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Timestamp */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-[12px] text-navy-mid whitespace-nowrap">
                      {format(new Date(event.occurred_at), 'yyyy-MM-dd HH:mm:ss')}
                    </span>
                  </td>

                  {/* Actor */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] font-semibold bg-paper text-navy-mid">
                          {actorInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[13px] text-navy-900 font-medium leading-tight">
                          {event.actor_name ?? 'System'}
                        </p>
                        {event.actor_role && (
                          <p className="text-[11px] text-navy-mid leading-tight">
                            {event.actor_role}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Action badge */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge
                        className={`text-[11px] font-semibold border w-fit ${badgeInfo.className}`}
                      >
                        {badgeInfo.label}
                      </Badge>
                      {event.event_type && (
                        <span className="text-[11px] text-navy-mid">{event.event_type}</span>
                      )}
                    </div>
                  </td>

                  {/* Table */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-[12px] text-navy-mid">{event.table_name}</span>
                  </td>

                  {/* Record ID (truncated with full UUID tooltip) */}
                  <td className="px-4 py-3">
                    <span
                      className="font-mono text-[12px] text-navy-mid cursor-default"
                      title={event.record_id ?? ''}
                    >
                      {shortId}
                    </span>
                  </td>

                  {/* Expand toggle */}
                  <td className="px-4 py-3">
                    {hasDiff && (
                      <button
                        type="button"
                        onClick={() => toggleRow(event.id)}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Collapse diff' : 'Expand diff'}
                        className="text-navy-mid hover:text-navy-900 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </td>
                </tr>

                {/* Inline diff row */}
                {isExpanded && hasDiff && (
                  <tr key={`${event.id}-diff`} className="bg-paper/50">
                    <td colSpan={6} className="px-4 py-4">
                      <DiffViewer
                        before={event.before_state}
                        after={event.after_state}
                      />
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>

      {/* Pagination info */}
      <div className="px-4 py-3 border-t border-paper-border bg-paper flex items-center justify-between">
        <span className="text-[13px] text-navy-mid">
          Showing {Math.min((page - 1) * pageSize + 1, totalCount)}–
          {Math.min(page * pageSize, totalCount)} of {totalCount} events
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <a
              href={`/admin/audit-log?page=${page - 1}`}
              className="text-[13px] text-navy-mid hover:text-navy-900 underline underline-offset-2"
            >
              Previous
            </a>
          )}
          {page * pageSize < totalCount && (
            <a
              href={`/admin/audit-log?page=${page + 1}`}
              className="text-[13px] text-navy-mid hover:text-navy-900 underline underline-offset-2"
            >
              Next
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
