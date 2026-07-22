import type { Metadata } from "next";
import { NoShowCalculator } from "@/components/calculator/no-show-calculator";

export const metadata: Metadata = {
  title: "Calculadora de no-shows | Waira",
  description:
    "Diagnóstico gratis en 30 segundos: cuánto dinero se te escapa por citas fantasma y cuánto podrías recuperar con Waira.",
};

export default function CalculadoraPage() {
  return (
    <div className="space-y-8 py-8 sm:py-12">
      <header className="max-w-2xl space-y-3">
        <p className="inline-flex rounded-full border border-teal-900/15 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
          Diagnóstico gratis · 30 segundos
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-teal-950 sm:text-4xl sm:leading-[1.1]">
          ¿Cuánto dinero se te escapa por cada cita fantasma?
        </h1>
        <p className="text-base leading-relaxed text-teal-900/75">
          Ingresa tu tarifa y cuántos pacientes no llegan. En segundos ves lo
          que estás perdiendo hoy — y cuánto podrías recuperar con Waira.
        </p>
      </header>

      <NoShowCalculator mode="full" />
    </div>
  );
}
