# Plan: Full Demo Seed

**Feature ID:** 002-full-demo-seed

## Enfoque

Branch en capa de dominio + cookie session + store cookie/localStorage. Sin adaptador PostgREST.

## Stack (base.md)

Next.js App Router, TypeScript, Tailwind. Persistencia demo: cookie + localStorage. Supabase solo fuera de demo.

## Archivos

- `src/lib/mock/{mode,seed,store,session,appointments}.ts`
- Wire: auth-form, middleware, clinic-context, appointments, calendar, landing, admin, layout
- Specs en este directorio

## Riesgos

- Cookie size: seed + pocos turnos cabe; no guardar blobs.
- `.env.local` real desactiva demo (esperado).
