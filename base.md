# mvpMedico — Documento base

Documento de alineación del equipo. Si algo de producto cambia, se edita acá (mejor en un PR que en un chat suelto).

**Última actualización:** 2026-07-22  
**Estado:** paquetes Arranque/Consultorio operativos en demo (confirmación, recepción, multi-agenda, directorio) + página comercial `/servicios`

Nombres que usamos: **Waira** vende; **mvpMedico** es el repo y el producto técnico; **Mallanet** es el hub (directorio y donaciones). El **Directorio Waira** es el directorio público propio incluido en todos los paquetes (visibilidad vía Mallanet / flags actuales).

---

## 1. Problema

Los médicos llevan varias agendas a la vez: consultorio, hospital, WhatsApp, Google Calendar, software de turnos, Excel. De ahí salen dobles reservas, huecos que no son reales, roce entre recepción y paciente, y tiempo tirado reconciliando calendarios.

Online tampoco alcanza con “estar en internet”: el paciente busca especialidad y un modo de pedir turno que no sea un hilo de WhatsApp.

## 2. Qué hacemos

Waira vende paquetes (implementación + recurrencia mensual). Según el paquete, el cliente recibe:

1. Perfil en el **Directorio Waira** (incluido en todos los paquetes)
2. Agenda central con anti-solape (fuente de verdad en Postgres; sin Google Calendar)
3. Formulario/asistente web de reserva (mensajería / recordatorio de pago: roadmap)
4. **Landing** como add-on (no viene por defecto en el paquete base)

No metemos HCE avanzada, telemedicina ni facturación electrónica / obras sociales en esta fase. HCE básica solo como add-on bajo pedido.

```text
Paciente                Médico / Clínica              Comunidad
   │                         │                            │
   ▼                         ▼                            ▼
Directorio Waira        Paquetes Waira              Donación opcional
   │                    (Arranque / Consultorio /   → Mallanet
   │                     Centro) + add-ons
   └──── landing* ───────────┘
              │  *add-on
              ▼
         mvpMedico (agenda + asistente)
```

Oferta pública: [`/servicios`](src/app/servicios/page.tsx).

---

## 3. Glosario

| Término | Definición |
| --- | --- |
| **Waira** | Marca que vende los paquetes y hace el onboarding del médico |
| **Mallanet** | Hub: directorio/donaciones/reputación compartida (integración con Directorio Waira) |
| **mvpMedico** | Nombre técnico del producto/repo (agenda + landing + sync) |
| **Paquete** | Oferta comercial: Arranque, Consultorio Activo o Centro Médico/Clínica (setup + mensual) |
| **Arranque** | Paquete para profesional independiente |
| **Consultorio Activo** | Paquete para consultorio con 1–5 profesionales |
| **Centro Médico / Clínica** | Paquete para clínicas 5–60+ con precio por rangos (Modelo A) |
| **Membresía** | Suscripción activa del paquete contratado (estado `active`/`paused` en producto) |
| **Perfil de directorio** | Ficha pública en el Directorio Waira (especialidad, zona, enlace) |
| **Landing** | Página del médico entre el descubrimiento y la reserva; **add-on**, no default del paquete |
| **Asistente** | Flujo automatizado de contacto/reserva que crea turnos en la agenda (en v1, web) |
| **Agenda central** | Fuente de verdad de disponibilidad y turnos (Postgres) |
| **Recurso** | En v1, un médico |
| **Turno** | Intervalo reservado (`starts_at`–`ends_at`) de un recurso |
| **Solape** | Dos turnos activos del mismo recurso que se cruzan (no permitido) |
| **Donación Mallanet** | Aporte voluntario del paciente o la comunidad; no es el precio del producto |
| **Clínica** | Organización dueña de recursos; en v1 suele ser un médico = una clínica simple |
| **Recepción** | Persona que crea y mueve turnos, además del asistente |

---

## 4. Dinero

Precios públicos de trabajo (propuesta paquetes MVP v2 — opción **Balance** / **Modelo A**). Detalle en `/servicios`.

| Paquete | Para quién | Setup | Mensual |
| --- | --- | ---: | ---: |
| **Arranque** | Profesional independiente | $150 | $35 |
| **Consultorio Activo** | 1–5 profesionales | $350 | $89 (hasta 5) |
| **Centro Médico / Clínica** | 5–60+ | según rango | según rango (Modelo A) |

### Centro — Modelo A (flat por rango)

| Profesionales | Mensual | Setup |
| --- | ---: | ---: |
| 5–10 | $180 | $400 |
| 11–20 | $320 | $700 |
| 21–30 | $450 | $1 000 |
| 31–50 | $650 | $1 500 |
| 51–60+ | $850 (60+: cotización) | $2 000 |

| | |
| --- | --- |
| Quién paga | Médico o clínica |
| Incluido siempre | Perfil Directorio Waira + agenda (anti-solape) + asistente web |
| Add-ons | Landing profesional; HCE básica bajo pedido |
| Donación | Opcional, a Mallanet; no sustituye el paquete |
| Cobro | Waira cobra setup + suscripción; Mallanet no; Stripe aún por definir |

Éxito de negocio en esta fase: cerrar paquetes pagados y sostener operación sin armar turnos a mano.

---

## 5. Roles (v1)

| Rol | Hace |
| --- | --- |
| **Médico** | Agenda, bloques, confirma/cancela, edita perfil y landing |
| **Recepción** | Crea y mueve turnos, mira disponibilidad real |
| **Paciente** | Encuentra al médico en Mallanet → landing → pide turno o contacto (sin cuenta obligatoria) |
| **Admin Waira** | Activa membresías, publica u oculta perfiles en el directorio |

Permisos finos y multi-sede quedan fuera de v1.

---

## 6. MVP v1 — entra

- [x] Auth (Supabase): médico + recepción
- [x] Onboarding: cuenta → perfil → publicar landing
- [x] Perfil de directorio + flag “publicado en Mallanet”
- [x] Landing por médico (especialidad, bio corta, CTA de reserva/contacto) — capacidad técnica; comercialmente es **add-on**
- [x] Calendario por médico (`resource`)
- [x] CRUD de turnos
- [x] Anti-solapamiento
- [x] Formulario/asistente web que crea el turno (mensajería después, si hace falta)
- [x] Datos mínimos del paciente visibles junto al turno
- [x] CTA opcional de donación a Mallanet en la landing (no bloquea la reserva)
- [x] Página comercial `/servicios` con paquetes organizados (precios Balance / Modelo A)

> Implementación inicial en el repo (2026-07-20). Activar membresía + Supabase local/cloud para probar end-to-end. Google Calendar retirado del MVP (2026-07-21). Paquetes comerciales alineados a propuesta v2 (2026-07-21).

Éxito de producto: el médico con paquete activo es encontrable, agenda sin solapes, y el visitante entiende la oferta en `/servicios` sin confundir roadmap con features ya shippeadas.

## 7. MVP v1 — no entra

- Telemedicina
- Facturación electrónica / obras sociales / reembolsos a aseguradoras
- Historia clínica avanzada / completa (HCE básica solo add-on bajo pedido)
- Control de inventario avanzado
- App nativa
- Marketplace de precios o subasta de turnos
- IA de diagnóstico
- Google Calendar / sync de calendarios externos
- Escritura agresiva bidireccional a calendarios de terceros
- Multi-país / HIPAA formal (más allá de acceso básico bien hecho)
- Vivir solo de donaciones
- Un médico en N clínicas el día 1 (multiagenda multi-sede: roadmap / add-on comercial)
- Recordatorio de pago WhatsApp/SMS y lista de espera automatizada (roadmap del paquete; no shippeados)

---

## 8. Arquitectura

```text
Paciente ──► Mallanet ──► Landing ──► Asistente / form
                                          │
Médico / Recepción ──► Next.js ◄──────────┘
                         │
                         ├─► Supabase (Auth + Postgres + RLS) ─ anti-solape
                         └─► Mallanet (publicar perfil / CTA donación)
```

- Postgres guarda la verdad de los turnos internos
- El anti-solape no se salta: exclusion constraint en `appointments`
- RLS por clínica / médico
- Server Actions o API routes para publicación de perfil
- Landing y app en el mismo Next.js (rutas públicas vs autenticadas)

### Tablas mínimas

- `profiles` — usuario y rol
- `clinics` — organización
- `clinic_members` — membresía y rol en la clínica
- `memberships` — suscripción Waira (activo/pausado)
- `resources` — médico bookable
- `directory_profiles` — ficha pública + `published_to_mallanet`
- `landings` — slug, copy, CTA, flag donación
- `appointments` — turnos
- `patients_min` — nombre, teléfono, email opcional

Constraint: no dos turnos activos solapados por `resource_id`.

Límites de v1: una timezone IANA por clínica; sin multi-sede.

---

## 9. Stack y convenciones

| Capa | Tecnología |
| --- | --- |
| App / landings | Next.js (App Router) + TypeScript + Tailwind |
| Backend | Supabase (Postgres, Auth, RLS) |
| Hosting | Vercel + Supabase cloud |
| Pagos | Por definir (Stripe o equivalente LatAm); no bloquea el scaffold de agenda |
| E2E | Playwright |
| Repo | GitHub |

- Docs y producto: español
- Código, commits, nombres de archivos/variables: inglés
- Ramas: `feature/`, `fix/`, `chore/` desde `main`
- PRs chicos, una preocupación, con el *por qué*
- Con 2+ personas activas: al menos un approve antes de merge a `main`
- Secretos fuera del repo (`.env.local`, Vercel, Supabase)
- Tests E2E: crear turno, rechazar solape, cancelar, reservar desde landing

Cuando exista el repo:

```text
/
├── base.md          ← este documento
├── README.md
├── apps/web o /     ← Next.js
├── supabase/
└── e2e/
```

---

## 10. Decisiones cerradas (2026-07-20)

| # | Tema | Decisión | Motivo |
| --- | --- | --- | --- |
| 1 | Reserva | Paciente desde landing **y** recepción/médico en la agenda | Sin paciente no sirve el directorio; sin recepción no cierra la clínica |
| 2 | Google Calendar | Fuera del MVP — agenda Waira es la única fuente de verdad | Menos superficie de OAuth y conflictos visuales |
| 3 | Unidad | Por médico | Consultorio/sala después |
| 4 | Datos paciente | Nombre + teléfono; email opcional | Alcanza para contactar |
| 5 | Multi-clínica | No en v1 | Onboarding y RLS más simples |
| 6 | Timezone | Una IANA por clínica | Evita líos de solape entre zonas |
| 7 | Nombres | Waira vende; mvpMedico = técnico; Mallanet = hub | Marca, producto y comunidad separados |
| 8 | Hosting | Vercel + Supabase | Rápido para landings |
| 9 | Ingreso | Paquetes Balance / Modelo A (ver §4); donación Mallanet aparte | Oferta escalable por tamaño; sin mezclar con donación |
| 10 | Asistente v1 | Formulario web; mensajería / recordatorio de pago después | Sin depender de WhatsApp Business el día 1 |
| 11 | Landing | Add-on comercial; capacidad técnica ya en el producto | Alineado a propuesta paquetes MVP v2 |
| 12 | Precios públicos | Solo opción Balance + Modelo A en `/servicios` | Evitar tres columnas de precio por paquete |

Reabrir solo si choca con implementación, legal o pagos.

---

## 11. Cómo trabajar

Contrato de agentes y playbook del trio: [`AGENTS.md`](AGENTS.md) + [`CONTRIBUTING.md`](CONTRIBUTING.md). Prompt en lenguaje natural; la base del repo es obligatoria; aditivos personales OK si no rompen la neutralidad.

1. Leer este documento y `AGENTS.md`
2. Pedir acceso a Supabase / Vercel / pagos cuando existan
3. Claim Issue → rama `feature/NNN-short-name` + `specs/NNN-…` → PR
4. PR aunque sea solo docs; 1 approve de otro del trio

Cambio de producto: editar la sección (y el glosario si cambia un término). Si reabres una fila de §10, en el PR: `Propuesta: …` y 3–5 líneas de trade-off. Actualizar la fecha arriba al mergear.

Weekly: avance hacia 100 membresías y una mejora landing→turno. Cada feature debería poder verse en UI o en un E2E.

---

## 12. Próximos pasos técnicos

1. [x] Scaffold Next.js + TypeScript + Tailwind
2. [x] Proyecto Supabase + migrations (tablas §8)
3. [x] Auth (email/password)
4. [x] RLS + anti-solape (+ smoke E2E)
5. [x] Calendario semanal visual (grilla Lun–Sáb 08–20)
6. [x] Landing pública por slug + formulario de reserva
7. [x] Google Calendar — retirado del MVP (2026-07-21)
8. [x] `memberships` + flag publicar a Mallanet (manual / admin)
9. [x] CTA donación Mallanet en la landing
10. [x] README de setup local

---

## 13. Pendiente (post-scaffold)

Orden sugerido de trabajo. El scaffold de §6 está en el repo; esto es lo que falta para operar y vender.

### Crítico

1. [x] **Disponibilidad + slots** — horario de atención y turnos bookables (30 min, Lun–Sáb)
2. [x] **Calendario semanal visual** — grilla usable para médico/recepción
3. [x] **Rol recepción** — invitar/usar recepción; signup bootstrapéa médico
4. [ ] **Cobro membresía** — Stripe u equivalente LatAm (hoy stub `active`/`paused`/`cancelled`)
5. [ ] **Deploy cloud** — Vercel + Supabase cloud (URL compartible)

### Integraciones / producto

6. [x] **Google Calendar** — retirado; no E2E OAuth
7. [ ] **API Mallanet** — publicación real al directorio (hoy: flag + `/directorio` local)
8. [x] **Notificaciones** — email al crear/confirmar/cancelar (Resend opcional; no-op sin key)
9. [x] **Confirmar turno** — médico/recepción → `confirmed`

### Calidad / equipo

10. [x] **E2E de caminos críticos** — smoke siempre; agenda/landing/admin con `E2E_*`
11. [x] **Seed demo** — `doctor@example.com` / `reception@example.com` / `admin@example.com` + landings demo
12. [x] **Multi-resource** — hasta 5 agendas por clínica + selector
13. [x] **Directorio Waira** — `/directorio` lista perfiles `published_to_mallanet`

Fuera de v1: ver §7.

---

## Changelog

| Fecha | Cambio |
| --- | --- |
| 2026-07-22 | Package completeness: confirmar, recepción, multi-resource, `/directorio`, notify email, copy honesto |
| 2026-07-21 | Paquetes comerciales v2: §4 Balance/Modelo A, landing add-on, página `/servicios` |
| 2026-07-21 | Wire-up: grilla semanal, slots públicos, seed demo, membership cancelled, E2E ampliados |
| 2026-07-20 | Primera versión: visión, MVP, stack |
| 2026-07-20 | Negocio Waira $100×100, Mallanet, landing+asistente, decisiones cerradas |
| 2026-07-20 | Unificado con CONTEXT (un solo doc) |
| 2026-07-20 | Scaffold Next.js + schema Supabase + agenda/landing/Google/memberships |
| 2026-07-20 | §13 pendientes post-scaffold (slots, recepción, deploy, pagos, E2E) |
