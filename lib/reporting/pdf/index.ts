import { buildGovernanceSummaryPdf } from './templates/rpt-001'
import { buildRiskRegisterPdf } from './templates/rpt-002'
import { buildCompliancePdf } from './templates/rpt-005'
import { buildBoardActionsPdf } from './templates/rpt-009'
import { buildBoardMeetingPackPdf } from './templates/rpt-007'
import { buildQuarterlyRiskCommitteePackPdf } from './templates/rpt-015'
import { buildAnnualCorporateGovernanceReturnPdf } from './templates/rpt-020'

export const TEMPLATES: Record<string, { name: string; builder: Function | null; description: string }> = {
  'rpt-001': { name: 'Executive Governance Summary', builder: buildGovernanceSummaryPdf, description: 'Cross-module dashboard stats and top risks' },
  'rpt-002': { name: 'Risk Register Summary', builder: buildRiskRegisterPdf, description: 'Full risk register table' },
  'rpt-003': { name: 'Risk Heatmap (Visual)', builder: null, description: '5×5 heatmap grid' },
  'rpt-004': { name: 'Top 10 Risks Briefing', builder: null, description: '1-page brief per risk' },
  'rpt-005': { name: 'Compliance Obligations Status', builder: buildCompliancePdf, description: 'Obligations table' },
  'rpt-006': { name: 'Policy Acknowledgment Summary', builder: null, description: 'Policy attestation status' },
  'rpt-007': { name: 'Board Meeting Pack', builder: buildBoardMeetingPackPdf, description: '300-page meeting pack — CRITICAL' },
  'rpt-008': { name: 'Board Minutes (Formal)', builder: null, description: 'Parliamentary format minutes' },
  'rpt-009': { name: 'Board Action Tracker', builder: buildBoardActionsPdf, description: 'Action items table' },
  'rpt-010': { name: 'Audit Findings Register', builder: null, description: 'Findings table' },
  'rpt-011': { name: 'Internal Audit Annual Plan', builder: null, description: 'Gantt-style plan' },
  'rpt-012': { name: 'Incident Summary Report', builder: null, description: 'Incidents table' },
  'rpt-013': { name: 'Whistleblower Statistics', builder: null, description: 'Anonymised stats' },
  'rpt-014': { name: 'Vendor Risk Assessment', builder: null, description: 'Supplier risk summary' },
  'rpt-015': { name: 'Quarterly Board Risk Committee Pack', builder: buildQuarterlyRiskCommitteePackPdf, description: 'Cross-module quarterly — CRITICAL' },
  'rpt-016': { name: 'NDS2 Alignment Progress', builder: null, description: 'Strategic objectives vs NDS2' },
  'rpt-017': { name: 'KPI Performance Dashboard', builder: null, description: 'KPI sparklines + readings' },
  'rpt-018': { name: 'CEO Performance Contract', builder: null, description: 'Performance review form' },
  'rpt-019': { name: 'Combined Assurance Map', builder: null, description: 'Audit + risk + compliance overlay' },
  'rpt-020': { name: 'Annual Corporate Governance Return', builder: buildAnnualCorporateGovernanceReturnPdf, description: 'Government submission — CRITICAL' },
}

export function listTemplates() {
  return Object.entries(TEMPLATES).map(([id, t]) => ({ id, name: t.name, description: t.description, available: !!t.builder }))
}

export async function buildReport(templateId: string, data: any, metadata: any) {
  const template = TEMPLATES[templateId]
  if (!template) throw new Error(`Unknown template: ${templateId}`)
  if (!template.builder) throw new Error(`Template ${templateId} (${template.name}) is not yet implemented`)
  return await template.builder(data, metadata)
}
