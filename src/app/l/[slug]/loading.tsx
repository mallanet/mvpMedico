export default function LandingLoading() {
  return (
    <div
      className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12"
      aria-busy="true"
    >
      <div className="space-y-4">
        <div className="skeleton-block h-4 w-40" />
        <div className="skeleton-block h-10 w-3/4" />
        <div className="skeleton-block h-24 w-full" />
      </div>
      <div className="skeleton-block h-80 w-full rounded-[var(--radius-panel)]" />
    </div>
  );
}
