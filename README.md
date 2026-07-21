# mvpMedico (Waira)

Agenda centralizada para médicos: anti-solape, landing pública y asistente web de reserva.

Producto / negocio: ver [`base.md`](./base.md).  
Contrato de agentes (obligatorio): [`AGENTS.md`](./AGENTS.md).  
Cómo colaborar (kleosr, christianmock, jseramn): [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Equipo y colaboración AI-first

| Persona | Rol |
| --- | --- |
| kleosr | Fuente de código (Cursor propio) |
| christianmock | Fuente de código (Cursor propio) |
| jseramn | Fuente de código (Cursor propio) |

Cada uno usa sus skills y workflows. La **base del repo** (`AGENTS.md` + rule Cursor) es obligatoria; los aditivos personales no deben romper la neutralidad ni la cadena de suministro a 3.

```text
AGENTS.md               Contrato base para todos los agentes
CONTRIBUTING.md         Playbook humano
.specify/               Constitution + plantillas de spec/plan/tasks
specs/                  Un directorio por feature (NNN-short-name)
.cursor/rules/          Puente mínimo Cursor → AGENTS.md
```

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Auth, Postgres, RLS)
- Playwright (E2E)
- Hosting objetivo: Vercel + Supabase Cloud

## Setup local

### 1. Dependencias

```bash
npm install
cp .env.example .env.local
```

### 2. Supabase local (Docker requerido)

```bash
npx supabase start
npx supabase db reset
```

Copiá `API URL` y `anon key` / `service_role` de la salida de `supabase start` a `.env.local`.

### 3. App

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

### 4. Primer médico (o seed)

**Opción A — seed local** (después de `db reset`):

| Usuario | Password | Notas |
| --- | --- | --- |
| `doctor@example.com` | `password123` | membresía activa, landing `/l/dra-demo` |
| `admin@example.com` | `password123` | rol `admin_waira` |

**Opción B — signup:**

1. `/signup` → crea `profiles`, clínica, `resource`, landing draft y membresía `paused` (triggers)
2. Activá membresía (SQL o Admin Waira):

```sql
update public.memberships set status = 'active', activated_at = now();
-- opcional admin:
update public.profiles set role = 'admin_waira' where id = '<user-id>';
```

3. `/onboarding` → publicar landing
4. `/calendar` → grilla Lun–Sáb 08–20 (anti-solape en DB)
5. `/l/<slug>` → reserva pública con slots de 30 min
6. `/preview` → sandbox: elegí cualquier clínica del directorio, pedí turno (localStorage), `/preview/agenda` para la grilla demo
7. `/clinicas` → directorio seed Ecuador (no son tenants Waira reales)

## Scripts

| Script | Uso |
| --- | --- |
| `npm run dev` | App local |
| `npm run build` | Build producción |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright |
| `npm run db:start` / `db:reset` | Supabase local |
| `npm run icons:clinics` | Descargar favicons a `public/clinics/` |
| `npm run banners:clinics` | Regenerar banners SVG a ancho completo |
| `npm run cf:build` | Build OpenNext para Cloudflare Workers |
| `npm run cf:deploy` | Build + deploy a Cloudflare |
| `npm run cf:preview` | Preview local del worker |

## Deploy (Cloudflare Workers — review continuo)

Cada push a `main` o `feature/**` dispara [`.github/workflows/deploy-cloudflare.yml`](.github/workflows/deploy-cloudflare.yml).

Secrets de GitHub requeridos:

- `CLOUDFLARE_API_TOKEN` — token con permiso Workers Edit
- `CLOUDFLARE_ACCOUNT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` — URL pública del worker (ej. `https://waira-mvpmedico.<subdomain>.workers.dev`)
- `NEXT_PUBLIC_MALLANET_DONATION_URL` (opcional)

Local (con Node ≥22 y token en el entorno):

```bash
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
npm run cf:deploy
```

Worker name: `waira-mvpmedico` ([`wrangler.jsonc`](wrangler.jsonc)).

## Deploy (Vercel + Supabase Cloud)

Checklist mínimo para que el deploy no rompa auth:

Smoke tests corren sin backend real (home + login UI).

Para agenda / landing autenticados:

```bash
E2E_DOCTOR_EMAIL=... E2E_DOCTOR_PASSWORD=... E2E_LANDING_SLUG=... npm run test:e2e
```

Checklist mínimo (base.md §9):

- [ ] Crear turno
- [ ] Rechazar solape
- [ ] Cancelar turno
- [ ] Reservar desde landing

## Deploy (Vercel + Supabase Cloud)

Checklist mínimo para que el deploy no rompa auth:

1. **Supabase Cloud**
   - Crear proyecto → Settings → API: copiar `URL`, `anon`, `service_role`
   - Authentication → URL Configuration:
     - Site URL: `https://tu-dominio.vercel.app`
     - Redirect URLs: `https://tu-dominio.vercel.app/auth/callback`
   - Authentication → Providers → Email: desactivar “Confirm email” en MVP (o el signup queda en limbo)
   - SQL / CLI: `npx supabase link --project-ref <ref>` luego `npx supabase db push`

2. **Vercel**
   - Importar este repo (framework Next.js; `vercel.json` ya fija `npm ci` + `npm run build`)
   - Node.js **22+** (`package.json` → `engines`)
   - Environment Variables (Production **y** Preview):

| Variable | Obligatoria | Notas |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | sí | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sí | anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | no | solo server si hace falta admin |
| `NEXT_PUBLIC_APP_URL` | sí | `https://tu-dominio.vercel.app` (sin `/` final) |
| `NEXT_PUBLIC_MALLANET_DONATION_URL` | no | CTA donación |

3. **Smoke post-deploy**
   - `/` carga
   - `/signup` crea cuenta y llega a `/onboarding` (o email link si confirmación está on)
   - Activar membresía (SQL o `/admin/memberships` con `admin_waira`)
   - `/calendar` grilla
   - `/l/<slug>` reserva
   - `/preview` perfil demo

4. **Redeploy** después de cambiar `NEXT_PUBLIC_*` (se inlinerán en el build).

## Estructura

```text
/
├── base.md
├── AGENTS.md
├── CONTRIBUTING.md
├── README.md
├── data/             # seeds (p.ej. ecuador-clinics.json)
├── specs/
├── e2e/
├── supabase/migrations/
└── src/
    ├── app/          # rutas públicas + panel
    ├── components/
    └── lib/          # supabase, appointments, slots
```

## Convenciones

- Docs en español; código/commits en inglés
- Ramas `feature/`, `fix/`, `chore/` + PRs chicos
- Ver `AGENTS.md` para la ley de agentes y la cadena de suministro a 3
