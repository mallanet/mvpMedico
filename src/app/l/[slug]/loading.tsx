export default function LandingLoading() {
  return (
    <div className="grid gap-10 animate-pulse lg:grid-cols-2">
      <div className="space-y-4">
        <div className="h-4 w-40 rounded bg-stone-200" />
        <div className="h-10 w-3/4 rounded bg-stone-200" />
        <div className="h-24 rounded bg-stone-100" />
      </div>
      <div className="h-80 rounded-2xl bg-stone-100" />
    </div>
  );
}
