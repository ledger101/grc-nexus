// app/(protected)/strategic/layout.tsx
// Auth guard for all /strategic/* routes.
// All authenticated users are allowed (D-22, D-23) — no role restriction here.
// SECURITY: force-dynamic prevents ISR caching of authenticated responses.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function StrategicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role

  // Users without an active role must select one first
  if (!activeRole) {
    redirect('/role-select')
  }

  return <>{children}</>
}
