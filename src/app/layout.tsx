import type { Metadata } from "next";
import { DM_Sans, Source_Serif_4 } from "next/font/google";
import { AppNav } from "@/components/app-nav";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Waira · mvpMedico",
  description: "Agenda centralizada para médicos — anti-solape e integraciones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${dmSans.variable} ${sourceSerif.variable} antialiased`}>
        <AppNav />
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
