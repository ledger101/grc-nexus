---
phase: 03-enterprise-risk-management-risk-register-and-heatmap
verified: 2026-05-23T12:00:00Z
status: gaps_found
score: 6/7 must-haves verified
overrides_applied: 0
subject: UI-SPEC (design contract document — pre-execution)
gaps:
  - truth: "User can update treatment status inline from the risk detail page"
    status: partial
    reason: "Interaction Contracts section promises 'Treatment status updated (inline) — Row badge updates in place, no page reload, success toast' but provides no component spec for the interactive control (inline Select, dropdown, or edit modal) that triggers the update. Implementation is ambiguous."
    artifacts:
      - path: ".planning/phases/03-enterprise-risk-management-risk-register-and-heatmap/03-UI-SPEC.md"
        issue: "Screen 5 (Risk Detail) Treatment Row shows a Treatment Status Badge with no interactive element specified. Interaction Contracts references the behavior without a corresponding component or screen spec."
    missing:
      - "Component spec for inline treatment status selector — specify whether it is: (a) an inline shadcn Select replacing the badge on click, (b) an icon-button that opens a small popover/dropdown, or (c) a link to /risk/[id]/treatments/[tid]/edit"
      - "If option (c), add Screen 8: Edit Treatment Form with pre-populated fields and 'Update Treatment' submit"
---

# Phase 3 — UI-SPEC Verification Report

**Phase Goal:** Risk officers can create and score risks linked to strategic objectives, record mitigations, and see a live 5×5 risk heatmap.
**Verified:** 2026-05-23T12:00:00Z
**Status:** gaps_found
**Subject:** UI-SPEC document review (pre-execution — no implementation files exist yet)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Mapped to ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | UI-SPEC specifies a Create Risk Form with title, description, category, owner, and linked objective (SC1 / RISK-01) | ✓ VERIFIED | Screen 3 fully specifies all fields; linked objective is an optional Select with helper text |
| 2 | UI-SPEC specifies a 5×5 MatrixSelector component for inherent risk scoring (SC2 / RISK-02) | ✓ VERIFIED | Component 23 provides full layout, interaction rules, ARIA attributes, keyboard navigation, and grid orientation note |
| 3 | UI-SPEC specifies residual risk scoring and side-by-side score display (SC3 / RISK-03) | ✓ VERIFIED | Component 22 (Risk Score Display Panel) + MatrixSelector instance 2 on Screen 4 (Edit Risk); "not yet assessed" state handled |
| 4 | UI-SPEC specifies severity calculation (L×I) with four severity labels and correct score ranges (SC4 / RISK-04) | ✓ VERIFIED | Severity Badge (Component 20), Score Display Panel shows "L×I=score" formula, severity color table covers Low/Medium/High/Critical |
| 5 | UI-SPEC specifies Add Treatment Form (owner, due date, status) and overdue visual treatment (SC5 / RISK-05, RISK-07) | ⚠️ PARTIAL | Screen 7 covers adding with full field spec. Overdue row styling (`border-l-[3px] border-err`) and toast ("Treatment is overdue. [Owner] has been notified.") specified. **Gap: no component spec for inline status update on detail page — see Gaps Summary** |
| 6 | UI-SPEC specifies a client-side filter bar for category, severity, owner, and status without page reload (SC6 / RISK-08) | ✓ VERIFIED | Component 26 (Risk Filter Bar) with four shadcn Select controls; active filter ring state; "Clear filters" button; TanStack Table `setColumnFilters` pattern |
| 7 | UI-SPEC specifies a live 5×5 CSS Grid risk heatmap with color-coded severity zones (SC7 / RISK-06) | ✓ VERIFIED | Component 24 provides full grid spec (64px cells, 2px gap, 5×5 layout), risk dot spec (24px, severity color, tooltip, numbered), heatmap page layout |

**Score: 6/7 must-haves fully specified**

---

## Required Artifacts (UI-SPEC Document Coverage)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| Design system section | Tokens consistent with tailwind.config.ts | ✓ VERIFIED | All 10 custom tokens (navy-950, navy-900, navy-mid, paper, paper-border, gold, gold-pale, ok, warn, err) match tailwind.config.ts hex values exactly |
| shadcn gate | Components.json confirms default/slate/cssVariables | ✓ VERIFIED | components.json: style=default, baseColor=slate, cssVariables=true — matches spec |
| Installed components | 14 shadcn components listed as installed | ✓ VERIFIED | `components/ui/` contains exactly: alert, avatar, badge, button, card, checkbox, dialog, form, input, label, pagination, select, sonner, table — 14 files |
| Tooltip dependency | Flagged as not installed, install command provided | ✓ VERIFIED | Tooltip absent from `components/ui/`; spec correctly identifies gap with `npx shadcn add tooltip` |
| Screen 1 — Risk Overview | `/risk` with heatmap preview + stat cards | ✓ VERIFIED | 4 stat cards, mini-heatmap (48px cells), recent risks table specified |
| Screen 2 — Risk Register | `/risk/register` with filter bar + TanStack Table | ✓ VERIFIED | Full table column spec, row expand for treatments, empty states |
| Screen 3 — Create Risk | `/risk/new` form | ✓ VERIFIED | All 6 fields + two MatrixSelector sections + form footer |
| Screen 4 — Edit Risk | `/risk/[id]/edit` | ✓ VERIFIED | Residual MatrixSelector pre-populated; breadcrumb and title differences from Create noted |
| Screen 5 — Risk Detail | `/risk/[id]` | ⚠️ PARTIAL | Score panel, two-column layout, treatment list specified; **inline treatment status update control missing** |
| Screen 6 — Risk Heatmap | `/risk/heatmap` | ✓ VERIFIED | Page layout, legend row, heatmap card, risk list table below |
| Screen 7 — Add Treatment | `/risk/[id]/treatments/new` | ✓ VERIFIED | 5 fields, risk context card, form footer |
| Copywriting contract | Headings, CTAs, empty states, errors, toasts | ✓ VERIFIED | All 7 screens covered; 8 error messages; 4 empty states; 8 toast messages |
| Accessibility | ARIA roles for matrix, heatmap, badges, score panel | ✓ VERIFIED | grid/gridcell/img roles; aria-pressed on matrix cells; aria-label on all interactive elements; focus management on save/dialog |
| Registry safety | No third-party components declared | ✓ VERIFIED | Only shadcn official registry; Tooltip listed as only new install |

---

## Key Link Verification (Design Contract Internal Consistency)

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| Severity color table | Tailwind tokens (ok/warn/err) | CSS class references | ✓ WIRED | All severity classes use `bg-ok`, `bg-warn`, `bg-err` — registered in tailwind.config.ts |
| Category badge colors | Tailwind default palette | `bg-purple-50`, `bg-blue-50`, etc. | ✓ WIRED | Standard Tailwind v3 colors — no custom declaration needed |
| MatrixSelector grid orientation | RESEARCH.md Pitfall 7 | Cross-reference note in spec | ✓ WIRED | Spec explicitly sources orientation from research: "Row 0 (top) = Likelihood 5" matches standard ERM presentation |
| CSS Grid heatmap approach | RESEARCH.md heatmap decision | Nivo override documented | ✓ WIRED | Both documents consistently specify CSS Grid; Nivo override rationale documented in research |
| Phase 1 inherited tokens | tailwind.config.ts | `source: 01-UI-SPEC.md` attribution | ✓ WIRED | Spacing, typography, color tables all carry Phase 1 attribution; all values verified against config |
| Inline treatment update behavior | Screen 5 (treatment row) | Interaction Contracts | ✗ BROKEN | Contracts promise inline update but Screen 5 has no interactive control spec for it |

---

## Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| RISK-01 | Create risk with title, description, category, owner | ✓ SATISFIED | Screen 3 fields |
| RISK-02 | Score risk on 5×5 matrix for inherent risk | ✓ SATISFIED | Component 23 |
| RISK-03 | Record residual risk score | ✓ SATISFIED | Screen 4 + Component 22 |
| RISK-04 | Calculate score and severity labels | ✓ SATISFIED | Component 20, 22; score formula |
| RISK-05 | Add risk treatments with owner, due date, status | ✓ SATISFIED | Screen 7 |
| RISK-06 | Live 5×5 risk heatmap | ✓ SATISFIED | Component 24, Screen 6 |
| RISK-07 | Overdue treatments trigger escalation notifications | ✓ SATISFIED | Toast spec + overdue row styling; backend in RESEARCH |
| RISK-08 | Risk register filterable without page reload | ✓ SATISFIED | Component 26, client-side TanStack |

---

## Anti-Patterns Found

| Location | Pattern | Severity | Impact |
|----------|---------|----------|--------|
| Checker Sign-Off (bottom of doc) | `Approval: pending` — all 6 dim checks marked PASS but formal approval not stamped | ⚠️ Warning | No blocker; spec content is substantive. Should be signed off before planning begins |
| Screen 5 treatment row | Status Badge rendered but no interactive update control specified | 🛑 Blocker | Implementer cannot resolve this from the spec alone — will require a design decision during coding |

---

## Human Verification Required

None — this is a document review. All checks are programmatic (token cross-reference, component inventory, screen coverage against success criteria).

---

## Gaps Summary

**1 gap** blocking spec completeness:

### Treatment Inline Status Update — Unspecified Interaction (PARTIAL)

**Truth:** User can update treatment status from the risk detail page.

**What the spec says:** Interaction Contracts promises "Treatment status updated (inline) — Row badge updates in place, no page reload, success toast." Success Transitions confirms this.

**What's missing:** Screen 5 (Risk Detail) — the Treatment Row spec shows a `Treatment Status Badge` as a display element but specifies no interactive control to change it. There is no:
- Inline Select component replacing the badge on click
- Icon-button opening a dropdown/popover
- Edit link navigating to a treatment edit form

This creates a genuine spec gap — the implementer faces an unresolved design decision mid-execution.

**Resolution options to add to spec:**

**Option A (simplest):** Add an inline shadcn `Select` next to the status badge on each treatment row — `<Select value={status} onValueChange={handleUpdate}>` — updates via Server Action, row re-renders with new badge. Add to Component Inventory as "Treatment Inline Status Select."

**Option B (explicit edit flow):** Add Screen 8: Edit Treatment Form at `/risk/[id]/treatments/[tid]/edit` — pre-populated fields including status select. Treatment row gets an edit icon button. Simpler spec to write; clearer separation of concerns.

**Option C (detail page modal):** Clicking a treatment row opens a shadcn Dialog with the full treatment fields pre-populated. Saves in-place. Most UX complexity to spec and implement.

**Recommendation:** Option A is lightest and consistent with the inline KPI reading pattern used in Phase 2. The spec should add: (1) a brief Component 28 or 29 spec for "Inline Treatment Status Select," and (2) update Screen 5 treatment row layout to include the select element.

---

_Verified: 2026-05-23T12:00:00Z_
_Verifier: gsd-verifier (GitHub Copilot)_
_Subject: UI-SPEC document review — Phase 3 has not been executed yet_
