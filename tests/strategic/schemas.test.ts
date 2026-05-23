import { describe, it, expect } from 'vitest'
import { objectiveSchema, kpiSchema, kpiReadingSchema } from '@/lib/schemas/strategic'

// A valid UUID for tests
const VALID_UUID = '00000000-0000-0000-0000-000000000001'

describe('objectiveSchema', () => {
  describe('valid inputs', () => {
    it('passes when only nds2_pillar is provided (no institutional_goal)', () => {
      const result = objectiveSchema.safeParse({
        title: 'Increase GDP growth rate',
        nds2_pillar: 'social_development',
        status: 'draft',
        owner_id: VALID_UUID,
      })
      expect(result.success).toBe(true)
    })

    it('passes when only institutional_goal is provided (no nds2_pillar)', () => {
      const result = objectiveSchema.safeParse({
        title: 'Improve operational efficiency',
        institutional_goal: 'My institutional 5-year goal',
        status: 'draft',
        owner_id: VALID_UUID,
      })
      expect(result.success).toBe(true)
    })

    it('passes when both nds2_pillar and institutional_goal are provided', () => {
      const result = objectiveSchema.safeParse({
        title: 'Economic growth objective',
        nds2_pillar: 'economic_transformation',
        institutional_goal: 'Double export revenue by 2030',
        status: 'active',
        owner_id: VALID_UUID,
      })
      expect(result.success).toBe(true)
    })

    it('passes with all optional fields provided', () => {
      const result = objectiveSchema.safeParse({
        title: 'Full objective',
        description: 'Detailed description',
        nds2_pillar: 'governance_and_institutions',
        institutional_goal: 'Strengthen oversight mechanisms',
        status: 'active',
        owner_id: VALID_UUID,
        start_date: '2026-01-01',
        target_date: '2026-12-31',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('invalid inputs — refine rule', () => {
    it('fails when both nds2_pillar and institutional_goal are absent', () => {
      const result = objectiveSchema.safeParse({
        title: 'Objective without alignment',
        status: 'draft',
        owner_id: VALID_UUID,
      })
      expect(result.success).toBe(false)
      // The error path should point to nds2_pillar for FormMessage rendering
      const paths = result.error?.issues.map((issue) => issue.path).flat()
      expect(paths).toContain('nds2_pillar')
    })

    it('fails when institutional_goal is provided but is empty string', () => {
      const result = objectiveSchema.safeParse({
        title: 'Objective with blank goal',
        institutional_goal: '',
        status: 'draft',
        owner_id: VALID_UUID,
      })
      expect(result.success).toBe(false)
    })

    it('fails when institutional_goal is provided but is whitespace only', () => {
      const result = objectiveSchema.safeParse({
        title: 'Objective with whitespace goal',
        institutional_goal: '   ',
        status: 'draft',
        owner_id: VALID_UUID,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('field-level validation', () => {
    it('fails when title is empty', () => {
      const result = objectiveSchema.safeParse({
        title: '',
        nds2_pillar: 'social_development',
        status: 'draft',
        owner_id: VALID_UUID,
      })
      expect(result.success).toBe(false)
    })

    it('fails when owner_id is not a valid UUID', () => {
      const result = objectiveSchema.safeParse({
        title: 'Valid title',
        nds2_pillar: 'social_development',
        status: 'draft',
        owner_id: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
    })

    it('fails when status is an invalid value', () => {
      const result = objectiveSchema.safeParse({
        title: 'Valid title',
        nds2_pillar: 'social_development',
        status: 'invalid_status',
        owner_id: VALID_UUID,
      })
      expect(result.success).toBe(false)
    })

    it('fails when nds2_pillar is an invalid enum value', () => {
      const result = objectiveSchema.safeParse({
        title: 'Valid title',
        nds2_pillar: 'not_a_real_pillar',
        status: 'draft',
        owner_id: VALID_UUID,
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('kpiSchema', () => {
  describe('valid inputs', () => {
    it('passes with all required fields as numbers', () => {
      const result = kpiSchema.safeParse({
        objective_id: VALID_UUID,
        title: 'Revenue Growth Rate',
        owner_id: VALID_UUID,
        baseline_value: 0,
        target_value: 100,
        unit_of_measure: '%',
        reporting_frequency: 'quarterly',
      })
      expect(result.success).toBe(true)
    })

    it('passes with string numerics — coerces strings to numbers (D-30)', () => {
      const result = kpiSchema.safeParse({
        objective_id: VALID_UUID,
        title: 'Revenue Growth Rate',
        owner_id: VALID_UUID,
        baseline_value: '0',
        target_value: '100',
        unit_of_measure: '%',
        reporting_frequency: 'quarterly',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.baseline_value).toBe('number')
        expect(typeof result.data.target_value).toBe('number')
      }
    })

    it('accepts all valid reporting_frequency values', () => {
      const frequencies = ['monthly', 'quarterly', 'semi_annual', 'annual'] as const
      for (const freq of frequencies) {
        const result = kpiSchema.safeParse({
          objective_id: VALID_UUID,
          title: 'KPI',
          owner_id: VALID_UUID,
          baseline_value: 0,
          target_value: 50,
          unit_of_measure: 'units',
          reporting_frequency: freq,
        })
        expect(result.success).toBe(true)
      }
    })
  })

  describe('invalid inputs', () => {
    it('fails when target_value is empty string (coercion produces NaN)', () => {
      const result = kpiSchema.safeParse({
        objective_id: VALID_UUID,
        title: 'KPI',
        owner_id: VALID_UUID,
        baseline_value: 0,
        target_value: '',
        unit_of_measure: '%',
        reporting_frequency: 'quarterly',
      })
      expect(result.success).toBe(false)
      // Should have a human-readable error message
      const messages = result.error?.issues.map((i) => i.message)
      expect(messages?.some((m) => m.toLowerCase().includes('number'))).toBe(true)
    })

    it('fails when title is empty', () => {
      const result = kpiSchema.safeParse({
        objective_id: VALID_UUID,
        title: '',
        owner_id: VALID_UUID,
        baseline_value: 0,
        target_value: 100,
        unit_of_measure: '%',
        reporting_frequency: 'quarterly',
      })
      expect(result.success).toBe(false)
    })

    it('fails when objective_id is not a valid UUID', () => {
      const result = kpiSchema.safeParse({
        objective_id: 'not-a-uuid',
        title: 'KPI',
        owner_id: VALID_UUID,
        baseline_value: 0,
        target_value: 100,
        unit_of_measure: '%',
        reporting_frequency: 'quarterly',
      })
      expect(result.success).toBe(false)
    })

    it('fails when reporting_frequency is invalid', () => {
      const result = kpiSchema.safeParse({
        objective_id: VALID_UUID,
        title: 'KPI',
        owner_id: VALID_UUID,
        baseline_value: 0,
        target_value: 100,
        unit_of_measure: '%',
        reporting_frequency: 'weekly',
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('kpiReadingSchema', () => {
  describe('valid inputs', () => {
    it('passes with a valid quarterly period (YYYY-Q#)', () => {
      const result = kpiReadingSchema.safeParse({
        reporting_period: '2026-Q1',
        actual_value: 80,
      })
      expect(result.success).toBe(true)
    })

    it('passes with a valid monthly period (YYYY-M##)', () => {
      const result = kpiReadingSchema.safeParse({
        reporting_period: '2026-M03',
        actual_value: 80,
      })
      expect(result.success).toBe(true)
    })

    it('passes with a valid semi-annual period (YYYY-H#)', () => {
      const result = kpiReadingSchema.safeParse({
        reporting_period: '2026-H1',
        actual_value: 80,
      })
      expect(result.success).toBe(true)
    })

    it('passes with a valid annual period (YYYY)', () => {
      const result = kpiReadingSchema.safeParse({
        reporting_period: '2026',
        actual_value: 80,
      })
      expect(result.success).toBe(true)
    })

    it('passes with optional notes field', () => {
      const result = kpiReadingSchema.safeParse({
        reporting_period: '2026-Q2',
        actual_value: 92.5,
        notes: 'Exceeded target due to improved efficiency',
      })
      expect(result.success).toBe(true)
    })

    it('passes when actual_value is provided as a string (coercion)', () => {
      const result = kpiReadingSchema.safeParse({
        reporting_period: '2026-Q1',
        actual_value: '75',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.actual_value).toBe('number')
      }
    })
  })

  describe('invalid inputs', () => {
    it('fails when reporting_period is empty string', () => {
      const result = kpiReadingSchema.safeParse({
        reporting_period: '',
        actual_value: 80,
      })
      expect(result.success).toBe(false)
    })

    it('fails when actual_value is empty string (coercion produces NaN)', () => {
      const result = kpiReadingSchema.safeParse({
        reporting_period: '2026-Q1',
        actual_value: '',
      })
      expect(result.success).toBe(false)
    })

    it('fails when reporting_period is missing', () => {
      const result = kpiReadingSchema.safeParse({
        actual_value: 80,
      })
      expect(result.success).toBe(false)
    })
  })
})
