import type { Metadata } from "next";
import { AppNav } from "@/components/app-nav";
import { ResetDemoButton } from "@/components/demo/reset-demo-button";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waira · mvpMedico",
  description: "Agenda para médicos sin dobles reservas",
  icons: {
    icon: "/brand/waira-favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <a href="#content" className="skip-link">
          Saltar al contenido
        </a>
        <AppNav />
        <main
          id="content"
          className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 py-8 sm:px-6"
        >
          {children}
        </main>
        <footer className="border-t border-teal-900/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-teal-900/70 sm:px-6">
            <p className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/waira-isotipo.svg"
                alt=""
                width={20}
                height={16}
                className="h-4 w-auto"
              />
              <span>Agenda sin dobles reservas</span>
            </p>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <ResetDemoButton />
              <a
                href="https://mallanet.org"
                className="font-medium text-teal-800 underline-offset-2 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Mallanet
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
