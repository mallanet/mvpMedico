export function isDemoMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !anon) return true;
  if (url === "mock" || url.startsWith("mock:")) return true;
  if (anon === "mock") return true;
  return false;
}
