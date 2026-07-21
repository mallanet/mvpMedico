import Link from "next/link";

export default function LandingNotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.15] text-teal-950">
        Landing no encontrada
      </h1>
      <p className="text-sm leading-relaxed text-teal-900/70">
        El perfil no está publicado o el enlace está mal.
      </p>
      <Link href="/" className="btn btn-primary inline-flex">
        Volver al inicio
      </Link>
    </div>
  );
}
