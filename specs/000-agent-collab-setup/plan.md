# Plan: Setup de colaboración AI-first (repo-neutral)

**Feature ID:** 000-agent-collab-setup  
**Spec:** [spec.md](./spec.md)

## Enfoque

Sembrar markdown portable (contrato, constitution, templates, playbooks) y un puente Cursor mínimo. No instalar ritual Spec Kit. GitHub templates + labels + branch protection cierran la cadena de review.

## Stack y constraints

- Solo documentación y config de repo
- Sin app Next.js en este feature
- Neutralidad: no CLAUDE.md / skills Spec Kit / stacks de un solo agente

## Diseño

### Datos

N/A

### API / Server Actions

N/A

### UI

N/A

### Archivos

Ver árbol en el plan de equipo: `AGENTS.md`, `.specify/`, `.cursor/rules/mvpmedico-agents.mdc`, `.github/*`, `specs/000-…`

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Alguien ignora AGENTS.md | Rule alwaysApply + review checklist |
| Contaminar repo con skills personales | `.gitignore` de overlays; CONTRIBUTING |

## Neutralidad

- [x] Portable para kleosr / christianmock / jseramn
- [x] Sin dependencia de skills privadas del autor

## Orden de implementación

1. Contrato + constitution + templates + README/CONTRIBUTING
2. Rule Cursor
3. GitHub templates
4. Dry-run specs/000
5. PR + labels + branch protection
