import Link from 'next/link'
import { RESOLUTION_OUTCOME_BADGE } from '@/types/board'
import type { BoardResolutionRow } from '@/types/board'

function toResolutionCode(num: number): string {
  return `RES-${String(num).padStart(3, '0')}`
}

export function ResolutionList({
  meetingId,
  resolutions,
  canCreate,
  meetingInProgress,
}: {
  meetingId: string
  resolutions: BoardResolutionRow[]
  canCreate: boolean
  meetingInProgress: boolean
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-navy-900">Resolutions</h3>
        {canCreate && (
          <Link
            href={`/board/meetings/${meetingId}/resolutions/new`}
            className={`text-[13px] ${meetingInProgress ? 'text-navy-900 hover:underline' : 'pointer-events-none text-navy-mid/60'}`}
          >
            Record resolution
          </Link>
        )}
      </div>
      {resolutions.length === 0 ? (
        <p className="text-[14px] text-navy-mid">No resolutions recorded.</p>
      ) : (
        <div className="space-y-2">
          {resolutions.map((item) => (
            <div key={item.id} className="rounded border border-paper-border p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-navy-mid">{toResolutionCode(item.resolution_number)}</span>
                <span className={`rounded border px-2 py-0.5 text-[11px] ${RESOLUTION_OUTCOME_BADGE[item.vote_outcome]}`}>
                  {item.vote_outcome}
                </span>
              </div>
              <p className="text-[14px] text-navy-900">{item.motion_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
