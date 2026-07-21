import type {
  Appointment,
  AppointmentStatus,
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

export type DemoClinic = {
  id: string;
  name: string;
  slug: string;
  specialty: string;
  city: string;
  country: string;
  address: string;
  resource: Resource & { slot_minutes: number };
  landing: Landing;
  directory: DirectoryProfile;
  membership: Membership;
  ownerProfileId: string;
};

export type DemoDb = {
  version: 1;
  profiles: Profile[];
  clinics: DemoClinic[];
  appointments: Appointment[];
};

function startOfWeekMonday(from = new Date()): Date {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay(); // 0 Sun … 6 Sat
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
      email: null,
    },
  };
}

/** 8 seed appointments relative to current week (Mon–Sat). */
export function buildSeedAppointments(now = new Date()): Appointment[] {
  const week = startOfWeekMonday(now);
  // Mon=0 … Sat=5 relative to week start
  return [
    apt(
      "apt-001",
      "res-001",
      atWeekDay(week, 0, 9, 0),
      atWeekDay(week, 0, 9, 30),
      "María López",
      "+593990000001",
      "scheduled",
    ),
    apt(
      "apt-002",
      "res-001",
      atWeekDay(week, 0, 10, 30),
      atWeekDay(week, 0, 11, 0),
      "Carlos Ruiz",
      "+593990000002",
      "scheduled",
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
      atWeekDay(week, 1, 14, 0),
      atWeekDay(week, 1, 14, 30),
      "Pedro Gómez",
      "+593990000004",
      "scheduled",
    ),
    apt(
      "apt-005",
      "res-002",
      atWeekDay(week, 0, 11, 0),
      atWeekDay(week, 0, 11, 30),
      "Lucía Fernández",
      "+593990000005",
      "scheduled",
    ),
    apt(
      "apt-006",
      "res-002",
      atWeekDay(week, 2, 16, 0),
      atWeekDay(week, 2, 16, 30),
      "Jorge Mendoza",
      "+593990000006",
      "cancelled",
    ),
    apt(
      "apt-007",
      "res-001",
      atWeekDay(week, 3, 9, 30),
      atWeekDay(week, 3, 10, 0),
      "Sofía Vargas",
      "+593990000007",
      "scheduled",
    ),
    apt(
      "apt-008",
      "res-003",
      atWeekDay(week, 0, 10, 0),
      atWeekDay(week, 0, 10, 45),
      "Diego Herrera",
      "+593990000008",
      "scheduled",
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

export function buildSeedDb(now = new Date()): DemoDb {
  const doctor: Profile = {
    id: "profile-doctor-reyes",
    full_name: "Dra. Valentina Reyes",
    role: "doctor",
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
      resource: {
        id: "res-001",
        clinic_id: "clinic-001",
        profile_id: doctor.id,
        display_name: "Consultorio 1",
        slot_minutes: 30,
      },
      landing: {
        id: "landing-001",
        resource_id: "res-001",
        slug: "dra-reyes",
        headline: "Agenda con la Dra. Valentina Reyes",
        body: "Consultorio de demostración Waira. Datos ficticios. Cardiología en Quito.",
        cta_label: "Pedir turno",
        show_donation_cta: true,
        donation_url: "https://mallanet.example/donate",
        is_published: true,
      },
      directory: {
        id: "dir-001",
        resource_id: "res-001",
        specialty: "Cardiología",
        zone: "Quito",
        bio_short: "Cardiología clínica. Demo Waira sin backend.",
        published_to_mallanet: true,
      },
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
      resource: {
        id: "res-002",
        clinic_id: "clinic-002",
        profile_id: andinoDoctor.id,
        display_name: "Box A",
        slot_minutes: 30,
      },
      landing: {
        id: "landing-002",
        resource_id: "res-002",
        slug: "centro-andino",
        headline: "Centro Médico Andino",
        body: "Consultorio de demostración Waira. Datos ficticios.",
        cta_label: "Pedir turno",
        show_donation_cta: false,
        donation_url: null,
        is_published: true,
      },
      directory: {
        id: "dir-002",
        resource_id: "res-002",
        specialty: "Medicina General",
        zone: "Guayaquil",
        bio_short: "Medicina general — demo.",
        published_to_mallanet: true,
      },
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
      resource: {
        id: "res-003",
        clinic_id: "clinic-003",
        profile_id: valleDoctor.id,
        display_name: "Sala 2",
        slot_minutes: 45,
      },
      landing: {
        id: "landing-003",
        resource_id: "res-003",
        slug: "clinica-valle",
        headline: "Clínica del Valle",
        body: "Landing no publicada (membresía pausada).",
        cta_label: "Pedir turno",
        show_donation_cta: false,
        donation_url: null,
        is_published: false,
      },
      directory: {
        id: "dir-003",
        resource_id: "res-003",
        specialty: "Dermatología",
        zone: "Cuenca",
        bio_short: "Dermatología — demo pausada.",
        published_to_mallanet: false,
      },
      membership: membership("mem-003", "clinic-003", "paused"),
    },
  ];

  return {
    version: 1,
    profiles: [doctor, admin, andinoDoctor, valleDoctor],
    clinics,
    appointments: buildSeedAppointments(now),
  };
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
    normalized === "doctor@example.com" ||
    normalized.includes("reyes") ||
    normalized === "patient.demo@waira.test"
  ) {
    return {
      email: normalized === "patient.demo@waira.test" ? "doctor@example.com" : normalized,
      role: "doctor",
      profileId: "profile-doctor-reyes",
      clinicId: "clinic-001",
      jwt: "mock-jwt-doctor",
    };
  }
  // Generic signup / any credential → doctor on clinic-001
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
