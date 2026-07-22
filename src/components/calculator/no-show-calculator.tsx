"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DEFAULT_FEE_USD,
  DEFAULT_MINUTES_PER_CONSULT,
  DEFAULT_NO_SHOW_RATE,
  DEFAULT_WEEKS_PER_MONTH,
  DEFAULT_WORKDAYS_PER_WEEK,
  INDUSTRY_NO_SHOW_RATE_REF,
  MODEL_SOURCES,
  RECOVERY_RATE_HIGH,
  RECOVERY_RATE_LOW,
  RECOVERY_RATE_PRIMARY,
  WAIRA_MEMBERSHIP_USD,
  computeNoShowImpact,
  formatNumber,
  formatUsd,
} from "@/lib/calculator/no-show-model";

type Mode = "teaser" | "full";

const fieldClass =
  "field w-full px-3 text-sm text-teal-950 tabular-nums outline-none focus:border-teal-800";

const DEFAULT_NO_SHOWS_PER_DAY = 2;

function parsePositive(value: string, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function CtaButtons({ isTeaser }: { isTeaser: boolean }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/signup" className="btn btn-primary">
        Quiero recuperar ese dinero
      </Link>
      {isTeaser ? (
        <Link href="/calculadora" className="btn btn-secondary">
          Ver cómo funciona
        </Link>
      ) : (
        <Link href="/preview" className="btn btn-secondary">
          Ver cómo funciona
        </Link>
      )}
    </div>
  );
}

export function NoShowCalculator({ mode }: { mode: Mode }) {
  const [fee, setFee] = useState(String(DEFAULT_FEE_USD));
  const [noShowsDirect, setNoShowsDirect] = useState(
    String(DEFAULT_NO_SHOWS_PER_DAY),
  );
  const [workdays, setWorkdays] = useState(String(DEFAULT_WORKDAYS_PER_WEEK));
  const [weeks, setWeeks] = useState(String(DEFAULT_WEEKS_PER_MONTH));
  const [minutes, setMinutes] = useState(String(DEFAULT_MINUTES_PER_CONSULT));

  const result = useMemo(() => {
    return computeNoShowImpact({
      feeUsd: parsePositive(fee, DEFAULT_FEE_USD),
      scheduledPerDay: 0,
      noShowsPerDayDirect: parsePositive(
        noShowsDirect,
        DEFAULT_NO_SHOWS_PER_DAY,
      ),
      mode: "direct",
      noShowRate: DEFAULT_NO_SHOW_RATE,
      workdaysPerWeek: parsePositive(workdays, DEFAULT_WORKDAYS_PER_WEEK),
      weeksPerMonth: parsePositive(weeks, DEFAULT_WEEKS_PER_MONTH),
      minutesPerConsult: parsePositive(minutes, DEFAULT_MINUTES_PER_CONSULT),
    });
  }, [fee, noShowsDirect, workdays, weeks, minutes]);

  const isTeaser = mode === "teaser";
  const industryLowPct = Math.round(DEFAULT_NO_SHOW_RATE * 100);
  const industryHighPct = Math.round(INDUSTRY_NO_SHOW_RATE_REF * 100);
  const recoveryLowPct = Math.round(RECOVERY_RATE_LOW * 100);
  const recoveryHighPct = Math.round(RECOVERY_RATE_HIGH * 100);
  const recoveryPrimaryPct = Math.round(RECOVERY_RATE_PRIMARY * 100);

  return (
    <div className={isTeaser ? "space-y-6" : "space-y-10"}>
      <div
        className={`grid gap-6 ${isTeaser ? "lg:grid-cols-[1fr_1fr] lg:items-start" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-10"}`}
      >
        <div className="space-y-4">
          <form
            className="space-y-4 rounded-[var(--radius-panel)] border border-teal-900/10 bg-white/90 p-5 shadow-sm sm:p-6"
            onSubmit={(e) => e.preventDefault()}
            aria-label="Calculadora de no-shows"
          >
            <div className="space-y-1">
              <label htmlFor="fee" className="text-sm font-medium text-teal-950">
                Tarifa por consulta (USD)
              </label>
              <input
                id="fee"
                className={fieldClass}
                type="number"
                min={0}
                step={1}
                inputMode="decimal"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="noshows-direct"
                className="text-sm font-medium text-teal-950"
              >
                Citas que no llegan por día (aprox.)
              </label>
              <input
                id="noshows-direct"
                className={fieldClass}
                type="number"
                min={0}
                step={0.5}
                inputMode="decimal"
                value={noShowsDirect}
                onChange={(e) => setNoShowsDirect(e.target.value)}
              />
              <p className="text-xs leading-relaxed text-teal-900/60">
                Referencia de industria: tasa típica ~{industryLowPct}–
                {industryHighPct}% de las citas agendadas (dato informativo; no
                hace falta calcularlo aquí).
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label
                  htmlFor="workdays"
                  className="text-sm font-medium text-teal-950"
                >
                  Días / semana
                </label>
                <input
                  id="workdays"
                  className={fieldClass}
                  type="number"
                  min={1}
                  max={7}
                  step={1}
                  value={workdays}
                  onChange={(e) => setWorkdays(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="weeks"
                  className="text-sm font-medium text-teal-950"
                >
                  Semanas / mes
                </label>
                <input
                  id="weeks"
                  className={fieldClass}
                  type="number"
                  min={1}
                  max={5}
                  step={0.1}
                  value={weeks}
                  onChange={(e) => setWeeks(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="minutes"
                  className="text-sm font-medium text-teal-950"
                >
                  Min / consulta
                </label>
                <input
                  id="minutes"
                  className={fieldClass}
                  type="number"
                  min={5}
                  max={180}
                  step={5}
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />
              </div>
            </div>
          </form>

          <CtaButtons isTeaser={isTeaser} />
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-teal-950">
              Esto es lo que pierdes hoy, sin Waira
            </p>
            <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums tracking-tight text-teal-950">
              {formatNumber(result.month.noShows, 0)}{" "}
              <span className="text-lg font-medium text-teal-800/85">
                citas fantasma al mes
              </span>
            </p>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-teal-900/60">Pérdida / día</dt>
                <dd className="font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums tracking-tight text-teal-950">
                  {formatUsd(result.day.lossUsd)}
                </dd>
                <dd className="text-xs text-teal-900/55">
                  {formatNumber(result.day.noShows)} no-shows
                </dd>
              </div>
              <div>
                <dt className="text-xs text-teal-900/60">Pérdida / semana</dt>
                <dd className="font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums tracking-tight text-teal-950">
                  {formatUsd(result.week.lossUsd)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-teal-900/60">Pérdida / mes</dt>
                <dd className="font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums tracking-tight text-teal-950">
                  {formatUsd(result.month.lossUsd)}
                </dd>
              </div>
            </dl>
            <p className="text-sm font-semibold leading-relaxed text-red-700">
              {formatUsd(result.month.lossUsd)} que se van solos, cada mes, sin
              que hagas nada
            </p>
          </div>

          <div className="border-t border-teal-900/10 pt-4 space-y-3">
            <p className="text-sm font-medium text-teal-950">
              Esto es lo que recuperas con Waira
            </p>
            <p className="text-xs leading-relaxed text-teal-900/60">
              Con recordatorios de pago automáticos antes de cada cita, se
              recupera en promedio entre {recoveryLowPct}% y {recoveryHighPct}%
              de esa pérdida. Usamos el escenario conservador:{" "}
              {recoveryPrimaryPct}%.
            </p>
            <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums tracking-tight text-teal-950">
              {formatUsd(result.recoveredMonthPrimaryUsd)}{" "}
              <span className="text-lg font-medium text-teal-800/85">
                recuperados cada mes
              </span>
              <span className="ml-2 text-base font-medium text-teal-800/70">
                ({formatNumber(result.recoveredNoShowsMonth, 0)} pacientes)
              </span>
            </p>
            <p className="text-sm text-teal-900/70">
              Banda realista: {formatUsd(result.recoveredMonthLowUsd)}–
              {formatUsd(result.recoveredMonthHighUsd)}/mes. Además, liberas ~
              {formatNumber(result.minutesFreedMonth, 0)} minutos de tu agenda
              sin mover un dedo.
            </p>
            <p className="text-sm leading-relaxed text-teal-900/90">
              Waira cuesta {formatUsd(WAIRA_MEMBERSHIP_USD)}/mes. Te devuelve
              hasta{" "}
              <span className="font-semibold tabular-nums text-teal-950">
                {formatUsd(result.recoveredMonthPrimaryUsd)}
              </span>
              . Ganancia neta:{" "}
              <span className="font-semibold tabular-nums text-teal-950">
                {formatUsd(result.netVsWairaUsd)}
              </span>{" "}
              al mes — {formatNumber(result.roiMultiple, 1)} veces lo que
              inviertes.
            </p>
          </div>
        </div>
      </div>

      {!isTeaser ? (
        <>
          <section
            aria-labelledby="flow-heading"
            className="space-y-5 border-t border-teal-900/10 pt-10"
          >
            <div className="max-w-2xl space-y-2">
              <h2
                id="flow-heading"
                className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-teal-950"
              >
                Cómo lo recuperas
              </h2>
              <p className="text-sm leading-relaxed text-teal-900/70">
                Flujo objetivo del sistema de recordatorios (proyección; no
                implica que estos canales ya estén activos en tu cuenta hoy).
              </p>
            </div>
            <ol className="divide-y divide-teal-900/10 border-y border-teal-900/10">
              {[
                {
                  title: "Al reservar — pago para confirmar",
                  body: "Recordatorio de pagar antes de la cita (o depósito) para confirmar el cupo.",
                },
                {
                  title: "6 h y 3 h antes — reconfirmar",
                  body: "Volver a confirmar asistencia y recordar el pago si aún no se hizo. Si no pueden ir, cancelan a tiempo.",
                },
                {
                  title: "~1 h antes — pago en persona",
                  body: "Si van a pagar en el consultorio, aviso cercano a la hora para reducir olvidos de último minuto.",
                },
                {
                  title: "Cancelación → lista de espera",
                  body: "El cupo se libera y se avisa a la lista de espera. Quien toma el turno confirma pagando antes de la cita.",
                },
              ].map((step, i) => (
                <li
                  key={step.title}
                  className="grid gap-2 py-5 sm:grid-cols-[3rem_1fr] sm:gap-6"
                >
                  <span className="font-[family-name:var(--font-display)] text-xl font-semibold tabular-nums text-teal-800">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-medium text-teal-950">
                      {step.title}
                    </h3>
                    <p className="max-w-xl text-sm leading-relaxed text-teal-900/70">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section
            aria-labelledby="sources-heading"
            className="space-y-4 border-t border-teal-900/10 pt-10"
          >
            <h2
              id="sources-heading"
              className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-teal-950"
            >
              Fuentes y disclaimer
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-teal-900/70">
              Estimación educativa basada en literatura publicada. Los
              resultados de tu consultorio pueden variar. La banda alta (+5 pp)
              contempla prepago / waitlist de forma ilustrativa; el número
              principal usa solo el escenario conservador de recordatorios.
            </p>
            <ul className="max-w-2xl space-y-3 text-sm text-teal-900/75">
              {MODEL_SOURCES.map((source) => (
                <li key={source.id}>
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-teal-900 underline decoration-teal-900/25 underline-offset-2 hover:decoration-teal-900/60"
                  >
                    {source.label}
                  </a>
                  <p className="mt-0.5 text-teal-900/65">{source.detail}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
