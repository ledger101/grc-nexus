// components/compliance/EvidenceFileRow.tsx
// Evidence list row with download link and SHA-256 hash display (UI-SPEC Component 33).
import { FileText, FileImage, FileSpreadsheet, CheckCircle, Download } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

export interface EvidenceFileRowProps {
  id: string
  originalFilename: string
  fileSizeBytes: number
  mimeType: string
  sha256Hash: string
  uploadedAt: string
  uploadedByName: string
}

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getFileIcon(mimeType: string) {
  if (mimeType === 'image/jpeg' || mimeType === 'image/png') {
    return <FileImage className="mt-[2px] h-5 w-5 flex-shrink-0 text-navy-mid" aria-hidden="true" />
  }
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    return <FileSpreadsheet className="mt-[2px] h-5 w-5 flex-shrink-0 text-navy-mid" aria-hidden="true" />
  }
  return <FileText className="mt-[2px] h-5 w-5 flex-shrink-0 text-navy-mid" aria-hidden="true" />
}

export function EvidenceFileRow({
  id,
  originalFilename,
  fileSizeBytes,
  mimeType,
  sha256Hash,
  uploadedAt,
  uploadedByName,
}: EvidenceFileRowProps) {
  const hashPreview = `${sha256Hash.slice(0, 16)}...`

  return (
    <TooltipProvider>
      <div className="border border-paper-border rounded-grc-sm p-[8px] bg-white hover:bg-paper/70 transition-colors">
        <div className="flex items-start gap-[12px]">
          {/* File type icon */}
          {getFileIcon(mimeType)}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Row 1: filename + download button */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="truncate text-[14px] font-medium text-navy-900" title={originalFilename}>
                  {originalFilename}
                </p>
                <p className="mt-[4px] font-mono text-[14px] text-navy-mid">
                  {formatFileSize(fileSizeBytes)} · Uploaded {formatDate(uploadedAt)} by {uploadedByName}
                </p>
              </div>
              {/* Download via API route — never direct Storage URL (key_link: EvidenceFileRow → api/compliance/evidence) */}
              <a
                href={`/api/compliance/evidence/${id}`}
                download={originalFilename}
                className="inline-flex flex-shrink-0 items-center gap-[6px] rounded-[6px] border border-paper-border bg-white px-[10px] py-[6px] text-[13px] font-medium text-navy-900 hover:bg-paper transition-colors"
                aria-label={`Download ${originalFilename}`}
              >
                <Download className="h-[14px] w-[14px]" aria-hidden="true" />
                Download File
              </a>
            </div>

            {/* SHA-256 row */}
            <div className="mt-[8px] flex items-center gap-[8px]">
              <CheckCircle className="h-[14px] w-[14px] flex-shrink-0 text-ok" aria-label="Integrity status: Verified" />
              <span className="text-[14px] text-ok">Verified</span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <code
                    className="cursor-default font-mono text-[14px] text-navy-mid"
                    aria-label={`SHA-256 checksum: ${sha256Hash}`}
                  >
                    {hashPreview}
                  </code>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[500px]">
                  <p className="font-mono text-[12px] break-all">{sha256Hash}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
