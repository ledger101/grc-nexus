import { createClient } from '@/lib/supabase/server'
import { getAuditFindingsForEscalation } from '@/lib/audit/queries'
import { sendAuditEscalationEmails } from '@/lib/audit/escalation'

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = await createClient()
    const { data: findings, error } = await getAuditFindingsForEscalation(supabase)

    if (error) {
      console.error('[audit escalate] DB query error:', error)
      return Response.json({ error: 'Failed to query findings' }, { status: 500 })
    }

    const result = await sendAuditEscalationEmails(findings)

    return Response.json({
      success: true,
      findingsFound: findings.length,
      emailsSent: result.sent,
      emailsSkipped: result.skipped,
    })
  } catch (error) {
    console.error('[audit escalate] Unexpected error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
