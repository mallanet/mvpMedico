# TOOLCHAIN

Node ≥22. Package manager: npm (`package-lock.json`).

## Verify

```bash
npm ci
npm run lint
npm run build
```

E2E (Playwright):

```bash
npx playwright install
npm run test:e2e
```

Smoke runs without Supabase. Live agenda / overlap / cancel:

```bash
E2E_FULL_APPOINTMENTS=1 E2E_DOCTOR_EMAIL=… E2E_DOCTOR_PASSWORD=… npm run test:e2e -- e2e/appointments.spec.ts
```

DB local:

```bash
npm run db:start
npm run db:reset
```

## Deploy targets

- **Canonical:** Vercel + Supabase Cloud (`vercel.json`)
- **Optional review:** Cloudflare Workers via OpenNext (`npm run cf:deploy`); account via `CLOUDFLARE_ACCOUNT_ID` secret / env — never commit account IDs
