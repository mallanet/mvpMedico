# mvpMedico — Documento base

Documento vivo de alineación del equipo. Cualquier persona del repo puede proponer cambios vía PR. Preferimos editar este archivo antes de discutir decisiones en chats dispersos.

**Última actualización:** 2026-07-20  
**Estado:** borrador de arranque (definimos juntos lo abierto)

---

## 1. Visión y problema

### Problema

Los médicos operan con **varias agendas a la vez** (consultorio, hospital, WhatsApp, Google Calendar, software de turnos, Excel, etc.). Eso genera:

- dobles reservas / solapamientos
- huecos fantasma o disponibilidad inconsistente
- fricción entre recepción, médico y paciente
- tiempo perdido reconciliando calendarios

### Solución

**mvpMedico** es un lugar **centralizado de agenda** que:

1. actúa como **fuente de verdad** de disponibilidad y turnos
2. **detecta y evita solapamientos**
3. **se integra** con las herramientas que el médico ya usa

No buscamos reemplazar todo el stack clínico de golpe: primero la agenda, luego más profundidad.

---

## 2. Usuarios y roles (borrador)

| Rol | Qué hace en el MVP |
| --- | --- |
| **Médico** | Ve su agenda unificada, bloquea horarios, confirma/cancela turnos, conecta calendarios externos |
| **Secretaría / recepción** | Crea y mueve turnos, consulta disponibilidad real, evita conflictos |
| **Admin de clínica** | Invita usuarios, configura consultorios/recursos, gestiona integraciones |

Roles exactos, permisos y multi-clínica: ver [Decisiones abiertas](#8-decisiones-abiertas).

---

## 3. Alcance MVP v1

Incluye:

- [ ] Autenticación básica (Supabase Auth)
- [ ] Calendario central por médico / recurso
- [ ] CRUD de turnos (crear, editar, cancelar, reprogramar)
- [ ] Reglas anti-solapamiento (no permitir dos turnos activos en el mismo intervalo para el mismo médico)
- [ ] Vista de conflictos cuando una integración externa introduce solape
- [ ] Una integración inicial: **Google Calendar** (sync bidireccional o import + bloqueo, a definir)
- [ ] Roles mínimos: médico + recepción
- [ ] Onboarding simple: crear cuenta → conectar calendario → ver agenda

Criterio de éxito v1: un médico deja de mantener dos agendas manuales para el flujo principal de turnos del consultorio.

---

## 4. Fuera de alcance v1

Explicitamente **no** en v1:

- Telemedicina / videollamadas
- Facturación / obras sociales / liquidaciones
- Historia clínica completa (HCE)
- App móvil nativa
- Marketplace de turnos públicos
- IA de diagnóstico o sugerencias clínicas
- Multi-país / compliance formal (HIPAA, etc.) más allá de buenas prácticas básicas de acceso

---

## 5. Arquitectura objetivo

```text
Doctor / Recepción
        │
        ▼
   Next.js App (App Router)
        │
        ├──────────────► Supabase (Auth + Postgres + RLS)
        │                      │
        │                      └── reglas anti-solapamiento
        │
        ├──────────────► Google Calendar
        └──────────────► Otras herramientas (fase 2+)
```

Principios:

- **Postgres** es la fuente de verdad de turnos internos
- Las integraciones **nunca** pueden saltarse las reglas de conflicto sin dejar evidencia
- Autorización con **Row Level Security (RLS)** por clínica / médico
- API routes o Server Actions de Next.js para orquestar sync con externos

### Modelo de datos mínimo (propuesta)

Entidades iniciales a modelar en Supabase:

- `profiles` — usuario y rol
- `clinics` — organización
- `clinic_members` — membresía y rol
- `resources` — médico / consultorio / recurso bookable
- `appointments` — turnos (`starts_at`, `ends_at`, `status`, `patient_*`, `resource_id`)
- `external_connections` — OAuth / tokens de integración
- `external_events` — espejo de eventos externos para detección de conflictos

Constraint sugerido: exclusión de rangos solapados por `resource_id` en turnos activos (vía exclusion constraint de Postgres o validación en transacción).

---

## 6. Stack y convenciones

### Stack

| Capa | Tecnología |
| --- | --- |
| App / UI | Next.js (App Router) + TypeScript + Tailwind CSS |
| Backend / Auth / DB | Supabase (Postgres, Auth, RLS) |
| E2E | Playwright |
| Repo | GitHub |

### Convenciones

- **Docs y discusión de producto:** español
- **Código, commits técnicos, nombres de variables/archivos:** inglés
- **Ramas:** `feature/<corto>`, `fix/<corto>`, `chore/<corto>` desde `main`
- **PRs:** pequeños, 1 preocupación, descripción del *por qué*
- **No mergear a `main` sin revisión** (al menos 1 approve cuando haya 2+ personas activas)
- **Secretos:** nunca en el repo; `.env.local` + variables en Supabase/Vercel
- **Tests:** caminos críticos de agenda (crear turno, solape rechazado, cancelar) con Playwright

### Estructura de repo (cuando se scaffoldee)

```text
/
├── base.md                 ← este documento
├── README.md               ← setup local rápido
├── apps/web o /            ← Next.js (decisión al scaffold)
├── supabase/               ← migrations, policies
└── e2e/                    ← Playwright
```

---

## 7. Cómo colaborar

### Onboarding

1. Clonar el repo y leer este `base.md`
2. Pedir acceso al proyecto Supabase / Vercel cuando existan
3. Crear rama desde `main`
4. Abrir PR aunque sea solo docs

### Cómo proponer cambios de producto

1. Editar la sección correspondiente de `base.md` en un PR
2. Marcar ítems en [Decisiones abiertas](#8-decisiones-abiertas) como propuesta (`Propuesta: ...`)
3. En el PR, listar trade-offs en 3–5 líneas
4. Tras merge, actualizar "Última actualización" arriba

### Rituales sugeridos

- **Weekly corto:** cerrar 1–2 decisiones abiertas
- **Demo:** cada PR de feature debería poder mostrarse en UI o con test E2E

---

## 8. Decisiones abiertas

Para cerrar juntos en las próximas sesiones:

1. **Flujo de reserva:** ¿el paciente reserva online en v1 o solo recepción/médico?
2. **Google Calendar:** ¿sync bidireccional completo o “bloquear cuando hay evento externo”?
3. **Unidad de scheduling:** ¿por médico, por consultorio, o ambos?
4. **Datos del paciente en v1:** mínimos (nombre + teléfono) vs. ficha más rica
5. **Multi-clínica:** ¿un médico en varias clínicas desde el día 1?
6. **Timezone y feriados:** reglas por clínica / país
7. **Nombre comercial** del producto (mvpMedico es nombre de repo/proyecto)
8. **Hosting:** Vercel para Next.js (propuesta por defecto)

---

## 9. Próximos pasos técnicos

Orden sugerido después de estabilizar este doc:

1. Scaffold Next.js + TypeScript + Tailwind
2. Crear proyecto Supabase y carpeta `supabase/migrations`
3. Auth (email magic link o email/password)
4. Tablas `profiles`, `resources`, `appointments` + RLS
5. UI de calendario semanal mínima
6. Regla anti-solapamiento + tests E2E
7. Conector Google Calendar (OAuth + sync inicial)
8. README de setup local para el equipo

---

## Changelog del documento

| Fecha | Cambio |
| --- | --- |
| 2026-07-20 | Creación inicial: visión, MVP, stack, colaboración |
