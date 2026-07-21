import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { PageHeader } from "@/components/page-header";
import { WairaMark } from "@/components/waira-mark";

export default function SignupPage() {
  return (
    <section className="mx-auto max-w-md space-y-8 py-4">
      <WairaMark size="md" />
      <PageHeader
        title="Crear cuenta"
        description="Al crear la cuenta armamos tu clínica, el consultorio y un borrador de landing."
      />
      <AuthForm mode="signup" />
      <p className="text-sm leading-relaxed text-teal-900/70">
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-950"
        >
          Entrar
        </Link>
      </p>
    </section>
  );
}
