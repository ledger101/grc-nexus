-- Migration: 20260522000008_strategic_rls.sql
-- Phase 2: Row-Level Security for strategic planning tables.
-- public.institution_id() and public.active_role() are SECURITY DEFINER functions
-- defined in Phase 1 migration 000002. Do NOT redefine them here.
-- PATTERN: Always wrap helper calls in (select ...) — cached per statement, not per row.

-- ============================================================
-- strategic_objectives
-- ============================================================

alter table public.strategic_objectives enable row level security;
alter table public.strategic_objectives force row level security;

create policy "strategic_objectives_select" on public.strategic_objectives
  for select to authenticated
  using (institution_id = (select public.institution_id()));

create policy "strategic_objectives_insert" on public.strategic_objectives
  for insert to authenticated
  with check (
    institution_id = (select public.institution_id())
    and (select public.active_role()) in ('admin', 'ceo')
  );

create policy "strategic_objectives_update" on public.strategic_objectives
  for update to authenticated
  using (institution_id = (select public.institution_id()))
  with check (
    institution_id = (select public.institution_id())
    and (select public.active_role()) in ('admin', 'ceo')
  );

-- ============================================================
-- kpis  (D-10: admin, ceo, risk-officer can create/edit)
-- ============================================================

alter table public.kpis enable row level security;
alter table public.kpis force row level security;

create policy "kpis_select" on public.kpis
  for select to authenticated
  using (institution_id = (select public.institution_id()));

create policy "kpis_insert" on public.kpis
  for insert to authenticated
  with check (
    institution_id = (select public.institution_id())
    and (select public.active_role()) in ('admin', 'ceo', 'risk-officer')
  );

create policy "kpis_update" on public.kpis
  for update to authenticated
  using (institution_id = (select public.institution_id()))
  with check (
    institution_id = (select public.institution_id())
    and (select public.active_role()) in ('admin', 'ceo', 'risk-officer')
  );

-- ============================================================
-- kpi_readings  (D-13: KPI owner OR admin can record)
-- ============================================================

alter table public.kpi_readings enable row level security;
alter table public.kpi_readings force row level security;

create policy "kpi_readings_select" on public.kpi_readings
  for select to authenticated
  using (institution_id = (select public.institution_id()));

create policy "kpi_readings_insert" on public.kpi_readings
  for insert to authenticated
  with check (
    institution_id = (select public.institution_id())
    and (
      (select public.active_role()) = 'admin'
      or recorded_by = auth.uid()
    )
  );
