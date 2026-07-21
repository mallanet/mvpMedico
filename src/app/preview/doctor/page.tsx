import type { Metadata } from "next";
import { DoctorPanel } from "@/components/preview/doctor-panel";
import { listEcuadorClinics } from "@/lib/ecuador-clinics";

export const metadata: Metadata = {
  title: "Doctor demo · Preview · Waira",
  description:
    "Panel sandbox: afiliá clínicas, definí bloques de presencia y abrí el calendario master.",
};

export default function PreviewDoctorPage() {
  const clinics = listEcuadorClinics();

  return (
    <div className="space-y-4">
      <p className="text-sm uppercase tracking-[0.18em] text-teal-800/70">
        Preview sandbox
      </p>
      <DoctorPanel clinics={clinics} />
    </div>
  );
}
