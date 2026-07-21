"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useTransition } from "react";
import { cancelAppointment } from "@/lib/appointments";
import type { Appointment, ExternalEvent } from "@/lib/types";

type Props = {
  appointments: Appointment[];
  externalEvents: ExternalEvent[];
};

export function CalendarWeek({ appointments, externalEvents }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const active = appointments.filter((a) => a.status !== "cancelled");
  const cancelled = appointments.filter((a) => a.status === "cancelled");

  function onCancel(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await cancelAppointment(id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <section aria-label="Turnos activos" className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-900/60">
          Turnos activos
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-teal-900/70">No hay turnos activos.</p>
        ) : (
          <ul className="divide-y divide-teal-900/10 rounded-xl border border-teal-900/10 bg-white">
            {active.map((appt) => (
              <li
                key={appt.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-teal-950">
                    {appt.patients_min?.full_name ?? "Sin paciente"}
                  </p>
                  <p className="text-sm text-teal-900/70">
                    {format(parseISO(appt.starts_at), "EEE d MMM HH:mm", { locale: es })}
                    {" – "}
                    {format(parseISO(appt.ends_at), "HH:mm", { locale: es })}
                    {appt.patients_min?.phone
                      ? ` · ${appt.patients_min.phone}`
                      : null}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onCancel(appt.id)}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                >
                  Cancelar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Bloqueos externos" className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-900/60">
          Bloqueos Google / externos
        </h2>
        {externalEvents.length === 0 ? (
          <p className="text-sm text-teal-900/70">Sin bloqueos externos importados.</p>
        ) : (
          <ul className="divide-y divide-amber-900/10 rounded-xl border border-amber-900/15 bg-amber-50/50">
            {externalEvents.map((event) => (
              <li key={event.id} className="px-4 py-3 text-sm">
                <p className="font-medium text-amber-950">
                  {event.summary ?? "Ocupado"}
                </p>
                <p className="text-amber-900/70">
                  {format(parseISO(event.starts_at), "EEE d MMM HH:mm", { locale: es })}
                  {" – "}
                  {format(parseISO(event.ends_at), "HH:mm", { locale: es })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {cancelled.length > 0 ? (
        <section aria-label="Cancelados" className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-900/60">
            Cancelados
          </h2>
          <ul className="text-sm text-teal-900/50">
            {cancelled.map((appt) => (
              <li key={appt.id}>
                {appt.patients_min?.full_name ?? "Paciente"} ·{" "}
                {format(parseISO(appt.starts_at), "d MMM HH:mm", { locale: es })}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
