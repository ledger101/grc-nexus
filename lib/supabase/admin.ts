// lib/supabase/admin.ts
// SERVICE ROLE client for admin operations (user approval, role assignment).
// SERVER-SIDE ONLY. NEVER import in client components or expose to browser.
// Uses SUPABASE_SERVICE_ROLE_KEY — no NEXT_PUBLIC_ prefix by design.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { getSupabaseServiceRoleKey, SUPABASE_URL } from '@/lib/supabase/config'

export function createAdminClient() {
  return createSupabaseClient<Database>(
    SUPABASE_URL,
    getSupabaseServiceRoleKey(), // NO NEXT_PUBLIC_ prefix — server only
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
