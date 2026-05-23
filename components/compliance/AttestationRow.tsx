// components/compliance/AttestationRow.tsx
// Attestation history row with status badge, attested-by, timestamp, and audit badge (UI-SPEC Component 34).
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ATTESTATION_STATUS_LABELS } from '@/types/compliance'
import type { AttestationStatus } from '@/types/compliance'

// Re-export the type labels for attestation status (subset of obligation status)
const ATTESTATION_BADGE: Record<AttestationStatus, string> = {
  compliant:           'bg-ok/10 text-ok border border-ok/30 rounded-grc-sm px-[8px] py-[4px] text-[14px]',
  partially_compliant: 'bg-warn/10 text-warn border border-warn/30 rounded-grc-sm px-[8px] py-[4px] text-[14px]',
  non_compliant:       'bg-err/10 text-err border border-err/30 rounded-grc-sm px-[8px] py-[4px] text-[14px] font-semibold',
}

const ATTESTATION_ICON_COLOR: Record<AttestationStatus, string> = {
  compliant:           'text-ok',
  partially_compliant: 'text-warn',
  non_compliant:       'text-err',
}

export interface AttestationRowProps {
  attestationStatus: AttestationStatus
  attestedByName: string
  attestedAt: string
  notes: string | null
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  const datePart = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${datePart} at ${timePart}`
}

export function AttestationRow({
  attestationStatus,
  attestedByName,
  attestedAt,
  notes,
}: AttestationRowProps) {
  return (
    <div className="border border-paper-border rounded-grc-sm p-[8px] bg-white">
      <div className="flex items-start gap-[12px]">
        {/* Status icon */}
        <ShieldCheck
          className={cn('mt-[2px] h-[18px] w-[18px] flex-shrink-0', ATTESTATION_ICON_COLOR[attestationStatus])}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-[8px]">
            <span
              className={cn('inline-flex font-medium', ATTESTATION_BADGE[attestationStatus])}
              aria-label={`Compliance status: ${ATTESTATION_STATUS_LABELS[attestationStatus]}`}
            >
              {ATTESTATION_STATUS_LABELS[attestationStatus]}
            </span>
            <span className="text-[14px] text-navy-mid">
              by {attestedByName}
            </span>
            <span className="font-mono text-[14px] text-navy-mid">
              {formatDateTime(attestedAt)}
            </span>
          </div>

          {notes && (
            <p className="mt-[8px] text-[14px] italic text-navy-900">
              {notes}
            </p>
          )}
        </div>

        {/* Audit recorded badge */}
        <span className="flex-shrink-0 rounded-[4px] border border-paper-border bg-paper px-[8px] py-[4px] text-[12px] text-navy-mid">
          Audit recorded
        </span>
      </div>
    </div>
  )
}
