import type { Metadata } from "next";
import Link from "next/link";
import { BookingIsland } from "@/components/booking/booking-island";
import { ClinicCard } from "@/components/directory/clinic-card";
import { ClinicCardMedia } from "@/components/directory/clinic-card-media";
import { ClinicPicker } from "@/components/preview/clinic-picker";
import { SandboxDoctorBanner } from "@/components/preview/sandbox-doctor-banner";
import {
  ecuadorClinicsBundle,
  getEcuadorClinic,
  listEcuadorClinics,
} from "@/lib/ecuador-clinics";

export const metadata: Metadata = {
  title: "Perfil · Agendar · Waira",
  description:
    "Conocé al profesional, leé su ficha y pedí turno sin crear cuenta.",
};

type Props = {
  searchParams: Promise<{ clinic?: string }>;
};

export default async function PreviewProfilePage({ searchParams }: Props) {
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
    <div className="space-y-12">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:items-start">
        <aside className="space-y-3 lg:sticky lg:top-6">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[color:var(--foreground)]">
            Elegí clínica u hospital
          </h2>
          <p className="text-xs leading-relaxed text-[color:var(--foreground)]/60">
            Demo local ({ecuadorClinicsBundle.clinics.length} establecimientos).
            Los turnos se guardan en tu navegador.{" "}
            <Link
              href="/preview/doctor"
              className="font-medium text-[color:var(--brand-forest)] underline underline-offset-2"
            >
              Panel doctor
            </Link>
            {" · "}
            <Link
              href="/preview/doctor/calendar"
              className="font-medium text-[color:var(--brand-forest)] underline underline-offset-2"
            >
              Calendario master
            </Link>
          </p>
          <ClinicPicker
            clinics={clinics}
            selectedId={selected?.id ?? null}
          />
        </aside>

        <div className="min-w-0 space-y-4">
          {invalidId ? (
            <div
              className="rounded-[var(--radius-panel)] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
              role="alert"
            >
              No encontramos la clínica{" "}
              <code className="font-medium">{requested}</code>. Elegí otra en la
              lista.
            </div>
          ) : null}

          {!selected ? (
            <div className="rounded-[var(--radius-panel)] border border-[color:var(--brand-forest)]/12 bg-white p-6">
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[color:var(--foreground)]">
                Perfil demo
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--foreground)]/70">
                Seleccioná una clínica o hospital a la izquierda para ver el
                perfil y pedir un turno de prueba.
              </p>
            </div>
          ) : (
            <article className="preview-panel">
              <header className="preview-panel__profile">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="w-12 shrink-0 overflow-hidden rounded-[var(--radius-control)] border border-[color:var(--brand-forest)]/10">
                    <ClinicCardMedia clinic={selected} compact />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--brand-forest)]/70">
                      {selected.type === "hospital" ? "Hospital" : "Clínica"} ·{" "}
                      {selected.city}
                    </p>
                    <h1 className="min-w-0 break-words font-[family-name:var(--font-display)] text-xl font-semibold leading-snug text-[color:var(--foreground)] sm:text-2xl">
                      {selected.name}
                    </h1>
                    <p className="text-sm leading-relaxed text-[color:var(--foreground)]/75">
                      {selected.seo.notes}
                    </p>
                  </div>
                </div>

                <SandboxDoctorBanner />

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <a
                    href={selected.website}
                    className="text-sm font-medium text-[color:var(--brand-forest)] underline underline-offset-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {selected.website.replace(/^https?:\/\//, "")}
                  </a>
                  <Link
                    href={`/preview/agenda?clinic=${encodeURIComponent(selected.id)}`}
                    className="btn btn-secondary"
                  >
                    Ver agenda demo
                  </Link>
                  <Link
                    href="/clinicas"
                    className="text-sm font-medium text-[color:var(--brand-forest)] underline underline-offset-2"
                  >
                    Directorio
                  </Link>
                </div>
              </header>

              <div className="preview-panel__booking">
                <BookingIsland
                  key={selected.id}
                  slug={`sandbox-${selected.id}`}
                  doctorName="Dra. Valentina Reyes"
                  specialty="Cardiología"
                  ctaLabel="Pedir turno"
                  sandboxClinicId={selected.id}
                  embedded
                />
              </div>
            </article>
          )}
        </div>
      </div>

      <section className="space-y-5" aria-labelledby="preview-directory">
        <div className="max-w-2xl space-y-2">
          <h2
            id="preview-directory"
            className="font-[family-name:var(--font-display)] text-xl font-semibold text-[color:var(--foreground)]"
          >
            Todas las fichas
          </h2>
          <p className="text-sm leading-relaxed text-[color:var(--foreground)]/70">
            {ecuadorClinicsBundle.meta.note}{" "}
            <Link
              href="/clinicas"
              className="font-medium text-[color:var(--brand-forest)] underline underline-offset-2"
            >
              Abrir directorio
            </Link>
            .
          </p>
        </div>
        <div className="clinic-grid">
          {clinics.map((clinic) => (
            <ClinicCard key={clinic.id} clinic={clinic} />
          ))}
        </div>
      </section>
    </div>
  );
}
