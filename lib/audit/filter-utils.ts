import type { Json } from '@/types/supabase'

interface ParsedAuditMetadata {
  module: string | null
  department: string | null
}

function asRecord(value: Json | null): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

export function parseAuditMetadata(metadata: Json | null): ParsedAuditMetadata {
  const obj = asRecord(metadata)
  if (!obj) {
    return { module: null, department: null }
  }

  const moduleName = typeof obj.module === 'string' ? obj.module : null
  const department = typeof obj.department === 'string'
    ? obj.department
    : (typeof obj.department_id === 'string' ? obj.department_id : null)

  return { module: moduleName, department }
}
