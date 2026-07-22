import type { Metadata } from "next";
import { PackagesPage } from "@/components/marketing/packages-page";

export const metadata: Metadata = {
  title: "Servicios y paquetes | Waira",
  description:
    "Arranque, Consultorio Activo y Centro Médico: paquetes Waira con Directorio incluido, agenda anti-solape y precios claros.",
};

export default function ServiciosRoutePage() {
  return <PackagesPage />;
}
