// app/api/auth/refresh/route.ts
// Refreshes the Supabase session so updated app metadata claims are written to cookies.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get('next') ?? '/dashboard'
  const supabase = await createClient()

  await supabase.auth.refreshSession()

  return NextResponse.redirect(new URL(next, request.url))
}
