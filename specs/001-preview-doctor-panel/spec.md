# Spec: Panel doctor sandbox (calendario master)

**Feature ID:** 001-preview-doctor-panel  
**Issue:** (preview sandbox)  
**Owner:** kleosr  
**Estado:** hecho

## Problema

En el preview, cada clínica tiene su propia agenda aislada. Un médico real rota entre sedes; el sandbox no muestra afiliaciones, horarios por clínica ni un calendario master, y el anti-solape solo mira una clínica a la vez.

## Outcome

En `/preview` existe un panel de doctor demo con varias clínicas afiliadas, ventanas de presencia editables, calendario master, y anti-solape tanto dentro de cada clínica como entre clínicas (mismo doctor). Todo en `localStorage`; sin tocar multi-clínica en Postgres.

## Historias / escenarios

1. **Como** doctor demo **quiero** afiliarme a varias clínicas del seed y definir bloques horarios **para** trabajar en más de un lugar.
2. **Como** doctor demo **quiero** un calendario master **para** ver todos mis turnos y saltar a la agenda de cada clínica.
3. **Como** paciente en preview **quiero** pedir turno solo cuando el doctor está presente en esa clínica y libre **para** no chocar con otra sede.
4. **Como** doctor **quiero** que un turno en clínica A bloquee el mismo horario en clínica B **para** no desdoblarme.

## Requisitos funcionales

- [x] Panel `/preview/doctor`: nombre, afiliar/desafiliar clínicas, editar ventanas Lun–Sáb
- [x] Calendario master `/preview/doctor/calendar` con turnos de todas las afiliadas
- [x] Agenda por clínica y booking usan overlap global del doctor
- [x] Slots respetan ventanas de presencia de la clínica
- [x] Clínica no afiliada: sin booking útil / mensaje claro
- [x] Nav pública “Doctor demo”
- [x] Persistencia `localStorage` v2 con migración lazy desde v1

## Fuera de alcance

- Multi-clínica real en Supabase / cambio de `base.md` §7 (“un médico en N clínicas”)
- Auth real para el doctor demo
- Sync con Google Calendar
- Domingo bookable

## Datos / entidades tocadas

- `localStorage` clave `waira-preview-sandbox-v2`
- Rutas `/preview/doctor`, `/preview/doctor/calendar`
- Libs: `preview-sandbox.ts`, booking widget sandbox, agenda preview

## Criterios de aceptación

- [x] Crear turno en clínica A e intentar el mismo rango en B → rechazo por solape
- [x] Master lista turnos de varias clínicas sin solape
- [x] Booking solo en clínicas afiliadas y dentro de ventanas
- [x] Otro del trio puede continuar sin setup personal

## Notas abiertas

Ninguna — alcance sandbox cerrado en el plan aprobado.
