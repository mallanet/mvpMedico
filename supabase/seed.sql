-- Demo seed for local / CI. Requires auth schema (supabase db reset).
-- Credentials:
--   doctor@example.com / password123  (membership active, published landing)
--   admin@example.com  / password123  (role admin_waira)

create extension if not exists pgcrypto;

do $$
declare
  doctor_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  admin_id uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  clinic_id uuid;
  resource_id uuid;
  patient1 uuid;
  patient2 uuid;
  patient3 uuid;
  week_start timestamptz;
begin
  -- Doctor auth user
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    doctor_id,
    'authenticated',
    'authenticated',
    'doctor@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Dra. Demo Waira","role":"doctor"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  on conflict (id) do nothing;

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    doctor_id,
    doctor_id,
    format('{"sub":"%s","email":"doctor@example.com"}', doctor_id)::jsonb,
    'email',
    doctor_id::text,
    now(),
    now(),
    now()
  )
  on conflict do nothing;

  -- Admin auth user (no clinic bootstrap for non-doctor... trigger skips non-doctor)
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    admin_id,
    'authenticated',
    'authenticated',
    'admin@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Admin Waira","role":"admin_waira"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  on conflict (id) do nothing;

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    admin_id,
    admin_id,
    format('{"sub":"%s","email":"admin@example.com"}', admin_id)::jsonb,
    'email',
    admin_id::text,
    now(),
    now(),
    now()
  )
  on conflict do nothing;

  -- Ensure admin role (trigger may have set doctor from missing role)
  update public.profiles
  set role = 'admin_waira', full_name = 'Admin Waira'
  where id = admin_id;

  update public.profiles
  set full_name = 'Dra. Demo Waira', role = 'doctor'
  where id = doctor_id;

  select r.clinic_id, r.id
  into clinic_id, resource_id
  from public.resources r
  where r.profile_id = doctor_id
  limit 1;

  if clinic_id is null then
    raise notice 'Doctor clinic not bootstrapped; skip demo appointments';
    return;
  end if;

  update public.clinics
  set owner_id = doctor_id, name = 'Consultorio Demo Waira'
  where id = clinic_id;

  update public.memberships
  set status = 'active', activated_at = now()
  where clinic_id = clinic_id;

  update public.directory_profiles
  set
    specialty = 'Clínica médica',
    zone = 'CABA',
    bio_short = 'Atención presencial con agenda anti-solape.',
    published_to_mallanet = true
  where resource_id = resource_id;

  update public.landings
  set
    slug = 'dra-demo',
    headline = 'Agenda con la Dra. Demo',
    body = 'Elegí un horario disponible y dejá tus datos. Te confirmamos el turno.',
    is_published = true,
    show_donation_cta = true,
    donation_url = 'https://mallanet.example/donate'
  where resource_id = resource_id;

  insert into public.patients_min (full_name, phone, email)
  values
    ('Paciente Uno', '+5491100000001', 'p1@example.com'),
    ('Paciente Dos', '+5491100000002', null),
    ('Paciente Tres', '+5491100000003', 'p3@example.com');

  select id into patient1 from public.patients_min where phone = '+5491100000001' limit 1;
  select id into patient2 from public.patients_min where phone = '+5491100000002' limit 1;
  select id into patient3 from public.patients_min where phone = '+5491100000003' limit 1;

  -- Next Monday 10:00 local approx as UTC offsets — use date_trunc week + offsets
  week_start := date_trunc('week', now() at time zone 'America/Argentina/Buenos_Aires')
    at time zone 'America/Argentina/Buenos_Aires';

  delete from public.appointments where resource_id = resource_id;

  insert into public.appointments (resource_id, patient_id, starts_at, ends_at, status, notes)
  values
    (
      resource_id,
      patient1,
      week_start + interval '1 day' + interval '10 hours',
      week_start + interval '1 day' + interval '10 hours 30 minutes',
      'scheduled',
      'Control'
    ),
    (
      resource_id,
      patient2,
      week_start + interval '2 day' + interval '11 hours',
      week_start + interval '2 day' + interval '11 hours 30 minutes',
      'confirmed',
      null
    ),
    (
      resource_id,
      patient3,
      week_start + interval '3 day' + interval '16 hours',
      week_start + interval '3 day' + interval '16 hours 30 minutes',
      'scheduled',
      'Primera consulta'
    );
end $$;
