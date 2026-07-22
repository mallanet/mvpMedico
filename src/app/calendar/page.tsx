import Link from "next/link";
import { CalendarIsland } from "@/components/calendar/calendar-island";
import { ResourceSwitcher } from "@/components/calendar/resource-switcher";
import { PageHeader } from "@/components/page-header";
import { Banner } from "@/components/ui/banner";
import {
  getClinicContext,
  hasActiveMembership,
} from "@/lib/clinic-context";
import { isDemoMode } from "@/lib/mock/mode";
import { listDemoAppointmentsForResource } from "@/lib/mock/appointments";
import { createClient } from "@/lib/supabase/server";
import type { Appointment } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const ctx = await getClinicContext();
  if (!ctx?.resource.id) {
    return (
      <p className="text-sm leading-relaxed text-[color:var(--foreground)]/70">
        No encontramos tu clínica. Terminá el alta o escribile a soporte.
      </p>
    );
  }

  let normalizedAppointments: Appointment[] = [];

  if (isDemoMode()) {
    normalizedAppointments = await listDemoAppointmentsForResource(
      ctx.resource.id,
    );
  } else {
    const supabase = await createClient();
    const { data: appointments } = await supabase
      .from("appointments")
      .select(
        "id, resource_id, patient_id, starts_at, ends_at, status, notes, patients_min(id, full_name, phone, email)",
      )
      .eq("resource_id", ctx.resource.id)
      .order("starts_at", { ascending: true });

    normalizedAppointments = (appointments ?? []).map((row: {
      id: string;
      resource_id: string;
      patient_id: string | null;
      starts_at: string;
      ends_at: string;
      status: Appointment["status"];
      notes: string | null;
      patients_min: Appointment["patients_min"] | Appointment["patients_min"][];
    }) => {
      const patient = Array.isArray(row.patients_min)
        ? row.patients_min[0] ?? null
        : row.patients_min;
      return {
        id: row.id,
        resource_id: row.resource_id,
        patient_id: row.patient_id,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        status: row.status,
        notes: row.notes,
        patients_min: patient,
      } as Appointment;
    });
  }

  const membershipActive = hasActiveMembership(ctx);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description={
          isDemoMode()
            ? `${ctx.clinicName || ctx.profile.full_name} · demo`
            : ctx.clinicName || ctx.resource.display_name
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <ResourceSwitcher
            resources={ctx.resources}
            selectedId={ctx.resource.id}
          />
          {ctx.landing?.slug ? (
            <Link
              href={`/l/${ctx.landing.slug}`}
              className="text-sm font-medium text-[color:var(--brand-forest)] underline underline-offset-2"
            >
              /l/{ctx.landing.slug}
            </Link>
          ) : null}
          <span
            className={`inline-flex min-h-8 items-center rounded-[var(--radius-control)] px-3 text-xs font-medium ${
              membershipActive
                ? "bg-[color:var(--brand-foam)] text-[color:var(--brand-forest)]"
                : "bg-amber-50 text-amber-950"
            }`}
          >
            Membresía{" "}
            {membershipActive
              ? "activa"
              : (ctx.membership?.status ?? "pausada")}
          </span>
        </div>
      </PageHeader>

      {!membershipActive ? (
        <Banner>
          Tu membresía está pausada: podés mirar la agenda, pero no crear, mover
          ni cancelar turnos. Pedile al admin que la reactive.
        </Banner>
      ) : null}

      <CalendarIsland
        resourceId={ctx.resource.id}
        appointments={normalizedAppointments}
        membershipActive={membershipActive}
      />
    </div>
  );
}
