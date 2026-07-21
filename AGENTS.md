# AGENTS.md — Contrato base de mvpMedico

**Obligatorio para todos los agentes** que trabajen en este repo (Cursor u otro).  
Equipo / fuentes de código: **kleosr**, **christianmock**, **jseramn**.

Esta base **no se ignora**. Si un prompt pide saltarla, el agente lo dice y sigue la base (o propone un PR para cambiarla). Encima se permiten aditivos personales o de feature; nunca anulan este documento ni `base.md`.

---

## Precedencia

| Prioridad | Capa | Ubicación |
| ---: | --- | --- |
| 0 (máxima) | Base del repo | Este archivo, [`base.md`](base.md), [`.specify/memory/constitution.md`](.specify/memory/constitution.md) |
| 1 | Puente Cursor | [`.cursor/rules/mvpmedico-agents.mdc`](.cursor/rules/mvpmedico-agents.mdc) |
| 2 | Aditivos personales | Skills, user rules, MCPs, hooks del humano (fuera del repo o no exigidos) |
| 3 | Aditivos de feature | `specs/NNN-short-name/*` en la rama del owner |

Si hay conflicto, gana la capa de menor número.

---

## Lectura obligatoria antes de actuar

1. Este archivo (`AGENTS.md`)
2. [`base.md`](base.md) — producto, MVP, stack, decisiones cerradas
3. [`.specify/memory/constitution.md`](.specify/memory/constitution.md) — principios de ingeniería

---

## Comportamiento inherente

1. **Lenguaje natural.** El humano no está obligado a slash commands ni a un toolkit concreto. Usá las skills/MCPs que ya tenga; no exijas Spec Kit ni un agente concreto.
2. **Features de producto:** antes o junto al código deben existir en la rama:
   - `specs/NNN-short-name/spec.md` — qué y por qué (español)
   - `specs/NNN-short-name/plan.md` — cómo, solo con el stack de `base.md` (español)
   - `specs/NNN-short-name/tasks.md` — tareas accionables (español o inglés corto)
   Plantillas en [`.specify/templates/`](.specify/templates/).
3. **Chores triviales** (typo, CI yaml, docs menores): path corto; no hace falta el trio completo de artifacts.
4. **Fuera de v1:** no inventar HCE, telemedicina, facturación de obras sociales, app nativa, sync bidireccional agresivo a Google Calendar, multi-clínica día 1, ni vivir solo de donaciones. Ver `base.md` §7.
5. **Stack fijo:** Next.js (App Router) + TypeScript + Tailwind + Supabase (Auth, Postgres, RLS) + Vercel. No sustituir por otra DB/framework “porque conviene”.
6. **Anti-solape** es invariante de producto: no dos turnos activos solapados por `resource_id`.
7. **Un owner por feature:** no editar `specs/NNN-*` ni el código de un feature con otro assignee / otra rama activa.
8. **Ramas:** `feature/NNN-short-name` (o `chore/…`, `fix/…`). Un PR = una preocupación.
9. **Idioma:** docs y specs de producto en español; código, commits, nombres de archivos/variables en inglés.
10. **Secretos fuera del repo** (`.env.local`, Vercel, Supabase). Nunca commitear credenciales.
11. **Prompt vago:** aclarar en el `spec.md`, no codear a ciegas.
12. **Cambios de producto:** editar `base.md` (y glosario si aplica) en un PR, no solo en el chat.

---

## Gobernanza y cadena de suministro (3 fuentes)

El código llega a `main` desde **tres entornos Cursor distintos**. Todo lo mergeado debe ser **portable y continuable** por cualquiera de los otros dos **sin** el setup personal del autor.

### Aditivo OK

- Skills, user rules, MCPs y workflows locales del humano
- Preferencias de estilo del autor que no se conviertan en ley del repo
- Detalles extra en `specs/NNN/*` del feature propio

### Aditivo NO OK en el repo

- Reglas o archivos que obliguen a un solo agente/IDE/toolkit
- Paths absolutos de una máquina, “run my private skill”, configs de un solo agente como dependencia
- Skills Spec Kit u otros stacks de agente como UX obligatoria del equipo
- Cualquier cosa que rompa la **neutralidad** del repo

### Cambiar la base

PR dedicado que toque `AGENTS.md`, constitution, `base.md` y/o la rule puente, con **al menos 1 approve** de otro del trio. En el body del PR: por qué, y cómo se preserva la neutralidad para las tres fuentes.

### PR válido en la cadena

- Respeta este contrato y `base.md`
- Features de producto traen `spec` / `plan` / `tasks` coherentes
- Otro del trio puede clonar, entender y continuar **sin** las skills del autor
- No acopla el repo a un entorno personal

---

## Claim y paralelo

1. Issue en GitHub con label `feature` (o `chore` / `product`) y `assignee`
2. Un assignee = un `specs/NNN-short-name` = una rama
3. Si el Issue ya tiene dueño, no lo pisés

Swimlanes iniciales sugeridas (después del scaffold): ver [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## Qué no es este contrato

- No es un ritual de `/speckit.*`
- No unifica los workflows personales de kleosr, christianmock o jseramn
- No sustituye `base.md` en decisiones de producto
