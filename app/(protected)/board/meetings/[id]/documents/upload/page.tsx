import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMeetingById } from '@/lib/board/queries'
import { DocumentUploadForm } from './DocumentUploadForm'

export const dynamic = 'force-dynamic'

const WRITE_ROLES = ['admin', 'ceo', 'board-member', 'board-secretary']

export default async function UploadBoardDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const activeRole = (user.app_metadata as Record<string, string>)?.active_role
  if (!activeRole || !WRITE_ROLES.includes(activeRole)) redirect(`/board/meetings/${id}`)

  const meeting = await getMeetingById(supabase, id)
  if (!meeting || meeting.status === 'closed') redirect(`/board/meetings/${id}`)

  return (
    <div>
      <h1 className="mb-1 text-[28px] font-heading font-semibold text-navy-950">Upload Board Pack</h1>
      <p className="mb-6 text-[14px] text-navy-mid">Integrity hash is computed in-browser and re-verified on server.</p>
      <DocumentUploadForm meetingId={id} />
    </div>
  )
}
