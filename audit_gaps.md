# GRC-Nexus — Enterprise Audit Model Gap Analysis

**Prepared:** 2026-05-24  
**Baseline:** Current codebase (Phases 1–8 built; Phase 2 formally verified; Phases 3–8 built but STATUS.md still shows pending)  
**Requirements source:** Enterprise-grade GRC platform specification supplied by audit team  
**Reviewer:** GRC-Nexus engineering team

---

## What Currently Exists

| Phase | Module | Status | Core Capabilities Delivered |
|-------|--------|--------|----------------------------|
| 1 | Foundation (Auth, RBAC, Audit Trail) | ✅ Complete | Login, MFA (TOTP + Email OTP), device trust, role-based access, immutable Postgres-trigger audit log, admin user management |
| 2 | Strategic Planning & KPIs | ✅ Complete | Strategic objectives (NDS2-tagged), KPI definitions (baseline/target/owner/cadence), manual KPI readings, sparkline trend charts, status filter grid |
| 3 | Enterprise Risk Management | 🔲 Built / Not verified | Risk register, 5×5 inherent/residual scoring, Nivo heatmap, control linkage, risk treatment plans, overdue treatment escalation |
| 4 | Compliance Management | 🔲 Built / Not verified | Obligations register, evidence upload (Supabase Storage + SHA-256), attestation workflow, 3-tier overdue escalation (email via Resend) |
| 5 | Board Management | 🔲 Built / Not verified | Meeting lifecycle, agenda items, board document upload, resolution recording, action items, overdue escalation |
| 6 | Internal Audit | 🔲 Built / Not verified | Findings register, severity/root-cause tagging, remediation evidence upload, status transitions, overdue escalation |
| 7 | Incident & Whistleblower | 🔲 Built / Not verified | Anonymous/named intake, triage workflow, investigator assignment, SLA tracking, confidentiality RLS |
| 8 | Executive Dashboard & Reporting | 🔲 Built / Not verified | Unified executive dashboard (KPI stats, risk heatmap, overdue actions), PDF governance report (Puppeteer), date/department/module filters |

**Reporting capabilities today:** Static server-rendered dashboard + one-click PDF export covering all modules. No automated scheduling. No real-time push.

---

## Gap Analysis Against Enterprise Audit Requirements

---

### GAP 1 — Key Risk Indicators (KRIs) and Key Control Indicators (KCIs)

**Requirement:** Continuous monitoring of KPIs, **KRIs**, and **KCIs** with automated alerts.

**What exists:**
- KPIs are fully implemented (readings, trend, status).
- Risks have 5×5 inherent/residual scores, but no dedicated *indicator* layer that measures how risk levels are moving over time as numeric metrics.
- Controls exist as child records of risks, but their performance is recorded as pass/fail status, not as a quantitative KCI (e.g., "% of transactions dual-approved this month: 87% vs target 100%").

**Gap:**
| Item | Current State | Gap |
|------|---------------|-----|
| KRI framework | ❌ Missing | No `kri_definitions` or `kri_readings` tables; risks tracked by score change, not by forward-looking indicator metrics |
| KCI framework | ❌ Missing | No `kci_definitions` or `kci_readings` tables; controls have status/test method but no quantitative measurement |
| KRI/KCI dashboard tile | ❌ Missing | Executive dashboard shows KPI stats and risk heatmap but no KRI trend panel or KCI health grid |
| Threshold-based automated alerts | ❌ Missing | Escalation today is exclusively date-driven (due date overdue). No alerts fire when a KPI, KRI, or KCI value crosses a configured threshold (e.g., KPI actual drops 20% below target) |

**Severity:** 🔴 Critical — KRI/KCI distinction is a defining differentiator of enterprise-grade GRC vs. basic risk registers.

---

### GAP 2 — Audit Automation: Universe, Planning, and Continuous Testing

**Requirement:** Automation of various audit tasks including workflow automation for remediation and reporting.

**What exists:**
- Findings lifecycle (open → in_progress → closed) with evidence upload and status transitions. ✅
- 3-tier escalation for overdue findings (3 days before, on due date, 7+ days after). ✅
- Governance report PDF generation. ✅

**Gap:**
| Item | Current State | Gap |
|------|---------------|-----|
| Audit universe / risk-based audit plan | ❌ Missing | No `audit_plans` or `audit_universe` table; no way to schedule which risks/controls get audited and when |
| Audit programs and test procedures | ❌ Missing | Findings exist but there's no parent audit program that groups related tests into a structured engagement |
| Continuous control testing | ❌ Missing | Controls are rated by a static status; no automated periodic test scheduling that generates findings when controls fail |
| Audit workpapers | ❌ Missing | No structured working paper templates; evidence upload is unstructured binary storage with no workpaper index |
| Combined assurance mapping | ❌ Missing | No linkage between internal audit findings, external audit findings, and risk/control effectiveness to produce a combined assurance view |
| Automated report scheduling | ⚠️ Partial | PDF report exists but must be manually triggered; no cron-based auto-dispatch to oversight bodies or board distribution list |
| Audit sampling workflows | ❌ Missing | No sample selection logic or sampling record within the finding detail |

**Severity:** 🔴 Critical for audit module; 🟡 Important for reporting automation.

---

### GAP 3 — Data Analytics: Predictive Modeling and R/Python Integration

**Requirement:** Advanced analytics functionality including predictive modeling and integration with programming languages like R and Python.

**What exists:**
- Recharts sparklines (KPI trend, 80×32 px mini-charts). ✅
- Nivo risk heatmap (5×5 scatter). ✅
- Executive dashboard aggregated counts (active risks, overdue obligations, open incidents). ✅
- PDF export of static snapshot. ✅

**Gap:**
| Item | Current State | Gap |
|------|---------------|-----|
| Predictive risk modeling | ❌ Missing | No ML pipeline; risk scores are manual 5×5 inputs, not model-driven |
| Trend forecasting | ❌ Missing | KPI sparklines show historical readings only; no projected trajectory or forecast bands |
| Anomaly detection | ❌ Missing | No alerting when KPI/KRI/KCI values deviate statistically from expected pattern |
| R language integration | ❌ Missing | No R runtime, no API endpoint accepting R payloads, no R Markdown report rendering |
| Python integration | ❌ Missing | No Python runtime, no pandas/numpy data pipeline, no Jupyter-compatible export |
| Analytics-grade data export | ⚠️ Partial | Only audit log CSV export exists; no structured data export (JSON/CSV/Parquet) for all modules suitable for analytics tooling |
| Statistical dashboards | ❌ Missing | No regression analysis, no distribution charts, no confidence intervals on risk or compliance metrics |
| What-if / scenario modeling | ❌ Missing | No simulation of how risk scores change under different treatment assumptions |

**Severity:** 🔴 Critical gap against enterprise requirement; this is the largest engineering lift on the list.

---

### GAP 4 — ESG Reporting and ISO 9001:2015 Documentation

**Requirement:** Consolidate and enhance functions related to Environmental, Social, and Governance (ESG) reporting and ISO 9001:2015 documentation.

**What exists:**
- General compliance obligations register (can hold any obligation type). ⚠️ Partially applicable.
- Immutable audit trail for all data changes. ✅

**Gap:**
| Item | Current State | Gap |
|------|---------------|-----|
| ESG metrics taxonomy | ❌ Missing | No GRI (Global Reporting Initiative), SASB, or TCFD framework structures; no `esg_metrics` or `esg_disclosures` tables |
| Environmental metrics | ❌ Missing | No carbon footprint, energy consumption, waste/water metrics collection |
| Social metrics | ❌ Missing | No employee safety, diversity & inclusion, community impact metrics |
| ESG-specific dashboard | ❌ Missing | Executive dashboard has no ESG tile, no ESG posture score, no materiality matrix |
| ESG stakeholder reporting | ❌ Missing | No ESG report template, no GRI index, no annual sustainability disclosure generation |
| ISO 9001:2015 QMS module | ❌ Missing | No quality objectives, no document control with version management, no PDCA (Plan-Do-Check-Act) tracking |
| Non-conformance register | ❌ Missing | ISO 9001 requires a specific non-conformance & corrective action register distinct from audit findings |
| Management review workflow | ❌ Missing | No ISO 9001 management review meeting tracking or review input/output records |
| Quality records register | ❌ Missing | No QMS document register with controlled/uncontrolled distribution, review dates, and approval chains |
| Supplier quality assessments | ❌ Missing | ISO 9001 clause 8.4 requires supplier evaluation; no supplier assessment framework exists |

**Severity:** 🔴 Critical — ESG and ISO 9001 represent a separate functional domain with zero coverage today.

---

### GAP 5 — Real-Time Visualization and Interactive Dashboards

**Requirement:** Real-time oversight through interactive dashboards and visualization tools to aid decision-making.

**What exists:**
- Server-rendered executive dashboard with risk heatmap, compliance stats, overdue actions, KPI summary. ✅
- Date, department, and module filters (URL-based, full-page reload). ✅
- One-click PDF export. ✅
- Drill-through to individual module detail pages. ✅

**Gap:**
| Item | Current State | Gap |
|------|---------------|-----|
| Real-time live updates | ❌ Missing | Dashboard requires full page refresh; Supabase Realtime subscriptions are planned in STACK.md ("open question") but not implemented; no WebSocket push to live-update risk scores, obligation status, or incident counts |
| In-dashboard drill-down charts | ⚠️ Partial | Clicking a risk opens a separate detail page (server navigation), not an inline chart expansion or modal drill-down |
| Cross-module traceability graph | ❌ Missing | No visualization of the Strategic Objective → KPI → Risk → Control → Audit Finding chain; planned as a differentiator but not implemented |
| Network/relationship graph | ❌ Missing | No Nivo network graph or D3 tree showing risk–control–obligation–finding interconnections |
| KRI/KCI trend tiles | ❌ Missing | KRI and KCI gaps above (GAP 1) mean these visualization tiles cannot exist |
| Geographic multi-institution view | ❌ Missing | Prototype is single-institution only; no map view of governance posture across MDAs/SOEs |
| Customisable dashboard widgets | ❌ Missing | Dashboard layout is fixed; no user-configurable widget arrangement or pinned metrics |
| Comparative benchmarking charts | ❌ Missing | No inter-period or inter-department performance comparisons in the dashboard itself |
| Alert/notification centre | ❌ Missing | No in-app notification panel; all alerts go via email (Resend) only; no UI badge/bell for pending actions |

**Severity:** 🟡 Important (static dashboard partially meets requirement) / 🔴 Critical for real-time and cross-module graph.

---

## Consolidated Gap Summary

| # | Gap Area | Severity | Effort Estimate | In Existing Roadmap? |
|---|----------|----------|-----------------|----------------------|
| 1a | KRI framework (definitions + readings) | 🔴 Critical | Medium (2–3 wks) | ❌ Not planned |
| 1b | KCI framework (definitions + readings) | 🔴 Critical | Medium (2–3 wks) | ❌ Not planned |
| 1c | Value-threshold automated alerts (KPI/KRI/KCI) | 🔴 Critical | Medium (2 wks) | ❌ Not planned |
| 2a | Audit universe and risk-based audit plan | 🔴 Critical | Medium-High (3–4 wks) | ❌ Not planned |
| 2b | Audit programs and test procedures | 🟡 Important | Medium (2–3 wks) | ❌ Not planned |
| 2c | Continuous control testing scheduler | 🔴 Critical | High (4–5 wks) | ❌ Not planned |
| 2d | Audit workpapers | 🟡 Important | Medium (2 wks) | ❌ Not planned |
| 2e | Combined assurance mapping | 🟡 Important | Medium (2–3 wks) | Noted as Phase 2+ |
| 2f | Automated report scheduling + dispatch | 🟡 Important | Low (1 wk) | Noted as Phase 2 |
| 3a | Predictive risk / KPI forecasting | 🔴 Critical | Very High (6–10 wks) | Noted as Phase 4 |
| 3b | R language integration | 🟡 Important | High (4–6 wks) | ❌ Not planned |
| 3c | Python integration / analytics API | 🟡 Important | High (4–6 wks) | ❌ Not planned |
| 3d | Analytics-grade structured data export | 🟢 Nice-to-have | Low (1 wk) | ❌ Not planned |
| 3e | Anomaly detection | 🟡 Important | High (4–5 wks) | ❌ Not planned |
| 4a | ESG metrics and data collection module | 🔴 Critical | High (5–7 wks) | ❌ Not planned |
| 4b | ESG reporting (GRI/SASB/TCFD) | 🔴 Critical | High (4–5 wks) | ❌ Not planned |
| 4c | ISO 9001:2015 QMS module | 🔴 Critical | High (5–7 wks) | ❌ Not planned |
| 4d | Non-conformance register | 🔴 Critical | Medium (2 wks) | ❌ Not planned |
| 5a | Real-time dashboard (Supabase Realtime) | 🔴 Critical | Medium (2–3 wks) | Open question in STACK.md |
| 5b | Cross-module traceability graph | 🟡 Important | Medium (2–3 wks) | Planned as differentiator |
| 5c | In-app notification centre | 🟡 Important | Low-Medium (1–2 wks) | ❌ Not planned |
| 5d | Customisable dashboard widgets | 🟢 Nice-to-have | High (3–5 wks) | ❌ Not planned |
| 5e | Network/relationship graph (Nivo) | 🟢 Nice-to-have | Medium (2 wks) | ❌ Not planned |

---

## Bridging Plan

### Approach: Two-Stream Parallel Execution

Given the scope, gaps split cleanly into two delivery streams:

- **Stream A: GRC Core Hardening** — closes audit automation, KRI/KCI, and real-time visualization gaps. Extends the existing Next.js + Supabase architecture. Can begin immediately.
- **Stream B: ESG + Analytics Platform** — closes ESG, ISO 9001, and R/Python analytics gaps. Requires new data model design and likely a sidecar analytics service. Should begin after Stream A Phase A1 is verified.

---

### Stream A — GRC Core Hardening

#### Phase A1: KRI/KCI Framework + Threshold Alerts *(Priority: Immediate)*

**Goal:** Elevate the strategic and risk modules from manual-entry KPI tracking to a full KPI/KRI/KCI indicator suite with automated value-threshold alerting.

**Deliverables:**
1. **Database migrations:**
   - `kri_definitions` table (linked to risks: name, metric_unit, target_value, alert_threshold, direction, owner_id)
   - `kri_readings` table (period_start, period_end, actual_value, status, notes)
   - `kci_definitions` table (linked to controls: name, metric_unit, target_value, threshold, test_cadence)
   - `kci_readings` table (period, actual_value, status, evidence_id)
   - RLS policies mirroring existing risk/compliance patterns
   - Audit triggers on all new tables

2. **Server Actions:** `createKriDefinition`, `recordKriReading`, `createKciDefinition`, `recordKciReading` — mirror `lib/strategic/actions.ts` pattern.

3. **Threshold alert service:**
   - New `lib/strategic/kri-alert.ts` + `lib/risk/kci-alert.ts`
   - Cron-protected API routes: `app/api/kri/alert/route.ts`, `app/api/kci/alert/route.ts`
   - Alert fires when `actual_value` crosses `alert_threshold`; email via Resend to owner + governance officer

4. **UI:**
   - KRI sub-section under `/risk` module (list, create, record reading)
   - KCI sub-section under each control detail page
   - Executive dashboard: add KRI status tile (mirroring KPI summary tile) and KCI health grid (% controls green)

**Effort:** 2–3 weeks  
**Stack changes:** None (pure Supabase + Next.js)  
**Dependencies:** Phases 3 and 4 verified and stable

---

#### Phase A2: Audit Universe, Programs, and Continuous Control Testing *(Priority: High)*

**Goal:** Transform audit from a reactive finding-tracker into a proactive risk-based audit planning system.

**Deliverables:**
1. **Database:**
   - `audit_plans` (annual plan: title, period, status, created_by)
   - `audit_engagements` (child of plan: scope, risk_basis, lead_auditor, status, dates)
   - `audit_programs` (child of engagement: set of test procedures)
   - `audit_test_procedures` (procedure title, objective, test_type, frequency — for continuous testing)
   - `control_test_schedule` (control_id, next_test_date, frequency, auto_generated bool)
   - Extend `audit_findings` with `engagement_id` FK (nullable for ad hoc findings)

2. **Continuous control testing service:**
   - `lib/audit/control-test-scheduler.ts` — reads `control_test_schedule`, creates `audit_findings` automatically when test_date is reached and no evidence has been submitted
   - Cron route: `app/api/audit/control-test/route.ts` (daily job, protected by `CRON_SECRET`)

3. **Audit workpapers:**
   - `audit_workpapers` table (engagement_id, procedure_id, workpaper_reference, content_json, reviewer_id, status)
   - Workpaper create/review UI under `/audit/engagements/[id]/workpapers`

4. **Combined assurance view:**
   - New query joining `audit_findings`, `risk_treatments`, and `compliance_obligations` by risk/control FK
   - Combined assurance dashboard tile on executive dashboard

5. **Automated report scheduling:**
   - `report_schedules` table (cadence, recipients, module_filter, last_sent_at)
   - Cron route: `app/api/reports/schedule/route.ts` — generates and emails PDF on schedule
   - UI: `/admin/report-schedules` CRUD page

**Effort:** 3–5 weeks  
**Stack changes:** None

---

#### Phase A3: Real-Time Dashboard + In-App Notification Centre *(Priority: High)*

**Goal:** Convert the static server-rendered dashboard to a live, push-updated view.

**Deliverables:**
1. **Supabase Realtime subscriptions:**
   - Client-side hook `useRealtimeDashboard()` — subscribes to `risks`, `compliance_obligations`, `incident_cases`, `audit_findings` via Supabase Realtime channels
   - Dashboard tiles auto-update on row INSERT/UPDATE without page reload
   - Scope subscription to `institution_id` filter to prevent cross-tenant leakage

2. **In-app notification centre:**
   - `notifications` table (user_id, title, body, link, read_at, source_module, created_at)
   - Trigger: insert notification row whenever escalation emails are sent (compliance, risk, audit, incidents)
   - Bell icon in protected layout header with unread badge count
   - Notification dropdown with mark-read, mark-all-read, link to source record

3. **Cross-module traceability graph:**
   - Nivo network graph component: `components/reporting/TraceabilityGraph.tsx`
   - Nodes: Objectives, KPIs, Risks, Controls, Findings. Edges from FK relationships.
   - Accessible from executive dashboard as a "Traceability" tab

**Effort:** 2–3 weeks  
**Stack changes:** Enable Supabase Realtime on selected tables (Supabase Dashboard toggle)

---

### Stream B — ESG + Analytics Platform

#### Phase B1: ESG Metrics and Reporting Module *(Priority: High)*

**Goal:** Add a first-class ESG module covering Environmental, Social, and Governance metrics collection, target tracking, and stakeholder-facing disclosure reports.

**Deliverables:**
1. **Database:**
   - `esg_frameworks` (GRI, SASB, TCFD — seeded reference table)
   - `esg_metrics` (metric_code, category [Environmental/Social/Governance], unit, framework_id, description)
   - `esg_readings` (metric_id, period, actual_value, target_value, status, evidence_id, notes)
   - `esg_disclosures` (title, period, published_at, framework_id, generated_pdf_path)
   - RLS + audit triggers following existing patterns

2. **ESG data collection:**
   - `/esg` module: metric definitions (seeded from GRI/SASB taxonomy), reading entry form, evidence upload
   - Roles: ESG Officer (create/edit metrics and readings), Governance Officer (approve disclosures), Board (view)

3. **ESG dashboard:**
   - Materiality matrix (Nivo scatter: significance to stakeholders vs. significance to business)
   - Environmental metrics panel (energy, carbon, water trend charts)
   - Social metrics panel (safety incidents, diversity ratios)
   - Governance posture score (composite of board independence, audit compliance, transparency disclosures)

4. **ESG disclosure report:**
   - Puppeteer-generated PDF following GRI index structure
   - Scheduled dispatch (leverages Phase A2 report scheduler)

**Effort:** 5–7 weeks  
**Stack changes:** None (Supabase + Next.js + existing Puppeteer PDF setup)

---

#### Phase B2: ISO 9001:2015 Quality Management System Module *(Priority: High)*

**Goal:** Add a QMS module that documents quality objectives, manages controlled documents, tracks non-conformances, and supports management reviews.

**Deliverables:**
1. **Database:**
   - `qms_documents` (document_number, title, type [policy/procedure/work-instruction/form/record], version, status [draft/active/superseded/obsolete], effective_date, review_date, owner_id, storage_path)
   - `qms_document_approvals` (document_id, approver_id, approved_at, signature_text)
   - `quality_objectives` (linked to strategic_objectives FK; target, metric, measurement_period, owner_id)
   - `non_conformances` (nc_number, description, source [internal-audit/customer/supplier/process], root_cause, status, corrective_action_plan, verification_due_date)
   - `management_reviews` (period, chair_id, status, inputs_json, outputs_json, action_items)
   - RLS + audit triggers

2. **Document control:**
   - `/qms/documents` CRUD with version increment on update
   - Controlled distribution list per document (read-only access tracked)
   - Review date auto-alert (mirrors compliance obligation escalation pattern)

3. **Non-conformance register:**
   - `/qms/non-conformances` — create, assign, root-cause, corrective action, close
   - Distinct from audit findings: NC tracks process failures; findings track control failures

4. **Management review workflow:**
   - Meeting records with mandatory input sections (audit results, customer feedback, process performance, corrective action status)
   - Output: action items assigned to owners, tracked to closure

5. **PDCA cycle tracking:**
   - Each quality objective tracks Plan/Do/Check/Act status per period
   - PDCA status dashboard tile

**Effort:** 5–7 weeks  
**Stack changes:** None

---

#### Phase B3: Advanced Analytics — Predictive Modeling and R/Python Integration *(Priority: Medium, long lead time)*

**Goal:** Add a data analytics layer that supports predictive risk modeling, trend forecasting, and integration with R and Python analytics workflows.

**Architecture decision required — two viable options:**

**Option A: Analytics Sidecar Service (Recommended)**
- Deploy a lightweight Python FastAPI service alongside the Next.js app (Fly.io or Railway; does not affect Vercel deployment)
- FastAPI exposes `/predict/risk-score`, `/forecast/kpi`, `/anomaly/detect` endpoints
- Next.js API routes call FastAPI endpoints; results cached in Supabase `analytics_results` table
- R integration: `rpy2` within FastAPI service, or a separate R Plumber API

**Option B: Supabase Edge Functions + WASM**
- Lower complexity but limited ML library support
- Suitable for simple rule-based scoring, not true ML models

**Deliverables (Option A):**
1. **Analytics API service:**
   - `services/analytics/` — Python FastAPI app
   - Endpoints: risk score prediction (logistic regression on historical risk readings), KPI forecast (Prophet or simple ARIMA), anomaly detection (Z-score or Isolation Forest)
   - Auth: service-to-service JWT; not exposed to public

2. **Data export pipeline:**
   - `app/api/analytics/export/route.ts` — authenticated export of structured data (JSON) for all modules; consumed by analytics service
   - Respects RLS: export is institution-scoped

3. **R integration:**
   - R Plumber endpoint or `rpy2` in FastAPI for statistical functions
   - Initial use case: compliance posture regression model (predict likelihood of obligation breach given historical patterns)

4. **Next.js dashboard integration:**
   - Forecast band chart on KPI detail page (Recharts ReferenceLine for prediction bounds)
   - Risk score prediction panel on risk detail page ("Model-predicted residual risk: High in 90 days")
   - Anomaly alert in notification centre when model detects statistical deviation

5. **Analytics-grade CSV/Parquet export:**
   - `app/api/analytics/download/route.ts` — bulk export per module (CSV for Excel/R; Parquet for Python pandas)
   - Role-gated: Governance Officer and Admin only

**Effort:** 6–10 weeks (includes ML model development and deployment pipeline)  
**Stack changes:** New Python FastAPI service (Fly.io/Railway) + optional R runtime; Next.js calls remain REST

---

## Execution Roadmap

```
Month 1          Month 2          Month 3          Month 4–6
────────────────────────────────────────────────────────────────
Stream A
  [A1: KRI/KCI + Threshold Alerts ──────]
                  [A2: Audit Universe + Control Testing ──────]
                                   [A3: Realtime + Notifs + Graph ──]

Stream B
                  [B1: ESG Module ─────────────────]
                                   [B2: ISO 9001 QMS ────────────]
                                                   [B3: Analytics ──────────]
```

**Prerequisites before starting:**
1. Formally verify and close Phases 3–8 in STATUS.md (run `gsd-verify-work` for each)
2. Push all 9 pending Supabase migrations (`npx supabase db push`)
3. Complete Phase 1 + 2 UAT items listed in `01-HUMAN-UAT.md` and `02-HUMAN-UAT.md`

---

## Quick Wins (≤1 Week Each)

These can be done without waiting for full phase planning:

| Quick Win | Description | Effort |
|-----------|-------------|--------|
| **Analytics-grade data export** | Add `/api/analytics/download` CSV export for all 6 modules (risks, KPIs, obligations, findings, incidents, board actions) | 2–3 days |
| **KPI threshold alerts** | Add `alert_threshold` field to existing `kpis` table + cron job that emails owner when actual_value misses target by configurable % | 3–4 days |
| **Automated report scheduling** | Add `report_schedules` table + cron route leveraging existing PDF generation (`lib/reporting/pdf.ts`) | 3–4 days |
| **In-app notification badge** | Insert notification rows into a simple `notifications` table whenever existing Resend emails fire; add bell icon to layout header | 3–4 days |
| **STATUS.md verification** | Run gsd-verify-work on Phases 3–8 to formally close them and update STATUS.md | 1 day |

---

## Risk Register for Gap Closure

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Analytics sidecar adds infrastructure complexity | High | Medium | Start with rule-based forecasting in Next.js before introducing Python service |
| ESG taxonomy selection (GRI vs SASB vs TCFD) delays B1 | Medium | High | Ship generic `esg_frameworks` seed table; let governance officer configure which framework applies per institution |
| Supabase Realtime adds RLS bypass risk | Medium | High | Scope Realtime channels to `institution_id` filter; add integration test for cross-tenant data leakage |
| ISO 9001 QMS scope creep (full document lifecycle) | High | Medium | Deliver document register + NC tracking first; hold full approval workflow for v2 |
| R/Python service availability SLA | Medium | Medium | Cache analytics results in Supabase `analytics_results` table with TTL; dashboard shows cached value if service is unavailable |

---

*Document owner: GRC-Nexus engineering team*  
*Next review: After Phase A1 and B1 scoping sessions*
