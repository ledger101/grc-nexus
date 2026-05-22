// lib/email/send-role-notification.ts
// Resend integration for role assignment emails using React Email template.
// SERVER-SIDE ONLY — never import in client components.
// Gracefully degrades when RESEND_API_KEY is not set (dev environment).
import { Resend } from 'resend'
import { renderAsync } from '@react-email/components'
import { RoleAssignmentEmail } from './templates/RoleAssignmentEmail'

export async function sendRoleAssignmentEmail(params: {
  to: string
  name: string
  role: string
  institutionName: string
}) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey || resendKey === 're_xxxx' || resendKey === 're_test') {
    console.warn('[email] RESEND_API_KEY not configured — skipping role assignment email to', params.to)
    return
  }

  const resend = new Resend(resendKey)

  const html = await renderAsync(
    RoleAssignmentEmail({
      name: params.name,
      role: params.role,
      institutionName: params.institutionName,
    })
  )

  const { error } = await resend.emails.send({
    from: 'GRC-Nexus <noreply@grcnexus.gov.zw>',
    to: [params.to],
    subject: 'Your GRC-Nexus role has been updated',
    html,
  })

  if (error) {
    throw new Error(`Resend email error: ${error.message}`)
  }
}
