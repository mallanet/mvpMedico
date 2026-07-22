import { OnboardingForm } from "@/components/onboarding-form";
import { PageHeader } from "@/components/page-header";
import { ResourceSwitcher } from "@/components/calendar/resource-switcher";
import {
  getClinicContext,
  hasActiveMembership,
  isClinicDoctor,
} from "@/lib/clinic-context";

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

  if (!isClinicDoctor(ctx)) {
    return (
      <div className="max-w-2xl space-y-4">
        <PageHeader title="Perfil y landing" />
        <p className="text-sm leading-relaxed text-teal-900/70">
          Solo el médico puede editar el perfil y la landing. Pedile a un
          médico del equipo que publique los cambios.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Perfil y landing"
        description="Completá el perfil del profesional seleccionado. Para publicar hace falta membresía activa."
      >
        <ResourceSwitcher
          resources={ctx.resources}
          selectedId={ctx.resource.id}
        />
      </PageHeader>
      <OnboardingForm
        profile={{
          ...ctx.profile,
          full_name: ctx.resource.display_name,
        }}
        landing={ctx.landing}
        directory={ctx.directory}
        membershipActive={hasActiveMembership(ctx)}
      />
    </div>
  );
}
