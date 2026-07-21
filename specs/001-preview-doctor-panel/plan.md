# Plan: Panel doctor sandbox

**Feature ID:** 001-preview-doctor-panel  
**Stack:** Next.js App Router + TypeScript + Tailwind + `localStorage` (sin Supabase)

## Enfoque

1. Ampliar `src/lib/preview-sandbox.ts` a modelo doctor + affiliations + `appointmentsByClinic`, overlap global, slots con ventanas.
2. UI panel doctor y calendario master bajo `/preview/doctor`.
3. Cablear agenda por clínica y `BookingWidget` sandbox a la API v2.
4. Link en nav + smoke Playwright.

## Archivos principales

| Archivo | Cambio |
| --- | --- |
| `src/lib/preview-sandbox.ts` | Store v2 + API |
| `src/app/preview/doctor/page.tsx` | Panel |
| `src/app/preview/doctor/calendar/page.tsx` | Master |
| `src/components/preview/*` | UI cliente |
| `src/components/booking/booking-widget.tsx` | Slots + afiliación |
| `src/components/app-nav-bar.tsx` | Link Doctor demo |
| `e2e/smoke.spec.ts` | Overlap cross-clínica |

## Riesgos

- Migración v1→v2: lazy al leer.
- Timezone: usar mismos helpers locales que el booking actual (`T12:00:00` para día).
