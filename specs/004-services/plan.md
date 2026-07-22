# Plan: Página Servicios (paquetes Waira)

**Feature ID:** 004-services  
**Spec:** [spec.md](./spec.md)

## Enfoque

Página de marketing estática: datos tipados en `packages.ts`, UI en un componente de página, sin DB ni cobro. Alinear `base.md` a la propuesta comercial v2. Honestidad live vs roadmap en cada feature listada.

## Stack y constraints

- Next.js App Router + TypeScript + Tailwind
- Sin Supabase para esta página
- Visual: `DESIGN.md` (teal Forest, cards solo en bloques de elección de paquete)
- Docs/specs en español; código en inglés

## Diseño

### Datos

`src/lib/marketing/packages.ts`:

- `PackageFeature` con `status: "live" | "roadmap"`
- Tres paquetes + rangos Centro + add-ons + out-of-scope
- Precios Balance (Arranque/Consultorio) y Modelo A (Centro)

### API / Server Actions

Ninguna.

### UI

- `/servicios` — hero, paquetes, rangos, add-ons, fuera de fase, cierre
- Nav pública: “Servicios” → `/servicios`
- `isPublicLanding` incluye `/servicios`

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Prometer WhatsApp ya activo | Flag `roadmap` + copy explícito |
| Chocar con $100 en base.md | Actualizar §4/glosario/§10 en el mismo PR |
| Diseño genérico AI | Seguir DESIGN.md; una job por sección |

## Neutralidad

- [x] Portable para kleosr / christianmock / jseramn
- [x] Sin dependencia de skills privadas del autor

## Orden de implementación

1. Reescribir artifacts
2. Actualizar `base.md`
3. `packages.ts` + UI + nav
4. Limpiar extract temporal; verificar
