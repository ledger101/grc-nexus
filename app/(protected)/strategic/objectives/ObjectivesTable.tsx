'use client'
// ObjectivesTable.tsx — Client Component
// Analog: UserManagementTable.tsx — uses shadcn Table + manual useState filter (NOT useReactTable).
// TanStack Table v8 is reserved for the KPI dashboard grid (Plan 05).
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { updateObjectiveStatus } from '@/lib/strategic/actions'
import type { StrategicObjective, ObjectiveStatus } from '@/types/strategic'
import { NDS2_PILLAR_LABELS, OBJECTIVE_STATUS_LABELS } from '@/types/strategic'
import type { AppRole } from '@/types/auth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Badge classes per status (from PATTERNS.md design tokens)
const OBJECTIVE_STATUS_BADGE: Record<ObjectiveStatus, string> = {
  draft:     'bg-paper text-navy-mid border-paper-border',
  active:    'bg-ok/10 text-ok border-ok/30',
  at_risk:   'bg-warn/10 text-warn border-warn/30',
  completed: 'bg-ok/10 text-ok border-ok/30',
  cancelled: 'bg-paper text-navy-mid border-paper-border',
}

// Roles that can edit/cancel objectives (D-23)
const EDIT_ROLES: AppRole[] = ['admin', 'ceo']

type ObjectiveRow = StrategicObjective & {
  user_profiles?: { first_name: string | null; last_name: string | null } | null
}

interface ObjectivesTableProps {
  objectives: ObjectiveRow[]
  activeRole: AppRole | undefined
}

export function ObjectivesTable({ objectives, activeRole }: ObjectivesTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ObjectiveStatus>('all')
  const [cancelDialog, setCancelDialog] = useState<ObjectiveRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const canEdit = activeRole ? EDIT_ROLES.includes(activeRole) : false

  const filtered = objectives.filter((obj) => {
    if (search && !obj.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'all' && obj.status !== statusFilter) return false
    return true
  })

  function handleCancel(objective: ObjectiveRow) {
    startTransition(async () => {
      const result = await updateObjectiveStatus(objective.id, 'cancelled')
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(`"${objective.title}" has been cancelled.`)
        setCancelDialog(null)
      }
    })
  }

  function getPillarDisplay(obj: ObjectiveRow): string {
    if (obj.nds2_pillar) return NDS2_PILLAR_LABELS[obj.nds2_pillar]
    if (obj.institutional_goal) return obj.institutional_goal
    return '—'
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <Input
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[280px] h-9 border-paper-border"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | ObjectiveStatus)}>
          <SelectTrigger className="w-[180px] h-9 border-paper-border">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="at_risk">At Risk</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[10px] border border-paper-border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-paper">
              <TableHead className="text-[13px] font-semibold uppercase tracking-wider text-navy-mid">Title</TableHead>
              <TableHead className="text-[13px] font-semibold uppercase tracking-wider text-navy-mid">Pillar / Goal</TableHead>
              <TableHead className="text-[13px] font-semibold uppercase tracking-wider text-navy-mid">Status</TableHead>
              <TableHead className="text-[13px] font-semibold uppercase tracking-wider text-navy-mid">Target Date</TableHead>
              <TableHead className="text-[13px] font-semibold uppercase tracking-wider text-navy-mid text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-navy-mid text-[14px]">
                  {objectives.length === 0 ? (
                    <span>
                      No objectives yet.{' '}
                      {canEdit && (
                        <Link href="/strategic/objectives/new" className="text-navy-900 hover:underline font-medium">
                          Create the first one
                        </Link>
                      )}
                    </span>
                  ) : (
                    'No objectives match your filters.'
                  )}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((obj) => (
              <TableRow key={obj.id} className="hover:bg-gray-50">
                <TableCell className="text-[13px] text-navy-900 px-4 py-3">
                  <Link
                    href={`/strategic/objectives/${obj.id}`}
                    className="font-medium hover:underline text-navy-900"
                  >
                    {obj.title}
                  </Link>
                  {(obj.user_profiles?.first_name || obj.user_profiles?.last_name) && (
                    <p className="text-[12px] text-navy-mid mt-0.5">{[obj.user_profiles.first_name, obj.user_profiles.last_name].filter(Boolean).join(' ')}</p>
                  )}
                </TableCell>
                <TableCell className="text-[13px] text-navy-900 px-4 py-3 max-w-[200px]">
                  <span className="truncate block">{getPillarDisplay(obj)}</span>
                </TableCell>
                <TableCell className="text-[13px] text-navy-900 px-4 py-3">
                  <Badge
                    className={`text-[12px] font-medium border ${OBJECTIVE_STATUS_BADGE[obj.status]}`}
                  >
                    {OBJECTIVE_STATUS_LABELS[obj.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-[13px] text-navy-900 px-4 py-3 font-mono">
                  {obj.target_date ? format(new Date(obj.target_date), 'yyyy-MM-dd') : '—'}
                </TableCell>
                <TableCell className="text-right px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/strategic/objectives/${obj.id}`}
                      className="text-[13px] text-navy-mid hover:text-navy-900 transition-colors"
                    >
                      View
                    </Link>
                    {canEdit && (
                      <>
                        <Link
                          href={`/strategic/objectives/${obj.id}/edit`}
                          className="text-[13px] text-navy-mid hover:text-navy-900 transition-colors"
                        >
                          Edit
                        </Link>
                        {obj.status !== 'cancelled' && obj.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[12px] border-paper-border text-navy-mid hover:text-err hover:border-err/30"
                            onClick={() => setCancelDialog(obj)}
                            disabled={isPending}
                          >
                            Cancel
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Cancel confirmation dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this objective?</DialogTitle>
            <DialogDescription>
              This will mark{' '}
              <strong>&ldquo;{cancelDialog?.title}&rdquo;</strong> as cancelled.
              This action can be reversed by editing the objective status.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(null)}>
              Keep Active
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => cancelDialog && handleCancel(cancelDialog)}
            >
              Cancel Objective
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
