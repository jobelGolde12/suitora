# Testing Strategy Plan

> **Pillar 05 — Suitora Production Readiness**
> This document details the work needed to take Suitora from a small set of
> unit tests to a complete, CI-enforced testing strategy: a defined testing
> pyramid, standardized mocking, integration and E2E coverage, load testing,
> and a coverage gate with a published badge. Each strategic action item is
> expanded into a concrete, sectioned work package.

---

## Table of Contents

1. [Scope & Objectives](#1-scope--objectives)
2. [Current State Analysis](#2-current-state-analysis)
3. [Production Gaps](#3-production-gaps)
4. [Strategic Action Items](#4-strategic-action-items)
5. [Testing Pyramid & Coverage Targets](#5-testing-pyramid--coverage-targets)
6. [Mocking & Fixtures Strategy](#6-mocking--fixtures-strategy)
7. [CI Integration & Coverage Gate](#7-ci-integration--coverage-gate)
8. [Load & Performance Testing](#8-load--performance-testing)
9. [Flakiness & Determinism](#9-flakiness--determinism)
10. [Success Metrics & Definition of Done](#10-success-metrics--definition-of-done)
11. [Sequencing & Dependencies](#11-sequencing--dependencies)

---

## 1. Scope & Objectives

### 1.1 Purpose
Define and implement a comprehensive, deterministic automated testing strategy
across the unit → integration → E2E → load spectrum, enforced in CI with a
coverage gate, so regressions are caught before reaching production.

### 1.2 In Scope
- Testing pyramid definition & coverage targets
- Unit tests for core services
- Integration tests for API routes
- E2E tests for critical user flows
- Mocking & fixture standardization
- CI pipeline for test runs + coverage gate
- Load/performance testing
- Coverage badge & flakiness control

### 1.3 Out of Scope
- CI/CD deployment pipeline (see `06_cicd_deployment.md`)
- Live observability of test-env metrics (see `04_observability_logging.md`)
- Dependency management (see `09_dependency_management.md`)

### 1.4 Reference Standards
- **Testing pyramid** (Martinfowler) — 70/20/10 distribution
- **Vitest** — current test runner
- **Cypress** — E2E
- **k6** — load testing
- **Jest/Supertest-style** conventions for API integration tests

> **Note:** The repo currently uses **Vitest** as its test runner (see
> `vitest.config.ts` and `package.json` script `test: vitest run`). The
> original plan referenced Jest; this plan standardizes on **Vitest** to match
> the existing setup and avoids introducing a second runner.

---

## 2. Current State Analysis

### 2.1 Runner & Configuration
- **Runner:** Vitest (`vitest@4.1.10`), configured in `vitest.config.ts`.
- `vitest.config.ts` sets `environment: "node"`, `include: ["lib/**/*.test.ts"]`,
  and the `@` → repo-root alias.
- `package.json` scripts: `test: vitest run`, `test:watch: vitest`.

### 2.2 Existing Tests
- **14 unit test files** exist under `lib/`, including:
  - `lib/email.test.ts`
  - `lib/utils/validation.test.ts`
  - `lib/auth/actions.test.ts`
  - `lib/security/ssrf.test.ts`
  - `lib/ai/*.test.ts` (fit-scoring, size-prediction, product-extraction,
    outfit-recommender, similar-items, mock analysis)
  - `lib/ai/tryon/**` (validation, category, monitoring, providers/mock, providers/runpod)
- Tests use Vitest idioms: `describe/it/expect`, `vi.mock`, `vi.hoisted`,
  `beforeEach/afterEach`.
- `lib/auth/actions.test.ts` demonstrates a strong mocking pattern
  (`vi.mock("@/lib/auth")`, `@/drizzle`, `@/lib/rate-limit`).

### 2.3 Gaps in Existing Tests
- **No integration tests** for API routes (no Supertest).
- **No E2E** tests.
- **No load** tests.
- **No CI** workflow (`.github/` exists but is empty — no workflows).
- **No coverage collection** configured (`vitest.config.ts` has no `coverage`).
- Tests are **not** wired into a coverage gate or badge.

---

## 3. Production Gaps

| ID | Gap | Severity | Evidence |
|----|-----|----------|----------|
| T1 | No defined testing pyramid / coverage targets | **High** | Ad hoc unit tests only |
| T2 | No integration tests for API routes | **High** | No `tests/integration`, no Supertest |
| T3 | No E2E tests for critical flows | **High** | No `tests/e2e`, no Cypress |
| T4 | No load/performance testing | Medium | No k6 scripts |
| T5 | No CI pipeline runs tests on PRs | **High** | `.github/` has no workflows |
| T6 | No coverage collection or gate | **High** | `vitest.config.ts` lacks `coverage` |
| T7 | Mocking not fully standardized repo-wide | Medium | Pattern exists but not enforced |
| T8 | No coverage badge in README | Low | Not configured |
| T9 | No flakiness/determinism tooling | Medium | No CI repeat/retry policy |

---

## 4. Strategic Action Items

Each item is a work package with priority, objective, current status, files to
modify, steps, and acceptance criteria.

---

### Action Item 1 — Define the Testing Pyramid & Coverage Targets

**Priority:** P0

**Objective:** Codify a 70/20/10 unit/integration/E2E distribution and explicit
coverage thresholds.

**Current status:** No documented pyramid or targets.

**Files to modify**
- `docs/testing_policy.md` (create) — pyramid, targets, responsibility matrix
- `vitest.config.ts` — coverage thresholds

**Steps**
1. Define the pyramid:
   - **70% unit** — pure logic, services, utilities, validation, scoring.
   - **20% integration** — API routes against a test DB (Supertest).
   - **10% E2E** — critical user journeys (Cypress).
2. Set coverage thresholds:
   - Overall: **≥ 80%** (`coverage: { enabled, reporter: ['text','json-summary','html'], thresholds: { global: { lines: 80 } } }`).
   - Core modules (`lib/ai`, `lib/api`, `lib/security`, `lib/utils/validation`):
     **≥ 90%** lines/branches.
3. Add a responsibility matrix: which layer owns which behavior (e.g. rate-limit
   caught in integration, not unit).
4. Document the "test pyramid" rule in `docs/testing_policy.md` so new work adds
   tests at the right layer.

**Acceptance criteria**
- `docs/testing_policy.md` exists with pyramid, targets, and matrix.
- `vitest.config.ts` enforces 80% global / 90% core thresholds.

---

### Action Item 2 — Unit Tests for Core Services

**Priority:** P0

**Objective:** Ensure core services and pure logic have strong unit coverage.

**Current status:** 14 unit test files exist under `lib/` (Vitest). Coverage not
measured.

**Files to modify**
- `tests/unit/**` (create) — or extend existing colocated `lib/**/*.test.ts`
- `vitest.config.ts` — include coverage for core modules

**Steps**
1. Continue the existing colocated pattern (`lib/**/*.test.ts`) for unit tests —
   this is idiomatic and already wired into `vitest.config.ts`.
2. Add unit tests for uncovered core modules:
   - `lib/rate-limit.ts` (limit result shaping)
   - `lib/api/response.ts` / `lib/api/errors.ts` (HTTP mapping)
   - `lib/email.ts` (partial coverage exists)
   - `lib/trend/*` (normalize, ranking, keywords)
   - `lib/ai/providers/openai-vision.ts` (with mocked fetch)
   - `lib/db/queries.ts` (pure helpers like `parseJsonArray`, `toAnalysisResult`)
3. Cover branches, not just happy paths: error paths, edge inputs, rate-limit
   blocked states (mirror `lib/auth/actions.test.ts`).
4. Keep pure functions free of side effects so they are trivially deterministic.

**Acceptance criteria**
- Core modules reach ≥ 90% line/branch coverage.
- All previously untested `lib/` modules have at least smoke tests.

---

### Action Item 3 — Integration Tests for API Routes

**Priority:** P0

**Objective:** Test API route handlers end-to-end against a real/embedded DB with
Supertest-style requests.

**Current status:** No integration tests; `lib/api/response.ts` shapes responses.

**Files to modify**
- `tests/integration/**` (create)
- `vitest.config.ts` — add integration include + DB setup
- `tests/helpers/*` (create) — test DB + auth fixture

**Steps**
1. Add `supertest` (and `@types/supertest`) as dev deps.
2. Create `tests/helpers/testDb.ts` that provisions an in-memory/temp SQLite DB
   (via `drizzle` + the existing schema) and seeds fixtures.
3. Create `tests/helpers/authFixture.ts` to mint a Better Auth session for
   authenticated route tests.
4. Write integration tests for the main API routes:
   - `POST/GET/DELETE /api/analysis`
   - `GET /api/dashboard/stats`
   - `POST/GET/DELETE /api/favorites`
   - `GET/POST /api/stylist`
   - `POST /api/uploads` (auth + validation)
   - `GET/POST /api/wardrobe`, `PATCH/DELETE /api/wardrobe/folders/[id]`
   - Webhook security: `POST /api/tryon/webhook` (valid + forged secret)
5. Assert status codes, response shape, and error taxonomy (see
   `04_observability_logging.md`).
6. Run integration tests in a separate Vitest project so unit tests stay fast.

**Acceptance criteria**
- All major API routes have integration tests covering success + error paths.
- Auth-guarded routes reject unauthenticated requests (401).
- Webhook secret forgery is rejected (401).

---

### Action Item 4 — E2E Tests for Critical User Flows

**Priority:** P1

**Objective:** Cover critical user journeys with Cypress against a running app.

**Current status:** No E2E tests.

**Files to modify**
- `tests/e2e/**` (create) — Cypress specs
- `cypress.config.ts` (create)
- `package.json` — add `test:e2e` script

**Steps**
1. Install Cypress and add `cypress.config.ts` wired to the dev server + test DB.
2. Cover critical flows:
   - **Auth:** register → login → logout.
   - **Onboarding:** upload self image → set profile.
   - **Analysis:** create an analysis from a product URL → view result.
   - **Wardrobe:** save favorite → add to wardrobe → organize in folder.
   - **Stylist:** send message → receive reply.
3. Use a deterministic test DB (seeded) and stub provider calls (OpenAI/RunPod)
   so E2E is stable and offline.
4. Add a `test:e2e` script and wire into CI (Action Item 6).
5. Tag E2E separately so they don't slow down unit/integration PR flow (run on
   merge or nightly).

**Acceptance criteria**
- All critical user flows pass in CI on a fresh environment.
- Provider calls are stubbed; tests are deterministic and repeatable.
- E2E suite is isolated from unit/integration runs.

---

### Action Item 5 — Standardize Mocking & Fixtures

**Priority:** P1

**Objective:** Establish a consistent, reusable mocking/fixture convention.

**Current status:** `lib/auth/actions.test.ts` shows a strong `vi.hoisted` +
`vi.mock` pattern, but it's not standardized repo-wide.

**Files to modify**
- `tests/__mocks__/**` (create) — shared module mocks
- `tests/fixtures/**` (create) — data fixtures
- `docs/testing_policy.md` — mocking conventions

**Steps**
1. Adopt the existing convention: `vi.hoisted` for deferred mocks + `vi.mock`
   for module stubs (as in `lib/auth/actions.test.ts`).
2. Create `tests/__mocks__/` for shared modules:
   - `@/drizzle` (DB client)
   - `@/lib/auth`
   - `@/lib/rate-limit`
   - `@/lib/storage/cloudinary`
   - `@/lib/ai/providers/*` (OpenAI, RunPod)
   - `@/lib/cache` (Redis)
3. Create `tests/fixtures/` with typed fixtures for users, analyses, favorites,
   trend items, and stylist messages (mirroring `drizzle/schema.ts`).
4. Document the mocking rules in `docs/testing_policy.md`: mock at the boundary,
   never mock what you own the behavior of, keep fixtures typed.
5. Add a `globalSetup`/`setupFiles` in `vitest.config.ts` for shared mocks.

**Acceptance criteria**
- Shared mocks live in `tests/__mocks__/` and are reused across suites.
- Fixtures are typed and colocated with clear factories.
- Mocking rules are documented and followed.

---

### Action Item 6 — CI Pipeline with Coverage Gate

**Priority:** P0

**Objective:** Run unit + integration tests on every PR, enforce the coverage
gate, and add a coverage badge.

**Current status:** `.github/` exists but has no workflows; `test` script exists.

**Files to modify**
- `.github/workflows/ci.yml` (create)
- `package.json` — add `test:coverage` script
- `README.md` — add coverage badge

**Steps**
1. Create `.github/workflows/ci.yml` with jobs:
   - **lint:** `npm run lint`.
   - **unit+integration:** `npm run test:coverage` (Vitest with coverage).
   - **coverage gate:** fail if global < 80% or core < 90%
     (configured in `vitest.config.ts` thresholds).
   - **e2e (optional/merge):** `npm run test:e2e` on merge or nightly.
2. Add `test:coverage` script: `vitest run --coverage`.
3. Add `@vitest/coverage-v8` (or `@vitest/coverage-istanbul`) as a dev dep.
4. Publish coverage via a provider (e.g. Codecov/Coveralls) and add a **coverage
   badge** to `README.md`.
5. Enforce `failOnIssue`/`skipTests` behavior so CI is red on any failure.

**Acceptance criteria**
- CI pipeline is green on every passing PR.
- Coverage gate fails the build below 80% global / 90% core.
- README shows a live coverage badge.

---

### Action Item 7 — Load & Performance Testing (k6)

**Priority:** P2

**Objective:** Validate the app sustains 1000 RPS with sub-200ms latency.

**Current status:** No load tests.

**Files to modify**
- `tests/load/test.js` (create) — k6 script
- `tests/load/scenarios/*` (create) — smoke/soak/peak scenarios
- `docs/testing_policy.md` — load-test procedure

**Steps**
1. Write `tests/load/test.js` (k6) with:
   - A `smoke` scenario (1–10 VUs) for correctness.
   - A `peak` scenario ramping to **1000 RPS** against the deployed app.
   - Thresholds: `http_req_duration.p95 < 200ms`, `http_req_failed < 0.1%`.
2. Model realistic user mix: auth, analysis, wardrobe, favorites, trending reads.
3. Point k6 at the deployed environment (see `01_architecture_scalability.md`).
4. Wire load testing to run on demand / scheduled (not on every PR).
5. Document the load-test procedure and how to interpret results versus the
   SLOs in `04_observability_logging.md`.

**Acceptance criteria**
- Load test sustains 1000 RPS with p95 < 200ms and < 0.1% errors.
- Thresholds fail loudly when the target is missed.
- Procedure is documented and repeatable.

---

### Action Item 8 — Coverage Badge & Flakiness Control

**Priority:** P2

**Objective:** Publish a coverage badge and prevent flaky tests.

**Current status:** No badge; no flakiness policy.

**Files to modify**
- `README.md` — badge images
- `.github/workflows/ci.yml` — retry/rerun policy
- `docs/testing_policy.md` — determinism rules

**Steps**
1. Add a coverage badge (from Codecov/Coveralls or a GitHub Actions artifact) to
   `README.md`.
2. Add a flakiness policy: tests must be deterministic, no network in unit tests,
   fixed random seeds, and provider calls stubbed.
3. Add GitHub Actions `rerun`/`retry` config for known-flaky infrastructure (but
   treat repeats as a bug to fix, not a workaround).
4. Audit existing tests for time/order dependence and fix any.

**Acceptance criteria**
- README shows a live coverage badge.
- Unit/integration tests are deterministic across runs (no flakes).
- No flaky tests in CI over a 2-week window.

---

## 5. Testing Pyramid & Coverage Targets

### 5.1 Distribution
| Layer | Share | Examples |
|-------|-------|----------|
| Unit | 70% | `lib/ai/*`, `lib/utils/validation.ts`, `lib/api/errors.ts`, `lib/trend/*` |
| Integration | 20% | API route handlers vs test DB |
| E2E | 10% | Auth, analysis, wardrobe, stylist journeys |

### 5.2 Coverage Thresholds
- **Global:** ≥ 80% lines.
- **Core modules (`lib/ai`, `lib/api`, `lib/security`, `lib/utils/validation`, `lib/auth`):** ≥ 90%.
- Exclusions: mock/fixture files, generated code, `data/`, `node_modules/`.

---

## 6. Mocking & Fixtures Strategy

- **Module mocks:** `vi.mock` + `vi.hoisted` (see `lib/auth/actions.test.ts`).
- **Shared mocks:** `tests/__mocks__/` for `@/drizzle`, `@/lib/auth`,
  `@/lib/rate-limit`, `@/lib/cache`, `@/lib/storage/cloudinary`,
  `@/lib/ai/providers/*`.
- **Fixtures:** typed factories in `tests/fixtures/` mirroring `drizzle/schema.ts`.
- **Rule:** mock at the boundary; never mock code you own the behavior of
  (test its real logic); keep fixtures typed and deterministic.

---

## 7. CI Integration & Coverage Gate

| Job | Command | Fail condition |
|-----|---------|----------------|
| Lint | `npm run lint` | ESLint errors |
| Unit + Integration | `npm run test:coverage` | Any test failure |
| Coverage gate | Vitest thresholds | < 80% global or < 90% core |
| E2E (merge/nightly) | `npm run test:e2e` | E2E failure |
| Load (on demand) | `k6 run tests/load/test.js` | Threshold miss |

---

## 8. Load & Performance Testing

- **Peak:** ramp to 1000 RPS, hold, then ramp down.
- **Thresholds:** `p95 < 200ms`, `http_req_failed < 0.1%`.
- **Mix:** auth, analysis, wardrobe, favorites, trending.
- **Target:** deployed environment (docker-compose/k8s).

---

## 9. Flakiness & Determinism

- No network calls in unit tests (stub `fetch`).
- Fixed seeds for any randomness.
- Provider calls (OpenAI/RunPod/Cloudinary) always stubbed.
- Tests must not depend on wall-clock timing or shared mutable state.
- Treat any flake as a bug to fix, not a retry workaround.

---

## 10. Success Metrics & Definition of Done

| Metric | Target | Status now |
|--------|--------|-----------|
| CI green on every PR | Yes | No CI workflow |
| Overall coverage | ≥ 80% | Not measured |
| Core module coverage | ≥ 90% | Not measured |
| Load test at 1000 RPS | p95 < 200ms | No load tests |
| No flaky tests | Deterministic | Not enforced |
| Coverage badge in README | Live | Not present |

**Definition of Done:** Testing pyramid documented; unit/integration/E2E suites
exist and pass in CI; coverage gate enforced (80% global / 90% core); load test
sustains 1000 RPS under 200ms; tests are deterministic; coverage badge is live.

---

## 11. Sequencing & Dependencies

| Phase | Items | Rationale |
|-------|-------|-----------|
| **Phase 0** | A1 (pyramid), A2 (unit), A3 (integration), A6 (CI gate) | Foundation + enforcement |
| **Phase 1** | A5 (mocking), A8 (badge/flakiness) | Consistency + quality signals |
| **Phase 2** | A4 (E2E), A7 (load) | Broader confidence + performance |
| **Continuous** | §5-§9 conventions, coverage review | Ongoing quality |

**Blocking dependencies**
- A6 (CI) depends on A2/A3 (tests to run) and `vitest.config.ts` coverage.
- A4 (E2E) depends on A6 (CI) for execution and on a deployable app
  (`06_cicd_deployment.md`).
- A7 (load) depends on the deployed environment (`01_architecture_scalability.md`)
  and observability for latency (`04_observability_logging.md`).
