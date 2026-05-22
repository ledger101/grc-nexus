---
phase: "01"
plan: "01"
subsystem: "auth"
tags: ["authentication", "rls", "audit-trail", "mfa", "supabase", "next14"]
dependency_graph:
  requires: []
  provides:
    - "supabase-client-setup"
    - "rls-migrations"
    - "audit-trail"
    - "jwt-hook"
    - "login-register-flow"
    - "admin-user-management"
    - "mfa-totp-email-otp"
    - "device-trust"
    - "backup-codes"
    - "audit-log-viewer"
    - "sha256-checksum-utility"
  affects:
    - "all-future-phases"
tech_stack:
  added:
    - "next@14 app-router"
    - "@supabase/ssr@0.10.3"
    - "zod@3.24.3"
    - "react-hook-form@7.76.0"
    - "@hookform/resolvers@3.10.0"
    - "bcryptjs"
    - "resend@6.12.3"
    - "@react-email/components"
    - "qrcode.react"
    - "sonner"
    - "date-fns"
    - "shadcn/ui (14 components)"
    - "vitest + jsdom"
    - "tailwindcss-animate"
  patterns:
    - "supabase.auth.getUser() exclusively (never getSession())"
    - "export const dynamic = 'force-dynamic' on all auth routes"
    - "SECURITY DEFINER triggers with set search_path = ''"
    - "Three-layer audit_events immutability (REVOKE + RLS + BEFORE trigger)"
    - "Custom JWT hook injecting institution_id/active_role/roles/status"
    - "HMAC-SHA256 device trust cookie + DB hash"
    - "bcrypt cost 12 for backup codes, cost 10 for OTP"
key_files:
  created:
    - "package.json"
    - "tsconfig.json"
    - "next.config.ts"
    - "tailwind.config.ts"
    - "vitest.config.ts"
    - "playwright.config.ts"
    - "middleware.ts"
    - "lib/supabase/server.ts"
    - "lib/supabase/client.ts"
    - "lib/supabase/admin.ts"
    - "lib/schemas/auth.ts"
    - "lib/schemas/audit.ts"
    - "lib/auth/actions.ts"
    - "lib/auth/admin-actions.ts"
    - "lib/auth/mfa.ts"
    - "lib/auth/mfa-actions.ts"
    - "lib/auth/recovery-codes.ts"
    - "lib/auth/email-otp.ts"
    - "lib/auth/device-trust.ts"
    - "lib/email/send-role-notification.ts"
    - "lib/email/templates/RoleAssignmentEmail.tsx"
    - "lib/files/checksum.ts"
    - "types/auth.ts"
    - "types/supabase.ts"
    - "supabase/migrations/20260522000001_base_schema.sql"
    - "supabase/migrations/20260522000002_rls_policies.sql"
    - "supabase/migrations/20260522000003_audit_triggers.sql"
    - "supabase/migrations/20260522000004_audit_immutability.sql"
    - "supabase/migrations/20260522000005_custom_access_token_hook.sql"
    - "supabase/migrations/20260522000006_seed.sql"
    - "app/(auth)/login/LoginForm.tsx"
    - "app/(auth)/register/RegisterForm.tsx"
    - "app/(auth)/register/pending/page.tsx"
    - "app/(protected)/admin/layout.tsx"
    - "app/(protected)/admin/users/UserManagementTable.tsx"
    - "app/(protected)/admin/audit-log/AuditLogTable.tsx"
    - "app/(protected)/admin/audit-log/FilterBar.tsx"
    - "app/(protected)/admin/audit-log/DiffViewer.tsx"
    - "app/(protected)/role-select/RoleSelectForm.tsx"
    - "app/(protected)/dashboard/MFAStatusSection.tsx"
    - "app/(protected)/mfa/setup/MFASetupForm.tsx"
    - "app/(protected)/mfa/setup/BackupCodesStep.tsx"
    - "app/(protected)/mfa/challenge/MFAChallengeForm.tsx"
    - "app/api/mfa/email-otp/route.ts"
    - "app/api/audit/export/route.ts"
    - "tests/auth/schemas.test.ts"
    - "tests/auth/mfa.test.ts"
    - "tests/files/checksum.test.ts"
  modified: []
decisions:
  - "Used zod@3.24.3 (not v4) per CLAUDE.md project constraint despite RESEARCH.md recommending v4"
  - "Created Next.js project manually (create-next-app blocked by existing .planning/ files in non-empty dir)"
  - "Installed jsdom + @testing-library/react as deviation fix when vitest reported missing peer"
  - "Email OTP implemented as custom flow via mfa_otp_challenges (Supabase does not support email as native MFA factor)"
  - "Device trust uses double-hash: HMAC token in cookie, SHA-256(token) in DB — prevents DB leak from revealing cookie value"
  - "Admin layout uses active_role from app_metadata JWT claims (not DB query) for performance"
  - "audit_events immutability: three layers — REVOKE + RLS deny-by-absence + BEFORE trigger RAISE EXCEPTION"
metrics:
  duration: "~3 hours (split across two sessions due to context limit)"
  completed_date: "2026-05-22"
  tasks_completed: 16
  tasks_total: 16
  files_created: 84
  tests_passing: 28
---

# Phase 1 Plan 01: Foundation — Authentication, RLS, and Audit Trail Summary

JWT auth with refresh rotation via Supabase SSR, institution-scoped RLS across 7 tables, immutable three-layer audit trail, TOTP + custom email OTP MFA with 30-day device trust and 8 bcrypt-hashed backup codes, and full admin UI for user management and audit log review.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| T-01 | Initialize Next.js 14 project | a05ab5a | package.json, tsconfig.json, next.config.ts, vitest.config.ts |
| T-02 | Tailwind, shadcn/ui, TypeScript types | 2489ec7 | tailwind.config.ts, components/ui/ (14 components), types/auth.ts |
| T-03 | Supabase client setup + middleware | c243c22 | lib/supabase/{server,client,admin}.ts, middleware.ts |
| T-04 | Zod schemas + auth layouts | f7f485f | lib/schemas/auth.ts, lib/schemas/audit.ts, app/(auth)/layout.tsx, app/(protected)/layout.tsx |
| T-05 | DB migrations: schema + RLS + audit + JWT hook | 950805e | migrations 1–5 (base schema, RLS, audit triggers, immutability, JWT hook) |
| T-06 | Seed migration: demo institution + superadmin | 860d212 | supabase/migrations/20260522000006_seed.sql |
| T-07 | Login, register, auth Server Actions | cc1277f | lib/auth/actions.ts, app/(auth)/login/, app/(auth)/register/ |
| T-08 | Admin user management | 43c5a48 | lib/auth/admin-actions.ts, app/(protected)/admin/users/, lib/email/send-role-notification.ts |
| T-09 | Role selection + dashboard | ee7913e | app/(protected)/role-select/, app/(protected)/dashboard/page.tsx |
| T-10 | TOTP MFA enrollment | d3c5722 | lib/auth/mfa.ts, lib/auth/recovery-codes.ts, lib/auth/mfa-actions.ts, lib/auth/device-trust.ts, app/(protected)/mfa/setup/ |
| T-11 | Email OTP MFA custom flow | a2927e8 | lib/auth/email-otp.ts, app/api/mfa/email-otp/route.ts |
| T-12 | MFA challenge screen | 53436fe | app/(protected)/mfa/challenge/, tailwind.config.ts (shake animation) |
| T-13 | Backup code regeneration + MFA tests | b56ce4a | app/(protected)/dashboard/MFAStatusSection.tsx, tests/auth/mfa.test.ts |
| T-14 | React Email template + audit event wiring | 3534377 | lib/email/templates/RoleAssignmentEmail.tsx, lib/email/send-role-notification.ts |
| T-15 | SHA-256 checksum utility | 5291070 | lib/files/checksum.ts, tests/files/checksum.test.ts |
| T-16 | Audit log viewer UI | 0345e68 | app/(protected)/admin/audit-log/, app/api/audit/export/route.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] create-next-app blocked by non-empty directory**
- **Found during:** T-01
- **Issue:** `npx create-next-app@14 .` refused to run because the worktree directory contained `.planning/` and `CLAUDE.md`.
- **Fix:** Created all Next.js scaffold files manually (package.json, tsconfig.json, next.config.ts, vitest.config.ts, playwright.config.ts, app/layout.tsx, app/globals.css, postcss.config.mjs).
- **Files modified:** All scaffold files created from scratch.
- **Commit:** a05ab5a

**2. [Rule 3 - Blocking] Vitest missing jsdom peer dependency**
- **Found during:** T-04 (running schema tests)
- **Issue:** `npx vitest run tests/auth/schemas.test.ts` failed with "Cannot find package 'jsdom'".
- **Fix:** Installed `jsdom`, `@testing-library/react`, `@testing-library/user-event` as dev dependencies.
- **Files modified:** package.json
- **Commit:** f7f485f (part of schemas test task)

**3. [CLAUDE.md enforcement] Zod v3 instead of v4**
- **Found during:** T-04
- **Issue:** RESEARCH.md recommended Zod v4 but CLAUDE.md states "Zod v3.x (not v4 yet; some breaking changes)". PLAN.md npm install command also showed `zod@3.24.3`.
- **Fix:** Used `zod@3.24.3` and `@hookform/resolvers@3.10.0` (Zod v3 compatible).
- **Files modified:** package.json, lib/schemas/auth.ts, lib/schemas/audit.ts

### Auth Gates

None — Supabase credentials and Resend API key were not required for code generation. The migrations and seed SQL are prepared for deployment but `supabase db push` was not run (requires live credentials and Supabase CLI link). This is documented as a deployment prerequisite.

## Known Stubs

None — all UI components receive real data from server-side queries or server actions. The dashboard "Phase 2+" placeholder card is intentional per the plan spec ("Dashboard content is delivered in Phase 2") and does not block the plan's goal.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: new-endpoint | app/api/mfa/email-otp/route.ts | POST endpoint accessible to authenticated users; rate limiting not implemented (accepted for Phase 1 prototype per T-01-05 threat register) |
| threat_flag: new-endpoint | app/api/audit/export/route.ts | Exports full audit log without pagination; accepted per T-01-16 (Phase 8 streaming) |

## Security Verification

The following security invariants were maintained throughout execution:

- `getUser()` used exclusively server-side — `grep -rn "getSession" lib/` returns no matches
- `SUPABASE_SERVICE_ROLE_KEY` has no NEXT_PUBLIC_ prefix — only in lib/supabase/admin.ts
- `export const dynamic = 'force-dynamic'` on all authenticated layouts and pages
- All SECURITY DEFINER functions include `set search_path = ''`
- audit_events: REVOKE + RLS deny-by-absence + BEFORE trigger (three-layer)
- All Server Actions using createAdminClient() verify active_role === 'admin' first
- Backup codes: crypto.randomBytes only (never Math.random())
- Device trust: HMAC-SHA256 token in cookie, SHA-256(token) in DB

## Self-Check: PASSED

All 22 key files verified FOUND. All 16 task commits verified present in git log.

- lib/auth/actions.ts: FOUND
- lib/auth/mfa.ts: FOUND
- lib/auth/recovery-codes.ts: FOUND
- lib/auth/email-otp.ts: FOUND
- lib/auth/device-trust.ts: FOUND
- lib/email/templates/RoleAssignmentEmail.tsx: FOUND
- lib/files/checksum.ts: FOUND
- middleware.ts: FOUND
- All 6 SQL migrations: FOUND
- All UI components (audit-log, mfa/challenge, mfa/setup): FOUND
- tests/auth/mfa.test.ts: FOUND (8 tests passing)
- tests/files/checksum.test.ts: FOUND (6 tests passing)
- Total unit tests: 28 passing across 3 test files
