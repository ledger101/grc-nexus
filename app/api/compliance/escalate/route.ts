// app/api/compliance/escalate/route.ts
// POST endpoint callable by Supabase pg_cron or external scheduler.
// Protected by CRON_SECRET header (D-25, RESEARCH.md Pattern 5, T-4-02-D).
//
// pg_cron setup (run once in Supabase SQL editor):
//   select cron.schedule(
//     'compliance-escalation-daily',
//     '0 8 * * *',
//     $$ select net.http_post(
//       url := 'https://your-app.vercel.app/api/compliance/escalate',
//       headers := '{"Content-Type": "application/json", "x-cron-secret": "YOUR_CRON_SECRET"}'::jsonb,
//       body := '{}'::jsonb
//     ) $$
//   );
import { createClient } from '@/lib/supabase/server'
import { getObligationsForEscalation } from '@/lib/compliance/queries'
import { sendComplianceEscalationEmails } from '@/lib/compliance/escalation'

export async function POST(request: Request) {
  // CRON_SECRET guard — FIRST operation before any DB query (T-4-02-D, D-25)
  // Unauthenticated POST returns 401 immediately with no DB work performed.
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = await createClient()
    const { data: obligations, error } = await getObligationsForEscalation(supabase)

    if (error) {
      console.error('[escalate] DB query error:', error)
      return Response.json({ error: 'Failed to query obligations' }, { status: 500 })
    }

    const result = await sendComplianceEscalationEmails(obligations)

    return Response.json({
      success: true,
      obligationsFound: obligations.length,
      emailsSent: result.sent,
      emailsSkipped: result.skipped,
    })
  } catch (err) {
    console.error('[escalate] Unexpected error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
