import { createClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function isAuthenticated() {
  return Boolean(await getCurrentUser())
}

export async function getUserRole() {
  const user = await getCurrentUser()
  if (!user) return null

  const appMeta = user.app_metadata as Record<string, unknown>
  return (appMeta?.active_role as string | undefined) ?? null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireRole(roles: string[]) {
  const user = await requireAuth()
  const appMeta = user.app_metadata as Record<string, unknown>
  const activeRole = appMeta?.active_role as string | undefined

  if (!activeRole || !roles.includes(activeRole)) {
    throw new Error('Forbidden')
  }

  return user
}
