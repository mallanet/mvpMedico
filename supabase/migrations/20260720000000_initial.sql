-- mvpMedico / Waira initial schema

create extension if not exists btree_gist;

create type public.app_role as enum ('doctor', 'reception', 'admin_waira');
create type public.membership_status as enum ('active', 'paused');
create type public.appointment_status as enum ('scheduled', 'confirmed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.app_role not null default 'doctor',
  created_at timestamptz not null default now()
);

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  created_at timestamptz not null default now()
);

create table public.clinic_members (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null default 'doctor',
  created_at timestamptz not null default now(),
  unique (clinic_id, profile_id)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null unique references public.clinics (id) on delete cascade,
  status public.membership_status not null default 'paused',
  activated_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.directory_profiles (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null unique references public.resources (id) on delete cascade,
  specialty text not null default '',
  zone text not null default '',
  bio_short text not null default '',
  published_to_mallanet boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.landings (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null unique references public.resources (id) on delete cascade,
  slug text not null unique,
  headline text not null default '',
  body text not null default '',
  cta_label text not null default 'Pedir turno',
  show_donation_cta boolean not null default true,
  donation_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.patients_min (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  patient_id uuid references public.patients_min (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  constraint appointments_valid_range check (ends_at > starts_at)
);

-- Active appointments cannot overlap per resource
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    resource_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status <> 'cancelled');

create table public.external_connections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  provider text not null default 'google',
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  calendar_id text default 'primary',
  created_at timestamptz not null default now(),
  unique (profile_id, provider)
);

create table public.external_events (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  connection_id uuid references public.external_connections (id) on delete cascade,
  external_id text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  summary text,
  created_at timestamptz not null default now(),
  constraint external_events_valid_range check (ends_at > starts_at)
);

create index appointments_resource_starts_idx on public.appointments (resource_id, starts_at);
create index external_events_resource_starts_idx on public.external_events (resource_id, starts_at);

-- Auth → profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'doctor')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bootstrap clinic + resource for new doctor
create or replace function public.bootstrap_doctor_clinic()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid;
  v_resource_id uuid;
  v_slug text;
begin
  if new.role <> 'doctor' then
    return new;
  end if;

  insert into public.clinics (name)
  values (coalesce(new.full_name, 'Clínica') || ' — consultorio')
  returning id into v_clinic_id;

  insert into public.clinic_members (clinic_id, profile_id, role)
  values (v_clinic_id, new.id, 'doctor');

  insert into public.memberships (clinic_id, status)
  values (v_clinic_id, 'paused');

  insert into public.resources (clinic_id, profile_id, display_name)
  values (v_clinic_id, new.id, coalesce(new.full_name, 'Médico'))
  returning id into v_resource_id;

  v_slug := lower(regexp_replace(coalesce(new.full_name, 'medico'), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug) || '-' || substr(v_resource_id::text, 1, 8);

  insert into public.directory_profiles (resource_id, specialty, bio_short)
  values (v_resource_id, '', '');

  insert into public.landings (resource_id, slug, headline, body, is_published)
  values (
    v_resource_id,
    v_slug,
    'Agenda con ' || coalesce(new.full_name, 'tu médico'),
    'Pedí tu turno desde esta página.',
    false
  );

  return new;
end;
$$;

create trigger on_profile_bootstrap_clinic
  after insert on public.profiles
  for each row execute function public.bootstrap_doctor_clinic();

-- Helpers for RLS
create or replace function public.is_clinic_member(p_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.clinic_members cm
    where cm.clinic_id = p_clinic_id and cm.profile_id = auth.uid()
  );
$$;

create or replace function public.is_admin_waira()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin_waira'
  );
$$;

create or replace function public.resource_clinic_id(p_resource_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id from public.resources where id = p_resource_id;
$$;

alter table public.profiles enable row level security;
alter table public.clinics enable row level security;
alter table public.clinic_members enable row level security;
alter table public.memberships enable row level security;
alter table public.resources enable row level security;
alter table public.directory_profiles enable row level security;
alter table public.landings enable row level security;
alter table public.patients_min enable row level security;
alter table public.appointments enable row level security;
alter table public.external_connections enable row level security;
alter table public.external_events enable row level security;

-- profiles
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin_waira());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid());

-- clinics
create policy clinics_member_select on public.clinics
  for select using (public.is_clinic_member(id) or public.is_admin_waira());
create policy clinics_member_update on public.clinics
  for update using (public.is_clinic_member(id));

-- clinic_members
create policy clinic_members_select on public.clinic_members
  for select using (public.is_clinic_member(clinic_id) or public.is_admin_waira());

-- memberships
create policy memberships_select on public.memberships
  for select using (public.is_clinic_member(clinic_id) or public.is_admin_waira());
create policy memberships_anon_select_published on public.memberships
  for select to anon
  using (
    exists (
      select 1
      from public.resources r
      join public.landings l on l.resource_id = r.id
      where r.clinic_id = memberships.clinic_id
        and l.is_published = true
    )
  );
create policy memberships_admin_update on public.memberships
  for update using (public.is_admin_waira());

-- resources
create policy resources_select on public.resources
  for select using (
    public.is_clinic_member(clinic_id)
    or public.is_admin_waira()
    or exists (
      select 1 from public.landings l
      where l.resource_id = resources.id and l.is_published = true
    )
  );
create policy resources_update on public.resources
  for update using (public.is_clinic_member(clinic_id));

-- directory (public read when published to mallanet or landing published)
create policy directory_public_select on public.directory_profiles
  for select using (
    published_to_mallanet
    or public.is_clinic_member(public.resource_clinic_id(resource_id))
    or public.is_admin_waira()
    or exists (
      select 1 from public.landings l
      where l.resource_id = directory_profiles.resource_id and l.is_published = true
    )
  );
create policy directory_member_update on public.directory_profiles
  for update using (public.is_clinic_member(public.resource_clinic_id(resource_id)));

-- landings
create policy landings_public_select on public.landings
  for select using (
    is_published
    or public.is_clinic_member(public.resource_clinic_id(resource_id))
    or public.is_admin_waira()
  );
create policy landings_member_update on public.landings
  for update using (public.is_clinic_member(public.resource_clinic_id(resource_id)));

-- patients: members can manage; anon insert via service role / security definer for booking
create policy patients_member_all on public.patients_min
  for all using (
    exists (
      select 1 from public.appointments a
      join public.resources r on r.id = a.resource_id
      where a.patient_id = patients_min.id and public.is_clinic_member(r.clinic_id)
    )
    or public.is_admin_waira()
  )
  with check (true);

create policy patients_insert_authenticated on public.patients_min
  for insert to authenticated
  with check (true);

create policy patients_insert_anon on public.patients_min
  for insert to anon
  with check (true);

-- appointments
create policy appointments_member_select on public.appointments
  for select using (
    public.is_clinic_member(public.resource_clinic_id(resource_id))
    or public.is_admin_waira()
  );
create policy appointments_member_write on public.appointments
  for all using (
    public.is_clinic_member(public.resource_clinic_id(resource_id))
  )
  with check (
    public.is_clinic_member(public.resource_clinic_id(resource_id))
  );

create policy appointments_anon_insert on public.appointments
  for insert to anon
  with check (
    exists (
      select 1 from public.landings l
      join public.memberships m on m.clinic_id = public.resource_clinic_id(l.resource_id)
      where l.resource_id = appointments.resource_id
        and l.is_published = true
        and m.status = 'active'
    )
  );

create policy appointments_anon_select_own_slot on public.appointments
  for select to anon
  using (
    exists (
      select 1 from public.landings l
      where l.resource_id = appointments.resource_id and l.is_published = true
    )
  );

-- external
create policy external_connections_own on public.external_connections
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy external_events_select on public.external_events
  for select using (
    public.is_clinic_member(public.resource_clinic_id(resource_id))
    or exists (
      select 1 from public.landings l
      where l.resource_id = external_events.resource_id and l.is_published = true
    )
  );
create policy external_events_member_write on public.external_events
  for all using (public.is_clinic_member(public.resource_clinic_id(resource_id)))
  with check (public.is_clinic_member(public.resource_clinic_id(resource_id)));

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert on public.patients_min to anon;
grant select, insert on public.appointments to anon;
grant select on public.landings to anon;
grant select on public.directory_profiles to anon;
grant select on public.resources to anon;
grant select on public.external_events to anon;
grant select on public.memberships to anon;
