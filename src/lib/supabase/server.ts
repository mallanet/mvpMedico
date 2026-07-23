import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { requireEnv } from "@/lib/app-url";
import { isDemoMode } from "@/lib/mock/mode";
import { readDemoSession } from "@/lib/mock/session";

function demoServerClient() {
  return {
    auth: {
      async getUser() {
        const session = await readDemoSession();
        if (!session) return { data: { user: null }, error: null };
        return {
          data: {
            user: {
              id: session.profileId,
              email: session.email,
              app_metadata: {},
              user_metadata: { role: session.role },
              aud: "authenticated",
              created_at: "",
            },
          },
          error: null,
        };
      },
      async getSession() {
        const session = await readDemoSession();
        if (!session) return { data: { session: null }, error: null };
        return {
          data: {
            session: {
              access_token: session.jwt,
              token_type: "bearer",
              user: { id: session.profileId, email: session.email },
            },
          },
          error: null,
        };
      },
      async signOut() {
        return { error: null };
      },
    },
    from() {
      throw new Error("Demo mode: use domain APIs, not supabase.from()");
    },
  };
}

export async function createClient() {
  if (isDemoMode()) {
    return demoServerClient() as unknown as Awaited<
      ReturnType<typeof createServerClient>
    >;
  }

  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {

          }
        },
      },
    },
  );
}

export function createServiceClient() {
  if (isDemoMode()) {
    return demoServerClient() as unknown as ReturnType<typeof createSupabaseClient>;
  }
  return createSupabaseClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
