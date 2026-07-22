import {
  DEMO_SESSION_COOKIE,
  sessionForEmail,
  type DemoSession,
} from "@/lib/mock/seed";
import { readDemoDbClient } from "@/lib/mock/store-client";

export function demoSessionFromCredentials(email: string): DemoSession {
  const normalized = email.trim().toLowerCase();
  const db = readDemoDbClient();

  for (const clinic of db.clinics) {
    const member = clinic.members.find((m) => m.email === normalized);
    if (member) {
      return {
        email: normalized,
        role: member.role,
        profileId: member.profileId,
        clinicId: clinic.id,
        jwt: `mock-jwt-${member.role}`,
      };
    }
  }

  const profileByName = db.profiles.find(
    (p) => p.full_name?.toLowerCase().includes(normalized.split("@")[0] ?? ""),
  );
  if (profileByName && profileByName.role === "admin_waira") {
    return sessionForEmail(normalized);
  }

  return sessionForEmail(normalized);
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
