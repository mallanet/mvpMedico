"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isClinicAffiliated } from "@/lib/preview-sandbox";

export function AffiliationGate({ clinicId }: { clinicId: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const affiliated = useMemo(() => {
    if (!ready) return true;
    return isClinicAffiliated(clinicId);
  }, [clinicId, ready]);

  if (affiliated) return null;

  return (
    <p
      className="mb-4 rounded-[var(--radius-panel)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      role="status"
    >
      Esta clínica no está afiliada al doctor demo. Afiliala en el{" "}
      <Link href="/preview/doctor" className="font-medium underline">
        panel doctor
      </Link>{" "}
      para crear turnos y abrir slots de reserva.
    </p>
  );
}
