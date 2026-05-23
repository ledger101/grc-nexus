/**
 * Diagnostic: test admin user login and report what GoTrue sees.
 * Run from grc-nexus/: node scripts/test-admin-login.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envRaw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l.includes('=') && !l.trimStart().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']
const ANON_KEY = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
const ADMIN_EMAIL = 'admin@grcnexus.gov.zw'
const ADMIN_PASS  = 'Admin@GRC2026!'

console.log('URL:', SUPABASE_URL)

// ── Admin client ──────────────────────────────────────────────────────────
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── 0. Test PostgREST (non-auth) — confirm the DB is reachable ───────────
console.log('\n0. PostgREST reachability (institutions table)…')
const { data: inst, error: instErr } = await admin.from('institutions').select('id, name').limit(1)
if (instErr) console.error('   PostgREST error:', instErr.message)
else console.log('   OK, rows returned:', inst?.length ?? 0, inst?.[0] ? JSON.stringify(inst[0]) : '(none)')

// ── 1. List all users via admin API ──────────────────────────────────────
console.log('\n1. listUsers (admin API)…')
const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 })
if (listErr) {
  console.error('   listUsers error:', listErr)
} else {
  console.log(`   total users returned: ${listData?.users?.length ?? 0}`)
  if (listData?.users?.length > 0) {
    listData.users.forEach(u => console.log(`   - ${u.id} | ${u.email} | confirmed=${u.email_confirmed_at != null}`))
  }
}

// ── 2. getUserById ────────────────────────────────────────────────────────
const ADMIN_ID = '00000000-0000-0000-0000-000000000001'
console.log('\n2. getUserById…')
const { data: byId, error: byIdErr } = await admin.auth.admin.getUserById(ADMIN_ID)
if (byIdErr) console.error('   error:', byIdErr)
else console.log('   found:', byId?.user ? `${byId.user.id} / ${byId.user.email}` : 'null')

// ── 3. Try sign-in with anon key ──────────────────────────────────────────
console.log('\n3. signInWithPassword (anon key)…')
const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({
  email: ADMIN_EMAIL,
  password: ADMIN_PASS,
})
if (signInErr) {
  console.error('   sign-in FAILED:', signInErr.message, signInErr.status)
} else {
  console.log('   sign-in SUCCESS! User ID:', signIn.user?.id)
  console.log('   email_confirmed:', signIn.user?.email_confirmed_at != null)
  console.log('   app_metadata (DB):', JSON.stringify(signIn.user?.app_metadata))
  // Decode JWT to check hook-added claims
  const token = signIn.session?.access_token
  if (token) {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
    console.log('   JWT app_metadata:', JSON.stringify(payload.app_metadata))
    console.log('   JWT role:', payload.role)
    console.log('   JWT institution_id:', payload.app_metadata?.institution_id)
    console.log('   JWT active_role:', payload.app_metadata?.active_role)
  }
}
