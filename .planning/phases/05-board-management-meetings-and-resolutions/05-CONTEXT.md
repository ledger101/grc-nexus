# Phase 5: Board Management — Meetings and Resolutions - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 delivers the full Board Management module for GRC-Nexus: board secretaries and admins can create and manage board meetings with agendas and attendee rosters, upload board pack documents, record resolutions with vote outcomes and immutable timestamps, track board action items with owner assignment and due dates, and trigger escalation alerts for overdue actions. Board meetings transition through Scheduled → In Progress → Closed states, and all records become immutable once closed.

This phase includes:
- Board meeting lifecycle (Scheduled → In Progress → Closed) with agenda items and attendee roster
- Board pack document upload to Supabase Storage with SHA-256 hash and private bucket access
- Board resolution recording with motion text, proposer, seconder, vote outcome (Passed/Rejected/Tabled), and immutable audit trail entry
- Board action item tracking with owner, due date, status, and cross-meeting visibility
- Automated escalation alerts for overdue action items (Resend email, CRON-triggered)
- Meeting immutability enforcement: all records locked after closure (no edits, only amendments via new audit entries)
- Board meetings dashboard with upcoming/recent/closed views

This phase excludes:
- Board evaluation workflows (PECOGA Section 25 confidential evaluation procedures — Phase 8+)
- Electronic/PKI digital signature for resolutions (DB-level audit trail is sufficient for v1)
- Voting proxy or delegate system
- Board committee sub-meetings or sub-committee management
- Automated minutes PDF generation
- Board performance scorecards or director evaluation
- Multi-board or governance-tier hierarchy management

</domain>

<decisions>
## Implementation Decisions

### Role Extension

- **D-01:** Phase 5 adds `board-secretary` to the `app_role` Postgres enum via `ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'board-secretary'`. Migration slot `20260522000023_board_role_extension.sql` runs before board schema.
- **D-02:** Phase 5 also adds `compliance-officer` to the enum (it was missing from base schema — Phase 4 added it to TypeScript but not the DB enum). Same migration 000023 fixes this technical debt: `ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'compliance-officer'`.
- **D-03:** `types/auth.ts` already has `compliance-officer` and needs `board-secretary` added to the union. `ROLE_DESCRIPTIONS` updated for both.
- **D-04:** `ROLE_DESCRIPTIONS['board-secretary']` = "Board meeting management, pack distribution, and resolution recording"

### Meeting Data Model

- **D-05:** `board_meetings` table columns: `id uuid`, `institution_id uuid`, `title text`, `meeting_date timestamptz`, `location text nullable`, `status meeting_status`, `agenda_items text[]` (PostgreSQL text array — simple ordered list of strings), `attendee_ids uuid[]` (array of auth.users UUIDs — denormalized for simplicity; v2 can normalize to join table), `created_by uuid`, `closed_at timestamptz nullable`, `created_at timestamptz`, `updated_at timestamptz`.
- **D-06:** `meeting_status` enum: `scheduled`, `in_progress`, `closed`.
- **D-07:** Agenda items are stored as `text[]` — ordered list of agenda item strings. No separate table for v1 (BOARD-01 doesn't require complex agenda sub-items). Frontend renders as numbered list.
- **D-08:** Attendees stored as `uuid[]` referencing `auth.users`. Simple denormalized array — enough for v1 visibility and attendance recording. No separate join table needed.
- **D-09:** Meeting status transitions enforced in Server Actions: only `scheduled → in_progress`, `in_progress → closed` allowed. Reverse transitions blocked at application layer.
- **D-10:** Migration numbering: `20260522000023` = role extension, `20260522000024` = board schema, `20260522000025` = board RLS, `20260522000026` = board triggers.

### Board Pack Document Storage

- **D-11:** `board_meeting_documents` table columns: `id uuid`, `institution_id uuid`, `meeting_id uuid`, `storage_path text`, `original_filename text`, `mime_type text`, `file_size_bytes bigint`, `sha256_hash text`, `uploaded_by uuid`, `uploaded_at timestamptz`.
- **D-12:** Storage bucket: `board-packs` (private, no public URL). Path format: `{institution_id}/{meeting_id}/{timestamp_epoch}_{original_filename_sanitized}`. Filename sanitized (spaces → underscores, special chars stripped) for S3 compatibility.
- **D-13:** Allowed MIME types: same as Phase 4 evidence — `application/pdf`, `application/vnd.openxmlformats-officedocument.*` (DOCX/XLSX), `application/msword`, `image/jpeg`, `image/png`. Also include `application/vnd.ms-powerpoint` and `application/vnd.openxmlformats-officedocument.presentationml.*` for board presentations.
- **D-14:** Max file size: 25 MB per file. Same `next.config.mjs` `bodySizeLimit: '26mb'` already applies.
- **D-15:** Board documents are NOT immutable-path (unlike compliance evidence). Rationale: board packs are reference materials, not legal evidence. SHA-256 stored for optional integrity check but path uses timestamp+original_name (not hash prefix).
- **D-16:** Download route: `app/api/board/documents/[id]/route.ts` — mirrors `/api/compliance/evidence/[id]/route.ts`. Returns 409 on SHA-256 mismatch (TRAIL-04 general principle).

### Resolution Data Model

- **D-17:** `board_resolutions` table columns: `id uuid`, `institution_id uuid`, `meeting_id uuid`, `resolution_number int` (sequential per meeting), `motion_text text`, `proposer_id uuid`, `seconder_id uuid nullable`, `vote_outcome resolution_outcome`, `notes text nullable`, `created_by uuid`, `created_at timestamptz`. No `updated_at` — resolutions are append-only per BOARD-06.
- **D-18:** `resolution_outcome` enum: `passed`, `rejected`, `tabled`.
- **D-19:** Resolutions can only be created when the meeting status is `in_progress`. Server Action enforces this check before insert.
- **D-20:** Resolution numbers are auto-assigned: `SELECT COALESCE(MAX(resolution_number), 0) + 1 FROM board_resolutions WHERE meeting_id = $1` — no gaps, sequential per meeting.

### Action Item Data Model

- **D-21:** `board_action_items` table columns: `id uuid`, `institution_id uuid`, `meeting_id uuid`, `resolution_id uuid nullable` (references board_resolutions — optional link), `title text`, `description text nullable`, `owner_id uuid`, `due_date date`, `status action_item_status`, `completed_at timestamptz nullable`, `created_by uuid`, `created_at timestamptz`, `updated_at timestamptz`.
- **D-22:** `action_item_status` enum: `open`, `in_progress`, `completed`, `overdue`, `cancelled`.
- **D-23:** Action items can be created from any non-closed meeting (not limited to in_progress). Allows planning action items during scheduling.
- **D-24:** Indexes: by institution_id, meeting_id, owner_id, status, due_date — supports dashboard queries and escalation.

### Immutability Enforcement

- **D-25:** Closed meeting immutability enforced at BOTH layers:
  1. **RLS layer:** `board_meetings` UPDATE/DELETE policies check `status != 'closed'`; `board_meeting_documents`, `board_resolutions`, `board_action_items` UPDATE/DELETE policies check via subquery: `(SELECT status FROM board_meetings WHERE id = meeting_id) != 'closed'`
  2. **Application layer:** Server Actions check meeting status before any modification, returning error "Meeting is closed — records are immutable."
- **D-26:** `closed_at timestamptz` set server-side by `closeMeeting` Server Action (never from client input). `updated_at` trigger continues to fire on action item updates.
- **D-27:** Audit triggers on all 4 tables via `audit.attach_audit_trigger()`. Every change (including the closure event itself) is logged immutably.

### RBAC Matrix

- **D-28:** Role-to-action matrix:
  | Action | admin | ceo | board-member | board-secretary | audit-officer | risk-officer |
  |--------|-------|-----|--------------|-----------------|---------------|--------------|
  | Create meeting | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
  | Edit open meeting | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
  | Close meeting | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
  | Upload board pack | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
  | Record resolution | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
  | Create action item | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
  | Update action item status | ✅ | item owner | item owner | ✅ | ❌ | ❌ |
  | View meetings + resolutions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
  | View board packs | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

- **D-29:** WRITE_ROLES = `['admin', 'board-secretary']` — create/edit/close meeting, upload documents
- **D-30:** RECORD_ROLES = `['admin', 'ceo', 'board-member', 'board-secretary']` — record resolutions and action items
- **D-31:** ACTION_UPDATE_ROLES = `['admin', 'board-secretary']` — can update any action item status; owners can also update their own (enforced in Server Action, not just RLS)
- **D-32:** VIEW_ROLES = `['admin', 'ceo', 'board-member', 'board-secretary', 'audit-officer', 'risk-officer']` — can view all meeting data

### Row-Level Security

- **D-33:** All four tables use `institution_id = (select public.institution_id())` RLS scoping — identical to Phase 3/4 pattern.
- **D-34:** Board pack Storage RLS: `(storage.foldername(name))[1] = (auth.jwt()->'app_metadata'->>'institution_id')` — same JWT path prefix pattern as Phase 4.
- **D-35:** Immutability in RLS: UPDATE/DELETE on `board_meetings` require `status != 'closed'`; for related tables, subquery check on parent meeting status.

### Escalation Alert Logic

- **D-36:** Escalation for overdue board action items via cron route `app/api/board/escalate/route.ts` (same pattern as `/api/compliance/escalate`).
- **D-37:** Escalation threshold: 3 days before due (warning) + 0 days (due today) + 7+ days overdue (critical). Same `getEscalationThreshold()` logic mirrored in `lib/board/board-utils.ts`.
- **D-38:** Recipients: action item `owner_id` email + `board-secretary` and `admin` emails from `user_profiles` (mirrors compliance admin lookup via user_roles table — NOT user_profiles.active_role to capture all role holders).
- **D-39:** `lib/board/escalation.ts` mirrors `lib/compliance/escalation.ts` with HTML-escaped interpolation from the start (ME-04 pre-empted).

### Routing & Navigation

- **D-40:** Route structure under `app/(protected)/board/`:
  - `/board` — Board dashboard (stat cards + upcoming meetings + overdue actions)
  - `/board/meetings` — All meetings list with status filter
  - `/board/meetings/new` — Create meeting form (WRITE_ROLES)
  - `/board/meetings/[id]` — Meeting detail (agenda, documents, resolutions, action items tabs)
  - `/board/meetings/[id]/edit` — Edit meeting form (non-closed only)
  - `/board/meetings/[id]/documents/upload` — Board pack upload form (WRITE_ROLES)
  - `/board/meetings/[id]/resolutions/new` — Record resolution form (RECORD_ROLES, in-progress only)
  - `/board/meetings/[id]/actions/new` — Create action item form (RECORD_ROLES, non-closed)
  - `/board/actions` — All action items across meetings (filterable by status/owner)
- **D-41:** Navigation item "Board" added to protected sidebar with `Gavel` icon (lucide-react), visible to VIEW_ROLES (admin, ceo, board-member, board-secretary, audit-officer, risk-officer — not dept-head).

### Server Actions & Validation

- **D-42:** `lib/board/actions.ts` — mirrors `lib/compliance/actions.ts` structure; exports: `createMeeting`, `updateMeeting`, `closeMeeting`, `uploadDocument`, `createResolution`, `createActionItem`, `updateActionItemStatus`.
- **D-43:** Zod v3 schemas in `lib/schemas/board.ts` — `meetingSchema`, `resolutionSchema`, `actionItemSchema`, `documentUploadSchema`. `z.coerce` for dates.
- **D-44:** `lib/board/queries.ts` — `listMeetings`, `getMeetingById`, `listDocuments`, `listResolutions`, `listActionItems`, `getBoardStats`, `getActionItemsForEscalation`.
- **D-45:** `lib/board/board-utils.ts` — `MEETING_STATUS_BADGE`, `RESOLUTION_OUTCOME_BADGE`, `ACTION_STATUS_BADGE`, `isMeetingClosed`, `getEscalationThreshold` (same thresholds), `computeBoardActionStats`.

### Dashboard

- **D-46:** Board dashboard (`/board`) shows:
  1. 3 stat cards: upcoming meetings (next 30 days), open action items, overdue actions
  2. Upcoming meetings list (next 5, sorted by meeting_date)
  3. Overdue action items table (owner name, due date, meeting title)
- **D-47:** Dashboard uses `getBoardStats` parallel query (Promise.all) for stat counts + `listMeetings(limit=5, upcoming=true)`.

### Claude's Discretion

- Exact form field ordering and placeholder copy
- Loading skeleton design for meetings table and dashboard
- Empty state design for first-time board setup
- Tab vs accordion layout for meeting detail page sections (agenda/documents/resolutions/actions)
- Exact TanStack Table column ordering for meetings and action items lists
- Resolution number display format (e.g., "RES-001" vs "1")
- Meeting date/time format display

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Planning Inputs

- `.planning/ROADMAP.md` — Phase 5 goal, dependencies, success criteria (BOARD-01 through BOARD-06)
- `.planning/REQUIREMENTS.md` — BOARD-01 through BOARD-06 requirement definitions

### Prior-Phase Patterns to Reuse

- `.planning/phases/01-foundation-authentication-rls-and-audit-trail/01-CONTEXT.md` — Auth, RLS, audit pattern baseline
- `.planning/phases/03-enterprise-risk-management-risk-register-and-heatmap/03-CONTEXT.md` — Phase 3 decisions (TanStack Table, escalation pattern with Resend)
- `.planning/phases/04-compliance-management-obligations-and-evidence/04-CONTEXT.md` — Phase 4 decisions (file upload, private storage, download route, cron route pattern)

### Existing Code References

- `lib/compliance/actions.ts` — Server action pattern; mirror for `lib/board/actions.ts`
- `lib/compliance/queries.ts` — Query helper pattern; mirror for `lib/board/queries.ts`
- `lib/compliance/escalation.ts` — Escalation service with escapeHtml (fixed ME-04); mirror for `lib/board/escalation.ts`
- `app/api/compliance/evidence/[id]/route.ts` — Download route with SHA-256 verify; mirror for board documents
- `app/api/compliance/escalate/route.ts` — CRON_SECRET-protected route; mirror for `/api/board/escalate`
- `lib/supabase/server.ts` and `lib/supabase/client.ts` — Supabase client split
- `app/(protected)/compliance/obligations/ObligationsTable.tsx` — TanStack Table reference
- `app/(protected)/compliance/obligations/[id]/evidence/upload/EvidenceUploadForm.tsx` — File upload with browser SHA-256 reference
- `supabase/migrations/20260522000020_compliance_schema.sql` — Schema/enum/table pattern
- `supabase/migrations/20260522000021_compliance_rls.sql` — RLS policy pattern including Storage RLS
- `tailwind.config.ts` — Color tokens: `ok`, `warn`, `err`, `paper-border`, `navy-950`, `gold`

</canonical_refs>

<code_context>
## Existing Code Insights

### Technical Debt Fixed in This Phase

- `types/auth.ts` and DB enum out of sync: `compliance-officer` is in TypeScript but NOT in the Postgres `app_role` enum. Migration 000023 fixes this with `ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'compliance-officer'`. The same migration adds `board-secretary`.

### Reusable Assets

- `components/compliance/ComplianceStatCard.tsx` — Reuse as-is for board dashboard stat cards (accepts icon, label, value, accent, description)
- `components/ui/badge.tsx` — Status badge for meeting/resolution/action statuses
- `components/ui/card.tsx` — Stat cards (or use ComplianceStatCard directly)
- `components/ui/table.tsx` + `components/ui/pagination.tsx` — TanStack Table shell
- `components/ui/form.tsx` + `components/ui/input.tsx` — Form stack with react-hook-form
- `components/ui/select.tsx` — Status filter selects
- `components/ui/dialog.tsx` — Confirmation dialog for meeting closure (irreversible action)
- `components/ui/tabs.tsx` — Meeting detail page tabs (Agenda / Documents / Resolutions / Actions)

### Established Patterns

- **Server Components default** — Pages are async Server Components; Client Components only for interactive TanStack Table, file upload, and tabs
- **Server Actions in `lib/`** with `'use server'`, Zod parse, Supabase call, typed return
- **JWT role check** via `user.app_metadata.active_role` — no DB round-trip for auth
- **Supabase client split** — server client in Server Components/Actions, browser client in Client Components
- **RLS via SQL helpers** `public.institution_id()` and `public.active_role()`
- **Audit triggers** via `audit.attach_audit_trigger()` — call in migration for each new table
- **`export const dynamic = 'force-dynamic'`** on all protected pages with live data
- **Resend escalation pattern** from Phase 3/4 — mirror for board with HTML escaping built in (escapeHtml already in lib/compliance/escalation.ts)
- **CRON_SECRET guard first** before any DB access in escalation route
- **SHA-256 browser compute** via `window.crypto.subtle.digest` before form submit
- **Server-side SHA-256 re-verify** in upload Server Action + `upsert: false` for overwrite prevention
- **UUID validation** at top of every Server Action accepting IDs (`z.string().uuid()`)
- **Content-Disposition RFC 5987** encoding: `filename*=UTF-8''${encodeURIComponent(name)}` in download route

### Integration Points

- `app/(protected)/layout.tsx` — Add "Board" nav item with Gavel icon
- `supabase/migrations/` — Append at `20260522000023_*` sequence
- `types/auth.ts` — Add `board-secretary` to AppRole union + ROLE_DESCRIPTIONS
- `app/(protected)/dashboard/page.tsx` — Add `'board-secretary'` to ROLE_LABELS/ROLE_BADGE_COLORS (exhaustive check)
- `app/(protected)/role-select/RoleSelectForm.tsx` — Same ROLE_BADGE_COLORS update
- `middleware.ts` — No changes needed; `/(protected)` already guarded

</code_context>

<specifics>
## Specific Ideas

- Meeting closure is irreversible — show a `<Dialog>` confirmation with "This cannot be undone" before calling `closeMeeting`
- Resolution numbers formatted as "RES-001" (zero-padded 3 digits) for formal board record display
- Meeting detail page uses shadcn `<Tabs>` for Agenda / Documents / Resolutions / Actions sections — keeps all meeting data in one view without separate routes for each sub-section
- Board dashboard "upcoming meetings" query: `WHERE meeting_date >= NOW() AND status != 'closed' ORDER BY meeting_date ASC LIMIT 5`
- Overdue action items query: `WHERE due_date < NOW()::date AND status NOT IN ('completed', 'cancelled')` — uses date-string comparison (same fix as ME-01 from Phase 4)
- `closeMeeting` Server Action sets `closed_at = now()` and `status = 'closed'` in one UPDATE — never accepts closed_at from client
- `createResolution` checks meeting.status = 'in_progress' BEFORE insert — returns error if meeting not started
- Board pack download route uses RFC 5987 filename encoding from Day 1 (CR-01 pre-empted)
- escapeHtml utility imported from lib/compliance/escalation.ts or duplicated in lib/board/escalation.ts for independence

</specifics>

<deferred>
## Deferred Ideas

- PECOGA Section 25 board evaluation workflow (confidential director evaluation — v2+)
- Electronic/PKI digital signature for resolutions (DB-level audit trail sufficient for v1)
- Voting proxy or delegate assignment
- Board committee sub-meetings and committee management
- Automated minutes PDF generation from resolution records
- Board performance dashboard and director attendance tracking
- Nomination and appointment workflow for board composition
- Multi-board governance tier hierarchy (holding company → subsidiary boards)
- Board pack digital distribution with read-receipt tracking
- Statutory compliance report generation for board governance (Phase 8)

</deferred>

---

*Phase: 05-board-management-meetings-and-resolutions*
*Context gathered: 2026-05-23*
