"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { FormEvent, useState } from "react";
import { SLOT_MINUTES } from "@/lib/slots";
import { addMinutes } from "date-fns";

type Props = {
  mode: "create" | "edit";
  startsAt: string;
  endsAt: string;
  patientName: string;
  patientPhone: string;
  notes: string;
  pending: boolean;
  membershipActive: boolean;
  onClose: () => void;
  onCreate: (input: {
    patientName: string;
    patientPhone: string;
    notes?: string;
  }) => void;
  onMove: (input: { startsAt: string; endsAt: string }) => void;
  onCancel?: () => void;
};

export function AppointmentDialog({
  mode,
  startsAt,
  endsAt,
  patientName,
  patientPhone,
  notes,
  pending,
  membershipActive,
  onClose,
  onCreate,
  onMove,
  onCancel,
}: Props) {
  const [localStart, setLocalStart] = useState(
    format(parseISO(startsAt), "yyyy-MM-dd'T'HH:mm"),
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!membershipActive) return;
    const form = new FormData(event.currentTarget);

    if (mode === "create") {
      onCreate({
        patientName: String(form.get("patientName")),
        patientPhone: String(form.get("patientPhone")),
        notes: String(form.get("notes") || "") || undefined,
      });
      return;
    }

    const start = new Date(localStart);
    const end = addMinutes(start, SLOT_MINUTES);
    onMove({ startsAt: start.toISOString(), endsAt: end.toISOString() });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Crear turno" : "Editar turno"}
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-teal-950">
              {mode === "create" ? "Nuevo turno" : "Editar turno"}
            </h2>
            <p className="text-sm text-teal-900/70">
              {format(parseISO(startsAt), "EEE d MMM HH:mm", { locale: es })} –{" "}
              {format(parseISO(endsAt), "HH:mm", { locale: es })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-teal-900/60 hover:text-teal-950"
          >
            Cerrar
          </button>
        </div>

        {mode === "edit" ? (
          <label className="flex flex-col gap-1 text-sm">
            Nuevo inicio
            <input
              type="datetime-local"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              className="rounded-lg border px-3 py-2"
              disabled={!membershipActive}
            />
          </label>
        ) : null}

        {mode === "create" ? (
          <>
            <label className="flex flex-col gap-1 text-sm">
              Paciente
              <input
                name="patientName"
                required
                className="rounded-lg border px-3 py-2"
                defaultValue={patientName}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Teléfono
              <input
                name="patientPhone"
                required
                className="rounded-lg border px-3 py-2"
                defaultValue={patientPhone}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Notas
              <input
                name="notes"
                className="rounded-lg border px-3 py-2"
                defaultValue={notes}
              />
            </label>
          </>
        ) : (
          <p className="text-sm text-teal-900/80">
            {patientName || "Sin paciente"}
            {patientPhone ? ` · ${patientPhone}` : ""}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {membershipActive ? (
            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary"
            >
              {pending
                ? "Guardando…"
                : mode === "create"
                  ? "Crear turno"
                  : "Mover turno"}
            </button>
          ) : null}
          {mode === "edit" && onCancel && membershipActive ? (
            <button
              type="button"
              disabled={pending}
              onClick={onCancel}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              Cancelar turno
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
