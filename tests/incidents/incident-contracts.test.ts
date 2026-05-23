import { describe, it, expect } from 'vitest'
import { incidentIntakeSchema, incidentCloseSchema } from '@/lib/schemas/incidents'
import { isValidIncidentStatusTransition } from '@/lib/incidents/incident-utils'

describe('Incident Contracts', () => {
  describe('Test 1: incident category/status enums validate legal values and reject unknown values', () => {
    it('accepts valid categories', () => {
      const validCategories = ['fraud', 'misconduct', 'safety', 'cyber', 'governance', 'other']
      for (const category of validCategories) {
        const result = incidentIntakeSchema.safeParse({
          title: 'Valid Title Here',
          description: 'This is a long description with more than ten characters.',
          category,
          is_anonymous: true,
        })
        expect(result.success).toBe(true)
      }
    })

    it('rejects invalid categories', () => {
      const result = incidentIntakeSchema.safeParse({
        title: 'Valid Title Here',
        description: 'This is a long description with more than ten characters.',
        category: 'invalid_category_name',
        is_anonymous: true,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('Test 2: close-case schema rejects empty resolution summaries', () => {
    it('accepts valid resolution summaries', () => {
      const result = incidentCloseSchema.safeParse({
        resolution_summary: 'This case has been fully resolved with remediation.',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty resolution summaries', () => {
      const result = incidentCloseSchema.safeParse({
        resolution_summary: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects whitespace-only resolution summaries', () => {
      const result = incidentCloseSchema.safeParse({
        resolution_summary: '       ',
      })
      expect(result.success).toBe(false)
    })

    it('rejects resolution summaries shorter than 10 characters', () => {
      const result = incidentCloseSchema.safeParse({
        resolution_summary: 'Too short',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('Test 3: status transition guard enforces allowed pathways', () => {
    it('allows valid transitions from new', () => {
      expect(isValidIncidentStatusTransition('new', 'assigned')).toBe(true)
      expect(isValidIncidentStatusTransition('new', 'closed')).toBe(true)
      expect(isValidIncidentStatusTransition('new', 'new')).toBe(true)
    })

    it('rejects invalid transitions from new', () => {
      expect(isValidIncidentStatusTransition('new', 'in_investigation')).toBe(false)
      expect(isValidIncidentStatusTransition('new', 'escalated')).toBe(false)
    })

    it('allows valid transitions from assigned', () => {
      expect(isValidIncidentStatusTransition('assigned', 'in_investigation')).toBe(true)
      expect(isValidIncidentStatusTransition('assigned', 'closed')).toBe(true)
      expect(isValidIncidentStatusTransition('assigned', 'assigned')).toBe(true)
    })

    it('rejects invalid transitions from assigned', () => {
      expect(isValidIncidentStatusTransition('assigned', 'new')).toBe(false)
      expect(isValidIncidentStatusTransition('assigned', 'escalated')).toBe(false)
    })

    it('allows valid transitions from in_investigation', () => {
      expect(isValidIncidentStatusTransition('in_investigation', 'escalated')).toBe(true)
      expect(isValidIncidentStatusTransition('in_investigation', 'closed')).toBe(true)
      expect(isValidIncidentStatusTransition('in_investigation', 'assigned')).toBe(true)
      expect(isValidIncidentStatusTransition('in_investigation', 'in_investigation')).toBe(true)
    })

    it('rejects invalid transitions from in_investigation', () => {
      expect(isValidIncidentStatusTransition('in_investigation', 'new')).toBe(false)
    })

    it('allows valid transitions from escalated', () => {
      expect(isValidIncidentStatusTransition('escalated', 'closed')).toBe(true)
      expect(isValidIncidentStatusTransition('escalated', 'in_investigation')).toBe(true)
      expect(isValidIncidentStatusTransition('escalated', 'escalated')).toBe(true)
    })

    it('rejects invalid transitions from escalated', () => {
      expect(isValidIncidentStatusTransition('escalated', 'new')).toBe(false)
      expect(isValidIncidentStatusTransition('escalated', 'assigned')).toBe(false)
    })

    it('rejects all transitions from closed', () => {
      expect(isValidIncidentStatusTransition('closed', 'new')).toBe(false)
      expect(isValidIncidentStatusTransition('closed', 'assigned')).toBe(false)
      expect(isValidIncidentStatusTransition('closed', 'in_investigation')).toBe(false)
      expect(isValidIncidentStatusTransition('closed', 'escalated')).toBe(false)
    })
  })
})
