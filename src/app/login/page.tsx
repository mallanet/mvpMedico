import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-teal-950">Entrar</h1>
        <p className="text-sm text-teal-900/70">
          Médico o recepción — email y contraseña.
        </p>
      </div>
      <AuthForm mode="login" />
      <p className="text-sm text-teal-900/70">
        ¿No tenés cuenta?{" "}
        <Link href="/signup" className="font-medium text-teal-800 underline">
          Crear cuenta
        </Link>
      </p>
    </section>
  );
}
