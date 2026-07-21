import { NextResponse } from "next/server";
import { getClinicContext, hasActiveMembership } from "@/lib/clinic-context";
import { getGoogleAuthUrl, googleConfigured } from "@/lib/google";

export async function GET() {
  if (!googleConfigured()) {
    return NextResponse.json(
      { error: "Google OAuth no configurado" },
      { status: 500 },
    );
  }

  const ctx = await getClinicContext();
  if (!ctx?.profile.id || !ctx.resource.id) {
    return NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    );
  }

  if (!hasActiveMembership(ctx)) {
    return NextResponse.redirect(
      new URL(
        "/settings/google?error=membership",
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      ),
    );
  }

  const state = Buffer.from(
    JSON.stringify({
      profileId: ctx.profile.id,
      resourceId: ctx.resource.id,
    }),
  ).toString("base64url");

  return NextResponse.redirect(getGoogleAuthUrl(state));
}
