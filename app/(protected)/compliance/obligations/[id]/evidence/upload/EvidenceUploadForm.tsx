'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, FileCheck, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { evidenceUploadSchema, type EvidenceUploadInput } from '@/lib/schemas/compliance'
import { uploadEvidence } from '@/lib/compliance/actions'
import { REGULATORY_FRAMEWORK_LABELS, type RegulatoryFramework } from '@/types/compliance'

// Browser SHA-256 computation using Web Crypto API — no external library (RESEARCH.md Pattern 2)
// crypto.subtle is available on localhost (secure context) and Vercel (HTTPS always)
async function computeSHA256Browser(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Allowed MIME types — must match server-side ALLOWED_MIME_TYPES in actions.ts (D-13)
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'image/jpeg',
  'image/png',
]

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
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
    <span className={cn('inline-flex rounded-[6px] px-[8px] py-[4px] text-[14px] font-medium', classes[framework])}>
      {REGULATORY_FRAMEWORK_LABELS[framework]}
    </span>
  )
}

interface EvidenceUploadFormProps {
  obligationId: string
  obligationTitle: string
  obligationFramework: RegulatoryFramework
}

export function EvidenceUploadForm({
  obligationId,
  obligationTitle,
  obligationFramework,
}: EvidenceUploadFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // File and hash state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [computedHash, setComputedHash] = useState<string>('')
  const [isHashing, setIsHashing] = useState(false)
  const [hashError, setHashError] = useState<string | null>(null)
  const [dropZoneState, setDropZoneState] = useState<'idle' | 'dragover' | 'selected' | 'error'>('idle')
  const [serverError, setServerError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<EvidenceUploadInput>({
    resolver: zodResolver(evidenceUploadSchema),
    defaultValues: {
      obligation_id: obligationId,
      sha256_hash: '',
      mime_type: 'application/pdf',
      file_size_bytes: 0,
    },
  })

  async function handleFileSelected(file: File) {
    // 1. Validate MIME type first (D-13)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setDropZoneState('error')
      setHashError('File type not accepted. Accepted types: PDF, DOCX, XLSX, JPG, PNG.')
      return
    }

    // 2. Validate file size (D-14)
    if (file.size > 25 * 1024 * 1024) {
      setDropZoneState('error')
      setHashError('File size exceeds the 25 MB limit. Please use a smaller file.')
      return
    }

    // 3. Set state and begin SHA-256 computation
    setSelectedFile(file)
    setDropZoneState('selected')
    setIsHashing(true)
    setHashError(null)
    setComputedHash('')

    try {
      // Browser SHA-256 via Web Crypto API — exact call required by plan must_haves
      const hash = await computeSHA256Browser(file)
      setComputedHash(hash)
      form.setValue('sha256_hash', hash)
      form.setValue('mime_type', file.type as EvidenceUploadInput['mime_type'])
      form.setValue('file_size_bytes', file.size)
      form.setValue('obligation_id', obligationId)
    } catch {
      setHashError('Checksum computation failed. Please try again or use a different browser.')
      setDropZoneState('error')
    } finally {
      setIsHashing(false)
    }
  }

  function handleRemoveFile() {
    setSelectedFile(null)
    setComputedHash('')
    setIsHashing(false)
    setHashError(null)
    setDropZoneState('idle')
    form.reset({ obligation_id: obligationId, sha256_hash: '', mime_type: 'application/pdf', file_size_bytes: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // onSubmit — builds FormData and calls uploadEvidence(fd) — NOT uploadEvidence(values) (plan requirement)
  function onSubmit(_values: EvidenceUploadInput) {
    if (!selectedFile || !computedHash || isHashing) return
    setServerError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('file', selectedFile)
      fd.append('obligation_id', obligationId)
      fd.append('sha256_hash', computedHash)
      const result = await uploadEvidence(fd)
      if ('error' in result) {
        setServerError(result.error)
        return
      }
      toast.success('Evidence uploaded and checksum recorded.', { duration: 4000 })
      router.push(`/compliance/obligations/${obligationId}`)
    })
  }

  // Submit disabled until file + 64-char hash + not hashing + not pending
  const isSubmitDisabled = !selectedFile || !computedHash || computedHash.length !== 64 || isHashing || isPending

  return (
    <div>
      {/* Context card: obligation summary above the form card */}
      <div className="mt-[8px] rounded-grc-sm border border-paper-border bg-gold-pale/30 p-[8px]">
        <p className="text-[14px] font-semibold text-navy-900">{obligationTitle}</p>
        <div className="mt-[4px]">
          <FrameworkBadge framework={obligationFramework} />
        </div>
      </div>

      <div className="mt-6 rounded-[10px] border border-paper-border bg-white p-8 shadow-card">
        {serverError && (
          <Alert variant="destructive" role="alert" aria-live="assertive" className="mb-4">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>

            {/* Evidence Drop Zone (UI-SPEC Component 32) */}
            <div
              role="button"
              aria-label="Upload evidence file. Drop a file here or press Enter to browse."
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) handleFileSelected(f)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDropZoneState('dragover')
              }}
              onDragLeave={() => {
                setDropZoneState(selectedFile ? 'selected' : 'idle')
              }}
              onClick={() => {
                if (dropZoneState !== 'selected') {
                  fileInputRef.current?.click()
                }
              }}
              className={cn(
                'flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-grc-md border-2 border-dashed px-[24px] py-[32px] transition-all',
                dropZoneState === 'idle'     && 'border-paper-border bg-paper/50',
                dropZoneState === 'dragover' && 'border-gold bg-gold-pale/20',
                dropZoneState === 'selected' && 'border-ok/50 bg-ok/5',
                dropZoneState === 'error'    && 'border-err bg-err/5',
              )}
            >
              {/* Idle state */}
              {dropZoneState === 'idle' && (
                <>
                  <Upload className="h-8 w-8 text-paper-border" aria-hidden="true" />
                  <p className="mt-3 text-[16px] text-navy-mid">Drop your evidence file here</p>
                  <p className="mt-1 text-[14px] text-navy-mid">
                    or click to browse — PDF, DOCX, XLSX, JPG, PNG up to 25 MB
                  </p>
                </>
              )}

              {/* Drag-over state */}
              {dropZoneState === 'dragover' && (
                <>
                  <Upload className="h-8 w-8 text-gold" aria-hidden="true" />
                  <p className="mt-3 text-[16px] text-navy-900" aria-live="polite">
                    Release to upload
                  </p>
                </>
              )}

              {/* File selected state */}
              {dropZoneState === 'selected' && selectedFile && (
                <>
                  <FileCheck className="h-8 w-8 text-ok" aria-hidden="true" />
                  <p className="mt-3 text-[14px] font-medium text-navy-900">{selectedFile.name}</p>
                  <p className="mt-1 text-[14px] text-navy-mid">
                    {formatFileSize(selectedFile.size)} · {selectedFile.type}
                  </p>

                  {/* SHA-256 computation progress / result */}
                  {isHashing ? (
                    <p className="mt-[4px] text-[14px] text-navy-mid" aria-live="polite">
                      <Loader2 className="mr-[4px] inline h-[12px] w-[12px] animate-spin" aria-hidden="true" />
                      Computing checksum...
                    </p>
                  ) : computedHash ? (
                    <div className="mt-[4px] text-center">
                      <p className="text-[12px] uppercase text-navy-mid">SHA-256</p>
                      <code
                        className="break-all font-mono text-[14px] text-navy-mid"
                        aria-label={`SHA-256 checksum: ${computedHash}`}
                      >
                        {computedHash}
                      </code>
                    </div>
                  ) : null}

                  {/* Remove file link */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFile()
                    }}
                    className="mt-[8px] text-[14px] text-err hover:underline"
                  >
                    Remove file
                  </button>
                </>
              )}

              {/* Error state */}
              {dropZoneState === 'error' && (
                <>
                  <XCircle className="h-8 w-8 text-err" aria-hidden="true" />
                  <p className="mt-3 text-[14px] text-err" aria-live="polite">
                    {hashError ?? 'An error occurred. Please try again.'}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFile()
                    }}
                    className="mt-[8px] text-[14px] text-navy-mid hover:underline"
                  >
                    Try again
                  </button>
                </>
              )}
            </div>

            {/* Hidden file input — accessible via drop zone click/keyboard */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileSelected(f)
              }}
            />

            {/* Accepted file types info */}
            <Alert className="mt-[8px]">
              <AlertDescription className="text-[14px] text-navy-mid">
                Accepted: PDF, DOCX, XLSX, JPG, PNG — Maximum 25 MB per file
              </AlertDescription>
            </Alert>

            {/* Form footer */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 border-paper-border text-[14px]"
                onClick={() => router.push(`/compliance/obligations/${obligationId}`)}
                disabled={isPending}
              >
                Back to Obligation
              </Button>
              <Button
                type="submit"
                className="h-11 bg-gold px-8 text-[14px] font-semibold text-navy-950 hover:bg-gold-hi"
                disabled={isSubmitDisabled}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Uploading...' : 'Upload Evidence'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
