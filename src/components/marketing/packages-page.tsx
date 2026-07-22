import Link from "next/link";
import { WairaMark } from "@/components/waira-mark";
import {
  CENTRO_RANGES,
  PACKAGE_ADDONS,
  WAIRA_PACKAGES,
  formatUsd,
  type FeatureStatus,
  type PackageTier,
} from "@/lib/marketing/packages";

function StatusHint({ status }: { status: FeatureStatus }) {
  if (status === "live") {
    return (
      <span className="text-xs font-medium text-teal-800/80">Incluído</span>
    );
  }
  return (
    <span className="text-xs font-medium text-amber-800/90">Próximamente</span>
  );
}

function PackageCard({ tier }: { tier: PackageTier }) {
  const priceLabel =
    tier.monthlyUsd != null
      ? `${formatUsd(tier.monthlyUsd)}/mes`
      : "Por rango";
  const setupLabel =
    tier.setupUsd != null ? `Setup ${formatUsd(tier.setupUsd)}` : "Setup según rango";

  return (
    <article
      className={`flex h-full flex-col rounded-[var(--radius-panel)] border bg-white/85 p-5 shadow-sm sm:p-6 ${
        tier.highlighted
          ? "border-teal-800/35 ring-1 ring-teal-800/20"
          : "border-teal-900/10"
      }`}
    >
      <div className="space-y-2">
        {tier.highlighted ? (
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-teal-800/70">
            Recomendado
          </p>
        ) : null}
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-teal-950">
          {tier.name}
        </h3>
        <p className="text-sm leading-relaxed text-teal-900/70">{tier.audience}</p>
      </div>

      <div className="mt-5 space-y-1 border-t border-teal-900/10 pt-4">
        <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums text-teal-950">
          {priceLabel}
        </p>
        <p className="text-sm text-teal-900/65">
          {setupLabel}
          {tier.monthlyNote ? ` · ${tier.monthlyNote}` : null}
        </p>
      </div>

      <ul className="mt-5 flex-1 space-y-3">
        {tier.features.map((feature) => (
          <li
            key={feature.label}
            className="flex items-start justify-between gap-3 text-sm text-teal-900/85"
          >
            <span className="leading-snug">{feature.label}</span>
            <StatusHint status={feature.status} />
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Link href="/signup" className="btn btn-primary w-full justify-center">
          Empezar con {tier.name}
        </Link>
      </div>
    </article>
  );
}

export function PackagesPage() {
  return (
    <div className="space-y-20 py-8 sm:py-12">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-12">
        <div className="min-w-0 space-y-5">
          <WairaMark size="lg" />
          <h1 className="max-w-xl font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight leading-[1.1] text-teal-950 sm:text-5xl sm:leading-[1.05]">
            Paquetes claros. Un horario sin solapes.
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-teal-900/75">
            Tres niveles según el tamaño de tu práctica. Directorio incluido.
            Landing y automatizaciones avanzadas, cuando las necesites.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-primary">
              Crear cuenta
            </Link>
            <Link href="/calculadora" className="btn btn-secondary">
              Ver calculadora de no-shows
            </Link>
          </div>
        </div>

        <aside
          className="rounded-[var(--radius-panel)] border border-teal-900/10 bg-white/80 p-5 shadow-sm sm:p-6"
          aria-label="Qué incluye siempre"
        >
          <p className="text-sm font-medium text-teal-950">En todos los paquetes</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-teal-900/75">
            <li>Perfil en el Directorio Waira, sin costo extra</li>
            <li>Agenda central con anti-solape</li>
            <li>Reserva web para el paciente</li>
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-teal-900/55">
            Lo marcado como “Próximamente” forma parte del roadmap del paquete;
            no está activo hoy en la cuenta.
          </p>
        </aside>
      </section>

      <section className="space-y-6" aria-labelledby="packages-heading">
        <div className="max-w-2xl space-y-2">
          <h2
            id="packages-heading"
            className="font-[family-name:var(--font-display)] text-2xl font-semibold text-teal-950"
          >
            Elige tu paquete
          </h2>
          <p className="text-base text-teal-900/70">
            Precios de trabajo (opción Balance). Sin cobro online todavía: creas
            la cuenta y coordinamos la activación.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {WAIRA_PACKAGES.map((tier) => (
            <PackageCard key={tier.id} tier={tier} />
          ))}
        </div>
      </section>

      <section className="space-y-5" aria-labelledby="centro-ranges-heading">
        <div className="max-w-2xl space-y-2">
          <h2
            id="centro-ranges-heading"
            className="font-[family-name:var(--font-display)] text-2xl font-semibold text-teal-950"
          >
            Centro Médico — rangos
          </h2>
          <p className="text-base text-teal-900/70">
            Tarifa fija según la cantidad de profesionales (Modelo A).
          </p>
        </div>

        <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-teal-900/10 bg-white/80 shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-teal-900/10 text-teal-900/60">
              <tr>
                <th className="px-4 py-3 font-medium sm:px-5">Profesionales</th>
                <th className="px-4 py-3 font-medium sm:px-5">Mensual</th>
                <th className="px-4 py-3 font-medium sm:px-5">Setup</th>
              </tr>
            </thead>
            <tbody>
              {CENTRO_RANGES.map((row) => (
                <tr
                  key={row.professionals}
                  className="border-b border-teal-900/10 last:border-0"
                >
                  <td className="px-4 py-3 text-teal-950 sm:px-5">
                    {row.professionals}
                    {row.note ? (
                      <span className="mt-0.5 block text-xs text-teal-900/55">
                        {row.note}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-teal-900/85 sm:px-5">
                    {formatUsd(row.monthlyUsd)}/mes
                  </td>
                  <td className="px-4 py-3 tabular-nums text-teal-900/85 sm:px-5">
                    {formatUsd(row.setupUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-5" aria-labelledby="addons-heading">
        <div className="max-w-2xl space-y-2">
          <h2
            id="addons-heading"
            className="font-[family-name:var(--font-display)] text-2xl font-semibold text-teal-950"
          >
            Add-ons
          </h2>
          <p className="text-base text-teal-900/70">
            No vienen por defecto. Se activan si el consultorio los pide.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {PACKAGE_ADDONS.map((addon) => (
            <article
              key={addon.id}
              className="rounded-[var(--radius-panel)] border border-teal-900/10 bg-white/80 p-5 shadow-sm sm:p-6"
            >
              <h3 className="text-lg font-semibold text-teal-950">{addon.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-teal-900/70">
                {addon.description}
              </p>
              <p className="mt-4 text-sm tabular-nums text-teal-900/85">
                Setup {formatUsd(addon.setupUsd)}
                {" · "}
                {formatUsd(addon.monthlyUsd)}/mes
                {addon.monthlyAloneUsd != null
                  ? ` (o ${formatUsd(addon.monthlyAloneUsd)}/mes sola)`
                  : null}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-panel)] border border-teal-900/10 bg-teal-50/70 px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-lg space-y-2">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-teal-950">
              ¿Cuánto te cuestan los no-shows?
            </h2>
            <p className="text-sm leading-relaxed text-teal-900/70">
              Estima la pérdida mensual y compárala con el paquete. Después
              activa la cuenta.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/calculadora" className="btn btn-secondary">
              Abrir calculadora
            </Link>
            <Link href="/signup" className="btn btn-primary">
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
