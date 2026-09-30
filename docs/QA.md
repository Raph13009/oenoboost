# OenoBoost QA

## Goal

A simple, reusable final QA gate for the monorepo (public app + CMS), run **after** human product review.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run qa:full` | Full gate: lint, typecheck, unit, build, DB checks, Playwright E2E, `QA_REPORT.md` |
| `npm run qa:smoke` | Playwright `@smoke` only |
| `npm run qa:app` | App E2E + app regression |
| `npm run qa:cms` | CMS E2E + CMS regression |
| `npm run qa:db` | Migration + read-only DB coherence |
| `npm run qa:health` | Published content health sweeps |
| `npm run qa:regression` | Critical regression suites |
| `npm run qa:report` | Regenerate `QA_REPORT.md` from artifacts |

Targeted unit checks:

- `npm run test:unit:web`
- `npm run test:unit:cms`
- `npm run lint` / `npm run typecheck` / `npm run build`

## Setup

1. Use **Node.js 22+** (see `.nvmrc`). Node 20 breaks CMS rich-text unit tests (`isomorphic-dompurify` / undici) and older supabase-js Realtime init.
2. Copy `.env.qa.example` → `.env.qa`
3. Prefer a **dedicated Supabase test project** (never production for writes).
4. Set Mapbox token for map tests.
5. Optional: `QA_FREE_*` / `QA_PREMIUM_*` accounts for auth scenarios.
6. Install browsers once: `npx playwright install chromium`

```bash
npm install
npx playwright install chromium
npm run qa:full
```

Without Supabase env, `qa:full` still runs static gates and **skips** E2E (`QA_SKIP_E2E=1` forces skip).

Locally, pre-existing `apps/web` ESLint errors are reported as SKIP unless `QA_STRICT=1`. CI sets `QA_STRICT=1`.

## Artifacts

| Path | Contents |
| --- | --- |
| `QA_REPORT.md` | Human-readable pass/fail summary |
| `qa-artifacts/playwright-report/` | Playwright HTML report |
| `qa-artifacts/test-results/` | Screenshots, videos, traces on failure |
| `qa-artifacts/results.json` | Playwright JSON |
| `qa-artifacts/db-check.json` | DB gate output |

## Test layout

```
tests/
  e2e/app/          # public app flows
  e2e/cms/          # CMS flows
  e2e/cross-app/    # CMS ↔ app coherence
  e2e/helpers/      # fixtures, auth, error probes
  regression/app/   # permanent critical app suite
  regression/cms/   # permanent critical CMS suite
```

Playwright config: `playwright.config.ts`  
- screenshots / video / traces: **retain on failure only**  
- HTML report always generated under `qa-artifacts/`

## Database strategy

- Migrations live in `apps/web/supabase/migrations/` (incremental; not a full bootstrap from empty).
- `qa:db` validates migration ordering + optional **read-only** live probes.
- Canonical schema reference: `docs/DATABASE_SCHEMA.sql` (keep in sync when schema changes; see `docs/DATABASE_SCHEMA.md` / issue #25).
- App/CMS schema files are pointers only — do not let package-local dumps diverge.
- No destructive automated QA against production.

## Future tests (fix until Issues ship)

- Private AOP notes
- DGC parent/child routing + CMS relationship persistence
- Region history timelines
- Grand Cru CMS control persistence (map markers already partially exist)
- Structured AOP↔grape link persistence (currently rich-text oriented in CMS)

## CI

GitHub Actions workflow: `.github/workflows/qa.yml`  
- runs on PR + `workflow_dispatch`  
- uploads Playwright report / failure artifacts  
- does **not** deploy or merge
