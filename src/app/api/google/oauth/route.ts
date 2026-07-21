import { NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/app-url";
import { getClinicContext, hasActiveMembership } from "@/lib/clinic-context";
import { getGoogleAuthUrl, googleConfigured } from "@/lib/google";

export async function GET(request: Request) {
  if (!googleConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google OAuth no configurado. Definí GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.",
      },
      { status: 501 },
    );
  }

  const origin = getRequestOrigin(request);
  const ctx = await getClinicContext();

  if (!ctx?.profile.id || !ctx.resource.id) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  if (!hasActiveMembership(ctx)) {
    return NextResponse.redirect(new URL("/settings/google?error=membership", origin));
  }

  const state = Buffer.from(
    JSON.stringify({
      profileId: ctx.profile.id,
      resourceId: ctx.resource.id,
    }),
  ).toString("base64url");

  return NextResponse.redirect(getGoogleAuthUrl(state));
}
