import type { Metadata } from "next";
import Link from "next/link";
import { DoctorPanel } from "@/components/preview/doctor-panel";
import { listEcuadorClinics } from "@/lib/ecuador-clinics";

export const metadata: Metadata = {
  title: "Doctor demo · Preview · Waira",
  description:
    "Panel sandbox: afiliá clínicas, definí horarios y abrí el calendario master.",
};

export default function PreviewDoctorPage() {
  const clinics = listEcuadorClinics();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-[color:var(--brand-forest)]/70">
          Preview sandbox
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
          Panel doctor
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[color:var(--foreground)]/70">
          El doctor demo rota entre clínicas. Definí presencia por sede; el
          calendario master evita solapes entre ellas. Todo queda en tu
          navegador.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link href="/preview" className="text-sm font-medium text-[color:var(--brand-forest)] underline underline-offset-2">
            Perfil / pedir turno
          </Link>
          <Link href="/preview/doctor/calendar" className="text-sm font-medium text-[color:var(--brand-forest)] underline underline-offset-2">
            Calendario master
          </Link>
        </div>
      </header>

      <DoctorPanel clinics={clinics} />
    </div>
  );
}
