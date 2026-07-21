"use client";

import { FormEvent, useState } from "react";
import { bookFromLanding } from "@/lib/appointments";

export function BookingForm({ slug }: { slug: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const form = new FormData(event.currentTarget);
    const date = String(form.get("date"));
    const startTime = String(form.get("startTime"));
    const endTime = String(form.get("endTime"));

    const result = await bookFromLanding({
      slug,
      startsAt: new Date(`${date}T${startTime}:00`).toISOString(),
      endsAt: new Date(`${date}T${endTime}:00`).toISOString(),
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
    setSuccess(true);
    event.currentTarget.reset();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 rounded-2xl border border-stone-200 bg-white/90 p-5 shadow-sm"
      aria-label="Pedir turno"
    >
      <h2 className="text-lg font-semibold text-stone-900">Pedir turno</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Fecha
          <input name="date" type="date" required className="rounded-lg border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Inicio
          <input name="startTime" type="time" required className="rounded-lg border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Fin
          <input name="endTime" type="time" required className="rounded-lg border px-3 py-2" />
        </label>
      </div>
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
      {success ? (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
          Turno solicitado. Te van a contactar para confirmar.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
      >
        {loading ? "Enviando…" : "Confirmar pedido"}
      </button>
    </form>
  );
}
