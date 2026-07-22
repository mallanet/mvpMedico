"use client";

import {
  addDays,
  addMinutes,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  cancelAppointment,
  createAppointment,
  moveAppointment,
} from "@/lib/appointments";
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  SLOT_MINUTES,
} from "@/lib/slots";
import type { Appointment } from "@/lib/types";
import { AppointmentDialog } from "@/components/calendar/appointment-dialog";
import { useAppointmentsRealtime } from "@/components/calendar/realtime-subscriber";

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export type CalendarMutations = {
  create: (input: {
    startsAt: string;
    endsAt: string;
    patientName: string;
    patientPhone: string;
    notes?: string;
  }) => Promise<ActionResult>;
  move: (input: {
    appointmentId: string;
    startsAt: string;
    endsAt: string;
  }) => Promise<ActionResult>;
  cancel: (appointmentId: string) => Promise<ActionResult>;
};

type Props = {
  resourceId: string;
  appointments: Appointment[];
  membershipActive: boolean;
  weekStartIso?: string;
  /** When set, skips Supabase realtime and uses these instead of server actions. */
  mutations?: CalendarMutations;
  enableRealtime?: boolean;
  onMutated?: () => void;
};

type DialogMode =
  | { type: "create"; startsAt: string; endsAt: string }
  | { type: "edit"; appointment: Appointment }
  | null;

const HOURS = Array.from(
  { length: ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES },
  (_, i) => DAY_START_HOUR * 60 + i * SLOT_MINUTES,
);

function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function CalendarGrid({
  resourceId,
  appointments,
  membershipActive,
  mutations,
  enableRealtime = true,
  onMutated,
}: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [weekOffset, setWeekOffset] = useState(0);

  const refresh = useCallback(() => {
    if (onMutated) {
      onMutated();
      return;
    }
    router.refresh();
  }, [router, onMutated]);

  useAppointmentsRealtime(
    enableRealtime && !mutations ? resourceId : "",
    refresh,
  );

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const active = appointments.filter((a) => a.status !== "cancelled");

  function slotIso(day: Date, minuteOfDay: number): string {
    const d = new Date(day);
    d.setHours(Math.floor(minuteOfDay / 60), minuteOfDay % 60, 0, 0);
    return d.toISOString();
  }

  function onCreateSlot(day: Date, minuteOfDay: number) {
    if (!membershipActive) {
      setError("Tu membresía está pausada. Contactá al admin.");
      return;
    }
    const startsAt = slotIso(day, minuteOfDay);
    const endsAt = addMinutes(parseISO(startsAt), SLOT_MINUTES).toISOString();
    setError(null);
    setDialog({ type: "create", startsAt, endsAt });
  }

  function onSubmitCreate(input: {
    patientName: string;
    patientPhone: string;
    notes?: string;
  }) {
    if (!dialog || dialog.type !== "create") return;
    setError(null);
    startTransition(async () => {
      const payload = {
        startsAt: dialog.startsAt,
        endsAt: dialog.endsAt,
        patientName: input.patientName,
        patientPhone: input.patientPhone,
        notes: input.notes,
      };
      const result = mutations
        ? await mutations.create(payload)
        : await createAppointment(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDialog(null);
      refresh();
    });
  }

  function onSubmitMove(input: { startsAt: string; endsAt: string }) {
    if (!dialog || dialog.type !== "edit") return;
    setError(null);
    startTransition(async () => {
      const payload = {
        appointmentId: dialog.appointment.id,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      };
      const result = mutations
        ? await mutations.move(payload)
        : await moveAppointment(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDialog(null);
      refresh();
    });
  }

  function onCancel(id: string) {
    setError(null);
    startTransition(async () => {
      const result = mutations
        ? await mutations.cancel(id)
        : await cancelAppointment(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDialog(null);
      refresh();
    });
  }

  return (
    <div className="cal space-y-4">
      {!membershipActive ? (
        <p className="cal-banner cal-banner--paused" role="status">
          Tu membresía está pausada. La agenda es solo lectura; pedile al admin
          que la reactive.
        </p>
      ) : null}

      {error && !dialog ? (
        <p className="cal-banner cal-banner--error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w - 1)}
            className="cal-nav-btn"
          >
            ← Semana
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="cal-nav-btn"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w + 1)}
            className="cal-nav-btn"
          >
            Semana →
          </button>
        </div>
        <p className="cal-range">
          {format(weekStart, "d MMM", { locale: es })} –{" "}
          {format(addDays(weekStart, 5), "d MMM yyyy", { locale: es })}
        </p>
      </div>

      <div className="cal-board">
        <div
          className="grid min-w-[720px]"
          style={{ gridTemplateColumns: "56px repeat(6, minmax(0, 1fr))" }}
        >
          <div className="cal-head" />
          {days.map((day) => (
            <div key={day.toISOString()} className="cal-head cal-head--day">
              {format(day, "EEE d", { locale: es })}
            </div>
          ))}

          {HOURS.map((minuteOfDay) => (
            <div key={minuteOfDay} className="contents">
              <div className="cal-time">
                {String(Math.floor(minuteOfDay / 60)).padStart(2, "0")}:
                {String(minuteOfDay % 60).padStart(2, "0")}
              </div>
              {days.map((day) => {
                const startsAt = slotIso(day, minuteOfDay);
                const endsAt = addMinutes(parseISO(startsAt), SLOT_MINUTES).toISOString();
                const appt = active.find((a) =>
                  overlaps(a.starts_at, a.ends_at, startsAt, endsAt),
                );
                const isApptStart =
                  appt &&
                  parseISO(appt.starts_at).getTime() === parseISO(startsAt).getTime();

                return (
                  <button
                    key={`${day.toISOString()}-${minuteOfDay}`}
                    type="button"
                    disabled={pending || (!!appt && !isApptStart)}
                    onClick={() => {
                      if (appt && isApptStart) {
                        setError(null);
                        setDialog({ type: "edit", appointment: appt });
                        return;
                      }
                      if (!appt) onCreateSlot(day, minuteOfDay);
                    }}
                    className={[
                      "cal-slot",
                      appt && isApptStart ? "cal-slot--appt" : "",
                      appt && !isApptStart ? "cal-slot--appt-cont" : "",
                      !appt && membershipActive ? "cal-slot--free" : "",
                      !appt && !membershipActive ? "cal-slot--locked" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-label={
                      appt
                        ? appt.patients_min?.full_name ?? "Turno"
                        : "Crear turno"
                    }
                    title={
                      appt
                        ? appt.patients_min?.full_name ?? "Turno"
                        : "Crear turno"
                    }
                  >
                    {isApptStart && appt ? (
                      <span className="cal-slot__label">
                        {appt.patients_min?.full_name ?? "Turno"}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {dialog ? (
        <AppointmentDialog
          mode={dialog.type}
          startsAt={
            dialog.type === "create"
              ? dialog.startsAt
              : dialog.appointment.starts_at
          }
          endsAt={
            dialog.type === "create" ? dialog.endsAt : dialog.appointment.ends_at
          }
          patientName={
            dialog.type === "edit"
              ? (dialog.appointment.patients_min?.full_name ?? "")
              : ""
          }
          patientPhone={
            dialog.type === "edit"
              ? (dialog.appointment.patients_min?.phone ?? "")
              : ""
          }
          notes={dialog.type === "edit" ? (dialog.appointment.notes ?? "") : ""}
          pending={pending}
          membershipActive={membershipActive}
          error={error}
          onClose={() => {
            setError(null);
            setDialog(null);
          }}
          onCreate={onSubmitCreate}
          onMove={onSubmitMove}
          onCancel={
            dialog.type === "edit"
              ? () => onCancel(dialog.appointment.id)
              : undefined
          }
        />
      ) : null}
    </div>
  );
}
