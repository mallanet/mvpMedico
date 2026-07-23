# Contribuir a mvpMedico

Playbook corto para **kleosr**, **christianmock** y **jseramn**.  
Contrato de agentes: [`AGENTS.md`](AGENTS.md). Producto: [`base.md`](base.md).

## Setup

1. Clonar el repo y abrir la carpeta en Cursor (cada uno con su setup personal).
2. Leer `AGENTS.md` y `base.md` una vez.
3. No hace falta instalar Spec Kit ni skills del repo para trabajar: el contrato es markdown.

Secretos (cuando existan): `.env.local` — nunca al git.

## Loop diario

1. `git pull origin main`
2. Claim: crear o asignarte un Issue (`feature` / `chore` / `product`)
3. Prompt en lenguaje natural a tu agente, por ejemplo:  
   *“Trabajá el issue #12: … Seguí el contrato del repo hasta PR.”*
4. El agente crea rama `feature/NNN-short-name`, artifacts en `specs/NNN-short-name/`, código y PR
5. Otro del trio revisa: ¿cumple el spec? ¿respeta la base? ¿es portable sin tu setup?
6. Merge → borrar rama

## Base vs aditivos

| | |
| --- | --- |
| **Base** | `AGENTS.md`, `base.md`, constitution, rule Cursor del repo. Obligatoria. |
| **Aditivo OK** | Tus skills, MCPs, user rules, estilo local. |
| **Aditivo NO** | Commitear “todos deben usar mi skill X”, stacks de un solo agente, secretos, paths de tu máquina. Solo se versiona `.cursor/rules/mvpmedico-agents.mdc`; el resto de rules/skills locales está en `.gitignore`. |

Cambiar la base = PR dedicado + 1 approve de otro del trio.

## Ramas y specs

- Producto: `feature/NNN-short-name` + carpeta `specs/NNN-short-name/` (`spec.md`, `plan.md`, `tasks.md`)
- Chore/fix: `chore/…` o `fix/…`; artifacts opcionales si es trivial
- Un owner por `specs/NNN-*`. No pisar features ajenos.

Plantillas: [`.specify/templates/`](.specify/templates/).

## Review (cadena de suministro a 3)

Antes de aprobar, el revisor confirma:

- [ ] Respeta `AGENTS.md` / `base.md`
- [ ] Feature de producto trae spec/plan/tasks coherentes
- [ ] Se puede continuar sin las skills del autor
- [ ] No rompe neutralidad del repo
- [ ] Sin secretos ni acoplamiento a un entorno personal

Cambios a `AGENTS.md`, constitution, `base.md` o `.cursor/rules/mvpmedico-agents.mdc` requieren approve explícito y nota de neutralidad en el PR.

## Swimlanes sugeridas (MVP ya en `main`)

El scaffold Waira ya está mergeado. Reclamar Issues sin solapar verticales, por ejemplo:

| Owner | Áreas sugeridas |
| --- | --- |
| jseramn | Landings, UX pública, E2E de reserva |
| kleosr | Schema/RLS, anti-solape, integridad de turnos |
| christianmock | Auth/onboarding, panel médico/recepción, Google busy |

Un owner por `specs/NNN-*`. Si el Issue ya tiene assignee, no lo pisés.

## Idioma y PRs

- Specs/docs/producto: español
- Código/commits/nombres: inglés
- PRs chicos, una preocupación, con el *por qué*
- Al menos 1 approve de otro del trio antes de `main`

## Para maintainers del org (`mallanet`)

Quien tenga **push/admin** en `mallanet/mvpMedico` debe aplicar (una vez):

1. Labels: `feature`, `chore`, `product`, `blocked`
2. Branch protection en `main`: require 1 approving review; no force-push
3. Write access al trio (kleosr, christianmock, jseramn) para push directo de ramas

Sin eso, los colaboradores abren PR desde fork (como este setup).
