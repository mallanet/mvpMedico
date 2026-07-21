"use client";

import { FormEvent, useState } from "react";
import { createAppointment } from "@/lib/appointments";

export function AppointmentForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);
    const date = String(form.get("date"));
    const startTime = String(form.get("startTime"));
    const endTime = String(form.get("endTime"));

    const startsAt = new Date(`${date}T${startTime}:00`).toISOString();
    const endsAt = new Date(`${date}T${endTime}:00`).toISOString();

    const result = await createAppointment({
      startsAt,
      endsAt,
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
    setSuccess("Turno creado.");
    event.currentTarget.reset();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 rounded-xl border border-teal-900/10 bg-white p-4 shadow-sm"
      aria-label="Crear turno"
    >
      <h2 className="text-base font-semibold text-teal-950">Nuevo turno</h2>
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
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm sm:col-span-1">
          Paciente
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
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Notas
        <input name="notes" className="rounded-lg border px-3 py-2" />
      </label>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">{success}</p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-fit rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
      >
        {loading ? "Guardando…" : "Crear turno"}
      </button>
    </form>
  );
}
