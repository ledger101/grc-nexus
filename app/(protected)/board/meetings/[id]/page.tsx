import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMeetingById, listActionItems, listDocuments, listResolutions } from '@/lib/board/queries'
import { MEETING_STATUS_BADGE } from '@/types/board'
import { MeetingDetailTabs } from './MeetingDetailTabs'

export const dynamic = 'force-dynamic'

const VIEW_ROLES = ['admin', 'ceo', 'board-member', 'board-secretary', 'audit-officer', 'risk-officer']
const WRITE_ROLES = ['admin', 'ceo', 'board-member', 'board-secretary']
const RECORD_ROLES = ['admin', 'ceo', 'board-member', 'board-secretary']

export default async function MeetingDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const activeRole = (user.app_metadata as Record<string, string>)?.active_role
  if (!activeRole || !VIEW_ROLES.includes(activeRole)) redirect('/board')

  const meeting = await getMeetingById(supabase, params.id)
  if (!meeting) {
    redirect('/board/meetings')
  }

  const [documents, resolutions, actionItems] = await Promise.all([
    listDocuments(supabase, params.id),
    listResolutions(supabase, params.id),
    listActionItems(supabase, params.id),
  ])

  const isClosed = meeting.status === 'closed'

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-heading font-semibold text-navy-950">{meeting.title}</h1>
          <p className="text-[13px] text-navy-mid">{new Date(meeting.meeting_date).toLocaleString()} {meeting.location ? `| ${meeting.location}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded border px-2 py-1 text-[12px] ${MEETING_STATUS_BADGE[meeting.status]}`}>
            {meeting.status.replace('_', ' ')}
          </span>
          {!isClosed && WRITE_ROLES.includes(activeRole) && (
            <Link href={`/board/meetings/${meeting.id}/edit`} className="text-[13px] text-navy-900 hover:underline">Edit</Link>
          )}
        </div>
      </div>

      {isClosed && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-[13px] font-semibold uppercase tracking-wide text-red-700">
          CLOSED: This meeting is immutable and cannot be edited.
        </div>
      )}

      <MeetingDetailTabs
        meeting={meeting}
        documents={documents}
        resolutions={resolutions}
        actionItems={actionItems}
        canWrite={WRITE_ROLES.includes(activeRole)}
        canRecord={RECORD_ROLES.includes(activeRole)}
      />
    </div>
  )
}
