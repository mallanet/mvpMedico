import { setMembershipStatus } from "@/lib/appointments";
import { getClinicContext } from "@/lib/clinic-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function activateAction(formData: FormData) {
  "use server";
  const clinicId = String(formData.get("clinicId"));
  const status = String(formData.get("status")) as "active" | "paused";
  await setMembershipStatus(clinicId, status);
}

export default async function AdminMembershipsPage() {
  const ctx = await getClinicContext();
  if (!ctx || ctx.profile.role !== "admin_waira") {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-teal-950">Membresías</h1>
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Solo el rol <code>admin_waira</code> puede activar membresías. Para
          desarrollo local:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-teal-950 p-3 text-xs text-teal-50">
{`update public.profiles set role = 'admin_waira' where id = '<tu-user-id>';
-- luego recargá esta página`}
        </pre>
        {ctx?.membership ? (
          <p className="text-sm text-teal-900/70">
            Tu clínica actual: membresía{" "}
            <strong>{ctx.membership.status}</strong> (clinic_id{" "}
            <code>{ctx.clinicId}</code>).
          </p>
        ) : null}
      </div>
    );
  }

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("memberships")
    .select("id, clinic_id, status, activated_at, clinics(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-teal-950">Membresías Waira</h1>
        <p className="text-sm text-teal-900/70">
          Activá o pausá clínicas. Stripe queda para una fase posterior.
        </p>
      </div>
      <ul className="divide-y divide-teal-900/10 rounded-xl border border-teal-900/10 bg-white">
        {(rows ?? []).map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <p className="font-medium text-teal-950">
                {(row.clinics as { name?: string } | null)?.name ?? "Clínica"}
              </p>
              <p className="text-sm text-teal-900/70">
                Estado: {row.status}
                {row.activated_at ? ` · desde ${row.activated_at}` : ""}
              </p>
            </div>
            <form action={activateAction} className="flex gap-2">
              <input type="hidden" name="clinicId" value={row.clinic_id} />
              {row.status === "active" ? (
                <button
                  name="status"
                  value="paused"
                  className="rounded-md border px-3 py-1.5 text-sm"
                >
                  Pausar
                </button>
              ) : (
                <button
                  name="status"
                  value="active"
                  className="rounded-md bg-teal-800 px-3 py-1.5 text-sm text-white"
                >
                  Activar
                </button>
              )}
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
