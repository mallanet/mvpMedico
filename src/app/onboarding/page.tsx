import { OnboardingForm } from "@/components/onboarding-form";
import { PageHeader } from "@/components/page-header";
import { getClinicContext, hasActiveMembership } from "@/lib/clinic-context";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const ctx = await getClinicContext();
  if (!ctx?.landing || !ctx.directory) {
    return (
      <p className="text-sm leading-relaxed text-teal-900/70">
        Todavía no hay perfil ni landing para editar.
      </p>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Perfil y landing"
        description="Completá el perfil. Para publicar la landing hace falta membresía activa."
      />
      <OnboardingForm
        profile={ctx.profile}
        landing={ctx.landing}
        directory={ctx.directory}
        membershipActive={hasActiveMembership(ctx)}
      />
    </div>
  );
}
