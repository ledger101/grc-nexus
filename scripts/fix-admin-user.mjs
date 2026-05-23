/**
 * Fix or create the demo admin user via GoTrue's admin API.
 *
 * Why: The seed SQL uses extensions.crypt() (pgcrypto) to hash the password,
 * which may produce a $2a$06$ hash that GoTrue can't verify, or the user may
 * not exist at all if the migration ran but extensions.crypt() wasn't available.
 * Calling GoTrue's admin API ensures the password is hashed by Go's own bcrypt.
 *
 * Usage (from grc-nexus/):
 *   node scripts/fix-admin-user.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ---------------------------------------------------------------------------
// Read credentials from .env.local
// ---------------------------------------------------------------------------
const envRaw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envRaw
    .split('\n')
    .filter(l => l.includes('=') && !l.trimStart().startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Admin client (service role – bypasses RLS, talks to GoTrue admin endpoints)
// ---------------------------------------------------------------------------
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ADMIN_ID    = '00000000-0000-0000-0000-000000000001'
const INST_ID     = '00000000-0000-0000-0000-000000000010'
const ADMIN_EMAIL = 'admin@grcnexus.gov.zw'
const ADMIN_PASS  = 'Admin@GRC2026!'

// ---------------------------------------------------------------------------
async function upsertProfileAndRole(userId) {
  const { error: profileErr } = await supabase.from('user_profiles').upsert(
    {
      id: userId,
      institution_id: INST_ID,
      first_name: 'System',
      last_name: 'Administrator',
      status: 'approved',
      active_role: 'admin',
    },
    { onConflict: 'id' }
  )
  if (profileErr) console.warn('  ⚠  user_profiles upsert:', profileErr.message)
  else console.log('  ✓  user_profiles OK')

  const { error: roleErr } = await supabase.from('user_roles').upsert(
    { user_id: userId, institution_id: INST_ID, role_name: 'admin' },
    { onConflict: 'user_id,institution_id,role_name' }
  )
  if (roleErr) console.warn('  ⚠  user_roles upsert:', roleErr.message)
  else console.log('  ✓  user_roles OK')
}

// ---------------------------------------------------------------------------
async function main() {
  console.log('🔍  Looking up admin user by ID…')
  const { data: byId } = await supabase.auth.admin.getUserById(ADMIN_ID)

  if (byId?.user) {
    // ── User exists with correct UUID ────────────────────────────────────────
    console.log('  Found user:', byId.user.email)
    console.log('  Resetting password via GoTrue admin API…')
    const { error } = await supabase.auth.admin.updateUserById(ADMIN_ID, {
      password: ADMIN_PASS,
      email_confirm: true,
    })
    if (error) { console.error('❌  Update failed:', error.message); process.exit(1) }
    console.log('  ✓  Password reset via GoTrue (bcrypt $2b$)')

    // Ensure profile/role exist (they might have been lost if user was re-seeded)
    await upsertProfileAndRole(ADMIN_ID)

  } else {
    // ── Try finding by email (UUID might differ) ──────────────────────────────
    console.log('  Not found by ID. Scanning auth.users by email…')
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = list?.users?.find(u => u.email === ADMIN_EMAIL)

    if (existing) {
      console.log(`  Found user with different id: ${existing.id}`)
      console.log('  Resetting password…')
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: ADMIN_PASS,
        email_confirm: true,
      })
      if (error) { console.error('❌  Update failed:', error.message); process.exit(1) }
      console.log('  ✓  Password reset via GoTrue (bcrypt $2b$)')
      await upsertProfileAndRole(existing.id)
      if (existing.id !== ADMIN_ID) {
        console.warn(`\n⚠️   UUID mismatch: live id=${existing.id}, seed expects ${ADMIN_ID}`)
        console.warn('    RLS policies that read institution_id from JWT (via custom_access_token_hook)')
        console.warn('    depend on user_profiles having the correct user id. Verify the hook is enabled.')
      }

    } else {
      // ── Create fresh via GoTrue ───────────────────────────────────────────
      console.log('  No user found. Creating via GoTrue admin API…')
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASS,
        email_confirm: true,
        user_metadata: { first_name: 'System', last_name: 'Administrator' },
      })
      if (createErr) { console.error('❌  Create failed:', createErr.message); process.exit(1) }
      const newId = created.user.id
      console.log(`  ✓  User created with id: ${newId}`)
      await upsertProfileAndRole(newId)
      if (newId !== ADMIN_ID) {
        console.warn(`\n⚠️   UUID mismatch: GoTrue assigned ${newId}, seed expects ${ADMIN_ID}`)
        console.warn('    Update the seed SQL or run the migration reset to align UUIDs.')
      }
    }
  }

  console.log('\n✅  Done. Login credentials:')
  console.log('    Email:   ', ADMIN_EMAIL)
  console.log('    Password:', ADMIN_PASS)
  console.log('\n⚠️   Reminder: enable custom_access_token_hook in Supabase Dashboard')
  console.log('    Authentication → Hooks → custom_access_token_hook → public.custom_access_token_hook')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
