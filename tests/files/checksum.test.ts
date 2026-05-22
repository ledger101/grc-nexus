import { describe, it, expect } from 'vitest'
import { computeSHA256, verifyChecksum } from '@/lib/files/checksum'

describe('SHA-256 checksum', () => {
  it('returns a 64-character hex string', () => {
    const hash = computeSHA256(Buffer.from('test data'))
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })

  it('returns the same hash for the same input', () => {
    const data = Buffer.from('governance document content')
    const h1 = computeSHA256(data)
    const h2 = computeSHA256(data)
    expect(h1).toBe(h2)
  })

  it('returns different hashes for different inputs', () => {
    const h1 = computeSHA256(Buffer.from('content A'))
    const h2 = computeSHA256(Buffer.from('content B'))
    expect(h1).not.toBe(h2)
  })

  it('verifyChecksum returns true for matching data', () => {
    const data = Buffer.from('evidence file')
    const hash = computeSHA256(data)
    expect(verifyChecksum(data, hash)).toBe(true)
  })

  it('verifyChecksum returns false for tampered data', () => {
    const original = Buffer.from('original')
    const hash = computeSHA256(original)
    const tampered = Buffer.from('tampered')
    expect(verifyChecksum(tampered, hash)).toBe(false)
  })

  it('verifyChecksum uses timing-safe comparison (does not throw with invalid hex)', () => {
    // storedHash is not valid hex — should return false, not throw
    expect(() => verifyChecksum(Buffer.from('x'), 'notvalidhex')).not.toThrow()
    expect(verifyChecksum(Buffer.from('x'), 'notvalidhex')).toBe(false)
  })
})
