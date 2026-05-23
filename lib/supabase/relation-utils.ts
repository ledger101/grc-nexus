// lib/supabase/relation-utils.ts
// Runtime-safe helpers for Supabase relation payloads that may arrive as object or single-item array.

export function relationToObject<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null
  return relation ?? null
}
