# mvpMedico — Documento base

Documento de alineación del equipo. Si algo de producto cambia, se edita acá (mejor en un PR que en un chat suelto).

**Última actualización:** 2026-07-20  
**Estado:** decisiones de arranque cerradas

Nombres que usamos: **Waira** vende; **mvpMedico** es el repo y el producto técnico; **Mallanet** es el hub (directorio y donaciones).

---

## 1. Problema

Los médicos llevan varias agendas a la vez: consultorio, hospital, WhatsApp, Google Calendar, software de turnos, Excel. De ahí salen dobles reservas, huecos que no son reales, roce entre recepción y paciente, y tiempo tirado reconciliando calendarios.

Online tampoco alcanza con “estar en internet”: el paciente busca especialidad y un modo de pedir turno que no sea un hilo de WhatsApp.

## 2. Qué hacemos

Waira cobra una membresía. El médico recibe:

1. Ficha en el directorio de Mallanet
2. Landing propia (entre el directorio y la reserva)
3. Formulario/asistente de contacto que escribe en la agenda
4. Agenda central con anti-solape e integración con Google Calendar (leer ocupado y bloquear)

No metemos HCE, telemedicina ni facturación de obras sociales en esta fase.

```text
Paciente                Médico / Clínica              Comunidad
   │                         │                            │
   ▼                         ▼                            ▼
Mallanet (directorio)   Waira ($100/mes)            Donación opcional
   │                         │                      → Mallanet
   └──── landing ────────────┘
              │
              ▼
         mvpMedico (agenda + asistente + sync)
```

---

## 3. Glosario

| Término | Definición |
| --- | --- |
| **Waira** | Marca que vende la membresía y hace el onboarding del médico |
| **Mallanet** | Hub: directorio público, donaciones, reputación compartida |
| **mvpMedico** | Nombre técnico del producto/repo (agenda + landing + sync) |
| **Membresía** | $100 USD/mes: presencia + landing + asistente + agenda |
| **Perfil de directorio** | Ficha pública en Mallanet (especialidad, zona, enlace a la landing) |
| **Landing** | Página del médico entre el descubrimiento y la reserva/contacto |
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

| | |
| --- | --- |
| Quién paga | Médico o clínica |
| Cuánto | $100 USD/mes por membresía activa |
| Meta | ≥100 membresías (~$10 000 MRR) |
| Incluye | Perfil Mallanet + landing + asistente + agenda + Google Calendar (busy/bloqueo) |
| Donación | Opcional, a Mallanet; no sustituye la membresía |
| Cobro | Waira cobra la suscripción; Mallanet no |

Éxito de negocio en esta fase: poder sostener 100 membresías sin que alguien del equipo arme a mano cada turno.

---

## 5. Roles (v1)

| Rol | Hace |
| --- | --- |
| **Médico** | Agenda, bloques, confirma/cancela, conecta Google Calendar, edita perfil y landing |
| **Recepción** | Crea y mueve turnos, mira disponibilidad real |
| **Paciente** | Encuentra al médico en Mallanet → landing → pide turno o contacto (sin cuenta obligatoria) |
| **Admin Waira** | Activa membresías, publica u oculta perfiles en el directorio |

Permisos finos y multi-sede quedan fuera de v1.

---

## 6. MVP v1 — entra

- [x] Auth (Supabase): médico + recepción
- [x] Onboarding: cuenta → perfil → conectar calendario → publicar landing
- [x] Perfil de directorio + flag “publicado en Mallanet”
- [x] Landing por médico (especialidad, bio corta, CTA de reserva/contacto)
- [x] Calendario por médico (`resource`)
- [x] CRUD de turnos
- [x] Anti-solapamiento
- [x] Formulario/asistente web que crea el turno (mensajería después, si hace falta)
- [x] Datos mínimos del paciente visibles junto al turno
- [x] Google Calendar: importar ocupado y bloquear huecos (sin sync bidireccional completo)
- [x] Vista de conflictos si algo externo choca
- [x] CTA opcional de donación a Mallanet en la landing (no bloquea la reserva)

> Implementación inicial en el repo (2026-07-20). Activar membresía + Supabase local/cloud y credenciales Google para probar end-to-end.

Éxito de producto: el médico con membresía es encontrable, tiene landing viva, y deja de mantener dos agendas a mano para el flujo principal de turnos.

## 7. MVP v1 — no entra

- Telemedicina
- Facturación / obras sociales
- Historia clínica completa
- App nativa
- Marketplace de precios o subasta de turnos
- IA de diagnóstico
- Escritura agresiva bidireccional a Google Calendar
- Multi-país / HIPAA formal (más allá de acceso básico bien hecho)
- Vivir solo de donaciones
- Un médico en N clínicas el día 1

---

## 8. Arquitectura

```text
Paciente ──► Mallanet ──► Landing ──► Asistente / form
                                          │
Médico / Recepción ──► Next.js ◄──────────┘
                         │
                         ├─► Supabase (Auth + Postgres + RLS) ─ anti-solape
                         ├─► Google Calendar (leer busy + bloquear)
                         └─► Mallanet (publicar perfil / CTA donación)
```

- Postgres guarda la verdad de los turnos internos
- Una integración no puede saltarse el anti-solape sin dejar rastro
- RLS por clínica / médico
- Server Actions o API routes para sync y publicación de perfil
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
- `external_connections` — OAuth Google
- `external_events` — espejo de busy para conflictos

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
| 2 | Google Calendar | v1 = leer busy + bloquear; sync full = fase 2 | Menos chance de romper el calendario del médico |
| 3 | Unidad | Por médico | Consultorio/sala después |
| 4 | Datos paciente | Nombre + teléfono; email opcional | Alcanza para contactar |
| 5 | Multi-clínica | No en v1 | Onboarding y RLS más simples |
| 6 | Timezone | Una IANA por clínica | Evita líos de solape entre zonas |
| 7 | Nombres | Waira vende; mvpMedico = técnico; Mallanet = hub | Marca, producto y comunidad separados |
| 8 | Hosting | Vercel + Supabase | Rápido para landings |
| 9 | Ingreso | Membresía $100; donación Mallanet aparte | Meta 100×$100 sin mezclar con donación |
| 10 | Asistente v1 | Formulario web; mensajería después | Sin depender de WhatsApp Business el día 1 |

Reabrir solo si choca con implementación, legal o pagos.

---

## 11. Cómo trabajar

1. Leer este documento
2. Pedir acceso a Supabase / Vercel / pagos cuando existan
3. Rama desde `main`
4. PR aunque sea solo docs

Cambio de producto: editar la sección (y el glosario si cambia un término). Si reabrís una fila de §10, en el PR: `Propuesta: …` y 3–5 líneas de trade-off. Actualizar la fecha arriba al mergear.

Weekly: avance hacia 100 membresías y una mejora landing→turno. Cada feature debería poder verse en UI o en un E2E.

---

## 12. Próximos pasos técnicos

1. Scaffold Next.js + TypeScript + Tailwind
2. Proyecto Supabase + migrations (tablas §8)
3. Auth (magic link o email/password)
4. RLS + anti-solape + E2E
5. Calendario semanal mínimo
6. Landing pública por slug + formulario de reserva
7. Google Calendar OAuth (busy + block)
8. `memberships` + flag publicar a Mallanet (al inicio puede ser manual)
9. CTA donación Mallanet en la landing
10. README de setup local

---

## Changelog

| Fecha | Cambio |
| --- | --- |
| 2026-07-20 | Primera versión: visión, MVP, stack |
| 2026-07-20 | Negocio Waira $100×100, Mallanet, landing+asistente, decisiones cerradas |
| 2026-07-20 | Unificado con CONTEXT (un solo doc) |
| 2026-07-20 | Scaffold Next.js + schema Supabase + agenda/landing/Google/memberships |
