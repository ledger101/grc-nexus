// lib/files/checksum.ts
// SHA-256 checksum utility for evidence file integrity verification (TRAIL-04).
// Computed server-side on download — never trusted from client.
// SERVER-SIDE ONLY — uses Node.js crypto module.
import crypto from 'crypto'

/**
 * Compute SHA-256 hash of a Buffer or Uint8Array.
 * Returns lowercase hex string (64 characters).
 */
export function computeSHA256(data: Buffer | Uint8Array): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Verify file integrity by comparing computed hash against stored hash.
 * Returns true if the file is unmodified, false if tampered.
 * SECURITY: Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyChecksum(data: Buffer | Uint8Array, storedHash: string): boolean {
  const computed = computeSHA256(data)
  // Length check first (timingSafeEqual requires equal-length buffers)
  if (computed.length !== storedHash.length) return false
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(storedHash, 'hex')
    )
  } catch {
    // If storedHash is not valid hex, timingSafeEqual throws — treat as mismatch
    return false
  }
}

/**
 * Compute SHA-256 hash of a File object (browser File API or Node.js File).
 * Helper for use in Next.js Route Handlers that receive file uploads.
 * Usage: compute hash at upload time → store in DB → call verifyChecksum on download.
 */
export async function computeFileHash(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  return computeSHA256(buffer)
}
