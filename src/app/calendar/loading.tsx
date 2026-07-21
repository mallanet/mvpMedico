export default function CalendarLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="skeleton-block h-8 w-40" />
      <div className="skeleton-block h-64 w-full rounded-[var(--radius-panel)]" />
    </div>
  );
}
