import { PageHeader } from "@/components/page-header";
import { TeamPanel } from "@/components/team/team-panel";
import { Banner } from "@/components/ui/banner";
import {
  getClinicContext,
  hasActiveMembership,
  isClinicDoctor,
} from "@/lib/clinic-context";
import { isDemoMode } from "@/lib/mock/mode";
import { readDemoDb } from "@/lib/mock/store";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const ctx = await getClinicContext();
  if (!ctx?.clinicId) {
    return (
      <p className="text-sm text-teal-900/70">
        No encontramos tu clínica. Terminá el alta o escribile a soporte.
      </p>
    );
  }

  let professionals = ctx.resources.map((r) => ({
    ...r,
    slug: null as string | null,
    published: false,
  }));

  if (isDemoMode()) {
    const db = await readDemoDb();
    const clinic = db.clinics.find((c) => c.id === ctx.clinicId);
    professionals = (clinic?.professionals ?? []).map((p) => ({
      id: p.resource.id,
      clinic_id: p.resource.clinic_id,
      profile_id: p.resource.profile_id,
      display_name: p.resource.display_name,
      slug: p.landing.is_published ? p.landing.slug : null,
      published: p.landing.is_published,
    }));
  } else {
    const supabase = await createClient();
    const { data: landings } = await supabase
      .from("landings")
      .select("resource_id, slug, is_published")
      .in(
        "resource_id",
        ctx.resources.map((r) => r.id),
      );
    type LandingRow = {
      resource_id: string;
      slug: string;
      is_published: boolean;
    };
    const byResource = new Map<string, LandingRow>(
      (landings ?? []).map((l: LandingRow) => [l.resource_id, l]),
    );
    professionals = ctx.resources.map((r) => {
      const landing = byResource.get(r.id);
      return {
        ...r,
        slug: landing?.is_published ? landing.slug : null,
        published: Boolean(landing?.is_published),
      };
    });
  }

  const membershipActive = hasActiveMembership(ctx);
  const canManage = isClinicDoctor(ctx);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipo"
        description={`${ctx.clinicName || "Tu consultorio"} · profesionales y recepción`}
      />
      {!membershipActive ? (
        <Banner>
          Membresía pausada: podés ver el equipo, pero no agregar profesionales
          ni invitar recepción.
        </Banner>
      ) : null}
      <TeamPanel
        professionals={professionals}
        members={ctx.members}
        canManage={canManage}
        membershipActive={membershipActive}
        isDemo={isDemoMode()}
      />
    </div>
  );
}
