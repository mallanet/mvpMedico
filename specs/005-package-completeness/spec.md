# Spec: Completar paquetes (confirmación, equipo, multi-agenda, directorio)

**Feature ID:** 005-package-completeness  
**Issue:** (enganchar)  
**Owner:** kleosr  
**Estado:** hecho

## Problema

`/servicios` marca como incluidas features que no existen (lista de espera, multi-agenda, recepción, directorio real). El médico no puede confirmar turnos, invitar recepción ni gestionar más de un profesional. El visitante no ve un Directorio Waira de tenants reales.

## Outcome

Arranque y Consultorio Activo operan de punta a punta en demo y en Supabase: confirmar/cancelar, hasta 5 agendas, rol recepción, directorio público de perfiles publicados, notificaciones email mínimas (Resend opcional), nav legible por rol. Copy de paquetes alineado al código. Lista de espera y multiagenda “Centro” siguen en roadmap.

## Historias

1. Como médico/recepción quiero confirmar un turno para distinguirlo de solo agendado.
2. Como médico quiero agregar hasta 5 profesionales y ver la agenda de cada uno.
3. Como médico quiero invitar recepción para que gestione la misma agenda.
4. Como visitante quiero ver el Directorio Waira con perfiles publicados y pedir turno.
5. Como paciente quiero un email (si dejé correo) al reservar / confirmar / cancelar.

## Requisitos funcionales

- [x] Confirmar turno (`scheduled` → `confirmed`) en agenda
- [x] Multi-resource por clínica (máx. 5) + selector
- [x] Invitar recepción (demo + service role en real)
- [x] `/directorio` lista perfiles `published_to_mallanet`
- [x] Notificaciones email mínimas (no-op sin `RESEND_API_KEY`)
- [x] Nav por rol; demos fuera del menú autenticado
- [x] `packages.ts` honesto (live vs roadmap)

## Fuera de alcance

- Lista de espera automatizada
- Multiagenda paralela Centro (vista única N columnas)
- Stripe checkout
- API Mallanet externa
- WhatsApp / SMS

## Criterios de aceptación

- [x] Demo: doctor confirma, agrega 2º profesional, invita recepción; recepción entra y opera agenda
- [x] `/directorio` muestra perfiles publicados con link a `/l/[slug]`
- [x] `/servicios` no marca waitlist/multiagenda Centro como incluidas
- [x] Lint + build + smoke E2E verdes
