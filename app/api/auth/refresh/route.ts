// app/api/auth/refresh/route.ts
// Route Handler — forces a session token refresh so updated raw_app_meta_data
// (institution_id, roles) is propagated into the JWT used by RLS policies.
// Cookies CAN be set from Route Handlers; they cannot from Server Components.
// Usage: redirect to /api/auth/refresh?next=<path>
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get('next') ?? '/dashboard'
  const supabase = await createClient()

  // refreshSession() will call setAll() which properly writes new cookies from
  // a Route Handler context (unlike Server Components where setAll is a no-op).
  await supabase.auth.refreshSession()

  return NextResponse.redirect(new URL(next, request.url))
}
