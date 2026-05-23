'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { computeFileHash } from '@/lib/files/checksum'
import { buildBoardPackStoragePath } from '@/lib/board/board-utils'
import {
  meetingSchema,
  resolutionSchema,
  actionItemSchema,
  documentUploadSchema,
  type MeetingInput,
  type ResolutionInput,
  type ActionItemInput,
} from '@/lib/schemas/board'
import type { AppRole } from '@/types/auth'

const WRITE_ROLES: AppRole[] = ['admin', 'ceo', 'board-member', 'board-secretary']
const RECORD_ROLES: AppRole[] = ['admin', 'ceo', 'board-member', 'board-secretary']
const GENERIC_ERROR = 'An unexpected error occurred. If this persists, contact your administrator.'
const uuidSchema = z.string().uuid()

type ActionResult = { error: string } | { data: { id: string } }

async function getWriteContext(allowedRoles: AppRole[] = WRITE_ROLES) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized.' as const }
  }

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role
  const institutionId = appMeta?.institution_id

  if (!activeRole || !allowedRoles.includes(activeRole as AppRole)) {
    return { error: 'You do not have permission to perform this action.' as const }
  }

  if (!institutionId) {
    return { error: 'Institution context is missing from your token.' as const }
  }

  return { supabase, user, activeRole: activeRole as AppRole, institutionId }
}

function revalidateBoardPaths(meetingId?: string) {
  revalidatePath('/board')
  revalidatePath('/board/meetings')
  revalidatePath('/board/actions')
  if (meetingId) {
    revalidatePath(`/board/meetings/${meetingId}`)
    revalidatePath(`/board/meetings/${meetingId}/edit`)
    revalidatePath(`/board/meetings/${meetingId}/documents/upload`)
    revalidatePath(`/board/meetings/${meetingId}/resolutions/new`)
    revalidatePath(`/board/meetings/${meetingId}/actions/new`)
  }
}

export async function createMeeting(values: MeetingInput): Promise<ActionResult> {
  const parsed = meetingSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const context = await getWriteContext(WRITE_ROLES)
  if ('error' in context) return { error: context.error ?? GENERIC_ERROR }

  try {
    const { data, error } = await context.supabase
      .from('board_meetings')
      .insert({
        institution_id: context.institutionId,
        title: parsed.data.title,
        meeting_date: parsed.data.meeting_date.toISOString(),
        location: parsed.data.location ?? null,
        agenda_items: parsed.data.agenda_items,
        attendee_ids: parsed.data.attendee_ids,
        created_by: context.user.id,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[createMeeting] DB error', error)
      return { error: GENERIC_ERROR }
    }

    const meetingId = String((data as { id: string }).id)
    revalidateBoardPaths(meetingId)
    return { data: { id: meetingId } }
  } catch (err) {
    console.error('[createMeeting] Unexpected error', err)
    return { error: GENERIC_ERROR }
  }
}

export async function updateMeeting(meetingId: string, values: MeetingInput): Promise<ActionResult> {
  if (!uuidSchema.safeParse(meetingId).success) return { error: 'Invalid meeting ID.' }

  const parsed = meetingSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const context = await getWriteContext(WRITE_ROLES)
  if ('error' in context) return { error: context.error ?? GENERIC_ERROR }

  const { data: existing } = await context.supabase
    .from('board_meetings')
    .select('id, status')
    .eq('id', meetingId)
    .single()

  if (!existing) return { error: 'Meeting not found.' }
  if ((existing as { status: string }).status === 'closed') {
    return { error: 'Meeting is closed and cannot be edited.' }
  }

  const { data, error } = await context.supabase
    .from('board_meetings')
    .update({
      title: parsed.data.title,
      meeting_date: parsed.data.meeting_date.toISOString(),
      location: parsed.data.location ?? null,
      agenda_items: parsed.data.agenda_items,
      attendee_ids: parsed.data.attendee_ids,
      updated_at: new Date().toISOString(),
    })
    .eq('id', meetingId)
    .select('id')
    .single()

  if (error || !data) {
    console.error('[updateMeeting] DB error', error)
    return { error: GENERIC_ERROR }
  }

  revalidateBoardPaths(meetingId)
  return { data: { id: String((data as { id: string }).id) } }
}

export async function closeMeeting(meetingId: string): Promise<ActionResult> {
  if (!uuidSchema.safeParse(meetingId).success) return { error: 'Invalid meeting ID.' }

  const context = await getWriteContext(RECORD_ROLES)
  if ('error' in context) return { error: context.error ?? GENERIC_ERROR }

  const { data, error } = await context.supabase
    .from('board_meetings')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', meetingId)
    .neq('status', 'closed')
    .select('id')
    .single()

  if (error || !data) {
    return { error: 'Meeting is closed or unavailable.' }
  }

  revalidateBoardPaths(meetingId)
  return { data: { id: String((data as { id: string }).id) } }
}

export async function updateMeetingStatus(
  meetingId: string,
  status: 'scheduled' | 'in_progress' | 'closed',
): Promise<ActionResult> {
  if (!uuidSchema.safeParse(meetingId).success) {
    return { error: 'Invalid meeting ID.' }
  }

  const context = await getWriteContext(RECORD_ROLES)
  if ('error' in context) return { error: context.error ?? GENERIC_ERROR }

  const { data: existing } = await context.supabase
    .from('board_meetings')
    .select('id, status')
    .eq('id', meetingId)
    .single()

  if (!existing) {
    return { error: 'Meeting not found.' }
  }

  if ((existing as { status: string }).status === 'closed') {
    return { error: 'Meeting is closed and cannot transition.' }
  }

  const payload: Record<string, string> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'closed') {
    payload.closed_at = new Date().toISOString()
  }

  const { data, error } = await context.supabase
    .from('board_meetings')
    .update(payload)
    .eq('id', meetingId)
    .select('id')
    .single()

  if (error || !data) {
    console.error('[updateMeetingStatus] db error', error)
    return { error: GENERIC_ERROR }
  }

  revalidateBoardPaths(meetingId)
  return { data: { id: String((data as { id: string }).id) } }
}

export async function uploadDocument(formData: FormData): Promise<ActionResult> {
  const context = await getWriteContext(WRITE_ROLES)
  if ('error' in context) return { error: context.error ?? GENERIC_ERROR }

  const file = formData.get('file') as File | null
  const meetingId = formData.get('meeting_id') as string | null
  const sha256 = formData.get('sha256_hash') as string | null

  const parsed = documentUploadSchema.safeParse({
    file: file ?? undefined,
    meeting_id: meetingId ?? '',
    sha256_hash: sha256 ?? '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const serverHash = await computeFileHash(parsed.data.file)
  if (serverHash !== parsed.data.sha256_hash) {
    return { error: 'Checksum mismatch. File may have changed during upload.' }
  }

  const ext = parsed.data.file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const path = buildBoardPackStoragePath(
    context.institutionId,
    parsed.data.meeting_id,
    Date.now(),
    serverHash,
    ext,
  )

  const { error: uploadError } = await context.supabase.storage
    .from('board-packs')
    .upload(path, parsed.data.file, { upsert: false })

  if (uploadError) {
    console.error('[uploadDocument] storage error', uploadError)
    return { error: 'Unable to upload board pack.' }
  }

  const { data, error } = await context.supabase
    .from('board_meeting_documents')
    .insert({
      institution_id: context.institutionId,
      meeting_id: parsed.data.meeting_id,
      storage_path: path,
      original_filename: parsed.data.file.name,
      mime_type: parsed.data.file.type,
      file_size_bytes: parsed.data.file.size,
      sha256_hash: serverHash,
      uploaded_by: context.user.id,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[uploadDocument] db error', error)
    return { error: GENERIC_ERROR }
  }

  revalidateBoardPaths(parsed.data.meeting_id)
  return { data: { id: String((data as { id: string }).id) } }
}

export async function createResolution(values: ResolutionInput): Promise<ActionResult> {
  const parsed = resolutionSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const context = await getWriteContext(RECORD_ROLES)
  if ('error' in context) return { error: context.error ?? GENERIC_ERROR }

  const { data: meeting } = await context.supabase
    .from('board_meetings')
    .select('id, status')
    .eq('id', parsed.data.meeting_id)
    .single()

  if (!meeting) return { error: 'Meeting not found.' }
  if ((meeting as { status: string }).status !== 'in_progress') {
    return { error: 'Resolutions can only be recorded while meeting is in progress.' }
  }

  const { count } = await context.supabase
    .from('board_resolutions')
    .select('*', { count: 'exact', head: true })
    .eq('meeting_id', parsed.data.meeting_id)

  const resolutionNumber = (count ?? 0) + 1

  const { data, error } = await context.supabase
    .from('board_resolutions')
    .insert({
      institution_id: context.institutionId,
      meeting_id: parsed.data.meeting_id,
      resolution_number: resolutionNumber,
      motion_text: parsed.data.motion_text,
      proposer_id: parsed.data.proposer_id,
      seconder_id: parsed.data.seconder_id ?? null,
      vote_outcome: parsed.data.vote_outcome,
      notes: parsed.data.notes ?? null,
      created_by: context.user.id,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[createResolution] db error', error)
    return { error: GENERIC_ERROR }
  }

  revalidateBoardPaths(parsed.data.meeting_id)
  return { data: { id: String((data as { id: string }).id) } }
}

export async function createActionItem(values: ActionItemInput): Promise<ActionResult> {
  const parsed = actionItemSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const context = await getWriteContext(WRITE_ROLES)
  if ('error' in context) return { error: context.error ?? GENERIC_ERROR }

  const { data: meeting } = await context.supabase
    .from('board_meetings')
    .select('id, status')
    .eq('id', parsed.data.meeting_id)
    .single()

  if (!meeting) return { error: 'Meeting not found.' }
  if ((meeting as { status: string }).status === 'closed') {
    return { error: 'Meeting is closed and cannot accept action items.' }
  }

  const { data, error } = await context.supabase
    .from('board_action_items')
    .insert({
      institution_id: context.institutionId,
      meeting_id: parsed.data.meeting_id,
      resolution_id: parsed.data.resolution_id ?? null,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      owner_id: parsed.data.owner_id ?? null,
      due_date: parsed.data.due_date.toISOString().slice(0, 10),
      status: parsed.data.status,
      created_by: context.user.id,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[createActionItem] db error', error)
    return { error: GENERIC_ERROR }
  }

  revalidateBoardPaths(parsed.data.meeting_id)
  return { data: { id: String((data as { id: string }).id) } }
}

export async function updateActionItemStatus(
  actionItemId: string,
  status: 'open' | 'in_progress' | 'completed' | 'overdue' | 'cancelled',
): Promise<ActionResult> {
  if (!uuidSchema.safeParse(actionItemId).success) {
    return { error: 'Invalid action item ID.' }
  }

  const context = await getWriteContext(WRITE_ROLES)
  if ('error' in context) return { error: context.error ?? GENERIC_ERROR }

  const { data: existing } = await context.supabase
    .from('board_action_items')
    .select('id, meeting_id')
    .eq('id', actionItemId)
    .single()

  if (!existing) return { error: 'Action item not found.' }

  const { data, error } = await context.supabase
    .from('board_action_items')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', actionItemId)
    .select('id, meeting_id')
    .single()

  if (error || !data) {
    console.error('[updateActionItemStatus] db error', error)
    return { error: GENERIC_ERROR }
  }

  revalidateBoardPaths(String((data as { meeting_id: string }).meeting_id))
  return { data: { id: String((data as { id: string }).id) } }
}
