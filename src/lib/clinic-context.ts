import { createClient } from "@/lib/supabase/server";
import type { ClinicContext } from "@/lib/types";

export async function getClinicContext(): Promise<ClinicContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  if (profile.role === "admin_waira") {
    return {
      profile,
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

  const { data: membershipRow } = await supabase
    .from("clinic_members")
    .select("clinic_id")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membershipRow) return null;

  const clinicId = membershipRow.clinic_id as string;

  const { data: resource } = await supabase
    .from("resources")
    .select("id, clinic_id, profile_id, display_name")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!resource) return null;

  const [{ data: membership }, { data: landing }, { data: directory }] =
    await Promise.all([
      supabase
        .from("memberships")
        .select("id, clinic_id, status, activated_at")
        .eq("clinic_id", clinicId)
        .maybeSingle(),
      supabase
        .from("landings")
        .select(
          "id, resource_id, slug, headline, body, cta_label, show_donation_cta, donation_url, is_published",
        )
        .eq("resource_id", resource.id)
        .maybeSingle(),
      supabase
        .from("directory_profiles")
        .select(
          "id, resource_id, specialty, zone, bio_short, published_to_mallanet",
        )
        .eq("resource_id", resource.id)
        .maybeSingle(),
    ]);

  return {
    profile,
    clinicId,
    resource,
    membership: membership ?? null,
    landing: landing ?? null,
    directory: directory ?? null,
  };
}

export function hasActiveMembership(ctx: ClinicContext | null): boolean {
  return ctx?.membership?.status === "active";
}
