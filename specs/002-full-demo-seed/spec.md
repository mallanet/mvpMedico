# Spec: Full Demo Seed (mock-only)

**Feature ID:** 002-full-demo-seed  
**Issue:** (demo seed)  
**Owner:** kleosr  
**Estado:** hecho

## Problema

Sin Supabase configurado la app tira errores o pantallas vacías. Quien evalúa Waira no puede recorrer login → agenda → landing → reserva → admin sin backend.

## Outcome

Con variables de entorno ausentes (o URL `mock`), la app corre en **modo demo**: auth mock, seed de clínicas/turnos/membresías, anti-solape local, reset en un click. Con Supabase real, los mocks no se activan.

## Historias / escenarios

1. **Como** visitante **quiero** `npm run dev` sin `.env.local` **para** ver el producto completo.
2. **Como** doctor demo **quiero** entrar con cualquier credencial (o `doctor@example.com`) **para** ver la agenda con turnos seed.
3. **Como** paciente **quiero** reservar en `/l/dra-reyes` **para** obtener confirmación con código `WRA-XXXX`.
4. **Como** admin **quiero** pausar/activar membresías mock **para** ver el gating.
5. **Como** demoledor **quiero** “Reiniciar demo” **para** volver al seed.

## Requisitos funcionales

- [x] `isDemoMode()` cuando faltan URL/anon o URL es `mock`
- [x] Seed: Dra. Valentina Reyes, 3 clínicas, 8 turnos, 3 membresías
- [x] Auth mock (cookie) + middleware demo
- [x] Domain branch en clinic-context / appointments (sin query-builder falso)
- [x] `/calendar`, `/l/<slug>`, `/admin/memberships`, onboarding en demo
- [x] Preview sandbox alineado (Reyes / Cardiología) + reset compartido
- [x] Nota en `/clinicas` de directorio demostrativo

## Fuera de alcance

- Mock PostgREST completo
- Stripe / Google Calendar
- Cambiar seed SQL de Postgres a IDs `clinic-001`

## Datos / entidades tocadas

- Cookie `waira_demo_session`, store `waira_demo_db`
- `src/lib/mock/*`
- Rutas producto + footer reset

## Criterios de aceptación

- [x] Dev sin env → recorrido punta a punta (activar con URL mock si hay `.env.local`)
- [x] Anti-solape rechaza slot ocupado
- [x] Build ok con URL mock
- [x] Smoke e2e: login demo + reserva landing
