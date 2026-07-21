type Props = {
  size?: "sm" | "md" | "lg";
  /** When true, mark is decorative beside visible "Waira" text */
  decorative?: boolean;
};

const heights = { sm: 28, md: 36, lg: 56 } as const;

export function WairaMark({ size = "md", decorative = false }: Props) {
  const h = heights[size];
  return (
    <span className="inline-flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG from /public */}
      <img
        src="/brand/waira-isotipo.svg"
        alt={decorative ? "" : "Waira"}
        width={Math.round(h * 1.27)}
        height={h}
        style={{ height: h, width: "auto" }}
      />
      <span
        className="font-[family-name:var(--font-elms-sans)] font-semibold tracking-tight text-teal-950"
        style={{ fontSize: Math.round(h * 0.55) }}
      >
        Waira
      </span>
    </span>
  );
}
