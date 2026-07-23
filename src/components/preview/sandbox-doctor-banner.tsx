"use client";

import { useEffect, useState } from "react";
import {
  getSandboxDoctor,
  type DoctorSandbox,
} from "@/lib/preview-sandbox";

export function SandboxDoctorBanner() {
  const [doctor, setDoctor] = useState<DoctorSandbox | null>(null);

  useEffect(() => {
    setDoctor(getSandboxDoctor());
  }, []);

  if (!doctor) {
    return (
      <div
        className="skeleton-block h-12 w-full max-w-md"
        aria-hidden
      />
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-800/70">
        {doctor.specialty}
      </p>
      <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-teal-950">
        {doctor.displayName}
      </p>
      <p className="max-w-lg text-sm leading-relaxed text-teal-900/70">
        {doctor.bioShort}
      </p>
    </div>
  );
}
