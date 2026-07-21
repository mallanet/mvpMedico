import { createBrowserClient } from "@supabase/ssr";
import { isDemoMode } from "@/lib/mock/mode";

function demoBrowserClient() {
  return {
    auth: {
      async getUser() {
        return { data: { user: null }, error: null };
      },
      async getSession() {
        return { data: { session: null }, error: null };
      },
      async signInWithPassword() {
        return { data: { user: null, session: null }, error: null };
      },
      async signUp() {
        return { data: { user: null, session: null }, error: null };
      },
      async signOut() {
        return { error: null };
      },
    },
    from() {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
            single: async () => ({ data: null, error: null }),
            order: () => ({
              data: [],
              error: null,
            }),
          }),
          order: async () => ({ data: [], error: null }),
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            eq: async () => ({ data: null, error: null }),
            then: undefined,
          }),
        }),
      };
    },
    channel() {
      return {
        on() {
          return this;
        },
        subscribe() {
          return { unsubscribe() {} };
        },
      };
    },
    removeChannel() {},
  };
}

export function createClient() {
  if (isDemoMode()) {
  return demoBrowserClient() as unknown as ReturnType<typeof createBrowserClient>;
}
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return createBrowserClient(url, anon);
}
