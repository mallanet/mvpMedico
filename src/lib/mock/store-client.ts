import {
  buildSeedDb,
  DEMO_DB_COOKIE,
  DEMO_DB_LS_KEY,
  DEMO_SESSION_COOKIE,
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

/** Client-side mirror for reset / preview tooling. */
export function readDemoDbClient(): DemoDb {
  if (typeof window === "undefined") return buildSeedDb();
  const fromLs = parseDb(window.localStorage.getItem(DEMO_DB_LS_KEY));
  if (fromLs) return fromLs;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${DEMO_DB_COOKIE}=`));
  if (match) {
    const value = decodeURIComponent(match.slice(DEMO_DB_COOKIE.length + 1));
    const fromCookie = parseDb(value);
    if (fromCookie) {
      window.localStorage.setItem(DEMO_DB_LS_KEY, JSON.stringify(fromCookie));
      return fromCookie;
    }
  }
  const seed = buildSeedDb();
  window.localStorage.setItem(DEMO_DB_LS_KEY, JSON.stringify(seed));
  return seed;
}

export function writeDemoDbClient(db: DemoDb): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(db);
  window.localStorage.setItem(DEMO_DB_LS_KEY, raw);
  document.cookie = `${DEMO_DB_COOKIE}=${encodeURIComponent(raw)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

export function clearDemoStorageClient(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_DB_LS_KEY);
  window.localStorage.removeItem("waira-preview-sandbox-v1");
  window.localStorage.removeItem("waira-preview-sandbox-v2");
  window.localStorage.removeItem("waira-preview-sandbox-v3");
  document.cookie = `${DEMO_DB_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${DEMO_SESSION_COOKIE}=; path=/; max-age=0`;
}
