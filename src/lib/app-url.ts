export function getPublicAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function getRequestOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto");
  if (host) {
    const scheme = proto ?? (host.includes("localhost") ? "http" : "https");
    return `${scheme}://${host}`;
  }
  return getPublicAppUrl();
}

export function safeInternalPath(path: string | null, fallback = "/calendar"): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return fallback;
  }
  return path;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in Vercel → Project Settings → Environment Variables.`,
    );
  }
  return value;
}
