# Plan: 005-package-completeness

**Stack:** Next.js App Router, TypeScript, Tailwind, Supabase (Auth/Postgres/RLS), demo mode mock store.

## Enfoque

1. Ampliar `ClinicContext` a `resources[]` + resource seleccionado (cookie `waira_resource_id`).
2. Acciones: `confirmAppointment`, `addProfessional`, `inviteReception`, `selectResource`.
3. Demo seed: recepción + 2º profesional en clinic-001; members en clinic.
4. Migración RLS: insert resources/directory/landings/clinic_members para doctors.
5. UI: diálogo confirmar, selector agenda, `/team`, `/directorio`, nav por rol.
6. `lib/notify.ts` vía fetch a Resend si hay API key.
7. Alinear `packages.ts` + `base.md` §13.

## Archivos principales

- `src/lib/types.ts`, `clinic-context.ts`, `appointments.ts`, `notify.ts`, `clinic-limits.ts`
- `src/lib/mock/seed.ts`, `appointments.ts`
- `src/components/calendar/*`, `app-nav-bar.tsx`
- `src/app/team/page.tsx`, `src/app/directorio/page.tsx`
- `supabase/migrations/20260722000000_package_completeness.sql`
