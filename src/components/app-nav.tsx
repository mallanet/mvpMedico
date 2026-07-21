import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const links = [
  { href: "/calendar", label: "Agenda" },
  { href: "/onboarding", label: "Perfil / Landing" },
  { href: "/conflicts", label: "Conflictos" },
  { href: "/settings/google", label: "Google" },
  { href: "/admin/memberships", label: "Membresías" },
];

export async function AppNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-teal-900/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/calendar" className="text-lg font-semibold tracking-tight text-teal-950">
          Waira
        </Link>
        {user ? (
          <nav className="flex flex-wrap items-center gap-3 text-sm text-teal-900/80">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2 py-1 hover:bg-teal-50 hover:text-teal-950"
              >
                {link.label}
              </Link>
            ))}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-md border border-teal-900/15 px-2 py-1 font-[family-name:var(--font-dm-sans)] hover:bg-teal-50"
              >
                Salir
              </button>
            </form>
          </nav>
        ) : (
          <nav className="flex gap-3 text-sm">
            <Link href="/login" className="hover:underline">
              Entrar
            </Link>
            <Link href="/signup" className="font-medium text-teal-800 hover:underline">
              Crear cuenta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
