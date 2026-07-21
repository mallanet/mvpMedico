import type { Metadata } from "next";
import { ClinicCard } from "@/components/directory/clinic-card";
import {
  ecuadorClinicsBundle,
  listEcuadorClinics,
} from "@/lib/ecuador-clinics";

export const metadata: Metadata = {
  title: "Clínicas y hospitales · Ecuador · Waira",
  description:
    "Seed interno de establecimientos de salud en Ecuador con datos SEO de fuentes públicas.",
};

export default function ClinicasPage() {
  const clinics = listEcuadorClinics();

  return (
    <div className="space-y-8">
      <header className="max-w-2xl space-y-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
          Clínicas y hospitales · Ecuador
        </h1>
        <p className="text-sm leading-relaxed text-[color:var(--foreground)]/70">
          {ecuadorClinicsBundle.meta.note}
        </p>
        <p className="text-xs text-[color:var(--foreground)]/55">
          Fuentes:{" "}
          {ecuadorClinicsBundle.meta.sources.slice(0, 4).map((url, i) => (
            <span key={url}>
              {i > 0 ? " · " : null}
              <a
                href={url}
                className="underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                {new URL(url).hostname}
              </a>
            </span>
          ))}
          {" · "}y más en el JSON interno.
        </p>
      </header>

      <div className="clinic-grid">
        {clinics.map((clinic) => (
          <ClinicCard key={clinic.id} clinic={clinic} />
        ))}
      </div>
    </div>
  );
}
