// app/(protected)/layout.tsx
// Auth-gated layout — defense-in-depth auth check (middleware also checks, this is second layer).
// SECURITY: Uses getUser() — NOT getSession() (getSession() does not validate JWT).
// SECURITY: force-dynamic prevents ISR caching of authenticated responses.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  // Re-validate here even though middleware also checks — defense-in-depth
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Users with 'pending' status cannot access protected pages
  const appMeta = user.app_metadata as Record<string, string>
  if (appMeta?.status === 'pending') {
    redirect('/register/pending')
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* App shell nav is added in a later phase — Phase 1 uses minimal shell */}
      <main className="max-w-[1200px] mx-auto px-8 pt-8">
        {children}
      </main>
    </div>
  )
}
