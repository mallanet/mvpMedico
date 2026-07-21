import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { PageHeader } from "@/components/page-header";
import { WairaMark } from "@/components/waira-mark";

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md space-y-8 py-4">
      <WairaMark size="md" />
      <PageHeader
        title="Entrar"
        description="Médico o recepción, con email y contraseña."
      />
      <AuthForm mode="login" />
      <p className="text-sm leading-relaxed text-teal-900/70">
        ¿No tenés cuenta?{" "}
        <Link
          href="/signup"
          className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-950"
        >
          Crear cuenta
        </Link>
      </p>
    </section>
  );
}
