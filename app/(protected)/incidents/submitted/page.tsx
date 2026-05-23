import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { IncidentCategoryBadge } from '@/components/incidents/IncidentCategoryBadge'
import type { IncidentCategory } from '@/types/incidents'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams?: {
    case?: string
    category?: string
    anonymous?: string
  }
}

export default function IncidentSubmittedPage({ searchParams }: PageProps) {
  const caseReference = searchParams?.case || 'Pending'
  const category = (searchParams?.category as IncidentCategory | undefined) ?? 'other'
  const isAnonymous = searchParams?.anonymous === '1'

  return (
    <div className="mx-auto max-w-2xl rounded-[10px] border border-paper-border bg-white p-8 shadow-card">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-full bg-ok/10 p-2 text-ok">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-[20px] font-semibold text-navy-900">Incident Submitted</h1>
          <p className="text-[14px] text-navy-mid">Your report has been recorded in the incident register.</p>
        </div>
      </div>

      <div className="mb-6 rounded-[8px] border border-paper-border bg-paper p-4">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-navy-mid">Case reference</p>
        <p className="mt-1 font-mono text-[24px] font-semibold text-navy-900">{caseReference}</p>
        <div className="mt-3 flex items-center gap-2">
          <IncidentCategoryBadge category={category} />
          {isAnonymous && (
            <span className="inline-flex rounded-[6px] border border-blue-200 bg-blue-50 px-[8px] py-[4px] text-[13px] font-medium text-blue-700">
              Anonymous
            </span>
          )}
        </div>
      </div>

      <div className="mb-6 rounded-[8px] border border-gold/30 bg-gold-pale p-4">
        <p className="text-[14px] text-navy-900">
          Confidentiality notice: if you selected anonymous submission, reporter identity fields are excluded from investigator-facing records.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/incidents"
          className="inline-flex items-center rounded-[8px] bg-gold px-8 py-2 text-[14px] font-semibold text-navy-950 hover:bg-gold-hi"
        >
          Go to Incident Dashboard
        </Link>
        <Link
          href="/incidents/report"
          className="inline-flex items-center rounded-[8px] border border-paper-border bg-white px-6 py-2 text-[14px] font-medium text-navy-900 hover:bg-paper"
        >
          Submit Another Report
        </Link>
      </div>
    </div>
  )
}
