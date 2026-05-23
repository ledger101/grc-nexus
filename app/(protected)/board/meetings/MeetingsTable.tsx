'use client'

import Link from 'next/link'
import { MEETING_STATUS_BADGE } from '@/types/board'
import type { BoardMeetingRow } from '@/types/board'

export function MeetingsTable({ meetings }: { meetings: BoardMeetingRow[] }) {
  if (meetings.length === 0) {
    return <p className="text-[14px] text-navy-mid">No meetings found. Create your first board meeting.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-paper-border text-navy-mid">
            <th className="py-2 pr-3 font-medium">Title</th>
            <th className="py-2 pr-3 font-medium">Date</th>
            <th className="py-2 pr-3 font-medium">Location</th>
            <th className="py-2 pr-3 font-medium">Status</th>
            <th className="py-2 pr-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {meetings.map((meeting) => (
            <tr key={meeting.id} className="border-b border-paper-border/70 last:border-0">
              <td className="py-3 pr-3 text-navy-900">{meeting.title}</td>
              <td className="py-3 pr-3 text-navy-900">{new Date(meeting.meeting_date).toLocaleString()}</td>
              <td className="py-3 pr-3 text-navy-mid">{meeting.location ?? '-'}</td>
              <td className="py-3 pr-3">
                <span className={`rounded border px-2 py-0.5 text-xs ${MEETING_STATUS_BADGE[meeting.status]}`}>
                  {meeting.status.replace('_', ' ')}
                </span>
              </td>
              <td className="py-3 pr-3">
                <Link className="text-navy-900 hover:underline" href={`/board/meetings/${meeting.id}`}>
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
