import { NextResponse } from "next/server";
import { getClinicContext, hasActiveMembership } from "@/lib/clinic-context";
import { syncGoogleBusyForCurrentUser } from "@/lib/google";

export async function POST() {
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
