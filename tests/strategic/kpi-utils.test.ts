import { describe, it, expect } from 'vitest'
import { calculateKpiStatus, KPI_ON_TRACK_THRESHOLD, KPI_AT_RISK_THRESHOLD } from '@/lib/strategic/kpi-utils'

describe('calculateKpiStatus', () => {
  describe('on_track', () => {
    it('returns on_track when actual === target (100% of target)', () => {
      expect(calculateKpiStatus(100, 100)).toBe('on_track')
    })

    it('returns on_track when actual is 95% of target (above on_track threshold)', () => {
      expect(calculateKpiStatus(95, 100)).toBe('on_track')
    })

    it('returns on_track when actual is exactly at on_track threshold (90%)', () => {
      // 90/100 = 0.90 which equals KPI_ON_TRACK_THRESHOLD
      expect(calculateKpiStatus(90, 100)).toBe('on_track')
      // Also verify threshold value is as documented
      expect(KPI_ON_TRACK_THRESHOLD).toBe(0.90)
    })

    it('returns on_track when actual > target (overperformed — D-14)', () => {
      // ratio = 110/100 = 1.1 which is > KPI_ON_TRACK_THRESHOLD; no special "overperformed" status
      expect(calculateKpiStatus(110, 100)).toBe('on_track')
    })
  })

  describe('at_risk', () => {
    it('returns at_risk when actual is 89% of target (just below on_track threshold)', () => {
      // 89/100 = 0.89 which is < 0.90 and >= 0.70
      expect(calculateKpiStatus(89, 100)).toBe('at_risk')
    })

    it('returns at_risk when actual is exactly at at_risk threshold (70%)', () => {
      // 70/100 = 0.70 which equals KPI_AT_RISK_THRESHOLD
      expect(calculateKpiStatus(70, 100)).toBe('at_risk')
      // Also verify threshold value is as documented
      expect(KPI_AT_RISK_THRESHOLD).toBe(0.70)
    })
  })

  describe('off_track', () => {
    it('returns off_track when actual is 69% of target (just below at_risk threshold)', () => {
      // 69/100 = 0.69 which is < 0.70
      expect(calculateKpiStatus(69, 100)).toBe('off_track')
    })

    it('returns off_track when actual is 0 (zero actual value)', () => {
      // 0/100 = 0.0 which is < 0.70
      expect(calculateKpiStatus(0, 100)).toBe('off_track')
    })
  })

  describe('no_data', () => {
    it('returns no_data when actual is null (D-15: no readings yet)', () => {
      expect(calculateKpiStatus(null, 100)).toBe('no_data')
    })

    it('returns no_data when actual is undefined (D-15: no readings yet)', () => {
      expect(calculateKpiStatus(undefined, 100)).toBe('no_data')
    })

    it('returns no_data when target is 0 (D-16: prevent division by zero)', () => {
      // target=0 guard must fire before ratio calculation
      expect(calculateKpiStatus(50, 0)).toBe('no_data')
    })

    it('returns no_data when both actual and target are 0 (target=0 guard fires first)', () => {
      // target=0 guard must fire even when actual is also 0
      expect(calculateKpiStatus(0, 0)).toBe('no_data')
    })
  })
})
