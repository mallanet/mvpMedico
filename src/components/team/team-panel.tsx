"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addProfessional, inviteReception } from "@/lib/appointments";
import { MAX_RESOURCES_PER_CLINIC } from "@/lib/clinic-limits";
import type { ClinicMember, Resource } from "@/lib/types";

type ProfessionalRow = Resource & { slug: string | null; published: boolean };

type Props = {
  professionals: ProfessionalRow[];
  members: ClinicMember[];
  canManage: boolean;
  membershipActive: boolean;
  isDemo: boolean;
};

export function TeamPanel({
  professionals,
  members,
  canManage,
  membershipActive,
  isDemo,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onAddProfessional(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setOk(null);
    const form = new FormData(event.currentTarget);
    const result = await addProfessional({
      displayName: String(form.get("displayName") ?? ""),
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOk("Profesional agregado. Publicá su landing desde Perfil.");
    event.currentTarget.reset();
    router.refresh();
  }

  async function onInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setOk(null);
    const form = new FormData(event.currentTarget);
    const result = await inviteReception({
      fullName: String(form.get("fullName") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? "password123"),
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOk(
      isDemo
        ? "Recepción agregada al equipo (demo: entrá con ese email)."
        : "Cuenta de recepción creada. Ya puede iniciar sesión.",
    );
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <div className="grid max-w-3xl gap-10">
      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {ok ? (
        <p
          className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900"
          role="status"
        >
          {ok}
        </p>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-teal-950">
            Profesionales
          </h2>
          <p className="text-sm text-teal-900/70">
            Hasta {MAX_RESOURCES_PER_CLINIC} agendas en el consultorio.
          </p>
        </div>
        <ul className="divide-y divide-teal-900/10 rounded-[var(--radius-panel)] border border-teal-900/10 bg-white/80">
          {professionals.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-teal-950">{p.display_name}</p>
                {p.slug ? (
                  <Link
                    href={`/l/${p.slug}`}
                    className="text-teal-800 underline underline-offset-2"
                  >
                    /l/{p.slug}
                  </Link>
                ) : (
                  <span className="text-teal-900/55">Landing no publicada</span>
                )}
              </div>
              <span className="text-xs text-teal-900/60">
                {p.published ? "Publicado" : "Borrador"}
              </span>
            </li>
          ))}
        </ul>

        {canManage ? (
          <form
            onSubmit={onAddProfessional}
            className="flex flex-wrap items-end gap-3"
          >
            <label className="flex min-w-[14rem] flex-1 flex-col gap-1 text-sm">
              Nombre del profesional
              <input
                name="displayName"
                required
                className="field"
                disabled={!membershipActive || loading}
                placeholder="Dra. Ejemplo"
              />
            </label>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                !membershipActive ||
                loading ||
                professionals.length >= MAX_RESOURCES_PER_CLINIC
              }
            >
              Agregar
            </button>
          </form>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-teal-950">
            Equipo
          </h2>
          <p className="text-sm text-teal-900/70">
            Médicos y recepción con acceso a la agenda.
          </p>
        </div>
        <ul className="divide-y divide-teal-900/10 rounded-[var(--radius-panel)] border border-teal-900/10 bg-white/80">
          {members.map((m) => (
            <li
              key={m.profileId}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-teal-950">
                  {m.fullName ?? "Sin nombre"}
                </p>
                {m.email ? (
                  <p className="text-teal-900/60">{m.email}</p>
                ) : null}
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-teal-800/70">
                {m.role === "reception" ? "Recepción" : "Médico"}
              </span>
            </li>
          ))}
        </ul>

        {canManage ? (
          <form onSubmit={onInvite} className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Nombre recepción
              <input
                name="fullName"
                required
                className="field"
                disabled={!membershipActive || loading}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Email
              <input
                name="email"
                type="email"
                required
                className="field"
                disabled={!membershipActive || loading}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Contraseña inicial
              <input
                name="password"
                type="password"
                minLength={8}
                required={!isDemo}
                defaultValue={isDemo ? "password123" : undefined}
                className="field"
                disabled={!membershipActive || loading}
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!membershipActive || loading}
              >
                Invitar recepción
              </button>
              {isDemo ? (
                <p className="mt-2 text-xs text-teal-900/55">
                  En demo la cuenta seed es{" "}
                  <code>reception@example.com</code> /{" "}
                  <code>password123</code>.
                </p>
              ) : null}
            </div>
          </form>
        ) : null}
      </section>
    </div>
  );
}
