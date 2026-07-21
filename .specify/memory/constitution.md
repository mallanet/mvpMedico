# Constitución de ingeniería — mvpMedico

Principios que todo agente e implementador evalúa antes de cambiar código.  
Producto y alcance: [`base.md`](../../base.md). Contrato de agentes: [`AGENTS.md`](../../AGENTS.md).

**Última actualización:** 2026-07-20

---

## I. Spec antes que vibe

- El intent vive en `specs/NNN-short-name/` (spec → plan → tasks).
- El código sirve al spec; no al revés.
- Prompt en lenguaje natural; artifacts portables en el repo.

## II. Neutralidad del repo (cadena a 3)

- Tres fuentes (kleosr, christianmock, jseramn) deben poder mergear y continuar trabajo ajeno.
- No exigir un IDE, skill, MCP o modelo concreto.
- No commitear stacks de agente que privilegien un entorno.
- Aditivos personales OK en la máquina local; no como ley del repo.

## III. Stack y límites de v1

- Stack: Next.js App Router, TypeScript, Tailwind, Supabase (Auth + Postgres + RLS), Vercel.
- Invariante: anti-solape de turnos por `resource_id`.
- Fuera de v1: HCE, telemedicina, facturación obras sociales, app nativa, sync GCal bidireccional completo, multi-clínica día 1.
- Una timezone IANA por clínica.

## IV. Calidad y seguridad

- Secretos fuera del repo.
- RLS por clínica / médico cuando exista schema.
- PRs chicos, una preocupación, con el *por qué*.
- E2E (Playwright) para flujos críticos de turnos cuando exista la app: crear, rechazar solape, cancelar, reservar desde landing.

## V. Producto y nombres

- **Waira** vende; **mvpMedico** es técnico; **Mallanet** es el hub.
- Cambios de producto → editar `base.md` en PR.
- Docs/specs en español; código/commits/nombres en inglés.

## VI. Cambios a esta constitución

PR dedicado + 1 approve de otro del trio. Explicar impacto en neutralidad y en la cadena de suministro.
