import { GoogleConnectButton } from "@/components/google/connect-button";
import { SyncGoogleButton } from "@/components/google/sync-button";
import { getClinicContext, hasActiveMembership } from "@/lib/clinic-context";
import { googleConfigured } from "@/lib/google";
import { createClient } from "@/lib/supabase/server";

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

      <div className="space-y-3 rounded-xl border border-teal-900/10 bg-white p-4">
        <p className="text-sm">
          Estado: <strong>{connected ? "Conectado" : "No conectado"}</strong>
        </p>
        <GoogleConnectButton
          connected={connected}
          configured={configured}
          membershipActive={membershipActive}
        />
        {configured && membershipActive && connected ? <SyncGoogleButton /> : null}
      </div>
    </div>
  );
}
