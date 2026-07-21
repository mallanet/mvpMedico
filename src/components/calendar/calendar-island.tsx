"use client";

import { CalendarErrorBoundary } from "@/components/calendar/error-boundary";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import type { Appointment, ExternalEvent } from "@/lib/types";

type Props = {
  resourceId: string;
  appointments: Appointment[];
  externalEvents: ExternalEvent[];
  membershipActive: boolean;
};

export function CalendarIsland(props: Props) {
  return (
    <CalendarErrorBoundary>
      <CalendarGrid {...props} />
    </CalendarErrorBoundary>
  );
}
