// lib/schemas/risk.ts
// Zod v3 schemas for risk domain forms and inline actions.
import { z } from 'zod'

const numericRiskField = (label: string) =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.number({ invalid_type_error: `${label} must be a number.` }),
  )

const riskScaleField = (label: string) =>
  numericRiskField(label).refine((val) => val >= 1 && val <= 5, {
    message: `${label} must be between 1 and 5.`,
  })

const optionalRiskScaleField = (label: string) =>
  z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.coerce.number({ invalid_type_error: `${label} must be a number.` }).min(1).max(5).nullable(),
  )

const baseRiskSchema = z.object({
    objective_id: z.string().uuid('Objective is required.'),
    title: z.string().min(1, 'Title is required.'),
    description: z.string().optional(),
    category: z.enum(['strategic', 'operational', 'financial', 'compliance', 'reputational', 'technology']),
    owner_id: z.string().uuid('Owner must be a valid user.'),
    status: z.enum(['open', 'mitigated', 'accepted', 'closed', 'escalated']).default('open'),
    inherent_likelihood: riskScaleField('Inherent likelihood'),
    inherent_impact: riskScaleField('Inherent impact'),
    residual_likelihood: optionalRiskScaleField('Residual likelihood').optional(),
    residual_impact: optionalRiskScaleField('Residual impact').optional(),
    mitigating_controls: z.string().optional(),
  })

export const riskSchema = baseRiskSchema
  .refine(
    (data) => {
      const hasResidualLikelihood = data.residual_likelihood !== undefined && data.residual_likelihood !== null
      const hasResidualImpact = data.residual_impact !== undefined && data.residual_impact !== null
      return hasResidualLikelihood === hasResidualImpact
    },
    {
      message: 'Residual likelihood and residual impact must be set together.',
      path: ['residual_likelihood'],
    },
  )

export const riskUpdateSchema = baseRiskSchema.partial().extend({
  objective_id: z.string().uuid('Objective is required.'),
  title: z.string().min(1, 'Title is required.'),
  category: z.enum(['strategic', 'operational', 'financial', 'compliance', 'reputational', 'technology']),
  owner_id: z.string().uuid('Owner must be a valid user.'),
  inherent_likelihood: riskScaleField('Inherent likelihood'),
  inherent_impact: riskScaleField('Inherent impact'),
})

export const riskTreatmentSchema = z.object({
  title: z.string().min(1, 'Treatment title is required.'),
  description: z.string().optional(),
  owner_id: z.string().uuid('Owner must be a valid user.'),
  due_date: z.string().min(1, 'Due date is required.'),
  status: z.enum(['planned', 'in_progress', 'completed', 'overdue', 'cancelled']).default('planned'),
})

export const inlineTreatmentStatusSchema = z.object({
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']),
})

export const residualUpdateSchema = z.object({
  residual_likelihood: optionalRiskScaleField('Residual likelihood'),
  residual_impact: optionalRiskScaleField('Residual impact'),
})

export type RiskInput = z.infer<typeof riskSchema>
export type RiskUpdateInput = z.infer<typeof riskUpdateSchema>
export type RiskTreatmentInput = z.infer<typeof riskTreatmentSchema>
export type InlineTreatmentStatusInput = z.infer<typeof inlineTreatmentStatusSchema>
export type ResidualUpdateInput = z.infer<typeof residualUpdateSchema>
