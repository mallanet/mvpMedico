/**
 * Fetch clinic favicons into public/clinics/ and update data/ecuador-clinics.json.
 * Prefer site icons; fall back to Google s2 favicon CDN (128px).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = path.join(root, "data/ecuador-clinics.json");
const outDir = path.join(root, "public/clinics");

const UA =
  "Mozilla/5.0 (compatible; WairaClinicIconBot/1.0; +https://waira.local)";

function hostnameOf(website) {
  try {
    return new URL(website).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function absUrl(base, href) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function extFromContentType(ct, url) {
  const lower = (ct || "").toLowerCase();
  if (lower.includes("svg")) return "svg";
  if (lower.includes("png")) return "png";
  if (lower.includes("jpeg") || lower.includes("jpg")) return "jpg";
  if (lower.includes("webp")) return "webp";
  if (lower.includes("ico") || lower.includes("icon")) return "ico";
  const m = url.match(/\.(svg|png|jpe?g|webp|ico)(?:\?|$)/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "png";
}

async function fetchBuf(url, timeoutMs = 12_000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": UA, accept: "image/*,*/*" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 32) return null;
    return { buf, contentType: res.headers.get("content-type") || "", url };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function iconsFromHtml(website) {
  const htmlRes = await fetch(website, {
    headers: { "user-agent": UA, accept: "text/html" },
    redirect: "follow",
  }).catch(() => null);
  if (!htmlRes?.ok) return [];
  const html = await htmlRes.text();
  const base = htmlRes.url || website;
  const hrefs = [];
  const re =
    /<link[^>]+rel=["']([^"']*icon[^"']*|apple-touch-icon[^"']*)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (href) {
      const abs = absUrl(base, href);
      if (abs) hrefs.push(abs);
    }
  }
  hrefs.push(absUrl(base, "/favicon.ico"));
  hrefs.push(absUrl(base, "/apple-touch-icon.png"));
  return [...new Set(hrefs.filter(Boolean))];
}

async function resolveIcon(website) {
  const host = hostnameOf(website);
  if (!host) return null;

  const candidates = await iconsFromHtml(website);
  for (const url of candidates) {
    const hit = await fetchBuf(url);
    if (hit) return hit;
  }

  // High-quality fallback (128px) when site icons fail
  const g = await fetchBuf(
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`,
  );
  return g;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const bundle = JSON.parse(await readFile(jsonPath, "utf8"));
  const results = [];

  for (const clinic of bundle.clinics) {
    process.stdout.write(`icon ${clinic.id}… `);
    const hit = await resolveIcon(clinic.website);
    if (!hit) {
      console.log("fallback placeholder");
      clinic.image = {
        kind: "placeholder",
        accent: clinic.image?.accent || "forest",
      };
      results.push({ id: clinic.id, ok: false });
      continue;
    }
    const ext = extFromContentType(hit.contentType, hit.url);
    const file = `${clinic.id}.${ext}`;
    await writeFile(path.join(outDir, file), hit.buf);
    clinic.image = {
      kind: "favicon",
      accent: clinic.image?.accent || "forest",
      src: `/clinics/${file}`,
    };
    console.log(`ok → ${file} (${hit.buf.length}b)`);
    results.push({ id: clinic.id, ok: true, file });
  }

  bundle.meta.note =
    "Seed interno (Exa). Iconos: favicon del sitio cuando existe; si no, placeholder geométrico.";
  bundle.meta.iconsFetched = new Date().toISOString().slice(0, 10);
  await writeFile(jsonPath, `${JSON.stringify(bundle, null, 2)}\n`);
  const ok = results.filter((r) => r.ok).length;
  console.log(`\nDone: ${ok}/${results.length} icons → public/clinics/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
