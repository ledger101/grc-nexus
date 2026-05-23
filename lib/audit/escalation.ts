import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuditEscalationThreshold } from '@/lib/audit/audit-utils'
import type { AuditEscalationTarget } from '@/lib/audit/queries'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendAuditEscalationEmails(
  findings: AuditEscalationTarget[],
): Promise<{ sent: number; skipped: number }> {
  const admin = createAdminClient()
  let sent = 0
  let skipped = 0

  for (const finding of findings) {
    const threshold = getAuditEscalationThreshold(finding.due_date)
    if (!threshold) {
      skipped++
      continue
    }

    const recipients = new Set<string>()

    if (finding.remediation_owner_id) {
      const { data: owner } = await admin.auth.admin.getUserById(finding.remediation_owner_id)
      if (owner?.user?.email) {
        recipients.add(owner.user.email)
      }
    }

    const { data: auditProfiles } = await admin
      .from('user_profiles')
      .select('id')
      .eq('institution_id', finding.institution_id)
      .eq('active_role', 'audit-officer')

    for (const profile of auditProfiles ?? []) {
      const { data: auditUser } = await admin.auth.admin.getUserById((profile as { id: string }).id)
      if (auditUser?.user?.email) {
        recipients.add(auditUser.user.email)
      }
    }

    if (recipients.size === 0) {
      skipped++
      continue
    }

    const subjectMap: Record<typeof threshold, string> = {
      due_today: `URGENT: Audit finding due today — ${finding.title}`,
      critical_overdue: `CRITICAL: Audit finding 7+ days overdue — ${finding.title}`,
    }

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@grc-nexus.gov.zw',
        to: Array.from(recipients),
        subject: subjectMap[threshold],
        html: `
          <p>This is an automated internal audit escalation from GRC-Nexus.</p>
          <p><strong>Finding:</strong> ${escapeHtml(finding.title)}</p>
          <p><strong>Due Date:</strong> ${escapeHtml(finding.due_date)}</p>
          <p><strong>Status:</strong> ${escapeHtml(threshold.replace(/_/g, ' '))}</p>
          <p>Please log in to GRC-Nexus to update remediation status and attach closure evidence.</p>
        `,
      })
      sent++
    } catch (error) {
      console.error('[sendAuditEscalationEmails] Email send error:', error)
      skipped++
    }
  }

  return { sent, skipped }
}
