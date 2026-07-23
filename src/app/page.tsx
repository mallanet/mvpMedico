import Link from "next/link";
import { NoShowCalculator } from "@/components/calculator/no-show-calculator";
import { WairaMark } from "@/components/waira-mark";

const diptychs = [
  {
    icon: "/brand/icons/guest-book.svg",
    title: "Reserva sin cuenta",
    body: "El paciente pide turno en la landing. Sin registro. Sin base de usuarios que mantener.",
    flip: false,
  },
  {
    icon: "/brand/icons/anti-overlap.svg",
    title: "Anti-solape",
    body: "Un recurso, un intervalo. Si el hueco está tomado, no entra otro turno activo.",
    flip: true,
  },
  {
    icon: "/brand/icons/busy-block.svg",
    title: "Huecos reales",
    body: "Solo se ofrecen intervalos libres en la agenda Waira. Sin calendarios externos que peleen por el mismo slot.",
    flip: false,
  },
  {
    icon: "/brand/icons/calendar.svg",
    title: "Agenda central",
    body: "Un horario de verdad para el consultorio. Landing pública + asistente web.",
    flip: true,
  },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-20 py-8 sm:py-12">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-14">
        <div className="min-w-0 space-y-6">
          <WairaMark size="lg" />
          <h1 className="max-w-xl min-w-0 break-words font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight leading-[1.1] text-teal-950 sm:text-5xl sm:leading-[1.05]">
            Un horario. Sin solapes.
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-teal-900/75">
            Agenda central con anti-solape y landing pública. El paciente agenda
            sin registrarse.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="btn btn-primary">
              Activar membresía
            </Link>
            <Link href="/preview" className="btn btn-secondary">
              Ver perfil demo
            </Link>
          </div>
        </div>

        <aside
          className="relative min-w-0 overflow-hidden rounded-[var(--radius-panel)] border border-teal-900/10 bg-white/80 p-5 shadow-sm sm:p-6 lg:mb-1"
          aria-label="Vista de agenda"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-medium text-teal-950">Agenda del día</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/icons/calendar.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7"
            />
          </div>
          <ul className="space-y-2 text-sm text-teal-900/80">
            <li className="flex items-center gap-3 rounded-lg bg-teal-50 px-3 py-2.5">
              <span className="w-12 shrink-0 font-medium tabular-nums text-teal-800">
                09:00
              </span>
              <span>Libre</span>
            </li>
            <li className="flex items-center gap-3 rounded-lg border border-teal-900/10 bg-white px-3 py-2.5">
              <span className="w-12 shrink-0 font-medium tabular-nums text-teal-800">
                10:00
              </span>
              <span>Bloque interno</span>
            </li>
            <li className="flex items-center gap-3 rounded-lg bg-teal-50 px-3 py-2.5">
              <span className="w-12 shrink-0 font-medium tabular-nums text-teal-800">
                11:00
              </span>
              <span>Turno web · sin cuenta</span>
            </li>
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-teal-900/60">
            Un recurso por médico. Lo ocupado no se ofrece.
          </p>
        </aside>
      </section>

      <section aria-labelledby="sistema-heading" className="space-y-0">
        <h2
          id="sistema-heading"
          className="mb-10 max-w-xl font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-teal-950 sm:text-3xl"
        >
          Sistema en cuatro piezas
        </h2>
        <ul className="divide-y divide-teal-900/10 border-y border-teal-900/10">
          {diptychs.map((item) => (
            <li
              key={item.title}
              className={`grid gap-6 py-10 sm:grid-cols-2 sm:items-center sm:gap-10 ${
                item.flip ? "sm:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="min-w-0 space-y-2">
                <h3 className="text-lg font-medium text-teal-950">{item.title}</h3>
                <p className="max-w-md text-sm leading-relaxed text-teal-900/70">
                  {item.body}
                </p>
              </div>
              <div
                className={`flex ${item.flip ? "sm:justify-start" : "sm:justify-end"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.icon}
                  alt=""
                  width={72}
                  height={72}
                  className="h-[4.5rem] w-[4.5rem]"
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="noshow-heading"
        className="space-y-8 border-t border-teal-900/10 pt-12"
      >
        <div className="max-w-xl space-y-2">
          <p className="inline-flex rounded-full border border-teal-900/15 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
            Diagnóstico gratis · 30 segundos
          </p>
          <h2
            id="noshow-heading"
            className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-teal-950 sm:text-3xl"
          >
            ¿Cuánto dinero se te escapa por cada cita fantasma?
          </h2>
          <p className="text-sm leading-relaxed text-teal-900/70">
            Ingresa tu tarifa y cuántos pacientes no llegan. En segundos ves lo
            que estás perdiendo hoy — y cuánto podrías recuperar con Waira.
          </p>
        </div>
        <NoShowCalculator mode="teaser" />
      </section>

      <section
        aria-labelledby="spec-heading"
        className="grid gap-8 border-t border-teal-900/10 pt-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-14"
      >
        <h2
          id="spec-heading"
          className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-teal-950 sm:text-3xl"
        >
          Especificación v1
        </h2>
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[18rem] border-collapse text-left text-sm text-teal-900/80">
            <caption className="sr-only">
              Capacidades del producto en la versión actual
            </caption>
            <tbody>
              <tr className="border-b border-teal-900/10">
                <th scope="row" className="py-3.5 pr-4 font-medium text-teal-950">
                  Paciente
                </th>
                <td className="py-3.5">Reserva web sin registro</td>
              </tr>
              <tr className="border-b border-teal-900/10">
                <th scope="row" className="py-3.5 pr-4 font-medium text-teal-950">
                  Agenda
                </th>
                <td className="py-3.5">Anti-solape por recurso</td>
              </tr>
              <tr className="border-b border-teal-900/10">
                <th scope="row" className="py-3.5 pr-4 font-medium text-teal-950">
                  Perfil
                </th>
                <td className="py-3.5">Landing pública + reserva</td>
              </tr>
              <tr>
                <th scope="row" className="py-3.5 pr-4 font-medium text-teal-950">
                  Membresía
                </th>
                <td className="py-3.5">$100 USD / mes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-t border-teal-900/10 pt-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-xl space-y-2">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-teal-950">
              Empezá por la membresía
            </h2>
            <p className="text-sm leading-relaxed text-teal-900/70">
              Cuenta para el consultorio. Pacientes sin cuenta.
            </p>
          </div>
          <Link href="/signup" className="btn btn-primary shrink-0">
            Activar membresía
          </Link>
        </div>
      </section>
    </div>
  );
}
