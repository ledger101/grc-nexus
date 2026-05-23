import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Pencil, ShieldCheck, Upload, FileX, ShieldX } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/types/auth'
import { getObligationById, listEvidence, listAttestations } from '@/lib/compliance/queries'
import { OBLIGATION_STATUS_BADGE, isObligationOverdue } from '@/lib/compliance/compliance-utils'
import { EvidenceFileRow } from '@/components/compliance/EvidenceFileRow'
import { AttestationRow } from '@/components/compliance/AttestationRow'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { RegulatoryFramework, ObligationStatus, AttestationStatus } from '@/types/compliance'
import {
  REGULATORY_FRAMEWORK_LABELS,
  OBLIGATION_STATUS_LABELS,
} from '@/types/compliance'

export const dynamic = 'force-dynamic'

const VIEW_ROLES: AppRole[] = [
  'admin',
  'ceo',
  'compliance-officer',
  'risk-officer',
  'audit-officer',
  'board-member',
]

// Roles that may attest obligations (D-20)
const ATTEST_ROLES: AppRole[] = ['admin', 'ceo', 'compliance-officer']

// Roles that may upload evidence and edit (D-32)
const WRITE_ROLES: AppRole[] = ['admin', 'compliance-officer']

interface PageProps {
  params: { id: string }
}

type ObligationDetail = {
  id: string
  title: string
  description: string | null
  framework: RegulatoryFramework
  framework_reference: string | null
  owner_id: string | null
  due_date: string
  status: ObligationStatus
  created_at: string
  updated_at: string | null
  user_profiles: { first_name: string | null; last_name: string | null } | null
  created_by_profile?: { first_name: string | null; last_name: string | null } | null
}

type EvidenceDetail = {
  id: string
  original_filename: string
  file_size_bytes: number
  mime_type: string
  sha256_hash: string
  uploaded_at: string
  user_profiles: { first_name: string | null; last_name: string | null } | null
}

type AttestationDetail = {
  id: string
  attestation_status: AttestationStatus
  attested_at: string
  notes: string | null
  user_profiles: { first_name: string | null; last_name: string | null } | null
}

// Regulatory framework badge — inline per UI-SPEC Component 30
function FrameworkBadge({ framework }: { framework: RegulatoryFramework }) {
  const classes: Record<RegulatoryFramework, string> = {
    pecoga:    'bg-purple-50 text-purple-700 border border-purple-200',
    ppdpa:     'bg-blue-50 text-blue-700 border border-blue-200',
    nds2:      'bg-teal-50 text-teal-700 border border-teal-200',
    iso_37000: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    king_iv:   'bg-amber-50 text-amber-700 border border-amber-200',
    ipsas:     'bg-cyan-50 text-cyan-700 border border-cyan-200',
    pfma:      'bg-orange-50 text-orange-700 border border-orange-200',
    other:     'bg-gray-100 text-gray-600 border border-gray-300',
  }
  return (
    <span
      className={cn('inline-flex rounded-[6px] px-[8px] py-[4px] text-[14px] font-medium', classes[framework])}
      aria-label={`Regulatory framework: ${REGULATORY_FRAMEWORK_LABELS[framework]}`}
    >
      {REGULATORY_FRAMEWORK_LABELS[framework]}
    </span>
  )
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function ObligationDetailPage({ params }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role as AppRole | undefined

  if (!activeRole || !VIEW_ROLES.includes(activeRole)) {
    redirect('/dashboard')
  }

  // Parallel fetch: obligation detail + evidence list + attestation history
  const [obligationResult, evidenceResult, attestationsResult] = await Promise.all([
    getObligationById(supabase, params.id),
    listEvidence(supabase, params.id),
    listAttestations(supabase, params.id),
  ])

  if (obligationResult.error || !obligationResult.data) {
    notFound()
  }

  const obligation = obligationResult.data as unknown as ObligationDetail
  const evidenceFiles = evidenceResult.data as unknown as EvidenceDetail[]
  const attestations = attestationsResult.data as unknown as AttestationDetail[]

  const ownerProfile = obligation.user_profiles
  const ownerName = [ownerProfile?.first_name, ownerProfile?.last_name].filter(Boolean).join(' ') || 'Unassigned'

  const isOverdue = isObligationOverdue(obligation.status, obligation.due_date)
  const isDueSoon = (() => {
    const diff = Math.ceil((new Date(obligation.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 7
  })()

  const canAttest = activeRole && ATTEST_ROLES.includes(activeRole)
  const canWrite = activeRole && WRITE_ROLES.includes(activeRole)

  return (
    <div>
      {/* Breadcrumb */}
      <p className="mb-2 text-[14px] text-navy-mid">
        <Link href="/compliance" className="hover:underline">Compliance</Link>
        {' / '}
        <span className="text-navy-900">{obligation.title}</span>
      </p>

      {/* Page header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-semibold leading-[1.2] text-navy-900">
            {obligation.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-[8px]">
            <FrameworkBadge framework={obligation.framework} />
            <span
              className={cn('inline-flex font-medium', OBLIGATION_STATUS_BADGE[obligation.status])}
              aria-label={`Compliance status: ${OBLIGATION_STATUS_LABELS[obligation.status]}`}
            >
              {OBLIGATION_STATUS_LABELS[obligation.status]}
            </span>
            <span className="text-[14px] text-navy-mid">Owned by {ownerName}</span>
            <span
              className={cn(
                'font-mono text-[14px]',
                isOverdue ? 'font-semibold text-err' : isDueSoon ? 'text-warn' : 'text-navy-mid',
              )}
            >
              Due {obligation.due_date}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Link
            href={`/compliance/obligations/${obligation.id}/edit`}
            className="inline-flex items-center gap-[6px] rounded-[6px] border border-paper-border bg-white px-[12px] py-[6px] text-[13px] font-medium text-navy-900 hover:bg-paper transition-colors"
          >
            <Pencil className="h-[14px] w-[14px]" aria-hidden="true" />
            Edit Obligation
          </Link>
          {canAttest && (
            <Link
              href={`/compliance/obligations/${obligation.id}/attest`}
              className="inline-flex items-center gap-[6px] rounded-[6px] bg-gold px-[12px] py-[6px] text-[13px] font-semibold text-navy-950 hover:bg-gold-hi transition-colors"
            >
              <ShieldCheck className="h-[14px] w-[14px]" aria-hidden="true" />
              Attest
            </Link>
          )}
        </div>
      </div>

      {/* Overdue banner */}
      {obligation.status === 'overdue' && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>This obligation is overdue.</AlertTitle>
          <AlertDescription>
            The assigned owner and administrators have been notified.
          </AlertDescription>
        </Alert>
      )}

      {/* Two-column layout: left (Details + Evidence), right (Attestation) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">

          {/* Details Card */}
          <div className="rounded-[10px] border border-paper-border bg-white p-6 shadow-card">
            <h2 className="mb-4 text-[16px] font-semibold text-navy-900">Obligation Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-navy-mid">Description</p>
                <p className="mt-1 text-[16px] text-navy-900">
                  {obligation.description ?? <span className="text-navy-mid italic">No description provided.</span>}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-navy-mid">Framework Reference</p>
                {obligation.framework_reference ? (
                  <code className="mt-1 block font-mono text-[14px] text-navy-mid">
                    {obligation.framework_reference}
                  </code>
                ) : (
                  <p className="mt-1 text-[14px] text-navy-mid">—</p>
                )}
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-navy-mid">Created</p>
                <p className="mt-1 font-mono text-[14px] text-navy-mid">{formatDate(obligation.created_at)}</p>
              </div>
              {obligation.updated_at && (
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-navy-mid">Last Updated</p>
                  <p className="mt-1 font-mono text-[14px] text-navy-mid">{formatDate(obligation.updated_at)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Evidence Card */}
          <div className="rounded-[10px] border border-paper-border bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-navy-900">Evidence Files</h2>
              {canWrite && (
                <Link
                  href={`/compliance/obligations/${obligation.id}/evidence/upload`}
                  className="inline-flex items-center gap-[6px] rounded-[6px] bg-gold px-[10px] py-[6px] text-[13px] font-semibold text-navy-950 hover:bg-gold-hi transition-colors"
                >
                  <Upload className="h-[13px] w-[13px]" aria-hidden="true" />
                  Upload Evidence
                </Link>
              )}
            </div>

            {evidenceFiles.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <FileX className="mb-3 h-7 w-7 text-paper-border" aria-hidden="true" />
                <p className="text-[14px] text-navy-mid">No evidence uploaded</p>
                <p className="mt-1 text-[14px] text-navy-mid">No evidence files have been attached to this obligation.</p>
                {canWrite && (
                  <Link
                    href={`/compliance/obligations/${obligation.id}/evidence/upload`}
                    className="mt-3 text-[14px] font-medium text-gold hover:underline"
                  >
                    Upload evidence →
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-[8px]">
                {evidenceFiles.map((file) => {
                  const uploaderProfile = file.user_profiles
                  const uploaderName = [uploaderProfile?.first_name, uploaderProfile?.last_name]
                    .filter(Boolean)
                    .join(' ') || 'Unknown'
                  return (
                    <EvidenceFileRow
                      key={file.id}
                      id={file.id}
                      originalFilename={file.original_filename}
                      fileSizeBytes={file.file_size_bytes}
                      mimeType={file.mime_type}
                      sha256Hash={file.sha256_hash}
                      uploadedAt={file.uploaded_at}
                      uploadedByName={uploaderName}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* Attestation Card */}
          <div className="rounded-[10px] border border-paper-border bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-navy-900">Attestation History</h2>
              <span className="rounded-[4px] border border-paper-border bg-paper px-[8px] py-[4px] text-[13px] text-navy-mid">
                {attestations.length} attestation{attestations.length !== 1 ? 's' : ''}
              </span>
            </div>

            {attestations.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <ShieldX className="mb-3 h-7 w-7 text-paper-border" aria-hidden="true" />
                <p className="text-[14px] text-navy-mid">No attestations recorded</p>
                <p className="mt-1 text-[14px] text-navy-mid">Submit an attestation to record compliance status.</p>
                {canAttest && (
                  <Link
                    href={`/compliance/obligations/${obligation.id}/attest`}
                    className="mt-3 inline-flex items-center gap-[6px] rounded-[6px] border border-paper-border bg-white px-[12px] py-[6px] text-[13px] font-medium text-navy-900 hover:bg-paper transition-colors"
                  >
                    Attest Obligation
                  </Link>
                )}
              </div>
            ) : (
              <div
                className="flex flex-col gap-[8px]"
                aria-label={`Attestation history, ${attestations.length} records`}
                aria-live="polite"
              >
                {/* Newest first — listAttestations returns descending order */}
                {attestations.map((att) => {
                  const attesterProfile = att.user_profiles
                  const attesterName = [attesterProfile?.first_name, attesterProfile?.last_name]
                    .filter(Boolean)
                    .join(' ') || 'Unknown'
                  return (
                    <AttestationRow
                      key={att.id}
                      attestationStatus={att.attestation_status}
                      attestedByName={attesterName}
                      attestedAt={att.attested_at}
                      notes={att.notes}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
