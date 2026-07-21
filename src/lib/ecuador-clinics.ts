import raw from "../../data/ecuador-clinics.json";

export type ClinicAccent = "forest" | "lagoon" | "mist";

export type EcuadorClinicImage =
  | { kind: "placeholder"; accent: ClinicAccent; src?: undefined; logo?: undefined }
  | { kind: "favicon"; accent: ClinicAccent; src: string; logo?: string }
  | { kind: "cover"; accent: ClinicAccent; src: string; logo?: string };

export type EcuadorClinic = {
  id: string;
  name: string;
  city: string;
  province: string;
  type: "hospital" | "clinica";
  sector: string;
  website: string;
  seo: {
    primary_keywords: string[];
    notes: string;
  };
  image: EcuadorClinicImage;
};

export type EcuadorClinicsBundle = {
  meta: {
    generated: string;
    note: string;
    sources: string[];
    iconsFetched?: string;
    bannersGenerated?: string;
    logosGenerated?: string;
  };
  clinics: EcuadorClinic[];
};

export const ecuadorClinicsBundle = raw as EcuadorClinicsBundle;

export function listEcuadorClinics(): EcuadorClinic[] {
  return ecuadorClinicsBundle.clinics;
}

export function getEcuadorClinic(id: string): EcuadorClinic | undefined {
  return ecuadorClinicsBundle.clinics.find((c) => c.id === id);
}

export function clinicInitials(name: string): string {
  const parts = name
    .replace(/Hospital|Clínica|Clinica|Grupo|de|los|la|el/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] ?? "W";
  const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "A";
  return `${a}${b}`.toUpperCase();
}
