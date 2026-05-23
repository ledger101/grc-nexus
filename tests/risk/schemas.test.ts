import { describe, it, expect } from 'vitest'
import {
  riskSchema,
  riskTreatmentSchema,
  inlineTreatmentStatusSchema,
} from '@/lib/schemas/risk'

const VALID_UUID = '00000000-0000-0000-0000-000000000001'

describe('riskSchema', () => {
  it('accepts valid inherent values in range 1..5', () => {
    const result = riskSchema.safeParse({
      objective_id: VALID_UUID,
      title: 'Fuel price volatility',
      description: 'Commodity market swings',
      category: 'financial',
      owner_id: VALID_UUID,
      status: 'open',
      inherent_likelihood: 5,
      inherent_impact: 4,
      mitigating_controls: 'Monthly hedging committee review',
    })

    expect(result.success).toBe(true)
  })

  it('rejects likelihood outside 1..5', () => {
    const result = riskSchema.safeParse({
      objective_id: VALID_UUID,
      title: 'Cyber breach risk',
      category: 'technology',
      owner_id: VALID_UUID,
      status: 'open',
      inherent_likelihood: 6,
      inherent_impact: 4,
    })

    expect(result.success).toBe(false)
  })

  it('allows nullable residual values when both are unset', () => {
    const result = riskSchema.safeParse({
      objective_id: VALID_UUID,
      title: 'Regulatory non-compliance',
      category: 'compliance',
      owner_id: VALID_UUID,
      status: 'open',
      inherent_likelihood: 3,
      inherent_impact: 3,
      residual_likelihood: null,
      residual_impact: null,
    })

    expect(result.success).toBe(true)
  })

  it('rejects partial residual pair', () => {
    const result = riskSchema.safeParse({
      objective_id: VALID_UUID,
      title: 'Operational outage',
      category: 'operational',
      owner_id: VALID_UUID,
      status: 'open',
      inherent_likelihood: 4,
      inherent_impact: 4,
      residual_likelihood: 2,
      residual_impact: null,
    })

    expect(result.success).toBe(false)
  })
})

describe('riskTreatmentSchema', () => {
  it('requires title, owner, due date, status', () => {
    const result = riskTreatmentSchema.safeParse({
      title: 'Update business continuity plan',
      owner_id: VALID_UUID,
      due_date: '2026-08-31',
      status: 'planned',
    })

    expect(result.success).toBe(true)
  })
})

describe('inlineTreatmentStatusSchema', () => {
  it('accepts editable statuses and excludes overdue', () => {
    expect(inlineTreatmentStatusSchema.safeParse({ status: 'planned' }).success).toBe(true)
    expect(inlineTreatmentStatusSchema.safeParse({ status: 'in_progress' }).success).toBe(true)
    expect(inlineTreatmentStatusSchema.safeParse({ status: 'completed' }).success).toBe(true)
    expect(inlineTreatmentStatusSchema.safeParse({ status: 'cancelled' }).success).toBe(true)
    expect(inlineTreatmentStatusSchema.safeParse({ status: 'overdue' }).success).toBe(false)
  })
}
)
