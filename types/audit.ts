export type AuditFindingSeverity = 'low' | 'medium' | 'high' | 'critical'

export type AuditFindingStatus = 'open' | 'in_progress' | 'closed'

export type AuditLinkedEntityType = 'risk' | 'control' | 'compliance_obligation'

export const AUDIT_FINDING_SEVERITY_LABELS: Record<AuditFindingSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const AUDIT_FINDING_STATUS_LABELS: Record<AuditFindingStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
}

export const AUDIT_LINKED_ENTITY_LABELS: Record<AuditLinkedEntityType, string> = {
  risk: 'Risk',
  control: 'Control',
  compliance_obligation: 'Compliance Obligation',
}

export interface AuditFindingRow {
  id: string
  finding_reference: string
  title: string
  severity: AuditFindingSeverity
  status: AuditFindingStatus
  remediation_owner_id: string | null
  remediation_owner_name: string
  due_date: string
  review_date: string
  linked_entity_type: AuditLinkedEntityType
  linked_entity_id: string
  created_at: string
}
