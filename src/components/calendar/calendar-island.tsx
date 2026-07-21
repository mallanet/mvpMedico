"use client";

import { CalendarErrorBoundary } from "@/components/calendar/error-boundary";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import type { Appointment } from "@/lib/types";

type Props = {
  resourceId: string;
  appointments: Appointment[];
  membershipActive: boolean;
};

export function CalendarIsland(props: Props) {
  return (
    <CalendarErrorBoundary>
      <CalendarGrid {...props} />
    </CalendarErrorBoundary>
  );
}
