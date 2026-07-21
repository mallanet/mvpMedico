"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarErrorBoundary } from "@/components/calendar/error-boundary";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import {
  cancelSandboxAppointment,
  createSandboxAppointment,
  listSandboxAppointments,
  moveSandboxAppointment,
  sandboxResourceId,
} from "@/lib/preview-sandbox";
import type { Appointment } from "@/lib/types";

export function PreviewSandboxCalendar({ clinicId }: { clinicId: string }) {
  const [tick, setTick] = useState(0);
  const appointments = useMemo(() => {
    void tick;
    return listSandboxAppointments(clinicId);
  }, [clinicId, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  const mutations = useMemo(
    () => ({
      create: async (input: {
        startsAt: string;
        endsAt: string;
        patientName: string;
        patientPhone: string;
        notes?: string;
      }) => createSandboxAppointment(clinicId, input),
      move: async (input: {
        appointmentId: string;
        startsAt: string;
        endsAt: string;
      }) => moveSandboxAppointment(clinicId, input),
      cancel: async (appointmentId: string) =>
        cancelSandboxAppointment(clinicId, appointmentId),
    }),
    [clinicId],
  );

  return (
    <CalendarErrorBoundary>
      <CalendarGrid
        resourceId={sandboxResourceId(clinicId)}
        appointments={appointments as Appointment[]}
        membershipActive
        mutations={mutations}
        enableRealtime={false}
        onMutated={reload}
      />
    </CalendarErrorBoundary>
  );
}
