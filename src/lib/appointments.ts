"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getClinicContext, hasActiveMembership } from "@/lib/clinic-context";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function overlapError(message: string): boolean {
  return (
    message.includes("appointments_no_overlap") ||
    message.includes("exclusion constraint") ||
    message.toLowerCase().includes("overlap")
  );
}

async function assertNoExternalBusy(
  resourceId: string,
  startsAt: string,
  endsAt: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("external_events")
    .select("id, summary, starts_at, ends_at")
    .eq("resource_id", resourceId)
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt)
    .limit(1);

  if (error) return error.message;
  if (data && data.length > 0) {
    return "El horario está bloqueado por un evento externo (Google Calendar).";
  }
  return null;
}

export async function createAppointment(input: {
  startsAt: string;
  endsAt: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  notes?: string;
}): Promise<ActionResult> {
  const ctx = await getClinicContext();
  if (!ctx?.resource.id) return { ok: false, error: "Sesión no válida." };

  const busy = await assertNoExternalBusy(
    ctx.resource.id,
    input.startsAt,
    input.endsAt,
  );
  if (busy) return { ok: false, error: busy };

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
    return { ok: false, error: patientError?.message ?? "No se pudo crear paciente." };
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      resource_id: ctx.resource.id,
      patient_id: patient.id,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: "scheduled",
      notes: input.notes ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (overlapError(error.message)) {
      return {
        ok: false,
        error: "Solape detectado: ya hay un turno activo en ese horario.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/calendar");
  revalidatePath("/conflicts");
  return { ok: true, id: data.id };
}

export async function cancelAppointment(appointmentId: string): Promise<ActionResult> {
  const ctx = await getClinicContext();
  if (!ctx?.resource.id) return { ok: false, error: "Sesión no válida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("resource_id", ctx.resource.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/calendar");
  return { ok: true };
}

export async function rescheduleAppointment(input: {
  appointmentId: string;
  startsAt: string;
  endsAt: string;
}): Promise<ActionResult> {
  const ctx = await getClinicContext();
  if (!ctx?.resource.id) return { ok: false, error: "Sesión no válida." };

  const busy = await assertNoExternalBusy(
    ctx.resource.id,
    input.startsAt,
    input.endsAt,
  );
  if (busy) return { ok: false, error: busy };

  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: "scheduled",
    })
    .eq("id", input.appointmentId)
    .eq("resource_id", ctx.resource.id);

  if (error) {
    if (overlapError(error.message)) {
      return {
        ok: false,
        error: "Solape detectado: ya hay un turno activo en ese horario.",
      };
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
  const supabase = await createClient();

  const { data: landing, error: landingError } = await supabase
    .from("landings")
    .select("resource_id, is_published")
    .eq("slug", input.slug)
    .maybeSingle();

  if (landingError || !landing?.is_published) {
    return { ok: false, error: "Landing no disponible." };
  }

  const { data: resource } = await supabase
    .from("resources")
    .select("id, clinic_id")
    .eq("id", landing.resource_id)
    .single();

  if (!resource) return { ok: false, error: "Recurso no encontrado." };

  const { data: membership } = await supabase
    .from("memberships")
    .select("status")
    .eq("clinic_id", resource.clinic_id)
    .maybeSingle();

  if (membership?.status !== "active") {
    return { ok: false, error: "La membresía Waira no está activa." };
  }

  const busy = await assertNoExternalBusy(
    resource.id,
    input.startsAt,
    input.endsAt,
  );
  if (busy) return { ok: false, error: busy };

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
    return { ok: false, error: patientError?.message ?? "No se pudo crear paciente." };
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
    if (overlapError(error.message)) {
      return {
        ok: false,
        error: "Ese horario ya no está disponible.",
      };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data.id };
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
  const ctx = await getClinicContext();
  if (!ctx?.resource.id || !ctx.landing || !ctx.directory) {
    return { ok: false, error: "Sesión no válida." };
  }

  if ((input.publishLanding || input.publishMallanet) && !hasActiveMembership(ctx)) {
    return {
      ok: false,
      error: "Necesitás membresía Waira activa para publicar landing o Mallanet.",
    };
  }

  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({ full_name: input.fullName })
    .eq("id", ctx.profile.id);

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
  revalidatePath(`/l/${input.slug}`);
  return { ok: true };
}

export async function setMembershipStatus(
  clinicId: string,
  status: "active" | "paused",
): Promise<ActionResult> {
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
