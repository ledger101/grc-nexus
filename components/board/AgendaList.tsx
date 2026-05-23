import type { BoardMeetingRow } from '@/types/board'

export function AgendaList({ meeting }: { meeting: BoardMeetingRow }) {
  if (!meeting.agenda_items.length) {
    return <p className="text-[14px] text-navy-mid">No agenda items added for this meeting.</p>
  }

  return (
    <ol className="list-decimal space-y-2 pl-5 text-[14px] text-navy-900">
      {meeting.agenda_items.map((item, index) => (
        <li key={`${meeting.id}-agenda-${index}`}>{item}</li>
      ))}
    </ol>
  )
}
