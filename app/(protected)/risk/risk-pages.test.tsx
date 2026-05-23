import { describe, it, expect } from 'vitest'
import { calculateRiskScore, getRiskSeverity } from '@/lib/risk/risk-utils'

describe('risk page score panel helpers', () => {
  it('computes score and severity boundaries', () => {
    expect(calculateRiskScore(2, 2)).toBe(4)
    expect(getRiskSeverity(4)).toBe('low')
    expect(getRiskSeverity(5)).toBe('medium')
    expect(getRiskSeverity(10)).toBe('high')
    expect(getRiskSeverity(16)).toBe('critical')
  })
}
)
