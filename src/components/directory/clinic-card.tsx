import Link from "next/link";
import { ClinicCardMedia } from "@/components/directory/clinic-card-media";
import type { EcuadorClinic } from "@/lib/ecuador-clinics";

export function ClinicCard({ clinic }: { clinic: EcuadorClinic }) {
  const typeLabel = clinic.type === "hospital" ? "Hospital" : "Clínica";

  return (
    <article className="clinic-card">
      <ClinicCardMedia clinic={clinic} />
      <div className="clinic-card__body">
        <p className="clinic-card__meta">
          {typeLabel} · {clinic.city}
        </p>
        <h3 className="clinic-card__title">{clinic.name}</h3>
        <p className="clinic-card__province">{clinic.province}</p>
        <div className="clinic-card__actions">
          <a
            href={clinic.website}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
          >
            Sitio oficial
          </a>
          <Link href={`/preview?clinic=${clinic.id}`} className="btn btn-primary">
            Ver perfil
          </Link>
        </div>
      </div>
    </article>
  );
}
