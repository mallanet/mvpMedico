/**
 * Conservative no-show loss / recovery model for the marketing calculator.
 *
 * Sources (also exposed in UI):
 * - Dantas et al., Health Policy 2018 — SLR average no-show ~23% globally.
 * - Cochrane CD007458 — SMS reminders vs none: attendance RR ~1.14;
 *   pooled attendance 67.8% → 78.6% (~33% relative drop in no-shows).
 * We default below those ceilings (18% rate, 25% recovery) so projections stay conservative.
 */

export const WAIRA_MEMBERSHIP_USD = 100;

/** Suggested default under industry SLR average (~23%). */
export const DEFAULT_NO_SHOW_RATE = 0.18;

/** Industry reference shown in help copy. */
export const INDUSTRY_NO_SHOW_RATE_REF = 0.23;

/** Primary recovery of lost no-show revenue (conservative vs ~33% Cochrane-implied). */
export const RECOVERY_RATE_PRIMARY = 0.25;

/** Low band: reminders-only floor. */
export const RECOVERY_RATE_LOW = 0.2;

/** High band: reminders + prepago / waitlist ceiling (+5 pp over primary). */
export const RECOVERY_RATE_HIGH = 0.3;

export const DEFAULT_WORKDAYS_PER_WEEK = 5;
export const DEFAULT_WEEKS_PER_MONTH = 4.3;
export const DEFAULT_MINUTES_PER_CONSULT = 30;
export const DEFAULT_FEE_USD = 40;
export const DEFAULT_SCHEDULED_PER_DAY = 10;

export type NoShowInputMode = "rate" | "direct";

export type NoShowCalculatorInput = {
  feeUsd: number;
  /** Appointments scheduled per day (used when mode === "rate"). */
  scheduledPerDay: number;
  /** Known no-shows per day (used when mode === "direct"). */
  noShowsPerDayDirect: number;
  mode: NoShowInputMode;
  noShowRate: number;
  workdaysPerWeek: number;
  weeksPerMonth: number;
  minutesPerConsult: number;
};

export type NoShowPeriodTotals = {
  noShows: number;
  lossUsd: number;
};

export type NoShowCalculatorResult = {
  noShowsDay: number;
  day: NoShowPeriodTotals;
  week: NoShowPeriodTotals;
  month: NoShowPeriodTotals;
  recoveredMonthPrimaryUsd: number;
  recoveredMonthLowUsd: number;
  recoveredMonthHighUsd: number;
  recoveredNoShowsMonth: number;
  minutesFreedMonth: number;
  netVsWairaUsd: number;
  roiMultiple: number;
};

export const MODEL_SOURCES = [
  {
    id: "dantas-2018",
    label: "Dantas et al., Health Policy (2018)",
    detail:
      "Revisión sistemática: tasa media de no-show del orden del 23% a nivel global.",
    href: "https://doi.org/10.1016/j.healthpol.2018.02.002",
  },
  {
    id: "cochrane-sms",
    label: "Cochrane CD007458 (SMS reminders)",
    detail:
      "Recordatorios SMS vs ninguno: RR de asistencia ~1.14; asistencia pooled 67.8% → 78.6% (caída relativa de no-shows ~33%). Usamos 25% como escenario principal conservador.",
    href: "https://www.cochrane.org/evidence/CD007458_mobile-phone-messaging-reminders-attendance-healthcare-appointments",
  },
] as const;

function clampNonNegative(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return DEFAULT_NO_SHOW_RATE;
  return Math.min(1, Math.max(0, rate));
}

export function resolveNoShowsPerDay(input: NoShowCalculatorInput): number {
  if (input.mode === "direct") {
    return clampNonNegative(input.noShowsPerDayDirect);
  }
  return (
    clampNonNegative(input.scheduledPerDay) * clampRate(input.noShowRate)
  );
}

export function computeNoShowImpact(
  input: NoShowCalculatorInput,
): NoShowCalculatorResult {
  const fee = clampNonNegative(input.feeUsd);
  const workdays = clampNonNegative(input.workdaysPerWeek) || DEFAULT_WORKDAYS_PER_WEEK;
  const weeks =
    clampNonNegative(input.weeksPerMonth) || DEFAULT_WEEKS_PER_MONTH;
  const minutes =
    clampNonNegative(input.minutesPerConsult) || DEFAULT_MINUTES_PER_CONSULT;

  const noShowsDay = resolveNoShowsPerDay(input);
  const lossDay = noShowsDay * fee;
  const noShowsWeek = noShowsDay * workdays;
  const lossWeek = lossDay * workdays;
  const noShowsMonth = noShowsWeek * weeks;
  const lossMonth = lossWeek * weeks;

  const recoveredMonthPrimaryUsd = lossMonth * RECOVERY_RATE_PRIMARY;
  const recoveredMonthLowUsd = lossMonth * RECOVERY_RATE_LOW;
  const recoveredMonthHighUsd = lossMonth * RECOVERY_RATE_HIGH;
  const recoveredNoShowsMonth = noShowsMonth * RECOVERY_RATE_PRIMARY;

  return {
    noShowsDay,
    day: { noShows: noShowsDay, lossUsd: lossDay },
    week: { noShows: noShowsWeek, lossUsd: lossWeek },
    month: { noShows: noShowsMonth, lossUsd: lossMonth },
    recoveredMonthPrimaryUsd,
    recoveredMonthLowUsd,
    recoveredMonthHighUsd,
    recoveredNoShowsMonth,
    minutesFreedMonth: recoveredNoShowsMonth * minutes,
    netVsWairaUsd: recoveredMonthPrimaryUsd - WAIRA_MEMBERSHIP_USD,
    roiMultiple:
      WAIRA_MEMBERSHIP_USD > 0
        ? recoveredMonthPrimaryUsd / WAIRA_MEMBERSHIP_USD
        : 0,
  };
}

/** Fixed case used in specs / verification: fee 40, 10/day, 18%. */
export const VERIFICATION_CASE_INPUT: NoShowCalculatorInput = {
  feeUsd: DEFAULT_FEE_USD,
  scheduledPerDay: DEFAULT_SCHEDULED_PER_DAY,
  noShowsPerDayDirect: 0,
  mode: "rate",
  noShowRate: DEFAULT_NO_SHOW_RATE,
  workdaysPerWeek: DEFAULT_WORKDAYS_PER_WEEK,
  weeksPerMonth: DEFAULT_WEEKS_PER_MONTH,
  minutesPerConsult: DEFAULT_MINUTES_PER_CONSULT,
};

/** Expected: 1.8 no-shows/day → $72/day → $360/week → $1548/month; recover $387. */
export function expectedVerificationCase(): NoShowCalculatorResult {
  return computeNoShowImpact(VERIFICATION_CASE_INPUT);
}

export function formatUsd(amount: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(amount);
}

export function formatNumber(n: number, fractionDigits = 1): string {
  return new Intl.NumberFormat("es-EC", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
  }).format(n);
}
