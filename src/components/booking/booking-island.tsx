import { BookingErrorBoundary } from "@/components/booking/error-boundary";
import { BookingWidget } from "@/components/booking/booking-widget";

export function BookingIsland({
  slug,
  doctorName,
  ctaLabel,
  sandboxClinicId,
  embedded,
}: {
  slug: string;
  doctorName: string;
  ctaLabel?: string;
  sandboxClinicId?: string;
  embedded?: boolean;
}) {
  return (
    <BookingErrorBoundary>
      <BookingWidget
        slug={slug}
        doctorName={doctorName}
        ctaLabel={ctaLabel}
        sandboxClinicId={sandboxClinicId}
        embedded={embedded}
      />
    </BookingErrorBoundary>
  );
}
