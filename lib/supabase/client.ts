// lib/supabase/client.ts
// Browser-side Supabase client — exclusively for 'use client' components.
// NEVER import this in Server Components or Route Handlers.
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config'

export function createClient() {
  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )
}
