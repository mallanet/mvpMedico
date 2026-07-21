/**
 * Generate crisp full-bleed SVG banners for clinic cards.
 * Vector → never pixelated; sized for card media (1200×480).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = path.join(root, "data/ecuador-clinics.json");
const outDir = path.join(root, "public/clinics");

const ACCENTS = {
  forest: { a: "#0c4040", b: "#105151", c: "#1a6b6b", ink: "#ffffff" },
  lagoon: { a: "#105151", b: "#25cec9", c: "#7ee8e4", ink: "#0f2926" },
  mist: { a: "#9ad9d4", b: "#e3fffc", c: "#105151", ink: "#105151" },
};

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function esc(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function bannerSvg(clinic) {
  const accent = ACCENTS[clinic.image?.accent] || ACCENTS.forest;
  const h = hash(clinic.id);
  const cx1 = 180 + (h % 40);
  const cy1 = 120 + ((h >> 3) % 50);
  const cx2 = 980 - ((h >> 6) % 60);
  const cy2 = 320 - ((h >> 9) % 40);
  const typeLabel =
    clinic.type === "hospital" ? "Hospital" : "Clínica";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="480" viewBox="0 0 1200 480" role="img" aria-label="${esc(clinic.name)}">
  <defs>
    <linearGradient id="g-${esc(clinic.id)}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accent.a}"/>
      <stop offset="55%" stop-color="${accent.b}"/>
      <stop offset="100%" stop-color="${accent.c}"/>
    </linearGradient>
    <radialGradient id="v-${esc(clinic.id)}" cx="30%" cy="20%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <pattern id="d-${esc(clinic.id)}" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="1.4" fill="#ffffff" fill-opacity="0.14"/>
    </pattern>
  </defs>
  <rect width="1200" height="480" fill="url(#g-${esc(clinic.id)})"/>
  <rect width="1200" height="480" fill="url(#v-${esc(clinic.id)})"/>
  <rect width="1200" height="480" fill="url(#d-${esc(clinic.id)})"/>
  <g opacity="0.22" fill="none" stroke="#ffffff" stroke-width="2">
    <circle cx="${cx1}" cy="${cy1}" r="140"/>
    <circle cx="${cx1}" cy="${cy1}" r="92"/>
    <circle cx="${cx2}" cy="${cy2}" r="170"/>
  </g>
  <text x="48" y="52" font-family="system-ui,Segoe UI,sans-serif" font-size="22" font-weight="600" letter-spacing="0.16em" fill="${accent.ink}" fill-opacity="0.75">${esc(typeLabel.toUpperCase())} · ${esc(clinic.city.toUpperCase())}</text>
</svg>
`;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const bundle = JSON.parse(await readFile(jsonPath, "utf8"));

  for (const clinic of bundle.clinics) {
    const file = `${clinic.id}-banner.svg`;
    await writeFile(path.join(outDir, file), bannerSvg(clinic), "utf8");
    clinic.image = {
      kind: "cover",
      accent: clinic.image?.accent || "forest",
      src: `/clinics/${file}`,
      logo: clinic.image?.logo,
    };
    console.log(`banner ${clinic.id} → ${file}`);
  }

  bundle.meta.note =
    "Directorio seed de clínicas y hospitales en Ecuador. Logos generados en alta calidad sobre banner vectorial.";
  bundle.meta.bannersGenerated = new Date().toISOString().slice(0, 10);
  await writeFile(jsonPath, `${JSON.stringify(bundle, null, 2)}\n`);
  console.log(`\nDone: ${bundle.clinics.length} banners → public/clinics/*-banner.svg`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
