"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { BOOKABLE_WEEKDAYS, dateInputValue } from "@/lib/slots";

type Props = {
  /** yyyy-MM-dd */
  selected: string;
  onSelect: (isoDate: string) => void;
  /** Optional: mark days that currently have openings */
  hasOpenings?: (isoDate: string) => boolean;
};

const DOW = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

export function DayCalendar({ selected, onSelect, hasOpenings }: Props) {
  const selectedDate = useMemo(() => startOfDay(parseISO(selected)), [selected]);
  const [month, setMonth] = useState(() => startOfMonth(selectedDate));

  useEffect(() => {
    setMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  const today = startOfDay(new Date());
  const maxMonth = startOfMonth(addMonths(today, 2));

  const cells = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  function canPick(day: Date): boolean {
    if (isBefore(day, today)) return false;
    if (!BOOKABLE_WEEKDAYS.has(day.getDay())) return false;
    if (!isSameMonth(day, month)) return false;
    return true;
  }

  return (
    <div className="space-y-3" role="group" aria-label="Calendario de fechas">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-teal-950">Elegí un día</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn btn-ghost px-3"
            aria-label="Mes anterior"
            disabled={isSameMonth(month, today) || isBefore(month, today)}
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            ‹
          </button>
          <p className="min-w-[8.5rem] text-center text-sm font-medium capitalize text-teal-950">
            {format(month, "MMMM yyyy", { locale: es })}
          </p>
          <button
            type="button"
            className="btn btn-ghost px-3"
            aria-label="Mes siguiente"
            disabled={isSameMonth(month, maxMonth) || isBefore(maxMonth, month)}
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-teal-900/50">
        {DOW.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day) => {
          const iso = dateInputValue(day);
          const inMonth = isSameMonth(day, month);
          const pickable = canPick(day);
          const active = isSameDay(day, selectedDate);
          const openings = hasOpenings ? hasOpenings(iso) : true;
          const muted = !inMonth || !pickable;

          return (
            <button
              key={iso}
              type="button"
              disabled={muted}
              aria-pressed={active}
              aria-label={format(day, "EEEE d MMMM", { locale: es })}
              onClick={() => {
                onSelect(iso);
                if (!isSameMonth(day, month)) setMonth(startOfMonth(day));
              }}
              className={`relative flex min-h-11 flex-col items-center justify-center rounded-[var(--radius-control)] text-sm tabular-nums transition-colors duration-[var(--dur-fast)] ${
                active
                  ? "bg-[color:var(--brand-forest)] font-semibold text-white"
                  : muted
                    ? "cursor-not-allowed text-teal-900/25"
                    : "text-teal-950 hover:bg-[color:var(--brand-foam)]"
              }`}
            >
              {format(day, "d")}
              {inMonth && pickable && openings && !active ? (
                <span
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-[color:var(--brand-lagoon)]"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
