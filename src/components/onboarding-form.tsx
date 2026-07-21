"use client";

import { FormEvent, useMemo, useState } from "react";
import { updateOnboarding } from "@/lib/appointments";
import type { DirectoryProfile, Landing, Profile } from "@/lib/types";

type Props = {
  profile: Profile;
  landing: Landing;
  directory: DirectoryProfile;
  membershipActive: boolean;
};

export function OnboardingForm({
  profile,
  landing,
  directory,
  membershipActive,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState(landing.slug);
  const [copied, setCopied] = useState(false);

  const publicUrl = useMemo(() => {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
    return `${base}/l/${slug}`;
  }, [slug]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(event.currentTarget);
    const result = await updateOnboarding({
      fullName: String(form.get("fullName")),
      specialty: String(form.get("specialty")),
      zone: String(form.get("zone")),
      bioShort: String(form.get("bioShort")),
      headline: String(form.get("headline")),
      body: String(form.get("body")),
      slug: String(form.get("slug")),
      publishLanding: form.get("publishLanding") === "on",
      publishMallanet: form.get("publishMallanet") === "on",
      showDonationCta: form.get("showDonationCta") === "on",
    });

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess("Perfil y landing guardados.");
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-4">
      {!membershipActive ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Membresía pausada: podés editar el perfil, pero no publicar landing ni Mallanet
          hasta que Admin Waira active la membresía.
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        Nombre
        <input
          name="fullName"
          defaultValue={profile.full_name ?? ""}
          required
          className="rounded-lg border px-3 py-2"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Especialidad
          <input
            name="specialty"
            defaultValue={directory.specialty}
            className="rounded-lg border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Zona
          <input
            name="zone"
            defaultValue={directory.zone}
            className="rounded-lg border px-3 py-2"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Bio corta
        <textarea
          name="bioShort"
          defaultValue={directory.bio_short}
          rows={2}
          className="rounded-lg border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Slug de landing
        <input
          name="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          className="rounded-lg border px-3 py-2"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-teal-900/10 bg-teal-50/40 px-3 py-2 text-sm">
        <span className="text-teal-900/70">URL pública:</span>
        <code className="text-teal-950">{publicUrl}</code>
        <button
          type="button"
          className="rounded-md border border-teal-900/15 bg-white px-2 py-1 text-xs hover:bg-teal-50"
          onClick={async () => {
            await navigator.clipboard.writeText(publicUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Headline
        <input
          name="headline"
          defaultValue={landing.headline}
          className="rounded-lg border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Texto de landing
        <textarea
          name="body"
          defaultValue={landing.body}
          rows={4}
          className="rounded-lg border px-3 py-2"
        />
      </label>

      <fieldset className="grid gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input name="publishLanding" type="checkbox" defaultChecked={landing.is_published} />
          Publicar landing
        </label>
        <label className="flex items-center gap-2">
          <input
            name="publishMallanet"
            type="checkbox"
            defaultChecked={directory.published_to_mallanet}
          />
          Marcar publicado en Mallanet
        </label>
        <label className="flex items-center gap-2">
          <input
            name="showDonationCta"
            type="checkbox"
            defaultChecked={landing.show_donation_cta}
          />
          Mostrar CTA donación Mallanet
        </label>
      </fieldset>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">{success}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-fit rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
      >
        {loading ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
