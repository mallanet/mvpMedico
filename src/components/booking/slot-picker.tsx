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
  if (loading && slots.length === 0) {
    return (
      <div className="space-y-2" aria-live="polite" aria-busy="true">
        <p className="text-sm font-medium text-teal-950">Horarios disponibles</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-block h-11 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!loading && slots.length === 0) {
    return (
      <p className="text-sm text-teal-900/70" role="status">
        No hay horarios libres ese día.
      </p>
    );
  }

  return (
    <div
      className={`space-y-2${loading ? " opacity-70" : ""}`}
      role="group"
      aria-label="Horarios disponibles"
      aria-busy={loading}
    >
      <p className="text-sm font-medium text-teal-950">
        Horarios disponibles
        {loading ? (
          <span className="ml-2 text-xs font-normal text-teal-900/55">
            actualizando…
          </span>
        ) : null}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((slot) => {
          const active = selected?.startsAt === slot.startsAt;
          const label = format(parseISO(slot.startsAt), "HH:mm");
          return (
            <button
              key={slot.startsAt}
              type="button"
              onClick={() => onSelect(slot)}
              disabled={loading}
              aria-pressed={active}
              className={`min-h-11 rounded-[var(--radius-control)] border px-2 text-sm tabular-nums transition-colors duration-[var(--dur-fast)] ${
                active
                  ? "border-[color:var(--brand-forest)] bg-[color:var(--brand-forest)] text-white"
                  : "border-[color:var(--brand-forest)]/15 bg-white text-[color:var(--foreground)] hover:border-[color:var(--brand-forest)]/40"
              } disabled:cursor-wait`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
