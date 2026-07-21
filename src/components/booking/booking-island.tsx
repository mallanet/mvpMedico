"use client";

import { BookingErrorBoundary } from "@/components/booking/error-boundary";
import { BookingWidget } from "@/components/booking/booking-widget";

export function BookingIsland({
  slug,
  doctorName,
}: {
  slug: string;
  doctorName: string;
}) {
  return (
    <BookingErrorBoundary>
      <BookingWidget slug={slug} doctorName={doctorName} />
    </BookingErrorBoundary>
  );
}
