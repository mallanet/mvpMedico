import { revalidatePath } from "next/cache";
import {
  buildDaySlots,
  filterAvailableSlots,
} from "@/lib/slots";
import {
  OVERLAP_MESSAGE,
  type Appointment,
  type MembershipStatus,
  type TimeSlot,
} from "@/lib/types";
import type { ClinicContext } from "@/lib/types";
import { bookingCode } from "@/lib/mock/seed";
import { readDemoSession } from "@/lib/mock/session";
import { readDemoDb, writeDemoDb } from "@/lib/mock/store";

export type DemoActionResult =
  | { ok: true; id?: string; code?: string }
  | { ok: false; error: string };

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && aEnd > bStart;
}

export async function getDemoClinicContext(): Promise<ClinicContext | null> {
  const session = await readDemoSession();
  if (!session) return null;
  const db = await readDemoDb();
  const profile =
    db.profiles.find((p) => p.id === session.profileId) ??
    db.profiles.find((p) => p.role === session.role);
  if (!profile) return null;

  if (profile.role === "admin_waira") {
    return {
      profile: { ...profile, role: "admin_waira" },
      clinicId: "",
      resource: {
        id: "",
        clinic_id: "",
        profile_id: profile.id,
        display_name: profile.full_name ?? "Admin",
      },
      membership: null,
      landing: null,
      directory: null,
    };
  }

  const clinic =
    db.clinics.find((c) => c.id === session.clinicId) ??
    db.clinics.find((c) => c.ownerProfileId === profile.id) ??
    db.clinics[0];
  if (!clinic) return null;

  return {
    profile,
    clinicId: clinic.id,
    resource: clinic.resource,
    membership: clinic.membership,
    landing: clinic.landing,
    directory: clinic.directory,
  };
}

export async function listDemoAppointmentsForResource(
  resourceId: string,
): Promise<Appointment[]> {
  const db = await readDemoDb();
  return db.appointments
    .filter((a) => a.resource_id === resourceId)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

export async function listDemoMemberships() {
  const db = await readDemoDb();
  return db.clinics.map((c) => ({
    id: c.membership.id,
    clinic_id: c.id,
    status: c.membership.status,
    activated_at: c.membership.activated_at,
    clinics: { name: c.name },
  }));
}

export async function demoCreateAppointment(input: {
  startsAt: string;
  endsAt: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  notes?: string;
}): Promise<DemoActionResult> {
  const ctx = await getDemoClinicContext();
  if (!ctx?.resource.id) return { ok: false, error: "Sesión no válida." };
  if (ctx.membership?.status !== "active") {
    return {
      ok: false,
      error: "Tu membresía está pausada. Pedile al admin que la reactive.",
    };
  }

  const db = await readDemoDb();
  const overlap = db.appointments.some(
    (a) =>
      a.resource_id === ctx.resource.id &&
      a.status !== "cancelled" &&
      rangesOverlap(a.starts_at, a.ends_at, input.startsAt, input.endsAt),
  );
  if (overlap) return { ok: false, error: OVERLAP_MESSAGE };

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `apt-${Date.now()}`;
  const appointment: Appointment = {
    id,
    resource_id: ctx.resource.id,
    patient_id: `patient-${id}`,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    status: "scheduled",
    notes: input.notes ?? null,
    patients_min: {
      id: `patient-${id}`,
      full_name: input.patientName,
      phone: input.patientPhone,
      email: input.patientEmail ?? null,
    },
  };
  db.appointments.push(appointment);
  await writeDemoDb(db);
  revalidatePath("/calendar");
  return { ok: true, id };
}

export async function demoCancelAppointment(
  appointmentId: string,
): Promise<DemoActionResult> {
  const ctx = await getDemoClinicContext();
  if (!ctx?.resource.id) return { ok: false, error: "Sesión no válida." };
  if (ctx.membership?.status !== "active") {
    return {
      ok: false,
      error: "Tu membresía está pausada. Pedile al admin que la reactive.",
    };
  }
  const db = await readDemoDb();
  const idx = db.appointments.findIndex(
    (a) => a.id === appointmentId && a.resource_id === ctx.resource.id,
  );
  if (idx < 0) return { ok: false, error: "Turno no encontrado." };
  db.appointments[idx] = { ...db.appointments[idx], status: "cancelled" };
  await writeDemoDb(db);
  revalidatePath("/calendar");
  return { ok: true };
}

export async function demoMoveAppointment(input: {
  appointmentId: string;
  startsAt: string;
  endsAt: string;
}): Promise<DemoActionResult> {
  const ctx = await getDemoClinicContext();
  if (!ctx?.resource.id) return { ok: false, error: "Sesión no válida." };
  if (ctx.membership?.status !== "active") {
    return {
      ok: false,
      error: "Tu membresía está pausada. Pedile al admin que la reactive.",
    };
  }
  const db = await readDemoDb();
  const overlap = db.appointments.some(
    (a) =>
      a.id !== input.appointmentId &&
      a.resource_id === ctx.resource.id &&
      a.status !== "cancelled" &&
      rangesOverlap(a.starts_at, a.ends_at, input.startsAt, input.endsAt),
  );
  if (overlap) return { ok: false, error: OVERLAP_MESSAGE };
  const idx = db.appointments.findIndex(
    (a) => a.id === input.appointmentId && a.resource_id === ctx.resource.id,
  );
  if (idx < 0) return { ok: false, error: "Turno no encontrado." };
  db.appointments[idx] = {
    ...db.appointments[idx],
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    status: "scheduled",
  };
  await writeDemoDb(db);
  revalidatePath("/calendar");
  return { ok: true };
}

export async function demoBookFromLanding(input: {
  slug: string;
  startsAt: string;
  endsAt: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  notes?: string;
}): Promise<DemoActionResult> {
  const db = await readDemoDb();
  const clinic = db.clinics.find((c) => c.landing.slug === input.slug);
  if (!clinic?.landing.is_published) {
    return { ok: false, error: "Esa landing no está disponible." };
  }
  if (clinic.membership.status !== "active") {
    return { ok: false, error: "La membresía Waira no está activa." };
  }

  const overlap = db.appointments.some(
    (a) =>
      a.resource_id === clinic.resource.id &&
      a.status !== "cancelled" &&
      rangesOverlap(a.starts_at, a.ends_at, input.startsAt, input.endsAt),
  );
  if (overlap) {
    return {
      ok: false,
      error: "Ese horario ya fue tomado. Elegí otro intervalo.",
    };
  }

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `apt-${Date.now()}`;
  const code = bookingCode();
  db.appointments.push({
    id,
    resource_id: clinic.resource.id,
    patient_id: `patient-${id}`,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    status: "scheduled",
    notes: input.notes ? `${input.notes} · ${code}` : code,
    patients_min: {
      id: `patient-${id}`,
      full_name: input.patientName,
      phone: input.patientPhone,
      email: input.patientEmail ?? null,
    },
  });
  await writeDemoDb(db);
  return { ok: true, id, code };
}

export async function demoListAvailableSlots(input: {
  slug: string;
  date: string;
}): Promise<{ ok: true; slots: TimeSlot[] } | { ok: false; error: string }> {
  const db = await readDemoDb();
  const clinic = db.clinics.find(
    (c) => c.landing.slug === input.slug && c.landing.is_published,
  );
  if (!clinic) return { ok: false, error: "Esa landing no está disponible." };

  const day = new Date(`${input.date}T12:00:00`);
  const slots = buildDaySlots(day);
  if (slots.length === 0) return { ok: true, slots: [] };

  const busy = db.appointments
    .filter(
      (a) => a.resource_id === clinic.resource.id && a.status !== "cancelled",
    )
    .map((a) => ({ starts_at: a.starts_at, ends_at: a.ends_at }));

  return { ok: true, slots: filterAvailableSlots(slots, busy) };
}

export async function demoUpdateOnboarding(input: {
  fullName: string;
  specialty: string;
  zone: string;
  bioShort: string;
  headline: string;
  body: string;
  slug: string;
  publishLanding: boolean;
  publishMallanet: boolean;
  showDonationCta: boolean;
}): Promise<DemoActionResult> {
  const ctx = await getDemoClinicContext();
  if (!ctx?.resource.id || !ctx.landing || !ctx.directory) {
    return { ok: false, error: "Sesión no válida." };
  }
  if (
    (input.publishLanding || input.publishMallanet) &&
    ctx.membership?.status !== "active"
  ) {
    return {
      ok: false,
      error: "Para publicar la landing o Mallanet necesitás membresía Waira activa.",
    };
  }

  const db = await readDemoDb();
  const clinic = db.clinics.find((c) => c.id === ctx.clinicId);
  if (!clinic) return { ok: false, error: "Clínica no encontrada." };

  if (
    db.clinics.some(
      (c) => c.id !== clinic.id && c.landing.slug === input.slug,
    )
  ) {
    return { ok: false, error: "Ese slug ya está en uso." };
  }

  const profile = db.profiles.find((p) => p.id === ctx.profile.id);
  if (profile) profile.full_name = input.fullName;

  clinic.resource.display_name = input.fullName;
  clinic.directory = {
    ...clinic.directory,
    specialty: input.specialty,
    zone: input.zone,
    bio_short: input.bioShort,
    published_to_mallanet: input.publishMallanet,
  };
  clinic.landing = {
    ...clinic.landing,
    slug: input.slug,
    headline: input.headline,
    body: input.body,
    is_published: input.publishLanding,
    show_donation_cta: input.showDonationCta,
  };
  clinic.specialty = input.specialty;
  clinic.slug = input.slug;

  await writeDemoDb(db);
  revalidatePath("/onboarding");
  revalidatePath(`/l/${input.slug}`);
  return { ok: true };
}

export async function demoSetMembershipStatus(
  clinicId: string,
  status: MembershipStatus,
): Promise<DemoActionResult> {
  const ctx = await getDemoClinicContext();
  if (!ctx || ctx.profile.role !== "admin_waira") {
    return { ok: false, error: "Solo Admin Waira puede cambiar membresías." };
  }
  const db = await readDemoDb();
  const clinic = db.clinics.find((c) => c.id === clinicId);
  if (!clinic) return { ok: false, error: "Clínica no encontrada." };
  clinic.membership = {
    ...clinic.membership,
    status,
    activated_at: status === "active" ? new Date().toISOString() : null,
  };
  await writeDemoDb(db);
  revalidatePath("/admin/memberships");
  return { ok: true };
}

export async function getDemoLandingBySlug(slug: string) {
  const db = await readDemoDb();
  const clinic = db.clinics.find((c) => c.landing.slug === slug);
  if (!clinic || !clinic.landing.is_published) return null;
  const owner = db.profiles.find((p) => p.id === clinic.ownerProfileId);
  return {
    landing: clinic.landing,
    resource: clinic.resource,
    directory: clinic.directory,
    membership: clinic.membership,
    clinicName: clinic.name,
    doctorName: owner?.full_name ?? clinic.name,
  };
}
