-- Migration: 20260522000011_risk_schema.sql
-- Phase 3 ERM Risk schema: enums, risks, risk_treatments, indexes.

create type public.risk_category as enum (
  'strategic',
  'operational',
  'financial',
  'compliance',
  'reputational',
  'technology'
);

create type public.risk_status as enum (
  'open',
  'mitigated',
  'accepted',
  'closed',
  'escalated'
);

create type public.treatment_status as enum (
  'planned',
  'in_progress',
  'completed',
  'overdue',
  'cancelled'
);

create table public.risks (
  id                  uuid primary key default gen_random_uuid(),
  institution_id      uuid not null references public.institutions(id) on delete restrict,
  objective_id        uuid not null references public.strategic_objectives(id) on delete restrict,
  title               text not null,
  description         text,
  category            public.risk_category not null,
  owner_id            uuid references auth.users(id) on delete set null,
  status              public.risk_status not null default 'open',
  inherent_likelihood integer not null check (inherent_likelihood between 1 and 5),
  inherent_impact     integer not null check (inherent_impact between 1 and 5),
  residual_likelihood integer check (residual_likelihood is null or residual_likelihood between 1 and 5),
  residual_impact     integer check (residual_impact is null or residual_impact between 1 and 5),
  mitigating_controls text,
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (
    (residual_likelihood is null and residual_impact is null)
    or
    (residual_likelihood is not null and residual_impact is not null)
  )
);

create index idx_risks_institution_id on public.risks (institution_id);
create index idx_risks_objective_id on public.risks (objective_id);
create index idx_risks_owner_id on public.risks (owner_id);
create index idx_risks_status on public.risks (status);
create index idx_risks_category on public.risks (category);

create table public.risk_treatments (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  risk_id        uuid not null references public.risks(id) on delete cascade,
  title          text not null,
  description    text,
  owner_id       uuid references auth.users(id) on delete set null,
  due_date       date not null,
  status         public.treatment_status not null default 'planned',
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_risk_treatments_institution_id on public.risk_treatments (institution_id);
create index idx_risk_treatments_risk_id on public.risk_treatments (risk_id);
create index idx_risk_treatments_owner_id on public.risk_treatments (owner_id);
create index idx_risk_treatments_due_date on public.risk_treatments (due_date);
create index idx_risk_treatments_status on public.risk_treatments (status);
