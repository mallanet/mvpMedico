import { NextResponse } from "next/server";
import { getClinicContext, hasActiveMembership } from "@/lib/clinic-context";
import { getGoogleAuthUrl, googleConfigured } from "@/lib/google";

export async function GET() {
  if (!googleConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google OAuth no configurado. Definí GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI.",
      },
      { status: 501 },
    );
  }

  const ctx = await getClinicContext();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!ctx?.profile.id || !ctx.resource.id) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  if (!hasActiveMembership(ctx)) {
    return NextResponse.redirect(new URL("/settings/google?error=membership", appUrl));
  }

  const state = Buffer.from(
    JSON.stringify({
      profileId: ctx.profile.id,
      resourceId: ctx.resource.id,
    }),
  ).toString("base64url");

  return NextResponse.redirect(getGoogleAuthUrl(state));
}
