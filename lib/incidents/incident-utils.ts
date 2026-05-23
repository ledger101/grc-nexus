import { IncidentStatus } from '@/types/incidents'

/**
 * Validates whether an incident can transition from currentStatus to nextStatus.
 * Path: new -> assigned -> in_investigation -> escalated -> closed
 * - Reassignment (same status or moving between assigned/in_investigation) is permitted.
 * - Closed is a terminal state.
 */
export function isValidIncidentStatusTransition(current: IncidentStatus, next: IncidentStatus): boolean {
  if (current === next) return true // No-op is always valid

  switch (current) {
    case 'new':
      return next === 'assigned'
    case 'assigned':
      return next === 'in_investigation'
    case 'in_investigation':
      return next === 'assigned' || next === 'escalated'
    case 'escalated':
      return next === 'in_investigation' || next === 'closed'
    case 'closed':
      return false // Terminal state
    default:
      return false
  }
}

/**
 * Returns the SLA duration in days based on severity.
 */
export function getIncidentSlaDays(severity: 'low' | 'medium' | 'high' | 'critical'): number {
  switch (severity) {
    case 'low':
      return 30
    case 'medium':
      return 15
    case 'high':
      return 7
    case 'critical':
      return 3
    default:
      return 30
  }
}

/**
 * Calculates the SLA due date based on created_at and severity.
 */
export function calculateIncidentSlaDueDate(createdAt: Date, severity: 'low' | 'medium' | 'high' | 'critical'): Date {
  const date = new Date(createdAt)
  date.setDate(date.getDate() + getIncidentSlaDays(severity))
  return date
}

/**
 * Generates a deterministic storage path for incident evidence.
 * Format: {institution_id}/{case_id}/{epoch}_{hash16}.{ext}
 */
export function getIncidentEvidenceStoragePath(
  institutionId: string,
  caseId: string,
  filename: string,
  hash: string
): string {
  const ext = filename.includes('.') ? filename.split('.').pop() : 'bin'
  const epoch = Date.now()
  const hash16 = hash.substring(0, 16)
  return `${institutionId}/${caseId}/${epoch}_${hash16}.${ext}`
}
