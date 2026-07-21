"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getClinicContext, hasActiveMembership } from "@/lib/clinic-context";
import {
  buildDaySlots,
  filterAvailableSlots,
} from "@/lib/slots";
import { OVERLAP_MESSAGE, type MembershipStatus, type TimeSlot } from "@/lib/types";
import { isDemoMode } from "@/lib/mock/mode";
import {
  demoBookFromLanding,
  demoCancelAppointment,
  demoCreateAppointment,
  demoListAvailableSlots,
  demoMoveAppointment,
  demoSetMembershipStatus,
  demoUpdateOnboarding,
} from "@/lib/mock/appointments";

export type ActionResult = { ok: true; id?: string; code?: string } | { ok: false; error: string };

function isExclusionViolation(error: PostgrestError): boolean {
  // DECISION: check Postgres code 23P01 first; fall back to message for PostgREST variants.
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

export async function createAppointment(input: {
  startsAt: string;
  endsAt: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  notes?: string;
}): Promise<ActionResult> {
  if (isDemoMode()) return demoCreateAppointment(input);

  const ctx = await getClinicContext();
  if (!ctx?.resource.id) return { ok: false, error: "Sesión no válida." };
  if (!hasActiveMembership(ctx)) return membershipBlocked();

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
    if (isExclusionViolation(error)) {
      return { ok: false, error: OVERLAP_MESSAGE };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/calendar");
  return { ok: true, id: data.id };
}

export async function cancelAppointment(appointmentId: string): Promise<ActionResult> {
  if (isDemoMode()) return demoCancelAppointment(appointmentId);

  const ctx = await getClinicContext();
  if (!ctx?.resource.id) return { ok: false, error: "Sesión no válida." };
  if (!hasActiveMembership(ctx)) return membershipBlocked();

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

export async function moveAppointment(input: {
  appointmentId: string;
  startsAt: string;
  endsAt: string;
}): Promise<ActionResult> {
  if (isDemoMode()) return demoMoveAppointment(input);

  const ctx = await getClinicContext();
  if (!ctx?.resource.id) return { ok: false, error: "Sesión no válida." };
  if (!hasActiveMembership(ctx)) return membershipBlocked();

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
    if (isExclusionViolation(error)) {
      return { ok: false, error: OVERLAP_MESSAGE };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/calendar");
  return { ok: true };
}

/** @deprecated alias kept for older call sites */
export async function rescheduleAppointment(input: {
  appointmentId: string;
  startsAt: string;
  endsAt: string;
}): Promise<ActionResult> {
  return moveAppointment(input);
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

  // DECISION: block booking when membership inactive to enforce paid model
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

  const [{ data: appointments }] = await Promise.all([
    supabase
      .from("appointments")
      .select("starts_at, ends_at")
      .eq("resource_id", landing.resource_id)
      .neq("status", "cancelled")
      .lt("starts_at", dayEnd)
      .gt("ends_at", dayStart),
  ]);

  const busy = appointments ?? [];

  return { ok: true, slots: filterAvailableSlots(slots, busy) };
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

  if ((input.publishLanding || input.publishMallanet) && !hasActiveMembership(ctx)) {
    return {
      ok: false,
      error: "Para publicar la landing o Mallanet necesitás membresía Waira activa.",
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
