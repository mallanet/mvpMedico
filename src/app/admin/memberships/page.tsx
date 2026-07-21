import { setMembershipStatus } from "@/lib/appointments";
import { getClinicContext } from "@/lib/clinic-context";
import { createClient } from "@/lib/supabase/server";
import type { MembershipStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

async function membershipAction(formData: FormData) {
  "use server";
  const clinicId = String(formData.get("clinicId"));
  const status = String(formData.get("status")) as MembershipStatus;
  if (!["active", "paused", "cancelled"].includes(status)) return;
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
-- o usá admin@example.com / password123 del seed`}
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
          Activá, pausá o cancelá clínicas. Stripe queda para una fase posterior.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-teal-900/10 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-teal-900/10 bg-teal-50/50 text-xs uppercase tracking-wide text-teal-900/60">
            <tr>
              <th className="px-4 py-3">Clínica</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Activada</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal-900/10">
            {(rows ?? []).map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium text-teal-950">
                  {(row.clinics as { name?: string } | null)?.name ?? "Clínica"}
                </td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3 text-teal-900/70">
                  {row.activated_at
                    ? new Date(row.activated_at).toLocaleString("es-AR")
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <form action={membershipAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="clinicId" value={row.clinic_id} />
                    {row.status !== "active" ? (
                      <button
                        name="status"
                        value="active"
                        className="rounded-md bg-teal-800 px-3 py-1.5 text-white"
                      >
                        Activar
                      </button>
                    ) : null}
                    {row.status !== "paused" ? (
                      <button
                        name="status"
                        value="paused"
                        className="rounded-md border px-3 py-1.5"
                      >
                        Pausar
                      </button>
                    ) : null}
                    {row.status !== "cancelled" ? (
                      <button
                        name="status"
                        value="cancelled"
                        className="rounded-md border border-red-200 px-3 py-1.5 text-red-700"
                      >
                        Cancelar
                      </button>
                    ) : null}
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
