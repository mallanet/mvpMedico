import type {
  Appointment,
  AppointmentStatus,
  AppRole,
  DirectoryProfile,
  Landing,
  Membership,
  MembershipStatus,
  Profile,
  Resource,
} from "@/lib/types";

export const DEMO_SESSION_COOKIE = "waira_demo_session";
export const DEMO_DB_COOKIE = "waira_demo_db";
export const DEMO_DB_LS_KEY = "waira_demo_db";

export type DemoSession = {
  email: string;
  role: Profile["role"];
  profileId: string;
  clinicId: string;
  jwt: string;
};

export type DemoProfessional = {
  resource: Resource & { slot_minutes: number };
  landing: Landing;
  directory: DirectoryProfile;
};

export type DemoMember = {
  profileId: string;
  role: AppRole;
  email: string;
};

export type DemoClinic = {
  id: string;
  name: string;
  slug: string;
  specialty: string;
  city: string;
  country: string;
  address: string;
  professionals: DemoProfessional[];
  members: DemoMember[];
  membership: Membership;
  ownerProfileId: string;
};

export type DemoDb = {
  version: 2;
  profiles: Profile[];
  clinics: DemoClinic[];
  appointments: Appointment[];
};

function startOfWeekMonday(from = new Date()): Date {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function atWeekDay(
  weekStart: Date,
  dayOffset: number,
  hour: number,
  minute: number,
): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function apt(
  id: string,
  resourceId: string,
  starts: string,
  ends: string,
  fullName: string,
  phone: string,
  status: AppointmentStatus,
  notes: string | null = null,
  email: string | null = null,
): Appointment {
  return {
    id,
    resource_id: resourceId,
    patient_id: `patient-${id}`,
    starts_at: starts,
    ends_at: ends,
    status,
    notes,
    patients_min: {
      id: `patient-${id}`,
      full_name: fullName,
      phone,
      email,
    },
  };
}

export function buildSeedAppointments(now = new Date()): Appointment[] {
  const week = startOfWeekMonday(now);
  return [
    apt(
      "apt-001",
      "res-001",
      atWeekDay(week, 0, 9, 0),
      atWeekDay(week, 0, 9, 30),
      "María López",
      "+593990000001",
      "scheduled",
      null,
      "maria@example.com",
    ),
    apt(
      "apt-002",
      "res-001",
      atWeekDay(week, 0, 10, 30),
      atWeekDay(week, 0, 11, 0),
      "Carlos Ruiz",
      "+593990000002",
      "confirmed",
    ),
    apt(
      "apt-003",
      "res-001",
      atWeekDay(week, 1, 8, 0),
      atWeekDay(week, 1, 8, 30),
      "Ana Torres",
      "+593990000003",
      "scheduled",
    ),
    apt(
      "apt-004",
      "res-001",
      atWeekDay(week, 2, 11, 0),
      atWeekDay(week, 2, 11, 30),
      "Luis Pérez",
      "+593990000004",
      "scheduled",
    ),
    apt(
      "apt-005",
      "res-001",
      atWeekDay(week, 3, 15, 0),
      atWeekDay(week, 3, 15, 30),
      "Elena Gómez",
      "+593990000005",
      "cancelled",
    ),
    apt(
      "apt-006",
      "res-001b",
      atWeekDay(week, 1, 10, 0),
      atWeekDay(week, 1, 10, 30),
      "Pedro Vega",
      "+593990000006",
      "scheduled",
    ),
    apt(
      "apt-007",
      "res-001",
      atWeekDay(week, 4, 9, 30),
      atWeekDay(week, 4, 10, 0),
      "Sofía Mena",
      "+593990000007",
      "scheduled",
    ),
    apt(
      "apt-008",
      "res-001",
      atWeekDay(week, 5, 12, 0),
      atWeekDay(week, 5, 12, 30),
      "Diego Castro",
      "+593990000008",
      "confirmed",
    ),
  ];
}

function membership(
  id: string,
  clinicId: string,
  status: MembershipStatus,
): Membership {
  return {
    id,
    clinic_id: clinicId,
    status,
    activated_at: status === "active" ? new Date().toISOString() : null,
  };
}

function professional(input: {
  resourceId: string;
  clinicId: string;
  profileId: string | null;
  displayName: string;
  slotMinutes: number;
  landingId: string;
  slug: string;
  headline: string;
  body: string;
  published: boolean;
  dirId: string;
  specialty: string;
  zone: string;
  bio: string;
  publishedMallanet: boolean;
  showDonation?: boolean;
}): DemoProfessional {
  return {
    resource: {
      id: input.resourceId,
      clinic_id: input.clinicId,
      profile_id: input.profileId,
      display_name: input.displayName,
      slot_minutes: input.slotMinutes,
    },
    landing: {
      id: input.landingId,
      resource_id: input.resourceId,
      slug: input.slug,
      headline: input.headline,
      body: input.body,
      cta_label: "Pedir turno",
      show_donation_cta: input.showDonation ?? false,
      donation_url: input.showDonation
        ? "https://mallanet.example/donate"
        : null,
      is_published: input.published,
    },
    directory: {
      id: input.dirId,
      resource_id: input.resourceId,
      specialty: input.specialty,
      zone: input.zone,
      bio_short: input.bio,
      published_to_mallanet: input.publishedMallanet,
    },
  };
}

export function buildSeedDb(now = new Date()): DemoDb {
  const doctor: Profile = {
    id: "profile-doctor-reyes",
    full_name: "Dra. Valentina Reyes",
    role: "doctor",
  };
  const reception: Profile = {
    id: "profile-reception-reyes",
    full_name: "Lucía Recepción",
    role: "reception",
  };
  const admin: Profile = {
    id: "profile-admin-waira",
    full_name: "Admin Waira",
    role: "admin_waira",
  };
  const andinoDoctor: Profile = {
    id: "profile-doctor-andino",
    full_name: "Dr. Andrés Molina",
    role: "doctor",
  };
  const valleDoctor: Profile = {
    id: "profile-doctor-valle",
    full_name: "Dra. Camila Ortiz",
    role: "doctor",
  };

  const clinics: DemoClinic[] = [
    {
      id: "clinic-001",
      name: "Consultorio Dra. Reyes",
      slug: "dra-reyes",
      specialty: "Cardiología",
      city: "Quito",
      country: "Ecuador",
      address: "Av. Demo 123, Quito",
      ownerProfileId: doctor.id,
      members: [
        { profileId: doctor.id, role: "doctor", email: "doctor@example.com" },
        {
          profileId: reception.id,
          role: "reception",
          email: "reception@example.com",
        },
      ],
      professionals: [
        professional({
          resourceId: "res-001",
          clinicId: "clinic-001",
          profileId: doctor.id,
          displayName: "Dra. Valentina Reyes",
          slotMinutes: 30,
          landingId: "landing-001",
          slug: "dra-reyes",
          headline: "Agenda con la Dra. Valentina Reyes",
          body: "Consultorio de demostración Waira. Datos ficticios. Cardiología en Quito.",
          published: true,
          dirId: "dir-001",
          specialty: "Cardiología",
          zone: "Quito",
          bio: "Cardiología clínica. Demo Waira sin backend.",
          publishedMallanet: true,
          showDonation: true,
        }),
        professional({
          resourceId: "res-001b",
          clinicId: "clinic-001",
          profileId: null,
          displayName: "Dra. Reyes — controles",
          slotMinutes: 30,
          landingId: "landing-001b",
          slug: "dra-reyes-controles",
          headline: "Controles cardiológicos",
          body: "Agenda de controles. Segundo profesional del consultorio demo.",
          published: true,
          dirId: "dir-001b",
          specialty: "Cardiología",
          zone: "Quito",
          bio: "Controles y seguimiento.",
          publishedMallanet: true,
        }),
      ],
      membership: membership("mem-001", "clinic-001", "active"),
    },
    {
      id: "clinic-002",
      name: "Centro Médico Andino",
      slug: "centro-andino",
      specialty: "Medicina General",
      city: "Guayaquil",
      country: "Ecuador",
      address: "Av. Demo 456, Guayaquil",
      ownerProfileId: andinoDoctor.id,
      members: [
        {
          profileId: andinoDoctor.id,
          role: "doctor",
          email: "andino@example.com",
        },
      ],
      professionals: [
        professional({
          resourceId: "res-002",
          clinicId: "clinic-002",
          profileId: andinoDoctor.id,
          displayName: "Dr. Andrés Molina",
          slotMinutes: 30,
          landingId: "landing-002",
          slug: "centro-andino",
          headline: "Centro Médico Andino",
          body: "Consultorio de demostración Waira. Datos ficticios.",
          published: true,
          dirId: "dir-002",
          specialty: "Medicina General",
          zone: "Guayaquil",
          bio: "Medicina general — demo.",
          publishedMallanet: true,
        }),
      ],
      membership: membership("mem-002", "clinic-002", "active"),
    },
    {
      id: "clinic-003",
      name: "Clínica del Valle",
      slug: "clinica-valle",
      specialty: "Dermatología",
      city: "Cuenca",
      country: "Ecuador",
      address: "Av. Demo 789, Cuenca",
      ownerProfileId: valleDoctor.id,
      members: [
        {
          profileId: valleDoctor.id,
          role: "doctor",
          email: "valle@example.com",
        },
      ],
      professionals: [
        professional({
          resourceId: "res-003",
          clinicId: "clinic-003",
          profileId: valleDoctor.id,
          displayName: "Dra. Camila Ortiz",
          slotMinutes: 45,
          landingId: "landing-003",
          slug: "clinica-valle",
          headline: "Clínica del Valle",
          body: "Landing no publicada (membresía pausada).",
          published: false,
          dirId: "dir-003",
          specialty: "Dermatología",
          zone: "Cuenca",
          bio: "Dermatología — demo pausada.",
          publishedMallanet: false,
        }),
      ],
      membership: membership("mem-003", "clinic-003", "paused"),
    },
  ];

  return {
    version: 2,
    profiles: [doctor, reception, admin, andinoDoctor, valleDoctor],
    clinics,
    appointments: buildSeedAppointments(now),
  };
}

export function findProfessionalBySlug(db: DemoDb, slug: string) {
  for (const clinic of db.clinics) {
    const pro = clinic.professionals.find((p) => p.landing.slug === slug);
    if (pro) return { clinic, pro };
  }
  return null;
}

export function findProfessionalByResource(db: DemoDb, resourceId: string) {
  for (const clinic of db.clinics) {
    const pro = clinic.professionals.find((p) => p.resource.id === resourceId);
    if (pro) return { clinic, pro };
  }
  return null;
}

export function sessionForEmail(email: string): DemoSession {
  const normalized = email.trim().toLowerCase();
  if (normalized === "admin@example.com" || normalized.startsWith("admin@")) {
    return {
      email: normalized,
      role: "admin_waira",
      profileId: "profile-admin-waira",
      clinicId: "",
      jwt: "mock-jwt-admin_waira",
    };
  }
  if (
    normalized === "reception@example.com" ||
    normalized.startsWith("reception@")
  ) {
    return {
      email: normalized,
      role: "reception",
      profileId: "profile-reception-reyes",
      clinicId: "clinic-001",
      jwt: "mock-jwt-reception",
    };
  }
  if (
    normalized === "doctor@example.com" ||
    normalized.includes("reyes") ||
    normalized === "patient.demo@waira.test"
  ) {
    return {
      email:
        normalized === "patient.demo@waira.test"
          ? "doctor@example.com"
          : normalized,
      role: "doctor",
      profileId: "profile-doctor-reyes",
      clinicId: "clinic-001",
      jwt: "mock-jwt-doctor",
    };
  }
  return {
    email: normalized || "demo@waira.test",
    role: "doctor",
    profileId: "profile-doctor-reyes",
    clinicId: "clinic-001",
    jwt: "mock-jwt-doctor",
  };
}

export function bookingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "WRA-";
  for (let i = 0; i < 4; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
