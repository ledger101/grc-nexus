// lib/supabase/config.ts
// Central Supabase configuration. Public values are safe for browser use;
// service role access stays server-only via getSupabaseServiceRoleKey().

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
export const SUPABASE_ANON_KEY = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

export function getSupabaseServiceRoleKey(): string {
  return requireEnv('SUPABASE_SERVICE_ROLE_KEY')
}
