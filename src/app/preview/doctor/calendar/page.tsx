import type { Metadata } from "next";
import Link from "next/link";
import { MasterCalendar } from "@/components/preview/master-calendar";
import { listEcuadorClinics } from "@/lib/ecuador-clinics";

export const metadata: Metadata = {
  title: "Calendario master · Doctor demo · Waira",
  description: "Todos los turnos del doctor demo entre clínicas afiliadas.",
};

export default function PreviewDoctorCalendarPage() {
  const clinics = listEcuadorClinics();

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-[color:var(--brand-forest)]/70">
            Preview sandbox
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            Calendario master
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[color:var(--foreground)]/70">
            Vista unificada del doctor. Tocá un turno para ir a la agenda de esa
            clínica. El solape entre sedes se rechaza al crear o mover.
          </p>
        </div>
        <Link href="/preview/doctor" className="btn btn-secondary">
          Panel doctor
        </Link>
      </header>

      <MasterCalendar clinics={clinics} />
    </div>
  );
}
