import { describe, it, expect } from 'vitest'
import {
  calculateRiskScore,
  getRiskSeverity,
  isTreatmentOverdue,
} from '@/lib/risk/risk-utils'

describe('risk-utils score', () => {
  it('returns 1 for 1x1', () => {
    expect(calculateRiskScore(1, 1)).toBe(1)
  })

  it('returns 25 for 5x5', () => {
    expect(calculateRiskScore(5, 5)).toBe(25)
  })
})

describe('risk-utils severity', () => {
  it('maps 1..4 to low', () => {
    expect(getRiskSeverity(4)).toBe('low')
  })

  it('maps 5..9 to medium', () => {
    expect(getRiskSeverity(5)).toBe('medium')
    expect(getRiskSeverity(9)).toBe('medium')
  })

  it('maps 10..15 to high', () => {
    expect(getRiskSeverity(10)).toBe('high')
    expect(getRiskSeverity(15)).toBe('high')
  })

  it('maps 16..25 to critical', () => {
    expect(getRiskSeverity(16)).toBe('critical')
    expect(getRiskSeverity(25)).toBe('critical')
  })
})

describe('risk-utils overdue', () => {
  it('returns false for completed and cancelled', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    expect(isTreatmentOverdue('completed', yesterday)).toBe(false)
    expect(isTreatmentOverdue('cancelled', yesterday)).toBe(false)
  })

  it('returns true for past due planned treatment', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    expect(isTreatmentOverdue('planned', yesterday)).toBe(true)
  })

  it('returns false for future in-progress treatment', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    expect(isTreatmentOverdue('in_progress', tomorrow)).toBe(false)
  })
}
)
