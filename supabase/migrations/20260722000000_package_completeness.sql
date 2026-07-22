-- Package completeness: insert policies for multi-resource + reception invite.

-- Doctors (clinic_members.role = doctor) may add clinic_members (reception).
drop policy if exists clinic_members_doctor_insert on public.clinic_members;
create policy clinic_members_doctor_insert on public.clinic_members
  for insert to authenticated
  with check (
    public.is_admin_waira()
    or exists (
      select 1
      from public.clinic_members cm
      where cm.clinic_id = clinic_members.clinic_id
        and cm.profile_id = auth.uid()
        and cm.role = 'doctor'
    )
  );

drop policy if exists clinic_members_doctor_select_profiles on public.profiles;
-- Members can see teammates' names (for /team).
create policy profiles_clinic_teammates_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin_waira()
    or exists (
      select 1
      from public.clinic_members me
      join public.clinic_members them on them.clinic_id = me.clinic_id
      where me.profile_id = auth.uid()
        and them.profile_id = profiles.id
    )
  );

-- Insert professionals (resource + directory + landing) within a clinic.
drop policy if exists resources_insert on public.resources;
create policy resources_insert on public.resources
  for insert to authenticated
  with check (public.is_clinic_member(clinic_id));

drop policy if exists directory_insert on public.directory_profiles;
create policy directory_insert on public.directory_profiles
  for insert to authenticated
  with check (
    public.is_clinic_member(public.resource_clinic_id(resource_id))
  );

drop policy if exists landings_insert on public.landings;
create policy landings_insert on public.landings
  for insert to authenticated
  with check (
    public.is_clinic_member(public.resource_clinic_id(resource_id))
  );
