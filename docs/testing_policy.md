# Testing Policy

This document defines how Suitora tests its code (Pillar 05, `production-plan/05_testing_strategy.md`).
It is the single source of truth for the testing pyramid, coverage targets, mocking
conventions, and determinism rules.

## Test Pyramid

| Layer | Share | What lives here | Runs in CI |
|-------|-------|-----------------|------------|
| Unit | ~70% | Colocated `lib/**/*.test.ts` (pure logic, validation, services, helpers) | Every PR |
| Integration | ~20% | `tests/integration/**` (route handlers through `withApiRoute`) | Every PR |
| E2E | ~10% | `tests/e2e/**` (Cypress, critical journeys) | Merge / nightly |

Rule: new behavior is tested at the lowest layer that can exercise it. Pure logic
goes in unit tests; a route's contract (status codes, error taxonomy, auth) goes in
integration tests; only cross-page journeys need E2E.

## Running Tests

| Command | What it runs |
|---------|--------------|
| `npm test` | Unit + integration (fast, no coverage) |
| `npm run test:coverage` | Unit + integration with coverage + gate |
| `npm run test:e2e` | Cypress E2E (once added) |
| `k6 run tests/load/test.js` | Load test (on demand) |

## Coverage Targets

Current measured baseline (All files, lines): **70.5%** and rising.

- **Global floor (enforced now):** ≥ 65% lines / 55% functions / 50% branches.
  Configured as `coverage.thresholds` in `vitest.config.ts` — CI fails below this.
- **Global target:** ≥ 80% lines (plan §5.2).
- **Core modules** (`lib/ai`, `lib/api`, `lib/security`, `lib/utils/validation`,
  `lib/auth`): **≥ 90%** lines/branches (plan §5.2). Enforced per-module as each
  reaches the bar; `lib/api` (99%) and `lib/utils` (92%) already qualify.
- **Unit tests cover:** `lib/rate-limit.ts`, `lib/email.ts`, `lib/ai/providers/openai-vision.ts`,
  `lib/trend/{keywords,cache,normalize,ranking}.ts`, `lib/db/queries.ts` helpers.

**Ramp-up policy (progressive floor):** thresholds are intentionally set a few
points below the current measured baseline so CI stays green while coverage grows.
Every session that raises coverage should also raise `coverage.thresholds` toward
the 80/90 targets — never leave the gate behind the code.

Coverage exclusions: `tests/**`, `types/**`, `data/`, `node_modules/`, generated code.

## Responsibility Matrix

| Behavior | Owned by |
|----------|----------|
| Error taxonomy (`ErrorCode` ↔ status) | Unit (`lib/api/response.test.ts`) |
| Rate-limit enforcement on a route | Integration (mock the limiter; assert 429 + `Retry-After`) |
| Auth-guarded routes reject 401 | Integration (mock `@/lib/auth/session`) |
| Validation schemas | Unit (`lib/utils/validation.ts`) |
| Scoring/ranking math | Unit (`lib/trend/*`) |
| Webhook secret forgery | Integration (`tests/integration/webhook.route.test.ts`) |
| Try-on lifecycle state transitions | Unit + integration (mock `completeTryOnByJobId`) |

## Mocking & Fixtures

Convention: `vi.hoisted` for deferred mock handles + `vi.mock` for module stubs.
`vi.hoisted` runs before imports, so it can only reference values created inside it
(see `tests/integration/favorites.route.test.ts` for the canonical pattern).

Rules:

- **Mock at the boundary** — `@/lib/auth/session`, `@/drizzle`, `@/lib/rate-limit`,
  `@/lib/ai/*` providers, `@/lib/storage/cloudinary`, `@/lib/cache`.
- **Never mock code you own the behavior of** — test its real logic instead.
  `lib/api/*`, `lib/trend/*`, `lib/utils/validation.ts` are tested directly.
- Shared module stubs (e.g. the thenable Drizzle chain) live in
  `tests/helpers/mocks.ts` (`makeDrizzleModule`, `makeDrizzleChain`) and are reused
  across suites.
- Typed, deterministic fixtures live in `tests/fixtures/` (mirroring
  `drizzle/schema.ts` and `types/`). Always call a factory with overrides; never
  hand-write raw objects inline.
- `@/drizzle` is stubbed with a thenable query-builder chain; swap `dbRead`/`dbWrite`
  per test via `makeChain(...)` and restore in `afterEach`.

## Determinism & Flakiness

- No network in unit/integration tests: stub `fetch`, DNS lookups
  (`@/lib/security/ssrf`), and all provider calls.
- No wall-clock dependence: control timestamps via fixtures; assert stage/progress
  transitions with `createdAt` offsets, never `sleep`.
- Restore `process.env`, module state, and mocked module exports in `afterEach` —
  leaked state (e.g. a leftover `dbRead` override) is a bug.
- Fixed seeds/ids in fixtures; never rely on generated randomness in assertions.
- Unit/integration retries use fixed `Math.random` stubs and fake timers to avoid
  timing-dependent flakes.
- Treat any flake as a bug to fix, not a retry workaround. The migration step in
  CI uses `continue-on-error: true` (schema parity is informational); test and
  coverage steps are strict with no retry. `fail-fast: false` is set on the
  workflow so a single failing job doesn't cancel siblings.

## Load Testing (k6)

Scripts live in `tests/load/` (`test.js` + `scenarios/*`). Run on demand against a
deployed environment — never in PR CI. Thresholds: `http_req_duration.p95 < 200ms`,
`http_req_failed < 0.1%`. See `production-plan/05_testing_strategy.md` §8 for the
scenario mix (auth, analysis, wardrobe, favorites, trending).

## CI Enforcement

`.github/workflows/ci.yml` runs lint + typecheck + `npm run test:coverage`. The
coverage gate is enforced by Vitest thresholds: any test failure or coverage
below the floor fails the job. E2E tests run on merge to `main` via
`npm run test:e2e`. Load tests run on demand via `k6 run tests/load/test.js`.
A live coverage badge is in `README.md` (updated when a coverage provider is
configured — see the "Coverage" section of the README for setup steps).
