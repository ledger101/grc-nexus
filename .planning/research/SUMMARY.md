# Research Summary: GRC-Nexus

## Stack (what to build with)

**Fixed:** Next.js 14 App Router + Supabase (Postgres, Auth, RLS, Storage) + Vercel

**Key additions:**
- **shadcn/ui + Tailwind** — copy-paste components, full control, lightweight
- **Nivo** — ONLY library with native 5×5 risk heatmap support (no alternatives)
- **Recharts** — KPI trend charts (line, bar, area)
- **TanStack Table v9** — risk registers, compliance matrices, audit tables
- **react-hook-form + Zod** — type-safe form validation
- **TanStack Query + Zustand** — server state caching + client UI state
- **Puppeteer + @sparticuz/chromium** — PDF generation with charts on Vercel
- **Postgres Triggers (SECURITY DEFINER)** — immutable audit logs at DB layer; do NOT use application-level logging

## Table Stakes (what must work)

If any single item is missing, auditors and governance officers will distrust the platform.

1. **Immutable Audit Trail** — every action logged with timestamp, actor, before/after. PECOGA mandate.
2. **RBAC enforced at DB layer** — Supabase RLS; role segregation means board cannot approve what they authored.
3. **Risk Register with 5×5 Scoring** — likelihood × impact matrix, inherent and residual scores 1–25.
4. **Compliance Obligations Register** — statute → requirement → owner → due date → evidence.
5. **User Authentication + Institutional Roles** — email/password + 6 roles (board, ceo, risk-officer, audit, dept-head, admin).
6. **Strategic Objective Linking** — every risk, control, KPI maps to an NDS2 priority or institutional goal.
7. **KPI Tracking** — baselines, targets, owners, period status (on-track / at-risk / off-track).
8. **Executive Dashboard with Risk Heatmap** — live 5×5 visual grid; unified governance posture in 30 seconds.
9. **Evidence Upload & Attachment** — files tied to obligations/findings; immutable filenames; SHA-256 hash on download.
10. **Overdue Escalation** — automated alerts at 3 days before, on due date, 7+ days overdue.

## Build Order (dependency-driven)

Each layer depends on the one above. Do not skip or reorder.

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Auth + RLS + schema | Users log in; JWT has custom claims; all tables RLS-gated |
| 2–3 | Strategic objectives + KPIs + Risk register | Risks can be created, scored, treated |
| 3–4 | Compliance obligations + evidence + Executive dashboard | Full prototype demoable: heatmap + KPI + compliance posture |
| 5–6 | Board management + internal audit (or mock) | Governance workflows demoable |
| 6+ | Incidents/whistleblower, advanced reporting | Post-core functionality |

**Why this order:** Auth + RLS is the security foundation — nothing is safe without it. Strategy is the data anchor — orphaned risks and compliance items cannot exist without objectives. Dashboard is the hero feature and requires all preceding data to be meaningful.

## Critical Pitfalls (top 5 — address in Phase 1 design)

1. **Audit trail mutability** — Must use Postgres triggers (SECURITY DEFINER), not app-level logs. Can't be retrofitted.
2. **RLS disabled by default** — Every table needs `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. 170+ Supabase apps were publicly exposed in 2025.
3. **Risk scoring collapse** — Define explicit calibration rubrics before population or everything scores "medium." Defeats the heatmap.
4. **Cache poisoning on auth pages** — All authenticated routes need `export const dynamic = 'force-dynamic'`. ISR caching + Set-Cookie = data leakage.
5. **Evidence storage without immutability** — Immutable filenames (timestamp + hash), never overwrite, SHA-256 checksum validation on download.

## Architecture Decisions

| Decision | Why |
|----------|-----|
| Server Components by default | Minimize client bundle; data fetching close to Supabase; security enforced server-side |
| Supabase RLS at DB layer | Survives app bugs; policy-layer security; auditor-verifiable |
| JWT custom claims (role + institution_id + dept_id) | Single auth call; no N+1 per-request role lookups |
| Feature modules as route groups | Each module has own layout, components, queries, actions; prevents cross-module coupling |
| Server Actions for all mutations | Type-safe; validation on server; audit trail integration trivial |
| Immutable audit via Postgres triggers | No external dependencies; enforced even if application code is bypassed |

## Prototype Scope Recommendation (4–6 weeks)

**Include:**
- Auth + RBAC + institutional data model (Week 1)
- Risk register with 5×5 heatmap (Weeks 2–3)
- Strategic objectives + KPI tracking (Week 2)
- Compliance obligations + evidence upload (Weeks 3–4)
- Executive dashboard — the hero feature (Week 4)
- Board meeting lifecycle (Week 5–6, can use partial mock data)

**Defer to Phase 2+:**
- Internal audit findings module (can mock for demo)
- Incident/whistleblower module
- Vendor/third-party risk module
- Advanced statutory PDF reports (Phase 2)
- Multi-institution cross-reporting
- SAML/SSO, eGP integration, custom workflows

**Critical success factors:**
- Immutable audit trail working from Week 1 (cannot retrofit)
- RLS on all tables from schema creation (cannot retrofit safely)
- Dashboard-first prioritization (visual credibility drives stakeholder buy-in)
- One end-to-end story demonstrable: objective → risk → control → audit finding

## Open Questions

| Question | Phase it matters | Who can answer |
|----------|-----------------|----------------|
| Risk scoring rubric calibration (what exactly is Likelihood=4 for a Zimbabwean MDA?) | Phase 1 risk module | Domain expert workshop with compliance officers |
| PECOGA statutory report template format | Phase 2 reporting | Actual PECOGA filings from existing MDAs/SOEs |
| Compliance officer UX pain points with current tools | Phase 1 UX | 3–5 user interviews with compliance officers |
| Data retention periods under PPDPA for evidence files | Phase 1 storage design | Legal input |
| Multi-role user handling (can one person have board + risk-officer roles?) | Phase 1 auth | Client institutional policy |

## Confidence Levels

| Area | Level | Basis |
|------|-------|-------|
| Stack choices | HIGH | Official docs, 2025 ecosystem consensus, Context7 verification |
| Table stakes features | HIGH | PECOGA, ISO 31000, MetricStream/ServiceNow/LogicGate cross-reference |
| Architecture patterns | HIGH | Next.js 14 official, Supabase production guides |
| Critical pitfalls | HIGH | 2025 documented incidents (170-app RLS breach), official prevention docs |
| Module complexity estimates | MEDIUM | Standard SaaS patterns; not team-velocity-validated |
| Public sector specifics (PECOGA) | MEDIUM-HIGH | Whitepaper alignment confirmed; Zimbabwe-specific details need stakeholder input |
