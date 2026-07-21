import Link from "next/link";
import { CalendarIsland } from "@/components/calendar/calendar-island";
import { Banner } from "@/components/ui/banner";
import { getClinicContext, hasActiveMembership } from "@/lib/clinic-context";
import { createClient } from "@/lib/supabase/server";
import type { Appointment, ExternalEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const ctx = await getClinicContext();
  if (!ctx?.resource.id) {
    return (
      <p className="text-sm text-teal-900/70">
        No hay contexto de clínica. Completá el alta o contactá soporte.
      </p>
    );
  }

  const supabase = await createClient();
  const [{ data: appointments }, { data: externalEvents }] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, resource_id, patient_id, starts_at, ends_at, status, notes, patients_min(id, full_name, phone, email)",
      )
      .eq("resource_id", ctx.resource.id)
      .order("starts_at", { ascending: true }),
    supabase
      .from("external_events")
      .select("id, resource_id, starts_at, ends_at, summary")
      .eq("resource_id", ctx.resource.id)
      .order("starts_at", { ascending: true }),
  ]);

  const membershipActive = hasActiveMembership(ctx);

  const normalizedAppointments: Appointment[] = (appointments ?? []).map(
    (row) => {
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
    },
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-teal-950">Agenda</h1>
          <p className="text-sm text-teal-900/70">
            {ctx.resource.display_name}
            {ctx.landing?.slug ? (
              <>
                {" · "}
                <Link
                  href={`/l/${ctx.landing.slug}`}
                  className="text-teal-800 underline"
                >
                  /l/{ctx.landing.slug}
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            membershipActive
              ? "bg-teal-100 text-teal-900"
              : "bg-amber-100 text-amber-900"
          }`}
        >
          Membresía {membershipActive ? "activa" : (ctx.membership?.status ?? "pausada")}
        </span>
      </div>

      {!membershipActive ? (
        <Banner>
          Tu membresía está pausada. Contactá al admin. Podés ver la agenda pero no
          crear, mover ni cancelar turnos.
        </Banner>
      ) : null}

      <CalendarIsland
        resourceId={ctx.resource.id}
        appointments={normalizedAppointments}
        externalEvents={(externalEvents as ExternalEvent[]) ?? []}
        membershipActive={membershipActive}
      />
    </div>
  );
}
