-- =============================================================
-- supabase/demo-seed.sql
-- GRC-Nexus Comprehensive Demo Data Seed
-- =============================================================
-- Covers all 8 modules:
--   1. Foundation      — institutions, users, roles
--   2. Strategic       — objectives, KPIs, KPI readings
--   3. Risk (ERM)      — risks, risk treatments
--   4. Compliance      — obligations, attestations
--   5. Board Mgmt      — meetings, resolutions, action items
--   6. Internal Audit  — audit findings
--   7. Incidents       — incident cases, case events
--   8. (Dashboard data derived from above)
--
-- Institution: Ministry of Finance and Economic Development (MoF)
-- Context: Zimbabwe National Development Strategy 2 (NDS2 2026–2030)
--
-- Demo credentials (non-admin users): Demo@GRC2026!
-- Admin (existing):  admin@grcnexus.gov.zw / Admin@GRC2026!
--
-- Usage:
--   Option A — Supabase SQL Editor: paste and run
--   Option B — CLI: npx supabase db execute --local < supabase/demo-seed.sql
--
-- IMPORTANT: This script is idempotent (ON CONFLICT DO NOTHING).
--            Run after all migrations have been applied.
--            Do NOT run in production.
-- =============================================================

BEGIN;

DO $seed$
DECLARE
  -- ── Institutions ─────────────────────────────────────────
  v_inst_mof   uuid := '00000000-0000-0000-0000-000000000010'; -- Ministry of Finance (existing)
  v_inst_moh   uuid := '00000000-0000-0000-0000-000000000011'; -- Ministry of Health & Child Care
  v_inst_rbz   uuid := '00000000-0000-0000-0000-000000000012'; -- Reserve Bank of Zimbabwe
  v_inst_zesa  uuid := '00000000-0000-0000-0000-000000000013'; -- Zimbabwe Electricity Supply Authority

  -- ── Users ────────────────────────────────────────────────
  v_admin_id   uuid := '00000000-0000-0000-0000-000000000001'; -- System Administrator (existing)
  v_ceo_id     uuid := '00000000-0000-0000-0000-000000000002'; -- Tendai Moyo  (CEO)
  v_risk_id    uuid := '00000000-0000-0000-0000-000000000003'; -- Chido Mutasa (Risk Officer)
  v_board1_id  uuid := '00000000-0000-0000-0000-000000000004'; -- Farai Zvobgo  (Board Member)
  v_board2_id  uuid := '00000000-0000-0000-0000-000000000005'; -- Rudo Ncube    (Board Member)
  v_audit_id   uuid := '00000000-0000-0000-0000-000000000006'; -- Tinashe Dube  (Audit Officer)
  v_dept_id    uuid := '00000000-0000-0000-0000-000000000007'; -- Simba Chigwedere (Dept Head)

  -- ── Strategic Objectives ─────────────────────────────────
  v_obj1  uuid := '00000000-0000-0000-0000-000000000020'; -- Revenue Mobilisation & Tax Reform
  v_obj2  uuid := '00000000-0000-0000-0000-000000000021'; -- Public Debt Management
  v_obj3  uuid := '00000000-0000-0000-0000-000000000022'; -- Digital Financial Services
  v_obj4  uuid := '00000000-0000-0000-0000-000000000023'; -- Social Protection Fund Efficiency
  v_obj5  uuid := '00000000-0000-0000-0000-000000000024'; -- Infrastructure Bond Programme
  v_obj6  uuid := '00000000-0000-0000-0000-000000000025'; -- Green Budget Framework
  v_obj7  uuid := '00000000-0000-0000-0000-000000000026'; -- PFMA Compliance & Governance
  v_obj8  uuid := '00000000-0000-0000-0000-000000000027'; -- Regional Trade Finance (AfCFTA)
  v_obj9  uuid := '00000000-0000-0000-0000-000000000028'; -- Rural Agro-Finance Initiative

  -- ── KPIs ─────────────────────────────────────────────────
  v_kpi01 uuid := '00000000-0000-0000-0000-000000000030'; -- Tax-to-GDP Ratio
  v_kpi02 uuid := '00000000-0000-0000-0000-000000000031'; -- VAT Compliance Rate
  v_kpi03 uuid := '00000000-0000-0000-0000-000000000032'; -- New Taxpayer Registrations
  v_kpi04 uuid := '00000000-0000-0000-0000-000000000033'; -- Public Debt-to-GDP Ratio
  v_kpi05 uuid := '00000000-0000-0000-0000-000000000034'; -- Domestic Debt Service Ratio
  v_kpi06 uuid := '00000000-0000-0000-0000-000000000035'; -- Mobile Money Penetration
  v_kpi07 uuid := '00000000-0000-0000-0000-000000000036'; -- Digital Payment Volume
  v_kpi08 uuid := '00000000-0000-0000-0000-000000000037'; -- Social Protection Beneficiaries
  v_kpi09 uuid := '00000000-0000-0000-0000-000000000038'; -- Fund Disbursement Accuracy
  v_kpi10 uuid := '00000000-0000-0000-0000-000000000039'; -- Infrastructure Bond Value Raised
  v_kpi11 uuid := '00000000-0000-0000-0000-000000000040'; -- Infrastructure Projects Funded
  v_kpi12 uuid := '00000000-0000-0000-0000-000000000041'; -- Climate Budget Tag Ratio
  v_kpi13 uuid := '00000000-0000-0000-0000-000000000042'; -- Climate Finance Mobilised
  v_kpi14 uuid := '00000000-0000-0000-0000-000000000043'; -- PFMA Full-Compliance MDAs
  v_kpi15 uuid := '00000000-0000-0000-0000-000000000044'; -- Internal Audit Plan Completion
  v_kpi16 uuid := '00000000-0000-0000-0000-000000000045'; -- AfCFTA Trade Finance Volume
  v_kpi17 uuid := '00000000-0000-0000-0000-000000000046'; -- Rural Agricultural Credit Access
  v_kpi18 uuid := '00000000-0000-0000-0000-000000000047'; -- Agro-Finance Loan Disbursement

  -- ── Risks ────────────────────────────────────────────────
  v_risk01 uuid := '00000000-0000-0000-0000-000000000050'; -- Revenue Shortfall (Informal Economy)
  v_risk02 uuid := '00000000-0000-0000-0000-000000000051'; -- FX Volatility & Debt Servicing
  v_risk03 uuid := '00000000-0000-0000-0000-000000000052'; -- Cyber Attack on ZIMRA
  v_risk04 uuid := '00000000-0000-0000-0000-000000000053'; -- Sovereign Debt Default
  v_risk05 uuid := '00000000-0000-0000-0000-000000000054'; -- PFMA Non-Compliance Across MDAs
  v_risk06 uuid := '00000000-0000-0000-0000-000000000055'; -- Ghost Beneficiaries / Corruption
  v_risk07 uuid := '00000000-0000-0000-0000-000000000056'; -- Infrastructure Bond Absorption
  v_risk08 uuid := '00000000-0000-0000-0000-000000000057'; -- Regulatory Fragmentation
  v_risk09 uuid := '00000000-0000-0000-0000-000000000058'; -- Climate Finance Shortfall
  v_risk10 uuid := '00000000-0000-0000-0000-000000000059'; -- Mobile Money Security Breach

  -- ── Risk Treatments ──────────────────────────────────────
  v_rt01 uuid := '00000000-0000-0000-0000-000000000060';
  v_rt02 uuid := '00000000-0000-0000-0000-000000000061';
  v_rt03 uuid := '00000000-0000-0000-0000-000000000062';
  v_rt04 uuid := '00000000-0000-0000-0000-000000000063';
  v_rt05 uuid := '00000000-0000-0000-0000-000000000064';
  v_rt06 uuid := '00000000-0000-0000-0000-000000000065';
  v_rt07 uuid := '00000000-0000-0000-0000-000000000066';
  v_rt08 uuid := '00000000-0000-0000-0000-000000000067';
  v_rt09 uuid := '00000000-0000-0000-0000-000000000068';
  v_rt10 uuid := '00000000-0000-0000-0000-000000000069';
  v_rt11 uuid := '00000000-0000-0000-0000-000000000070';
  v_rt12 uuid := '00000000-0000-0000-0000-000000000071';
  v_rt13 uuid := '00000000-0000-0000-0000-000000000072';

  -- ── Compliance Obligations ───────────────────────────────
  v_comp01 uuid := '00000000-0000-0000-0000-000000000080';
  v_comp02 uuid := '00000000-0000-0000-0000-000000000081';
  v_comp03 uuid := '00000000-0000-0000-0000-000000000082';
  v_comp04 uuid := '00000000-0000-0000-0000-000000000083';
  v_comp05 uuid := '00000000-0000-0000-0000-000000000084';
  v_comp06 uuid := '00000000-0000-0000-0000-000000000085';
  v_comp07 uuid := '00000000-0000-0000-0000-000000000086';
  v_comp08 uuid := '00000000-0000-0000-0000-000000000087';
  v_comp09 uuid := '00000000-0000-0000-0000-000000000088';
  v_comp10 uuid := '00000000-0000-0000-0000-000000000089';

  -- ── Audit Findings ───────────────────────────────────────
  v_aud01 uuid := '00000000-0000-0000-0000-000000000100';
  v_aud02 uuid := '00000000-0000-0000-0000-000000000101';
  v_aud03 uuid := '00000000-0000-0000-0000-000000000102';
  v_aud04 uuid := '00000000-0000-0000-0000-000000000103';
  v_aud05 uuid := '00000000-0000-0000-0000-000000000104';
  v_aud06 uuid := '00000000-0000-0000-0000-000000000105';
  v_aud07 uuid := '00000000-0000-0000-0000-000000000106';

  -- ── Board Meetings ───────────────────────────────────────
  v_mtg01 uuid := '00000000-0000-0000-0000-000000000110'; -- Q4 2025 (closed)
  v_mtg02 uuid := '00000000-0000-0000-0000-000000000111'; -- Q1 2026 (closed)
  v_mtg03 uuid := '00000000-0000-0000-0000-000000000112'; -- Special Cyber Session (closed)
  v_mtg04 uuid := '00000000-0000-0000-0000-000000000113'; -- Q2 2026 (scheduled)

  -- ── Board Resolutions ────────────────────────────────────
  v_res01 uuid := '00000000-0000-0000-0000-000000000120';
  v_res02 uuid := '00000000-0000-0000-0000-000000000121';
  v_res03 uuid := '00000000-0000-0000-0000-000000000122';
  v_res04 uuid := '00000000-0000-0000-0000-000000000123';
  v_res05 uuid := '00000000-0000-0000-0000-000000000124';
  v_res06 uuid := '00000000-0000-0000-0000-000000000125';
  v_res07 uuid := '00000000-0000-0000-0000-000000000126';
  v_res08 uuid := '00000000-0000-0000-0000-000000000127';

  -- ── Board Action Items ───────────────────────────────────
  v_act01 uuid := '00000000-0000-0000-0000-000000000140';
  v_act02 uuid := '00000000-0000-0000-0000-000000000141';
  v_act03 uuid := '00000000-0000-0000-0000-000000000142';
  v_act04 uuid := '00000000-0000-0000-0000-000000000143';
  v_act05 uuid := '00000000-0000-0000-0000-000000000144';
  v_act06 uuid := '00000000-0000-0000-0000-000000000145';
  v_act07 uuid := '00000000-0000-0000-0000-000000000146';
  v_act08 uuid := '00000000-0000-0000-0000-000000000147';

  -- ── Incident Cases ───────────────────────────────────────
  v_inc01 uuid := '00000000-0000-0000-0000-000000000160'; -- Payroll Fraud
  v_inc02 uuid := '00000000-0000-0000-0000-000000000161'; -- Procurement Conflict of Interest
  v_inc03 uuid := '00000000-0000-0000-0000-000000000162'; -- ZIMRA Cyber / Phishing
  v_inc04 uuid := '00000000-0000-0000-0000-000000000163'; -- Workplace Safety (closed)
  v_inc05 uuid := '00000000-0000-0000-0000-000000000164'; -- Social Protection Data Leak
  v_inc06 uuid := '00000000-0000-0000-0000-000000000165'; -- Irregular Appointment
  v_inc07 uuid := '00000000-0000-0000-0000-000000000166'; -- Asset Theft

BEGIN

-- ================================================================
-- 1. INSTITUTIONS
-- ================================================================

INSERT INTO public.institutions (id, name, type, created_at, updated_at)
VALUES
  (v_inst_moh,  'Ministry of Health & Child Care',          'ministry',   now() - interval '180 days', now() - interval '30 days'),
  (v_inst_rbz,  'Reserve Bank of Zimbabwe',                 'soe',        now() - interval '180 days', now() - interval '15 days'),
  (v_inst_zesa, 'Zimbabwe Electricity Supply Authority',    'soe',        now() - interval '180 days', now() - interval '20 days')
ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- 2. USERS  (auth.users + auth.identities + user_profiles + user_roles)
--    Password for all demo users: Demo@GRC2026!
-- ================================================================

-- ── CEO: Tendai Moyo ─────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  v_ceo_id, '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'tendai.moyo@mof.gov.zw',
  extensions.crypt('Demo@GRC2026!', extensions.gen_salt('bf')),
  now() - interval '60 days',
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Tendai","last_name":"Moyo"}',
  now() - interval '60 days', now() - interval '5 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  v_ceo_id, v_ceo_id,
  format('{"sub":"%s","email":"tendai.moyo@mof.gov.zw"}', v_ceo_id)::jsonb,
  'email', v_ceo_id::text,
  now() - interval '5 days', now() - interval '60 days', now() - interval '5 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_profiles (id, institution_id, first_name, last_name, status, active_role, created_at, updated_at)
VALUES (v_ceo_id, v_inst_mof, 'Tendai', 'Moyo', 'approved', 'ceo', now() - interval '60 days', now() - interval '60 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, institution_id, role_name, assigned_by, assigned_at)
VALUES (v_ceo_id, v_inst_mof, 'ceo', v_admin_id, now() - interval '60 days')
ON CONFLICT (user_id, institution_id, role_name) DO NOTHING;

-- ── Risk Officer: Chido Mutasa ───────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  v_risk_id, '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'chido.mutasa@mof.gov.zw',
  extensions.crypt('Demo@GRC2026!', extensions.gen_salt('bf')),
  now() - interval '55 days',
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Chido","last_name":"Mutasa"}',
  now() - interval '55 days', now() - interval '2 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  v_risk_id, v_risk_id,
  format('{"sub":"%s","email":"chido.mutasa@mof.gov.zw"}', v_risk_id)::jsonb,
  'email', v_risk_id::text,
  now() - interval '2 days', now() - interval '55 days', now() - interval '2 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_profiles (id, institution_id, first_name, last_name, status, active_role, created_at, updated_at)
VALUES (v_risk_id, v_inst_mof, 'Chido', 'Mutasa', 'approved', 'risk-officer', now() - interval '55 days', now() - interval '55 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, institution_id, role_name, assigned_by, assigned_at)
VALUES (v_risk_id, v_inst_mof, 'risk-officer', v_admin_id, now() - interval '55 days')
ON CONFLICT (user_id, institution_id, role_name) DO NOTHING;

-- ── Board Member: Farai Zvobgo ───────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  v_board1_id, '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'farai.zvobgo@board.mof.gov.zw',
  extensions.crypt('Demo@GRC2026!', extensions.gen_salt('bf')),
  now() - interval '90 days',
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Farai","last_name":"Zvobgo"}',
  now() - interval '90 days', now() - interval '7 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  v_board1_id, v_board1_id,
  format('{"sub":"%s","email":"farai.zvobgo@board.mof.gov.zw"}', v_board1_id)::jsonb,
  'email', v_board1_id::text,
  now() - interval '7 days', now() - interval '90 days', now() - interval '7 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_profiles (id, institution_id, first_name, last_name, status, active_role, created_at, updated_at)
VALUES (v_board1_id, v_inst_mof, 'Farai', 'Zvobgo', 'approved', 'board-member', now() - interval '90 days', now() - interval '90 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, institution_id, role_name, assigned_by, assigned_at)
VALUES (v_board1_id, v_inst_mof, 'board-member', v_admin_id, now() - interval '90 days')
ON CONFLICT (user_id, institution_id, role_name) DO NOTHING;

-- ── Board Member: Rudo Ncube ─────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  v_board2_id, '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'rudo.ncube@board.mof.gov.zw',
  extensions.crypt('Demo@GRC2026!', extensions.gen_salt('bf')),
  now() - interval '90 days',
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Rudo","last_name":"Ncube"}',
  now() - interval '90 days', now() - interval '3 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  v_board2_id, v_board2_id,
  format('{"sub":"%s","email":"rudo.ncube@board.mof.gov.zw"}', v_board2_id)::jsonb,
  'email', v_board2_id::text,
  now() - interval '3 days', now() - interval '90 days', now() - interval '3 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_profiles (id, institution_id, first_name, last_name, status, active_role, created_at, updated_at)
VALUES (v_board2_id, v_inst_mof, 'Rudo', 'Ncube', 'approved', 'board-member', now() - interval '90 days', now() - interval '90 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, institution_id, role_name, assigned_by, assigned_at)
VALUES (v_board2_id, v_inst_mof, 'board-member', v_admin_id, now() - interval '90 days')
ON CONFLICT (user_id, institution_id, role_name) DO NOTHING;

-- ── Audit Officer: Tinashe Dube ──────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  v_audit_id, '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'tinashe.dube@mof.gov.zw',
  extensions.crypt('Demo@GRC2026!', extensions.gen_salt('bf')),
  now() - interval '45 days',
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Tinashe","last_name":"Dube"}',
  now() - interval '45 days', now() - interval '1 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  v_audit_id, v_audit_id,
  format('{"sub":"%s","email":"tinashe.dube@mof.gov.zw"}', v_audit_id)::jsonb,
  'email', v_audit_id::text,
  now() - interval '1 days', now() - interval '45 days', now() - interval '1 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_profiles (id, institution_id, first_name, last_name, status, active_role, created_at, updated_at)
VALUES (v_audit_id, v_inst_mof, 'Tinashe', 'Dube', 'approved', 'audit-officer', now() - interval '45 days', now() - interval '45 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, institution_id, role_name, assigned_by, assigned_at)
VALUES (v_audit_id, v_inst_mof, 'audit-officer', v_admin_id, now() - interval '45 days')
ON CONFLICT (user_id, institution_id, role_name) DO NOTHING;

-- ── Dept Head: Simba Chigwedere ──────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  v_dept_id, '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'simba.chigwedere@mof.gov.zw',
  extensions.crypt('Demo@GRC2026!', extensions.gen_salt('bf')),
  now() - interval '50 days',
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Simba","last_name":"Chigwedere"}',
  now() - interval '50 days', now() - interval '4 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  v_dept_id, v_dept_id,
  format('{"sub":"%s","email":"simba.chigwedere@mof.gov.zw"}', v_dept_id)::jsonb,
  'email', v_dept_id::text,
  now() - interval '4 days', now() - interval '50 days', now() - interval '4 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_profiles (id, institution_id, first_name, last_name, status, active_role, created_at, updated_at)
VALUES (v_dept_id, v_inst_mof, 'Simba', 'Chigwedere', 'approved', 'dept-head', now() - interval '50 days', now() - interval '50 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, institution_id, role_name, assigned_by, assigned_at)
VALUES (v_dept_id, v_inst_mof, 'dept-head', v_admin_id, now() - interval '50 days')
ON CONFLICT (user_id, institution_id, role_name) DO NOTHING;


-- ================================================================
-- 3. STRATEGIC OBJECTIVES (9 objectives across all 8 NDS2 pillars)
-- ================================================================

INSERT INTO public.strategic_objectives (
  id, institution_id, title, description, owner_id,
  start_date, target_date, status, nds2_pillar, institutional_goal,
  created_by, created_at, updated_at
) VALUES

  -- Pillar: Economic Transformation
  (v_obj1, v_inst_mof,
   'Revenue Mobilisation & Tax Reform',
   'Broaden the tax base, improve ZIMRA compliance rates, and raise the tax-to-GDP ratio from 14% to 18% by 2030 in alignment with NDS2 macroeconomic targets. Includes presumptive tax reform for the informal sector and ZIMRA digitalisation.',
   v_ceo_id,
   '2026-01-01', '2030-12-31', 'active', 'economic_transformation',
   'Increase tax-to-GDP ratio from 14% to 18% by 2030.',
   v_admin_id, now() - interval '120 days', now() - interval '30 days'),

  -- Pillar: Economic Transformation (second objective)
  (v_obj2, v_inst_mof,
   'Public Debt Management & Fiscal Consolidation',
   'Reduce total public debt-to-GDP ratio to below 60% by 2030 through disciplined expenditure management, SOE arrears clearance, and structured bilateral debt restructuring under the IMF Structured Programme Monitoring framework.',
   v_ceo_id,
   '2026-01-01', '2030-12-31', 'active', 'economic_transformation',
   'Reduce public debt-to-GDP below 60% by 2030.',
   v_admin_id, now() - interval '120 days', now() - interval '30 days'),

  -- Pillar: Innovation & Technology
  (v_obj3, v_inst_mof,
   'Digital Financial Services & FinTech Enablement',
   'Create a regulatory framework for digital currencies, mobile money inter-operability, and open banking to grow formal financial sector participation to 80% of the adult population by 2028.',
   v_ceo_id,
   '2026-03-01', '2028-12-31', 'active', 'innovation_and_technology',
   'Achieve 80% mobile money penetration rate by 2028.',
   v_admin_id, now() - interval '90 days', now() - interval '20 days'),

  -- Pillar: Social Development
  (v_obj4, v_inst_mof,
   'Social Protection Fund Efficiency & Targeting',
   'Improve the social protection delivery system through biometric registration, direct digital transfers, and reduced leakage to ensure 95% of benefits reach intended beneficiaries by 2027. Currently at risk due to biometric rollout delays.',
   v_dept_id,
   '2026-01-01', '2027-12-31', 'at_risk', 'social_development',
   'Reduce social protection leakage to below 5% by 2027.',
   v_admin_id, now() - interval '100 days', now() - interval '10 days'),

  -- Pillar: Infrastructure Development
  (v_obj5, v_inst_mof,
   'Infrastructure Bond Programme Launch',
   'Issue USD 500 million in infrastructure bonds over 2026–2028 to finance road, rail, and energy projects, attracting domestic pension funds, banks, and diaspora investors. Currently in draft phase pending legal feasibility sign-off.',
   v_ceo_id,
   '2026-06-01', '2028-12-31', 'draft', 'infrastructure_development',
   'Raise USD 500M through infrastructure bonds for capital projects.',
   v_admin_id, now() - interval '60 days', now() - interval '5 days'),

  -- Pillar: Environmental Sustainability
  (v_obj6, v_inst_mof,
   'Green Budget Framework Integration',
   'Develop and implement Zimbabwe''s first Green Budget Statement aligned to COP30 commitments, tagging climate-relevant expenditure and tracking climate finance mobilisation from multilateral sources (GCF, AfDB, World Bank).',
   v_dept_id,
   '2026-04-01', '2027-06-30', 'active', 'environmental_sustainability',
   'Tag 15% of national budget to climate-positive activities by 2027.',
   v_admin_id, now() - interval '80 days', now() - interval '15 days'),

  -- Pillar: Governance & Institutions
  (v_obj7, v_inst_mof,
   'PFMA Compliance & Public Financial Management Reform',
   'Achieve full compliance with the Public Finance Management Act across all 62 MDAs by 2027, including quarterly reporting, procurement controls under PRAZ, asset management, and internal audit standards per IIA.',
   v_audit_id,
   '2026-01-01', '2027-12-31', 'active', 'governance_and_institutions',
   'Achieve 100% PFMA compliance across all 62 MDAs by 2027.',
   v_admin_id, now() - interval '120 days', now() - interval '25 days'),

  -- Pillar: Regional & International Integration
  (v_obj8, v_inst_mof,
   'Regional Trade Finance & AfCFTA Participation',
   'Position Zimbabwe as a hub for AfCFTA trade finance by establishing a dedicated trade finance window at the RBZ, reducing cross-border payment processing times, and harmonising trade finance regulations with COMESA and SADC standards.',
   v_ceo_id,
   '2026-07-01', '2029-12-31', 'draft', 'regional_and_international_integration',
   'Reduce cross-border payment processing time to under 24 hours by 2029.',
   v_admin_id, now() - interval '45 days', now() - interval '3 days'),

  -- Pillar: Rural & Urban Development
  (v_obj9, v_inst_mof,
   'Rural Agro-Finance & Agricultural Credit Access',
   'Increase agricultural credit access in rural areas from 8% to 25% by 2030, working with RBZ on guaranteed loan schemes for smallholder farmers, and expanding the reach of formal agricultural finance institutions into communal lands.',
   v_dept_id,
   '2026-01-01', '2030-12-31', 'active', 'rural_and_urban_development',
   'Increase agricultural credit access in rural areas from 8% to 25% by 2030.',
   v_admin_id, now() - interval '110 days', now() - interval '20 days')

ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- 4. KPIs (18 KPIs across all 9 objectives)
-- ================================================================

INSERT INTO public.kpis (
  id, institution_id, objective_id, title, description, owner_id,
  baseline_value, target_value, unit_of_measure, reporting_frequency,
  created_by, created_at, updated_at
) VALUES

  -- Objective 1: Revenue Mobilisation
  (v_kpi01, v_inst_mof, v_obj1,
   'Tax-to-GDP Ratio',
   'Total tax revenue as a percentage of nominal GDP. Baseline is the 2025 outturn, adjusted for currency rebasing.',
   v_risk_id, 14.2, 18.0, '%', 'annual',
   v_admin_id, now() - interval '110 days', now() - interval '30 days'),

  (v_kpi02, v_inst_mof, v_obj1,
   'VAT Compliance Rate',
   'Percentage of registered VAT payers who file returns and pay liability on time each quarter.',
   v_dept_id, 62.0, 85.0, '%', 'quarterly',
   v_admin_id, now() - interval '110 days', now() - interval '30 days'),

  (v_kpi03, v_inst_mof, v_obj1,
   'New Taxpayer Registrations',
   'Number of new individual and corporate taxpayers registered with ZIMRA per quarter.',
   v_dept_id, 8500, 15000, 'registrations/quarter', 'quarterly',
   v_admin_id, now() - interval '110 days', now() - interval '30 days'),

  -- Objective 2: Debt Management
  (v_kpi04, v_inst_mof, v_obj2,
   'Public Debt-to-GDP Ratio',
   'Total public and publicly guaranteed debt as a percentage of nominal GDP. Source: Ministry of Finance Debt Management Unit.',
   v_ceo_id, 78.5, 60.0, '%', 'annual',
   v_admin_id, now() - interval '100 days', now() - interval '30 days'),

  (v_kpi05, v_inst_mof, v_obj2,
   'Domestic Debt Service Ratio',
   'Domestic debt service payments (principal + interest) as a percentage of domestic revenue collected.',
   v_risk_id, 24.3, 18.0, '%', 'quarterly',
   v_admin_id, now() - interval '100 days', now() - interval '30 days'),

  -- Objective 3: Digital Finance
  (v_kpi06, v_inst_mof, v_obj3,
   'Mobile Money Penetration Rate',
   'Percentage of adults (18+) with at least one active mobile money account. Source: RBZ Financial Inclusion Survey.',
   v_dept_id, 62.0, 80.0, '%', 'semi_annual',
   v_admin_id, now() - interval '85 days', now() - interval '20 days'),

  (v_kpi07, v_inst_mof, v_obj3,
   'Digital Payment Volume',
   'Total value of digital transactions processed through the national payments switch per month (USD millions). Source: RBZ RTGS data.',
   v_dept_id, 320.0, 750.0, 'USD millions/month', 'quarterly',
   v_admin_id, now() - interval '85 days', now() - interval '20 days'),

  -- Objective 4: Social Protection
  (v_kpi08, v_inst_mof, v_obj4,
   'Social Protection Beneficiary Count',
   'Total verified beneficiaries receiving social protection cash transfers, post ghost-beneficiary removal.',
   v_dept_id, 750000, 1200000, 'beneficiaries', 'quarterly',
   v_admin_id, now() - interval '95 days', now() - interval '10 days'),

  (v_kpi09, v_inst_mof, v_obj4,
   'Fund Disbursement Accuracy Rate',
   'Percentage of social protection disbursements that reach verified intended beneficiaries without leakage, as measured by spot audits.',
   v_dept_id, 78.0, 95.0, '%', 'quarterly',
   v_admin_id, now() - interval '95 days', now() - interval '10 days'),

  -- Objective 5: Infrastructure Bonds
  (v_kpi10, v_inst_mof, v_obj5,
   'Infrastructure Bond Value Raised',
   'Cumulative face value of infrastructure bonds issued and fully subscribed to date (USD millions).',
   v_ceo_id, 0.0, 500.0, 'USD millions', 'semi_annual',
   v_admin_id, now() - interval '55 days', now() - interval '5 days'),

  (v_kpi11, v_inst_mof, v_obj5,
   'Infrastructure Projects Funded',
   'Number of qualifying capital infrastructure projects receiving disbursements from the bond programme.',
   v_ceo_id, 0.0, 12.0, 'projects', 'annual',
   v_admin_id, now() - interval '55 days', now() - interval '5 days'),

  -- Objective 6: Green Budget
  (v_kpi12, v_inst_mof, v_obj6,
   'Climate Budget Tag Ratio',
   'Percentage of national budget expenditure tagged as climate-relevant using the OECD Rio markers methodology.',
   v_dept_id, 3.2, 15.0, '%', 'annual',
   v_admin_id, now() - interval '75 days', now() - interval '15 days'),

  (v_kpi13, v_inst_mof, v_obj6,
   'Climate Finance Mobilised',
   'Total external climate finance grants and concessional loans secured from multilateral and bilateral sources (USD millions cumulative).',
   v_dept_id, 18.5, 120.0, 'USD millions', 'semi_annual',
   v_admin_id, now() - interval '75 days', now() - interval '15 days'),

  -- Objective 7: PFMA Compliance
  (v_kpi14, v_inst_mof, v_obj7,
   'PFMA Full-Compliance MDAs',
   'Number of MDAs achieving full PFMA compliance in the most recent quarterly assessment (no material findings on procurement, reporting, or asset management).',
   v_audit_id, 14.0, 62.0, 'MDAs', 'quarterly',
   v_admin_id, now() - interval '115 days', now() - interval '25 days'),

  (v_kpi15, v_inst_mof, v_obj7,
   'Internal Audit Plan Completion Rate',
   'Percentage of approved internal audit plan activities completed on schedule in the reporting period.',
   v_audit_id, 58.0, 90.0, '%', 'quarterly',
   v_admin_id, now() - interval '115 days', now() - interval '25 days'),

  -- Objective 8: Trade Finance
  (v_kpi16, v_inst_mof, v_obj8,
   'AfCFTA Trade Finance Window Volume',
   'Total value of trade finance facilities facilitated through the dedicated AfCFTA trade window (USD millions per quarter).',
   v_ceo_id, 0.0, 85.0, 'USD millions/quarter', 'quarterly',
   v_admin_id, now() - interval '40 days', now() - interval '3 days'),

  -- Objective 9: Rural Agro-Finance
  (v_kpi17, v_inst_mof, v_obj9,
   'Rural Agricultural Credit Access Rate',
   'Percentage of rural smallholder farmers (defined as farming < 5 ha) with access to formal credit from licensed financial institutions.',
   v_dept_id, 8.0, 25.0, '%', 'semi_annual',
   v_admin_id, now() - interval '105 days', now() - interval '20 days'),

  (v_kpi18, v_inst_mof, v_obj9,
   'Agro-Finance Loan Disbursement',
   'Total value of agricultural loans disbursed under government-guaranteed agro-finance schemes (USD millions per quarter).',
   v_dept_id, 12.5, 95.0, 'USD millions', 'quarterly',
   v_admin_id, now() - interval '105 days', now() - interval '20 days')

ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- 5. KPI READINGS  (historical readings enabling sparklines & trend charts)
-- ================================================================

-- KPI 01 – Tax-to-GDP Ratio (annual)
INSERT INTO public.kpi_readings (institution_id, kpi_id, reporting_period, actual_value, notes, recorded_by, recorded_at) VALUES
  (v_inst_mof, v_kpi01, '2023', 13.8, 'Pre-NDS2 baseline. Adjusted for ZWL rebasing exercise.',                           v_risk_id, now() - interval '365 days'),
  (v_inst_mof, v_kpi01, '2024', 14.2, 'Slight improvement. ZIMRA online filing adoption reached 55%.',                    v_risk_id, now() - interval '180 days'),
  (v_inst_mof, v_kpi01, '2025', 14.9, 'Positive trend. Customs modernisation and 3rd-party data matching contributed.',   v_risk_id, now() - interval '30 days');

-- KPI 02 – VAT Compliance Rate (quarterly)
INSERT INTO public.kpi_readings (institution_id, kpi_id, reporting_period, actual_value, notes, recorded_by, recorded_at) VALUES
  (v_inst_mof, v_kpi02, '2025-Q1', 60.2, 'Below target. Portal outage in February caused filing disruption.',             v_dept_id, now() - interval '270 days'),
  (v_inst_mof, v_kpi02, '2025-Q2', 63.5, 'Recovery post-ZIMRA portal upgrade. Harare region improved most.',             v_dept_id, now() - interval '180 days'),
  (v_inst_mof, v_kpi02, '2025-Q3', 65.8, 'Compliance workshops in 4 cities showing results.',                            v_dept_id, now() - interval '90 days'),
  (v_inst_mof, v_kpi02, '2025-Q4', 68.1, 'Year-end automated reminder system drove late-filer recovery.',                v_dept_id, now() - interval '30 days'),
  (v_inst_mof, v_kpi02, '2026-Q1', 70.4, 'Steady improvement. Online filing now at 72% of all returns.',                 v_dept_id, now() - interval '10 days'),
  (v_inst_mof, v_kpi02, '2026-Q2', 72.6, 'New penalty framework effective. Still 12pp below target.',                    v_dept_id, now() - interval '2 days');

-- KPI 03 – New Taxpayer Registrations (quarterly)
INSERT INTO public.kpi_readings (institution_id, kpi_id, reporting_period, actual_value, notes, recorded_by, recorded_at) VALUES
  (v_inst_mof, v_kpi03, '2025-Q2',  9200, 'Street registration drive in Harare CBD and Mbare market.',                  v_dept_id, now() - interval '180 days'),
  (v_inst_mof, v_kpi03, '2025-Q3', 10100, 'Mobile units deployed in Masvingo, Mutare, and Gweru.',                      v_dept_id, now() - interval '90 days'),
  (v_inst_mof, v_kpi03, '2025-Q4', 11350, 'Amnesty programme drove surge in voluntary registrations.',                  v_dept_id, now() - interval '30 days'),
  (v_inst_mof, v_kpi03, '2026-Q1', 12800, 'ZIMRA app launch contributed ~2,100 self-service registrations.',            v_dept_id, now() - interval '10 days'),
  (v_inst_mof, v_kpi03, '2026-Q2', 13400, 'On track to exceed annual registration target.',                             v_dept_id, now() - interval '3 days');

-- KPI 04 – Public Debt-to-GDP Ratio (annual)
INSERT INTO public.kpi_readings (institution_id, kpi_id, reporting_period, actual_value, notes, recorded_by, recorded_at) VALUES
  (v_inst_mof, v_kpi04, '2023', 82.3, 'Includes USD 4.1B arrears to IFIs. Pre-restructuring.',                           v_ceo_id, now() - interval '365 days'),
  (v_inst_mof, v_kpi04, '2024', 78.5, 'IMF SMP completion unlocked partial Paris Club debt deferral.',                   v_ceo_id, now() - interval '180 days'),
  (v_inst_mof, v_kpi04, '2025', 75.1, 'Debt-to-equity swaps with 4 SOEs reduced public guarantees.',                    v_ceo_id, now() - interval '30 days');

-- KPI 05 – Domestic Debt Service Ratio (quarterly)
INSERT INTO public.kpi_readings (institution_id, kpi_id, reporting_period, actual_value, notes, recorded_by, recorded_at) VALUES
  (v_inst_mof, v_kpi05, '2025-Q2', 26.5, 'Elevated by T-bill rollover in June. Domestic market tight.',                  v_risk_id, now() - interval '180 days'),
  (v_inst_mof, v_kpi05, '2025-Q3', 25.1, 'Relief from maturing T-bills not fully rolled over.',                          v_risk_id, now() - interval '90 days'),
  (v_inst_mof, v_kpi05, '2025-Q4', 24.3, 'Better revenue collection reduced new domestic issuance.',                     v_risk_id, now() - interval '30 days'),
  (v_inst_mof, v_kpi05, '2026-Q1', 23.8, 'Declining trend sustained. Still 5.8pp from target.',                          v_risk_id, now() - interval '10 days');

-- KPI 06 – Mobile Money Penetration (semi-annual)
INSERT INTO public.kpi_readings (institution_id, kpi_id, reporting_period, actual_value, notes, recorded_by, recorded_at) VALUES
  (v_inst_mof, v_kpi06, '2024-H2', 58.5, 'Baseline established via RBZ FinAccess survey.',                               v_dept_id, now() - interval '270 days'),
  (v_inst_mof, v_kpi06, '2025-H1', 62.0, 'EcoCash and InnBucks expanded rural agent networks.',                          v_dept_id, now() - interval '180 days'),
  (v_inst_mof, v_kpi06, '2025-H2', 65.3, 'Interoperability pilot launched in 3 provinces.',                              v_dept_id, now() - interval '90 days'),
  (v_inst_mof, v_kpi06, '2026-H1', 68.7, 'Growth accelerating. Smartphone penetration now 49%.',                         v_dept_id, now() - interval '15 days');

-- KPI 07 – Digital Payment Volume (quarterly)
INSERT INTO public.kpi_readings (institution_id, kpi_id, reporting_period, actual_value, notes, recorded_by, recorded_at) VALUES
  (v_inst_mof, v_kpi07, '2025-Q1', 298.5, 'Seasonally lower post-holiday period.',                                       v_dept_id, now() - interval '270 days'),
  (v_inst_mof, v_kpi07, '2025-Q2', 335.2, 'School fees payment season boosted RTGS volumes.',                            v_dept_id, now() - interval '180 days'),
  (v_inst_mof, v_kpi07, '2025-Q3', 362.8, 'RTGS2 system upgrade improved throughput capacity.',                          v_dept_id, now() - interval '90 days'),
  (v_inst_mof, v_kpi07, '2025-Q4', 415.0, 'Year-end salary runs and government payments drove peak.',                    v_dept_id, now() - interval '30 days'),
  (v_inst_mof, v_kpi07, '2026-Q1', 388.5, 'Q1 normalisation. Full-year trajectory on track.',                            v_dept_id, now() - interval '10 days');

-- KPI 08 – Social Protection Beneficiaries (quarterly)
INSERT INTO public.kpi_readings (institution_id, kpi_id, reporting_period, actual_value, notes, recorded_by, recorded_at) VALUES
  (v_inst_mof, v_kpi08, '2025-Q2', 720000, 'Biometric registration commenced in Mashonaland provinces.',                 v_dept_id, now() - interval '180 days'),
  (v_inst_mof, v_kpi08, '2025-Q3', 748500, 'Ghost-beneficiary purge removed ~15,000 invalid records.',                   v_dept_id, now() - interval '90 days'),
  (v_inst_mof, v_kpi08, '2025-Q4', 762000, 'New enrolment suspended pending national system upgrade.',                   v_dept_id, now() - interval '30 days'),
  (v_inst_mof, v_kpi08, '2026-Q1', 784000, 'Enrolment resumed. Matabeleland North province added.',                      v_dept_id, now() - interval '10 days');

-- KPI 09 – Fund Disbursement Accuracy (quarterly)
INSERT INTO public.kpi_readings (institution_id, kpi_id, reporting_period, actual_value, notes, recorded_by, recorded_at) VALUES
  (v_inst_mof, v_kpi09, '2025-Q2', 75.2, 'Paper-based verification still used in 6 rural provinces.',                    v_dept_id, now() - interval '180 days'),
  (v_inst_mof, v_kpi09, '2025-Q3', 79.8, 'Digital ID integration in Harare and Bulawayo.',                               v_dept_id, now() - interval '90 days'),
  (v_inst_mof, v_kpi09, '2025-Q4', 81.5, 'At-risk: biometric rollout delayed in 4 provinces.',                           v_dept_id, now() - interval '30 days'),
  (v_inst_mof, v_kpi09, '2026-Q1', 83.0, 'Recovery as digital payment rails expanded.',                                  v_dept_id, now() - interval '10 days');

-- KPI 12 – Climate Budget Tag Ratio (annual)
INSERT INTO public.kpi_readings (institution_id, kpi_id, reporting_period, actual_value, notes, recorded_by, recorded_at) VALUES
  (v_inst_mof, v_kpi12, '2024', 2.8, 'First year of climate tagging. Methodology not fully standardised.',               v_dept_id, now() - interval '180 days'),
  (v_inst_mof, v_kpi12, '2025', 3.2, 'Improved tagging. Energy and water sectors now fully covered.',                    v_dept_id, now() - interval '30 days');

-- KPI 14 – PFMA Full-Compliance MDAs (quarterly)
INSERT INTO public.kpi_readings (institution_id, kpi_id, reporting_period, actual_value, notes, recorded_by, recorded_at) VALUES
  (v_inst_mof, v_kpi14, '2025-Q1', 11, 'Only 11 of 62 MDAs fully compliant. Urgent training required.',                  v_audit_id, now() - interval '270 days'),
  (v_inst_mof, v_kpi14, '2025-Q2', 14, 'PFMA coaching programme commenced for worst performers.',                        v_audit_id, now() - interval '180 days'),
  (v_inst_mof, v_kpi14, '2025-Q3', 18, 'Accelerated coaching showing results in Ministries.',                            v_audit_id, now() - interval '90 days'),
  (v_inst_mof, v_kpi14, '2025-Q4', 22, 'Year-end compliance push. 22 MDAs now fully compliant.',                         v_audit_id, now() - interval '30 days'),
  (v_inst_mof, v_kpi14, '2026-Q1', 26, 'On track. 36 MDAs still require remediation plans.',                             v_audit_id, now() - interval '10 days');

-- KPI 15 – Internal Audit Plan Completion (quarterly)
INSERT INTO public.kpi_readings (institution_id, kpi_id, reporting_period, actual_value, notes, recorded_by, recorded_at) VALUES
  (v_inst_mof, v_kpi15, '2025-Q1', 52.0, 'Staffing shortages in the central audit unit.',                                v_audit_id, now() - interval '270 days'),
  (v_inst_mof, v_kpi15, '2025-Q2', 58.0, 'New audit management system (TeamMate+) deployed.',                            v_audit_id, now() - interval '180 days'),
  (v_inst_mof, v_kpi15, '2025-Q3', 63.5, 'Three new audit officers recruited and onboarded.',                            v_audit_id, now() - interval '90 days'),
  (v_inst_mof, v_kpi15, '2025-Q4', 70.0, 'Improved quarterly scheduling reduced backlogs.',                              v_audit_id, now() - interval '30 days'),
  (v_inst_mof, v_kpi15, '2026-Q1', 74.5, 'Good progress. 15.5pp gap to 90% target remains.',                            v_audit_id, now() - interval '10 days');

-- KPI 17 – Rural Agricultural Credit Access (semi-annual)
INSERT INTO public.kpi_readings (institution_id, kpi_id, reporting_period, actual_value, notes, recorded_by, recorded_at) VALUES
  (v_inst_mof, v_kpi17, '2024-H2',  7.8, 'Baseline. Most rural farmers rely on informal moneylenders.',                  v_dept_id, now() - interval '270 days'),
  (v_inst_mof, v_kpi17, '2025-H1',  9.2, 'Agro-guarantee scheme piloted in Mashonaland Central.',                        v_dept_id, now() - interval '180 days'),
  (v_inst_mof, v_kpi17, '2025-H2', 11.5, 'Smallholder-focused FI partnerships now in 5 provinces.',                     v_dept_id, now() - interval '30 days');

-- KPI 18 – Agro-Finance Loan Disbursement (quarterly)
INSERT INTO public.kpi_readings (institution_id, kpi_id, reporting_period, actual_value, notes, recorded_by, recorded_at) VALUES
  (v_inst_mof, v_kpi18, '2025-Q2', 15.8, 'First full quarter of agro-guarantee scheme operations.',                      v_dept_id, now() - interval '180 days'),
  (v_inst_mof, v_kpi18, '2025-Q3', 22.3, 'Maize farming season drove peak credit demand.',                               v_dept_id, now() - interval '90 days'),
  (v_inst_mof, v_kpi18, '2025-Q4', 28.7, 'Tobacco season demand strong in Mashonaland West.',                            v_dept_id, now() - interval '30 days'),
  (v_inst_mof, v_kpi18, '2026-Q1', 31.5, 'Gradual scale-up continues. Still 63.5M short of 95M target.',                v_dept_id, now() - interval '10 days');


-- ================================================================
-- 6. RISKS  (10 risks across all categories, linked to objectives)
-- ================================================================

INSERT INTO public.risks (
  id, institution_id, objective_id, title, description, category, owner_id, status,
  inherent_likelihood, inherent_impact, residual_likelihood, residual_impact,
  mitigating_controls, created_by, created_at, updated_at
) VALUES

  (v_risk01, v_inst_mof, v_obj1,
   'Revenue Shortfall from Informal Economy',
   'Failure to register and tax the informal sector (estimated at 60% of GDP) results in a persistent structural revenue gap, preventing achievement of the 18% tax-to-GDP target by 2030.',
   'financial', v_risk_id, 'open', 4, 5, 3, 4,
   'ZIMRA digital registration drives; presumptive tax schedule reform; mobile money transaction data-sharing agreement with RBZ; third-party data matching from NSSA and CABS.',
   v_admin_id, now() - interval '100 days', now() - interval '15 days'),

  (v_risk02, v_inst_mof, v_obj2,
   'Foreign Currency Volatility Affecting Debt Servicing',
   'Significant ZWL/USD exchange rate depreciation increases the real cost of foreign-denominated debt and may trigger covenant breaches on bilateral loans, worsening fiscal consolidation prospects.',
   'financial', v_risk_id, 'open', 4, 4, 3, 3,
   'FX hedging framework; multi-currency reserve adequacy target maintained at RBZ; bilateral debt restructuring negotiations (Paris Club, China); monthly FX risk dashboard to Treasury.',
   v_admin_id, now() - interval '100 days', now() - interval '20 days'),

  (v_risk03, v_inst_mof, v_obj3,
   'Cyber Attack on ZIMRA & Digital Payment Infrastructure',
   'Sophisticated cyber attacks (ransomware, APT intrusion, supply-chain compromise) on ZIMRA''s revenue management systems or the national real-time gross settlement switch could halt revenue collection, expose taxpayer data, and undermine trust in digital finance.',
   'technology', v_risk_id, 'escalated', 3, 5, 2, 4,
   'ISO 27001 certification roadmap; 24/7 SOC monitoring (procurement overdue — see AUD-MF2026-003); annual external penetration testing; air-gapped backups; incident response retainer; CERT-ZW membership.',
   v_admin_id, now() - interval '95 days', now() - interval '5 days'),

  (v_risk04, v_inst_mof, v_obj2,
   'Sovereign Debt Default Risk',
   'Failure to clear pre-2009 arrears to IFIs and agree on an IMF Article IV-supported programme increases probability of formal sovereign default, blocking international capital market access required for the infrastructure bond programme.',
   'strategic', v_ceo_id, 'open', 3, 5, 3, 5,
   'Structured creditor dialogue (OCC/Paris Club); IMF Structured Programme Monitoring; HIPC eligibility assessment engagement; Cabinet-level quarterly debt sustainability review.',
   v_admin_id, now() - interval '110 days', now() - interval '10 days'),

  (v_risk05, v_inst_mof, v_obj7,
   'PFMA Non-Compliance Across MDAs',
   'Persistent non-compliance with procurement, financial reporting, and asset management obligations under the PFMA across 36+ MDAs risks Auditor-General qualifications, donor disengagement, and public financial management reform reversal.',
   'compliance', v_audit_id, 'open', 4, 3, 3, 2,
   'Mandatory quarterly PFMA self-assessment tool; MOFED embedded compliance support teams in 12 MDAs; PFMA e-learning portal (completion tracking via HRMS); Treasury circular enforcement; OAG capacity grant programme.',
   v_admin_id, now() - interval '115 days', now() - interval '25 days'),

  (v_risk06, v_inst_mof, v_obj4,
   'Ghost Beneficiaries & Corruption in Social Protection',
   'Inadequate beneficiary verification and weak programme controls allow fictitious beneficiaries, corrupt officials, and duplicate registrations to divert social protection funds, undermining programme impact and public trust.',
   'operational', v_dept_id, 'open', 3, 4, 2, 3,
   'Biometric fingerprint and facial recognition rollout (in progress — 6/10 provinces); ZIMRA-NSSA-RBZ data cross-referencing; independent spot audit programme (quarterly); whistleblower hotline (0800-ZACC-ZW); case management system.',
   v_admin_id, now() - interval '90 days', now() - interval '12 days'),

  (v_risk07, v_inst_mof, v_obj5,
   'Infrastructure Bond Market Absorption Risk',
   'Insufficient domestic investor appetite (pension funds, insurance companies) and diaspora investor uncertainty result in undersubscription of the infrastructure bond, failing to raise the USD 500M target within the 2026–2028 window.',
   'financial', v_ceo_id, 'open', 3, 4, NULL, NULL,
   NULL,
   v_admin_id, now() - interval '50 days', now() - interval '5 days'),

  (v_risk08, v_inst_mof, v_obj7,
   'Regulatory Fragmentation in the Financial Sector',
   'Overlapping and sometimes contradictory directives from RBZ, MOFED, and SECZ create compliance arbitrage, enforcement gaps, and investor confusion in the financial sector, increasing systemic risk.',
   'compliance', v_audit_id, 'accepted', 3, 3, 2, 2,
   'Financial Sector Regulatory Coordination Committee (quarterly meetings); joint regulatory sandbox with RBZ and SECZ; Financial Sector Regulatory Mapping project (KPMG advisory); MOFED policy harmonisation unit.',
   v_admin_id, now() - interval '80 days', now() - interval '30 days'),

  (v_risk09, v_inst_mof, v_obj6,
   'Climate Finance Access Shortfall from IFIs',
   'Inability to meet fiduciary, environmental, and social safeguard requirements of the GCF, AfDB, and World Bank results in Zimbabwe failing to access its allocable share of multilateral climate finance, leaving the Green Budget Framework underfunded.',
   'strategic', v_dept_id, 'open', 3, 3, 2, 2,
   'GCF National Implementing Entity accreditation (application in progress); PFMA alignment with IPSAS accrual standards; project preparation facility support (DBSA); CIF Accelerating Coal Transition engagement.',
   v_admin_id, now() - interval '70 days', now() - interval '15 days'),

  (v_risk10, v_inst_mof, v_obj3,
   'Mobile Money Security Breach & Consumer Fraud',
   'Weaknesses in mobile money platform security (SIM-swap fraud, phishing, rogue agent networks, weak API authentication) enable large-scale consumer fraud, causing financial loss and eroding trust in digital financial services at a critical growth stage.',
   'technology', v_dept_id, 'open', 3, 4, 2, 3,
   'RBZ MNO SIM-swap control directive (in progress); mandatory biometric authentication for high-value transactions; real-time anomaly detection by MNOs; RBZ consumer protection enforcement; FinSAC cybersecurity assessment.',
   v_admin_id, now() - interval '80 days', now() - interval '8 days')

ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- 7. RISK TREATMENTS (1–2 per risk; 13 treatments total)
-- ================================================================

INSERT INTO public.risk_treatments (
  id, institution_id, risk_id, title, description, owner_id,
  due_date, status, created_by, created_at, updated_at
) VALUES

  -- Risk 01: Revenue Shortfall
  (v_rt01, v_inst_mof, v_risk01,
   'Informal Sector Digital Registration Drive',
   'Deploy 50 ZIMRA mobile registration teams to market centres, growth points, and border posts targeting 50,000 new informal sector registrations by Q3 2026. Track progress weekly via ZIMRA CRM.',
   v_risk_id, '2026-09-30', 'in_progress',
   v_admin_id, now() - interval '90 days', now() - interval '10 days'),

  (v_rt02, v_inst_mof, v_risk01,
   'Presumptive Tax Regime Reform',
   'Revise presumptive tax brackets and collection methods using actual mobile money income data. Present revised SI to Parliament by June 2026.',
   v_dept_id, '2026-06-30', 'planned',
   v_admin_id, now() - interval '90 days', now() - interval '10 days'),

  -- Risk 02: FX Volatility
  (v_rt03, v_inst_mof, v_risk02,
   'FX Reserve Adequacy Policy Establishment',
   'Formalise FX reserve adequacy policy requiring RBZ to maintain minimum 3-month import cover. Policy approved by Cabinet.',
   v_ceo_id, '2026-03-31', 'completed',
   v_admin_id, now() - interval '80 days', now() - interval '20 days'),

  (v_rt04, v_inst_mof, v_risk02,
   'Bilateral Debt Restructuring Agreements',
   'Negotiate payment deferrals and interest capitalisation with bilateral creditors (China EXIM, Paris Club) to reduce near-term USD outflow pressure on the FX market.',
   v_ceo_id, '2027-06-30', 'in_progress',
   v_admin_id, now() - interval '80 days', now() - interval '5 days'),

  -- Risk 03: Cyber Attack
  (v_rt05, v_inst_mof, v_risk03,
   'ISO 27001 Certification for ZIMRA IT Systems',
   'Engage ISMS consultant to conduct gap assessment and achieve ISO 27001 certification for ZIMRA revenue management and e-filing systems by December 2026.',
   v_risk_id, '2026-12-31', 'in_progress',
   v_admin_id, now() - interval '85 days', now() - interval '2 days'),

  (v_rt06, v_inst_mof, v_risk03,
   '24/7 Security Operations Centre — Managed Service',
   'Procure a managed SOC service to provide continuous threat monitoring, triage, and incident response for ZIMRA and MOFED systems. Emergency procurement authority granted by Board (Resolution MF-RES-2026-007).',
   v_risk_id, '2026-04-30', 'overdue',
   v_admin_id, now() - interval '85 days', now() - interval '1 days'),

  -- Risk 04: Sovereign Default
  (v_rt07, v_inst_mof, v_risk04,
   'IMF Article IV Consultation Comprehensive Preparation',
   'Prepare complete fiscal and monetary documentation package for IMF Article IV consultation scheduled October 2026, including MTFF, debt sustainability analysis, and structural benchmark status report.',
   v_ceo_id, '2026-09-30', 'planned',
   v_admin_id, now() - interval '100 days', now() - interval '10 days'),

  -- Risk 05: PFMA Non-Compliance
  (v_rt08, v_inst_mof, v_risk05,
   'PFMA Compliance Support Teams — Embedded Deployment',
   'Deploy 12 MOFED compliance officers to the 12 most non-compliant MDAs for 6-month embedded advisory support. Monthly progress reports to Treasury.',
   v_audit_id, '2026-06-30', 'in_progress',
   v_admin_id, now() - interval '105 days', now() - interval '15 days'),

  (v_rt09, v_inst_mof, v_risk05,
   'PFMA Mandatory e-Learning Programme Rollout',
   'Develop and mandate PFMA e-learning modules for all accounting officers and finance staff across 62 MDAs. Track completion via HRMS integration. Target: 90% completion by April 2026.',
   v_audit_id, '2026-04-30', 'completed',
   v_admin_id, now() - interval '105 days', now() - interval '20 days'),

  -- Risk 06: Ghost Beneficiaries
  (v_rt10, v_inst_mof, v_risk06,
   'Biometric Verification National Rollout',
   'Complete biometric (fingerprint + facial recognition) verification for all social protection beneficiaries across all 10 provinces by September 2026. Currently complete in 6 of 10 provinces.',
   v_dept_id, '2026-09-30', 'in_progress',
   v_admin_id, now() - interval '80 days', now() - interval '5 days'),

  -- Risk 09: Climate Finance
  (v_rt11, v_inst_mof, v_risk09,
   'GCF Direct Access National Implementing Entity Accreditation',
   'Submit National Implementing Entity accreditation application to the Green Climate Fund by July 2026, enabling direct access to GCF grants and concessional loans without World Bank intermediation.',
   v_dept_id, '2026-07-31', 'in_progress',
   v_admin_id, now() - interval '60 days', now() - interval '10 days'),

  -- Risk 10: Mobile Money Security
  (v_rt12, v_inst_mof, v_risk10,
   'RBZ SIM-Swap Control Directive to MNOs',
   'Issue RBZ Banking Directive requiring all MNOs to implement mandatory biometric verification for SIM-swaps, minimum 24-hour customer notification, and temporary transaction limits during SIM-swap cooling period.',
   v_dept_id, '2026-05-31', 'planned',
   v_admin_id, now() - interval '70 days', now() - interval '8 days'),

  -- Risk 07: Bond Absorption (initial treatment)
  (v_rt13, v_inst_mof, v_risk07,
   'Infrastructure Bond Investor Appetite Survey & Roadshow',
   'Commission market research with top 20 pension funds and insurance companies to gauge appetite, preferred maturities, and yield expectations. Conduct investor roadshow in Harare and Johannesburg in Q3 2026.',
   v_ceo_id, '2026-08-31', 'planned',
   v_admin_id, now() - interval '45 days', now() - interval '4 days')

ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- 8. COMPLIANCE OBLIGATIONS (10 obligations across PFMA, NDS2, PPDPA, etc.)
-- ================================================================

INSERT INTO public.compliance_obligations (
  id, institution_id, framework, framework_reference, title, description,
  owner_id, due_date, status, created_by, created_at, updated_at
) VALUES

  (v_comp01, v_inst_mof, 'pfma', 'PFMA §40(1)',
   'Annual Financial Statements — Submission to Auditor-General',
   'Submit audited annual financial statements to the Office of the Auditor-General within 3 months of financial year-end (31 March each year). Includes all supporting schedules and management accounts.',
   v_ceo_id, '2026-03-31', 'compliant',
   v_admin_id, now() - interval '110 days', now() - interval '20 days'),

  (v_comp02, v_inst_mof, 'pfma', 'PFMA §69(2)',
   'Quarterly Expenditure Reports — Parliamentary Portfolio Committee',
   'Submit quarterly budget execution reports to the Parliamentary Portfolio Committee on Finance within 30 days of quarter end. Includes variance analysis and commitment register.',
   v_dept_id, '2026-04-30', 'compliant',
   v_admin_id, now() - interval '110 days', now() - interval '10 days'),

  (v_comp03, v_inst_mof, 'nds2', 'NDS2 §3.2.1',
   'NDS2 Mid-Term Review — Ministerial Contribution',
   'Prepare and submit the Ministry''s NDS2 Mid-Term Review report to OPC by 30 June 2026, including strategic KPI progress against baselines and variance explanations for all at-risk objectives.',
   v_ceo_id, '2026-06-30', 'partially_compliant',
   v_admin_id, now() - interval '90 days', now() - interval '5 days'),

  (v_comp04, v_inst_mof, 'pfma', 'PFMA §81(1)',
   'PRAZ Quarterly Procurement Returns Filing',
   'Submit quarterly procurement returns to the Procurement Regulatory Authority of Zimbabwe (PRAZ) within 15 days of quarter end. Covers all open, awarded, and cancelled tenders.',
   v_dept_id, '2026-04-15', 'non_compliant',
   v_admin_id, now() - interval '100 days', now() - interval '3 days'),

  (v_comp05, v_inst_mof, 'ppdpa', 'PPDPA §18',
   'Privacy Impact Assessment — Social Protection Beneficiary Database',
   'Complete a Data Privacy Impact Assessment (DPIA) for the national social protection beneficiary database under the Zimbabwe Personal Privacy Data Protection Act. Engage POTRAZ-appointed privacy officer.',
   v_risk_id, '2026-08-31', 'pending',
   v_admin_id, now() - interval '80 days', now() - interval '15 days'),

  (v_comp06, v_inst_mof, 'ipsas', 'IPSAS 1',
   'IPSAS Accrual Basis Migration — FY2027 Financial Statements',
   'Migrate Ministry financial statements from cash basis to IPSAS-compliant accrual basis reporting for FY2027 statements. Required as condition for AfDB budget support and OAG endorsement.',
   v_audit_id, '2026-12-31', 'pending',
   v_admin_id, now() - interval '70 days', now() - interval '10 days'),

  (v_comp07, v_inst_mof, 'pfma', 'PFMA §45(3)',
   'Internal Audit Charter — Annual Review and Approval',
   'Present updated Internal Audit Charter to the Audit Committee for review and approval, in line with PFMA requirements and IIA International Standards for the Professional Practice of Internal Auditing.',
   v_audit_id, '2026-03-31', 'compliant',
   v_admin_id, now() - interval '100 days', now() - interval '30 days'),

  (v_comp08, v_inst_mof, 'pecoga', 'PECOGA §22',
   'Anti-Corruption Risk Register — Annual Update',
   'Update the institution''s anti-corruption risk register under ZACC/PECOGA requirements, covering all procurement categories, declaration-of-interest register, and integrity controls for high-risk roles.',
   v_risk_id, '2026-03-31', 'overdue',
   v_admin_id, now() - interval '95 days', now() - interval '2 days'),

  (v_comp09, v_inst_mof, 'king_iv', 'King IV Principle 11',
   'Board Delegation of Authority — Annual Review',
   'Conduct annual review of the Board''s Delegation of Authority framework and present revised version for Board approval at the June 2026 meeting. Attorney-General legal sign-off required.',
   v_ceo_id, '2026-06-30', 'pending',
   v_admin_id, now() - interval '60 days', now() - interval '5 days'),

  (v_comp10, v_inst_mof, 'pfma', 'PFMA §91(1)',
   'Asset Disposal & Write-Off Schedule — Minister Approval',
   'Present the 2025/26 asset disposal and write-off schedule to the Treasury and secure written Minister of Finance approval before any disposals occur. Covers moveable assets valued > USD 5,000.',
   v_dept_id, '2026-09-30', 'pending',
   v_admin_id, now() - interval '50 days', now() - interval '8 days')

ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- 9. OBLIGATION ATTESTATIONS
-- ================================================================

INSERT INTO public.obligation_attestations (
  institution_id, obligation_id, attestation_status, attested_by, attested_at, notes
) VALUES
  (v_inst_mof, v_comp01, 'compliant', v_ceo_id,
   now() - interval '25 days',
   'Annual financial statements submitted to OAG on 20 March 2026. Acknowledged via OAG letter ref OAG/2026/MoF/042. Clean audit opinion received with 2 minor findings noted in management letter.'),

  (v_inst_mof, v_comp02, 'compliant', v_dept_id,
   now() - interval '12 days',
   'Q1 2026 budget execution report submitted to Parliamentary Portfolio Committee on 28 April 2026. Committee Chairperson''s acknowledgement received. Report includes variance analysis for all 14 votes.'),

  (v_inst_mof, v_comp03, 'partially_compliant', v_ceo_id,
   now() - interval '8 days',
   'Draft NDS2 Mid-Term contribution submitted to OPC on 22 May 2026. Q1 2026 KPI actuals not yet available for 4 indicators (KPI03, KPI07, KPI14, KPI16). Final submission pending Q1 data validation.'),

  (v_inst_mof, v_comp07, 'compliant', v_audit_id,
   now() - interval '35 days',
   'Revised Internal Audit Charter (version 3.1) approved by the Audit Committee at the March 2026 meeting (minutes ref: AC-MF-2026-Q1-MIN). IIA alignment confirmed by external quality assessment.');


-- ================================================================
-- 10. AUDIT FINDINGS (7 findings with mixed severity and status)
-- ================================================================

INSERT INTO public.audit_findings (
  id, institution_id, finding_reference, title, description, severity, status,
  root_cause, linked_entity_type, linked_entity_id,
  remediation_owner_id, review_date, due_date,
  created_by, closed_at, created_at, updated_at
) VALUES

  (v_aud01, v_inst_mof, 'AUD-MF2026-001',
   'ZIMRA Data Sharing Agreement Not Executed',
   'The Ministry and ZIMRA have not formalised a legal data sharing agreement for informal sector mobile money transaction data despite this being a critical enabler of the Revenue Mobilisation objective. This creates a legal exposure for any data already informally shared.',
   'high', 'open',
   'Delayed legal review by Attorney-General''s Office. Competing priorities in ZIMRA IT infrastructure programme stalled internal sign-off.',
   'compliance_obligation', v_comp05,
   v_risk_id, '2026-07-31', '2026-06-30',
   v_audit_id, NULL, now() - interval '60 days', now() - interval '5 days'),

  (v_aud02, v_inst_mof, 'AUD-MF2026-002',
   'PRAZ Procurement Returns Filed 28 Days Late (Q4 2025)',
   'The Ministry failed to file PRAZ quarterly procurement returns for Q4 2025 within the PFMA §81 mandated 15-day window. Returns were eventually filed 28 days after the deadline with no prior application for extension.',
   'medium', 'in_progress',
   'Senior Procurement Officer was on unplanned medical leave. Acting officer was unaware of the statutory filing deadline and PRAZ submission process.',
   'compliance_obligation', v_comp04,
   v_dept_id, '2026-04-30', '2026-05-15',
   v_audit_id, NULL, now() - interval '45 days', now() - interval '3 days'),

  (v_aud03, v_inst_mof, 'AUD-MF2026-003',
   'SOC Procurement Overdue — Critical Cyber Risk Exposure Unmitigated',
   'The 24/7 Security Operations Centre procurement (Risk Treatment RT-06 for RISK-003) is 45+ days past its due date. ZIMRA and MOFED digital infrastructure remain without continuous threat monitoring, exposing the revenue collection system to undetected intrusion.',
   'critical', 'open',
   'Tender evaluation committee constituted 3 weeks late. Technical specifications required PRAZ pre-approval that was delayed due to staff capacity constraints.',
   'risk', v_risk03,
   v_risk_id, '2026-05-31', '2026-05-30',
   v_audit_id, NULL, now() - interval '30 days', now() - interval '1 days'),

  (v_aud04, v_inst_mof, 'AUD-MF2026-004',
   'Ghost Beneficiaries Identified — Masvingo Province Social Protection Register',
   'Internal audit cross-referenced the social protection register with NSSA and RBZ payment records and identified 3,847 ghost beneficiaries in Masvingo Province. Estimated quarterly leakage: USD 182,000. Two bank accounts appear linked to multiple ghost records.',
   'critical', 'in_progress',
   'Biometric verification not yet rolled out in Masvingo Province. Manual verification process relied on paper IDs that could be duplicated. Local government data not synced with national registry.',
   'risk', v_risk06,
   v_dept_id, '2026-06-30', '2026-05-31',
   v_audit_id, NULL, now() - interval '40 days', now() - interval '2 days'),

  (v_aud05, v_inst_mof, 'AUD-MF2026-005',
   'Incomplete Asset Register Across 14 MDAs — USD 3.2M Discrepancy',
   'Physical asset verification exercise revealed 14 MDAs have incomplete or materially outdated asset registers. Total value of unrecorded or misclassified moveable assets exceeds USD 3.2 million, representing a material PFMA compliance gap.',
   'high', 'open',
   'Decentralised asset management with no central tracking system. MDA-level IT systems not integrated with Treasury GFMIS. Insufficient follow-up from Treasury on annual asset verification compliance.',
   'compliance_obligation', v_comp10,
   v_dept_id, '2026-08-31', '2026-07-31',
   v_audit_id, NULL, now() - interval '55 days', now() - interval '10 days'),

  (v_aud06, v_inst_mof, 'AUD-MF2026-006',
   'Anti-Corruption Risk Register Overdue by 7 Weeks',
   'The Ministry''s ZACC/PECOGA anti-corruption risk register update is 7 weeks overdue. The register has not been refreshed since August 2025, and 6 new high-value procurement categories introduced in FY2026 have not been assessed for corruption risk.',
   'medium', 'open',
   'Competing compliance deadlines in Q1 2026. Risk Officer capacity constrained by concurrent ISO 27001 gap assessment. Anti-corruption risk methodology guide not accessible in the shared document system.',
   'compliance_obligation', v_comp08,
   v_risk_id, '2026-06-30', '2026-05-31',
   v_audit_id, NULL, now() - interval '25 days', now() - interval '2 days'),

  (v_aud07, v_inst_mof, 'AUD-MF2026-007',
   'PFMA e-Learning Completion Below 60% in 4 MDAs',
   'Despite the mandatory PFMA e-learning rollout, 4 MDAs (Ministry of Lands, NSSA, ZESA Holdings, and Rural District Councils) recorded completion rates below 60% at the Q1 deadline. Management has since confirmed remediation.',
   'low', 'closed',
   'Limited internet bandwidth at some MDA offices prevented e-learning platform access. Lack of management enforcement of training deadlines.',
   'compliance_obligation', v_comp07,
   v_audit_id, '2026-03-31', '2026-03-31',
   v_audit_id, now() - interval '45 days', now() - interval '70 days', now() - interval '45 days')

ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- 11. BOARD MEETINGS (3 closed + 1 scheduled)
-- ================================================================

INSERT INTO public.board_meetings (
  id, institution_id, title, meeting_date, location, status,
  agenda_items, attendee_ids,
  created_by, created_at, updated_at
) VALUES

  (v_mtg01, v_inst_mof,
   'Q4 2025 Board Meeting — Financial Year-End Review',
   now() - interval '120 days',
   'MOFED Board Room, Munhumutapa Building, Harare',
   'closed',
   ARRAY[
     'Approval of Minutes — Q3 2025 Board Meeting',
     'CFO Report: Q4 2025 Revenue and Expenditure Performance (USD 4.82B vs USD 5.1B target)',
     'Auditor-General Engagement: FY2025 Audit Preparation — Technical Advisor Appointment',
     'Risk Officer Report: Debt Sustainability Assessment Q4 2025',
     'PFMA Compliance Scorecard: Q4 2025 MDA Results',
     'Any Other Business'
   ],
   ARRAY[v_board1_id, v_board2_id, v_ceo_id, v_risk_id, v_audit_id],
   v_ceo_id, now() - interval '130 days', now() - interval '120 days'),

  (v_mtg02, v_inst_mof,
   'Q1 2026 Board Meeting — Strategic Planning & Budget Review',
   now() - interval '60 days',
   'MOFED Board Room, Munhumutapa Building, Harare',
   'closed',
   ARRAY[
     'Approval of Minutes — Q4 2025 Board Meeting',
     'CEO Strategic Report: NDS2 KPI Q1 2026 Progress — 9 Objectives Review',
     'Risk Officer Report: Top 10 Risk Register Q1 2026 Update',
     'Compliance Report: PFMA Q1 2026 Obligations Status — 2 Overdue Items',
     'Internal Audit: Q1 2026 Audit Plan Progress and Findings Summary',
     'Infrastructure Bond Programme: Board Approval — USD 100M First Tranche',
     'Delegation of Authority Framework: Proposed Amendments',
     'Any Other Business'
   ],
   ARRAY[v_board1_id, v_board2_id, v_ceo_id, v_risk_id, v_audit_id, v_dept_id],
   v_ceo_id, now() - interval '70 days', now() - interval '60 days'),

  (v_mtg03, v_inst_mof,
   'Special Board Session — Cyber Security Incident & Emergency SOC Procurement',
   now() - interval '20 days',
   'Virtual (Microsoft Teams) — Emergency Session',
   'closed',
   ARRAY[
     'Briefing: ZIMRA Systems Attempted Cyber Intrusion — April 2026 (Chido Mutasa, Risk Officer)',
     'Critical Audit Finding: SOC Procurement 45 Days Overdue — AUD-MF2026-003',
     'Board Resolution: Emergency Procurement Authority for Managed SOC Services (up to USD 380,000)',
     'Technology Risk Appetite Statement Revision: Medium → Low Threshold'
   ],
   ARRAY[v_board1_id, v_board2_id, v_ceo_id, v_risk_id],
   v_ceo_id, now() - interval '22 days', now() - interval '20 days'),

  (v_mtg04, v_inst_mof,
   'Q2 2026 Board Meeting — Mid-Year Governance Review',
   now() + interval '30 days',
   'MOFED Board Room, Munhumutapa Building, Harare',
   'scheduled',
   ARRAY[
     'Approval of Minutes — Q1 2026 Board Meeting and Special Cyber Session',
     'CEO Strategic Report: NDS2 KPI Q2 2026 Performance — Mid-Year Assessment',
     'CFO Report: H1 2026 Budget Execution vs. MTFF Targets',
     'Risk Officer Report: Risk Register Q2 2026 Update and Revised Technology Risk Appetite Statement',
     'Compliance Report: PFMA H1 2026 Obligations — Overdue Items and Remediation Plans',
     'Audit Committee Report: H1 2026 Findings Summary — 2 Critical, 2 High',
     'Green Budget Framework: Interim Progress Report and GCF Accreditation Update',
     'AfCFTA Trade Finance Window: Board Approval to Launch Pilot Programme',
     'Delegation of Authority: AG Office Legal Opinion and Revised Framework for Approval'
   ],
   ARRAY[v_board1_id, v_board2_id, v_ceo_id, v_risk_id, v_audit_id, v_dept_id],
   v_ceo_id, now() - interval '5 days', now() - interval '5 days')

ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- 12. BOARD RESOLUTIONS (8 resolutions across 3 closed meetings)
-- ================================================================

INSERT INTO public.board_resolutions (
  id, institution_id, meeting_id, resolution_number,
  motion_text, proposer_id, seconder_id, vote_outcome, notes,
  created_by, created_at
) VALUES

  -- Meeting 1 (Q4 2025)
  (v_res01, v_inst_mof, v_mtg01, 1,
   'That the Board approves the Q3 2025 minutes as a true and correct record of that meeting.',
   v_board1_id, v_board2_id, 'passed',
   'Unanimously approved (5-0). No amendments proposed.',
   v_ceo_id, now() - interval '120 days'),

  (v_res02, v_inst_mof, v_mtg01, 2,
   'That the Board notes the Q4 2025 revenue performance of USD 4.82 billion against a target of USD 5.1 billion (shortfall: USD 280 million, -5.5%), and directs management to submit a detailed variance analysis within 14 days.',
   v_board2_id, v_board1_id, 'passed',
   'Approved 4-1. Board Member Ncube requested disaggregation by revenue head and by province. Variance analysis to cover both formal sector contraction and informal sector revenue gap.',
   v_ceo_id, now() - interval '120 days'),

  (v_res03, v_inst_mof, v_mtg01, 3,
   'That the Board approves the engagement of Ernst & Young Zimbabwe as independent technical advisors for the FY2025 audit preparation process at a fee not exceeding USD 85,000, pending Audit Committee ratification.',
   v_board1_id, v_board2_id, 'passed',
   'Unanimously approved following Audit Committee recommendation and three-quotation competitive process (BDO Zimbabwe: USD 92,000; Deloitte Zimbabwe: USD 97,500; E&Y Zimbabwe: USD 82,000).',
   v_ceo_id, now() - interval '120 days'),

  -- Meeting 2 (Q1 2026)
  (v_res04, v_inst_mof, v_mtg02, 1,
   'That the Board approves the Q4 2025 Board Meeting minutes and Special Resolution minutes as a true and correct record.',
   v_board1_id, v_board2_id, 'passed',
   'Approved 6-0. Minor typographical correction to Annex B (legal entity name spelling) noted and corrected.',
   v_ceo_id, now() - interval '60 days'),

  (v_res05, v_inst_mof, v_mtg02, 2,
   'That the Board approves in principle the issuance of the first USD 100 million tranche of the Infrastructure Bond Programme, subject to: (a) satisfactory completion of the legal feasibility study; (b) CMA registration of the prospectus; and (c) favourable investor appetite survey results — all to be completed by 30 April 2026.',
   v_board1_id, v_board2_id, 'passed',
   'Approved 5-0. CFO instructed to report back on legal sign-off status at Q2 2026 meeting. Board noted the programme is currently in draft status pending these conditions precedent.',
   v_ceo_id, now() - interval '60 days'),

  (v_res06, v_inst_mof, v_mtg02, 3,
   'That the Board tables the proposed amendments to the Delegation of Authority framework pending written legal opinion from the Attorney-General''s Office, and directs that the revised framework be presented for approval at the Q2 2026 Board Meeting.',
   v_board2_id, v_board1_id, 'tabled',
   'Tabled by consensus. CEO directed to submit DoA to AG Office within 5 working days. Legal opinion expected by 15 May 2026.',
   v_ceo_id, now() - interval '60 days'),

  -- Meeting 3 (Special Cyber Session)
  (v_res07, v_inst_mof, v_mtg03, 1,
   'That the Board grants emergency procurement authority to the CEO to award a 12-month managed SOC services contract to a pre-qualified vendor, for a value not exceeding USD 380,000, bypassing the standard tender evaluation process on grounds of critical and imminent security risk, as defined under PFMA §38(2)(c) emergency provisions.',
   v_board1_id, v_board2_id, 'passed',
   'Passed unanimously (4-0) via emergency electronic vote. CEO must report full contract terms to the Board within 7 calendar days of contract award. Audit Committee to review procurement compliance within 30 days.',
   v_ceo_id, now() - interval '20 days'),

  (v_res08, v_inst_mof, v_mtg03, 2,
   'That the Board directs the Risk Officer to revise the Technology Risk Appetite Statement to reduce the acceptable residual risk threshold for cyber and operational technology risks from "Medium" to "Low", effective 1 June 2026, and present the revised statement for formal Board ratification at the Q2 2026 Meeting.',
   v_board2_id, NULL, 'passed',
   'Passed 4-0. Risk Officer Chido Mutasa to produce draft revised Risk Appetite Statement within 30 days. General Counsel to confirm alignment with existing insurance policy terms.',
   v_ceo_id, now() - interval '20 days')

ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- 13. BOARD ACTION ITEMS (8 action items across 3 meetings)
-- ================================================================

INSERT INTO public.board_action_items (
  id, institution_id, meeting_id, resolution_id, title, description,
  owner_id, due_date, status,
  created_by, created_at, updated_at
) VALUES

  -- From Meeting 1 (Q4 2025)
  (v_act01, v_inst_mof, v_mtg01, v_res02,
   'Q4 2025 Revenue Variance Analysis Report',
   'Prepare detailed variance analysis of the Q4 2025 revenue shortfall (USD 280M against target), disaggregated by major revenue head (Income Tax, VAT, Customs & Excise, Royalties) and by region. Submit to Board Chairman and copy all Board members.',
   v_ceo_id, (now() - interval '106 days')::date, 'completed',
   v_ceo_id, now() - interval '120 days', now() - interval '100 days'),

  (v_act02, v_inst_mof, v_mtg01, v_res03,
   'E&Y Zimbabwe Engagement Letter Execution',
   'Execute the engagement letter with Ernst & Young Zimbabwe for FY2025 audit technical advisory. Provide signed original to the Audit Committee chair and upload to board pack portal.',
   v_audit_id, (now() - interval '105 days')::date, 'completed',
   v_ceo_id, now() - interval '120 days', now() - interval '108 days'),

  -- From Meeting 2 (Q1 2026)
  (v_act03, v_inst_mof, v_mtg02, v_res05,
   'Infrastructure Bond Legal & Market Feasibility Study',
   'Commission and complete: (a) legal feasibility study for USD 100M bond tranche (ZimLaw Partners); (b) CMA registration of the prospectus; (c) investor appetite survey with top 20 pension funds. All three conditions must be satisfied before full Board approval.',
   v_ceo_id, (now() - interval '30 days')::date, 'overdue',
   v_ceo_id, now() - interval '60 days', now() - interval '5 days'),

  (v_act04, v_inst_mof, v_mtg02, v_res06,
   'Delegation of Authority — AG Office Legal Review',
   'Submit the revised Delegation of Authority framework to the Attorney-General''s Office for written legal opinion. Obtain signed opinion by 15 May 2026 for tabling at Q2 2026 Board Meeting.',
   v_ceo_id, '2026-05-15'::date, 'in_progress',
   v_ceo_id, now() - interval '60 days', now() - interval '10 days'),

  (v_act05, v_inst_mof, v_mtg02, NULL,
   'NDS2 Q1 2026 KPI Performance Dashboard — Board Circulation',
   'Prepare and circulate the Q1 2026 strategic KPI performance dashboard to all Board members no later than 14 days before the Q2 2026 Board Meeting. Include traffic-light status for all 18 KPIs.',
   v_risk_id, (now() + interval '16 days')::date, 'in_progress',
   v_ceo_id, now() - interval '60 days', now() - interval '5 days'),

  -- From Meeting 3 (Special Cyber Session)
  (v_act06, v_inst_mof, v_mtg03, v_res07,
   'SOC Contract Award — Board Terms Report',
   'Execute managed SOC services contract under emergency procurement authority. Submit full contract terms report (vendor, price, SLA, penalty regime, data handling) to all Board members within 7 calendar days of contract award.',
   v_ceo_id, (now() - interval '13 days')::date, 'overdue',
   v_ceo_id, now() - interval '20 days', now() - interval '2 days'),

  (v_act07, v_inst_mof, v_mtg03, v_res08,
   'Revised Technology Risk Appetite Statement',
   'Revise the Technology Risk Appetite Statement to set cyber residual risk threshold at "Low". Circulate draft to Board members 7 days before Q2 2026 Board Meeting for pre-reading. Present for formal ratification at Q2 meeting.',
   v_risk_id, (now() + interval '23 days')::date, 'in_progress',
   v_ceo_id, now() - interval '20 days', now() - interval '5 days'),

  (v_act08, v_inst_mof, v_mtg03, NULL,
   'ZIMRA Cyber Incident Post-Mortem Report',
   'Conduct thorough post-mortem investigation of the April 2026 attempted cyber intrusion on ZIMRA systems. Document attack vector, indicators of compromise, affected systems, containment actions, and lessons learned. Present at Q2 2026 Board Meeting.',
   v_risk_id, (now() + interval '26 days')::date, 'in_progress',
   v_ceo_id, now() - interval '20 days', now() - interval '3 days')

ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- 14. INCIDENT CASES (7 cases across all categories)
-- ================================================================

INSERT INTO public.incident_cases (
  id, institution_id, case_reference, title, description, category,
  status, visibility, severity, is_anonymous,
  reported_by_user_id, reporter_name, reporter_contact,
  assigned_investigator_id, resolution_summary, sla_due_date,
  created_at, updated_at
) VALUES

  (v_inc01, v_inst_mof, 'INC-MF2026-001',
   'Suspected Payroll Fraud — HR Division (Fictitious Employees)',
   'Anonymous whistleblower report alleging that a payroll officer in the HR Division has created at least 3 fictitious employee records and is directing monthly salaries to personal bank accounts. Estimated monthly exposure: USD 12,000 (3 ghost salaries at USD 4,000 each).',
   'fraud', 'in_investigation', 'investigator_admin_only', 'high', true,
   NULL, NULL, NULL,
   v_audit_id, NULL, now() + interval '14 days',
   now() - interval '45 days', now() - interval '5 days'),

  (v_inc02, v_inst_mof, 'INC-MF2026-002',
   'Procurement Officer Conflict of Interest — IT Infrastructure Tender',
   'Named whistleblower report alleging that Senior Procurement Officer (name on file) holds an undisclosed shareholding interest in TechBridge Solutions (Pvt) Ltd, the company awarded the USD 2.1M IT infrastructure tender (Ref: MOFED/IT/2026/004).',
   'misconduct', 'assigned', 'oversight_visible', 'high', false,
   v_dept_id, 'Simba Chigwedere', 'simba.chigwedere@mof.gov.zw',
   v_audit_id, NULL, now() + interval '21 days',
   now() - interval '30 days', now() - interval '2 days'),

  (v_inc03, v_inst_mof, 'INC-MF2026-003',
   'Spear-Phishing Attack on ZIMRA Core Tax Systems — Suspected APT',
   'ZIMRA''s IT security team detected and blocked a sophisticated spear-phishing campaign targeting 47 senior ZIMRA officers with privileged access to the ZIMRA revenue management system (ASYCUDA and ITAX). Attack used AI-generated emails mimicking MOFED communications. No data exfiltration confirmed.',
   'cyber', 'escalated', 'oversight_visible', 'critical', false,
   v_risk_id, 'Chido Mutasa', 'chido.mutasa@mof.gov.zw',
   v_risk_id, NULL, now() + interval '7 days',
   now() - interval '25 days', now() - interval '1 days'),

  (v_inc04, v_inst_mof, 'INC-MF2026-004',
   'Workplace Safety Incident — Staircase Fall, Munhumutapa Building',
   'Finance Officer (Grade 7) sustained a fractured left wrist after falling on an uneven staircase (Block B, 3rd Floor) in Munhumutapa Building. NSSA notification filed within 24 hours. Investigation revealed Facilities Management had received a maintenance request for the staircase 6 weeks prior but failed to act.',
   'safety', 'closed', 'oversight_visible', 'medium', false,
   v_dept_id, 'Simba Chigwedere', 'simba.chigwedere@mof.gov.zw',
   v_audit_id,
   'Staircase repaired and inspected by certified building inspector. NSSA compensation claim processed (USD 3,200 medical costs). Facilities maintenance protocol updated: mandatory 48-hour repair SLA for all safety-related requests. Three staff safety awareness sessions conducted.',
   now() - interval '30 days',
   now() - interval '75 days', now() - interval '40 days'),

  (v_inc05, v_inst_mof, 'INC-MF2026-005',
   'Social Protection Data Breach — Third-Party Cloud Storage Exposure',
   'A third-party data analytics firm (DataInsight Africa) contracted by the Ministry to analyse social protection targeting data inadvertently exposed 12,000 beneficiary records (full names, national ID numbers, banking details, GPS coordinates) through a publicly accessible AWS S3 bucket. Breach discovered and reported by CERT-ZW.',
   'cyber', 'in_investigation', 'investigator_admin_only', 'critical', false,
   v_risk_id, 'Chido Mutasa', 'chido.mutasa@mof.gov.zw',
   v_risk_id, NULL, now() + interval '5 days',
   now() - interval '15 days', now() - interval '2 days'),

  (v_inc06, v_inst_mof, 'INC-MF2026-006',
   'Alleged Irregular Appointment — Finance Division Director',
   'Anonymous report alleging that the Finance Division Director was appointed in breach of the Public Service Act, bypassing PSC merit-based competitive selection through undocumented ministerial intervention. Report includes alleged correspondence.',
   'governance', 'new', 'investigator_admin_only', 'medium', true,
   NULL, NULL, NULL,
   NULL, NULL, now() + interval '30 days',
   now() - interval '8 days', now() - interval '8 days'),

  (v_inc07, v_inst_mof, 'INC-MF2026-007',
   'IT Equipment Theft — MOFED Asset Store Room',
   'Six items of IT equipment (4 laptops, 2 external hard drives) valued at approximately USD 4,200 were reported missing from the MOFED asset store room (Room 102, Ground Floor). No signs of forced entry. Access logs show the store room was accessed by 3 different staff members on the date of the incident. CCTV footage under review.',
   'misconduct', 'assigned', 'investigator_admin_only', 'low', false,
   v_dept_id, 'Simba Chigwedere', 'simba.chigwedere@mof.gov.zw',
   v_audit_id, NULL, now() + interval '35 days',
   now() - interval '12 days', now() - interval '4 days')

ON CONFLICT (id) DO NOTHING;


-- ================================================================
-- 15. INCIDENT CASE EVENTS (investigation timeline entries)
-- ================================================================

-- INC-MF2026-001: Payroll Fraud
INSERT INTO public.incident_case_events (institution_id, case_id, event_type, notes, actor_id, actor_name, created_at) VALUES
  (v_inst_mof, v_inc01, 'case_opened',
   'Anonymous report received via MOFED fraud hotline (0800-ZACC-01). Reference allocated. HR Division access suspended pending review.',
   v_admin_id, 'System Administrator', now() - interval '45 days'),
  (v_inst_mof, v_inc01, 'assigned',
   'Case assigned to Tinashe Dube (Audit Officer) as lead investigator. Preliminary review authorised to access payroll system records.',
   v_admin_id, 'System Administrator', now() - interval '44 days'),
  (v_inst_mof, v_inc01, 'status_changed',
   'Status changed to In Investigation. Grounds confirmed: payroll system shows 3 employee records with no corresponding NSSA registration, no tax file number, and no HR onboarding documentation.',
   v_audit_id, 'Tinashe Dube', now() - interval '40 days'),
  (v_inst_mof, v_inc01, 'note_added',
   'FY2025 Q4 payroll data analysed. Three employee records (EMP-9847, EMP-9851, EMP-9863) appear fictitious: joined within 6 weeks of each other, same bank branch, no department allocation in HRMS.',
   v_audit_id, 'Tinashe Dube', now() - interval '20 days'),
  (v_inst_mof, v_inc01, 'note_added',
   'RBZ payment trace confirms all three salary payments route to a single CABS account (ending 4471). Account opened 8 months ago. Matter formally referred to ZACC and ZRP Financial Intelligence Unit. Payroll officer suspended pending investigation.',
   v_audit_id, 'Tinashe Dube', now() - interval '5 days');

-- INC-MF2026-002: Procurement Conflict of Interest
INSERT INTO public.incident_case_events (institution_id, case_id, event_type, notes, actor_id, actor_name, created_at) VALUES
  (v_inst_mof, v_inc02, 'case_opened',
   'Named report received by CEO and forwarded to Internal Audit. Case number allocated. PRAZ notified of investigation.',
   v_ceo_id, 'Tendai Moyo', now() - interval '30 days'),
  (v_inst_mof, v_inc02, 'assigned',
   'Assigned to Tinashe Dube (Audit Officer). CEO instructed Procurement Officer concerned to recuse from all matters related to tender MOFED/IT/2026/004 pending investigation.',
   v_admin_id, 'System Administrator', now() - interval '29 days'),
  (v_inst_mof, v_inc02, 'note_added',
   'ZIMRA company registry search confirms accused officer is listed as 15% shareholder in TechBridge Solutions (Pvt) Ltd (Reg. 2019/1847). Declaration of Interest register for FY2026 shows this was not disclosed.',
   v_audit_id, 'Tinashe Dube', now() - interval '15 days');

-- INC-MF2026-003: Cyber Attack — ZIMRA
INSERT INTO public.incident_case_events (institution_id, case_id, event_type, notes, actor_id, actor_name, created_at) VALUES
  (v_inst_mof, v_inc03, 'case_opened',
   'ZIMRA CISO reported attempted spear-phishing attack. Incident Response Plan (IRP v2.1) activated. All 47 targeted email accounts quarantined.',
   v_risk_id, 'Chido Mutasa', now() - interval '25 days'),
  (v_inst_mof, v_inc03, 'status_changed',
   'Escalated to Board level given critical severity rating and initial threat intelligence suggesting state-sponsored APT actor profile. CEO and Board Chair notified.',
   v_risk_id, 'Chido Mutasa', now() - interval '24 days'),
  (v_inst_mof, v_inc03, 'note_added',
   'CERT-ZW engaged for threat intelligence analysis. Email headers traced to IP ranges associated with APT-ZW-03 (a known regional threat actor targeting government finance systems). All 47 accounts force-reset. Two-factor authentication enforced for all ZIMRA privileged accounts.',
   v_risk_id, 'Chido Mutasa', now() - interval '22 days'),
  (v_inst_mof, v_inc03, 'note_added',
   'Emergency Board session convened (Special Session — MF-MTG-2026-003). Board approved emergency SOC procurement authority (Resolution MF-RES-2026-007). Forensic investigation of all 47 affected endpoints in progress.',
   v_risk_id, 'Chido Mutasa', now() - interval '20 days'),
  (v_inst_mof, v_inc03, 'note_added',
   'Full forensic analysis complete. No data exfiltration confirmed across ZIMRA mail servers, ITAX, and ASYCUDA endpoints. Attack infrastructure taken down in cooperation with INTERPOL and COMESA CERT. Post-mortem report in preparation for Board.',
   v_risk_id, 'Chido Mutasa', now() - interval '1 days');

-- INC-MF2026-004: Workplace Safety (closed)
INSERT INTO public.incident_case_events (institution_id, case_id, event_type, notes, actor_id, actor_name, created_at) VALUES
  (v_inst_mof, v_inc04, 'case_opened',
   'Workplace injury reported by Finance Officer. NSSA BI-164 notification form filed within statutory 24-hour window.',
   v_dept_id, 'Simba Chigwedere', now() - interval '75 days'),
  (v_inst_mof, v_inc04, 'assigned',
   'Assigned to Tinashe Dube (Audit Officer) for workplace safety investigation.',
   v_admin_id, 'System Administrator', now() - interval '74 days'),
  (v_inst_mof, v_inc04, 'note_added',
   'Facilities Management records confirm maintenance request (Ref: FM-2026-0047) was received 42 days prior to the incident. Request was classified "Low Priority" and not actioned. Negligence finding documented.',
   v_audit_id, 'Tinashe Dube', now() - interval '68 days'),
  (v_inst_mof, v_inc04, 'note_added',
   'Staircase repaired and certified by Anchor Engineering (Pvt) Ltd. NSSA compensation processed: USD 3,200 medical costs reimbursed. Three facilities staff issued formal written warnings.',
   v_audit_id, 'Tinashe Dube', now() - interval '45 days'),
  (v_inst_mof, v_inc04, 'status_changed',
   'Case closed. All remediation actions confirmed complete. Safety protocol update effective as of 1 April 2026.',
   v_audit_id, 'Tinashe Dube', now() - interval '40 days');

-- INC-MF2026-005: Data Breach
INSERT INTO public.incident_case_events (institution_id, case_id, event_type, notes, actor_id, actor_name, created_at) VALUES
  (v_inst_mof, v_inc05, 'case_opened',
   'CERT-ZW notified Ministry of unsecured S3 bucket. Ministry immediately contacted DataInsight Africa who confirmed the exposure and secured the bucket. POTRAZ notified per PPDPA §31 72-hour breach notification requirement.',
   v_risk_id, 'Chido Mutasa', now() - interval '15 days'),
  (v_inst_mof, v_inc05, 'status_changed',
   'Status moved to In Investigation. Scope of breach confirmed: 12,000 records, 3 data categories (PII, banking, location). DPA compliance assessment commenced.',
   v_risk_id, 'Chido Mutasa', now() - interval '13 days'),
  (v_inst_mof, v_inc05, 'note_added',
   'Forensic review of S3 access logs: bucket was publicly accessible for 11 days. Google crawler and 2 external IP addresses confirmed to have accessed files. Contract with DataInsight Africa suspended. Legal team engaged for breach-of-contract claim.',
   v_risk_id, 'Chido Mutasa', now() - interval '5 days');

END;
$seed$;

COMMIT;

-- =============================================================
-- SUMMARY of demo data inserted:
--
-- Institutions:    4  (Ministry of Finance + 3 additional)
-- Users:           7  (admin + CEO + Risk Officer + 2 Board Members
--                       + Audit Officer + Dept Head)
-- Objectives:      9  (one per NDS2 pillar; 2 for Econ Transformation)
-- KPIs:           18  (2-3 per objective; 5 with no readings yet)
-- KPI Readings:   ~55 historical data points for sparklines & charts
-- Risks:          10  (across all 6 risk categories)
-- Risk Treatments: 13  (1-2 per risk; mix of statuses including overdue)
-- Compliance:     10  obligations (PFMA x5, NDS2, PPDPA, IPSAS, PECOGA, King IV)
-- Attestations:    4  (for the 4 already-actioned obligations)
-- Audit Findings:  7  (2 critical, 2 high, 2 medium, 1 low; 1 closed)
-- Board Meetings:  4  (3 closed + 1 upcoming in 30 days)
-- Resolutions:     8  (across 3 meetings; mix of passed/tabled)
-- Action Items:    8  (2 completed, 2 overdue, 3 in-progress, 1 pending)
-- Incident Cases:  7  (fraud, misconduct x2, cyber x2, safety, governance)
-- Case Events:    ~20 investigation timeline entries
--
-- Demo logins:
--   admin@grcnexus.gov.zw       / Admin@GRC2026!  (System Administrator)
--   tendai.moyo@mof.gov.zw      / Demo@GRC2026!   (CEO)
--   chido.mutasa@mof.gov.zw     / Demo@GRC2026!   (Risk Officer)
--   farai.zvobgo@board.mof.gov.zw / Demo@GRC2026! (Board Member)
--   rudo.ncube@board.mof.gov.zw / Demo@GRC2026!   (Board Member)
--   tinashe.dube@mof.gov.zw     / Demo@GRC2026!   (Audit Officer)
--   simba.chigwedere@mof.gov.zw / Demo@GRC2026!   (Dept Head)
-- =============================================================
