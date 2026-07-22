import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { RESOURCE_COOKIE } from "@/lib/clinic-limits";
import type {
  ClinicContext,
  ClinicMember,
  DirectoryProfile,
  Landing,
  Resource,
} from "@/lib/types";
import { isDemoMode } from "@/lib/mock/mode";
import { getDemoClinicContext } from "@/lib/mock/appointments";

function pickResource(
  resources: Resource[],
  preferredId: string | undefined,
): Resource | null {
  if (resources.length === 0) return null;
  if (preferredId) {
    const match = resources.find((r) => r.id === preferredId);
    if (match) return match;
  }
  return resources[0];
}

export async function getClinicContext(
  preferredResourceId?: string,
): Promise<ClinicContext | null> {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    const cookieId =
      preferredResourceId ?? cookieStore.get(RESOURCE_COOKIE)?.value;
    return getDemoClinicContext(cookieId);
  }

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

  const { data: membershipRow } = await supabase
    .from("clinic_members")
    .select("clinic_id")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membershipRow) return null;

  const clinicId = membershipRow.clinic_id as string;

  const [
    { data: clinic },
    { data: resourcesRows },
    { data: membership },
    { data: memberRows },
  ] = await Promise.all([
    supabase.from("clinics").select("id, name").eq("id", clinicId).maybeSingle(),
    supabase
      .from("resources")
      .select("id, clinic_id, profile_id, display_name")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: true }),
    supabase
      .from("memberships")
      .select("id, clinic_id, status, activated_at")
      .eq("clinic_id", clinicId)
      .maybeSingle(),
    supabase
      .from("clinic_members")
      .select("profile_id, role, profiles(id, full_name, role)")
      .eq("clinic_id", clinicId),
  ]);

  const resources = (resourcesRows ?? []) as Resource[];
  const cookieStore = await cookies();
  const preferred =
    preferredResourceId ?? cookieStore.get(RESOURCE_COOKIE)?.value;
  const resource = pickResource(resources, preferred);
  if (!resource) return null;

  const [{ data: landing }, { data: directory }] = await Promise.all([
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

  const members: ClinicMember[] = (memberRows ?? []).map(
    (row: {
      profile_id: string;
      role: ClinicMember["role"];
      profiles:
        | { id: string; full_name: string | null; role: ClinicMember["role"] }
        | { id: string; full_name: string | null; role: ClinicMember["role"] }[]
        | null;
    }) => {
      const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        profileId: row.profile_id,
        fullName: p?.full_name ?? null,
        role: row.role,
      };
    },
  );

  return {
    profile,
    clinicId,
    clinicName: clinic?.name ?? "",
    resources,
    resource,
    membership: membership ?? null,
    landing: (landing as Landing | null) ?? null,
    directory: (directory as DirectoryProfile | null) ?? null,
    members,
  };
}

export function hasActiveMembership(ctx: ClinicContext | null): boolean {
  return ctx?.membership?.status === "active";
}

export function isClinicDoctor(ctx: ClinicContext | null): boolean {
  if (!ctx) return false;
  if (ctx.profile.role === "doctor") return true;
  return ctx.members.some(
    (m) => m.profileId === ctx.profile.id && m.role === "doctor",
  );
}
