# Spec: Página Servicios (paquetes Waira)

**Feature ID:** 004-services  
**Issue:** (abrir / enganchar)  
**Owner:** (asignar en Issue)  
**Estado:** hecho

## Problema

La oferta comercial quedó en un único precio ($100/mes) y no hay una página pública que explique Arranque / Consultorio Activo / Centro Médico según la propuesta de paquetes v2. El visitante no ve setup + mensual, qué incluye el Directorio, qué es add-on (landing) ni qué está vivo frente al roadmap (WhatsApp, waitlist, multiagenda).

## Outcome

Existe `/servicios` con tres paquetes organizados (precios Balance / Modelo A), add-ons, fuera de alcance, CTAs a signup/contacto y copy honesto live vs roadmap. `base.md` refleja la nueva oferta. El catálogo de servicios del médico (duración de turnos) queda fuera.

## Historias / escenarios

1. **Como** médico independiente **quiero** ver Arranque con precio claro **para** decidir si activo cuenta.
2. **Como** dueño de consultorio pequeño **quiero** ver Consultorio Activo (hasta 5) **para** comparar con trabajar solo.
3. **Como** clínica **quiero** ver rangos de Centro Médico **para** estimar costo sin cotización ciega.
4. **Como** visitante **quiero** saber qué ya funciona y qué es roadmap **para** no comprar humo.

## Requisitos funcionales

- [x] Ruta `/servicios` + link “Servicios” en nav pública
- [x] Tres paquetes: Arranque, Consultorio Activo, Centro Médico/Clínica
- [x] Precios: Arranque $150 setup + $35/mes; Consultorio $350 + $89/mes; Centro Modelo A por rangos
- [x] Features con `live` | `roadmap`; copy no afirma WhatsApp/pago anticipado como ya activo
- [x] Sección add-ons (Landing profesional, HCE básica bajo pedido)
- [x] Sección fuera de esta fase (HCE avanzada, facturación, reembolsos, inventario)
- [x] CTA principal a `/signup`; enlace a `/calculadora`
- [x] Actualizar `base.md` (dinero, glosario, alcance)

## Fuera de alcance

- Catálogo de servicios del médico / duración de turnos
- Stripe / checkout
- Implementar WhatsApp, waitlist, HCE, multiagenda
- Mostrar opciones de precio A/B/C ni Modelos B/C del paquete 3
- Comparativa global densa Ecuador/LATAM/EU

## Datos / entidades tocadas

- Sin tablas Supabase
- `src/lib/marketing/packages.ts`
- `src/components/marketing/packages-page.tsx`
- `src/app/servicios/page.tsx`
- Nav: `app-nav-bar.tsx`
- Docs: `base.md`, `specs/004-services/*`

## Criterios de aceptación

- [x] `/servicios` 200; link nav visible
- [x] Desktop y móvil: tres paquetes + rangos Centro legibles
- [x] Copy no promete recordatorio WhatsApp / lista de espera como shippeados
- [x] Otro del trio puede continuar sin setup personal del autor

## Notas abiertas

Ninguna bloqueante — precios Balance / Modelo A fijados en el plan aprobado.
