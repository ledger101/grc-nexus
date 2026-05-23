# Phase 4: Compliance Management — Obligations and Evidence - Research

**Researched:** 2026-05-23
**Domain:** Compliance obligations management, file evidence storage with integrity verification, attestation audit trail, Supabase Storage RLS, Web Crypto API SHA-256
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Regulatory Framework Taxonomy**
- D-01: `regulatory_framework` enum: `pecoga`, `ppdpa`, `nds2`, `iso_37000`, `king_iv`, `ipsas`, `pfma`, `other`
- D-02: Free-text `framework_reference` field when `other` is selected
- D-03: One framework per obligation (no multi-tagging in Phase 4)

**Compliance Obligation Data Model**
- D-04: `compliance_obligations` columns: `id uuid`, `institution_id uuid`, `framework regulatory_framework`, `framework_reference text nullable`, `title text`, `description text nullable`, `owner_id uuid`, `due_date date`, `status obligation_status`, `created_by uuid`, `created_at timestamptz`, `updated_at timestamptz`
- D-05: `obligation_status` enum: `pending`, `compliant`, `partially_compliant`, `non_compliant`, `overdue`, `waived`
- D-06: Institution-scoped with standard RLS pattern
- D-07: Indexes on institution/framework/owner/status/due_date
- D-08: Migration numbering starts at `20260522000020_compliance_schema.sql` (see Migration Numbering section)

**Evidence File Storage**
- D-09: Supabase Storage bucket `compliance-evidence` (private), RLS scoped to `institution_id`
- D-10: Immutable filename: `{institution_id}/{obligation_id}/{timestamp_epoch}_{sha256_first16}.{ext}`
- D-11: `obligation_evidence` columns: `id uuid`, `institution_id uuid`, `obligation_id uuid`, `storage_path text`, `original_filename text`, `mime_type text`, `file_size_bytes bigint`, `sha256_hash text`, `uploaded_by uuid`, `uploaded_at timestamptz`
- D-12: Overwrite prevention: server checks path before upload; returns error if exists
- D-13: Allowed MIME types validated in Zod: PDF, DOCX/XLSX, DOC, JPEG, PNG
- D-14: Max file size: 25 MB
- D-15: SHA-256 in browser via `crypto.subtle.digest`; stored in DB; re-computed on download

**Attestation Model**
- D-16: `obligation_attestations` columns: `id uuid`, `institution_id uuid`, `obligation_id uuid`, `attestation_status attestation_status`, `attested_by uuid`, `attested_at timestamptz`, `notes text nullable`
- D-17: `attestation_status` enum: `compliant`, `partially_compliant`, `non_compliant`
- D-18: "Digitally signed" = `attested_by` (JWT UUID) + `attested_at` (server `now()`) + audit trigger
- D-19: Append-only; obligation `status` column updated to match latest attestation
- D-20: Only `compliance_officer`, `admin`, `ceo` roles may attest

**Compliance Posture Dashboard**
- D-21: Route `app/(protected)/compliance/page.tsx` with 3 queries (status distribution, overdue count, expiring-30d)
- D-22: 3-stat row + obligations list table
- D-23: Stat cards use existing card component with `ok`/`err`/`warn` tokens
- D-24: TanStack Table v8 client-side filtering by framework, status, owner

**Escalation Alert Logic**
- D-25: Escalation triggered via `app/api/compliance/escalate/route.ts` (callable by pg_cron or external scheduler)
- D-26: Thresholds: -3 days (early warning), 0 days (due today), +7 days overdue (critical)
- D-27: Email via Resend, pattern from `lib/risk/escalation.ts`, mirrored as `lib/compliance/escalation.ts`
- D-28: Recipients: obligation `owner_id` + institution admin emails from `user_profiles`

**Evidence Integrity Verification on Download**
- D-29: Download route `app/api/compliance/evidence/[id]/route.ts` fetches from Storage, re-computes SHA-256, compares to stored hash
- D-30: On mismatch: HTTP 409 with `{ "error": "integrity_check_failed", ... }`
- D-31: On match: streamed response with `Content-Disposition: attachment; filename="{original_filename}"`

**RBAC Summary**
- D-32: See CONTEXT.md for full role-action matrix
- D-33: All three new tables use `institution_id = (select public.institution_id())` RLS
- D-34: Audit triggers via `audit.attach_audit_trigger()` on all three tables
- D-35: Supabase Storage RLS on `compliance-evidence` bucket: SELECT/INSERT scoped by path prefix

**Routing**
- D-36: Routes under `app/(protected)/compliance/` — 6 routes (dashboard, list, new, [id], [id]/attest, [id]/evidence/upload)
- D-37: "Compliance" nav item added to protected sidebar

**Server Actions & Validation**
- D-38: Server Actions in `lib/compliance/actions.ts`
- D-39: Zod v3 schemas in `lib/schemas/compliance.ts`
- D-40: File upload Server Action uses `FormData` with `File`; SHA-256 from client as hidden field; server re-validates

### Claude's Discretion

- Exact form field ordering and placeholder copy
- Loading skeleton design for obligation table and dashboard stats
- Empty state design when no obligations have been created
- Exact Supabase Storage bucket configuration (public vs private — use private with signed URLs)
- Migration timestamp selection within `20260522000020+` sequence
- Specific TanStack Table column ordering details

### Deferred Ideas (OUT OF SCOPE)

- Multi-framework tagging per obligation (v2)
- Obligation approval workflow (draft → review → active)
- Bulk obligation import via CSV
- Automated regulation change feed / API ingestion
- Cross-institution compliance benchmarking (Phase 8)
- Statutory compliance report generation (Phase 8)
- Configurable escalation thresholds per institution
- Digital signature via PKI / hardware token
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COMP-01 | Admin can create compliance obligations linked to a regulatory framework with due date and owner | Schema design (D-04/D-05), Server Action pattern (D-38), Zod schema (D-39), RLS (D-33) |
| COMP-02 | Compliance officers can upload evidence files (PDF, DOCX, XLSX, images) as proof of compliance | Supabase Storage private bucket, RLS path prefix policy (D-09/D-35), FormData Server Action (D-40) |
| COMP-03 | Uploaded evidence files get immutable filename (timestamp + SHA-256 hash) and cannot be overwritten | Deterministic path (D-10), overwrite prevention check (D-12), SHA-256 browser computation (D-15) |
| COMP-04 | Compliance officer can attest to an obligation with signed timestamp | Append-only `obligation_attestations` table (D-16), server-side `now()` timestamp (D-18), audit trigger (D-34) |
| COMP-05 | Dashboard shows compliance posture: % met, overdue count, expiring in 30 days | 3-query Server Component (D-21), stat card UI (D-23), TanStack Table (D-24) |
| COMP-06 | Overdue obligations trigger automated escalation alerts at 3 days before, on due date, and 7+ days overdue | API route (D-25), pg_cron or external scheduler, Resend email pattern (D-27) |
</phase_requirements>

---

## Summary

Phase 4 delivers the Compliance Management module: compliance officers create and track regulatory obligations, upload SHA-256-protected evidence files, attest to compliance status with an immutable audit trail, and view a live compliance posture dashboard. Automated escalation emails notify owners at three due-date thresholds.

This phase is a direct structural mirror of Phase 3 (ERM). The `lib/compliance/actions.ts` file mirrors `lib/risk/actions.ts`. The migration pattern, RLS pattern, audit trigger attachment, TanStack Table client filter pattern, Resend escalation pattern, and Supabase client split all carry forward unchanged. The primary new technical surfaces are Supabase Storage with RLS path-prefix policies for evidence files, the Web Crypto API for browser-side SHA-256 computation, a download Route Handler with integrity re-verification, and a scheduler-callable escalation API route.

One critical difference from the CONTEXT.md migration number: the actual latest migration on disk is `20260522000019_risk_triggers.sql`. Phase 4 migrations must start at `20260522000020`, not `20260522000016` as stated in D-08 (that number is already taken by `20260522000016_sync_raw_app_meta_data.sql`). Three migrations are needed: `20260522000020_compliance_schema.sql`, `20260522000021_compliance_rls.sql`, `20260522000022_compliance_triggers.sql`.

**Primary recommendation:** Mirror Phase 3 structure exactly; the only net-new patterns to implement are Supabase Storage bucket creation/RLS, browser-side SHA-256 using the already-present `lib/files/checksum.ts` server equivalent, and the download Route Handler with integrity check.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Obligation CRUD | API / Backend (Server Actions) | Browser (forms) | Business logic, RLS, audit trail enforcement belongs server-side |
| SHA-256 computation (upload) | Browser / Client | API / Backend (re-verify) | Client computes for UX transparency; server re-verifies before storing |
| SHA-256 verification (download) | API / Backend (Route Handler) | — | Integrity check must happen server-side before bytes reach browser |
| Evidence file storage | CDN / Storage (Supabase Storage) | API / Backend (upload proxy via Server Action) | Supabase Storage bucket with RLS; server action handles upload logic |
| Evidence download | API / Backend (Route Handler) | CDN / Storage | Route Handler fetches from Storage, verifies, streams to browser |
| Compliance posture queries | API / Backend (Server Component) | — | Three DB queries; must be fresh on each load (`force-dynamic`) |
| Attestation recording | API / Backend (Server Actions) | Browser (form) | Server-side `now()` timestamp locking; append-only insert |
| Escalation scheduling | Database (pg_cron) | API / Backend (Route Handler) | Cron calls HTTP endpoint; Route Handler performs escalation logic |
| TanStack Table filtering | Browser / Client | — | Client-side filtering; no network round-trip for filter interactions |
| RBAC enforcement | API / Backend | Database (RLS) | JWT claims check in Server Actions; RLS as second layer |

---

## Standard Stack

### Core (all already installed — no new npm installs required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.106.1 [VERIFIED: package.json] | Supabase Storage upload, download, signed URL | Project standard; Storage is a first-class Supabase feature |
| `@supabase/ssr` | ^0.10.3 [VERIFIED: package.json] | Server-side Supabase client for Route Handlers and Server Actions | Established Phase 1 pattern |
| `zod` | ^3.25.76 [VERIFIED: package.json] | Compliance form schemas, MIME type validation | Locked project standard; Zod v3 only |
| `react-hook-form` | ^7.76.0 [VERIFIED: package.json] | Obligation forms, evidence upload form, attestation form | Established Phase 2+ pattern |
| `@hookform/resolvers` | ^3.10.0 [VERIFIED: package.json] | Zod resolver bridge for react-hook-form | Established pattern |
| `resend` | ^6.12.3 [VERIFIED: package.json] | Escalation alert emails | Established Phase 3 escalation pattern |
| `date-fns` | ^4.3.0 [VERIFIED: package.json] | Overdue date comparison (`isPast`, `addDays`) | Established Phase 3 pattern |
| `@tanstack/react-table` | ^8.21.3 [VERIFIED: package.json] | Obligations list with client-side filtering | Established Phase 3 pattern |
| `lucide-react` | ^1.16.0 [VERIFIED: package.json] | Icons: ClipboardList, ShieldCheck, Upload, FileText, etc. | Established project standard |
| `sonner` | ^2.0.7 [VERIFIED: package.json] | Toast notifications for upload/attestation success/error | Established Phase 1+ pattern |
| `Web Crypto API` | Browser-native | SHA-256 computation in browser (no npm package) | Browser baseline, widely available since Jan 2020 [CITED: developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest] |
| `Node.js crypto` | Node-native | SHA-256 on server in Route Handler download (already in `lib/files/checksum.ts`) | Already implemented in codebase |

### Supporting (all already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@react-email/components` | ^1.0.12 | Escalation email templates | Composing HTML emails for Resend |
| `react-email` | ^6.3.1 | Email template development | Same as Phase 3 escalation |

### No New Installs Required

All dependencies for Phase 4 are already in `package.json`. Supabase Storage is a native Supabase service (no separate SDK). Web Crypto API is browser-native. The server-side checksum utility is already implemented in `lib/files/checksum.ts`.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (Client Component)
  │
  ├─ EvidenceDropZone.tsx
  │    │
  │    ├─ File selected → FileReader.arrayBuffer()
  │    ├─ crypto.subtle.digest('SHA-256', buffer) → hex string
  │    └─ FormData { file, sha256_hash } → Server Action
  │
  └─ ObligationFilterBar.tsx / RiskRegisterTable.tsx pattern
       └─ TanStack Table setColumnFilters() → instant client filter

Server Actions (lib/compliance/actions.ts)
  │
  ├─ createObligation(values: ObligationInput)
  │    └─ Zod parse → JWT role check → supabase.from('compliance_obligations').insert()
  │
  ├─ uploadEvidence(formData: FormData)
  │    ├─ Zod parse (mime, size, sha256)
  │    ├─ Compute path: {institution_id}/{obligation_id}/{epoch}_{hash16}.{ext}
  │    ├─ Check path exists → error if collision
  │    ├─ supabase.storage.from('compliance-evidence').upload(path, file)
  │    └─ supabase.from('obligation_evidence').insert(record)
  │
  └─ attestObligation(obligationId, values: AttestationInput)
       ├─ Zod parse → JWT role check (compliance_officer/admin/ceo only)
       ├─ supabase.from('obligation_attestations').insert({ attested_at: server now() })
       └─ supabase.from('compliance_obligations').update({ status })

Route Handlers (app/api/compliance/)
  │
  ├─ evidence/[id]/route.ts (GET)
  │    ├─ Auth check → JWT role check (VIEW_ROLES)
  │    ├─ supabase.from('obligation_evidence').select() → get storage_path + sha256_hash
  │    ├─ supabase.storage.from('compliance-evidence').download(path) → Blob
  │    ├─ computeSHA256(Buffer.from(await blob.arrayBuffer()))
  │    ├─ verifyChecksum(bytes, storedHash) → boolean
  │    ├─ MISMATCH: return Response({ error: 'integrity_check_failed' }, { status: 409 })
  │    └─ MATCH: return new Response(bytes, { headers: Content-Disposition attachment })
  │
  └─ escalate/route.ts (POST)
       ├─ Verify CRON_SECRET header
       ├─ Query overdue obligations at -3d / 0d / +7d thresholds
       └─ Resend.emails.send() for each affected owner

Server Components (app/(protected)/compliance/)
  │
  ├─ page.tsx (dashboard)
  │    ├─ Promise.all([ statusDistribution, overdueCount, expiring30d ])
  │    └─ <ComplianceStatCard> × 3 + obligations preview table
  │
  └─ obligations/[id]/page.tsx (detail)
       ├─ getObligationById() + listEvidence() + listAttestations()
       └─ Evidence list + Attestation history (append-only)

Database Layer (Supabase Postgres)
  │
  ├─ compliance_obligations (RLS: institution_id filter)
  ├─ obligation_evidence (RLS: institution_id filter)
  ├─ obligation_attestations (RLS: institution_id filter, INSERT-only via audit trigger)
  ├─ storage.objects on 'compliance-evidence' bucket (RLS: path prefix = institution_id)
  └─ pg_cron: daily POST to /api/compliance/escalate with CRON_SECRET
```

### Recommended Project Structure

```
lib/
├── compliance/
│   ├── actions.ts           # Server Actions (mirrors lib/risk/actions.ts)
│   ├── queries.ts           # Query helpers (mirrors lib/risk/queries.ts)
│   ├── compliance-utils.ts  # Pure helpers: status badges, date helpers, display labels
│   └── escalation.ts        # Resend escalation (mirrors lib/risk/ escalation pattern)
├── schemas/
│   └── compliance.ts        # Zod v3 schemas for all compliance forms
├── files/
│   └── checksum.ts          # Already exists — server-side SHA-256; reuse as-is
types/
└── compliance.ts            # ObligationStatus, AttestationStatus, RegulatoryFramework types
app/
├── (protected)/compliance/
│   ├── page.tsx             # Posture dashboard (Server Component)
│   ├── obligations/
│   │   ├── page.tsx         # Obligations list (Server Component + Client Table)
│   │   ├── ObligationsTable.tsx  # TanStack Table (Client Component)
│   │   ├── new/
│   │   │   ├── page.tsx
│   │   │   └── ObligationForm.tsx
│   │   └── [id]/
│   │       ├── page.tsx     # Obligation detail
│   │       ├── edit/
│   │       │   ├── page.tsx
│   │       │   └── ObligationEditForm.tsx
│   │       ├── attest/
│   │       │   ├── page.tsx
│   │       │   └── AttestationForm.tsx
│   │       └── evidence/upload/
│   │           ├── page.tsx
│   │           └── EvidenceUploadForm.tsx
└── api/compliance/
    ├── escalate/
    │   └── route.ts         # POST endpoint for pg_cron/scheduler
    └── evidence/[id]/
        └── route.ts         # GET with integrity check and download
components/
└── compliance/
    ├── ComplianceStatCard.tsx      # Dashboard stat card (Component 31)
    ├── EvidenceDropZone.tsx        # Drag-and-drop upload with SHA-256 UI (Component 32)
    ├── EvidenceFileRow.tsx         # Evidence list row (Component 33)
    ├── AttestationRow.tsx          # Attestation history row (Component 34)
    ├── ObligationStatusSelect.tsx  # Inline status select (Component 35)
    └── ObligationFilterBar.tsx     # Framework/status/owner filters (Component 36)
supabase/migrations/
├── 20260522000020_compliance_schema.sql   # Enums, tables, indexes
├── 20260522000021_compliance_rls.sql      # RLS policies for 3 tables + Storage bucket
└── 20260522000022_compliance_triggers.sql # audit.attach_audit_trigger() for 3 tables
```

### Pattern 1: Supabase Storage RLS with Institution Path Prefix

**What:** RLS policies on `storage.objects` that scope SELECT and INSERT to a path prefix matching the authenticated user's `institution_id` from their JWT.

**When to use:** Any evidence file operation on the `compliance-evidence` bucket.

**SQL:**
```sql
-- Source: supabase.com/docs/guides/storage/security/access-control
-- [CITED: https://supabase.com/docs/guides/storage/security/access-control]

-- The compliance-evidence bucket must be created as private
insert into storage.buckets (id, name, public) values ('compliance-evidence', 'compliance-evidence', false);

-- SELECT: user can read files in their institution's prefix
create policy "compliance_evidence_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'compliance-evidence'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'institution_id')
);

-- INSERT: user can upload files in their institution's prefix
create policy "compliance_evidence_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'compliance-evidence'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'institution_id')
  and (select public.active_role()) in ('admin', 'compliance_officer')
);
```

**Critical note:** `auth.jwt() ->> 'institution_id'` reads from the JWT payload. Verify this matches how `institution_id` is embedded in the token (the Phase 1 custom hook uses `app_metadata.institution_id`). The claim path may need to be `(select auth.jwt() -> 'app_metadata' ->> 'institution_id')` — check the Phase 1 custom access token hook.

### Pattern 2: Browser-Side SHA-256 with Web Crypto API

**What:** Compute SHA-256 in a Client Component before form submission; display hash for user transparency; pass as hidden field.

**When to use:** `EvidenceDropZone.tsx` after file selection.

```typescript
// Source: [CITED: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest]
// Baseline Widely available — supported since January 2020

export async function computeSHA256Browser(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  // Returns 64-char lowercase hex string, identical format to lib/files/checksum.ts computeSHA256()
}
```

**Key constraint:** `crypto.subtle` is only available in secure contexts (HTTPS). Localhost is treated as secure. No issues in Vercel deployment.

### Pattern 3: Server Action File Upload with Overwrite Prevention

**What:** FormData Server Action that receives a File, validates MIME type and size, constructs immutable path, checks for collision, uploads to Supabase Storage, and inserts evidence record.

**When to use:** `uploadEvidence` Server Action in `lib/compliance/actions.ts`.

```typescript
// Source: [VERIFIED: codebase — lib/risk/actions.ts pattern + lib/files/checksum.ts]
'use server'

import { computeFileHash } from '@/lib/files/checksum'
import { createClient } from '@/lib/supabase/server'

export async function uploadEvidence(formData: FormData): Promise<ActionResult> {
  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided.' }

  // Validate MIME type and size (Zod schema validates this too)
  if (file.size > 25 * 1024 * 1024) return { error: 'File size exceeds the 25 MB limit.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized.' }

  const appMeta = user.app_metadata as Record<string, string>
  const institutionId = appMeta?.institution_id
  const obligationId = formData.get('obligation_id') as string
  const clientHash = formData.get('sha256_hash') as string  // From hidden field

  // Server re-computes hash — never trust client-provided hash without verification
  const serverHash = await computeFileHash(file)
  if (serverHash !== clientHash) return { error: 'Checksum mismatch. File may have been modified during upload.' }

  const ext = file.name.split('.').pop() ?? 'bin'
  const epoch = Date.now()
  const hashPrefix = serverHash.slice(0, 16)
  const storagePath = `${institutionId}/${obligationId}/${epoch}_${hashPrefix}.${ext}`

  // Overwrite prevention: check if path already exists
  const { data: existing } = await supabase.storage
    .from('compliance-evidence')
    .list(`${institutionId}/${obligationId}`, { search: `${epoch}_${hashPrefix}.${ext}` })

  if (existing && existing.length > 0) {
    return { error: 'Evidence file already exists; upload a new version.' }
  }

  const { error: uploadError } = await supabase.storage
    .from('compliance-evidence')
    .upload(storagePath, file, { upsert: false })  // upsert: false enforces no-overwrite at storage layer too

  if (uploadError) return { error: 'Unable to upload evidence. Check your connection and try again.' }

  const { data, error } = await supabase
    .from('obligation_evidence')
    .insert({
      institution_id: institutionId,
      obligation_id: obligationId,
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: file.type,
      file_size_bytes: file.size,
      sha256_hash: serverHash,
      uploaded_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: GENERIC_ERROR }
  return { data: { id: data.id } }
}
```

**Critical:** The `upsert: false` in `supabase.storage.upload()` causes an error if the file already exists — providing a second layer of overwrite protection alongside the application-level check.

### Pattern 4: Download Route Handler with Integrity Verification

**What:** GET Route Handler that fetches a file from private Supabase Storage, re-computes SHA-256, compares to stored hash, and returns the file as an attachment (or 409 on mismatch).

**When to use:** `app/api/compliance/evidence/[id]/route.ts`.

```typescript
// Source: [VERIFIED: codebase — app/api/audit/export/route.ts pattern + lib/files/checksum.ts]
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyChecksum } from '@/lib/files/checksum'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const appMeta = user.app_metadata as Record<string, string>
  const activeRole = appMeta?.active_role
  if (!activeRole || !VIEW_ROLES.includes(activeRole)) {
    return new Response('Forbidden', { status: 403 })
  }

  // Fetch evidence record (RLS enforces institution_id scoping)
  const { data: evidence, error: dbError } = await supabase
    .from('obligation_evidence')
    .select('storage_path, sha256_hash, original_filename, mime_type')
    .eq('id', params.id)
    .single()

  if (dbError || !evidence) return new Response('Not found', { status: 404 })

  // Download from private bucket (uses authenticated supabase client)
  const { data: blob, error: storageError } = await supabase.storage
    .from('compliance-evidence')
    .download(evidence.storage_path)

  if (storageError || !blob) return new Response('Storage error', { status: 500 })

  const bytes = Buffer.from(await blob.arrayBuffer())

  // Re-compute SHA-256 and verify integrity
  const isValid = verifyChecksum(bytes, evidence.sha256_hash)

  if (!isValid) {
    return Response.json(
      { error: 'integrity_check_failed', message: 'File checksum mismatch — evidence may have been modified.' },
      { status: 409 }
    )
  }

  return new Response(bytes, {
    headers: {
      'Content-Type': evidence.mime_type,
      'Content-Disposition': `attachment; filename="${evidence.original_filename}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
```

### Pattern 5: Escalation API Route with CRON_SECRET Guard

**What:** POST Route Handler that is callable by pg_cron (via pg_net) or an external scheduler. Validates a shared secret header before executing escalation logic.

**When to use:** `app/api/compliance/escalate/route.ts`.

```typescript
// Source: [VERIFIED: codebase — lib/risk/actions.ts escalation pattern]
// CRON_SECRET stored in Vercel env vars; same secret configured in pg_cron job

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }
  // ... escalation logic from lib/compliance/escalation.ts
}
```

**pg_cron setup SQL** (run in Supabase SQL editor once):
```sql
-- Source: [CITED: https://supabase.com/docs/guides/database/extensions/pg_cron]
select cron.schedule(
  'compliance-escalation-daily',
  '0 8 * * *',  -- Every day at 08:00 UTC
  $$
  select net.http_post(
    url := 'https://your-app.vercel.app/api/compliance/escalate',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);
```

**Required extensions:** `pg_cron` and `pg_net` must both be enabled in the Supabase project. They are available on all Supabase plans. Enable via `create extension pg_net;` if not already present.

### Pattern 6: Append-Only Attestation Insert

**What:** Server Action that inserts a new attestation row (never updates) and then updates the obligation status to match.

**When to use:** `attestObligation` Server Action in `lib/compliance/actions.ts`.

```typescript
// Source: [VERIFIED: codebase — lib/risk/actions.ts update pattern]
export async function attestObligation(
  obligationId: string,
  values: AttestationInput,
): Promise<ActionResult> {
  const context = await getWriteContext(['admin', 'ceo', 'compliance_officer'])
  if ('error' in context) return { error: context.error }

  // Insert new attestation row (append-only — no update/delete)
  const { data, error: attestError } = await context.supabase
    .from('obligation_attestations')
    .insert({
      institution_id: context.institutionId,
      obligation_id: obligationId,
      attestation_status: values.attestation_status,
      attested_by: context.user.id,
      // attested_at: omitted — DB default is now(); never trust client timestamps
      notes: values.notes ?? null,
    })
    .select('id')
    .single()

  if (attestError) return { error: GENERIC_ERROR }

  // Map attestation_status to obligation_status (same value labels apply)
  await context.supabase
    .from('compliance_obligations')
    .update({ status: values.attestation_status, updated_at: new Date().toISOString() })
    .eq('id', obligationId)

  revalidateCompliancePaths(obligationId)
  return { data: { id: data.id } }
}
```

### Pattern 7: Dashboard Three-Query Server Component

**What:** Compliance posture dashboard queries — all three run in parallel with `Promise.all()`.

**When to use:** `app/(protected)/compliance/page.tsx`.

```typescript
// Source: [VERIFIED: codebase — app/(protected)/risk/page.tsx pattern]
export const dynamic = 'force-dynamic'

// Query 1: Status distribution
const { data: obligations } = await supabase
  .from('compliance_obligations')
  .select('status')

// Query 2: Overdue count
const today = new Date().toISOString().slice(0, 10)
const { count: overdueCount } = await supabase
  .from('compliance_obligations')
  .select('*', { count: 'exact', head: true })
  .lt('due_date', today)
  .not('status', 'in', '("compliant","waived")')

// Query 3: Expiring within 30 days
const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const { count: expiringCount } = await supabase
  .from('compliance_obligations')
  .select('*', { count: 'exact', head: true })
  .gte('due_date', today)
  .lte('due_date', thirtyDaysFromNow)
  .not('status', 'in', '("compliant","waived")')
```

### Anti-Patterns to Avoid

- **Trust client SHA-256 without re-verification:** The server MUST re-compute the hash from the actual received file bytes. Client hash is for UX transparency only. Never write a hash to the database that was not verified server-side.
- **Direct Supabase Storage URL sharing:** Evidence files are in a private bucket. Never expose the storage URL directly. Always serve via the download Route Handler which performs the integrity check.
- **Updating attestation rows:** `obligation_attestations` is append-only. Never add UPDATE or DELETE to the RLS policies. Each attestation is a permanent record.
- **Server-side `attested_at` bypass:** Never accept `attested_at` from the client. Always use `default now()` in the DB or `new Date().toISOString()` in the Server Action. D-18 explicitly requires server-side timestamp locking.
- **Skipping `upsert: false`:** The default Supabase storage upload allows overwriting. Always pass `{ upsert: false }` to enforce immutability at the storage layer.
- **Using `getSession()` in Route Handlers:** Use `supabase.auth.getUser()` — same as all prior phases. `getSession()` does not validate the JWT.
- **Missing `export const dynamic = 'force-dynamic'`:** All compliance pages with live data must prevent ISR caching. This is a project-wide requirement.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SHA-256 on server | Custom hash logic | `lib/files/checksum.ts` `computeSHA256()` / `verifyChecksum()` | Already implemented; uses timing-safe comparison to prevent timing attacks |
| SHA-256 in browser | npm hash library | `crypto.subtle.digest('SHA-256', buffer)` | Browser-native since 2020; baseline widely available; no bundle cost |
| File MIME validation | Manual file type sniffing | Zod enum in `lib/schemas/compliance.ts` + HTML `accept` attribute | Zod validates at server boundary; `accept` gives client-side UX hint |
| File size enforcement | Manual byte counting | `file.size > MAX_SIZE` check in Server Action + Zod schema | Simple comparison; no library needed |
| Email delivery | Nodemailer/SMTP | `resend` (already installed) | Established Phase 3 pattern; production-grade with deliverability tracking |
| Overwrite prevention | File versioning logic | Deterministic path (D-10) + `upsert: false` | Path is unique by design (timestamp + hash); storage layer enforces no-overwrite |
| Overdue date calculation | Custom date arithmetic | `date-fns` `isPast()`, `addDays()`, `differenceInDays()` | Already installed; battle-tested edge case handling |
| Append-only table enforcement | Application-only logic | Postgres RLS (no UPDATE policy on `obligation_attestations`) | DB-level guarantee; survives application bugs |
| Scheduled job timing | Custom scheduler/cron | Supabase pg_cron + pg_net | Native Postgres scheduling; no external dependency |

**Key insight:** Phase 4 has no novel dependencies. Every technical problem in this phase is solved by something already in the codebase or the native platform. The research confirms: do not introduce new npm packages.

---

## Migration Numbering — Critical Correction

**D-08 in CONTEXT.md states migrations start at `20260522000016`.**

**This is incorrect.** The actual disk state as of research:
- `20260522000016_sync_raw_app_meta_data.sql` — **already exists**
- `20260522000017_risk_schema.sql` — already exists (Phase 3)
- `20260522000018_risk_rls.sql` — already exists (Phase 3)
- `20260522000019_risk_triggers.sql` — already exists (Phase 3)

**Phase 4 migrations MUST start at `20260522000020`:**

| File | Contents |
|------|----------|
| `20260522000020_compliance_schema.sql` | Enums (`regulatory_framework`, `obligation_status`, `attestation_status`) + tables + indexes + Storage bucket creation |
| `20260522000021_compliance_rls.sql` | RLS on `compliance_obligations`, `obligation_evidence`, `obligation_attestations` + Storage RLS policies |
| `20260522000022_compliance_triggers.sql` | `audit.attach_audit_trigger()` for all three tables |

---

## Common Pitfalls

### Pitfall 1: JWT `institution_id` Claim Path in Storage RLS

**What goes wrong:** Storage RLS policy uses `auth.jwt() ->> 'institution_id'` but the claim is nested under `app_metadata` in the Phase 1 custom access token hook.

**Why it happens:** Supabase's JWT has a flat top-level and a nested `app_metadata` object. The `institution_id` in this project is stored in `app_metadata`, making it `auth.jwt() -> 'app_metadata' ->> 'institution_id'`.

**How to avoid:** Verify the correct path by checking `supabase/migrations/20260522000005_custom_access_token_hook.sql`. Use `(select auth.jwt() -> 'app_metadata' ->> 'institution_id')` in Storage RLS policies to match how Phase 1 SQL helpers work. Alternatively, use `(select public.institution_id())` if that helper is usable in `storage.objects` context — verify this works before using it.

**Warning signs:** Storage uploads succeed but SELECT policy fails to return files; or vice versa.

### Pitfall 2: Next.js Server Action File Upload Size Limit

**What goes wrong:** Files larger than ~1MB fail with a body size error before reaching the Server Action.

**Why it happens:** Next.js imposes a default body size limit on Server Actions [CITED: medium.com/@olliedoesdev/signed-url-file-uploads-with-nextjs-and-supabase-74ba91b65fe0]. Files up to 25MB need a higher limit.

**How to avoid:** Add to `next.config.js` (or `next.config.ts`):
```js
experimental: {
  serverActions: {
    bodySizeLimit: '26mb', // 25MB file + overhead
  }
}
```

**Warning signs:** Upload fails silently for files over 1MB; smaller files succeed.

### Pitfall 3: `upsert: true` Allows Evidence Overwriting

**What goes wrong:** Calling `supabase.storage.from(...).upload(path, file)` without `{ upsert: false }` allows overwriting an existing file at the same path.

**Why it happens:** Supabase Storage's default is to error on collision; however, if `upsert: true` is accidentally set (common copy-paste from other contexts), existing evidence files are silently overwritten.

**How to avoid:** Always explicitly pass `{ upsert: false }` in the upload call. The application-level path collision check (D-12) is the first guard; `upsert: false` is the second guard at the storage layer.

**Warning signs:** Evidence with the same timestamp and hash prefix can be uploaded twice without error.

### Pitfall 4: Attestation Timestamp Accepts Client-Provided Value

**What goes wrong:** Developer passes `attested_at` from form data into the insert, allowing users to backdating attestations.

**Why it happens:** Copying the pattern from other fields and including `attested_at` in the form payload.

**How to avoid:** `attested_at` must NEVER appear in the insert payload — let the DB column default `default now()` handle it, or use `new Date().toISOString()` inside the Server Action. The column must have `NOT NULL DEFAULT now()` in the schema.

**Warning signs:** Regulatory audit shows attestation timestamps that don't match audit trail `occurred_at`.

### Pitfall 5: `obligation_status` vs `attestation_status` Enum Confusion

**What goes wrong:** Mixing up the two status enums. `obligation_status` has 6 values (`pending`, `compliant`, `partially_compliant`, `non_compliant`, `overdue`, `waived`). `attestation_status` has only 3 (`compliant`, `partially_compliant`, `non_compliant`). The `overdue` and `waived` states are NOT attestable — they are system-set.

**How to avoid:** `obligation_status` and `attestation_status` are separate Postgres enums. The attestation form uses a radio group with only 3 options. When updating `compliance_obligations.status` after attestation, cast `attestation_status` to the matching `obligation_status` value (they share the same 3 label strings). `overdue` is only set by the escalation cron route.

**Warning signs:** TypeScript errors when inserting `obligation_status` where `attestation_status` is expected, or vice versa.

### Pitfall 6: `crypto.subtle` Not Available in Non-Secure Contexts

**What goes wrong:** SHA-256 computation fails in development on HTTP.

**Why it happens:** Web Crypto API's `crypto.subtle` requires a secure context (HTTPS or localhost).

**How to avoid:** `localhost` is treated as a secure context by all modern browsers, so local development is fine. Vercel always serves HTTPS in production. No special handling needed. Document this so developers don't debug spurious "not available" errors.

**Warning signs:** `TypeError: Cannot read properties of undefined (reading 'digest')` — only seen on custom HTTP dev domains, not localhost.

### Pitfall 7: `compliance_officer` Role Hyphen vs Underscore

**What goes wrong:** The existing `AppRole` type in `types/auth.ts` uses hyphen-separated role names (`risk-officer`, `audit-officer`, `board-member`, `dept-head`). CONTEXT.md D-20 writes `compliance_officer` with an underscore.

**Why it happens:** CONTEXT.md D-20 uses underscore convention for the new role name.

**How to avoid:** Before implementing role checks in Server Actions, verify whether `compliance_officer` (underscore) or `compliance-officer` (hyphen) is used in the JWT `active_role` claim. Check `supabase/migrations/20260522000001_base_schema.sql` for the `app_role` or `user_role` enum definition. The `types/auth.ts` `AppRole` type must be updated to include the new role. Use whatever convention the existing enum uses.

**Warning signs:** Role check `active_role === 'compliance_officer'` never matches because the JWT claim is `'compliance-officer'`.

---

## Code Examples

### Verified Patterns from Codebase

#### Migration: Compliance Schema (mirrors Phase 3 risk schema)
```sql
-- Source: [VERIFIED: codebase — supabase/migrations/20260522000017_risk_schema.sql]
create type public.regulatory_framework as enum (
  'pecoga', 'ppdpa', 'nds2', 'iso_37000', 'king_iv', 'ipsas', 'pfma', 'other'
);

create type public.obligation_status as enum (
  'pending', 'compliant', 'partially_compliant', 'non_compliant', 'overdue', 'waived'
);

create type public.attestation_status as enum (
  'compliant', 'partially_compliant', 'non_compliant'
);

create table public.compliance_obligations (
  id                  uuid primary key default gen_random_uuid(),
  institution_id      uuid not null references public.institutions(id) on delete restrict,
  framework           public.regulatory_framework not null,
  framework_reference text,
  title               text not null,
  description         text,
  owner_id            uuid references auth.users(id) on delete set null,
  due_date            date not null,
  status              public.obligation_status not null default 'pending',
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.obligation_evidence (
  id                  uuid primary key default gen_random_uuid(),
  institution_id      uuid not null references public.institutions(id) on delete restrict,
  obligation_id       uuid not null references public.compliance_obligations(id) on delete cascade,
  storage_path        text not null,
  original_filename   text not null,
  mime_type           text not null,
  file_size_bytes     bigint not null,
  sha256_hash         text not null,
  uploaded_by         uuid references auth.users(id) on delete set null,
  uploaded_at         timestamptz not null default now()
);

create table public.obligation_attestations (
  id                  uuid primary key default gen_random_uuid(),
  institution_id      uuid not null references public.institutions(id) on delete restrict,
  obligation_id       uuid not null references public.compliance_obligations(id) on delete cascade,
  attestation_status  public.attestation_status not null,
  attested_by         uuid not null references auth.users(id) on delete restrict,
  attested_at         timestamptz not null default now(),
  notes               text
);
```

#### Migration: Compliance RLS (mirrors Phase 3 risk RLS)
```sql
-- Source: [VERIFIED: codebase — supabase/migrations/20260522000018_risk_rls.sql]
alter table public.compliance_obligations enable row level security;
alter table public.compliance_obligations force row level security;

create policy "compliance_obligations_select" on public.compliance_obligations
  for select to authenticated
  using (institution_id = (select public.institution_id()));

create policy "compliance_obligations_insert" on public.compliance_obligations
  for insert to authenticated
  with check (
    institution_id = (select public.institution_id())
    and (select public.active_role()) in ('admin', 'compliance_officer')
  );

create policy "compliance_obligations_update" on public.compliance_obligations
  for update to authenticated
  using (institution_id = (select public.institution_id()))
  with check (
    institution_id = (select public.institution_id())
    and (select public.active_role()) in ('admin', 'compliance_officer')
  );

-- obligation_evidence: SELECT includes additional roles (ceo, audit-officer, board-member)
-- obligation_attestations: INSERT-only for attested_by roles; no UPDATE or DELETE

-- obligation_attestations: NO UPDATE policy — append-only is enforced by omission
alter table public.obligation_attestations enable row level security;
alter table public.obligation_attestations force row level security;

create policy "obligation_attestations_select" on public.obligation_attestations
  for select to authenticated
  using (institution_id = (select public.institution_id()));

create policy "obligation_attestations_insert" on public.obligation_attestations
  for insert to authenticated
  with check (
    institution_id = (select public.institution_id())
    and (select public.active_role()) in ('admin', 'ceo', 'compliance_officer')
  );
-- No UPDATE, no DELETE policy — intentional for append-only audit trail
```

#### Migration: Compliance Audit Triggers
```sql
-- Source: [VERIFIED: codebase — supabase/migrations/20260522000019_risk_triggers.sql]
select audit.attach_audit_trigger('compliance_obligations');
select audit.attach_audit_trigger('obligation_evidence');
select audit.attach_audit_trigger('obligation_attestations');
```

#### Zod Schema: Compliance Forms
```typescript
// Source: [VERIFIED: codebase — lib/schemas/risk.ts pattern]
// lib/schemas/compliance.ts
import { z } from 'zod'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'image/jpeg',
  'image/png',
] as const

export const obligationSchema = z.object({
  framework: z.enum(['pecoga', 'ppdpa', 'nds2', 'iso_37000', 'king_iv', 'ipsas', 'pfma', 'other']),
  framework_reference: z.string().optional(),
  title: z.string().min(1, 'Obligation title is required.'),
  description: z.string().optional(),
  owner_id: z.string().uuid('Obligation owner is required.'),
  due_date: z.string().min(1, 'Due date is required.'),
}).refine(
  (data) => data.framework !== 'other' || (data.framework_reference && data.framework_reference.length > 0),
  { message: 'Regulation reference is required when framework is set to Other.', path: ['framework_reference'] }
)

export const attestationSchema = z.object({
  attestation_status: z.enum(['compliant', 'partially_compliant', 'non_compliant'], {
    errorMap: () => ({ message: 'Please select a compliance status to record this attestation.' }),
  }),
  notes: z.string().optional(),
})

export const evidenceUploadSchema = z.object({
  obligation_id: z.string().uuid(),
  sha256_hash: z.string().length(64, 'SHA-256 hash must be 64 characters.').regex(/^[a-f0-9]+$/, 'Invalid checksum.'),
  mime_type: z.enum(ALLOWED_MIME_TYPES, { errorMap: () => ({ message: 'File type not accepted.' }) }),
  file_size_bytes: z.number().max(25 * 1024 * 1024, 'File size exceeds the 25 MB limit.'),
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Storing computed SHA-256 in filename only | Full 64-char hash in DB column + first-16 in filename | Phase 4 decision | DB column enables exact server-side verification; filename is human-readable hint |
| Trust client-provided file hash | Server re-computes on upload AND on download | Phase 4 decision | Two-point verification chain; TRAIL-04 requirement |
| External cron service (Vercel Cron, etc.) | Supabase pg_cron + pg_net for HTTP webhook | Established pattern | No Vercel Pro plan required for cron; self-contained in Supabase |
| Writable evidence records | Append-only `obligation_evidence` table (no UPDATE/DELETE RLS policy) | Phase 4 design | Regulatory compliance; prevents tampering with audit chain |

**Deprecated/outdated:**
- Zod v4 APIs: Not available — Zod v3 is the hard constraint per CLAUDE.md. Do not use `.transform()` changes or any v4-specific syntax.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `compliance_officer` uses underscore (not hyphen) for the AppRole value | Pitfall 7, all role checks | All RBAC checks fail silently; no user can attest or upload evidence |
| A2 | Storage RLS uses `auth.jwt() -> 'app_metadata' ->> 'institution_id'` for the path prefix (not flat `auth.jwt() ->> 'institution_id'`) | Pattern 1 (Storage RLS) | Storage uploads fail with 403; evidence cannot be stored |
| A3 | `pg_net` extension is enabled in the Supabase project | Pattern 5 (escalation cron) | pg_cron HTTP call fails; escalation requires manual trigger |
| A4 | `next.config` `serverActions.bodySizeLimit` is not already set to a non-default value | Pitfall 2 | May need to increase to 26MB if not already set; existing value could conflict |
| A5 | `public.institution_id()` SQL helper is NOT usable in `storage.objects` RLS context (different schema) | Pattern 1 (Storage RLS) | If the helper IS usable, the RLS can be simplified; if not, must use raw JWT claim |

---

## Open Questions

1. **`compliance_officer` role value: hyphen or underscore?**
   - What we know: Existing roles use hyphens (`risk-officer`, `audit-officer`). CONTEXT.md D-20 writes `compliance_officer` with underscore.
   - What's unclear: Whether to follow existing hyphen convention or CONTEXT.md underscore.
   - Recommendation: Check `supabase/migrations/20260522000001_base_schema.sql` for the `app_role` enum definition before implementing any Server Action role checks. Add to `types/auth.ts` `AppRole` type immediately.

2. **Storage bucket creation: SQL migration vs Supabase Dashboard?**
   - What we know: Storage buckets can be created via SQL (`insert into storage.buckets`) or via the Supabase dashboard.
   - What's unclear: Which approach is canonical for this project.
   - Recommendation: Create the bucket in the SQL migration (`20260522000020_compliance_schema.sql`) for reproducibility. Supabase automatically applies migrations in sequence.

3. **`CRON_SECRET` environment variable: new or reuse existing?**
   - What we know: Phase 3 escalation uses `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. No CRON_SECRET exists yet.
   - What's unclear: Whether a CRON_SECRET env var needs to be documented as a new dependency.
   - Recommendation: Add `CRON_SECRET` to `.env.local.example` and Vercel env vars documentation. The planner should include this as a Wave 0 setup task.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase Storage | Evidence file upload | ✓ | Native Supabase feature | — |
| `pg_cron` extension | Escalation cron | ✓ (available on all Supabase plans) [ASSUMED] | — | External scheduler (Vercel Cron, GitHub Actions schedule) |
| `pg_net` extension | pg_cron HTTP webhook | ✓ (available on all Supabase plans) [ASSUMED] | — | Call escalation route manually; use Vercel Cron instead |
| `crypto.subtle` (browser) | SHA-256 client-side | ✓ (baseline widely available) | Web platform standard | — |
| `Node.js crypto` (server) | SHA-256 server-side | ✓ | Node.js built-in | `lib/files/checksum.ts` already uses it |
| `resend` | Escalation emails | ✓ | ^6.12.3 | — |
| `RESEND_API_KEY` env var | Escalation emails | ✓ (set in tests/setup.ts) [ASSUMED in production] | — | Emails silently skipped if key missing |
| `RESEND_FROM_EMAIL` env var | Escalation emails | ✓ [ASSUMED] | — | Emails fail if not set |
| `CRON_SECRET` env var | Escalation route auth | ✗ — needs to be added | — | Must add before escalation goes live |

**Missing dependencies with no fallback:**
- `CRON_SECRET` — must be added to Vercel env vars and `.env.local` before the escalation route is functional.

**Missing dependencies with fallback:**
- `pg_net` — if not enabled, Vercel Cron (free tier: 2 cron jobs) is a viable fallback to call `/api/compliance/escalate`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.7 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npm run test` (vitest run) |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMP-01 | Obligation CRUD Server Actions validate input and enforce RBAC | unit | `npm run test -- lib/compliance/compliance-utils.test.ts` | ❌ Wave 0 |
| COMP-02 | Evidence upload validates MIME type, size, and SHA-256 | unit | `npm run test -- lib/schemas/compliance.test.ts` | ❌ Wave 0 |
| COMP-03 | Immutable filename construction produces deterministic path | unit | `npm run test -- lib/compliance/compliance-utils.test.ts` | ❌ Wave 0 |
| COMP-03 | SHA-256 browser computation returns correct 64-char hex | unit | `npm run test -- lib/files/checksum.test.ts` | ❌ Wave 0 |
| COMP-04 | Attestation schema rejects invalid status values | unit | `npm run test -- lib/schemas/compliance.test.ts` | ❌ Wave 0 |
| COMP-05 | Posture dashboard queries (overdue/expiring counts) return correct values | unit | `npm run test -- lib/compliance/compliance-utils.test.ts` | ❌ Wave 0 |
| COMP-06 | Escalation threshold date logic identifies correct obligations | unit | `npm run test -- lib/compliance/compliance-utils.test.ts` | ❌ Wave 0 |
| TRAIL-04 | SHA-256 server-side verification — `verifyChecksum()` returns false on tampered data | unit | `npm run test -- lib/files/checksum.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `lib/compliance/compliance-utils.test.ts` — covers COMP-01, COMP-03, COMP-05, COMP-06
- [ ] `lib/schemas/compliance.test.ts` — covers COMP-02, COMP-04
- [ ] `lib/files/checksum.test.ts` — covers COMP-03 (server SHA-256) and TRAIL-04 (tamper detection)

*(Existing test infrastructure in `vitest.config.ts` and `tests/setup.ts` is sufficient — no new framework setup needed.)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `supabase.auth.getUser()` in all Route Handlers and Server Actions (never `getSession()`) |
| V3 Session Management | yes (inherited) | Phase 1 cookie-based session management; no changes |
| V4 Access Control | yes | JWT `active_role` check in Server Actions; RLS `active_role()` SQL helper in DB policies |
| V5 Input Validation | yes | Zod v3 schemas for all form inputs; MIME type enum; file size check |
| V6 Cryptography | yes | `crypto.subtle.digest` (browser); `crypto.timingSafeEqual` in `verifyChecksum()` (server) |
| V10 Malicious Code (file upload) | yes | MIME type allowlist in Zod; file extension from original filename only (not path traversal) |

### Known Threat Patterns for Compliance Evidence Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Evidence file tampering (storage-layer) | Tampering | SHA-256 re-verification on every download via `verifyChecksum()` |
| Evidence overwrite via re-upload | Tampering | Deterministic immutable path (D-10) + `upsert: false` + application collision check (D-12) |
| Cross-institution evidence access | Information Disclosure | Storage RLS: path prefix = institution_id from JWT; `obligation_evidence` RLS with `institution_id` filter |
| Backdated attestation timestamp | Repudiation | Server-side `now()` timestamp — `attested_at` never accepted from client |
| Unauthorized attestation (wrong role) | Elevation of Privilege | Server Action role check (admin/ceo/compliance_officer only); RLS INSERT policy mirrors it |
| Cron endpoint abuse (trigger escalation spam) | DoS / Information Disclosure | `CRON_SECRET` header check in `escalate/route.ts` — unauthenticated POST returns 401 |
| Stored hash display in UI | Information Disclosure | SHA-256 hash is not secret — it is a public integrity fingerprint. Display is intentional per TRAIL-04. Not a vulnerability. |
| Path traversal via filename | Tampering | Storage path is always constructed server-side from `institution_id + obligation_id + epoch + hash` — original filename is never used in the path, only stored as `original_filename` metadata |

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: codebase — lib/risk/actions.ts] — Server Action pattern, role check, Resend email structure, revalidatePath
- [VERIFIED: codebase — lib/files/checksum.ts] — SHA-256 server-side compute/verify already implemented
- [VERIFIED: codebase — supabase/migrations/20260522000017_risk_schema.sql] — Migration schema pattern
- [VERIFIED: codebase — supabase/migrations/20260522000018_risk_rls.sql] — RLS policy pattern
- [VERIFIED: codebase — supabase/migrations/20260522000019_risk_triggers.sql] — Audit trigger attachment
- [VERIFIED: codebase — app/api/audit/export/route.ts] — Route Handler auth + Response pattern
- [VERIFIED: codebase — package.json] — All dependency versions
- [VERIFIED: migration file listing] — Last migration is 20260522000019; Phase 4 starts at 20260522000020
- [CITED: supabase.com/docs/guides/storage/security/access-control] — Storage RLS `storage.foldername()` helper, INSERT/SELECT policy patterns
- [CITED: supabase.com/docs/guides/storage/schema/helper-functions] — `storage.foldername()` returns array; index [1] for first segment
- [CITED: developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest] — SHA-256 via `crypto.subtle.digest`, returns ArrayBuffer, baseline widely available since Jan 2020
- [CITED: codeconcisely.com/posts/nextjs-app-router-api-download-file] — Next.js 14 Route Handler with `new Response(buffer, { headers })` pattern for file download
- [CITED: supabase.com/docs/guides/storage/serving/downloads] — `supabase.storage.from().download()` returns Blob; `await blob.arrayBuffer()` for bytes

### Secondary (MEDIUM confidence)

- [CITED: supabase.com/docs/guides/database/extensions/pg_cron] — pg_cron extension SQL; `cron.schedule()` function; daily cron syntax `'0 8 * * *'`; use with pg_net for HTTP webhook
- [WebSearch verified] — Supabase Storage private bucket + signed URLs pattern; `upsert: false` behavior

### Tertiary (LOW confidence)

- [ASSUMED] — `pg_net` extension available in Supabase project (needs verification in project dashboard)
- [ASSUMED] — `compliance_officer` role name uses underscore convention (must verify against DB enum)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json; no new installs needed
- Architecture: HIGH — all patterns directly verified against existing codebase (Phase 3 mirror)
- Migration numbering: HIGH — verified by listing actual disk files; D-08 correction documented
- Storage RLS: HIGH — verified via official Supabase docs
- SHA-256 Web Crypto: HIGH — verified via MDN; already implemented server-side in codebase
- Download Route Handler: HIGH — verified via codebase pattern and official Next.js docs
- Escalation API route / pg_cron: MEDIUM — pattern verified via search; pg_net availability assumed
- Role name convention (compliance_officer vs compliance-officer): LOW — must check DB enum before implementation

**Research date:** 2026-05-23
**Valid until:** 2026-06-23 (30 days; stable stack)
