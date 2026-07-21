"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  getSandboxDoctor,
  saveSandboxDoctor,
  type Affiliation,
  type PresenceWeekday,
  type PresenceWindow,
} from "@/lib/preview-sandbox";
import type { EcuadorClinic } from "@/lib/ecuador-clinics";

const WEEKDAYS: { value: PresenceWeekday; label: string }[] = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

const DEFAULT_WINDOWS: PresenceWindow[] = [1, 2, 3, 4, 5].flatMap((weekday) => [
  { weekday: weekday as PresenceWeekday, start: "09:00", end: "13:00" },
  { weekday: weekday as PresenceWeekday, start: "15:00", end: "18:00" },
]);

function formatWindows(windows: PresenceWindow[]): string {
  if (windows.length === 0) return "Sin bloques";
  const byDay = new Map<number, string[]>();
  for (const w of windows) {
    const list = byDay.get(w.weekday) ?? [];
    list.push(`${w.start}–${w.end}`);
    byDay.set(w.weekday, list);
  }
  return WEEKDAYS.filter((d) => byDay.has(d.value))
    .map((d) => `${d.label} ${byDay.get(d.value)!.join(", ")}`)
    .join(" · ");
}

export function DoctorPanel({ clinics }: { clinics: EcuadorClinic[] }) {
  const [tick, setTick] = useState(0);
  const doctor = useMemo(() => {
    void tick;
    return getSandboxDoctor();
  }, [tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  const affiliatedIds = new Set(doctor.affiliations.map((a) => a.clinicId));

  function updateName(displayName: string) {
    saveSandboxDoctor({ displayName });
    reload();
  }

  function toggleClinic(clinicId: string) {
    const exists = doctor.affiliations.find((a) => a.clinicId === clinicId);
    let affiliations: Affiliation[];
    if (exists) {
      affiliations = doctor.affiliations.filter((a) => a.clinicId !== clinicId);
    } else {
      affiliations = [
        ...doctor.affiliations,
        {
          clinicId,
          windows: DEFAULT_WINDOWS.map((w) => ({ ...w })),
        },
      ];
    }
    saveSandboxDoctor({ affiliations });
    reload();
  }

  function updateWindows(clinicId: string, windows: PresenceWindow[]) {
    const affiliations = doctor.affiliations.map((a) =>
      a.clinicId === clinicId ? { ...a, windows } : a,
    );
    saveSandboxDoctor({ affiliations });
    reload();
  }

  function addWindow(clinicId: string) {
    const aff = doctor.affiliations.find((a) => a.clinicId === clinicId);
    if (!aff) return;
    updateWindows(clinicId, [
      ...aff.windows,
      { weekday: 1, start: "09:00", end: "13:00" },
    ]);
  }

  function removeWindow(clinicId: string, index: number) {
    const aff = doctor.affiliations.find((a) => a.clinicId === clinicId);
    if (!aff) return;
    updateWindows(
      clinicId,
      aff.windows.filter((_, i) => i !== index),
    );
  }

  function patchWindow(
    clinicId: string,
    index: number,
    patch: Partial<PresenceWindow>,
  ) {
    const aff = doctor.affiliations.find((a) => a.clinicId === clinicId);
    if (!aff) return;
    updateWindows(
      clinicId,
      aff.windows.map((w, i) => (i === index ? { ...w, ...patch } : w)),
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="flex min-w-[16rem] flex-1 flex-col gap-1.5 text-sm text-[color:var(--foreground)]">
          Nombre del doctor demo
          <input
            className="field"
            value={doctor.displayName}
            onChange={(e) => updateName(e.target.value)}
          />
        </label>
        <Link href="/preview/doctor/calendar" className="btn btn-primary">
          Calendario master
        </Link>
      </div>

      <section className="space-y-3" aria-labelledby="affiliated-heading">
        <h2
          id="affiliated-heading"
          className="font-[family-name:var(--font-display)] text-xl font-semibold text-[color:var(--foreground)]"
        >
          Clínicas afiliadas ({doctor.affiliations.length})
        </h2>
        <p className="text-sm text-[color:var(--foreground)]/70">
          Cada clínica tiene sus bloques de presencia. El anti-solape aplica
          entre todas: no podés estar en dos sedes a la vez.
        </p>

        {doctor.affiliations.length === 0 ? (
          <p className="text-sm text-[color:var(--foreground)]/60">
            Afiliá al menos una clínica abajo.
          </p>
        ) : (
          <ul className="space-y-4">
            {doctor.affiliations.map((aff) => {
              const clinic = clinics.find((c) => c.id === aff.clinicId);
              return (
                <li
                  key={aff.clinicId}
                  className="rounded-[var(--radius-panel)] border border-[color:var(--brand-forest)]/12 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium text-[color:var(--foreground)]">
                        {clinic?.name ?? aff.clinicId}
                      </p>
                      <p className="text-xs text-[color:var(--foreground)]/55">
                        {formatWindows(aff.windows)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/preview/agenda?clinic=${encodeURIComponent(aff.clinicId)}`}
                        className="btn btn-secondary"
                      >
                        Agenda clínica
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => toggleClinic(aff.clinicId)}
                      >
                        Desafiliar
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-[color:var(--foreground)]">
                      Bloques horarios
                    </p>
                    {aff.windows.map((w, index) => (
                      <div
                        key={`${aff.clinicId}-${index}`}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <select
                          className="field w-auto"
                          value={w.weekday}
                          aria-label="Día"
                          onChange={(e) =>
                            patchWindow(aff.clinicId, index, {
                              weekday: Number(e.target.value) as PresenceWeekday,
                            })
                          }
                        >
                          {WEEKDAYS.map((d) => (
                            <option key={d.value} value={d.value}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="time"
                          className="field w-auto"
                          value={w.start}
                          aria-label="Desde"
                          onChange={(e) =>
                            patchWindow(aff.clinicId, index, {
                              start: e.target.value,
                            })
                          }
                        />
                        <span className="text-sm text-[color:var(--foreground)]/50">
                          –
                        </span>
                        <input
                          type="time"
                          className="field w-auto"
                          value={w.end}
                          aria-label="Hasta"
                          onChange={(e) =>
                            patchWindow(aff.clinicId, index, {
                              end: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          className="text-sm font-medium text-red-700 underline underline-offset-2"
                          onClick={() => removeWindow(aff.clinicId, index)}
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => addWindow(aff.clinicId)}
                    >
                      Agregar bloque
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="directory-heading">
        <h2
          id="directory-heading"
          className="font-[family-name:var(--font-display)] text-xl font-semibold text-[color:var(--foreground)]"
        >
          Agregar otra clínica (sandbox)
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {clinics.map((clinic) => {
            const on = affiliatedIds.has(clinic.id);
            return (
              <li key={clinic.id}>
                <button
                  type="button"
                  onClick={() => toggleClinic(clinic.id)}
                  className={`flex w-full flex-col rounded-[var(--radius-control)] border px-3 py-2 text-left text-sm transition-colors ${
                    on
                      ? "border-[color:var(--brand-forest)] bg-[color:var(--brand-forest)] text-white"
                      : "border-[color:var(--brand-forest)]/15 bg-white text-[color:var(--foreground)] hover:bg-[color:var(--brand-foam)]"
                  }`}
                  aria-pressed={on}
                >
                  <span className="font-medium">{clinic.name}</span>
                  <span className={on ? "text-white/80" : "text-[color:var(--foreground)]/55"}>
                    {clinic.city} · {on ? "Afiliada" : "Tocar para afiliar"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
