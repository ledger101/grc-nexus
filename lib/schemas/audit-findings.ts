import { z } from 'zod'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'image/jpeg',
  'image/png',
] as const

export const auditFindingSchema = z.object({
  title: z.string().min(1, 'Finding title is required.'),
  description: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  root_cause: z.string().min(1, 'Root cause is required.'),
  linked_entity_type: z.enum(['risk', 'control', 'compliance_obligation']),
  linked_entity_id: z.string().uuid('Linked entity is required.'),
  remediation_owner_id: z.string().uuid('Remediation owner is required.'),
  review_date: z.string().min(1, 'Review date is required.'),
  due_date: z.string().min(1, 'Remediation due date is required.'),
})

export const auditFindingStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'closed']),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less.').optional(),
})

export const auditFindingEvidenceSchema = z.object({
  finding_id: z.string().uuid(),
  sha256_hash: z
    .string()
    .length(64, 'SHA-256 hash must be 64 characters.')
    .regex(/^[a-f0-9]+$/, 'Invalid checksum.'),
  mime_type: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({ message: 'File type not accepted. Accepted types: PDF, DOCX, XLSX, JPG, PNG.' }),
  }),
  file_size_bytes: z.number().max(25 * 1024 * 1024, 'File size exceeds the 25 MB limit.'),
})

export type AuditFindingInput = z.infer<typeof auditFindingSchema>
export type AuditFindingStatusInput = z.infer<typeof auditFindingStatusSchema>
export type AuditFindingEvidenceInput = z.infer<typeof auditFindingEvidenceSchema>
