import Link from 'next/link'
import type { BoardDocumentRow } from '@/types/board'

export function DocumentList({ meetingId, documents, canUpload }: { meetingId: string; documents: BoardDocumentRow[]; canUpload: boolean }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-navy-900">Board Packs</h3>
        {canUpload && (
          <Link href={`/board/meetings/${meetingId}/documents/upload`} className="text-[13px] text-navy-900 hover:underline">
            Upload document
          </Link>
        )}
      </div>
      {documents.length === 0 ? (
        <p className="text-[14px] text-navy-mid">No board pack uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={`/api/board/documents/${doc.id}`}
              className="block rounded border border-paper-border px-3 py-2 text-[13px] text-navy-900 hover:bg-paper"
            >
              {doc.original_filename}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
