// lib/compliance/escalation.ts
// Compliance escalation email service.
// Mirrors lib/risk/ escalation pattern (D-27) as a standalone module.
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEscalationThreshold } from '@/lib/compliance/compliance-utils'
import type { ObligationEscalationTarget } from '@/lib/compliance/queries'

/**
 * HTML-escape user-supplied strings before embedding in email HTML (ME-04).
 * Prevents stored XSS via obligation title or framework values rendered in email clients.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Send compliance escalation emails for obligations at each threshold.
 * Called by app/api/compliance/escalate/route.ts via pg_cron POST (D-25).
 *
 * Thresholds per D-26:
 *   - early_warning: 1–3 days before due date
 *   - due_today: due date is today
 *   - critical_overdue: 7+ days past due date
 *
 * Recipients (D-28): obligation owner + institution admin users
 */
export async function sendComplianceEscalationEmails(
  obligations: ObligationEscalationTarget[],
): Promise<{ sent: number; skipped: number }> {
  const admin = createAdminClient()
  let sent = 0
  let skipped = 0

  for (const obligation of obligations) {
    // Check escalation threshold — skip if obligation is not in any threshold bucket
    const threshold = getEscalationThreshold(obligation.due_date)
    if (!threshold) {
      skipped++
      continue
    }

    const recipients = new Set<string>()

    // Add obligation owner email (D-28)
    if (obligation.owner_id) {
      const { data: ownerUser } = await admin.auth.admin.getUserById(obligation.owner_id)
      if (ownerUser?.user?.email) {
        recipients.add(ownerUser.user.email)
      }
    }

    // Add institution admin emails (D-28) — queried from user_profiles by active_role
    // Note: user_profiles PK is `id` (= auth.users.id), not `user_id`
    const { data: adminProfiles } = await admin
      .from('user_profiles')
      .select('id')
      .eq('institution_id', obligation.institution_id)
      .eq('active_role', 'admin')

    if (adminProfiles) {
      for (const profile of adminProfiles) {
        const { data: adminUser } = await admin.auth.admin.getUserById(
          (profile as { id: string }).id,
        )
        if (adminUser?.user?.email) {
          recipients.add(adminUser.user.email)
        }
      }
    }

    // Skip if no recipients resolved
    if (recipients.size === 0) {
      skipped++
      continue
    }

    const subjectMap: Record<typeof threshold, string> = {
      early_warning:    `Action Required: Compliance obligation due in 3 days — ${obligation.title}`,
      due_today:        `URGENT: Compliance obligation due TODAY — ${obligation.title}`,
      critical_overdue: `CRITICAL: Compliance obligation is 7+ days overdue — ${obligation.title}`,
    }

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@grc-nexus.gov.zw',
        to: Array.from(recipients),
        subject: subjectMap[threshold],
        html: `
          <p>This is an automated compliance alert from GRC-Nexus.</p>
          <p><strong>Obligation:</strong> ${escapeHtml(obligation.title)}</p>
          <p><strong>Framework:</strong> ${escapeHtml(obligation.framework.toUpperCase())}</p>
          <p><strong>Due Date:</strong> ${escapeHtml(obligation.due_date)}</p>
          <p><strong>Status:</strong> ${escapeHtml(threshold.replace(/_/g, ' '))}</p>
          <p>Please log in to GRC-Nexus to update the compliance status or attest this obligation.</p>
        `,
      })
      sent++
    } catch (emailErr) {
      console.error('[sendComplianceEscalationEmails] Email send error:', emailErr)
      skipped++
    }
  }

  return { sent, skipped }
}
