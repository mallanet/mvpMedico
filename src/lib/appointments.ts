"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  getClinicContext,
  hasActiveMembership,
  isClinicDoctor,
} from "@/lib/clinic-context";
import { MAX_RESOURCES_PER_CLINIC, RESOURCE_COOKIE } from "@/lib/clinic-limits";
import {
  buildDaySlots,
  filterAvailableSlots,
} from "@/lib/slots";
import { notifyEmail } from "@/lib/notify";
import { OVERLAP_MESSAGE, type MembershipStatus, type TimeSlot } from "@/lib/types";
import { isDemoMode } from "@/lib/mock/mode";
import {
  demoAddProfessional,
  demoBookFromLanding,
  demoCancelAppointment,
  demoConfirmAppointment,
  demoCreateAppointment,
  demoInviteReception,
  demoListAvailableSlots,
  demoMoveAppointment,
  demoSetMembershipStatus,
  demoUpdateOnboarding,
  listDemoDirectory,
} from "@/lib/mock/appointments";
import type { DirectoryListing } from "@/lib/types";

export type ActionResult = { ok: true; id?: string; code?: string } | { ok: false; error: string };

function isExclusionViolation(error: PostgrestError): boolean {
  return (
    error.code === "23P01" ||
    error.message.includes("appointments_no_overlap") ||
    error.message.includes("exclusion constraint") ||
    error.message.toLowerCase().includes("overlap")
  );
}

function membershipBlocked(): ActionResult {
  return {
    ok: false,
    error: "Tu membresía está pausada. Pedile al admin que la reactive.",
  };
}

async function patientEmailForAppointment(
  appointmentId: string,
  resourceIds: string[],
): Promise<{ email: string | null; name: string; startsAt: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("starts_at, resource_id, patients_min(full_name, email)")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!data || !resourceIds.includes(data.resource_id)) return null;
  const patient = Array.isArray(data.patients_min)
    ? data.patients_min[0]
    : data.patients_min;
  return {
    email: patient?.email ?? null,
    name: patient?.full_name ?? "",
    startsAt: data.starts_at,
  };
}

export async function selectResource(resourceId: string): Promise<ActionResult> {
  const ctx = await getClinicContext();
  if (!ctx?.resources.some((r) => r.id === resourceId)) {
    return { ok: false, error: "Profesional no válido." };
  }
  const jar = await cookies();
  jar.set(RESOURCE_COOKIE, resourceId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/calendar");
  revalidatePath("/onboarding");
  revalidatePath("/team");
  return { ok: true };
}

export async function createAppointment(input: {
  startsAt: string;
  endsAt: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  notes?: string;
  resourceId?: string;
}): Promise<ActionResult> {
  if (isDemoMode()) return demoCreateAppointment(input);

  const ctx = await getClinicContext(input.resourceId);
  if (!ctx?.resource.id) return { ok: false, error: "Sesión no válida." };
  if (!hasActiveMembership(ctx)) return membershipBlocked();

  const resourceId = input.resourceId ?? ctx.resource.id;
  if (!ctx.resources.some((r) => r.id === resourceId)) {
    return { ok: false, error: "Profesional no válido." };
  }

  const supabase = await createClient();
  const { data: patient, error: patientError } = await supabase
    .from("patients_min")
    .insert({
      full_name: input.patientName,
      phone: input.patientPhone,
      email: input.patientEmail || null,
    })
    .select("id")
    .single();

  if (patientError || !patient) {
    return { ok: false, error: patientError?.message ?? "No pudimos crear el paciente." };
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      resource_id: resourceId,
      patient_id: patient.id,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: "scheduled",
      notes: input.notes ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (isExclusionViolation(error)) {
      return { ok: false, error: OVERLAP_MESSAGE };
    }
    return { ok: false, error: error.message };
  }

  await notifyEmail({
    to: input.patientEmail,
    subject: "Turno agendado · Waira",
    text: `Hola ${input.patientName}, tu turno quedó agendado para ${input.startsAt}.`,
  });

  revalidatePath("/calendar");
  return { ok: true, id: data.id };
}

export async function cancelAppointment(appointmentId: string): Promise<ActionResult> {
  if (isDemoMode()) return demoCancelAppointment(appointmentId);

  const ctx = await getClinicContext();
  if (!ctx?.resource.id) return { ok: false, error: "Sesión no válida." };
  if (!hasActiveMembership(ctx)) return membershipBlocked();

  const resourceIds = ctx.resources.map((r) => r.id);
  const patient = await patientEmailForAppointment(appointmentId, resourceIds);

  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .in("resource_id", resourceIds);

  if (error) return { ok: false, error: error.message };

  if (patient) {
    await notifyEmail({
      to: patient.email,
      subject: "Turno cancelado · Waira",
      text: `Hola ${patient.name}, tu turno fue cancelado.`,
    });
  }

  revalidatePath("/calendar");
  return { ok: true };
}

export async function confirmAppointment(appointmentId: string): Promise<ActionResult> {
  if (isDemoMode()) return demoConfirmAppointment(appointmentId);

  const ctx = await getClinicContext();
  if (!ctx?.resource.id) return { ok: false, error: "Sesión no válida." };
  if (!hasActiveMembership(ctx)) return membershipBlocked();

  const resourceIds = ctx.resources.map((r) => r.id);
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status: "confirmed" })
    .eq("id", appointmentId)
    .in("resource_id", resourceIds)
    .neq("status", "cancelled");

  if (error) return { ok: false, error: error.message };

  const patient = await patientEmailForAppointment(appointmentId, resourceIds);
  if (patient) {
    await notifyEmail({
      to: patient.email,
      subject: "Turno confirmado · Waira",
      text: `Hola ${patient.name}, tu turno quedó confirmado para ${patient.startsAt}.`,
    });
  }

  revalidatePath("/calendar");
  return { ok: true };
}

export async function moveAppointment(input: {
  appointmentId: string;
  startsAt: string;
  endsAt: string;
}): Promise<ActionResult> {
  if (isDemoMode()) return demoMoveAppointment(input);

  const ctx = await getClinicContext();
  if (!ctx?.resource.id) return { ok: false, error: "Sesión no válida." };
  if (!hasActiveMembership(ctx)) return membershipBlocked();

  const resourceIds = ctx.resources.map((r) => r.id);
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      starts_at: input.startsAt,
      ends_at: input.endsAt,
    })
    .eq("id", input.appointmentId)
    .in("resource_id", resourceIds);

  if (error) {
    if (isExclusionViolation(error)) {
      return { ok: false, error: OVERLAP_MESSAGE };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/calendar");
  return { ok: true };
}

export async function bookFromLanding(input: {
  slug: string;
  startsAt: string;
  endsAt: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  notes?: string;
}): Promise<ActionResult> {
  if (isDemoMode()) return demoBookFromLanding(input);

  const supabase = await createClient();

  const { data: landing, error: landingError } = await supabase
    .from("landings")
    .select("resource_id, is_published")
    .eq("slug", input.slug)
    .maybeSingle();

  if (landingError || !landing?.is_published) {
    return { ok: false, error: "Esa landing no está disponible." };
  }

  const { data: resource } = await supabase
    .from("resources")
    .select("id, clinic_id")
    .eq("id", landing.resource_id)
    .single();

  if (!resource) return { ok: false, error: "No encontramos ese consultorio." };

  const { data: membership } = await supabase
    .from("memberships")
    .select("status")
    .eq("clinic_id", resource.clinic_id)
    .maybeSingle();

  if (membership?.status !== "active") {
    return { ok: false, error: "La membresía Waira no está activa." };
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients_min")
    .insert({
      full_name: input.patientName,
      phone: input.patientPhone,
      email: input.patientEmail || null,
    })
    .select("id")
    .single();

  if (patientError || !patient) {
    return { ok: false, error: patientError?.message ?? "No pudimos crear el paciente." };
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      resource_id: resource.id,
      patient_id: patient.id,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: "scheduled",
      notes: input.notes ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (isExclusionViolation(error)) {
      return { ok: false, error: OVERLAP_MESSAGE };
    }
    return { ok: false, error: error.message };
  }

  await notifyEmail({
    to: input.patientEmail,
    subject: "Turno reservado · Waira",
    text: `Hola ${input.patientName}, tu turno quedó reservado para ${input.startsAt}.`,
  });

  return { ok: true, id: data.id };
}

export async function listAvailableSlots(input: {
  slug: string;
  date: string;
}): Promise<{ ok: true; slots: TimeSlot[] } | { ok: false; error: string }> {
  if (isDemoMode()) return demoListAvailableSlots(input);

  const supabase = await createClient();
  const { data: landing } = await supabase
    .from("landings")
    .select("resource_id, is_published")
    .eq("slug", input.slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!landing) return { ok: false, error: "Esa landing no está disponible." };

  const day = new Date(`${input.date}T12:00:00`);
  const slots = buildDaySlots(day);
  if (slots.length === 0) return { ok: true, slots: [] };

  const dayStart = slots[0].startsAt;
  const dayEnd = slots[slots.length - 1].endsAt;

  const { data: appointments } = await supabase
    .from("appointments")
    .select("starts_at, ends_at")
    .eq("resource_id", landing.resource_id)
    .neq("status", "cancelled")
    .lt("starts_at", dayEnd)
    .gt("ends_at", dayStart);

  return { ok: true, slots: filterAvailableSlots(slots, appointments ?? []) };
}

export async function updateOnboarding(input: {
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
}): Promise<ActionResult> {
  if (isDemoMode()) return demoUpdateOnboarding(input);

  const ctx = await getClinicContext();
  if (!ctx?.resource.id || !ctx.landing || !ctx.directory) {
    return { ok: false, error: "Sesión no válida." };
  }
  if (!isClinicDoctor(ctx)) {
    return { ok: false, error: "Solo el médico puede editar el perfil." };
  }

  if ((input.publishLanding || input.publishMallanet) && !hasActiveMembership(ctx)) {
    return {
      ok: false,
      error: "Para publicar la landing o Mallanet necesitás membresía Waira activa.",
    };
  }

  const supabase = await createClient();

  if (ctx.resource.profile_id === ctx.profile.id) {
    await supabase
      .from("profiles")
      .update({ full_name: input.fullName })
      .eq("id", ctx.profile.id);
  }

  await supabase
    .from("resources")
    .update({ display_name: input.fullName })
    .eq("id", ctx.resource.id);

  const { error: dirError } = await supabase
    .from("directory_profiles")
    .update({
      specialty: input.specialty,
      zone: input.zone,
      bio_short: input.bioShort,
      published_to_mallanet: input.publishMallanet,
    })
    .eq("id", ctx.directory.id);

  if (dirError) return { ok: false, error: dirError.message };

  const { error: landError } = await supabase
    .from("landings")
    .update({
      slug: input.slug,
      headline: input.headline,
      body: input.body,
      is_published: input.publishLanding,
      show_donation_cta: input.showDonationCta,
      donation_url:
        process.env.NEXT_PUBLIC_MALLANET_DONATION_URL ?? ctx.landing.donation_url,
    })
    .eq("id", ctx.landing.id);

  if (landError) {
    if (landError.message.includes("landings_slug_key")) {
      return { ok: false, error: "Ese slug ya está en uso." };
    }
    return { ok: false, error: landError.message };
  }

  revalidatePath("/onboarding");
  revalidatePath("/directorio");
  revalidatePath(`/l/${input.slug}`);
  return { ok: true };
}

export async function addProfessional(input: {
  displayName: string;
}): Promise<ActionResult> {
  if (isDemoMode()) return demoAddProfessional(input);

  const ctx = await getClinicContext();
  if (!ctx?.clinicId) return { ok: false, error: "Sesión no válida." };
  if (!isClinicDoctor(ctx)) {
    return { ok: false, error: "Solo el médico puede agregar profesionales." };
  }
  if (!hasActiveMembership(ctx)) return membershipBlocked();
  if (ctx.resources.length >= MAX_RESOURCES_PER_CLINIC) {
    return {
      ok: false,
      error: `Máximo ${MAX_RESOURCES_PER_CLINIC} profesionales por consultorio.`,
    };
  }

  const name = input.displayName.trim();
  if (!name) return { ok: false, error: "Nombre requerido." };

  const supabase = await createClient();
  const { data: resource, error: resError } = await supabase
    .from("resources")
    .insert({
      clinic_id: ctx.clinicId,
      display_name: name,
      profile_id: null,
    })
    .select("id")
    .single();

  if (resError || !resource) {
    return { ok: false, error: resError?.message ?? "No se pudo crear el profesional." };
  }

  const slugBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${slugBase}-${resource.id.slice(0, 8)}`;

  const { error: dirError } = await supabase.from("directory_profiles").insert({
    resource_id: resource.id,
    specialty: ctx.directory?.specialty ?? "",
    zone: ctx.directory?.zone ?? "",
    bio_short: "",
    published_to_mallanet: false,
  });
  if (dirError) return { ok: false, error: dirError.message };

  const { error: landError } = await supabase.from("landings").insert({
    resource_id: resource.id,
    slug,
    headline: `Agenda con ${name}`,
    body: "Pedí tu turno desde esta página.",
    is_published: false,
  });
  if (landError) return { ok: false, error: landError.message };

  revalidatePath("/team");
  revalidatePath("/calendar");
  return { ok: true, id: resource.id };
}

export async function inviteReception(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<ActionResult> {
  if (isDemoMode()) {
    return demoInviteReception({
      fullName: input.fullName,
      email: input.email,
    });
  }

  const ctx = await getClinicContext();
  if (!ctx?.clinicId) return { ok: false, error: "Sesión no válida." };
  if (!isClinicDoctor(ctx)) {
    return { ok: false, error: "Solo el médico puede invitar recepción." };
  }
  if (!hasActiveMembership(ctx)) return membershipBlocked();

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const password = input.password;
  if (!email.includes("@") || !fullName || password.length < 8) {
    return {
      ok: false,
      error: "Nombre, email válido y contraseña de al menos 8 caracteres.",
    };
  }

  const admin = createServiceClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "reception" },
  });

  if (createError || !created.user) {
    return {
      ok: false,
      error: createError?.message ?? "No se pudo crear la cuenta de recepción.",
    };
  }

  const { error: memberError } = await admin.from("clinic_members").insert({
    clinic_id: ctx.clinicId,
    profile_id: created.user.id,
    role: "reception",
  });

  if (memberError) {
    return { ok: false, error: memberError.message };
  }

  revalidatePath("/team");
  return { ok: true, id: created.user.id };
}

export async function listDirectoryProfiles(): Promise<DirectoryListing[]> {
  if (isDemoMode()) return listDemoDirectory();

  const supabase = await createClient();
  const { data } = await supabase
    .from("directory_profiles")
    .select(
      "resource_id, specialty, zone, bio_short, resources(display_name, clinics(name), landings(slug, is_published))",
    )
    .eq("published_to_mallanet", true);

  if (!data) return [];

  type Row = {
    resource_id: string;
    specialty: string;
    zone: string;
    bio_short: string;
    resources:
      | {
          display_name: string;
          clinics: { name: string } | { name: string }[] | null;
          landings:
            | { slug: string; is_published: boolean }
            | { slug: string; is_published: boolean }[]
            | null;
        }
      | {
          display_name: string;
          clinics: { name: string } | { name: string }[] | null;
          landings:
            | { slug: string; is_published: boolean }
            | { slug: string; is_published: boolean }[]
            | null;
        }[]
      | null;
  };

  return (data as Row[]).flatMap((row) => {
    const resource = Array.isArray(row.resources)
      ? row.resources[0]
      : row.resources;
    if (!resource) return [];
    const clinic = Array.isArray(resource.clinics)
      ? resource.clinics[0]
      : resource.clinics;
    const landing = Array.isArray(resource.landings)
      ? resource.landings[0]
      : resource.landings;
    return [
      {
        resourceId: row.resource_id,
        displayName: resource.display_name,
        specialty: row.specialty,
        zone: row.zone,
        bioShort: row.bio_short,
        slug: landing?.is_published ? landing.slug : null,
        clinicName: clinic?.name ?? "",
      },
    ];
  });
}

export async function setMembershipStatus(
  clinicId: string,
  status: MembershipStatus,
): Promise<ActionResult> {
  if (isDemoMode()) return demoSetMembershipStatus(clinicId, status);

  const ctx = await getClinicContext();
  if (!ctx || ctx.profile.role !== "admin_waira") {
    return { ok: false, error: "Solo Admin Waira puede cambiar membresías." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({
      status,
      activated_at: status === "active" ? new Date().toISOString() : null,
    })
    .eq("clinic_id", clinicId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/memberships");
  return { ok: true };
}
