"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WairaMark } from "@/components/waira-mark";
import type { AppRole } from "@/lib/types";

const publicLinks = [
  { href: "/servicios", label: "Servicios" },
  { href: "/directorio", label: "Directorio" },
  { href: "/calculadora", label: "Calculadora" },
  { href: "/preview", label: "Preview" },
];

type Props = {
  signedIn: boolean;
  role: AppRole | null;
};

export function AppNavBar({ signedIn, role }: Props) {
  const pathname = usePathname();
  const isPublicLanding =
    pathname.startsWith("/l/") ||
    pathname.startsWith("/preview") ||
    pathname.startsWith("/clinicas") ||
    pathname.startsWith("/calculadora") ||
    pathname.startsWith("/servicios") ||
    pathname.startsWith("/directorio");

  const appLinks: { href: string; label: string }[] = [];
  if (role === "admin_waira") {
    appLinks.push({ href: "/admin/memberships", label: "Membresías" });
  } else if (role === "reception") {
    appLinks.push(
      { href: "/calendar", label: "Agenda" },
      { href: "/team", label: "Equipo" },
    );
  } else if (role === "doctor") {
    appLinks.push(
      { href: "/calendar", label: "Agenda" },
      { href: "/team", label: "Equipo" },
      { href: "/onboarding", label: "Perfil / Landing" },
    );
  }

  return (
    <header className="border-b border-[color:var(--brand-forest)]/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2">
        <Link
          href={signedIn && !isPublicLanding ? "/calendar" : "/"}
          className="nav-link text-[color:var(--foreground)]"
          aria-label="Waira"
        >
          <WairaMark size="sm" decorative />
        </Link>

        {pathname.startsWith("/l/") ? null : signedIn ? (
          <nav
            className="flex flex-wrap items-center gap-1 text-[color:var(--foreground)]/80"
            aria-label="Principal"
          >
            {appLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link hover:bg-[color:var(--brand-foam)] hover:text-[color:var(--foreground)]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/directorio"
              className="nav-link hover:bg-[color:var(--brand-foam)]"
            >
              Directorio
            </Link>
            <Link
              href="/servicios"
              className="nav-link hover:bg-[color:var(--brand-foam)]"
            >
              Servicios
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="nav-link border border-[color:var(--brand-forest)]/25 hover:bg-[color:var(--brand-foam)]"
              >
                Salir
              </button>
            </form>
          </nav>
        ) : (
          <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Cuenta">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link text-[color:var(--foreground)]/80 hover:bg-[color:var(--brand-foam)]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="nav-link text-[color:var(--foreground)]/80 hover:bg-[color:var(--brand-foam)]"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="nav-link font-medium text-[color:var(--brand-forest)] hover:bg-[color:var(--brand-foam)]"
            >
              Crear cuenta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
