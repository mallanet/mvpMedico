import Link from "next/link";

export default function HomePage() {
  return (
    <section className="grid gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
      <div className="space-y-5">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-800/70">
          Waira
        </p>
        <h1 className="max-w-xl font-[family-name:var(--font-source-serif)] text-4xl leading-tight text-teal-950 sm:text-5xl">
          Una agenda. Sin dobles reservas.
        </h1>
        <p className="max-w-lg text-base leading-relaxed text-teal-900/75">
          Membresía para médicos: landing, asistente de contacto y agenda central
          con anti-solape e integración a Google Calendar (busy).
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-teal-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-900"
          >
            Empezar
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-teal-900/15 bg-white px-5 py-2.5 text-sm font-medium text-teal-950 hover:bg-teal-50"
          >
            Entrar
          </Link>
        </div>
      </div>
      <aside className="rounded-2xl border border-teal-900/10 bg-white/70 p-6 text-sm leading-relaxed text-teal-900/80 shadow-sm">
        <p className="mb-2 font-medium text-teal-950">Flujo v1</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Paciente encuentra al médico (Mallanet → landing)</li>
          <li>Pide turno en el formulario web</li>
          <li>Agenda central evita solapes y bloquea busy de Google</li>
        </ol>
      </aside>
    </section>
  );
}
