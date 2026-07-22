import type { Metadata } from "next";
import Link from "next/link";
import { listDirectoryProfiles } from "@/lib/appointments";

export const metadata: Metadata = {
  title: "Directorio Waira",
  description: "Profesionales con perfil publicado en el Directorio Waira.",
};

export const dynamic = "force-dynamic";

export default async function DirectorioPage() {
  const profiles = await listDirectoryProfiles();

  return (
    <div className="space-y-8">
      <header className="max-w-2xl space-y-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-teal-950">
          Directorio Waira
        </h1>
        <p className="text-sm leading-relaxed text-teal-900/70">
          Perfiles publicados por consultorios con membresía activa. Pedí
          turno desde la landing del profesional.
        </p>
      </header>

      {profiles.length === 0 ? (
        <p className="text-sm text-teal-900/70">
          Todavía no hay perfiles publicados en el directorio.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {profiles.map((p) => (
            <li
              key={p.resourceId}
              className="rounded-[var(--radius-panel)] border border-teal-900/10 bg-white/85 p-5 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-teal-800/70">
                {p.specialty || "Profesional"}
                {p.zone ? ` · ${p.zone}` : ""}
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-teal-950">
                {p.displayName}
              </h2>
              <p className="mt-1 text-sm text-teal-900/65">{p.clinicName}</p>
              {p.bioShort ? (
                <p className="mt-3 text-sm leading-relaxed text-teal-900/80">
                  {p.bioShort}
                </p>
              ) : null}
              {p.slug ? (
                <Link
                  href={`/l/${p.slug}`}
                  className="btn btn-primary mt-4 inline-flex"
                >
                  Pedir turno
                </Link>
              ) : (
                <p className="mt-4 text-xs text-teal-900/55">
                  Perfil visible; landing aún no publicada.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
