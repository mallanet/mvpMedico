"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useRef } from "react";

type Props = {
  doctorName: string;
  specialty?: string;
  patientName: string;
  startsAt: string;
  endsAt: string;
  isDemo?: boolean;
  bookingCode?: string;
};

export function BookingConfirmation({
  doctorName,
  specialty,
  patientName,
  startsAt,
  endsAt,
  isDemo = false,
  bookingCode,
}: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div
      className="space-y-4 rounded-[var(--radius-panel)] border border-[color:var(--brand-forest)]/15 bg-[color:var(--brand-foam)] p-5 sm:p-6"
      role="status"
      aria-label="Confirmación de turno"
    >
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-semibold text-[color:var(--foreground)] outline-none"
      >
        Turno solicitado
      </h2>
      <p className="text-sm text-[color:var(--foreground)]/80">
        {patientName}, pediste turno con {doctorName}
        {specialty ? ` (${specialty})` : ""} para el{" "}
        <strong>
          {format(parseISO(startsAt), "EEEE d MMMM HH:mm", { locale: es })}
          {" – "}
          {format(parseISO(endsAt), "HH:mm", { locale: es })}
        </strong>
        .
        {bookingCode ? (
          <>
            {" "}
            Código: <strong>{bookingCode}</strong>.
          </>
        ) : null}
        {isDemo
          ? " Quedó guardado en esta demo (navegador); no se escribe en el servidor."
          : " Ya quedó anotado en la agenda Waira."}
      </p>
    </div>
  );
}
