// lib/risk/risk-utils.ts
// Pure risk business logic helpers. No Next.js, React, or Supabase imports.
import { isPast } from 'date-fns'
import type { RiskSeverity, RiskStatus, TreatmentStatus } from '@/types/risk'

export function calculateRiskScore(likelihood: number, impact: number): number {
  return likelihood * impact
}

export function getRiskSeverity(score: number): RiskSeverity {
  if (score <= 4) return 'low'
  if (score <= 9) return 'medium'
  if (score <= 15) return 'high'
  return 'critical'
}

export function isTreatmentOverdue(
  status: TreatmentStatus,
  dueDate: string | Date,
): boolean {
  if (status === 'completed' || status === 'cancelled' || status === 'overdue') {
    return false
  }

  return isPast(new Date(dueDate))
}

export const RISK_SEVERITY_BADGE: Record<RiskSeverity, string> = {
  low: 'bg-ok/10 text-ok border-ok/30',
  medium: 'bg-warn/10 text-warn border-warn/30',
  high: 'bg-err/10 text-err border-err/30',
  critical: 'bg-err/30 text-err border-err/50',
}

export const RISK_STATUS_BADGE: Record<RiskStatus, string> = {
  open: 'bg-paper text-navy-mid border-paper-border',
  mitigated: 'bg-ok/10 text-ok border-ok/30',
  accepted: 'bg-gold-pale text-navy-900 border-gold/40',
  closed: 'bg-gray-100 text-gray-500 border-gray-200',
  escalated: 'bg-err/10 text-err border-err/30',
}

export const TREATMENT_STATUS_BADGE: Record<TreatmentStatus, string> = {
  planned: 'bg-paper text-navy-mid border-paper-border',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-ok/10 text-ok border-ok/30',
  overdue: 'bg-err/10 text-err border-err/30',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
}

export const RISK_HEATMAP_CELL_BG: Record<RiskSeverity, string> = {
  low: 'bg-ok/15',
  medium: 'bg-warn/20',
  high: 'bg-err/20',
  critical: 'bg-err/40',
}
