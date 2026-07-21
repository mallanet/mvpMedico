import {
  addDays,
  addMinutes,
  format,
  parseISO,
  setHours,
  setMinutes,
  setSeconds,
  startOfDay,
} from "date-fns";
import type { TimeSlot } from "@/lib/types";

export const SLOT_MINUTES = 30;
export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 20;
/** Mon=1 … Sat=6; Sunday excluded. */
export const BOOKABLE_WEEKDAYS = new Set([1, 2, 3, 4, 5, 6]);

type BusyRange = { starts_at: string; ends_at: string };

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function buildDaySlots(day: Date): TimeSlot[] {
  const weekday = day.getDay(); // 0=Sun
  if (!BOOKABLE_WEEKDAYS.has(weekday)) return [];

  const base = setSeconds(setMinutes(setHours(startOfDay(day), DAY_START_HOUR), 0), 0);
  const end = setSeconds(setMinutes(setHours(startOfDay(day), DAY_END_HOUR), 0), 0);
  const slots: TimeSlot[] = [];
  let cursor = base;

  while (true) {
    const slotEnd = addMinutes(cursor, SLOT_MINUTES);
    if (slotEnd > end) break;
    slots.push({
      startsAt: cursor.toISOString(),
      endsAt: slotEnd.toISOString(),
    });
    cursor = slotEnd;
  }

  return slots;
}

export function filterAvailableSlots(
  slots: TimeSlot[],
  busy: BusyRange[],
  now = new Date(),
): TimeSlot[] {
  return slots.filter((slot) => {
    const start = parseISO(slot.startsAt);
    const end = parseISO(slot.endsAt);
    if (start < now) return false;
    return !busy.some((b) =>
      overlaps(start, end, parseISO(b.starts_at), parseISO(b.ends_at)),
    );
  });
}

export function nextBookableDays(count: number, from = new Date()): Date[] {
  const days: Date[] = [];
  let cursor = startOfDay(from);
  while (days.length < count) {
    if (BOOKABLE_WEEKDAYS.has(cursor.getDay())) {
      days.push(cursor);
    }
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function dateInputValue(day: Date): string {
  return format(day, "yyyy-MM-dd");
}
