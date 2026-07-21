export default function PreviewLoading() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]" aria-busy="true">
      <div className="space-y-3">
        <div className="skeleton-block h-5 w-40" />
        <div className="skeleton-block h-11 w-full" />
        <div className="skeleton-block h-48 w-full rounded-[var(--radius-panel)]" />
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="skeleton-block h-4 w-32" />
          <div className="skeleton-block h-10 w-3/4" />
          <div className="skeleton-block h-24 w-full" />
        </div>
        <div className="skeleton-block h-80 w-full rounded-[var(--radius-panel)]" />
      </div>
    </div>
  );
}
