# GRC-Nexus

## What This Is

GRC-Nexus is a unified Governance, Risk, and Compliance operating platform for Zimbabwe's public sector MDAs (Ministries, Departments, Agencies) and SOEs (State-Owned Enterprises). It links national strategy (NDS2 2026–2030), enterprise risk management, board oversight, compliance, procurement integrity, incident management, and performance reporting in one auditable digital system. The prototype targets the most investor-compelling subset of the full 8-module platform, demonstrable within 4–6 weeks.

## Core Value

A governance officer or board member can log in, see their institution's live risk posture and strategic KPI performance, and act on overdue obligations — all in one place, with a full audit trail.

## Requirements

### Validated

- [x] Users can authenticate with email/password and institutional role (board, risk officer, audit, department head, admin) — *Validated in Phase 1: Foundation*
- [x] Role-based access control with least-privilege defaults enforced throughout — *Validated in Phase 1: Foundation (RLS at DB layer + middleware)*

### Active

- [ ] Risk registers are linked to strategic objectives with 5×5 likelihood-impact scoring
- [ ] Risk registers are linked to strategic objectives with 5×5 likelihood-impact scoring
- [x] Strategic KPIs with baselines, targets, owners, and period status are tracked per institution — *Validated in Phase 2: Strategic Planning*
- [ ] Compliance obligations have due dates, evidence uploads, and attestation workflows
- [ ] Board meeting lifecycle: agenda, pack distribution, resolutions, and action tracking
- [ ] Internal audit findings are managed with root-cause and remediation tracking
- [ ] Executive dashboard shows live risk heatmap, compliance posture, and KPI summary
- [ ] Incident/whistleblower intake with triage and confidential case workflows
- [ ] Statutory reports can be generated and exported
- [ ] Role-based access control with least-privilege defaults enforced throughout

### Out of Scope

- Vendor/third-party risk module — deferred to Phase 2 post-prototype (complex onboarding flows)
- Full procurement (eGP) integration — requires external API access not available in prototype
- SMS/telephony whistleblower channel — infrastructure dependency, deferred
- Multi-institution cross-reporting dashboard — deferred until single-institution flows validated
- Mobile native app — web-responsive is sufficient for prototype demos

## Context

- **Reference document:** `C:\Users\Kuziwa\Desktop\Lab\whitepaper.md` — GRC-Nexus Version 2.1 Core Guideline, 14 sections covering full platform spec
- **Regulatory alignment:** NDS2 (2026–2030), PECOGA [Ch. 10:31], PPDPA [Ch. 22:23], Cyber & Data Protection Act [Ch. 12:07], Public Sector Risk Framework (2023), ISO 31000:2018, IRBM
- **Target audience for prototype:** Investors, decision-makers at MDAs/SOEs, governance officers — needs to be demoable and credible
- **Governance Waterfall Model:** NDS2 priorities → institutional 5-year goals → annual plans → departmental actions → linked risks/controls → board oversight → compliance reporting
- **Companion website:** `C:\Users\Kuziwa\Desktop\Lab\eGov-website\index.html` — pitch deck website already built

## Constraints

- **Tech Stack:** Next.js 14 (App Router) + Supabase (Postgres, Auth, RLS) — already decided
- **Deployment:** Vercel (frontend) + Supabase cloud
- **Timeline:** 4–6 weeks for demoable prototype
- **Scope:** Phase 2 whitepaper priorities (Core Integrity Stack: strategic planning, ERM, compliance, internal audit, board management) as the prototype core
- **Security:** Row-Level Security enforced at Supabase layer; role-based access in Next.js middleware
- **Data residency:** Prototype uses Supabase cloud; production would require Southern Africa data residency

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 14 App Router | Modern React with server components, ideal for auth-gated dashboards | — Pending |
| Supabase for auth + DB | Built-in RLS maps directly to GRC's role-based access requirements; auth included | — Pending |
| Single-institution scope for prototype | Validates core workflows before multi-tenant complexity | — Pending |
| Fine granularity (8-12 phases) | Complex multi-module app; fine slicing reduces execution risk per phase | — Pending |
| Budget AI model profile | Cost efficiency for a lengthy multi-phase build | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-22 after initialization*
