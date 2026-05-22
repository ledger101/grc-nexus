import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema, mfaCodeSchema, backupCodeSchema } from '@/lib/schemas/auth'

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'anything' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'anything' })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema — password policy', () => {
  it('rejects password shorter than 12 characters', () => {
    const result = registerSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'Short1!',
      confirmPassword: 'Short1!',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password without uppercase', () => {
    const result = registerSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'alllowercase1!x',
      confirmPassword: 'alllowercase1!x',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password without number', () => {
    const result = registerSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'NoNumbersHere!abc',
      confirmPassword: 'NoNumbersHere!abc',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password without symbol', () => {
    const result = registerSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'NoSymbolsHere123',
      confirmPassword: 'NoSymbolsHere123',
    })
    expect(result.success).toBe(false)
  })

  it('accepts a valid password meeting all requirements', () => {
    const result = registerSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'ValidPass1!xyz',
      confirmPassword: 'ValidPass1!xyz',
    })
    expect(result.success).toBe(true)
  })

  it('rejects when passwords do not match', () => {
    const result = registerSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'ValidPass1!xyz',
      confirmPassword: 'DifferentPass1!',
    })
    expect(result.success).toBe(false)
  })
})

describe('mfaCodeSchema', () => {
  it('accepts 6-digit code', () => {
    expect(mfaCodeSchema.safeParse({ code: '123456' }).success).toBe(true)
  })

  it('rejects non-digit code', () => {
    expect(mfaCodeSchema.safeParse({ code: '12345a' }).success).toBe(false)
  })

  it('rejects code shorter than 6 digits', () => {
    expect(mfaCodeSchema.safeParse({ code: '12345' }).success).toBe(false)
  })
})

describe('backupCodeSchema', () => {
  it('accepts an 8+ character backup code', () => {
    expect(backupCodeSchema.safeParse({ code: 'abcd1234' }).success).toBe(true)
  })

  it('rejects a code shorter than 8 characters', () => {
    expect(backupCodeSchema.safeParse({ code: 'short' }).success).toBe(false)
  })
})
