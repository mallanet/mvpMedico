import {
  DEMO_SESSION_COOKIE,
  sessionForEmail,
  type DemoSession,
} from "@/lib/mock/seed";

export function demoSessionFromCredentials(email: string): DemoSession {
  return sessionForEmail(email);
}

/** Set session cookie from the browser (login form). */
export function setDemoSessionClient(session: DemoSession): void {
  if (typeof window === "undefined") return;
  const raw = encodeURIComponent(JSON.stringify(session));
  document.cookie = `${DEMO_SESSION_COOKIE}=${raw}; path=/; max-age=${60 * 60 * 24 * 14}; samesite=lax`;
}

export function clearDemoSessionClient(): void {
  if (typeof window === "undefined") return;
  document.cookie = `${DEMO_SESSION_COOKIE}=; path=/; max-age=0`;
}

export function readDemoSessionClient(): DemoSession | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${DEMO_SESSION_COOKIE}=`));
  if (!match) return null;
  try {
    return JSON.parse(
      decodeURIComponent(match.slice(DEMO_SESSION_COOKIE.length + 1)),
    ) as DemoSession;
  } catch {
    return null;
  }
}
