import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type {
  BoardActionItemRow,
  BoardDocumentRow,
  BoardMeetingRow,
  BoardResolutionRow,
  MeetingStatus,
} from '@/types/board'

type DbClient = SupabaseClient<Database>

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const maybeCode = (error as { code?: unknown }).code
  return maybeCode === 'PGRST205'
}

export interface ActionItemEscalationTarget {
  id: string
  title: string
  due_date: string
  owner_id: string
  meeting_id: string
  meeting_title: string
  institution_id: string
}

export async function listMeetings(
  supabase: DbClient,
  options?: { limit?: number; upcoming?: boolean; status?: MeetingStatus },
): Promise<BoardMeetingRow[]> {
  let query = supabase
    .from('board_meetings')
    .select('id, title, meeting_date, location, status, agenda_items, attendee_ids, created_by, closed_at, created_at, updated_at')
    .order('meeting_date', { ascending: true })

  if (options?.upcoming) {
    query = query.gte('meeting_date', new Date().toISOString()).neq('status', 'closed')
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) {
    if (isMissingTableError(error)) return []
    throw error
  }
  return (data ?? []) as BoardMeetingRow[]
}

export async function getMeetingById(supabase: DbClient, id: string): Promise<BoardMeetingRow | null> {
  const { data, error } = await supabase.from('board_meetings').select('*').eq('id', id).single()
  if (error || !data) return null
  return data as unknown as BoardMeetingRow
}

export async function listDocuments(supabase: DbClient, meetingId: string): Promise<BoardDocumentRow[]> {
  const { data, error } = await supabase
    .from('board_meeting_documents')
    .select('id, meeting_id, storage_path, original_filename, mime_type, file_size_bytes, sha256_hash, uploaded_by, uploaded_at, user_profiles!uploaded_by(first_name, last_name)')
    .eq('meeting_id', meetingId)
    .order('uploaded_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => {
    const typed = row as Record<string, unknown>
    const profile = typed.user_profiles as { first_name?: string | null; last_name?: string | null } | null
    const uploaderName = profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : null

    return {
      ...(typed as unknown as BoardDocumentRow),
      uploader_name: uploaderName || null,
    }
  })
}

export async function listResolutions(supabase: DbClient, meetingId: string): Promise<BoardResolutionRow[]> {
  const { data, error } = await supabase
    .from('board_resolutions')
    .select('id, meeting_id, resolution_number, motion_text, proposer_id, seconder_id, vote_outcome, notes, created_by, created_at')
    .eq('meeting_id', meetingId)
    .order('resolution_number', { ascending: true })

  if (error) throw error
  return (data ?? []) as BoardResolutionRow[]
}

export async function listActionItems(
  supabase: DbClient,
  meetingId?: string,
): Promise<BoardActionItemRow[]> {
  let query = supabase
    .from('board_action_items')
    .select('id, meeting_id, resolution_id, title, description, owner_id, due_date, status, created_by, created_at, updated_at, board_meetings!meeting_id(title), user_profiles!owner_id(first_name, last_name)')
    .order('due_date', { ascending: true })

  if (meetingId) {
    query = query.eq('meeting_id', meetingId)
  }

  const { data, error } = await query
  if (error) {
    if (isMissingTableError(error)) return []
    throw error
  }

  return (data ?? []).map((row) => {
    const typed = row as Record<string, unknown>
    const owner = typed.user_profiles as { first_name?: string | null; last_name?: string | null } | null
    const meeting = typed.board_meetings as { title?: string | null } | null

    return {
      ...(typed as unknown as BoardActionItemRow),
      owner_name: owner ? `${owner.first_name ?? ''} ${owner.last_name ?? ''}`.trim() : null,
      meeting_title: meeting?.title ?? null,
    }
  })
}

export async function getBoardStats(supabase: DbClient): Promise<{
  upcomingMeetings: number
  openActionItems: number
  overdueActions: number
}> {
  const today = new Date().toISOString().slice(0, 10)

  const [upcomingMeetingsResult, openItemsResult, overdueItemsResult] = await Promise.all([
    supabase
      .from('board_meetings')
      .select('*', { count: 'exact', head: true })
      .gte('meeting_date', new Date().toISOString())
      .neq('status', 'closed'),
    supabase
      .from('board_action_items')
      .select('*', { count: 'exact', head: true })
      .not('status', 'in', '("completed","cancelled")'),
    supabase
      .from('board_action_items')
      .select('*', { count: 'exact', head: true })
      .lt('due_date', today)
      .not('status', 'in', '("completed","cancelled")'),
  ])

  if (
    isMissingTableError(upcomingMeetingsResult.error) ||
    isMissingTableError(openItemsResult.error) ||
    isMissingTableError(overdueItemsResult.error)
  ) {
    return {
      upcomingMeetings: 0,
      openActionItems: 0,
      overdueActions: 0,
    }
  }

  if (upcomingMeetingsResult.error) throw upcomingMeetingsResult.error
  if (openItemsResult.error) throw openItemsResult.error
  if (overdueItemsResult.error) throw overdueItemsResult.error

  return {
    upcomingMeetings: upcomingMeetingsResult.count ?? 0,
    openActionItems: openItemsResult.count ?? 0,
    overdueActions: overdueItemsResult.count ?? 0,
  }
}

export async function getActionItemsForEscalation(
  supabase: DbClient,
): Promise<{ data: ActionItemEscalationTarget[]; error: unknown }> {
  const threeDaysOut = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('board_action_items')
    .select('id, title, due_date, owner_id, institution_id, meeting_id, board_meetings!meeting_id(title)')
    .lte('due_date', threeDaysOut)
    .not('status', 'in', '("completed","cancelled")')
    .not('owner_id', 'is', null)
    .order('due_date', { ascending: true })

  if (error) {
    return { data: [], error }
  }

  const mapped = (data ?? []).map((row) => {
    const typed = row as Record<string, unknown>
    const meeting = typed.board_meetings as { title?: string | null } | null

    return {
      id: String(typed.id),
      title: String(typed.title),
      due_date: String(typed.due_date),
      owner_id: String(typed.owner_id),
      meeting_id: String(typed.meeting_id),
      meeting_title: meeting?.title ?? 'Board Meeting',
      institution_id: String(typed.institution_id),
    }
  })

  return { data: mapped, error: null }
}
