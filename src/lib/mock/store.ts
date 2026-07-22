import { cookies } from "next/headers";
import {
  buildSeedDb,
  DEMO_DB_COOKIE,
  type DemoDb,
} from "@/lib/mock/seed";

function parseDb(raw: string | undefined | null): DemoDb | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DemoDb;
    if (parsed?.version !== 2 || !Array.isArray(parsed.appointments)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function readDemoDb(): Promise<DemoDb> {
  const jar = await cookies();
  const fromCookie = parseDb(jar.get(DEMO_DB_COOKIE)?.value);
  if (fromCookie) return fromCookie;
  return buildSeedDb();
}

export async function writeDemoDb(db: DemoDb): Promise<void> {
  const jar = await cookies();
  jar.set(DEMO_DB_COOKIE, JSON.stringify(db), {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
  });
}
