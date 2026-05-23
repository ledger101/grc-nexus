import { z } from 'zod'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'image/jpeg',
  'image/png',
] as const

export const incidentIntakeSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters.')
    .max(100, 'Title must be 100 characters or less.'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters.')
    .max(5000, 'Description must be 5000 characters or less.'),
  category: z.enum(['fraud', 'misconduct', 'safety', 'cyber', 'governance', 'other']),
  is_anonymous: z.boolean().default(false),
  reporter_name: z.string().max(100, 'Name must be 100 characters or less.').optional().nullable(),
  reporter_contact: z.string().max(200, 'Contact info must be 200 characters or less.').optional().nullable(),
}).refine(
  (data) => {
    // If not anonymous, reporter_name is recommended but not strictly required by all systems;
    // but let's make sure that if it is anonymous, we shouldn't fail if they are empty
    return true
  }
)

export const incidentTriageSchema = z.object({
  assigned_investigator_id: z.string().uuid('Please select a valid investigator.'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  visibility: z.enum(['investigator_admin_only', 'oversight_visible']),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less.').optional(),
})

export const incidentCloseSchema = z.object({
  resolution_summary: z
    .string()
    .trim()
    .min(10, 'Resolution summary must be at least 10 characters.')
    .max(5000, 'Resolution summary must be 5000 characters or less.'),
})

export const incidentEvidenceSchema = z.object({
  case_id: z.string().uuid(),
  sha256_hash: z
    .string()
    .length(64, 'SHA-256 hash must be 64 characters.')
    .regex(/^[a-f0-9]+$/, 'Invalid checksum.'),
  mime_type: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({ message: 'File type not accepted. Accepted types: PDF, DOCX, XLSX, JPG, PNG.' }),
  }),
  file_size_bytes: z.number().max(25 * 1024 * 1024, 'File size exceeds the 25 MB limit.'),
})

export type IncidentIntakeInput = z.infer<typeof incidentIntakeSchema>
export type IncidentTriageInput = z.infer<typeof incidentTriageSchema>
export type IncidentCloseInput = z.infer<typeof incidentCloseSchema>
export type IncidentEvidenceInput = z.infer<typeof incidentEvidenceSchema>
