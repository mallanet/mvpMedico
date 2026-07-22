import { createClient } from "@/lib/supabase/server";
import { AppNavBar } from "@/components/app-nav-bar";
import { isDemoMode } from "@/lib/mock/mode";
import { readDemoSession } from "@/lib/mock/session";
import type { AppRole } from "@/lib/types";

export async function AppNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: AppRole | null = null;
  if (user) {
    if (isDemoMode()) {
      const session = await readDemoSession();
      role = session?.role ?? "doctor";
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      role = (profile?.role as AppRole | undefined) ?? "doctor";
    }
  }

  return <AppNavBar signedIn={Boolean(user)} role={role} />;
}
