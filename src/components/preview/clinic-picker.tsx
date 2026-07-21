"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { EcuadorClinic } from "@/lib/ecuador-clinics";

type Props = {
  clinics: EcuadorClinic[];
  selectedId: string | null;
  basePath?: string;
};

export function ClinicPicker({
  clinics,
  selectedId,
  basePath = "/preview",
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clinics;
    return clinics.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.province.toLowerCase().includes(q),
    );
  }, [clinics, query]);

  return (
    <div className="clinic-picker space-y-3">
      <label className="flex flex-col gap-1.5 text-sm text-[color:var(--foreground)]">
        Buscar clínica u hospital
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre, ciudad o provincia"
          className="field"
          autoComplete="off"
        />
      </label>
      <ul
        className="clinic-picker__list max-h-64 space-y-1 overflow-y-auto rounded-[var(--radius-panel)] border border-[color:var(--brand-forest)]/12 bg-white p-2"
        role="listbox"
        aria-label="Clínicas"
      >
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-sm text-[color:var(--foreground)]/60">
            Sin resultados.
          </li>
        ) : (
          filtered.map((clinic) => {
            const selected = clinic.id === selectedId;
            return (
              <li key={clinic.id}>
                <Link
                  href={`${basePath}?clinic=${encodeURIComponent(clinic.id)}`}
                  scroll={false}
                  role="option"
                  aria-selected={selected}
                  className={`flex w-full min-w-0 flex-col gap-0.5 rounded-[var(--radius-control)] px-3 py-2 text-left text-sm no-underline transition-colors duration-[var(--dur-fast)] ${
                    selected
                      ? "bg-[color:var(--brand-forest)] text-white"
                      : "text-[color:var(--foreground)] hover:bg-[color:var(--brand-foam)]"
                  }`}
                >
                  <span className="min-w-0 truncate font-medium">
                    {clinic.name}
                  </span>
                  <span
                    className={`text-xs ${selected ? "text-white/80" : "text-[color:var(--foreground)]/55"}`}
                  >
                    {clinic.city} · {clinic.province}
                  </span>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
