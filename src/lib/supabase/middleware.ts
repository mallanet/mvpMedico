import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/mock/mode";
import { DEMO_SESSION_COOKIE } from "@/lib/mock/seed";

const PROTECTED_PREFIXES = [
  "/calendar",
  "/onboarding",
  "/admin",
] as const;

const AUTH_PAGES = ["/login", "/signup"] as const;

function matchesPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function hasDemoSession(request: NextRequest): boolean {
  const raw = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { email?: string };
    return Boolean(parsed?.email);
  } catch {
    return false;
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  if (isDemoMode()) {
    const signedIn = hasDemoSession(request);
    if (!signedIn && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/login";
      redirect.searchParams.set("next", pathname);
      return NextResponse.redirect(redirect);
    }
    if (signedIn && matchesPrefix(pathname, AUTH_PAGES)) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/calendar";
      redirect.search = "";
      return NextResponse.redirect(redirect);
    }
    return supabaseResponse;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && matchesPrefix(pathname, AUTH_PAGES)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/calendar";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return supabaseResponse;
}
