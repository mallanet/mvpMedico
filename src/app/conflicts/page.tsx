import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getClinicContext } from "@/lib/clinic-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
) {
  return aStart < bEnd && aEnd > bStart;
}

export default async function ConflictsPage() {
  const ctx = await getClinicContext();
  if (!ctx?.resource.id) {
    return <p className="text-sm">Sin recurso.</p>;
  }

  const supabase = await createClient();
  const [{ data: appointments }, { data: externalEvents }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, starts_at, ends_at, status, patients_min(full_name)")
      .eq("resource_id", ctx.resource.id)
      .neq("status", "cancelled"),
    supabase
      .from("external_events")
      .select("id, starts_at, ends_at, summary")
      .eq("resource_id", ctx.resource.id),
  ]);

  const conflicts = (appointments ?? []).flatMap((appt) => {
    const patient = Array.isArray(appt.patients_min)
      ? appt.patients_min[0]
      : appt.patients_min;
    const hits = (externalEvents ?? []).filter((ev) =>
      rangesOverlap(appt.starts_at, appt.ends_at, ev.starts_at, ev.ends_at),
    );
    return hits.map((ev) => ({ appt, ev, patient }));
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-teal-950">Conflictos</h1>
        <p className="text-sm text-teal-900/70">
          Turnos internos que se solapan con busy importado de Google.
        </p>
      </div>

      {conflicts.length === 0 ? (
        <p className="rounded-xl border border-teal-900/10 bg-white px-4 py-6 text-sm text-teal-900/70">
          Sin conflictos detectados.
        </p>
      ) : (
        <ul className="divide-y divide-red-100 rounded-xl border border-red-200 bg-red-50/40">
          {conflicts.map(({ appt, ev, patient }) => (
            <li key={`${appt.id}-${ev.id}`} className="px-4 py-3 text-sm">
              <p className="font-medium text-red-950">
                {(patient as { full_name?: string } | null)?.full_name ?? "Turno"}{" "}
                choca con {ev.summary ?? "evento externo"}
              </p>
              <p className="text-red-900/70">
                Turno:{" "}
                {format(parseISO(appt.starts_at), "d MMM HH:mm", { locale: es })}–
                {format(parseISO(appt.ends_at), "HH:mm", { locale: es })}
                {" · "}
                Externo:{" "}
                {format(parseISO(ev.starts_at), "d MMM HH:mm", { locale: es })}–
                {format(parseISO(ev.ends_at), "HH:mm", { locale: es })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
