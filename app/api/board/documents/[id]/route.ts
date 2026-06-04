import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyChecksum } from '@/lib/files/checksum'
import type { AppRole } from '@/types/auth'

const VIEW_ROLES: AppRole[] = [
  'admin',
  'ceo',
  'board-member',
  'board-secretary',
  'audit-officer',
]

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role as AppRole | undefined
  if (!activeRole || !VIEW_ROLES.includes(activeRole)) {
    return new Response('Forbidden', { status: 403 })
  }

  const { data: doc, error: dbErr } = await supabase
    .from('board_meeting_documents')
    .select('storage_path, sha256_hash, original_filename, mime_type, file_size_bytes')
    .eq('id', id)
    .single()

  if (dbErr || !doc) {
    return new Response('Not Found', { status: 404 })
  }

  const { data: fileData, error: storageErr } = await supabase.storage
    .from('board-packs')
    .download((doc as { storage_path: string }).storage_path)

  if (storageErr || !fileData) {
    return new Response('Storage download failed', { status: 500 })
  }

  const buffer = Buffer.from(await fileData.arrayBuffer())
  const verified = verifyChecksum(buffer, (doc as { sha256_hash: string }).sha256_hash)
  if (!verified) {
    return new Response('Integrity check failed -- file may have been modified (SHA-256 mismatch)', { status: 409 })
  }

  const filename = encodeURIComponent((doc as { original_filename: string }).original_filename)
  const contentDisposition = `attachment; filename*=UTF-8''${filename}`

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': String((doc as { mime_type: string }).mime_type),
      'Content-Disposition': contentDisposition,
      'Content-Length': String(buffer.length),
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
