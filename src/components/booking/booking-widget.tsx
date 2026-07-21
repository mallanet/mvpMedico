"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { bookFromLanding, listAvailableSlots } from "@/lib/appointments";
import { dateInputValue, nextBookableDays } from "@/lib/slots";
import type { TimeSlot } from "@/lib/types";
import { BookingConfirmation } from "@/components/booking/confirmation";
import { SlotPicker } from "@/components/booking/slot-picker";

type Props = {
  slug: string;
  doctorName: string;
};

export function BookingWidget({ slug, doctorName }: Props) {
  const days = useMemo(() => nextBookableDays(14), []);
  const [date, setDate] = useState(dateInputValue(days[0]));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selected, setSelected] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    startsAt: string;
    endsAt: string;
    patientName: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingSlots(true);
    setSelected(null);
    setError(null);

    void listAvailableSlots({ slug, date }).then((result) => {
      if (cancelled) return;
      setLoadingSlots(false);
      if (!result.ok) {
        setError(result.error);
        setSlots([]);
        return;
      }
      setSlots(result.slots);
    });

    return () => {
      cancelled = true;
    };
  }, [slug, date]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      setError("Elegí un horario disponible.");
      return;
    }
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    const result = await bookFromLanding({
      slug,
      startsAt: selected.startsAt,
      endsAt: selected.endsAt,
      patientName: String(form.get("patientName")),
      patientPhone: String(form.get("patientPhone")),
      patientEmail: String(form.get("patientEmail") || "") || undefined,
      notes: String(form.get("notes") || "") || undefined,
    });

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setConfirmed({
      startsAt: selected.startsAt,
      endsAt: selected.endsAt,
      patientName: String(form.get("patientName")),
    });
  }

  if (confirmed) {
    return (
      <BookingConfirmation
        doctorName={doctorName}
        patientName={confirmed.patientName}
        startsAt={confirmed.startsAt}
        endsAt={confirmed.endsAt}
      />
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-sm"
      aria-label="Pedir turno"
    >
      <h2 className="text-lg font-semibold text-stone-900">Pedir turno</h2>

      <label className="flex flex-col gap-1 text-sm">
        Fecha
        <select
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border px-3 py-2"
        >
          {days.map((day) => {
            const value = dateInputValue(day);
            return (
              <option key={value} value={value}>
                {format(day, "EEEE d MMM", { locale: es })}
              </option>
            );
          })}
        </select>
      </label>

      <SlotPicker
        slots={slots}
        selected={selected}
        loading={loadingSlots}
        onSelect={setSelected}
      />

      {selected ? (
        <p className="text-sm text-stone-600">
          Seleccionado:{" "}
          {format(parseISO(selected.startsAt), "HH:mm", { locale: es })}–
          {format(parseISO(selected.endsAt), "HH:mm", { locale: es })}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        Tu nombre
        <input name="patientName" required className="rounded-lg border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Teléfono
        <input name="patientPhone" required className="rounded-lg border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Email (opcional)
        <input name="patientEmail" type="email" className="rounded-lg border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Motivo / notas
        <input name="notes" className="rounded-lg border px-3 py-2" />
      </label>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || !selected}
        className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
      >
        {loading ? "Enviando…" : "Confirmar pedido"}
      </button>
    </form>
  );
}
