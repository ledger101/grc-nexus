<!-- GSD:project-start source:PROJECT.md -->
## Project

**GRC-Nexus**

GRC-Nexus is a unified Governance, Risk, and Compliance operating platform for Zimbabwe's public sector MDAs (Ministries, Departments, Agencies) and SOEs (State-Owned Enterprises). It links national strategy (NDS2 2026–2030), enterprise risk management, board oversight, compliance, procurement integrity, incident management, and performance reporting in one auditable digital system. The prototype targets the most investor-compelling subset of the full 8-module platform, demonstrable within 4–6 weeks.

**Core Value:** A governance officer or board member can log in, see their institution's live risk posture and strategic KPI performance, and act on overdue obligations — all in one place, with a full audit trail.

### Constraints

- **Tech Stack:** Next.js 14 (App Router) + Supabase (Postgres, Auth, RLS) — already decided
- **Deployment:** Vercel (frontend) + Supabase cloud
- **Timeline:** 4–6 weeks for demoable prototype
- **Scope:** Phase 2 whitepaper priorities (Core Integrity Stack: strategic planning, ERM, compliance, internal audit, board management) as the prototype core
- **Security:** Row-Level Security enforced at Supabase layer; role-based access in Next.js middleware
- **Data residency:** Prototype uses Supabase cloud; production would require Southern Africa data residency
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Fixed Stack (Non-Negotiable)
| Technology | Version | Role | Notes |
|------------|---------|------|-------|
| **Next.js** | 14 (App Router) | Frontend framework | Server components, API routes, middleware |
| **Supabase** | Latest | Backend BaaS | Postgres, Auth, RLS, Storage, Realtime |
| **Postgres** | 15+ | Database | Managed by Supabase |
| **Vercel** | — | Hosting | Production deployment |
## UI & Component Library
### Recommended Stack
| Library | Version | Rationale | Confidence |
|---------|---------|-----------|------------|
| **shadcn/ui** | Latest (0.9.0) | Copy-paste component library built on Radix UI + Tailwind. Perfect for GRC dashboards: unstyled-by-default means you control every pixel; works flawlessly with Next.js 14 App Router; massive community and code examples. No npm install overhead. | HIGH |
| **Radix UI** | v1.1.0+ | Underlying primitives for shadcn/ui. Headless, accessible components (Dialog, Dropdown, Toast, Popover). You get them via shadcn/ui but worth understanding the dependency. | HIGH |
| **Tailwind CSS** | v3.4+ | Utility-first CSS framework. Paired with shadcn/ui by default. Essential for rapid dashboard styling without CSS bloat. | HIGH |
### Why NOT to use:
| Library | Why to Avoid |
|---------|-------------|
| **Material-UI (MUI)** | Opinionated design system; bundling overhead (>500KB). shadcn/ui gives you control without the weight. |
| **Chakra UI** | Similarly heavy (300KB+); shadcn/ui is lighter and more composable. |
| **Bootstrap** | Outdated for modern dashboards; Tailwind is standard 2025. |
### Setup Notes
- shadcn/ui components are pasted into your codebase, not npm-installed.
- Add components as needed: `npx shadcn-ui@latest add button dialog form table dropdown`.
- Tailwind config already includes Tailwind CSS and PostCSS.
## Forms & Validation
### Recommended Stack
| Library | Version | Rationale | Confidence |
|---------|---------|-----------|------------|
| **react-hook-form** | v7.66.0+ | Performance-first form library using uncontrolled components. Minimal re-renders; plays beautifully with Next.js Server Actions. Integrates seamlessly with Zod for validation. Industry standard. | HIGH |
| **Zod** | v3.24.2+ | TypeScript-first schema validation. Define schemas once, get runtime validation + static type inference. Unmatched DX for forms, API payloads, and Supabase RLS enforcement. 93.3/100 Context7 benchmark score. | HIGH |
### Why NOT to use:
| Library | Why to Avoid |
|---------|-------------|
| **Conform** | Progressive-enhancement-first; adds complexity for GRC's form-heavy workflows. Better for simpler forms. |
| **Valibot** | Lighter bundle (1.37KB vs 17.7KB for simple schemas), but ecosystem is smaller. Save the 16KB only if you're hyper-constrained on bundle. For GRC, Zod's ecosystem and community support wins. |
### Integration Pattern
## Data Display & Tables
### Recommended Stack
| Library | Version | Rationale | Confidence |
|---------|---------|-----------|------------|
| **TanStack Table (React Table)** | v9.0.0+ | Headless, framework-agnostic table library. Essential for GRC compliance matrices, risk registers, audit findings. Handles sorting, filtering, pagination, column resizing without pre-built UI. Pairs with shadcn/ui for components. 89.1/100 Context7 score. | HIGH |
| **shadcn/ui Table** | Latest | Radix-based table component. Pre-composed with TanStack Table. Use for standard layouts. | HIGH |
### Why NOT to use:
| Library | Why to Avoid |
|---------|-------------|
| **Material React Table (MRT)** | Built on MUI (heavy). TanStack Table + shadcn/ui is lighter and more flexible. |
| **ag-Grid** | Enterprise-grade overkill; expensive license; TanStack Table covers 95% of use cases free. |
## Charting & Data Visualization
### Critical Decision: Heatmaps for Risk Matrices
| Library | Heatmap Support | 2025 Verdict |
|---------|-----------------|--------------|
| **Recharts** | ❌ No | Excellent for bar/line/area; lacks heatmaps. 150KB bundle. |
| **Tremor** | ❌ No | Beautiful pre-built dashboards on top of Recharts. No heatmaps. 200KB. |
| **Nivo** | ✅ Yes | 30+ chart types including heatmaps, network graphs, treemaps. Only option for native heatmaps. 500KB+. |
### Recommended Stack
| Library | Version | Use Case | Rationale | Confidence |
|---------|---------|----------|-----------|------------|
| **Nivo** | Latest | Risk heatmaps, compliance matrices, geographic visualizations | **Only library with native heatmap support.** Server-side rendering for PDF export. Can render on Node.js for Puppeteer/PDF generation. Perfect for GRC's core visual needs. | HIGH |
| **Recharts** | v3.3.0+ | KPI trends, performance charts (line, bar, area) | Fast, lightweight (150KB), composable. Use for performance trending, not heatmaps. | HIGH |
### Why NOT to use:
| Library | Why to Avoid |
|---------|-------------|
| **Chart.js** | Canvas-only; limited interactivity; older codebase. Recharts is more React-native. |
| **D3.js** | Too low-level; requires heavy custom work. Nivo is D3 abstracted nicely. |
| **Plotly.js** | Heavy (3MB+); overkill for GRC. |
### Architecture Recommendation
## PDF Generation & Statutory Reports
### Verdict: Use Nivo + Puppeteer
| Library | Best For | 2025 Status | Confidence |
|---------|----------|------------|------------|
| **Nivo** | Charts → PDF/images | Server-side rendering (Node.js). Only way to embed heatmaps in PDFs. | HIGH |
| **Puppeteer** | HTML → PDF conversion | Pixel-perfect rendering. Use for full statutory report layout. 100MB Chromium binary; use `@sparticuz/chromium` for Vercel (42MB optimized). | HIGH |
| **@react-pdf/renderer** | JSX → PDF | Works on Vercel (no binary). Lighter but **no heatmap chart support**. Use only if you don't need chart rendering. | MEDIUM |
### Recommended Stack
| Library | Version | Use Case | Rationale | Confidence |
|---------|---------|----------|-----------|------------|
| **Puppeteer** | v21.0.0+ | Full statutory report generation | Render React components (with Nivo charts) to pixel-perfect PDFs. Use `@sparticuz/chromium` for Vercel serverless. Production-grade. | HIGH |
| **@sparticuz/chromium** | Latest | Puppeteer optimization for Vercel | Pre-compiled, size-optimized Chromium binary (42MB vs 100MB). Mandatory for Vercel serverless. | HIGH |
### Why NOT to use:
| Library | Why to Avoid |
|---------|-------------|
| **react-pdf** | No chart rendering; can't embed heatmaps. Only use if reports have no visualizations. |
| **PDFKit** | Low-level; requires heavy custom layout logic. Puppeteer abstracts this. |
### Implementation Pattern
## File Upload & Storage
### Recommended Stack
| Library | Version | Rationale | Confidence |
|---------|---------|-----------|------------|
| **Supabase Storage** | Native | Same Supabase instance as DB + Auth. RLS integration maps directly to compliance evidence uploads. TUS resumable protocol for large files. Cloudflare CDN included. No separate vendor/contract. | HIGH |
### Why NOT to use:
| Library | Why to Avoid |
|---------|-------------|
| **UploadThing** | Introduces vendor lock-in; separate pricing; adds complexity for single-tenant GRC app. Fine for multi-tenant SaaS; overkill here. |
| **Cloudinary** | Vendor lock-in; designed for media/images, not compliance documents. |
### Integration Pattern
## Email Notifications & Alerts
### Recommended Stack
| Library | Version | Use Case | Rationale | Confidence |
|---------|---------|----------|-----------|------------|
| **Resend** | Latest | Production email delivery | Production-grade email service. Designed for Vercel. Built-in bounce handling, deliverability tracking, webhooks for failed sends. Essential for compliance task alerts. | HIGH |
### Secondary (Development)
| Library | Version | Use Case | Rationale | Confidence |
|---------|---------|----------|-----------|------------|
| **Nodemailer** | v6.9.0+ | Development/testing | Free; works with local SMTP (Mailpit). Pair with Resend in production via environment variables. | HIGH |
### Why NOT to use:
| Library | Why to Avoid |
|---------|-------------|
| **SendGrid** | More expensive; no significant advantage over Resend for GRC. |
| **AWS SES** | Requires AWS account; more setup overhead. Resend is simpler for Next.js. |
### Implementation Pattern
## State Management
### Verdict: TanStack Query + Zustand
| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| **TanStack Query (React Query)** | v5.60.5+ | Server state | Fetching, caching, revalidation of API data. All async data from Supabase. Automatic background refresh. 93.6/100 Context7 score. | HIGH |
| **Zustand** | v4.5.0+ | Client state | UI state (modals open/closed, form drafts, filter toggles). Lightweight, no boilerplate. | HIGH |
### Architecture
### Why NOT to use:
| Library | Why to Avoid |
|---------|-------------|
| **Redux** | Boilerplate-heavy; TanStack Query + Zustand together are simpler and lighter. |
| **Jotai** | Atom-based state; good but Zustand's simpler API wins for team productivity. |
| **Context API alone** | No caching, revalidation, or background fetching. TanStack Query is designed for these. |
## Date & Time Handling
### Recommended Stack
| Library | Version | Rationale | Confidence |
|---------|---------|-----------|------------|
| **date-fns** | v3.0.0+ | Functional library for date manipulation. Tree-shakable (only import what you use). Essential for GRC: compliance due dates, audit report periods, KPI baseline/target dates. 86.9M weekly downloads; mature. | HIGH |
### Why NOT to use:
| Library | Why to Avoid |
|---------|-------------|
| **Day.js** | 2KB lighter (matters only for heavy browser apps). date-fns's tree-shaking and functional API is superior for GRC's date-heavy workflows. |
| **Moment.js** | Deprecated; day.js is its replacement. Don't use Moment. |
| **Luxon** | Heavier; date-fns is standard. |
### Usage Pattern
## Testing
### Recommended Stack
| Library | Version | Use Case | Rationale | Confidence |
|---------|---------|----------|-----------|------------|
| **Vitest** | Latest | Unit & integration tests | Vite-native, faster than Jest. Handles Server Actions as plain functions. Official Next.js recommendation for 2025+. | HIGH |
| **React Testing Library** | Latest | Component testing | Standard for React components. Pair with Vitest. | HIGH |
| **Playwright** | Latest | E2E & integration tests | Test auth flows, form submissions hitting real endpoints, RLS enforcement. Required for Supabase + auth workflows. | HIGH |
### Why NOT to use:
| Library | Why to Avoid |
|---------|-------------|
| **Jest** | Default through 2024; community moved to Vitest in 2025. Don't start fresh with Jest. |
| **Cypress** | Heavier than Playwright; Playwright is faster and recommended by Next.js. |
### Test Strategy for GRC
## Logging & Observability
### Recommended Stack
| Library | Version | Rationale | Confidence |
|---------|---------|-----------|------------|
| **Pino** | v8.17.0+ | Structured logging for Next.js server code. JSON output for production (Vercel, logging aggregators). Async logging with minimal overhead. Essential for GRC audit trails and compliance debugging. | HIGH |
### Why NOT to use:
| Library | Why to Avoid |
|---------|-------------|
| **Winston** | More flexible but heavier; Pino's defaults are perfect for Next.js. Use Winston only if you need multiple custom transports. |
| **console.log** | Never in production. Unstructured; breaks audit trails. Use Pino. |
### Implementation Pattern
## Authentication & Authorization (Supabase)
### Recommended Stack
| Library | Version | Rationale | Confidence |
|---------|---------|-----------|------------|
| **@supabase/ssr** | Latest | SSR auth handling for Next.js App Router. Manages auth tokens in cookies (secure). Mandatory for server components. | HIGH |
| **@supabase/supabase-js** | v2.38.0+ | Supabase client library. Query builder, RLS enforcement, realtime subscriptions. | HIGH |
### Middleware Authentication Pattern
### Row-Level Security (RLS) Enforced at DB Layer
## Audit Trail & Compliance Logging
### GRC-Critical Requirement: Immutable Audit Logs
| Approach | Implementation | Rationale | Confidence |
|----------|---|-----------|------------|
| **Postgres Triggers** | Native SQL triggers on tables (INSERT/UPDATE/DELETE). Record to `audit_log` table with user_id, timestamp, old values, new values. | No external dependencies; enforced at DB layer (survives app bugs); RLS-compatible. Supabase makes this easy. | HIGH |
| **PGAudit Extension** | `pgaudit` Postgres extension. Similar to triggers but Postgres-native. | More mature but less flexible than custom triggers. Either works. | HIGH |
### Recommended Implementation
## Unique GRC Patterns
### Pattern 1: Risk 5×5 Matrix
### Pattern 2: Compliance Status Timeline
### Pattern 3: Board Action Tracking
## Installation & Setup Quick Reference
# Core stack
# UI & Components
# Forms & Validation
# Tables
# Charting
# PDF Generation
# File Storage (Supabase native, no install needed)
# Email
# State Management
# Date/Time
# Logging
# Testing
# Dev dependencies
## Critical Version Compatibility Notes
### Next.js 14 + Supabase @supabase/ssr
- **Requirement:** Use `@supabase/ssr` (not `@supabase/supabase-js` in middleware).
- **Why:** Handles cookie-based auth for Server Components. Older versions used localStorage (breaks SSR).
- **Version:** Latest `@supabase/ssr` includes full App Router support.
### Puppeteer on Vercel
- **Issue:** Puppeteer's Chromium binary (~100MB) exceeds Vercel's function size limit (50MB).
- **Solution:** Use `@sparticuz/chromium` (42MB optimized) instead.
- **Code:**
### Tailwind CSS + shadcn/ui
- **Requirement:** Tailwind must be installed for shadcn/ui to work.
- **Setup:** `npx create-next-app@latest` includes Tailwind by default with Next.js 14.
### Zod + react-hook-form
- **Integration:** Use `@hookform/resolvers/zod` to bridge them.
- **Version Constraint:** Zod v3.x (not v4 yet; some breaking changes).
## Confidences by Domain
| Domain | Confidence | Reason |
|--------|------------|--------|
| **UI Stack (shadcn/ui + Tailwind)** | HIGH | Verified with official Next.js docs, Context7, and 2025 consensus. Zero controversy. |
| **Forms (react-hook-form + Zod)** | HIGH | Official Next.js recommendation; 93.3/100 Context7 score for Zod; widespread adoption. |
| **Tables (TanStack Table)** | HIGH | 89.1/100 Context7; industry standard for data-heavy apps. |
| **Charting (Nivo for heatmaps)** | HIGH | Only native heatmap support confirmed via PkgPulse 2026 comparison. No alternatives. |
| **PDF (Puppeteer + Sparticuz)** | HIGH | Verified production comparison with @react-pdf/renderer; Puppeteer wins for chart rendering. |
| **File Storage (Supabase)** | HIGH | Native integration with auth/RLS; verified UploadThing trade-offs. |
| **Email (Resend)** | HIGH | Vercel-native; official recommendation for Next.js apps. |
| **State (TanStack Query + Zustand)** | HIGH | 2025 consensus via multiple sources; "use both" pattern confirmed. |
| **Audit Trails (Postgres Triggers)** | HIGH | Supabase native; verified via blog post and docs. Zero external dependencies. |
| **Testing (Vitest + Playwright)** | HIGH | Official Next.js docs updated 2025; Vitest is new standard. |
| **Logging (Pino)** | MEDIUM-HIGH | Best practice for structured logging; confirmed via multiple sources. Pino vs Winston is a trade-off; Pino chosen for Next.js fit. |
## Changelog & Updates (2025)
- **Vitest replaces Jest** as official Next.js test runner (2025).
- **Recharts v3** released Dec 2024 with performance improvements.
- **Nivo heatmaps** verified as only native solution for risk matrices.
- **@supabase/ssr** required for App Router auth (mandatory change from older @supabase/supabase-js in middleware).
- **Puppeteer + @sparticuz/chromium** verified as Vercel-compatible PDF solution.
## Questions for Phase-Specific Research
- **Email templates:** Use React Email for component-based templates? Resend integrates well with it.
- **Realtime subscriptions:** Will board meeting updates or risk changes use Supabase Realtime? Impacts TanStack Query configuration.
- **Webhook integrations:** Will GRC-Nexus push alerts to external systems (Teams, Slack)? Affects email architecture.
- **Multi-institution roadmap:** Current stack assumes single institution. Multi-tenant adds complexity to RLS policies and audit logging.
## Sources
- [Next.js 14 Testing Guide — Official Docs](https://nextjs.org/docs/app/guides/testing)
- [Building a Full Stack App with NextJS 14, Supabase, and ShadcnUI — Medium](https://omarmokhfi.medium.com/building-a-full-stack-apps-with-nextjs-14-supabase-and-shadcnui-b3a66ae138af)
- [Supabase + Next.js: The Stack Taking 2025 by Storm — JavaScript in Plain English](https://javascript.plainenglish.io/supabase-next-js-the-stack-thats-taking-2025-by-storm-6bc187241b07)
- [Recharts v3 vs Tremor vs Nivo: React Charts 2026 — PkgPulse](https://www.pkgpulse.com/guides/recharts-v3-vs-tremor-vs-nivo-react-charting-2026)
- [PDF Generation: Puppeteer vs @react-pdf/renderer — Production Comparison](https://dev.to/iurii_rogulia/pdf-generation-on-the-server-puppeteer-vs-react-pdfrenderer-a-production-comparison-44cg)
- [Zustand vs TanStack Query: Maybe Both? — Adel](https://helloadel.com/blog/zustand-vs-tanstack-query-maybe-both/)
- [Row Level Security in Supabase: Complete Guide for Next.js — StarMorph](https://blog.starmorph.com/blog/row-level-security-supabase-tables-nextjs)
- [Postgres Audit — Supabase Blog](https://supabase.com/blog/postgres-audit)
- [Zod vs Valibot: Which Validation Library — DEV Community](https://dev.to/sheraz4194/zod-vs-valibot-which-validation-library-is-right-for-your-typescript-project-303d)
- [Date-fns vs Dayjs vs Moment — npm-compare](https://npm-compare.com/date-fns,dayjs,moment)
- [Pino vs Winston: Choosing the Right Logger — DEV Community](https://dev.to/wallacefreitas/pino-vs-winston-choosing-the-right-logger-for-your-nodejs-application-369n)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
