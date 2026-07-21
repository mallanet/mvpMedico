import type { Metadata } from "next";
import Link from "next/link";
import { AffiliationGate } from "@/components/preview/affiliation-gate";
import { ClinicPicker } from "@/components/preview/clinic-picker";
import { PreviewSandboxCalendar } from "@/components/preview/sandbox-calendar";
import {
  getEcuadorClinic,
  listEcuadorClinics,
} from "@/lib/ecuador-clinics";

export const metadata: Metadata = {
  title: "Agenda demo · Preview · Waira",
  description: "Agenda sandbox por clínica (localStorage).",
};

type Props = {
  searchParams: Promise<{ clinic?: string }>;
};

export default async function PreviewAgendaPage({ searchParams }: Props) {
  const { clinic: clinicParam } = await searchParams;
  const clinics = listEcuadorClinics();
  const requested = clinicParam?.trim() || "";
  const invalidId = Boolean(requested && !getEcuadorClinic(requested));
  const selected =
    requested && !invalidId
      ? getEcuadorClinic(requested)!
      : !requested
        ? (clinics[0] ?? null)
        : null;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-[color:var(--brand-forest)]/70">
            Preview sandbox
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            {selected ? selected.name : "Agenda demo"}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[color:var(--foreground)]/70">
            Creá, mové y cancelá turnos en el navegador. Anti-solape también
            contra otras clínicas del{" "}
            <Link
              href="/preview/doctor"
              className="font-medium text-[color:var(--brand-forest)] underline underline-offset-2"
            >
              doctor demo
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/preview/doctor/calendar" className="btn btn-secondary">
            Calendario master
          </Link>
          {selected ? (
            <Link
              href={`/preview?clinic=${encodeURIComponent(selected.id)}`}
              className="btn btn-secondary"
            >
              Volver al perfil
            </Link>
          ) : null}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:items-start">
        <ClinicPicker
          clinics={clinics}
          selectedId={selected?.id ?? null}
          basePath="/preview/agenda"
        />
        <div className="min-w-0">
          {invalidId ? (
            <p
              className="rounded-[var(--radius-panel)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              role="alert"
            >
              Clínica desconocida: <code>{requested}</code>
            </p>
          ) : null}
          {!selected ? (
            <p className="text-sm text-[color:var(--foreground)]/70">
              Elegí una clínica para abrir su agenda demo.
            </p>
          ) : (
            <>
              <AffiliationGate clinicId={selected.id} />
              <PreviewSandboxCalendar clinicId={selected.id} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
