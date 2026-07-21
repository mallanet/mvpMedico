import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <section className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-teal-950">Crear cuenta</h1>
        <p className="text-sm text-teal-900/70">
          Onboarding de médico: se crea clínica, recurso y landing draft.
        </p>
      </div>
      <AuthForm mode="signup" />
      <p className="text-sm text-teal-900/70">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-medium text-teal-800 underline">
          Entrar
        </Link>
      </p>
    </section>
  );
}
