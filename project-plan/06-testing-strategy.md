# 06 — Testing Strategy

> Author role: Senior QA Engineer
> Grounded in the live test suite (271 tests / 37 files passing, coverage
> ~70.5% lines), `vitest.config.ts`, `docs/testing_policy.md`, `tests/` tree,
> and Cypress setup (`cypress.config.ts`).

---

## 1. Testing Pyramid Mapped to This Project

| Layer | Share | What lives here | Runs in CI |
|-------|-------|-----------------|------------|
| Unit | ~70% | `lib/**/*.test.ts` — pure logic: validation, scoring, rankings, rate-limit, email, providers (mock), try-on lifecycle, trend normalize/rank, utils, filters | `ci.yml` (coverage-gated) |
| Integration | ~20% | `tests/integration/**` — route handlers via `withApiRoute`: analysis, favorites, dashboard, stylist, uploads, wardrobe, webhook | `ci.yml` |
| Contract | Included | `docs/api/swagger.yaml` = OpenAPI source of truth; `/api/docs/spec` serves it; integration tests assert envelope/taxonomy | `ci.yml` (spec lint), doc job |
| E2E | ~10% | `cypress/` (Cypress 15): critical journeys (auth, upload→analysis→results, wardrobe) | Merge to `main` / nightly (`npm run test:e2e`) |
| Load | On demand | `tests/load/` k6: smoke/peak/soak scenarios | Manual against deployed env |

Rule (unchanged): new behavior is tested at the lowest layer that can exercise
it.

---

## 2. Frameworks & Assertion Libraries

- **Unit/Integration:** Vitest 4 + native `expect` (node environment,
  `vitest.config.ts`).
- **API contract:** SuperTest for handler assertions in integration tests.
- **E2E:** Cypress 15 (`cypress.config.ts`, `stubAnalysis` command).
- **Coverage:** v8 provider, `text` + `json-summary` + `html` reporters,
  thresholds enforced.
- **Load:** k6 (`tests/load/test.js`, scenarios in `tests/load/scenarios/`).

---

## 3. Mock / Stub / Fixture Strategy

- Mock at the boundary: `@/lib/auth/session`, `@/drizzle` (thenable query-builder
  chain), `@/lib/rate-limit`, `@/lib/ai/*` providers, `@/lib/storage/cloudinary`,
  `@/lib/cache`.
- Never mock code we own the behavior of (`lib/api/*`, `lib/trend/*`,
  `lib/utils/validation.ts` are tested directly).
- Canonical pattern: `vi.hoisted` deferred handles + `vi.mock`
  (`tests/integration/favorites.route.test.ts`); shared stubs in
  `tests/helpers/mocks.ts` (`makeDrizzleModule`, `makeDrizzleChain`).
- Typed deterministic fixtures in `tests/fixtures/index.ts` — always factory +
  overrides, never inline raw objects.
- `Math.random`/timers fixed where logic depends on them.

---

## 4. Database Testing Strategy

- **No real DB in unit/integration:** `@/drizzle` stubbed with a thenable
  chain; swap `dbRead`/`dbWrite` per test; restore in `afterEach`.
- **Schema parity check:** CI `db:migrate` + `db:status` against a fresh
  `file:` DB (`continue-on-error: true` — informational).
- **E2E:** real file DB (`data/e2e-test.db`, gitignored) booted by Next dev
  server; seeded via `cypress/support/commands.ts`.
- **Load:** against deployed staging only, never PR CI.

---

## 5. Performance / Load Test Scenarios & Thresholds

| Scenario | Script | Thresholds |
|----------|--------|-----------|
| Smoke | `tests/load/scenarios/smoke.js` | sanity, no errors |
| Peak | `tests/load/scenarios/peak.js` | `http_req_duration.p95 < 200ms` |
| Soak | `tests/load/scenarios/soak.js` | `http_req_failed < 0.1%` |

Mix: auth, analysis, wardrobe, favorites, trending endpoints. Run via
`k6 run tests/load/test.js` on demand.

---

## 6. Security Test Scenarios

Covered by unit/integration + external scans:

| Scenario | Test |
|----------|------|
| Webhook secret forgery → 401 | `tests/integration/webhook.route.test.ts` |
| 401 on missing/invalid session | integration (mock `@/lib/auth/session`) |
| Ownership scoping (IDOR) | integration: cross-user analysis read → 404 |
| Rate limit → 429 + Retry-After | integration (mock limiter) |
| Upload MIME/size/zero-byte rejection | integration (`tests/integration/uploads.route.test.ts`) |
| SSRF guard | `lib/security/ssrf.test.ts` |
| Validation schemas (all boundaries) | `lib/utils/validation.test.ts` + `lib/validation.ts` |
| Dependency vulns | `security.yml` (npm audit, gitleaks) |
| Manual pen: OWASP top-10 | Quarterly security review (see `SECURITY.md`) |

---

## 7. Test Data Management

- Fixtures live in `tests/fixtures/` mirroring `drizzle/schema.ts` + `types/`.
- Deterministic IDs/timestamps; no wall-clock dependence (assert stage
  transitions with `createdAt` offsets, never `sleep`).
- Env stubbed via `vi.stubEnv`/`vi.unstubAllEnvs`; process.env restored in
  `afterEach`.
- No PII in fixtures; GDPR export fixture uses synthetic data.

---

## 8. Minimum Coverage Thresholds

Enforced in `vitest.config.ts` (`coverage.thresholds`):

| Metric | Global floor (now) | Target |
|--------|--------------------|--------|
| lines | 65% | ≥ 80% |
| functions | 55% | ≥ 80% |
| branches | 50% | ≥ 70% |
| statements | 65% | ≥ 80% |

Current measured baseline: lines 70.5% / functions 67.5% / branches 59.4% /
statements 69.1%. Core modules (`lib/ai`, `lib/api`, `lib/security`,
`lib/utils/validation`, `lib/auth`) target ≥ 90% lines/branches — `lib/api`
(99%) and `lib/utils` (92%) already qualify.

**Ramp policy:** raise thresholds in lockstep with measured coverage every
session; never leave the gate behind the code. New CI/repo changes must keep
the gate green.

---

## 9. Determinism & Flakiness Rules

- No network in unit/integration; stub fetch/DNS/SSRF.
- Fixed seeds; restore module state after each test.
- A flake is a bug to fix, not a retry workaround.
- CI: `fail-fast: false` on workflow; test/coverage steps strict.

---

## 10. Deliverables for This Engagement

- Regression verification after tooling changes (lint script repair must not
  change lint behavior — verify with full-project lint + CI-equivalent command).
- Validation that `npm run lint` (the CI command) passes from a clean shell.
- Document results in `test-results/` (Phase 3).

---

## Checklist

- [x] Testing pyramid mapped to this project: unit tests, integration tests, contract tests, E2E tests
- [x] Test framework and assertion library selections
- [x] Mock/stub/fixture strategy
- [x] Database testing strategy (in-memory vs containerized vs mocked)
- [x] Performance/load test scenarios and thresholds
- [x] Security test scenarios (penetration test cases, OWASP top 10 coverage)
- [x] Test data management strategy
- [x] Minimum coverage thresholds per component category
