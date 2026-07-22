# Plan: Calculadora de pérdida por no-show

**Feature ID:** 003-no-show-calculator  
**Spec:** [spec.md](./spec.md)

## Enfoque

Calculadora 100% cliente: fórmulas puras + island React. Teaser en home y página dedicada. Números conservadores anclados a literatura (default no-show 18% bajo el ~23% SLR; recuperación principal 25% bajo el efecto Cochrane implícito ~33%).

## Stack y constraints

- Next.js App Router + TypeScript + Tailwind
- Sin Supabase / sin API
- Hosting Vercel
- Visual: `DESIGN.md` (teal Forest, sin purple/glow)

## Diseño

### Datos

Sin migraciones. Constantes y fuentes en `src/lib/calculator/no-show-model.ts`.

### API / Server Actions

Ninguna.

### UI

- `NoShowCalculator` modes: `teaser` | `full`
- `/calculadora` — página completa + timeline + disclaimer
- Home — sección entre diptychs y especificación v1
- Nav pública — link “Calculadora”

### Modelo

```text
noShowsDay = scheduled * rate | direct input
loss* = noShows * fee
recoveredMonth = lossMonth * 0.25  (banda 0.20–0.30)
netVsWaira = recoveredMonth - 100
```

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Prometer mensajería ya activa | Copy “proyección / flujo objetivo” |
| Inflar ROI | Default 18% y recuperación 25%; banda alta etiquetada |
| Diseño genérico AI | Seguir DESIGN.md; card solo en formulario |

## Neutralidad

- [x] Portable para kleosr / christianmock / jseramn
- [x] Sin dependencia de skills privadas del autor

## Orden de implementación

1. Artifacts spec/plan/tasks
2. Modelo puro + exports de fuentes
3. Componente + `/calculadora`
4. Teaser home + nav
5. Verificar caso fijo y lint
