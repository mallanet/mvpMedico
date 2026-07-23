import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function PageHeader({ title, description, children }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-teal-950">
          {title}
        </h1>
        {description ? (
          <p className="text-sm leading-relaxed text-teal-900/70">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
