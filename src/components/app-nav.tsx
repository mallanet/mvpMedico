import { createClient } from "@/lib/supabase/server";
import { AppNavBar } from "@/components/app-nav-bar";

export async function AppNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <AppNavBar signedIn={Boolean(user)} />;
}
