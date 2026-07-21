import { cookies } from "next/headers";
import {
  DEMO_SESSION_COOKIE,
  type DemoSession,
} from "@/lib/mock/seed";

export async function readDemoSession(): Promise<DemoSession | null> {
  const jar = await cookies();
  const raw = jar.get(DEMO_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DemoSession;
    if (!parsed?.email || !parsed?.profileId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeDemoSession(session: DemoSession): Promise<void> {
  const jar = await cookies();
  jar.set(DEMO_SESSION_COOKIE, JSON.stringify(session), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearDemoSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(DEMO_SESSION_COOKIE);
}
