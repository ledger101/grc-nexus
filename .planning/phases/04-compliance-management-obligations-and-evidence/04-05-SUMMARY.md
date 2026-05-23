---
phase: 04-compliance-management-obligations-and-evidence
plan: 05
subsystem: compliance-ui-detail
tags: [server-component, client-component, file-upload, web-crypto, attestation, evidence, sha-256, react-hook-form, zod]
dependency_graph:
  requires:
    - 04-01  # compliance schema, types, Zod schemas, compliance-utils
    - 04-02  # Server Actions (attestObligation, uploadEvidence, updateObligation), query helpers
    - 04-03  # /api/compliance/evidence/[id] download route (EvidenceFileRow links to it)
    - 04-04  # ObligationForm pattern (ObligationEditForm mirrors it)
  provides:
    - Obligation detail Server Component with parallel queries and two-column layout
    - EvidenceFileRow component with API-route download link and SHA-256 hash display
    - AttestationRow component with status badge, attested-by, timestamp, and audit badge
    - ObligationEditForm with updateObligation Server Action
    - AttestationForm with three radio cards and digital signature notice
    - EvidenceUploadForm with browser SHA-256 via Web Crypto API and drag-drop zone
  affects:
    - app/(protected)/compliance/obligations/[id]/page.tsx
    - app/(protected)/compliance/obligations/[id]/edit/page.tsx
    - app/(protected)/compliance/obligations/[id]/edit/ObligationEditForm.tsx
    - app/(protected)/compliance/obligations/[id]/attest/page.tsx
    - app/(protected)/compliance/obligations/[id]/attest/AttestationForm.tsx
    - app/(protected)/compliance/obligations/[id]/evidence/upload/page.tsx
    - app/(protected)/compliance/obligations/[id]/evidence/upload/EvidenceUploadForm.tsx
    - components/compliance/EvidenceFileRow.tsx
    - components/compliance/AttestationRow.tsx
tech_stack:
  added: []
  patterns:
    - Server Component parallel fetch via Promise.all (three queries)
    - Browser SHA-256 via window.crypto.subtle.digest — no external hash library
    - FormData-based upload client (fd.append not values) matching Server Action signature
    - Radio card pattern with sr-only input + visible styled label for keyboard accessibility
    - Conditional role-based UI (ATTEST_ROLES, WRITE_ROLES) at both page-shell and component level
    - Drop zone with idle/dragover/selected/error state machine
    - Submit button disabled until file + 64-char hash + not hashing
key_files:
  created:
    - app/(protected)/compliance/obligations/[id]/page.tsx
    - app/(protected)/compliance/obligations/[id]/edit/page.tsx
    - app/(protected)/compliance/obligations/[id]/edit/ObligationEditForm.tsx
    - app/(protected)/compliance/obligations/[id]/attest/page.tsx
    - app/(protected)/compliance/obligations/[id]/attest/AttestationForm.tsx
    - app/(protected)/compliance/obligations/[id]/evidence/upload/page.tsx
    - app/(protected)/compliance/obligations/[id]/evidence/upload/EvidenceUploadForm.tsx
    - components/compliance/EvidenceFileRow.tsx
    - components/compliance/AttestationRow.tsx
  modified: []
decisions:
  - "attested_at omitted from attestObligation call — only attestation_status and notes are passed; DB default now() is authoritative (D-18, T-4-05-R)"
  - "EvidenceFileRow uses <a href> not <Link> for download — triggers browser file download via API route, not Next.js client navigation"
  - "Drop zone click handler guarded by dropZoneState !== 'selected' to prevent accidental re-trigger of file browser when clicking SHA-256 text"
  - "Attestation radio cards use sr-only hidden input + styled label pattern for full keyboard accessibility without custom ARIA widget"
  - "ATTESTATION_STATUS_LABELS imported from types/compliance.ts (not compliance-utils.ts) — avoids circular dependency"
metrics:
  duration: ~15 minutes
  completed: "2026-05-23"
  tasks_completed: 2
  files_created: 9
  files_modified: 0
---

# Phase 04 Plan 05: Obligation Detail Page, Evidence Upload, and Attestation Form Summary

Obligation detail Server Component with parallel evidence and attestation queries; EvidenceFileRow and AttestationRow sub-components; ObligationEditForm with updateObligation; AttestationForm with radio-card status selector and digital signature notice; EvidenceUploadForm with browser SHA-256 via Web Crypto API and drag-drop zone — all TypeScript-clean.

## What Was Built

### Task 1: Obligation detail page and sub-components (committed `cc94ca6`)

**`app/(protected)/compliance/obligations/[id]/page.tsx`** — Server Component (UI-SPEC Screen 5)
- `export const dynamic = 'force-dynamic'` as first export
- Auth guard with VIEW_ROLES = ['admin', 'ceo', 'compliance-officer', 'risk-officer', 'audit-officer', 'board-member']
- Three parallel queries via `Promise.all([getObligationById, listEvidence, listAttestations])`
- `notFound()` on missing obligation (not redirect — preserves Next.js 404 UX)
- Page header: Playfair Display 28px/600 title, FrameworkBadge, ObligationStatusBadge, owner name, due date (err color if overdue)
- Button row: "Edit Obligation" (outline) always visible; "Attest" (gold, ShieldCheck) only for ATTEST_ROLES
- Overdue `<Alert variant="destructive">` when obligation.status === 'overdue'
- Two-column layout: `grid-cols-1 lg:grid-cols-[1fr_1.2fr]` — single column on mobile
- Evidence card: "Upload Evidence" button only for WRITE_ROLES; empty state with FileX icon
- Attestation card: count badge; empty state with ShieldX icon and "Attest Obligation" button for ATTEST_ROLES
- Attestation list uses `listAttestations` which returns descending order (newest first per D-19)

**`components/compliance/EvidenceFileRow.tsx`** (UI-SPEC Component 33)
- Download via `<a href="/api/compliance/evidence/${id}">` — never direct Supabase Storage URL (key_link maintained)
- MIME-type icon selection: FileImage for jpg/png, FileSpreadsheet for xlsx, FileText for pdf/docx
- SHA-256 displayed in `<code>` element as first 16 chars + "..." with Tooltip showing full 64-char hash
- "Verified" status with CheckCircle icon in `text-ok` color
- `formatFileSize` helper: MB for ≥1MB, KB for smaller files

**`components/compliance/AttestationRow.tsx`** (UI-SPEC Component 34)
- ShieldCheck icon color matched to attestation status (ok/warn/err)
- AttestationStatusBadge from inline ATTESTATION_BADGE record
- "by [name]" + DM Mono timestamp formatted as "[date] at [time]"
- "Audit recorded" small badge (`bg-paper text-navy-mid border-paper-border text-[12px]`)
- Notes rendered as italic navy-900 text when present

**`app/(protected)/compliance/obligations/[id]/edit/page.tsx`**
- WRITE_ROLES guard; redirects to detail page if insufficient role
- Parallel fetch: obligation + user_profiles for owner select
- Renders `<ObligationEditForm obligation={...} users={...} />`

**`app/(protected)/compliance/obligations/[id]/edit/ObligationEditForm.tsx`**
- Mirrors ObligationForm.tsx exactly but calls `updateObligation(obligation.id, values)`
- `defaultValues` pre-populated from obligation prop
- Submit label: "Update Obligation"; Cancel: "Back to Obligation"
- Alert Info above form: "Compliance status is updated through the attestation workflow, not this form."
- Static `ObligationStatusBadge` shown as read-only current status below the info alert

---

### Task 2: Attestation form and evidence upload form (committed `d59508c`)

**`app/(protected)/compliance/obligations/[id]/attest/page.tsx`**
- ATTEST_ROLES guard with page-level redirect (first enforcement layer — T-4-05-S2)
- Passes `obligationId`, `obligationTitle`, `obligationFramework`, `obligationDueDate` to `<AttestationForm>`

**`app/(protected)/compliance/obligations/[id]/attest/AttestationForm.tsx`** — Client Component
- Three radio cards via `ATTESTATION_OPTIONS` array — CheckCircle2/AlertCircle/XCircle icons
- Radio cards use `sr-only` hidden input + styled `<label>` for full keyboard accessibility
- Selected card: `border-gold bg-gold-pale/20`; unselected: `border-paper-border hover:bg-paper/50`
- Context card above form: obligation title + FrameworkBadge + due date in gold-pale/30 background
- Digital signature notice: `<Alert role="note" aria-label="Attestation will be recorded...">` with ShieldCheck
- `onSubmit` calls `attestObligation(obligationId, values)` in `startTransition` — `attested_at` is NOT in `values` (D-18, T-4-05-R)
- Success: `toast.success("Attestation recorded — [status]. Audit entry created.")` then redirect to detail page

**`app/(protected)/compliance/obligations/[id]/evidence/upload/page.tsx`**
- WRITE_ROLES guard with page-level redirect (first enforcement layer — T-4-05-S)
- Passes `obligationId`, `obligationTitle`, `obligationFramework` to `<EvidenceUploadForm>`

**`app/(protected)/compliance/obligations/[id]/evidence/upload/EvidenceUploadForm.tsx`** — Client Component
- Drop zone with four states: idle / dragover / selected / error — each with distinct border+bg treatment
- Drop zone handles both drag-drop (`onDrop`) and click-to-browse (`onClick → fileInputRef.current?.click()`)
- Keyboard accessible: `role="button"`, `tabIndex={0}`, `onKeyDown` handles Enter/Space
- Browser SHA-256: `window.crypto.subtle.digest('SHA-256', buffer)` — exact Web Crypto API call, no npm library
- Full 64-char hash displayed in `<code>` element after computation; "Computing checksum..." spinner during hashing
- `handleFileSelected` validates MIME type and file size before beginning SHA-256 computation
- Submit disabled: `!selectedFile || !computedHash || computedHash.length !== 64 || isHashing || isPending`
- `onSubmit` builds `FormData` manually (`fd.append('file', ...), fd.append('obligation_id', ...), fd.append('sha256_hash', ...)`) and calls `uploadEvidence(fd)` — NOT `uploadEvidence(values)`

---

## Confirmation: crypto.subtle.digest

`EvidenceUploadForm.tsx` contains the exact browser SHA-256 call at line 21:
```typescript
const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer)
```
No npm hash library is used. This is the native Web Crypto API available in all secure contexts (localhost and Vercel HTTPS).

## Confirmation: attested_at omitted from attestObligation

`AttestationForm.tsx` calls:
```typescript
const result = await attestObligation(obligationId, values)
```
`values` is typed as `AttestationInput` from `attestationSchema` which only contains `attestation_status` and `notes`. `attested_at` is not in the schema and therefore cannot be in `values`. The DB `DEFAULT now()` is the sole source of truth (D-18, T-4-05-R).

## Drop Zone: Drag-Drop and Click-to-Browse

Both input methods route to the same `handleFileSelected(file: File)` handler:
- **Drag-drop:** `onDrop` handler extracts `e.dataTransfer.files[0]` and calls `handleFileSelected`
- **Click-to-browse:** `onClick` calls `fileInputRef.current?.click()` which triggers the hidden `<input type="file">` whose `onChange` calls `handleFileSelected`
- **Keyboard:** `onKeyDown` handles Enter/Space keys → same as click

## Submit Button Disabled State

```typescript
const isSubmitDisabled = !selectedFile || !computedHash || computedHash.length !== 64 || isHashing || isPending
```

Four independent conditions must all be false for the button to enable:
1. A file must be selected
2. The hash string must be non-empty
3. The hash must be exactly 64 chars (complete SHA-256 hex)
4. Hashing must not be in progress
5. No server request in flight (isPending)

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ATTESTATION_STATUS_LABELS imported from types/compliance.ts not compliance-utils.ts**
- **Found during:** Task 1 implementation (AttestationRow.tsx)
- **Issue:** Initial draft imported `ATTESTATION_STATUS_LABELS` from `compliance-utils.ts` but that file only exports `OBLIGATION_STATUS_BADGE` and utility functions — the label maps live in `types/compliance.ts`
- **Fix:** Changed import to `from '@/types/compliance'` which exports `ATTESTATION_STATUS_LABELS` correctly
- **Files modified:** `components/compliance/AttestationRow.tsx`
- **Commit:** `cc94ca6`

---

## Known Stubs

None. All components receive live data from Server Component parents:
- `EvidenceFileRow` receives real evidence rows from `listEvidence` (ascending order)
- `AttestationRow` receives real attestation rows from `listAttestations` (descending order — newest first)
- Detail page conditionally shows buttons based on real JWT `active_role`
- Download links point to `/api/compliance/evidence/[id]` which performs integrity verification before serving

---

## Threat Surface Scan

No new network endpoints introduced. All routes are under `app/(protected)/` guarded by existing middleware. Security mitigations from STRIDE register confirmed implemented:

| Threat ID | Mitigation | Status |
|-----------|-----------|--------|
| T-4-05-R | `attested_at` not in AttestationInput/values; DB `DEFAULT now()` is authoritative | Confirmed |
| T-4-05-T | Client SHA-256 is for UX transparency; `uploadEvidence` Server Action re-computes `serverHash` (Plan 02) | Confirmed |
| T-4-05-S | WRITE_ROLES redirect at `evidence/upload/page.tsx` + `getWriteContext(WRITE_ROLES)` in Server Action | Confirmed (two layers) |
| T-4-05-S2 | ATTEST_ROLES redirect at `attest/page.tsx` + `getWriteContext(ATTEST_ROLES)` in Server Action | Confirmed (two layers) |
| T-4-05-I | VIEW_ROLES excludes `dept-head`; redirect to /dashboard if role not in VIEW_ROLES | Confirmed in detail page |

---

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `app/(protected)/compliance/obligations/[id]/page.tsx` | FOUND |
| `app/(protected)/compliance/obligations/[id]/edit/page.tsx` | FOUND |
| `app/(protected)/compliance/obligations/[id]/edit/ObligationEditForm.tsx` | FOUND |
| `app/(protected)/compliance/obligations/[id]/attest/page.tsx` | FOUND |
| `app/(protected)/compliance/obligations/[id]/attest/AttestationForm.tsx` | FOUND |
| `app/(protected)/compliance/obligations/[id]/evidence/upload/page.tsx` | FOUND |
| `app/(protected)/compliance/obligations/[id]/evidence/upload/EvidenceUploadForm.tsx` | FOUND |
| `components/compliance/EvidenceFileRow.tsx` | FOUND |
| `components/compliance/AttestationRow.tsx` | FOUND |
| commit `cc94ca6` (Task 1) | FOUND |
| commit `d59508c` (Task 2) | FOUND |
| `export const dynamic = 'force-dynamic'` in detail page | CONFIRMED |
| `Promise.all` with three queries in detail page | CONFIRMED |
| `crypto.subtle.digest('SHA-256', buffer)` in EvidenceUploadForm | CONFIRMED |
| `attestObligation` called in startTransition in AttestationForm | CONFIRMED |
| Download link points to `/api/compliance/evidence/${id}` | CONFIRMED |
| SHA-256 in `<code>` element in EvidenceFileRow | CONFIRMED |
| "Audit recorded" badge in AttestationRow | CONFIRMED |
| `updateObligation` (not createObligation) in ObligationEditForm | CONFIRMED |
| Submit disabled on `!computedHash` and `isHashing` | CONFIRMED |
| FormData built manually and passed to `uploadEvidence(fd)` | CONFIRMED |
| Three radio cards (CheckCircle2, AlertCircle, XCircle) in AttestationForm | CONFIRMED |
| ShieldCheck in digital signature notice Alert | CONFIRMED |
| `npx tsc --noEmit` | PASSED (0 errors) |
