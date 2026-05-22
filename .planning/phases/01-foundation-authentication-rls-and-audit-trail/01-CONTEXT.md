# Phase 1: Foundation — Authentication, RLS, and Audit Trail - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the complete security and data integrity foundation for GRC-Nexus: authenticated user sessions with institutional roles, Supabase Row-Level Security enforcing institutional data isolation, and an immutable Postgres-trigger-based audit trail covering all governance table operations. No governance feature (risk, compliance, board) is built in this phase — only the auth, RBAC, schema, and audit infrastructure that every subsequent phase depends on.

</domain>

<decisions>
## Implementation Decisions

### Authentication Flow
- Minimal focused login form: institution logo/name, email field, password field, submit button — clean internal-tool aesthetic
- Post-login always redirects to `/dashboard` — predictable for all roles
- Sessions always persistent via server-side cookie (no "remember me" checkbox needed)
- Strong password policy: 12+ characters, minimum 1 uppercase, 1 number, 1 symbol

### Role Assignment & User Management
- Self-registration flow: user registers with email/password, status is `pending` until admin approves and assigns a role
- Role switching per session: a user can hold multiple roles; at login they choose their active role from their assigned set (e.g., an exec might be both `ceo` and `board-member`)
- First superadmin created via seed migration — deterministic bootstrapping for demo and deployment
- Email notification sent to user when their role is assigned or changed (using Resend)

### MFA
- Both MFA methods available: TOTP (authenticator app) and email OTP — user chooses at setup
- Required for `admin` and `board-member` roles only (per AUTH-07)
- 30-day device trust: after successful MFA, user can skip MFA on that device for 30 days
- 8 backup recovery codes generated at MFA setup, shown once and downloadable

### Audit Trail Design
- Scope: all create/update/delete operations on all governance operational tables — comprehensive per PECOGA
- Data captured: full JSON diff (before_state + after_state as JSONB columns)
- Enforced at Postgres trigger layer (SECURITY DEFINER) — survives application bugs
- audit_events table is INSERT-only: no UPDATE or DELETE permitted at any permission level
- Audit viewer UI: filterable table with actor, timestamp, action type, table name, record ID — accessible to admin and audit-officer roles
- Sensitive field exclusion: auth tokens and hashed passwords stripped from log values; all other fields captured

### Claude's Discretion
- Exact Next.js route structure within `app/` directory
- Specific Supabase RLS policy syntax and indexing strategy
- Error message copy and form validation UX details
- Email template design for role notifications

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield project

### Established Patterns
- Next.js 14 App Router (server components by default per research)
- Supabase @supabase/ssr for cookie-based auth in App Router
- shadcn/ui + Tailwind for all UI components
- react-hook-form + Zod for all form validation

### Integration Points
- All subsequent phases (2–8) depend on: auth session, user.institution_id, user.active_role
- Audit trail (TRAIL-01..04) is cross-cutting — triggers fire automatically once schema is in place
- RLS policies are set per-table — each module phase adds its own table policies to the foundation

</code_context>

<specifics>
## Specific Ideas

- Role switching at login (not mid-session) — user selects active role from a role-selection screen shown after credentials are verified
- Seed migration should create a demo institution + superadmin account for easy prototype demos
- The pending-registration admin approval queue should be visible on the admin dashboard

</specifics>

<deferred>
## Deferred Ideas

- Social/OAuth login (Google, Microsoft) — deferred to v2, adds complexity without governance value in prototype
- SAML/SSO integration — v2 per project scope
- IP allowlisting and geographic access controls — post-prototype security hardening

</deferred>
