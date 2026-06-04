import { createClient } from '@/lib/supabase/client'
import { type LoginInput } from '@/lib/schemas/auth'

export async function signInWithPassword(values: LoginInput) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  })

  if (error) {
    return { error: 'Email address or password is incorrect. Please try again.' }
  }

  if (!data.session) {
    return { error: 'An unexpected error occurred. Please try again.' }
  }

  // Encode session into __session cookie (Firebase Hosting only allows this cookie)
  const sessionData = {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    user_id: data.user?.id,
  }

  document.cookie = `__session=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=604800; SameSite=Lax; secure`

  return { 
    success: true, 
    user: data.user,
    redirectTo: '/dashboard'
  }
}
