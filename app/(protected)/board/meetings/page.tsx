import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listMeetings } from '@/lib/board/queries'
import { MeetingsTable } from './MeetingsTable'

export const dynamic = 'force-dynamic'

const VIEW_ROLES = ['admin', 'ceo', 'board-member', 'board-secretary', 'audit-officer', 'risk-officer']

export default async function BoardMeetingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const activeRole = (user.app_metadata as Record<string, string>)?.active_role
  if (!activeRole || !VIEW_ROLES.includes(activeRole)) {
    redirect('/dashboard')
  }

  const meetings = await listMeetings(supabase)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-heading font-semibold text-navy-950">Board Meetings</h1>
          <p className="text-[14px] text-navy-mid">Schedule, manage, and close governance meetings.</p>
        </div>
        <Link href="/board/meetings/new" className="inline-flex items-center rounded-[6px] bg-gold px-4 py-2 text-[14px] font-medium text-navy-950 hover:bg-gold-hi">
          New Meeting
        </Link>
      </div>

      <div className="rounded-[10px] border border-paper-border bg-white p-5 shadow-card">
        <MeetingsTable meetings={meetings} />
      </div>
    </div>
  )
}
