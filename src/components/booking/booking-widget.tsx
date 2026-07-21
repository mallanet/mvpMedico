"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { bookFromLanding, listAvailableSlots } from "@/lib/appointments";
import {
  createSandboxAppointment,
  findNextSandboxDateWithSlots,
  getSandboxDoctor,
  listSandboxAvailableSlots,
} from "@/lib/preview-sandbox";
import { joinPatientName } from "@/lib/patient-name";
import { dateInputValue, nextBookableDays } from "@/lib/slots";
import type { TimeSlot } from "@/lib/types";
import { BookingConfirmation } from "@/components/booking/confirmation";
import { DayCalendar } from "@/components/booking/day-calendar";
import { SlotPicker } from "@/components/booking/slot-picker";

type Props = {
  slug: string;
  doctorName: string;
  specialty?: string;
  ctaLabel?: string;
  /** Preview sandbox: persist to localStorage under this clinic id. */
  sandboxClinicId?: string;
  /** Inside a shared panel — no second card chrome. */
  embedded?: boolean;
};

export function BookingWidget({
  slug,
  doctorName,
  specialty,
  ctaLabel = "Pedir turno",
  sandboxClinicId,
  embedded = false,
}: Props) {
  const days = useMemo(() => nextBookableDays(14), []);
  const [date, setDate] = useState(() => dateInputValue(days[0]));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selected, setSelected] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    startsAt: string;
    endsAt: string;
    patientName: string;
    bookingCode?: string;
  } | null>(null);
  const [sandboxMeta, setSandboxMeta] = useState<{
    displayName: string;
    specialty: string;
  } | null>(null);
  const didInitDate = useRef(false);

  useEffect(() => {
    if (!sandboxClinicId) return;
    const doctor = getSandboxDoctor();
    setSandboxMeta({
      displayName: doctor.displayName,
      specialty: doctor.specialty,
    });
  }, [sandboxClinicId]);

  const resolvedDoctorName = sandboxMeta?.displayName ?? doctorName;
  const resolvedSpecialty = sandboxMeta?.specialty ?? specialty;

  const dayHasOpenings = useMemo(() => {
    if (!sandboxClinicId) return undefined;
    const cache = new Map<string, boolean>();
    for (const day of nextBookableDays(45)) {
      const iso = dateInputValue(day);
      const result = listSandboxAvailableSlots(sandboxClinicId, iso);
      cache.set(iso, result.ok && result.slots.length > 0);
    }
    return (iso: string) => cache.get(iso) ?? false;
  }, [sandboxClinicId]);

  // Client-only: land on a day that actually has openings (avoids hydration mismatch)
  useEffect(() => {
    if (!sandboxClinicId || didInitDate.current) return;
    didInitDate.current = true;
    const next = findNextSandboxDateWithSlots(sandboxClinicId, days);
    if (next) setDate(next);
  }, [sandboxClinicId, days]);

  useEffect(() => {
    let cancelled = false;
    setLoadingSlots(true);
    setSelected(null);
    setError(null);

    if (sandboxClinicId) {
      const result = listSandboxAvailableSlots(sandboxClinicId, date);
      if (!cancelled) {
        if (!result.ok) {
          setError(result.error);
          setSlots([]);
        } else {
          setSlots(result.slots);
        }
        setLoadingSlots(false);
      }
      return () => {
        cancelled = true;
      };
    }

    void listAvailableSlots({ slug, date }).then((result) => {
      if (cancelled) return;
      setLoadingSlots(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSlots(result.slots);
    });

    return () => {
      cancelled = true;
    };
  }, [slug, date, sandboxClinicId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      setError("Elegí un horario disponible.");
      return;
    }
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const patientName = joinPatientName(
      String(form.get("patientFirstName") ?? ""),
      String(form.get("patientLastName") ?? ""),
    );
    const patientPhone = String(form.get("patientPhone"));
    const patientEmail = String(form.get("patientEmail") || "") || undefined;
    const notes = String(form.get("notes") || "") || undefined;

    if (!patientName) {
      setLoading(false);
      setError("Completá nombre y apellido.");
      return;
    }

    if (sandboxClinicId) {
      const result = createSandboxAppointment(sandboxClinicId, {
        startsAt: selected.startsAt,
        endsAt: selected.endsAt,
        patientName,
        patientPhone,
        patientEmail,
        notes,
      });
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setConfirmed({
        startsAt: selected.startsAt,
        endsAt: selected.endsAt,
        patientName,
      });
      return;
    }

    const result = await bookFromLanding({
      slug,
      startsAt: selected.startsAt,
      endsAt: selected.endsAt,
      patientName,
      patientPhone,
      patientEmail,
      notes,
    });

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setConfirmed({
      startsAt: selected.startsAt,
      endsAt: selected.endsAt,
      patientName,
      bookingCode: result.ok ? result.code : undefined,
    });
  }

  if (confirmed) {
    return (
      <div className="space-y-4">
        <BookingConfirmation
          doctorName={resolvedDoctorName}
          specialty={resolvedSpecialty}
          patientName={confirmed.patientName}
          startsAt={confirmed.startsAt}
          endsAt={confirmed.endsAt}
          isDemo={Boolean(sandboxClinicId) || Boolean(confirmed.bookingCode)}
          bookingCode={confirmed.bookingCode}
        />
        {sandboxClinicId ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href={`/preview/agenda?clinic=${encodeURIComponent(sandboxClinicId)}`}
              className="btn btn-primary w-full"
            >
              Ver agenda de la clínica
            </Link>
            <Link
              href="/preview/doctor/calendar"
              className="btn btn-secondary w-full"
            >
              Calendario master
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={
        embedded
          ? "grid gap-4"
          : "grid gap-4 rounded-[var(--radius-panel)] border border-teal-900/10 bg-white/90 p-5 shadow-sm sm:p-6"
      }
      aria-label={ctaLabel}
    >
      <div className="space-y-1">
        {resolvedSpecialty ? (
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-800/70">
            {resolvedSpecialty}
          </p>
        ) : null}
        <h2 className="text-lg font-semibold text-teal-950">{ctaLabel}</h2>
        <p className="text-sm text-teal-900/65">
          Con {resolvedDoctorName}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-teal-950">Fecha</legend>
        <DayCalendar
          selected={date}
          onSelect={setDate}
          hasOpenings={dayHasOpenings}
        />
      </fieldset>

      <SlotPicker
        slots={slots}
        selected={selected}
        loading={loadingSlots}
        onSelect={setSelected}
      />

      {!loadingSlots && slots.length === 0 && !error && sandboxClinicId ? (
        <p className="text-sm text-[color:var(--foreground)]/70" role="status">
          No hay horarios libres ese día. Probá otra fecha o ajustá bloques en
          el{" "}
          <Link
            href="/preview/doctor"
            className="font-medium text-[color:var(--brand-forest)] underline underline-offset-2"
          >
            panel doctor
          </Link>
          .
        </p>
      ) : null}

      {selected ? (
        <p className="rounded-[var(--radius-control)] bg-[color:var(--brand-foam)] px-3 py-2 text-sm text-[color:var(--foreground)]">
          Horario elegido:{" "}
          <strong>
            {format(parseISO(selected.startsAt), "EEE d MMM · HH:mm", {
              locale: es,
            })}
            –{format(parseISO(selected.endsAt), "HH:mm", { locale: es })}
          </strong>
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm text-teal-950">
          Nombre
          <input
            name="patientFirstName"
            required
            autoComplete="given-name"
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-teal-950">
          Apellido
          <input
            name="patientLastName"
            required
            autoComplete="family-name"
            className="field"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm text-teal-950">
        Teléfono
        <input
          name="patientPhone"
          type="tel"
          required
          autoComplete="tel"
          inputMode="tel"
          className="field"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm text-teal-950">
        Email (opcional)
        <input
          name="patientEmail"
          type="email"
          autoComplete="email"
          className="field"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm text-teal-950">
        Motivo / notas
        <textarea name="notes" rows={2} className="field min-h-[4.5rem] resize-y" />
      </label>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}{" "}
          {error.includes("panel del doctor") || error.includes("afiliada") ? (
            <Link
              href="/preview/doctor"
              className="font-medium underline underline-offset-2"
            >
              Abrir panel doctor
            </Link>
          ) : null}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || !selected}
        className="btn btn-primary w-full"
      >
        {loading
          ? "Confirmando…"
          : selected
            ? "Confirmar turno"
            : "Elegí un horario para confirmar"}
      </button>
    </form>
  );
}
