'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  riskSchema,
  riskUpdateSchema,
  riskTreatmentSchema,
  inlineTreatmentStatusSchema,
  residualUpdateSchema,
  type RiskInput,
  type RiskUpdateInput,
  type RiskTreatmentInput,
  type InlineTreatmentStatusInput,
  type ResidualUpdateInput,
} from '@/lib/schemas/risk'
import { isTreatmentOverdue } from '@/lib/risk/risk-utils'
import type { AppRole } from '@/types/auth'
import type { TreatmentStatus } from '@/types/risk'

const WRITE_ROLES: AppRole[] = ['admin', 'ceo', 'risk-officer']
const GENERIC_ERROR = 'An unexpected error occurred. If this persists, contact your administrator.'

type ActionResult = { error: string } | { data: { id: string } }

function canWriteRisk(activeRole: string | undefined): activeRole is AppRole {
  return !!activeRole && WRITE_ROLES.includes(activeRole as AppRole)
}

async function getWriteContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized.' as const }
  }

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role
  const institutionId = appMeta?.institution_id

  if (!canWriteRisk(activeRole)) {
    return { error: 'You do not have permission to modify risks.' as const }
  }

  if (!institutionId) {
    return { error: 'Institution context is missing from your token.' as const }
  }

  return { supabase, user, institutionId, activeRole }
}

async function sendOverdueEscalationEmail(params: {
  ownerId: string | null
  institutionId: string
  treatmentTitle: string
  riskTitle: string
}) {
  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL

  if (!resendKey || !fromEmail || !params.ownerId) return

  const admin = createAdminClient()

  const [ownerInfo, ceoUsers, ownerProfile] = await Promise.all([
    admin.auth.admin.getUserById(params.ownerId),
    admin
      .from('user_roles')
      .select('user_id')
      .eq('institution_id', params.institutionId)
      .eq('role_name', 'ceo'),
    admin
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', params.ownerId)
      .single(),
  ])

  const managerUserIds = (ceoUsers.data ?? []).map((row) => row.user_id)

  const managerEmailResults = await Promise.all(
    managerUserIds.map(async (userId) => {
      const res = await admin.auth.admin.getUserById(userId)
      return res.data.user?.email ?? null
    }),
  )

  const recipientSet = new Set<string>()

  const ownerEmail = ownerInfo.data.user?.email
  if (ownerEmail) recipientSet.add(ownerEmail)

  managerEmailResults
    .filter((email): email is string => !!email)
    .forEach((email) => recipientSet.add(email))

  if (recipientSet.size === 0) return

  const ownerName = ownerProfile.data
    ? [ownerProfile.data.first_name, ownerProfile.data.last_name].filter(Boolean).join(' ')
    : 'Risk Owner'

  const resend = new Resend(resendKey)
  const recipients = Array.from(recipientSet)

  await resend.emails.send({
    from: fromEmail,
    to: recipients,
    subject: `Overdue treatment escalation: ${params.treatmentTitle}`,
    html: `
      <p>Hello ${ownerName || 'Team'},</p>
      <p>A treatment action is now overdue.</p>
      <ul>
        <li><strong>Risk:</strong> ${params.riskTitle}</li>
        <li><strong>Treatment:</strong> ${params.treatmentTitle}</li>
      </ul>
      <p>Please review and update the treatment status in GRC-Nexus.</p>
    `,
  })
}

function revalidateRiskPaths(riskId?: string) {
  revalidatePath('/risk')
  revalidatePath('/risk/register')
  revalidatePath('/risk/heatmap')
  revalidatePath('/risk/new')

  if (riskId) {
    revalidatePath(`/risk/${riskId}`)
    revalidatePath(`/risk/${riskId}/edit`)
    revalidatePath(`/risk/${riskId}/treatments/new`)
  }
}

export async function createRisk(values: RiskInput): Promise<ActionResult> {
  const parsed = riskSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const context = await getWriteContext()
  if ('error' in context) return { error: context.error ?? GENERIC_ERROR }

  try {
    const { data, error } = await context.supabase
      .from('risks')
      .insert({
        ...parsed.data,
        institution_id: context.institutionId,
        created_by: context.user.id,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[createRisk] DB error:', error)
      return { error: GENERIC_ERROR }
    }

    revalidateRiskPaths((data as { id: string }).id)

    return { data: { id: (data as { id: string }).id } }
  } catch (err) {
    console.error('[createRisk] Unexpected error:', err)
    return { error: GENERIC_ERROR }
  }
}

export async function updateRisk(id: string, values: RiskUpdateInput): Promise<ActionResult> {
  const parsed = riskUpdateSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const context = await getWriteContext()
  if ('error' in context) return { error: context.error ?? GENERIC_ERROR }

  try {
    const { data, error } = await context.supabase
      .from('risks')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id')
      .single()

    if (error) {
      console.error('[updateRisk] DB error:', error)
      return { error: GENERIC_ERROR }
    }

    revalidateRiskPaths(id)

    return { data: { id: (data as { id: string }).id } }
  } catch (err) {
    console.error('[updateRisk] Unexpected error:', err)
    return { error: GENERIC_ERROR }
  }
}

export async function createRiskTreatment(riskId: string, values: RiskTreatmentInput): Promise<ActionResult> {
  const parsed = riskTreatmentSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const context = await getWriteContext()
  if ('error' in context) return { error: context.error ?? GENERIC_ERROR }

  try {
    const { data: risk, error: riskError } = await context.supabase
      .from('risks')
      .select('id, institution_id')
      .eq('id', riskId)
      .single()

    if (riskError || !risk) {
      return { error: 'Risk not found.' }
    }

    const { data, error } = await context.supabase
      .from('risk_treatments')
      .insert({
        ...parsed.data,
        risk_id: riskId,
        institution_id: context.institutionId,
        created_by: context.user.id,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[createRiskTreatment] DB error:', error)
      return { error: GENERIC_ERROR }
    }

    revalidateRiskPaths(riskId)

    return { data: { id: (data as { id: string }).id } }
  } catch (err) {
    console.error('[createRiskTreatment] Unexpected error:', err)
    return { error: GENERIC_ERROR }
  }
}

export async function updateRiskTreatmentStatus(
  treatmentId: string,
  values: InlineTreatmentStatusInput,
): Promise<ActionResult> {
  const parsed = inlineTreatmentStatusSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid status.' }
  }

  const context = await getWriteContext()
  if ('error' in context) return { error: context.error ?? GENERIC_ERROR }

  try {
    const { data: treatment, error: treatmentError } = await context.supabase
      .from('risk_treatments')
      .select('id, risk_id, owner_id, title, due_date, status, institution_id')
      .eq('id', treatmentId)
      .single()

    if (treatmentError || !treatment) {
      return { error: 'Treatment not found.' }
    }

    const treatmentRow = treatment as {
      risk_id: string
      owner_id: string | null
      title: string
      due_date: string
      status: TreatmentStatus
      institution_id: string
    }

    const nextStatus = isTreatmentOverdue(parsed.data.status, treatmentRow.due_date)
      ? 'overdue'
      : parsed.data.status

    const { data, error } = await context.supabase
      .from('risk_treatments')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', treatmentId)
      .select('id')
      .single()

    if (error) {
      console.error('[updateRiskTreatmentStatus] DB error:', error)
      return { error: GENERIC_ERROR }
    }

    const transitionedToOverdue = treatmentRow.status !== 'overdue' && nextStatus === 'overdue'

    if (transitionedToOverdue) {
      try {
        const { data: riskTitleData } = await context.supabase
          .from('risks')
          .select('title')
          .eq('id', treatmentRow.risk_id)
          .single()

        const riskTitle = (riskTitleData as { title?: string } | null)?.title ?? 'Untitled Risk'

        await sendOverdueEscalationEmail({
          ownerId: treatmentRow.owner_id,
          institutionId: treatmentRow.institution_id,
          treatmentTitle: treatmentRow.title,
          riskTitle,
        })
      } catch (emailErr) {
        console.error('[updateRiskTreatmentStatus] Non-fatal email error:', emailErr)
      }
    }

    revalidateRiskPaths(treatmentRow.risk_id)

    return { data: { id: (data as { id: string }).id } }
  } catch (err) {
    console.error('[updateRiskTreatmentStatus] Unexpected error:', err)
    return { error: GENERIC_ERROR }
  }
}

export async function updateResidualRisk(
  riskId: string,
  values: ResidualUpdateInput,
): Promise<ActionResult> {
  const parsed = residualUpdateSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const context = await getWriteContext()
  if ('error' in context) return { error: context.error ?? GENERIC_ERROR }

  try {
    const { data, error } = await context.supabase
      .from('risks')
      .update({
        residual_likelihood: parsed.data.residual_likelihood,
        residual_impact: parsed.data.residual_impact,
        updated_at: new Date().toISOString(),
      })
      .eq('id', riskId)
      .select('id')
      .single()

    if (error) {
      console.error('[updateResidualRisk] DB error:', error)
      return { error: GENERIC_ERROR }
    }

    revalidateRiskPaths(riskId)

    return { data: { id: (data as { id: string }).id } }
  } catch (err) {
    console.error('[updateResidualRisk] Unexpected error:', err)
    return { error: GENERIC_ERROR }
  }
}

export async function bulkMarkOverdueTreatments(): Promise<{ error?: string; data?: { updated: number } }> {
  const context = await getWriteContext()
  if ('error' in context) return { error: context.error ?? GENERIC_ERROR }

  try {
    const today = new Date().toISOString().slice(0, 10)

    const { data: overdueCandidates, error: listError } = await context.supabase
      .from('risk_treatments')
      .select('id, due_date, status')
      .lt('due_date', today)
      .in('status', ['planned', 'in_progress'])

    if (listError) {
      console.error('[bulkMarkOverdueTreatments] DB list error:', listError)
      return { error: GENERIC_ERROR }
    }

    const ids = (overdueCandidates ?? []).map((row) => row.id)
    if (ids.length === 0) return { data: { updated: 0 } }

    const { error } = await context.supabase
      .from('risk_treatments')
      .update({ status: 'overdue', updated_at: new Date().toISOString() })
      .in('id', ids)

    if (error) {
      console.error('[bulkMarkOverdueTreatments] DB update error:', error)
      return { error: GENERIC_ERROR }
    }

    revalidateRiskPaths()

    return { data: { updated: ids.length } }
  } catch (err) {
    console.error('[bulkMarkOverdueTreatments] Unexpected error:', err)
    return { error: GENERIC_ERROR }
  }
}
