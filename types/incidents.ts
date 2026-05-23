export type IncidentCategory = 'fraud' | 'misconduct' | 'safety' | 'cyber' | 'governance' | 'other'

export type IncidentStatus = 'new' | 'assigned' | 'in_investigation' | 'escalated' | 'closed'

export type IncidentVisibility = 'investigator_admin_only' | 'oversight_visible'

export const INCIDENT_CATEGORY_LABELS: Record<IncidentCategory, string> = {
  fraud: 'Fraud & Financial Crimes',
  misconduct: 'Professional Misconduct',
  safety: 'Workplace Safety & Health',
  cyber: 'Cybersecurity & Data Leakage',
  governance: 'Governance Violations',
  other: 'Other Serious Concerns',
}

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  new: 'New / Unassigned',
  assigned: 'Assigned',
  in_investigation: 'Under Investigation',
  escalated: 'Escalated',
  closed: 'Closed',
}

export const INCIDENT_VISIBILITY_LABELS: Record<IncidentVisibility, string> = {
  investigator_admin_only: 'Investigator & Admin Only',
  oversight_visible: 'Oversight Board Visible',
}

export interface IncidentCaseRow {
  id: string
  institution_id: string
  title: string
  description: string
  category: IncidentCategory
  status: IncidentStatus
  visibility: IncidentVisibility
  severity: 'low' | 'medium' | 'high' | 'critical'
  is_anonymous: boolean
  reported_by_user_id: string | null
  reporter_name: string | null
  reporter_contact: string | null
  assigned_investigator_id: string | null
  assigned_investigator_name?: string | null
  resolution_summary: string | null
  sla_due_date: string | null
  created_at: string
  updated_at: string
}

export interface IncidentCaseEventRow {
  id: string
  case_id: string
  event_type: 'intake' | 'triage' | 'assignment' | 'reassignment' | 'status_change' | 'evidence_upload' | 'note' | 'closure'
  notes: string
  actor_id: string | null
  actor_name: string | null
  created_at: string
}

export interface IncidentCaseEvidenceRow {
  id: string
  case_id: string
  filename: string
  storage_path: string
  sha256_hash: string
  mime_type: string
  file_size_bytes: number
  uploaded_by: string
  uploaded_at: string
}
