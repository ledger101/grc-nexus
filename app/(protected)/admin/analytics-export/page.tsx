// app/(protected)/admin/analytics-export/page.tsx
// Analytics Export admin page — institution-scoped CSV downloads + API documentation.
// Admin access enforced by app/(protected)/admin/layout.tsx — no per-page redirect needed.
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Analytics Export — GRC-Nexus',
}

const MODULES = [
  { label: 'Strategic KPIs', slug: 'kpis', description: 'Key performance indicators with all readings' },
  { label: 'Key Risk Indicators', slug: 'kris', description: 'KRI definitions and period readings' },
  { label: 'Key Control Indicators', slug: 'kcis', description: 'KCI definitions and test readings' },
  { label: 'Risk Register', slug: 'risks', description: 'Risk entries, scores, and treatment status' },
  { label: 'Compliance Obligations', slug: 'obligations', description: 'Obligations, evidence, and attestation records' },
  { label: 'Audit Findings', slug: 'findings', description: 'Findings with severity, remediation, and closure' },
  { label: 'Incidents', slug: 'incidents', description: 'Incident reports and investigation records' },
  { label: 'Board Actions', slug: 'board-actions', description: 'Board meeting action items and resolution records' },
  { label: 'ESG Metrics', slug: 'esg', description: 'ESG metric definitions and period readings' },
] as const

const MODULE_COLUMNS: Record<string, { endpoint: string; columns: string[] }> = {
  kpis: {
    endpoint: 'GET /api/analytics/export/kpis',
    columns: ['KPI ID', 'KPI Title', 'Unit', 'Target', 'Baseline', 'Frequency', 'KPI Status', 'Reading ID', 'Period', 'Actual Value', 'Recorded At'],
  },
  kris: {
    endpoint: 'GET /api/analytics/export/kris',
    columns: ['KRI ID', 'KRI Title', 'Unit', 'Target', 'Alert Threshold', 'Direction', 'Reading ID', 'Period Start', 'Period End', 'Actual Value', 'Reading Status', 'Recorded At'],
  },
  kcis: {
    endpoint: 'GET /api/analytics/export/kcis',
    columns: ['KCI ID', 'KCI Title', 'Unit', 'Target', 'Alert Threshold', 'Test Cadence', 'Reading ID', 'Period Start', 'Period End', 'Actual Value', 'Reading Status', 'Recorded At'],
  },
  risks: {
    endpoint: 'GET /api/analytics/export/risks',
    columns: ['ID', 'Title', 'Description', 'Category', 'Owner ID', 'Likelihood', 'Impact', 'Risk Score', 'Severity', 'Status', 'Created At'],
  },
  obligations: {
    endpoint: 'GET /api/analytics/export/obligations',
    columns: ['ID', 'Title', 'Framework', 'Owner ID', 'Due Date', 'Status', 'Created At'],
  },
  findings: {
    endpoint: 'GET /api/analytics/export/findings',
    columns: ['ID', 'Title', 'Severity', 'Status', 'Owner ID', 'Root Cause', 'Created At', 'Closed At'],
  },
  incidents: {
    endpoint: 'GET /api/analytics/export/incidents',
    columns: ['ID', 'Category', 'Status', 'Assigned To', 'Created At', 'Closed At'],
  },
  'board-actions': {
    endpoint: 'GET /api/analytics/export/board-actions',
    columns: ['ID', 'Title', 'Owner ID', 'Due Date', 'Status', 'Resolution ID', 'Created At'],
  },
  esg: {
    endpoint: 'GET /api/analytics/export/esg',
    columns: ['Metric ID', 'Metric Name', 'Category', 'Code', 'Unit', 'Target', 'Reading ID', 'Period', 'Actual Value', 'Notes', 'Recorded At'],
  },
}

export default async function AnalyticsExportPage() {
  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-navy-900 font-body">Analytics Export</h1>
          <p className="text-[14px] text-navy-mid mt-1">
            Download institution-scoped CSV exports for each governance module.
          </p>
        </div>
      </div>

      {/* Module Export Table */}
      <div className="bg-white rounded-[10px] border border-paper-border shadow-card overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="bg-paper border-b border-paper-border">
              <th className="text-left text-[13px] font-semibold uppercase tracking-wider text-navy-mid px-4 py-3">Module</th>
              <th className="text-left text-[13px] font-semibold uppercase tracking-wider text-navy-mid px-4 py-3">Records Exported</th>
              <th className="text-left text-[13px] font-semibold uppercase tracking-wider text-navy-mid px-4 py-3">Format</th>
              <th className="text-right text-[13px] font-semibold uppercase tracking-wider text-navy-mid px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map((mod) => (
              <tr key={mod.slug} className="border-b border-paper-border last:border-0">
                <td className="text-[14px] text-navy-900 px-4 py-3 font-medium">{mod.label}</td>
                <td className="text-[13px] text-navy-mid px-4 py-3">{mod.description}</td>
                <td className="text-[13px] text-navy-mid px-4 py-3 font-mono">CSV / UTF-8</td>
                <td className="text-right px-4 py-3">
                  <a
                    href={`/api/analytics/export/${mod.slug}`}
                    className="inline-flex items-center px-4 py-2 rounded-[8px] bg-gold text-navy-950 hover:bg-gold-hi text-[13px] font-medium shadow-card transition-colors"
                  >
                    Download CSV
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* API Documentation Section */}
      <div className="mb-4">
        <h2 className="text-[16px] font-semibold text-navy-900 mb-2">API Documentation</h2>
        <p className="text-[14px] text-navy-mid mb-4">
          These endpoints return institution-scoped CSV data. Authentication required (session cookie).
          For external R or Python workflows, obtain a session token via the Supabase Auth API.
        </p>
      </div>

      <Accordion type="single" collapsible className="bg-white rounded-[10px] border border-paper-border shadow-card">
        {MODULES.map((mod) => {
          const docs = MODULE_COLUMNS[mod.slug]
          if (!docs) return null
          return (
            <AccordionItem key={mod.slug} value={mod.slug}>
              <AccordionTrigger className="px-6 text-[14px] font-semibold text-navy-900">
                {docs.endpoint}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <p className="text-[13px] text-navy-mid mb-2">Response columns:</p>
                <div className="flex flex-wrap gap-2">
                  {docs.columns.map((col) => (
                    <code key={col} className="font-mono text-[13px] bg-paper px-1 rounded border border-paper-border">
                      {col}
                    </code>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
