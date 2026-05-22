// lib/schemas/audit.ts
// Zod schemas for audit log viewer filters.
import { z } from 'zod'

export const auditFilterSchema = z.object({
  actorSearch: z.string().optional(),
  action: z.enum(['INSERT', 'UPDATE', 'DELETE', '']).optional(),
  tableName: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
})

export type AuditFilterInput = z.infer<typeof auditFilterSchema>
