import { createClient } from '@/lib/supabase/server'
import { getActionItemsForEscalation } from '@/lib/board/queries'
import { sendBoardActionEscalationEmails } from '@/lib/board/escalation'

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = await createClient()
    const { data: targets, error } = await getActionItemsForEscalation(supabase)

    if (error) {
      console.error('[board/escalate] query error', error)
      return Response.json({ error: 'Failed to query action items' }, { status: 500 })
    }

    const result = await sendBoardActionEscalationEmails(targets)
    return Response.json({
      success: true,
      actionItemsFound: targets.length,
      emailsSent: result.sent,
      emailsSkipped: result.skipped,
    })
  } catch (err) {
    console.error('[board/escalate] unexpected error', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
