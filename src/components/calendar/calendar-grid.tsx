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
import type { Appointment, ExternalEvent } from "@/lib/types";
import { AppointmentDialog } from "@/components/calendar/appointment-dialog";
import { useAppointmentsRealtime } from "@/components/calendar/realtime-subscriber";

type Props = {
  resourceId: string;
  appointments: Appointment[];
  externalEvents: ExternalEvent[];
  membershipActive: boolean;
  weekStartIso?: string;
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
  externalEvents,
  membershipActive,
}: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [weekOffset, setWeekOffset] = useState(0);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useAppointmentsRealtime(resourceId, refresh);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const days = useMemo(
    () => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)),
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
    startTransition(async () => {
      const result = await createAppointment({
        startsAt: dialog.startsAt,
        endsAt: dialog.endsAt,
        patientName: input.patientName,
        patientPhone: input.patientPhone,
        notes: input.notes,
      });
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
    startTransition(async () => {
      const result = await moveAppointment({
        appointmentId: dialog.appointment.id,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDialog(null);
      refresh();
    });
  }

  function onCancel(id: string) {
    startTransition(async () => {
      const result = await cancelAppointment(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDialog(null);
      refresh();
    });
  }

  return (
    <div className="space-y-4">
      {!membershipActive ? (
        <p
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          role="status"
        >
          Tu membresía está pausada. Contactá al admin. La agenda es solo lectura.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w - 1)}
            className="rounded-md border border-teal-900/15 px-3 py-1.5 text-sm hover:bg-teal-50"
          >
            ← Semana
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="rounded-md border border-teal-900/15 px-3 py-1.5 text-sm hover:bg-teal-50"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w + 1)}
            className="rounded-md border border-teal-900/15 px-3 py-1.5 text-sm hover:bg-teal-50"
          >
            Semana →
          </button>
        </div>
        <p className="text-sm text-teal-900/70">
          {format(weekStart, "d MMM", { locale: es })} –{" "}
          {format(addDays(weekStart, 5), "d MMM yyyy", { locale: es })}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-teal-900/10 bg-white">
        <div
          className="grid min-w-[720px]"
          style={{ gridTemplateColumns: "56px repeat(6, minmax(0, 1fr))" }}
        >
          <div className="border-b border-teal-900/10 bg-teal-50/40 p-2" />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="border-b border-l border-teal-900/10 bg-teal-50/40 p-2 text-center text-xs font-medium uppercase tracking-wide text-teal-900/70"
            >
              {format(day, "EEE d", { locale: es })}
            </div>
          ))}

          {HOURS.map((minuteOfDay) => (
            <div key={minuteOfDay} className="contents">
              <div className="border-b border-teal-900/5 px-1 py-0.5 text-right text-[10px] text-teal-900/50">
                {String(Math.floor(minuteOfDay / 60)).padStart(2, "0")}:
                {String(minuteOfDay % 60).padStart(2, "0")}
              </div>
              {days.map((day) => {
                const startsAt = slotIso(day, minuteOfDay);
                const endsAt = addMinutes(parseISO(startsAt), SLOT_MINUTES).toISOString();
                const appt = active.find((a) =>
                  overlaps(a.starts_at, a.ends_at, startsAt, endsAt),
                );
                const blocked = externalEvents.some((e) =>
                  overlaps(e.starts_at, e.ends_at, startsAt, endsAt),
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
                        setDialog({ type: "edit", appointment: appt });
                        return;
                      }
                      if (!appt && !blocked) onCreateSlot(day, minuteOfDay);
                    }}
                    className={`relative h-7 border-b border-l border-teal-900/5 text-left transition ${
                      blocked
                        ? "bg-amber-50/80"
                        : appt
                          ? isApptStart
                            ? "bg-teal-700 text-white hover:bg-teal-800"
                            : "bg-teal-700/40"
                          : membershipActive
                            ? "hover:bg-teal-50"
                            : "cursor-not-allowed opacity-60"
                    }`}
                    aria-label={
                      blocked
                        ? "Bloqueo externo"
                        : appt
                          ? appt.patients_min?.full_name ?? "Turno"
                          : "Crear turno"
                    }
                    title={
                      blocked
                        ? "Bloqueo externo"
                        : appt
                          ? appt.patients_min?.full_name ?? "Turno"
                          : "Crear turno"
                    }
                  >
                    {isApptStart && appt ? (
                      <span className="block truncate px-1 text-[10px] leading-7">
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
          onClose={() => setDialog(null)}
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
