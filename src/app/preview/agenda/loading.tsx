export default function PreviewAgendaLoading() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="skeleton-block h-10 w-64" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <div className="skeleton-block h-64 w-full rounded-[var(--radius-panel)]" />
        <div className="skeleton-block h-80 w-full rounded-[var(--radius-panel)]" />
      </div>
    </div>
  );
}
