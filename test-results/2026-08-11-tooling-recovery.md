# Test Results — 2026-08-11 Tooling Recovery

> Date: 2026-08-11
> Scope: CI/CD recovery (roadmap Phases A–C) verification and regression run.

## Summary

| Suite | Result | Notes |
|-------|--------|-------|
| TypeScript typecheck (`npx tsc --noEmit`) | PASS | 0 errors |
| ESLint (`npm run lint`) | PASS | 0 warnings (`--max-warnings=0`) |
| Unit + integration (Vitest, `npm run test:coverage`) | PASS | 37 files / 271 tests, all green |
| Coverage gate | PASS | above 65/55/50/65 thresholds |
| Production build (`npm run build`) | PASS | succeeds |
| E2E (Cypress) | PASS | 22/22 across 5 specs (Chrome headless) |

## Coverage

| Metric | Result | Gate | Status |
|--------|--------|------|--------|
| Statements | 69.18% (1601/2314) | ≥ 65 | PASS |
| Branches | 59.32% (951/1603) | ≥ 55 | PASS |
| Functions | 67.63% (257/380) | ≥ 50 | PASS |
| Lines | 70.62% (1486/2104) | ≥ 65 | PASS |

Gate enforced in `ci.yml` and `cicd.yml` quality-gate steps; unchanged from the
policy in `docs/testing_policy.md`.

## E2E Results

Run command: `npx cypress run --browser chrome --headless`

| Spec | Tests | Passing | Failing |
|------|-------|---------|---------|
| `analysis.cy.ts` | 3 | 3 | 0 |
| `auth.cy.ts` | 5 | 5 | 0 |
| `dashboard.cy.ts` | 5 | 5 | 0 |
| `landing.cy.ts` | 5 | 5 | 0 |
| `wardrobe.cy.ts` | 4 | 4 | 0 |
| **Total** | **22** | **22** | **0** |

Covered journeys: register/login/logout, landing sections, dashboard stats and
quick-action navigation, dual-image upload + mock analysis flow (→ results),
history empty state, favorites/wardrobe, stylist chat (stubbed reply).

### E2E setup notes

- E2E runs against a dev server on `localhost:3000` with
  `TURSO_DATABASE_URL=file:./data/e2e-test.db`, `BETTER_AUTH_SECRET`, and
  `TRYON_PROVIDER=mock`. Migrations are applied with `node scripts/migrate.mjs`.
- `cypress.config.ts` sets `baseUrl`, `pageLoadTimeout: 120000`, and
  `numTestsKeptInMemory: 0` (memory management — see Flakiness).
- Specs seed fresh users via `cy.seedUser()` (unique email + `TestPass123!`)
  to keep tests deterministic and isolated.
- The stylist spec stubs `POST /api/stylist*` and asserts the reply renders;
  the stub shape mirrors the API contract (`{ success, message }`).

## Flakiness & Environmental Findings

- **Full disk (`ENOSPC`)**: the machine's root filesystem filled to 100% during
  runs, causing Turbopack chunk-load failures, screenshot writes to fail, and
  page-load timeouts. Freed ~10 GB of package caches (uv, pip, npm). This was
  the dominant cause of "renderer crashed" / "timed out waiting for page load"
  symptoms and is now resolved.
- **Memory-constrained host (7.8 GB RAM)**: the bundled Electron renderer was
  OOM-crashed on long suites. `numTestsKeptInMemory: 0` and running with system
  Chrome (`--browser chrome --headless`) are reliable locally. The default
  `npm run test:e2e` (Electron) can still be flaky on memory-poor hosts.
- **Cold Turbopack compiles**: quick-action navigation tests timed out at the
  10s default during first-compile; bumped those URL assertions to a 30s
  timeout. Not a functional regression.

## Open Issues

- **CI e2e boot gap (pre-existing)**: `ci.yml` runs `npm run test:e2e` but does
  not boot a server or migrate `data/e2e-test.db`. E2E currently passes only
  when run against a locally started dev server. Follow-up: add a `job: e2e`
  that starts the app, migrates the e2e DB, and runs Cypress.
- **Coverage branch threshold** sits near the gate (59.32% vs 55%) — monitor on
  new features; policy already ramps toward 80% lines.
- **`experimentalMemoryManagement`** was evaluated and reverted: it fixes
  renderer crashes but breaks Cypress failure screenshots (known issue) and
  destabilized runs on this host.

## Files Changed for This Verification

- `.github/workflows/cicd.yml` — rebuilt workflow; `validate-workflows` job,
  `github.event.inputs.*` usage (B1/B2).
- `cypress.config.ts`, `cypress/support/commands.ts`, `cypress/e2e/*.cy.ts`,
  `cypress/fixtures/{selfie,dress}.jpg` — E2E repair.
- `app/layout.tsx` — hydration fix (theme script moved into `<body>`).
- `app/(dashboard)/upload/page.tsx`, `components/stylist/StylistChat.tsx`,
  `components/landing/{FAQ,HowItWorks,CTA}.tsx` — `data-cy` test hooks.
