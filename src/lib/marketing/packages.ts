export type FeatureStatus = "live" | "roadmap";

export type PackageFeature = {
  label: string;
  status: FeatureStatus;
};

export type PackageTier = {
  id: "arranque" | "consultorio" | "centro";
  name: string;
  audience: string;
  setupUsd: number | null;
  monthlyUsd: number | null;
  monthlyNote?: string;
  highlighted?: boolean;
  features: PackageFeature[];
};

export type CentroRange = {
  professionals: string;
  monthlyUsd: number;
  setupUsd: number;
  note?: string;
};

export type AddonOffer = {
  id: string;
  name: string;
  description: string;
  setupUsd: number;
  monthlyUsd: number;
  monthlyAloneUsd?: number;
};

export const WAIRA_PACKAGES: PackageTier[] = [
  {
    id: "arranque",
    name: "Arranque",
    audience:
      "Médico, psicólogo, nutricionista u otro profesional independiente.",
    setupUsd: 150,
    monthlyUsd: 35,
    features: [
      {
        label: "Perfil en el Directorio Waira",
        status: "live",
      },
      {
        label: "Agenda online con anti-solape",
        status: "live",
      },
      {
        label: "Reserva web sin cuenta para el paciente",
        status: "live",
      },
      {
        label: "Confirmación, cancelación y lista de espera",
        status: "live",
      },
      {
        label: "Recordatorio de pago anticipado (WhatsApp/SMS)",
        status: "roadmap",
      },
    ],
  },
  {
    id: "consultorio",
    name: "Consultorio Activo",
    audience: "Consultorio con 1 a 5 profesionales que comparten espacio.",
    setupUsd: 350,
    monthlyUsd: 89,
    monthlyNote: "hasta 5 profesionales",
    highlighted: true,
    features: [
      {
        label: "Todo lo de Arranque",
        status: "live",
      },
      {
        label: "Hasta 5 agendas de profesionales",
        status: "live",
      },
      {
        label: "Perfil de centro + nombres de profesionales",
        status: "live",
      },
      {
        label: "Seguimiento post-consulta y controles periódicos",
        status: "roadmap",
      },
      {
        label: "Mini-reporte de ocupación y no-show",
        status: "roadmap",
      },
    ],
  },
  {
    id: "centro",
    name: "Centro Médico / Clínica",
    audience:
      "Clínicas con 5 o más profesionales, horarios paralelos y staff.",
    setupUsd: null,
    monthlyUsd: null,
    monthlyNote: "precio por rango de profesionales",
    features: [
      {
        label: "Todo lo de Consultorio Activo",
        status: "live",
      },
      {
        label: "Multiagenda paralela multi-profesional",
        status: "roadmap",
      },
      {
        label: "Roles recepción, médico y administración",
        status: "live",
      },
      {
        label: "Perfil de clínica + profesionales en Directorio",
        status: "live",
      },
      {
        label: "Reportes avanzados por doctor y especialidad",
        status: "roadmap",
      },
    ],
  },
];

export const CENTRO_RANGES: CentroRange[] = [
  { professionals: "5 – 10", monthlyUsd: 180, setupUsd: 400 },
  { professionals: "11 – 20", monthlyUsd: 320, setupUsd: 700 },
  { professionals: "21 – 30", monthlyUsd: 450, setupUsd: 1000 },
  { professionals: "31 – 50", monthlyUsd: 650, setupUsd: 1500 },
  {
    professionals: "51 – 60+",
    monthlyUsd: 850,
    setupUsd: 2000,
    note: "60+: cotización personalizada",
  },
];

export const PACKAGE_ADDONS: AddonOffer[] = [
  {
    id: "landing-pro",
    name: "Landing page profesional",
    description:
      "Dominio o subdominio, SEO local básico, WhatsApp directo, galería e integración con la agenda.",
    setupUsd: 180,
    monthlyUsd: 9,
  },
  {
    id: "hce-basic",
    name: "Historia clínica digital básica",
    description:
      "Ficha del paciente, antecedentes y adjuntos. Solo bajo pedido; no incluida en ningún paquete.",
    setupUsd: 80,
    monthlyUsd: 15,
    monthlyAloneUsd: 20,
  },
];

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
