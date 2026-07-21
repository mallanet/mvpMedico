import { PageHeader } from "@/components/page-header";
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
      <div className="max-w-2xl space-y-6">
        <PageHeader title="Membresías" />
        <p className="rounded-[var(--radius-panel)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
          Solo el rol <code className="font-medium">admin_waira</code> puede
          activar membresías. Para desarrollo local:
        </p>
        <pre className="overflow-x-auto rounded-[var(--radius-panel)] bg-teal-950 p-4 text-xs leading-relaxed text-teal-50">
{`update public.profiles set role = 'admin_waira' where id = '<tu-user-id>';
-- o usá admin@example.com / password123 del seed`}
        </pre>
        {ctx?.membership ? (
          <p className="text-sm leading-relaxed text-teal-900/70">
            Tu clínica actual: membresía{" "}
            <strong className="font-medium text-teal-950">
              {ctx.membership.status}
            </strong>{" "}
            (clinic_id <code>{ctx.clinicId}</code>).
          </p>
        ) : null}
      </div>
    );
  }

  type Row = {
    id: string;
    clinic_id: string;
    status: string;
    activated_at: string | null;
    clinics: { name?: string } | null;
  };

  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("id, clinic_id, status, activated_at, clinics(name)")
    .order("created_at", { ascending: false });
  const rows = (data as Row[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membresías Waira"
        description="Activá, pausá o cancelá clínicas. Stripe queda para una fase posterior."
      />
      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-teal-900/10 bg-white/80 shadow-sm">
        <table className="min-w-full border-collapse text-left text-sm text-teal-900/80">
          <thead className="border-b border-teal-900/10 bg-teal-50/50 text-xs text-teal-900/60">
            <tr>
              <th className="px-4 py-3 font-medium">Clínica</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Activada</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal-900/10">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium text-teal-950">
                  {row.clinics?.name ?? "Clínica"}
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
                        className="btn btn-primary"
                      >
                        Activar
                      </button>
                    ) : null}
                    {row.status !== "paused" ? (
                      <button
                        name="status"
                        value="paused"
                        className="btn btn-secondary"
                      >
                        Pausar
                      </button>
                    ) : null}
                    {row.status !== "cancelled" ? (
                      <button
                        name="status"
                        value="cancelled"
                        className="btn border border-red-200 bg-white text-red-700 hover:bg-red-50"
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
