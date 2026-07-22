import { revalidatePath } from "next/cache";
import {
  buildDaySlots,
  filterAvailableSlots,
} from "@/lib/slots";
import {
  OVERLAP_MESSAGE,
  type Appointment,
  type ClinicMember,
  type DirectoryListing,
  type MembershipStatus,
  type TimeSlot,
} from "@/lib/types";
import type { ClinicContext } from "@/lib/types";
import { MAX_RESOURCES_PER_CLINIC } from "@/lib/clinic-limits";
import {
  bookingCode,
  findProfessionalByResource,
  findProfessionalBySlug,
} from "@/lib/mock/seed";
import { readDemoSession } from "@/lib/mock/session";
import { readDemoDb, writeDemoDb } from "@/lib/mock/store";
import { notifyEmail } from "@/lib/notify";

export type DemoActionResult =
  | { ok: true; id?: string; code?: string }
  | { ok: false; error: string };

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && aEnd > bStart;
}

function membershipBlocked(): DemoActionResult {
  return {
    ok: false,
    error: "Tu membresía está pausada. Pedile al admin que la reactive.",
  };
}

function requireActive(ctx: ClinicContext | null): DemoActionResult | null {
  if (!ctx?.resource.id) return { ok: false, error: "Sesión no válida." };
  if (ctx.membership?.status !== "active") return membershipBlocked();
  return null;
}

export async function getDemoClinicContext(
  preferredResourceId?: string,
): Promise<ClinicContext | null> {
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
      clinicName: "",
      resources: [],
      resource: {
        id: "",
        clinic_id: "",
        profile_id: profile.id,
        display_name: profile.full_name ?? "Admin",
      },
      membership: null,
      landing: null,
      directory: null,
      members: [],
    };
  }

  const clinic =
    db.clinics.find((c) => c.id === session.clinicId) ??
    db.clinics.find((c) =>
      c.members.some((m) => m.profileId === profile.id),
    ) ??
    db.clinics.find((c) => c.ownerProfileId === profile.id) ??
    db.clinics[0];
  if (!clinic) return null;

  const resources = clinic.professionals.map((p) => ({
    id: p.resource.id,
    clinic_id: p.resource.clinic_id,
    profile_id: p.resource.profile_id,
    display_name: p.resource.display_name,
  }));

  const selected =
    resources.find((r) => r.id === preferredResourceId) ?? resources[0];
  if (!selected) return null;

  const pro = clinic.professionals.find((p) => p.resource.id === selected.id);
  if (!pro) return null;

  const members: ClinicMember[] = clinic.members.map((m) => {
    const p = db.profiles.find((x) => x.id === m.profileId);
    return {
      profileId: m.profileId,
      fullName: p?.full_name ?? null,
      role: m.role,
      email: m.email,
    };
  });

  return {
    profile,
    clinicId: clinic.id,
    clinicName: clinic.name,
    resources,
    resource: selected,
    membership: clinic.membership,
    landing: pro.landing,
    directory: pro.directory,
    members,
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

export async function listDemoDirectory(): Promise<DirectoryListing[]> {
  const db = await readDemoDb();
  const out: DirectoryListing[] = [];
  for (const clinic of db.clinics) {
    for (const pro of clinic.professionals) {
      if (!pro.directory.published_to_mallanet) continue;
      out.push({
        resourceId: pro.resource.id,
        displayName: pro.resource.display_name,
        specialty: pro.directory.specialty,
        zone: pro.directory.zone,
        bioShort: pro.directory.bio_short,
        slug: pro.landing.is_published ? pro.landing.slug : null,
        clinicName: clinic.name,
      });
    }
  }
  return out;
}

export async function demoCreateAppointment(input: {
  startsAt: string;
  endsAt: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  notes?: string;
  resourceId?: string;
}): Promise<DemoActionResult> {
  const ctx = await getDemoClinicContext(input.resourceId);
  const blocked = requireActive(ctx);
  if (blocked || !ctx) return blocked ?? { ok: false, error: "Sesión no válida." };

  const resourceId = input.resourceId ?? ctx.resource.id;
  if (!ctx.resources.some((r) => r.id === resourceId)) {
    return { ok: false, error: "Profesional no válido." };
  }

  const db = await readDemoDb();
  const overlap = db.appointments.some(
    (a) =>
      a.resource_id === resourceId &&
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
    resource_id: resourceId,
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
  await notifyEmail({
    to: input.patientEmail,
    subject: "Turno agendado · Waira",
    text: `Hola ${input.patientName}, tu turno quedó agendado para ${input.startsAt}.`,
  });
  revalidatePath("/calendar");
  return { ok: true, id };
}

export async function demoCancelAppointment(
  appointmentId: string,
): Promise<DemoActionResult> {
  const ctx = await getDemoClinicContext();
  const blocked = requireActive(ctx);
  if (blocked || !ctx) return blocked ?? { ok: false, error: "Sesión no válida." };

  const db = await readDemoDb();
  const idx = db.appointments.findIndex(
    (a) =>
      a.id === appointmentId &&
      ctx.resources.some((r) => r.id === a.resource_id),
  );
  if (idx < 0) return { ok: false, error: "Turno no encontrado." };
  const apt = db.appointments[idx];
  db.appointments[idx] = { ...apt, status: "cancelled" };
  await writeDemoDb(db);
  await notifyEmail({
    to: apt.patients_min?.email,
    subject: "Turno cancelado · Waira",
    text: `Hola ${apt.patients_min?.full_name ?? ""}, tu turno fue cancelado.`,
  });
  revalidatePath("/calendar");
  return { ok: true };
}

export async function demoConfirmAppointment(
  appointmentId: string,
): Promise<DemoActionResult> {
  const ctx = await getDemoClinicContext();
  const blocked = requireActive(ctx);
  if (blocked || !ctx) return blocked ?? { ok: false, error: "Sesión no válida." };

  const db = await readDemoDb();
  const idx = db.appointments.findIndex(
    (a) =>
      a.id === appointmentId &&
      ctx.resources.some((r) => r.id === a.resource_id) &&
      a.status !== "cancelled",
  );
  if (idx < 0) return { ok: false, error: "Turno no encontrado." };
  const apt = db.appointments[idx];
  db.appointments[idx] = { ...apt, status: "confirmed" };
  await writeDemoDb(db);
  await notifyEmail({
    to: apt.patients_min?.email,
    subject: "Turno confirmado · Waira",
    text: `Hola ${apt.patients_min?.full_name ?? ""}, tu turno quedó confirmado para ${apt.starts_at}.`,
  });
  revalidatePath("/calendar");
  return { ok: true };
}

export async function demoMoveAppointment(input: {
  appointmentId: string;
  startsAt: string;
  endsAt: string;
}): Promise<DemoActionResult> {
  const ctx = await getDemoClinicContext();
  const blocked = requireActive(ctx);
  if (blocked || !ctx) return blocked ?? { ok: false, error: "Sesión no válida." };

  const db = await readDemoDb();
  const current = db.appointments.find(
    (a) =>
      a.id === input.appointmentId &&
      ctx.resources.some((r) => r.id === a.resource_id),
  );
  if (!current) return { ok: false, error: "Turno no encontrado." };

  const overlap = db.appointments.some(
    (a) =>
      a.id !== input.appointmentId &&
      a.resource_id === current.resource_id &&
      a.status !== "cancelled" &&
      rangesOverlap(a.starts_at, a.ends_at, input.startsAt, input.endsAt),
  );
  if (overlap) return { ok: false, error: OVERLAP_MESSAGE };
  const idx = db.appointments.findIndex((a) => a.id === input.appointmentId);
  db.appointments[idx] = {
    ...db.appointments[idx],
    starts_at: input.startsAt,
    ends_at: input.endsAt,
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
  const found = findProfessionalBySlug(db, input.slug);
  if (!found?.pro.landing.is_published) {
    return { ok: false, error: "Esa landing no está disponible." };
  }
  if (found.clinic.membership.status !== "active") {
    return { ok: false, error: "La membresía Waira no está activa." };
  }

  const resourceId = found.pro.resource.id;
  const overlap = db.appointments.some(
    (a) =>
      a.resource_id === resourceId &&
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
    resource_id: resourceId,
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
  await notifyEmail({
    to: input.patientEmail,
    subject: "Turno reservado · Waira",
    text: `Hola ${input.patientName}, tu turno quedó reservado (${code}).`,
  });
  return { ok: true, id, code };
}

export async function demoListAvailableSlots(input: {
  slug: string;
  date: string;
}): Promise<{ ok: true; slots: TimeSlot[] } | { ok: false; error: string }> {
  const db = await readDemoDb();
  const found = findProfessionalBySlug(db, input.slug);
  if (!found?.pro.landing.is_published) {
    return { ok: false, error: "Esa landing no está disponible." };
  }

  const day = new Date(`${input.date}T12:00:00`);
  const slots = buildDaySlots(day);
  if (slots.length === 0) return { ok: true, slots: [] };

  const busy = db.appointments
    .filter(
      (a) =>
        a.resource_id === found.pro.resource.id && a.status !== "cancelled",
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
  if (ctx.profile.role === "reception") {
    return { ok: false, error: "Solo el médico puede editar el perfil." };
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
  const pro = clinic.professionals.find(
    (p) => p.resource.id === ctx.resource.id,
  );
  if (!pro) return { ok: false, error: "Profesional no encontrado." };

  for (const c of db.clinics) {
    for (const p of c.professionals) {
      if (
        p.landing.slug === input.slug &&
        p.resource.id !== pro.resource.id
      ) {
        return { ok: false, error: "Ese slug ya está en uso." };
      }
    }
  }

  const profile = db.profiles.find((p) => p.id === ctx.profile.id);
  if (profile && pro.resource.profile_id === profile.id) {
    profile.full_name = input.fullName;
  }

  pro.resource.display_name = input.fullName;
  pro.directory = {
    ...pro.directory,
    specialty: input.specialty,
    zone: input.zone,
    bio_short: input.bioShort,
    published_to_mallanet: input.publishMallanet,
  };
  pro.landing = {
    ...pro.landing,
    slug: input.slug,
    headline: input.headline,
    body: input.body,
    is_published: input.publishLanding,
    show_donation_cta: input.showDonationCta,
  };

  await writeDemoDb(db);
  revalidatePath("/onboarding");
  revalidatePath("/directorio");
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

export async function demoAddProfessional(input: {
  displayName: string;
}): Promise<DemoActionResult> {
  const ctx = await getDemoClinicContext();
  if (!ctx?.clinicId) return { ok: false, error: "Sesión no válida." };
  if (ctx.profile.role === "reception") {
    return { ok: false, error: "Solo el médico puede agregar profesionales." };
  }
  if (ctx.membership?.status !== "active") return membershipBlocked();

  const db = await readDemoDb();
  const clinic = db.clinics.find((c) => c.id === ctx.clinicId);
  if (!clinic) return { ok: false, error: "Clínica no encontrada." };
  if (clinic.professionals.length >= MAX_RESOURCES_PER_CLINIC) {
    return {
      ok: false,
      error: `Máximo ${MAX_RESOURCES_PER_CLINIC} profesionales por consultorio.`,
    };
  }

  const name = input.displayName.trim();
  if (!name) return { ok: false, error: "Nombre requerido." };

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `res-${Date.now()}`;
  const slugBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${slugBase}-${id.slice(0, 8)}`;

  clinic.professionals.push({
    resource: {
      id,
      clinic_id: clinic.id,
      profile_id: null,
      display_name: name,
      slot_minutes: 30,
    },
    landing: {
      id: `landing-${id}`,
      resource_id: id,
      slug,
      headline: `Agenda con ${name}`,
      body: "Pedí tu turno desde esta página.",
      cta_label: "Pedir turno",
      show_donation_cta: false,
      donation_url: null,
      is_published: false,
    },
    directory: {
      id: `dir-${id}`,
      resource_id: id,
      specialty: clinic.specialty,
      zone: clinic.city,
      bio_short: "",
      published_to_mallanet: false,
    },
  });
  await writeDemoDb(db);
  revalidatePath("/team");
  revalidatePath("/calendar");
  return { ok: true, id };
}

export async function demoInviteReception(input: {
  fullName: string;
  email: string;
}): Promise<DemoActionResult> {
  const ctx = await getDemoClinicContext();
  if (!ctx?.clinicId) return { ok: false, error: "Sesión no válida." };
  if (ctx.profile.role !== "doctor") {
    return { ok: false, error: "Solo el médico puede invitar recepción." };
  }
  if (ctx.membership?.status !== "active") return membershipBlocked();

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  if (!email.includes("@") || !fullName) {
    return { ok: false, error: "Nombre y email válidos requeridos." };
  }

  const db = await readDemoDb();
  const clinic = db.clinics.find((c) => c.id === ctx.clinicId);
  if (!clinic) return { ok: false, error: "Clínica no encontrada." };

  if (clinic.members.some((m) => m.email === email)) {
    return { ok: false, error: "Ese email ya está en el equipo." };
  }

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `profile-${Date.now()}`;

  db.profiles.push({ id, full_name: fullName, role: "reception" });
  clinic.members.push({ profileId: id, role: "reception", email });
  await writeDemoDb(db);
  revalidatePath("/team");
  return { ok: true, id };
}

export async function getDemoLandingBySlug(slug: string) {
  const db = await readDemoDb();
  const found = findProfessionalBySlug(db, slug);
  if (!found || !found.pro.landing.is_published) return null;
  const owner = db.profiles.find((p) => p.id === found.clinic.ownerProfileId);
  return {
    landing: found.pro.landing,
    resource: found.pro.resource,
    directory: found.pro.directory,
    membership: found.clinic.membership,
    clinicName: found.clinic.name,
    doctorName: found.pro.resource.display_name || owner?.full_name || found.clinic.name,
  };
}

export async function getDemoResourceLabel(resourceId: string) {
  const db = await readDemoDb();
  return findProfessionalByResource(db, resourceId)?.pro.resource.display_name;
}
