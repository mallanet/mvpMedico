"use client";

import { useState } from "react";
import {
  clinicInitials,
  type EcuadorClinic,
} from "@/lib/ecuador-clinics";

const accentClass: Record<EcuadorClinic["image"]["accent"], string> = {
  forest: "clinic-card__media--forest",
  lagoon: "clinic-card__media--lagoon",
  mist: "clinic-card__media--mist",
};

export function ClinicCardMedia({
  clinic,
  compact = false,
}: {
  clinic: EcuadorClinic;
  compact?: boolean;
}) {
  const [coverBroken, setCoverBroken] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);
  const initials = clinicInitials(clinic.name);
  const kind = clinic.image.kind;
  const coverSrc =
    (kind === "cover" || kind === "favicon") && clinic.image.src && !coverBroken
      ? clinic.image.src
      : null;
  const logoSrc =
    clinic.image.logo && !logoBroken ? clinic.image.logo : null;
  const isCover = kind === "cover" && Boolean(coverSrc);

  return (
    <div
      className={`clinic-card__media ${accentClass[clinic.image.accent]}${compact ? " clinic-card__media--compact" : ""}${isCover ? " clinic-card__media--cover" : ""}`}
      aria-hidden
    >
      {coverSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- local clinic asset
        <img
          src={coverSrc}
          alt=""
          width={isCover ? 1200 : compact ? 48 : 72}
          height={isCover ? 480 : compact ? 48 : 72}
          className={
            isCover
              ? "clinic-card__cover"
              : `clinic-card__icon${compact ? " clinic-card__icon--sm" : ""}`
          }
          loading="lazy"
          decoding="async"
          onError={() => setCoverBroken(true)}
        />
      ) : null}

      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- generated clinic logo
        <img
          src={logoSrc}
          alt=""
          width={compact ? 40 : 88}
          height={compact ? 40 : 88}
          className={`clinic-card__logo${compact ? " clinic-card__logo--sm" : ""}`}
          loading="lazy"
          decoding="async"
          onError={() => setLogoBroken(true)}
        />
      ) : !coverSrc || coverBroken ? (
        <>
          <span className="clinic-card__initials">{initials}</span>
          <span className="clinic-card__pattern" />
        </>
      ) : null}
    </div>
  );
}
