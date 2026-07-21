-- Wire-up hardening: membership cancelled, external_events uniqueness,
-- clinics.owner_id, authenticated booking when landing published.
-- DECISION: keep starts_at/ends_at and bootstrap triggers from initial schema
-- (already on main); do not rename columns to start_time/end_time.

-- membership_status: add cancelled for admin lifecycle
do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'membership_status'
      and e.enumlabel = 'cancelled'
  ) then
    alter type public.membership_status add value 'cancelled';
  end if;
end $$;

-- Optional owner pointer on clinics (nullable; bootstrap does not set it)
alter table public.clinics
  add column if not exists owner_id uuid references public.profiles (id) on delete set null;

-- Idempotent unique busy blocks per resource/source window
alter table public.external_events
  add column if not exists source text not null default 'google_freebusy';

create unique index if not exists external_events_resource_window_source_uidx
  on public.external_events (resource_id, starts_at, ends_at, source);

-- Authenticated users may book published landings (same rules as anon)
drop policy if exists appointments_authenticated_insert on public.appointments;
create policy appointments_authenticated_insert on public.appointments
  for insert to authenticated
  with check (
    public.is_clinic_member(public.resource_clinic_id(resource_id))
    or exists (
      select 1
      from public.landings l
      join public.memberships m
        on m.clinic_id = public.resource_clinic_id(l.resource_id)
      where l.resource_id = appointments.resource_id
        and l.is_published = true
        and m.status = 'active'
    )
  );

-- Allow authenticated select of published landing slots (for slot picker UX)
drop policy if exists appointments_authenticated_select_published on public.appointments;
create policy appointments_authenticated_select_published on public.appointments
  for select to authenticated
  using (
    public.is_clinic_member(public.resource_clinic_id(resource_id))
    or public.is_admin_waira()
    or exists (
      select 1 from public.landings l
      where l.resource_id = appointments.resource_id and l.is_published = true
    )
  );
