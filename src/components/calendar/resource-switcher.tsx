"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { selectResource } from "@/lib/appointments";
import type { Resource } from "@/lib/types";

type Props = {
  resources: Resource[];
  selectedId: string;
};

export function ResourceSwitcher({ resources, selectedId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (resources.length <= 1) return null;

  return (
    <label className="flex flex-col gap-1 text-sm text-teal-950">
      Profesional
      <select
        className="field min-w-[12rem]"
        value={selectedId}
        disabled={pending}
        onChange={(e) => {
          const id = e.target.value;
          startTransition(async () => {
            await selectResource(id);
            router.refresh();
          });
        }}
      >
        {resources.map((r) => (
          <option key={r.id} value={r.id}>
            {r.display_name}
          </option>
        ))}
      </select>
    </label>
  );
}
