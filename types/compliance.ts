// types/compliance.ts
// Domain types and label maps for Phase 4 Compliance Management.

export type RegulatoryFramework =
  | 'pecoga'
  | 'ppdpa'
  | 'nds2'
  | 'iso_37000'
  | 'king_iv'
  | 'ipsas'
  | 'pfma'
  | 'other'

export type ObligationStatus =
  | 'pending'
  | 'compliant'
  | 'partially_compliant'
  | 'non_compliant'
  | 'overdue'
  | 'waived'

export type AttestationStatus = 'compliant' | 'partially_compliant' | 'non_compliant'

export const REGULATORY_FRAMEWORK_LABELS: Record<RegulatoryFramework, string> = {
  pecoga:    'PECOGA',
  ppdpa:     'PPDPA',
  nds2:      'NDS2',
  iso_37000: 'ISO 37000',
  king_iv:   'King IV',
  ipsas:     'IPSAS',
  pfma:      'PFMA',
  other:     'Other',
}

export const OBLIGATION_STATUS_LABELS: Record<ObligationStatus, string> = {
  pending:             'Pending',
  compliant:           'Compliant',
  partially_compliant: 'Partially Compliant',
  non_compliant:       'Non-Compliant',
  overdue:             'Overdue',
  waived:              'Waived',
}

export const ATTESTATION_STATUS_LABELS: Record<AttestationStatus, string> = {
  compliant:           'Compliant',
  partially_compliant: 'Partially Compliant',
  non_compliant:       'Non-Compliant',
}

// Row type for TanStack Table — owner_name is denormalized from join
export interface ObligationRow {
  id: string
  framework: RegulatoryFramework
  framework_reference: string | null
  title: string
  owner_id: string | null
  owner_name: string
  due_date: string
  status: ObligationStatus
  evidence_count: number
  created_at: string
}
