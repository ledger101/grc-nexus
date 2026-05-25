import { describe, it, expect } from 'vitest'
import { linearRegression, forecastPoints } from '@/lib/analytics/forecast'

describe('linearRegression', () => {
  it('returns slope=1 and intercept=0 for [0,1,2,3]', () => {
    const result = linearRegression([0, 1, 2, 3])
    expect(result.slope).toBeCloseTo(1, 5)
    expect(result.intercept).toBeCloseTo(0, 5)
  })
  it('returns slope=0 for all-same values', () => {
    const result = linearRegression([5, 5, 5, 5])
    expect(result.slope).toBe(0)
    expect(result.intercept).toBeCloseTo(5, 5)
  })
  it('returns slope=2 for [2,4,6,8]', () => {
    const result = linearRegression([2, 4, 6, 8])
    expect(result.slope).toBeCloseTo(2, 5)
  })
})

describe('forecastPoints', () => {
  it('returns array of length equal to horizon', () => {
    expect(forecastPoints([2, 4, 6, 8], 2).length).toBe(2)
  })
  it('each element has lower and upper keys', () => {
    const result = forecastPoints([2, 4, 6, 8], 2)
    expect(result[0]).toHaveProperty('lower')
    expect(result[0]).toHaveProperty('upper')
  })
  it('lower <= upper on each element', () => {
    const result = forecastPoints([2, 4, 6, 8], 2)
    expect(result[0].lower).toBeLessThanOrEqual(result[0].upper)
  })
  it('zero-residual case: lower and upper both equal 5', () => {
    const result = forecastPoints([5, 5, 5, 5], 2)
    expect(result[0].lower).toBeCloseTo(5, 5)
    expect(result[0].upper).toBeCloseTo(5, 5)
  })
})
