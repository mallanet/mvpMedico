"use client";

import { format, parseISO } from "date-fns";
import type { TimeSlot } from "@/lib/types";

type Props = {
  slots: TimeSlot[];
  selected: TimeSlot | null;
  loading: boolean;
  onSelect: (slot: TimeSlot) => void;
};

export function SlotPicker({ slots, selected, loading, onSelect }: Props) {
  if (loading) {
    return <p className="text-sm text-stone-500">Cargando horarios…</p>;
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        No hay horarios disponibles ese día.
      </p>
    );
  }

  return (
    <div className="space-y-2" aria-label="Horarios disponibles">
      <p className="text-sm font-medium text-stone-800">Horarios disponibles</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((slot) => {
          const active = selected?.startsAt === slot.startsAt;
          return (
            <button
              key={slot.startsAt}
              type="button"
              onClick={() => onSelect(slot)}
              className={`rounded-lg border px-2 py-2 text-sm ${
                active
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white hover:border-stone-400"
              }`}
            >
              {format(parseISO(slot.startsAt), "HH:mm")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
