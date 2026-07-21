import { NextResponse } from "next/server";
import { getClinicContext, hasActiveMembership } from "@/lib/clinic-context";
import { googleConfigured, syncGoogleBusyForCurrentUser } from "@/lib/google";

export async function POST() {
  if (!googleConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Google OAuth no configurado. Definí GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI.",
      },
      { status: 501 },
    );
  }

  const ctx = await getClinicContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }
  if (!hasActiveMembership(ctx)) {
    return NextResponse.json(
      { ok: false, error: "Membresía inactiva" },
      { status: 403 },
    );
  }

  const result = await syncGoogleBusyForCurrentUser();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
