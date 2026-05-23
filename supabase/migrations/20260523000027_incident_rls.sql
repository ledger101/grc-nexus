-- Migration: 20260523000027_incident_rls.sql
-- Phase 7 Incident & Whistleblower: RLS policies, storage controls, and safety constraints.

-- 1. Database-level constraint to guarantee absolute anonymity compliance
alter table public.incident_cases
  add constraint chk_anonymity_integrity
  check (
    not is_anonymous or (
      reported_by_user_id is null
      and reporter_name is null
      and reporter_contact is null
    )
  );

-- 2. Incident Cases Security
alter table public.incident_cases enable row level security;
alter table public.incident_cases force row level security;

create policy "incident_cases_select" on public.incident_cases
  for select to authenticated
  using (
    institution_id = (select public.institution_id())
    and (
      (select public.active_role()) in ('admin', 'ceo', 'compliance-officer')
      or assigned_investigator_id = auth.uid()
      or reported_by_user_id = auth.uid()
    )
  );

create policy "incident_cases_insert" on public.incident_cases
  for insert to public
  with check (
    (
      auth.role() = 'authenticated'
      and institution_id = (select public.institution_id())
    )
    or auth.role() = 'anon'
  );

create policy "incident_cases_update" on public.incident_cases
  for update to authenticated
  using (
    institution_id = (select public.institution_id())
    and (
      (select public.active_role()) in ('admin', 'compliance-officer')
      or assigned_investigator_id = auth.uid()
    )
  )
  with check (
    institution_id = (select public.institution_id())
    and (
      (select public.active_role()) in ('admin', 'compliance-officer')
      or assigned_investigator_id = auth.uid()
    )
  );

-- 3. Incident Case Events Security
alter table public.incident_case_events enable row level security;
alter table public.incident_case_events force row level security;

create policy "incident_case_events_select" on public.incident_case_events
  for select to authenticated
  using (
    institution_id = (select public.institution_id())
    and exists (
      select 1 from public.incident_cases ic
      where ic.id = case_id
        and ic.institution_id = (select public.institution_id())
        and (
          (select public.active_role()) in ('admin', 'ceo', 'compliance-officer')
          or ic.assigned_investigator_id = auth.uid()
          or ic.reported_by_user_id = auth.uid()
        )
    )
  );

create policy "incident_case_events_insert" on public.incident_case_events
  for insert to public
  with check (
    (
      auth.role() = 'authenticated'
      and institution_id = (select public.institution_id())
    )
    or auth.role() = 'anon'
  );

-- 4. Incident Evidence Metadata Security
alter table public.incident_case_evidence enable row level security;
alter table public.incident_case_evidence force row level security;

create policy "incident_case_evidence_select" on public.incident_case_evidence
  for select to authenticated
  using (
    institution_id = (select public.institution_id())
    and (
      (select public.active_role()) in ('admin', 'ceo', 'compliance-officer')
      or exists (
        select 1 from public.incident_cases ic
        where ic.id = case_id
          and ic.assigned_investigator_id = auth.uid()
      )
    )
  );

create policy "incident_case_evidence_insert" on public.incident_case_evidence
  for insert to public
  with check (
    (
      auth.role() = 'authenticated'
      and institution_id = (select public.institution_id())
    )
    or auth.role() = 'anon'
  );

-- 5. Storage Security Policies
create policy "incident_evidence_storage_select"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'incident-evidence'
    and (storage.foldername(name))[1] = (select auth.jwt() -> 'app_metadata' ->> 'institution_id')
    and (select public.active_role()) in ('admin', 'ceo', 'compliance-officer')
  );

create policy "incident_evidence_storage_insert"
  on storage.objects
  for insert
  to public
  with check (
    bucket_id = 'incident-evidence'
  );
