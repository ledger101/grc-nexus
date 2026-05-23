import { describe, it, expect } from 'vitest'
import { calculateRiskScore, getRiskSeverity } from '@/lib/risk/risk-utils'

describe('heatmap matrix orientation helpers', () => {
  it('keeps top-right cell as highest score and critical severity', () => {
    const topRightScore = calculateRiskScore(5, 5)
    expect(topRightScore).toBe(25)
    expect(getRiskSeverity(topRightScore)).toBe('critical')
  })
}
)
