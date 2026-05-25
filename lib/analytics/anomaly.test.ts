import { describe, it, expect } from 'vitest'
import { mean, stddev, isAnomaly } from '@/lib/analytics/anomaly'

describe('mean', () => {
  it('returns 5 for [2,4,6,8]', () => {
    expect(mean([2, 4, 6, 8])).toBe(5)
  })
  it('returns 10 for [10,10,10]', () => {
    expect(mean([10, 10, 10])).toBe(10)
  })
})

describe('stddev', () => {
  it('returns 0 for identical values', () => {
    expect(stddev([5, 5, 5, 5])).toBe(0)
  })
  it('returns population stddev for [2,4,6,8]', () => {
    expect(stddev([2, 4, 6, 8])).toBeCloseTo(Math.sqrt(5), 5)
  })
})

describe('isAnomaly', () => {
  it('returns true when value exceeds 2σ threshold', () => {
    expect(isAnomaly(20, 5, 2, 2)).toBe(true)
  })
  it('returns false when value is within 2σ threshold', () => {
    expect(isAnomaly(6, 5, 2, 2)).toBe(false)
  })
  it('returns false when stddev is 0 regardless of deviation', () => {
    expect(isAnomaly(99, 5, 0, 2)).toBe(false)
  })
})
