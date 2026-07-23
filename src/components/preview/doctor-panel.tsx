"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";
import { ClinicCardMedia } from "@/components/directory/clinic-card-media";
import {
  applyDemoPresenceWindows,
  getSandboxDoctor,
  saveSandboxDoctor,
  type Affiliation,
  type PresenceWeekday,
  type PresenceWindow,
} from "@/lib/preview-sandbox";
import type { EcuadorClinic } from "@/lib/ecuador-clinics";

const WEEKDAYS: { value: PresenceWeekday; label: string; short: string }[] = [
  { value: 1, label: "Lunes", short: "Lun" },
  { value: 2, label: "Martes", short: "Mar" },
  { value: 3, label: "Miércoles", short: "Mié" },
  { value: 4, label: "Jueves", short: "Jue" },
  { value: 5, label: "Viernes", short: "Vie" },
  { value: 6, label: "Sábado", short: "Sáb" },
  { value: 0, label: "Domingo", short: "Dom" },
];

const DEFAULT_WINDOWS: PresenceWindow[] = [1, 2, 3, 4, 5, 6, 0].map(
  (weekday) => ({
    weekday: weekday as PresenceWeekday,
    start: "08:00",
    end: "20:00",
  }),
);

function windowsForDay(windows: PresenceWindow[], day: PresenceWeekday) {
  return windows
    .map((w, index) => ({ w, index }))
    .filter(({ w }) => w.weekday === day);
}

function doctorInitials(name: string) {
  const parts = name.replace(/\./g, "").split(/\s+/).filter(Boolean);
  const skip = new Set(["dra", "dr", "doc"]);
  const meaningful = parts.filter((p) => !skip.has(p.toLowerCase()));
  const use = meaningful.length >= 2 ? meaningful : parts;
  return (
    use
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "DR"
  );
}

export function DoctorPanel({ clinics }: { clinics: EcuadorClinic[] }) {
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const [activeClinicId, setActiveClinicId] = useState<string | null>(null);
  const [clinicQuery, setClinicQuery] = useState("");

  useEffect(() => setReady(true), []);

  const doctor = useMemo(() => {
    void tick;
    if (!ready) return null;
    return getSandboxDoctor();
  }, [tick, ready]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!doctor) return;
    const ids = doctor.affiliations.map((a) => a.clinicId);
    if (ids.length === 0) {
      setActiveClinicId(null);
      return;
    }
    if (!activeClinicId || !ids.includes(activeClinicId)) {
      setActiveClinicId(ids[0]);
    }
  }, [doctor, activeClinicId]);

  if (!ready || !doctor) {
    return (
      <div
        className="preview-panel preview-panel--diptych"
        aria-busy="true"
        aria-label="Cargando panel doctor"
      >
        <div className="preview-panel__profile space-y-4">
          <div className="skeleton-block h-10 w-10 rounded-full" />
          <div className="skeleton-block h-12 w-full" />
          <div className="skeleton-block h-24 w-full" />
        </div>
        <div className="preview-panel__booking space-y-4">
          <div className="skeleton-block h-8 w-1/2" />
          <div className="skeleton-block h-11 w-full" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="skeleton-block h-28" />
            <div className="skeleton-block h-28" />
          </div>
        </div>
      </div>
    );
  }

  const current = doctor;
  const affiliatedIds = new Set(current.affiliations.map((a) => a.clinicId));
  const active =
    current.affiliations.find((a) => a.clinicId === activeClinicId) ?? null;
  const activeClinic = active
    ? clinics.find((c) => c.id === active.clinicId)
    : null;
  const blockCount = current.affiliations.reduce(
    (n, a) => n + a.windows.length,
    0,
  );

  const q = clinicQuery.trim().toLowerCase();
  const affiliateOptions = clinics.filter((c) => {
    if (affiliatedIds.has(c.id)) return false;
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.province.toLowerCase().includes(q)
    );
  });

  function updateName(displayName: string) {
    saveSandboxDoctor({ displayName });
    reload();
  }

  function updateSpecialty(specialty: string) {
    saveSandboxDoctor({ specialty });
    reload();
  }

  function toggleClinic(clinicId: string) {
    const exists = current.affiliations.find((a) => a.clinicId === clinicId);
    let affiliations: Affiliation[];
    if (exists) {
      affiliations = current.affiliations.filter((a) => a.clinicId !== clinicId);
    } else {
      affiliations = [
        ...current.affiliations,
        {
          clinicId,
          windows: DEFAULT_WINDOWS.map((w) => ({ ...w })),
        },
      ];
    }
    saveSandboxDoctor({ affiliations });
    if (!exists) setActiveClinicId(clinicId);
    reload();
  }

  function updateWindows(clinicId: string, windows: PresenceWindow[]) {
    const affiliations = current.affiliations.map((a) =>
      a.clinicId === clinicId ? { ...a, windows } : a,
    );
    saveSandboxDoctor({ affiliations });
    reload();
  }

  function addWindow(clinicId: string, weekday: PresenceWeekday = 1) {
    const aff = current.affiliations.find((a) => a.clinicId === clinicId);
    if (!aff) return;
    updateWindows(clinicId, [
      ...aff.windows,
      { weekday, start: "09:00", end: "13:00" },
    ]);
  }

  function removeWindow(clinicId: string, index: number) {
    const aff = current.affiliations.find((a) => a.clinicId === clinicId);
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
    const aff = current.affiliations.find((a) => a.clinicId === clinicId);
    if (!aff) return;
    updateWindows(
      clinicId,
      aff.windows.map((w, i) => (i === index ? { ...w, ...patch } : w)),
    );
  }

  function setDayEnabled(clinicId: string, day: PresenceWeekday, on: boolean) {
    const aff = current.affiliations.find((a) => a.clinicId === clinicId);
    if (!aff) return;
    if (on) {
      if (aff.windows.some((w) => w.weekday === day)) return;
      updateWindows(clinicId, [
        ...aff.windows,
        { weekday: day, start: "08:00", end: "20:00" },
      ]);
      return;
    }
    updateWindows(
      clinicId,
      aff.windows.filter((w) => w.weekday !== day),
    );
  }

  function onClinicTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (current.affiliations.length === 0) return;
    const last = current.affiliations.length - 1;
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      next = index === last ? 0 : index + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      next = index === 0 ? last : index - 1;
    } else if (event.key === "Home") {
      event.preventDefault();
      next = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      next = last;
    } else {
      return;
    }
    const id = current.affiliations[next]?.clinicId;
    if (!id) return;
    setActiveClinicId(id);
    document.getElementById(`clinic-tab-${id}`)?.focus();
  }

  return (
    <article className="preview-panel preview-panel--diptych">
      <aside className="preview-panel__profile content-start !gap-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/preview"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border border-teal-900/15 bg-white text-teal-950 transition-colors duration-[var(--dur-fast)] hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
            aria-label="Volver al preview"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/waira-isotipo.svg"
            alt=""
            width={36}
            height={28}
            className="h-7 w-auto"
          />
        </div>

        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-teal-900/12 bg-white text-sm font-semibold text-teal-950"
            aria-hidden
          >
            {doctorInitials(current.displayName)}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sm font-medium uppercase tracking-[0.18em] text-teal-800/70">
                Doctor demo
              </span>
              <input
                className="field font-[family-name:var(--font-display)] text-base font-semibold text-teal-950"
                value={current.displayName}
                onChange={(e) => updateName(e.target.value)}
                aria-label="Nombre del doctor demo"
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sm font-medium text-teal-950">
                Especialidad
              </span>
              <input
                className="field"
                value={current.specialty}
                onChange={(e) => updateSpecialty(e.target.value)}
                aria-label="Especialidad del doctor demo"
              />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-teal-950">
            Presencia entre clínicas
          </h1>
          <p className="text-xs leading-relaxed text-teal-900/60">
            {blockCount === 1
              ? "1 bloque de presencia"
              : `${blockCount} bloques de presencia`}
            {" · "}
            {current.affiliations.length === 1
              ? "1 clínica afiliada"
              : `${current.affiliations.length} clínicas afiliadas`}
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-teal-900/75">
            Definí en qué sedes atendés y en qué franjas. El anti-solape aplica
            entre todas: no podés estar en dos clínicas a la vez. Todo queda en
            este navegador.
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2 border-t border-teal-900/10 pt-4">
          <Link href="/preview/doctor/calendar" className="btn btn-primary w-full">
            Calendario master
          </Link>
          <Link href="/preview" className="btn btn-secondary w-full">
            Pedir turno
          </Link>
        </div>
      </aside>

      <div className="preview-panel__booking space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="text-lg font-semibold text-teal-950">
              Bloques de presencia
            </h2>
            <p className="text-sm text-teal-900/70">
              Elegí una clínica afiliada y editá sus franjas por día.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              applyDemoPresenceWindows();
              reload();
            }}
          >
            Presencia 08–20
          </button>
        </div>

        {current.affiliations.length === 0 ? (
          <p
            className="rounded-[var(--radius-control)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            Afiliá al menos una clínica abajo para definir bloques.
          </p>
        ) : (
          <>
            <div
              className="preview-date-scroller"
              role="tablist"
              aria-label="Clínicas afiliadas"
            >
              {current.affiliations.map((aff, index) => {
                const clinic = clinics.find((c) => c.id === aff.clinicId);
                const selected = aff.clinicId === activeClinicId;
                const panelId = `clinic-panel-${aff.clinicId}`;
                return (
                  <button
                    key={aff.clinicId}
                    id={`clinic-tab-${aff.clinicId}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={panelId}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActiveClinicId(aff.clinicId)}
                    onKeyDown={(e) => onClinicTabKeyDown(e, index)}
                    className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--radius-control)] border px-3 text-left text-sm font-medium transition-colors duration-[var(--dur-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] ${
                      selected
                        ? "border-[color:var(--brand-forest)] bg-[color:var(--brand-forest)] text-white"
                        : "border-teal-900/15 bg-white text-teal-950 hover:bg-[color:var(--brand-foam)]"
                    }`}
                  >
                    {clinic ? (
                      <span className="h-8 w-8 shrink-0 overflow-hidden rounded-[var(--radius-control)] border border-teal-900/10 bg-white">
                        <ClinicCardMedia clinic={clinic} compact />
                      </span>
                    ) : null}
                    <span className="max-w-[12rem] truncate">
                      {clinic?.name ?? aff.clinicId}
                    </span>
                  </button>
                );
              })}
            </div>

            {active && activeClinic ? (
              <div
                id={`clinic-panel-${active.clinicId}`}
                role="tabpanel"
                aria-labelledby={`clinic-tab-${active.clinicId}`}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-teal-950">
                      {activeClinic.name}
                    </p>
                    <p className="text-xs text-teal-900/55">
                      {activeClinic.city} ·{" "}
                      {active.windows.length === 1
                        ? "1 bloque"
                        : `${active.windows.length} bloques`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/preview/agenda?clinic=${encodeURIComponent(active.clinicId)}`}
                      className="btn btn-secondary"
                    >
                      Abrir agenda
                    </Link>
                    <button
                      type="button"
                      className="btn btn-ghost text-red-700 hover:bg-red-50"
                      onClick={() => toggleClinic(active.clinicId)}
                    >
                      Desafiliar
                    </button>
                  </div>
                </div>

                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Días con presencia"
                >
                  {WEEKDAYS.map((d) => {
                    const on = active.windows.some((w) => w.weekday === d.value);
                    return (
                      <button
                        key={d.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setDayEnabled(active.clinicId, d.value, !on)
                        }
                        className={`inline-flex min-h-11 min-w-[2.75rem] items-center justify-center rounded-[var(--radius-control)] border px-3 text-sm font-medium transition-colors duration-[var(--dur-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] ${
                          on
                            ? "border-[color:var(--brand-forest)] bg-[color:var(--brand-foam)] text-[color:var(--brand-forest)]"
                            : "border-teal-900/12 bg-white text-teal-900/55 hover:border-teal-900/30"
                        }`}
                      >
                        {d.short}
                      </button>
                    );
                  })}
                </div>

                {active.windows.length === 0 ? (
                  <p
                    className="rounded-[var(--radius-control)] border border-teal-900/10 bg-teal-50/60 px-4 py-3 text-sm text-teal-900/75"
                    role="status"
                  >
                    Sin bloques. Activá un día arriba o usá{" "}
                    <strong>Presencia 08–20</strong>.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {WEEKDAYS.map((d) => {
                      const dayBlocks = windowsForDay(active.windows, d.value);
                      if (dayBlocks.length === 0) return null;
                      return (
                        <section
                          key={d.value}
                          className="presence-day"
                          aria-label={d.label}
                        >
                          <header className="flex min-h-11 items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-teal-950">
                              {d.label}
                            </h3>
                            <button
                              type="button"
                              className="inline-flex min-h-11 items-center text-sm font-medium text-[color:var(--brand-forest)] underline underline-offset-2"
                              onClick={() =>
                                addWindow(active.clinicId, d.value)
                              }
                            >
                              + bloque
                            </button>
                          </header>
                          <ul className="space-y-2">
                            {dayBlocks.map(({ w, index }) => (
                              <li key={`${active.clinicId}-${index}`}>
                                <div className="presence-block">
                                  <input
                                    type="time"
                                    className="field"
                                    value={w.start}
                                    aria-label={`${d.label} desde`}
                                    onChange={(e) =>
                                      patchWindow(active.clinicId, index, {
                                        start: e.target.value,
                                      })
                                    }
                                  />
                                  <span className="text-xs text-teal-900/45">
                                    –
                                  </span>
                                  <input
                                    type="time"
                                    className="field"
                                    value={w.end}
                                    aria-label={`${d.label} hasta`}
                                    onChange={(e) =>
                                      patchWindow(active.clinicId, index, {
                                        end: e.target.value,
                                      })
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="inline-flex min-h-11 items-center text-sm font-medium text-red-700 underline underline-offset-2"
                                    onClick={() =>
                                      removeWindow(active.clinicId, index)
                                    }
                                  >
                                    Quitar
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}

        <section
          className="space-y-3 border-t border-teal-900/10 pt-5"
          aria-labelledby="affiliate-heading"
        >
          <div className="space-y-1">
            <h2
              id="affiliate-heading"
              className="text-lg font-semibold text-teal-950"
            >
              Afiliar otra clínica
            </h2>
            <p className="text-sm text-teal-900/70">
              Solo sedes no afiliadas. Buscá por nombre o ciudad.
            </p>
          </div>

          <label className="flex flex-col gap-1.5 text-sm text-teal-950">
            Buscar clínica
            <input
              className="field"
              type="search"
              value={clinicQuery}
              onChange={(e) => setClinicQuery(e.target.value)}
              placeholder="Nombre, ciudad o provincia"
              autoComplete="off"
            />
          </label>

          {affiliateOptions.length === 0 ? (
            <p className="text-sm text-teal-900/60" role="status">
              {q
                ? "Ninguna clínica coincide con la búsqueda."
                : "Todas las clínicas del sandbox ya están afiliadas."}
            </p>
          ) : (
            <ul className="grid max-h-[22rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {affiliateOptions.map((clinic) => (
                <li key={clinic.id}>
                  <button
                    type="button"
                    onClick={() => toggleClinic(clinic.id)}
                    className="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-control)] border border-teal-900/12 bg-white px-3 py-2.5 text-left transition-colors duration-[var(--dur-fast)] hover:bg-[color:var(--brand-foam)]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
                  >
                    <span className="h-9 w-9 shrink-0 overflow-hidden rounded-[var(--radius-control)] border border-teal-900/10 bg-white">
                      <ClinicCardMedia clinic={clinic} compact />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-teal-950">
                        {clinic.name}
                      </span>
                      <span className="block text-xs text-teal-900/55">
                        {clinic.city} · Tocar para afiliar
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </article>
  );
}
