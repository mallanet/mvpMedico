"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type Props = {
  doctorName: string;
  patientName: string;
  startsAt: string;
  endsAt: string;
};

function googleCalendarUrl(input: {
  title: string;
  startsAt: string;
  endsAt: string;
  details: string;
}): string {
  const fmt = (iso: string) =>
    parseISO(iso)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${fmt(input.startsAt)}/${fmt(input.endsAt)}`,
    details: input.details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function BookingConfirmation({
  doctorName,
  patientName,
  startsAt,
  endsAt,
}: Props) {
  const title = `Turno con ${doctorName}`;
  const gcal = googleCalendarUrl({
    title,
    startsAt,
    endsAt,
    details: `Paciente: ${patientName}`,
  });

  return (
    <div
      className="space-y-4 rounded-2xl border border-teal-200 bg-teal-50/70 p-5"
      role="status"
      aria-label="Confirmación de turno"
    >
      <h2 className="text-lg font-semibold text-teal-950">Turno solicitado</h2>
      <p className="text-sm text-teal-900/80">
        {patientName}, tu pedido quedó registrado para el{" "}
        <strong>
          {format(parseISO(startsAt), "EEEE d MMMM HH:mm", { locale: es })}
        </strong>
        .
      </p>
      <a
        href={gcal}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
      >
        Agregar a Google Calendar
      </a>
    </div>
  );
}
