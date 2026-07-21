"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import {
  getSandboxDoctor,
  listAllSandboxAppointments,
} from "@/lib/preview-sandbox";
import type { EcuadorClinic } from "@/lib/ecuador-clinics";

const ACCENT = [
  "bg-[color:var(--brand-forest)]",
  "bg-[#1a6b6b]",
  "bg-[#0c4040]",
  "bg-[#25cec9]",
  "bg-[#148a86]",
];

export function MasterCalendar({ clinics }: { clinics: EcuadorClinic[] }) {
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => setReady(true), []);

  const doctor = useMemo(() => {
    void tick;
    if (!ready) return null;
    return getSandboxDoctor();
  }, [tick, ready]);
  const appointments = useMemo(() => {
    void tick;
    if (!ready) return [];
    return listAllSandboxAppointments().filter((a) => a.status !== "cancelled");
  }, [tick, ready]);

  const clinicName = (id: string) =>
    clinics.find((c) => c.id === id)?.name ?? id;

  const colorIndex = (clinicId: string) => {
    if (!doctor) return 0;
    const idx = doctor.affiliations.findIndex((a) => a.clinicId === clinicId);
    return Math.max(0, idx) % ACCENT.length;
  };

  if (!ready || !doctor) {
    return (
      <p className="text-sm text-[color:var(--foreground)]/65">
        Cargando calendario…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[color:var(--foreground)]/70">
          {doctor.displayName} · {doctor.specialty} ·{" "}
          {appointments.length === 1
            ? "1 turno activo"
            : `${appointments.length} turnos activos`}
        </p>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setTick((t) => t + 1)}
        >
          Actualizar
        </button>
      </div>

      {doctor.affiliations.length === 0 ? (
        <p className="rounded-[var(--radius-panel)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          No hay clínicas afiliadas.{" "}
          <Link href="/preview/doctor" className="font-medium underline">
            Ir al panel
          </Link>
        </p>
      ) : null}

      {appointments.length === 0 ? (
        <p className="text-sm text-[color:var(--foreground)]/65">
          Sin turnos. Creá uno desde la{" "}
          <Link href="/preview" className="font-medium underline">
            reserva demo
          </Link>{" "}
          o desde la agenda de una clínica.
        </p>
      ) : (
        <ul className="space-y-2">
          {appointments.map((a) => (
            <li key={a.id}>
              <Link
                href={`/preview/agenda?clinic=${encodeURIComponent(a.clinicId)}`}
                className="flex gap-3 rounded-[var(--radius-panel)] border border-[color:var(--brand-forest)]/12 bg-white p-3 no-underline transition-colors hover:bg-[color:var(--brand-foam)]"
              >
                <span
                  className={`mt-1 h-10 w-1.5 shrink-0 rounded-full ${ACCENT[colorIndex(a.clinicId)]}`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="block text-sm font-medium text-[color:var(--foreground)]">
                    {a.patients_min?.full_name ?? "Paciente"}
                  </span>
                  <span className="block text-xs text-[color:var(--foreground)]/60">
                    {format(parseISO(a.starts_at), "EEE d MMM · HH:mm", {
                      locale: es,
                    })}
                    –
                    {format(parseISO(a.ends_at), "HH:mm", { locale: es })} ·{" "}
                    {clinicName(a.clinicId)}
                  </span>
                </span>
                <span className="self-center text-xs font-medium text-[color:var(--brand-forest)]">
                  Abrir agenda →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        {doctor.affiliations.map((aff) => (
          <Link
            key={aff.clinicId}
            href={`/preview/agenda?clinic=${encodeURIComponent(aff.clinicId)}`}
            className="btn btn-secondary"
          >
            {clinicName(aff.clinicId)}
          </Link>
        ))}
      </div>
    </div>
  );
}
