// lib/schemas/compliance.ts
// Zod v3 schemas for compliance domain forms. No v4 APIs.
import { z } from 'zod'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'image/jpeg',
  'image/png',
] as const

export const obligationSchema = z.object({
  framework: z.enum(['pecoga', 'ppdpa', 'nds2', 'iso_37000', 'king_iv', 'ipsas', 'pfma', 'other']),
  framework_reference: z.string().optional(),
  title: z.string().min(1, 'Obligation title is required.'),
  description: z.string().optional(),
  owner_id: z.string().uuid('Obligation owner is required.'),
  due_date: z.string().min(1, 'Due date is required.'),
}).refine(
  (data) => data.framework !== 'other' || (data.framework_reference && data.framework_reference.length > 0),
  { message: 'Regulation reference is required when framework is set to Other.', path: ['framework_reference'] }
)

export const attestationSchema = z.object({
  attestation_status: z.enum(['compliant', 'partially_compliant', 'non_compliant'], {
    errorMap: () => ({ message: 'Please select a compliance status to record this attestation.' }),
  }),
  notes: z.string().optional(),
})

export const evidenceUploadSchema = z.object({
  obligation_id: z.string().uuid(),
  sha256_hash: z.string().length(64, 'SHA-256 hash must be 64 characters.').regex(/^[a-f0-9]+$/, 'Invalid checksum.'),
  mime_type: z.enum(
    [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'image/jpeg',
      'image/png',
    ],
    { errorMap: () => ({ message: 'File type not accepted. Accepted types: PDF, DOCX, XLSX, JPG, PNG.' }) }
  ),
  file_size_bytes: z.number().max(25 * 1024 * 1024, 'File size exceeds the 25 MB limit.'),
})

export type ObligationInput = z.infer<typeof obligationSchema>
export type AttestationInput = z.infer<typeof attestationSchema>
export type EvidenceUploadInput = z.infer<typeof evidenceUploadSchema>
