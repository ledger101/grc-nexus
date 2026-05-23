import Link from 'next/link'
import { ACTION_STATUS_BADGE } from '@/types/board'
import type { BoardActionItemRow } from '@/types/board'

export function ActionItemList({
  meetingId,
  actionItems,
  canCreate,
  meetingClosed,
}: {
  meetingId: string
  actionItems: BoardActionItemRow[]
  canCreate: boolean
  meetingClosed: boolean
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-navy-900">Action Items</h3>
        {canCreate && (
          <Link
            href={`/board/meetings/${meetingId}/actions/new`}
            className={`text-[13px] ${meetingClosed ? 'pointer-events-none text-navy-mid/60' : 'text-navy-900 hover:underline'}`}
          >
            Add action item
          </Link>
        )}
      </div>
      {actionItems.length === 0 ? (
        <p className="text-[14px] text-navy-mid">No action items created yet.</p>
      ) : (
        <div className="space-y-2">
          {actionItems.map((item) => (
            <div key={item.id} className="rounded border border-paper-border p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[14px] font-medium text-navy-900">{item.title}</p>
                <span className={`rounded border px-2 py-0.5 text-[11px] ${ACTION_STATUS_BADGE[item.status]}`}>
                  {item.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[12px] text-navy-mid">Due: {item.due_date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
