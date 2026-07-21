# mvpMedico (Waira)

Agenda centralizada para médicos: anti-solape, landing pública, asistente web de reserva e integración Google Calendar (busy → bloqueo).

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
6. `/settings/google` → OAuth + sync FreeBusy (requiere vars Google; sin ellas → 501)

## Scripts

| Script | Uso |
| --- | --- |
| `npm run dev` | App local |
| `npm run build` | Build producción |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright |
| `npm run db:start` / `db:reset` | Supabase local |

## E2E

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

## Google Calendar

1. Google Cloud Console → OAuth client (web)
2. Redirect: `http://localhost:3000/api/google/callback` (o tu dominio)
3. Scopes: `calendar.readonly` (FreeBusy)
4. Completar `GOOGLE_*` en `.env.local` / Vercel

## Deploy (Vercel + Supabase Cloud)

1. Crear proyecto en [Supabase](https://supabase.com)
2. `npx supabase link --project-ref <ref>`
3. `npx supabase db push`
4. Importar el repo en Vercel
5. Variables de entorno (Production):

| Variable | Notas |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | solo server (sync Google) |
| `NEXT_PUBLIC_APP_URL` | `https://tu-dominio.vercel.app` |
| `NEXT_PUBLIC_MALLANET_DONATION_URL` | CTA donación |
| `GOOGLE_CLIENT_ID` / `SECRET` / `REDIRECT_URI` | OAuth |

6. Auth → Redirect URLs: `https://tu-dominio.vercel.app/auth/callback`
7. Deploy

## Estructura

```text
/
├── base.md
├── AGENTS.md
├── CONTRIBUTING.md
├── README.md
├── specs/
├── e2e/
├── supabase/migrations/
└── src/
    ├── app/          # rutas públicas + panel
    ├── components/
    └── lib/          # supabase, appointments, google
```

## Convenciones

- Docs en español; código/commits en inglés
- Ramas `feature/`, `fix/`, `chore/` + PRs chicos
- Ver `AGENTS.md` para la ley de agentes y la cadena de suministro a 3
