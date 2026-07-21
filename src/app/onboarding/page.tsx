import { OnboardingForm } from "@/components/onboarding-form";
import { getClinicContext, hasActiveMembership } from "@/lib/clinic-context";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const ctx = await getClinicContext();
  if (!ctx?.landing || !ctx.directory) {
    return <p className="text-sm">No hay perfil/landing para editar.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-teal-950">Perfil y landing</h1>
        <p className="text-sm text-teal-900/70">
          Onboarding: cuenta → perfil → publicar landing (requiere membresía activa).
        </p>
      </div>
      <OnboardingForm
        profile={ctx.profile}
        landing={ctx.landing}
        directory={ctx.directory}
        membershipActive={hasActiveMembership(ctx)}
      />
    </div>
  );
}
