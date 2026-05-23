import { differenceInDays } from 'date-fns'
import type { AuditFindingStatus } from '@/types/audit'

export const AUDIT_FINDING_STATUS_BADGE: Record<AuditFindingStatus, string> = {
  open: 'bg-err/10 text-err border border-err/30 rounded-grc-sm px-[8px] py-[4px] text-[14px] font-medium',
  in_progress:
    'bg-warn/10 text-warn border border-warn/30 rounded-grc-sm px-[8px] py-[4px] text-[14px] font-medium',
  closed: 'bg-ok/10 text-ok border border-ok/30 rounded-grc-sm px-[8px] py-[4px] text-[14px] font-medium',
}

export function isValidAuditStatusTransition(from: AuditFindingStatus, to: AuditFindingStatus): boolean {
  if (from === to) return true

  const allowed: Record<AuditFindingStatus, AuditFindingStatus[]> = {
    open: ['in_progress'],
    in_progress: ['open', 'closed'],
    closed: [],
  }

  return allowed[from].includes(to)
}

export function isAuditFindingOverdue(status: AuditFindingStatus, dueDate: string | Date): boolean {
  if (status === 'closed') return false
  const today = new Date().toISOString().slice(0, 10)
  const due = typeof dueDate === 'string' ? dueDate.slice(0, 10) : dueDate.toISOString().slice(0, 10)
  return due < today
}

export function getAuditEscalationThreshold(dueDate: string): 'due_today' | 'critical_overdue' | null {
  const diff = differenceInDays(new Date(dueDate), new Date())
  if (diff <= -7) return 'critical_overdue'
  if (diff === 0) return 'due_today'
  return null
}

export function buildAuditEvidenceStoragePath(
  institutionId: string,
  findingId: string,
  epoch: number,
  sha256Hash: string,
  ext: string,
): string {
  return `${institutionId}/${findingId}/${epoch}_${sha256Hash.slice(0, 16)}.${ext}`
}
