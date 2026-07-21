# Spec: Setup de colaboración AI-first (repo-neutral)

**Feature ID:** 000-agent-collab-setup  
**Issue:** (este PR / chore de setup)  
**Owner:** jseramn  
**Estado:** hecho

## Problema

Tres personas (kleosr, christianmock, jseramn) trabajan con Cursor y setups distintos. Sin un contrato compartido en el repo, los agentes pueden chocar, acoplar el código a un entorno personal o codear sin artifacts portables.

## Outcome

El repo tiene una **base obligatoria** (`AGENTS.md` + rule Cursor + constitution + plantillas) que todo agente respeta. Cada uno puede usar skills propias (aditivo) sin romper la neutralidad ni la cadena de suministro a 3. No hace falta promptar Spec Kit ni slash commands.

## Historias / escenarios

1. **Como** cualquier del trio **quiero** abrir Cursor con mi setup **para** que el agente ya obedezca `AGENTS.md` sin yo mencionar Spec Kit.
2. **Como** revisor **quiero** un PR con checklist de neutralidad **para** rechazar acoplamientos a un solo entorno.
3. **Como** owner de un feature futuro **quiero** plantillas en `.specify/templates/` **para** llenar `specs/NNN/` en lenguaje natural.

## Requisitos funcionales

- [x] `AGENTS.md` con comportamiento + gobernanza de cadena a 3
- [x] Constitution en `.specify/memory/constitution.md`
- [x] Plantillas spec/plan/tasks
- [x] Rule Cursor alwaysApply que apunta a `AGENTS.md`
- [x] `CONTRIBUTING.md` + `README.md`
- [x] Issue/PR templates con checklist de base y neutralidad
- [x] Este dry-run bajo `specs/000-agent-collab-setup/`

## Fuera de alcance

- Cambios de producto/app (el scaffold Waira ya vive en `main`)
- Instalar skills Spec Kit como UX del equipo
- Unificar MCPs o user rules de los 3 entornos

## Datos / entidades tocadas

Ninguna de producto. Solo docs y convenciones del repo.

## Criterios de aceptación

- [x] Otro del trio puede clonar y leer `AGENTS.md` / `CONTRIBUTING.md` sin setup especial
- [x] No hay skills Spec Kit obligatorias en el repo
- [x] La rule Cursor no redefine workflows personales; solo apunta a la base
- [x] Templates y este spec demuestran el path de artifacts

## Notas abiertas

Ninguna. Features de producto siguientes: reclamar Issues sobre el MVP ya en `main` (schema, auth, landing, GCal) con `specs/NNN-…`.
