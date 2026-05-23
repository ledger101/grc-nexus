// lib/compliance/compliance-utils.ts
// Pure compliance business logic helpers. No framework imports (Next.js, React, Supabase).
import { differenceInDays } from 'date-fns'
import type { ObligationStatus } from '@/types/compliance'

// Badge CSS classes — matches tailwind.config.ts tokens (D-23, UI-SPEC Component 29)
export const OBLIGATION_STATUS_BADGE: Record<ObligationStatus, string> = {
  pending:             'bg-paper text-navy-mid border border-paper-border rounded-grc-sm px-[8px] py-[4px] text-[14px]',
  compliant:           'bg-ok/10 text-ok border border-ok/30 rounded-grc-sm px-[8px] py-[4px] text-[14px]',
  partially_compliant: 'bg-warn/10 text-warn border border-warn/30 rounded-grc-sm px-[8px] py-[4px] text-[14px]',
  non_compliant:       'bg-err/10 text-err border border-err/30 rounded-grc-sm px-[8px] py-[4px] text-[14px] font-semibold',
  overdue:             'bg-err/30 text-err border border-err/50 rounded-grc-sm px-[8px] py-[4px] text-[14px] font-semibold',
  waived:              'bg-gray-100 text-gray-500 border border-gray-200 rounded-grc-sm px-[8px] py-[4px] text-[14px]',
}

/**
 * Returns true if obligation is past due date and not already compliant/waived/overdue.
 * Compliant and waived obligations are considered resolved — they are not overdue.
 * Overdue is already set — no need to double-flag.
 *
 * Compares YYYY-MM-DD date strings so that an obligation due TODAY is not considered
 * overdue until the calendar day has passed (ME-01: isPast fires at midnight local time
 * which incorrectly marks "due today" obligations as overdue all day).
 */
export function isObligationOverdue(status: ObligationStatus, dueDate: string | Date): boolean {
  if (status === 'compliant' || status === 'waived' || status === 'overdue') return false
  const today = new Date().toISOString().slice(0, 10)
  const due = typeof dueDate === 'string' ? dueDate.slice(0, 10) : dueDate.toISOString().slice(0, 10)
  return due < today
}

/**
 * Returns escalation threshold label based on days until due date.
 * Returns null if no escalation is needed.
 * Thresholds per D-26:
 *   - critical_overdue: 7+ days past due (diff <= -7)
 *   - due_today: due date is today (diff === 0)
 *   - early_warning: 1–3 days before due (0 < diff <= 3)
 */
export function getEscalationThreshold(dueDate: string): 'early_warning' | 'due_today' | 'critical_overdue' | null {
  const diff = differenceInDays(new Date(dueDate), new Date())
  if (diff <= -7) return 'critical_overdue'       // 7+ days overdue (D-26)
  if (diff === 0) return 'due_today'               // due today (D-26)
  if (diff > 0 && diff <= 3) return 'early_warning' // 1–3 days before due (D-26)
  return null
}

/**
 * Constructs the deterministic, immutable storage path (D-10).
 * Format: {institution_id}/{obligation_id}/{timestamp_epoch}_{sha256_first16}.{ext}
 * Timestamp prevents collisions; SHA-256 prefix makes tampering visible from the filename alone.
 */
export function buildStoragePath(
  institutionId: string,
  obligationId: string,
  epoch: number,
  sha256Hash: string,
  ext: string,
): string {
  return `${institutionId}/${obligationId}/${epoch}_${sha256Hash.slice(0, 16)}.${ext}`
}

/**
 * Computes compliance percentage from obligation status counts.
 * Excludes waived obligations from the denominator (D-22 posture metric).
 * Returns 0 when no active (non-waived) obligations exist.
 */
export function computeCompliancePercentage(obligations: Array<{ status: ObligationStatus }>): number {
  const active = obligations.filter((o) => o.status !== 'waived')
  if (active.length === 0) return 0
  const compliant = active.filter((o) => o.status === 'compliant').length
  return Math.round((compliant / active.length) * 100)
}
