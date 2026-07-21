import Link from "next/link";

export default function LandingNotFound() {
  return (
    <div className="space-y-3 py-16 text-center">
      <h1 className="text-2xl font-semibold text-stone-900">Landing no encontrada</h1>
      <p className="text-sm text-stone-600">
        Puede que el perfil no esté publicado o el enlace sea incorrecto.
      </p>
      <Link href="/" className="text-sm font-medium text-teal-800 underline">
        Volver al inicio
      </Link>
    </div>
  );
}
