-- Migration: 20260522000012_risk_rls.sql
-- Phase 3 ERM Risk RLS policies.
-- Helper convention: always use (select public.institution_id()) and (select public.active_role()).

alter table public.risks enable row level security;
alter table public.risks force row level security;

create policy "risks_select" on public.risks
  for select to authenticated
  using (institution_id = (select public.institution_id()));

create policy "risks_insert" on public.risks
  for insert to authenticated
  with check (
    institution_id = (select public.institution_id())
    and (select public.active_role()) in ('admin', 'ceo', 'risk-officer')
  );

create policy "risks_update" on public.risks
  for update to authenticated
  using (institution_id = (select public.institution_id()))
  with check (
    institution_id = (select public.institution_id())
    and (select public.active_role()) in ('admin', 'ceo', 'risk-officer')
  );

alter table public.risk_treatments enable row level security;
alter table public.risk_treatments force row level security;

create policy "risk_treatments_select" on public.risk_treatments
  for select to authenticated
  using (institution_id = (select public.institution_id()));

create policy "risk_treatments_insert" on public.risk_treatments
  for insert to authenticated
  with check (
    institution_id = (select public.institution_id())
    and (select public.active_role()) in ('admin', 'ceo', 'risk-officer')
  );

create policy "risk_treatments_update" on public.risk_treatments
  for update to authenticated
  using (institution_id = (select public.institution_id()))
  with check (
    institution_id = (select public.institution_id())
    and (select public.active_role()) in ('admin', 'ceo', 'risk-officer')
  );
