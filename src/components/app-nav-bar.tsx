"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WairaMark } from "@/components/waira-mark";

const appLinks = [
  { href: "/calendar", label: "Agenda" },
  { href: "/onboarding", label: "Perfil / Landing" },
  { href: "/admin/memberships", label: "Membresías" },
];

const publicLinks = [
  { href: "/clinicas", label: "Clínicas" },
  { href: "/preview", label: "Preview" },
  { href: "/preview/doctor", label: "Doctor demo" },
];

export function AppNavBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const isPublicLanding =
    pathname.startsWith("/l/") ||
    pathname.startsWith("/preview") ||
    pathname.startsWith("/clinicas");

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
              href="/preview"
              className="nav-link hover:bg-[color:var(--brand-foam)]"
            >
              Preview
            </Link>
            <Link
              href="/preview/doctor"
              className="nav-link hover:bg-[color:var(--brand-foam)]"
            >
              Doctor demo
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
