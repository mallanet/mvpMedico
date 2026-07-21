import Link from "next/link";
import { getClinicContext, hasActiveMembership } from "@/lib/clinic-context";
import { googleConfigured } from "@/lib/google";
import { createClient } from "@/lib/supabase/server";
import { SyncGoogleButton } from "@/components/sync-google-button";

export const dynamic = "force-dynamic";

export default async function GoogleSettingsPage() {
  const ctx = await getClinicContext();
  const configured = googleConfigured();
  const membershipActive = hasActiveMembership(ctx);

  let connected = false;
  if (ctx?.profile.id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("external_connections")
      .select("id")
      .eq("profile_id", ctx.profile.id)
      .eq("provider", "google")
      .maybeSingle();
    connected = Boolean(data);
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-teal-950">Google Calendar</h1>
        <p className="text-sm text-teal-900/70">
          v1: leer busy y bloquear huecos. Sin sync bidireccional.
        </p>
      </div>

      {!configured ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Configurá <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code> y{" "}
          <code>GOOGLE_REDIRECT_URI</code> en el entorno.
        </p>
      ) : null}

      {!membershipActive ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          La sync de Google requiere membresía Waira activa.
        </p>
      ) : null}

      <div className="rounded-xl border border-teal-900/10 bg-white p-4 space-y-3">
        <p className="text-sm">
          Estado:{" "}
          <strong>{connected ? "Conectado" : "No conectado"}</strong>
        </p>
        {configured && membershipActive ? (
          <div className="flex flex-wrap gap-3">
            <Link
              href="/api/google/oauth"
              className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
            >
              {connected ? "Reconectar Google" : "Conectar Google"}
            </Link>
            {connected ? <SyncGoogleButton /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
