// types/risk.ts
// Types and label maps for Phase 3 risk domain.

export type RiskCategory =
  | 'strategic'
  | 'operational'
  | 'financial'
  | 'compliance'
  | 'reputational'
  | 'technology'

export type RiskStatus = 'open' | 'mitigated' | 'accepted' | 'closed' | 'escalated'

export type TreatmentStatus = 'planned' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical'

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  strategic: 'Strategic',
  operational: 'Operational',
  financial: 'Financial',
  compliance: 'Compliance',
  reputational: 'Reputational',
  technology: 'Technology',
}

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  open: 'Open',
  mitigated: 'Mitigated',
  accepted: 'Accepted',
  closed: 'Closed',
  escalated: 'Escalated',
}

export const TREATMENT_STATUS_LABELS: Record<TreatmentStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

export interface RiskRegisterRow {
  id: string
  title: string
  category: RiskCategory
  status: RiskStatus
  owner_id: string | null
  owner_name: string
  objective_id: string
  objective_title: string
  inherent_likelihood: number
  inherent_impact: number
  residual_likelihood: number | null
  residual_impact: number | null
  treatments_count: number
  created_at: string
}

export interface RiskTreatmentRow {
  id: string
  risk_id: string
  title: string
  description: string | null
  owner_id: string | null
  owner_name: string
  due_date: string
  status: TreatmentStatus
  created_at: string
  updated_at: string
}
