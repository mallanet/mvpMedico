import { BookingErrorBoundary } from "@/components/booking/error-boundary";
import { BookingWidget } from "@/components/booking/booking-widget";

export function BookingIsland({
  slug,
  doctorName,
  specialty,
  ctaLabel,
  sandboxClinicId,
  embedded,
}: {
  slug: string;
  doctorName: string;
  specialty?: string;
  ctaLabel?: string;
  sandboxClinicId?: string;
  embedded?: boolean;
}) {
  return (
    <BookingErrorBoundary>
      <BookingWidget
        slug={slug}
        doctorName={doctorName}
        specialty={specialty}
        ctaLabel={ctaLabel}
        sandboxClinicId={sandboxClinicId}
        embedded={embedded}
      />
    </BookingErrorBoundary>
  );
}
