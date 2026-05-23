import { describe, it, expect } from 'vitest'
import { calculateRiskScore, getRiskSeverity } from '@/lib/risk/risk-utils'

describe('register filter and score derivation', () => {
  it('derives severity from inherent matrix score', () => {
    const score = calculateRiskScore(3, 5)
    expect(score).toBe(15)
    expect(getRiskSeverity(score)).toBe('high')
  })
}
)
