-- Migration: 20260523000026_incident_schema.sql
-- Phase 7 Incident & Whistleblower: enums, cases, events, evidence, indexes, and storage bucket.

create type public.incident_category as enum (
  'fraud',
  'misconduct',
  'safety',
  'cyber',
  'governance',
  'other'
);

create type public.incident_status as enum (
  'new',
  'assigned',
  'in_investigation',
  'escalated',
  'closed'
);

create type public.incident_visibility as enum (
  'investigator_admin_only',
  'oversight_visible'
);

create type public.incident_severity as enum (
  'low',
  'medium',
  'high',
  'critical'
);

create table public.incident_cases (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  case_reference text not null default ('INC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  title text not null,
  description text not null,
  category public.incident_category not null,
  status public.incident_status not null default 'new',
  visibility public.incident_visibility not null default 'investigator_admin_only',
  severity public.incident_severity not null default 'low',
  is_anonymous boolean not null default false,
  reported_by_user_id uuid references auth.users(id) on delete set null,
  reporter_name text,
  reporter_contact text,
  assigned_investigator_id uuid references auth.users(id) on delete set null,
  resolution_summary text,
  sla_due_date timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, case_reference)
);

create index idx_incident_cases_institution_id on public.incident_cases (institution_id);
create index idx_incident_cases_status on public.incident_cases (status);
create index idx_incident_cases_category on public.incident_cases (category);
create index idx_incident_cases_severity on public.incident_cases (severity);
create index idx_incident_cases_assigned_investigator on public.incident_cases (assigned_investigator_id);
create index idx_incident_cases_sla_due_date on public.incident_cases (sla_due_date);

create table public.incident_case_events (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  case_id uuid not null references public.incident_cases(id) on delete cascade,
  event_type text not null,
  notes text not null,
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text,
  created_at timestamptz not null default now()
);

create index idx_incident_case_events_institution_id on public.incident_case_events (institution_id);
create index idx_incident_case_events_case_id on public.incident_case_events (case_id);

create table public.incident_case_evidence (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  case_id uuid not null references public.incident_cases(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  file_size_bytes bigint not null,
  sha256_hash text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

create index idx_incident_case_evidence_institution_id on public.incident_case_evidence (institution_id);
create index idx_incident_case_evidence_case_id on public.incident_case_evidence (case_id);

insert into storage.buckets (id, name, public)
values ('incident-evidence', 'incident-evidence', false);
