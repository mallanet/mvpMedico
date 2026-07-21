"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => setReady(true), []);
  const appointments = useMemo(() => {
    void tick;
    if (!ready) return [];
    return listSandboxAppointments(clinicId);
  }, [clinicId, tick, ready]);

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

  if (!ready) {
    return (
      <p className="text-sm text-[color:var(--foreground)]/65">
        Cargando agenda…
      </p>
    );
  }

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
