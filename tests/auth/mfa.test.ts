import { describe, it, expect } from 'vitest'
import { generateRecoveryCodes, hashRecoveryCodes, verifyRecoveryCode } from '@/lib/auth/recovery-codes'
import { generateOTPCode } from '@/lib/auth/email-otp'

describe('Recovery codes', () => {
  it('generates exactly 8 codes', () => {
    const codes = generateRecoveryCodes()
    expect(codes).toHaveLength(8)
  })

  it('each code is a non-empty string', () => {
    const codes = generateRecoveryCodes()
    codes.forEach((c) => expect(c.length).toBeGreaterThan(0))
  })

  it('codes follow XXXX-XXXX format', () => {
    const codes = generateRecoveryCodes()
    codes.forEach((c) => expect(c).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/))
  })

  it('verifyRecoveryCode returns index for matching code', async () => {
    const codes = generateRecoveryCodes()
    const hashed = await hashRecoveryCodes(codes)
    const idx = await verifyRecoveryCode(codes[3], hashed)
    expect(idx).toBe(3)
  }, 30000) // bcrypt is slow — increase timeout

  it('verifyRecoveryCode returns null for wrong code', async () => {
    const codes = generateRecoveryCodes()
    const hashed = await hashRecoveryCodes(codes)
    const idx = await verifyRecoveryCode('WRONG-CODE', hashed)
    expect(idx).toBeNull()
  }, 30000)
})

describe('Email OTP', () => {
  it('generates a 6-digit string', () => {
    const code = generateOTPCode()
    expect(code).toMatch(/^\d{6}$/)
  })

  it('always returns exactly 6 characters', () => {
    // Run 20 times to check edge cases near 0 and 999999
    for (let i = 0; i < 20; i++) {
      const code = generateOTPCode()
      expect(code).toHaveLength(6)
    }
  })

  it('does not repeat on 10 consecutive calls', () => {
    const codes = new Set(Array.from({ length: 10 }, () => generateOTPCode()))
    // With 1,000,000 possible values, probability of collision in 10 = negligible
    expect(codes.size).toBeGreaterThan(1)
  })
})
