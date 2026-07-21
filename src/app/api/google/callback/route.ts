import { NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/app-url";
import { exchangeGoogleCode, googleConfigured } from "@/lib/google";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const origin = getRequestOrigin(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!googleConfigured()) {
    return NextResponse.redirect(`${origin}/settings/google?error=not_configured`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/settings/google?error=oauth`);
  }

  let profileId = "";
  let resourceId = "";
  try {
    const parsed = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    ) as { profileId: string; resourceId: string };
    profileId = parsed.profileId;
    resourceId = parsed.resourceId;
  } catch {
    return NextResponse.redirect(`${origin}/settings/google?error=state`);
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    const supabase = await createClient();

    const { error } = await supabase.from("external_connections").upsert(
      {
        profile_id: profileId,
        resource_id: resourceId,
        provider: "google",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000,
        ).toISOString(),
        calendar_id: "primary",
      },
      { onConflict: "profile_id,provider" },
    );

    if (error) {
      return NextResponse.redirect(
        `${origin}/settings/google?error=${encodeURIComponent(error.message)}`,
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "token_exchange";
    return NextResponse.redirect(
      `${origin}/settings/google?error=${encodeURIComponent(message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/settings/google?connected=1`);
}
