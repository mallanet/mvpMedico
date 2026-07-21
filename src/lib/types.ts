export type AppRole = "doctor" | "reception" | "admin_waira";
export type MembershipStatus = "active" | "paused" | "cancelled";
export type AppointmentStatus = "scheduled" | "confirmed" | "cancelled";

export type Profile = {
  id: string;
  full_name: string | null;
  role: AppRole;
};

export type Resource = {
  id: string;
  clinic_id: string;
  profile_id: string | null;
  display_name: string;
};

export type Landing = {
  id: string;
  resource_id: string;
  slug: string;
  headline: string;
  body: string;
  cta_label: string;
  show_donation_cta: boolean;
  donation_url: string | null;
  is_published: boolean;
};

export type DirectoryProfile = {
  id: string;
  resource_id: string;
  specialty: string;
  zone: string;
  bio_short: string;
  published_to_mallanet: boolean;
};

export type PatientMin = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
};

export type Appointment = {
  id: string;
  resource_id: string;
  patient_id: string | null;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  notes: string | null;
  patients_min?: PatientMin | null;
};

export type ExternalEvent = {
  id: string;
  resource_id: string;
  starts_at: string;
  ends_at: string;
  summary: string | null;
};

export type Membership = {
  id: string;
  clinic_id: string;
  status: MembershipStatus;
  activated_at: string | null;
};

export type ClinicContext = {
  profile: Profile;
  clinicId: string;
  resource: Resource;
  membership: Membership | null;
  landing: Landing | null;
  directory: DirectoryProfile | null;
};

export type TimeSlot = {
  startsAt: string;
  endsAt: string;
};

/** Canonical overlap rejection copy for UI + E2E. */
export const OVERLAP_MESSAGE =
  "Horario no disponible. Elegí otro turno." as const;
