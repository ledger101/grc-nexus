-- Migration: 20260522000007_strategic_schema.sql
-- Phase 2 Strategic Planning: enums, strategic_objectives, kpis, kpi_readings tables.
-- SECURITY: RLS is enabled in subsequent migration (20260522000008_strategic_rls.sql).
-- NOTE: Do not modify Phase 1 migrations (000001–000006). New enums go here.

-- ============================================================
-- Enums
-- ============================================================

create type public.nds2_pillar as enum (
  'economic_transformation',
  'social_development',
  'infrastructure_development',
  'environmental_sustainability',
  'governance_and_institutions',
  'innovation_and_technology',
  'regional_and_international_integration',
  'rural_and_urban_development'
);

create type public.objective_status as enum (
  'draft',
  'active',
  'at_risk',
  'completed',
  'cancelled'
);

create type public.kpi_frequency as enum (
  'monthly',
  'quarterly',
  'semi_annual',
  'annual'
);

-- ============================================================
-- strategic_objectives
-- ============================================================

create table public.strategic_objectives (
  id                 uuid primary key default gen_random_uuid(),
  institution_id     uuid not null references public.institutions(id) on delete restrict,
  title              text not null,
  description        text,
  owner_id           uuid references auth.users(id) on delete set null,
  start_date         date,
  target_date        date,
  status             public.objective_status not null default 'draft',
  nds2_pillar        public.nds2_pillar,
  institutional_goal text,
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_strategic_objectives_institution_id on public.strategic_objectives (institution_id);
create index idx_strategic_objectives_status         on public.strategic_objectives (status);
create index idx_strategic_objectives_owner_id       on public.strategic_objectives (owner_id);

-- ============================================================
-- kpis
-- ============================================================

create table public.kpis (
  id                  uuid primary key default gen_random_uuid(),
  institution_id      uuid not null references public.institutions(id) on delete restrict,
  objective_id        uuid not null references public.strategic_objectives(id) on delete cascade,
  title               text not null,
  description         text,
  owner_id            uuid references auth.users(id) on delete set null,
  baseline_value      numeric not null default 0,
  target_value        numeric not null,
  unit_of_measure     text not null,
  reporting_frequency public.kpi_frequency not null default 'quarterly',
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_kpis_institution_id on public.kpis (institution_id);
create index idx_kpis_objective_id   on public.kpis (objective_id);
create index idx_kpis_owner_id       on public.kpis (owner_id);

-- ============================================================
-- kpi_readings
-- ============================================================

create table public.kpi_readings (
  id               uuid primary key default gen_random_uuid(),
  institution_id   uuid not null references public.institutions(id) on delete restrict,
  kpi_id           uuid not null references public.kpis(id) on delete cascade,
  reporting_period text not null,
  actual_value     numeric not null,
  notes            text,
  recorded_by      uuid references auth.users(id) on delete set null,
  recorded_at      timestamptz not null default now()
);

create index idx_kpi_readings_institution_id on public.kpi_readings (institution_id);
create index idx_kpi_readings_kpi_id         on public.kpi_readings (kpi_id);
create index idx_kpi_readings_recorded_at    on public.kpi_readings (recorded_at desc);
