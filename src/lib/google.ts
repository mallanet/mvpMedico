import { createClient, createServiceClient } from "@/lib/supabase/server";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_FREEBUSY = "https://www.googleapis.com/calendar/v3/freeBusy";

export function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }>;
}

async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google refresh failed: ${text}`);
  }

  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function syncGoogleBusyForCurrentUser(): Promise<{
  ok: boolean;
  imported?: number;
  error?: string;
}> {
  if (!googleConfigured()) {
    return { ok: false, error: "Google OAuth no configurado." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { data: connection } = await supabase
    .from("external_connections")
    .select("*")
    .eq("profile_id", user.id)
    .eq("provider", "google")
    .maybeSingle();

  if (!connection) {
    return { ok: false, error: "Conectá Google Calendar primero." };
  }

  let accessToken = connection.access_token as string | null;
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;

  if (!accessToken || Date.now() > expiresAt - 60_000) {
    if (!connection.refresh_token) {
      return { ok: false, error: "Falta refresh token; reconectá Google." };
    }
    const refreshed = await refreshAccessToken(connection.refresh_token);
    accessToken = refreshed.access_token;
    await supabase
      .from("external_connections")
      .update({
        access_token: accessToken,
        token_expires_at: new Date(
          Date.now() + refreshed.expires_in * 1000,
        ).toISOString(),
      })
      .eq("id", connection.id);
  }

  const timeMin = new Date();
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 30);

  const freeBusyRes = await fetch(GOOGLE_FREEBUSY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: connection.calendar_id ?? "primary" }],
    }),
  });

  if (!freeBusyRes.ok) {
    return { ok: false, error: await freeBusyRes.text() };
  }

  const payload = (await freeBusyRes.json()) as {
    calendars?: Record<string, { busy?: { start: string; end: string }[] }>;
  };

  const calendarKey = connection.calendar_id ?? "primary";
  const busy = payload.calendars?.[calendarKey]?.busy ?? [];

  const service = createServiceClient();
  await service
    .from("external_events")
    .delete()
    .eq("connection_id", connection.id);

  if (busy.length === 0) {
    return { ok: true, imported: 0 };
  }

  const rows = busy.map((slot, index) => ({
    resource_id: connection.resource_id,
    connection_id: connection.id,
    external_id: `busy-${index}-${slot.start}`,
    starts_at: slot.start,
    ends_at: slot.end,
    summary: "Google Calendar (ocupado)",
  }));

  const { error } = await service.from("external_events").insert(rows);
  if (error) return { ok: false, error: error.message };

  return { ok: true, imported: rows.length };
}
