type Props = {
  children: React.ReactNode;
  tone?: "amber" | "red" | "teal";
};

const tones = {
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  red: "border-red-200 bg-red-50 text-red-950",
  teal: "border-teal-200 bg-teal-50 text-teal-950",
};

export function Banner({ children, tone = "amber" }: Props) {
  return (
    <p
      className={`rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}
      role="status"
    >
      {children}
    </p>
  );
}
