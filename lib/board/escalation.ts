import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEscalationThreshold } from '@/lib/board/board-utils'
import type { ActionItemEscalationTarget } from '@/lib/board/queries'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendBoardActionEscalationEmails(targets: ActionItemEscalationTarget[]) {
  const admin = createAdminClient()
  let sent = 0
  let skipped = 0

  for (const target of targets) {
    const threshold = getEscalationThreshold(target.due_date)
    if (threshold === 'none') {
      skipped++
      continue
    }

    const recipients = new Set<string>()

    const { data: owner } = await admin.auth.admin.getUserById(target.owner_id)
    if (owner?.user?.email) {
      recipients.add(owner.user.email)
    }

    const { data: adminProfiles } = await admin
      .from('user_profiles')
      .select('id')
      .eq('institution_id', target.institution_id)
      .eq('active_role', 'admin')

    for (const p of adminProfiles ?? []) {
      const { data: adminUser } = await admin.auth.admin.getUserById((p as { id: string }).id)
      if (adminUser?.user?.email) {
        recipients.add(adminUser.user.email)
      }
    }

    if (recipients.size === 0) {
      skipped++
      continue
    }

    const subject = threshold === 'critical_overdue'
      ? `CRITICAL: Board action overdue -- ${target.title}`
      : threshold === 'due_today'
        ? `URGENT: Board action due today -- ${target.title}`
        : `Reminder: Board action due soon -- ${target.title}`

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@grc-nexus.gov.zw',
        to: Array.from(recipients),
        subject,
        html: `
          <p>This is an automated board action escalation from GRC-Nexus.</p>
          <p><strong>Action:</strong> ${escapeHtml(target.title)}</p>
          <p><strong>Meeting:</strong> ${escapeHtml(target.meeting_title)}</p>
          <p><strong>Due date:</strong> ${escapeHtml(target.due_date)}</p>
          <p><strong>Threshold:</strong> ${escapeHtml(threshold.replace(/_/g, ' '))}</p>
          <p>Please update the action item status in the Board module.</p>
        `,
      })
      sent++
    } catch (err) {
      console.error('[sendBoardActionEscalationEmails] send error', err)
      skipped++
    }
  }

  return { sent, skipped }
}
