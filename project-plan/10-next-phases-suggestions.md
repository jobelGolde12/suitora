# 10 — Next Phases: Five Plan Suggestions

> Author role: Tech Lead + Engineering Manager
> Status: Forward-looking planning artifact (post-Phase 1). Delivered after the
> Phase 1 plan files (01–09) and their implementation (roadmap Phases A–D) were
> verified complete. Each suggestion is grounded in the audited codebase state
> on 2026-08-11 and references the exact evidence that motivates it.

---

## Summary

| # | Suggestion | Priority | Effort | Evidence / motivation |
|---|------------|----------|--------|------------------------|
| S-01 | Provision real AI providers (OpenAI Vision, RunPod try-on) with failure guardrails | P0 | L | Mocks remain the production default (`ARCHITECTURE.md` debt; `01` §5) |
| S-02 | Close the CI E2E boot gap and add automated a11y regression | P0 | M | Documented open issue in `test-results/2026-08-11-tooling-recovery.md` |
| S-03 | Ramp coverage toward the 80 % targets per the ramp policy | P1 | M | `06-testing-strategy.md` §8 — targets not yet reached (70.6 % lines) |
| S-04 | Load-baseline the API and tune alert thresholds with real traffic | P1 | M | Budgets/alert rules are initial estimates (`01` §6.2; `ARCHITECTURE.md`) |
| S-05 | GDPR & audit-log retention hardening + restore drill | P1 | S–M | `audit_logs` retention TBD (`02` §6); privacy ops untested end-to-end |

Dependency note: **S-01** and **S-02** are independent and can run in parallel.
**S-04** needs a deployed staging environment with traffic; **S-05** is
independent but benefits from a working backup pipeline (already present).

---

## S-01 — Provision Real AI Providers with Failure Guardrails

**Priority: P0 · Effort: L · Owner: Senior AI/Backend Developer**

### Context (current state)

The entire AI surface (fashion analysis, virtual try-on, stylist, trending
providers) is implemented behind provider abstractions (`lib/ai/providers`,
`lib/ai/tryon/providers`, `lib/trend/providers`) with **mock fallbacks as the
default** whenever keys are absent. `ARCHITECTURE.md` lists "Real AI provider
coverage is in progress; mocks remain the default" as known debt, and
`project-plan/01-architecture-overview.md` §5 catalogs OpenAI Vision and RunPod
with "Mock fallback when key absent." This is the single largest business-value
gap: the core product promise (real AI fit analysis, real try-on) is not yet
live.

### Proposed plan

1. **Wire real credentials** behind the existing abstractions — no API-shape
   changes to callers. Activate OpenAI Vision for `analyzeWithVision()` and
   RunPod for try-on submit/poll/webhook (verify `RUNPOD_WEBHOOK_SECRET` flow
   with a real endpoint).
2. **Failure guardrails:** per-provider timeout + retry with exponential
   backoff, a circuit breaker per provider, and fallback to the mock path only
   where semantically safe (analysis) — never for try-on (user must see a
   clear `failed` + retry state).
3. **Cost & usage telemetry:** instrument per-call token/job counts via
   `lib/metrics.ts` (prom-client counters) and correlate with
   `audit_logs`/analysis rows so unit costs can be tracked against the free
   tier.
4. **Prompt/output validation:** harden schema validation of provider
   responses (JSON shape, numeric bounds) before persistence — reuse
   `lib/ai/tryon/validation.ts` conventions.
5. **Config matrix:** per-environment provider selection
   (`AI_PROVIDER=openai|mock`, `TRYON_PROVIDER=runpod|mock`) validated in
   `lib/env.ts`, so staging can stay mocked while production is live.

### Deliverables & acceptance criteria

- [ ] Live analysis via OpenAI Vision in production (mock only as explicit fallback)
- [ ] Live RunPod try-on with webhook verification and real failure states
- [ ] Provider metrics visible on the Grafana dashboard; alerts for provider failure/latency
- [ ] Cost counters landed; `docs/api/swagger.yaml` updated if contracts change

### Risks

| Risk | Mitigation |
|------|-----------|
| Provider outages degrade the core journey | Circuit breaker + graceful degradation; alerts in place |
| Cost overrun without visibility | Per-call counters + budget alerts before launch |
| Real response shapes differ from mocks | Fixture-based contract tests comparing mock vs real payloads |

---

## S-02 — Close the CI E2E Boot Gap and Add Automated Accessibility Regression

**Priority: P0 · Effort: M · Owner: Senior QA Engineer**

### Context (current state)

`test-results/2026-08-11-tooling-recovery.md` documents a pre-existing open
issue: "**CI e2e boot gap** — `ci.yml` runs `npm run test:e2e` but does not boot
a server or migrate `data/e2e-test.db`. E2E currently passes only when run
against a locally started dev server." Meanwhile the frontend test-plan
(`Todo.md` §19.7) recommended Playwright/axe or axe CI, and the accessibility
plan (17) and performance plan (19) were verified by code audit only — no
automated a11y/visual regression exists in CI.

### Proposed plan

1. **Add a self-contained `e2e` job to `ci.yml`:** checkout → node → npm ci →
   `npm run db:migrate` against `file:./data/e2e-test.db` → boot the dev server
   with mock-provider env → `npx cypress run --browser chrome --headless` →
   upload artifacts on failure. Gate on push to `main` (not every PR).
2. **Axe accessibility scan in CI:** add `cypress-axe` and assert
   `cy.checkA11y()` on the key routes (landing, login, dashboard, upload,
   results, settings) with the WCAG 2.1 AA rule set — the automated half of
   plan 17.
3. **Stability hardening:** keep `numTestsKeptInMemory: 0`, document the
   memory-constrained host findings, and add a `test:e2e:ci` script encoding
   the chrome-headless invocation.
4. **Wire into the quality gate** of `cicd.yml` only after it is green on
   `main` for a week (do not block deploys on a flaky job).

### Deliverables & acceptance criteria

- [ ] CI runs the full Cypress suite with zero local-manual steps (verified by a PR run)
- [ ] `cy.checkA11y()` gates key routes; violations fail the job
- [ ] E2E flake rate tracked over one week; documented in `test-results/`

### Risks

| Risk | Mitigation |
|------|-----------|
| Memory-constrained CI runners OOM | System Chrome headless + `numTestsKeptInMemory: 0` (proven pattern) |
| A11y violations in legacy components block merges | Baseline first, then enforce on changed routes incrementally |

---

## S-03 — Ramp Coverage Toward the 80 % Targets (Ramp Policy)

**Priority: P1 · Effort: M (ongoing) · Owner: Senior QA Engineer**

### Context (current state)

`06-testing-strategy.md` §8 defines global floors (65/55/50/65 for
lines/functions/branches/statements) with **targets of 80/80/70/80** and an
explicit ramp policy: "raise thresholds in lockstep with measured coverage
every session; never leave the gate behind the code." Current measured
baseline (2026-08-11): **lines 70.62 %**, functions 67.63 %, branches 59.32 %
(near its gate), statements 69.18 %. Core modules (`lib/ai`, `lib/auth`,
`app/api/*`) are the priority for ≥ 90 % lines/branches; `lib/api` (99 %) and
`lib/utils` (92 %) already qualify.

### Proposed plan

1. **Coverage map:** run `npm run test:coverage -- --reporter html` and identify
   the lowest-scoring modules in `lib/ai`, `lib/auth`, and `app/api/*`.
2. **Add tests per module** (happy/edge/error paths per `06` §1), prioritizing
   branches in the two modules nearest their gates.
3. **Raise the gate in lockstep** by ~2–3 points per session, committing the
   new thresholds in `vitest.config.ts` together with the tests that justify
   them.
4. **Track** each ramp in `test-results/` with before/after numbers.

### Deliverables & acceptance criteria

- [ ] Branch coverage ≥ 62 % and lines ≥ 74 % by end of next sprint (measured and committed)
- [ ] Threshold changes always ship in the same change as the new tests
- [ ] No threshold is ever lowered to accommodate new code

### Risks

| Risk | Mitigation |
|------|-----------|
| Diminishing returns on UI-heavy code | Coverage for `lib/`/`api` logic first; E2E covers UI paths |
| Gate churn slows velocity | Small, regular increments instead of one big jump |

---

## S-04 — Load-Baseline the API and Tune Alert Thresholds with Real Traffic

**Priority: P1 · Effort: M · Owner: Senior DevOps Engineer**

### Context (current state)

Performance budgets exist but are unverified: `01-architecture-overview.md`
§6.2 sets "API p95 latency < 200 ms (non-AI routes)" and "API error rate
< 0.1 %", and `06-testing-strategy.md` §5 defines k6 smoke/peak/soak scenarios
(`tests/load/`) with thresholds. `ARCHITECTURE.md` notes "Some
dashboards/metrics thresholds are initial estimates and should be revisited
with real traffic" — the Prometheus alert rules
(`docker/prometheus/alerts.yml`) and the Grafana "Suitora Overview" dashboard
are built but untuned.

### Proposed plan

1. **Establish a baseline:** run the k6 smoke/peak/soak scenarios
   (`k6 run tests/load/test.js`) against deployed **staging** once it carries
   real-ish traffic; record p95/p99/error-rate per endpoint group.
2. **Verify the budgets:** confirm or revise the 200 ms p95 / 0.1 % error-rate
   budgets with evidence; document any endpoint that misses (e.g., analysis
   POST, dashboard stats on replica).
3. **Tune alerts:** recalibrate `alerts.yml` severities/thresholds to observed
   distributions to eliminate noise while still catching regressions; update
   `docs/runbooks.md` mapping.
4. **Define SLOs & error budgets:** e.g., 99.9 % availability, 95 % of
   requests < 200 ms over 30 days; wire burn-rate alerts.

### Deliverables & acceptance criteria

- [ ] k6 baseline report committed under `test-results/`
- [ ] Alert thresholds backed by measured data; runbooks updated
- [ ] SLOs + burn-rate alerts defined; a dashboard panel set reflects them

### Risks

| Risk | Mitigation |
|------|-----------|
| Staging has no traffic to measure | Use a synthetic k6 soak run as the baseline, then re-tune post-launch |
| Alert tuning creates noise or blind spots | Two-week observation window after first tuning |

---

## S-05 — GDPR & Audit-Log Retention Hardening + Restore Drill

**Priority: P1 · Effort: S–M · Owner: Security Engineer + Tech Writer**

### Context (current state)

`02-data-models-and-contracts.md` §6 defines soft-delete/GDPR export/delete and
backup retention (30 daily + 12 monthly) but explicitly leaves one item open:
"`audit_logs` … retention TBD — review quarterly (documented as an operational
decision in the roadmap)." The GDPR surface (`GET /api/user/data`,
`DELETE /api/user`) exists but has no automated end-to-end verification, no PII
inventory, and the restore path (`jobs/restore.ts`, `runbooks/database-backup.md`)
has not been exercised in a drill.

### Proposed plan

1. **Audit-log retention:** set a policy (e.g., 90 days for routine actions,
   1 year for privileged/ops actions), implement pruning in
   `jobs/retention.ts`, and record the decision as `ADR-004-audit-retention`.
2. **PII inventory:** list every table/column holding personal data against
   `privacy_policy/PRIVACY_POLICY.md`; confirm the GDPR export includes all of
   them (synthetic-data test).
3. **Automated GDPR tests:** integration + E2E for export completeness and
   account deletion (owned rows hard-deleted, sessions revoked, backup copies
   excluded by design and documented).
4. **Restore drill:** run a documented restore from the latest S3 dump into a
   scratch DB, verify row counts and a sample analysis render; record the drill
   in `test-results/` and refresh `runbooks/database-backup.md` with any gaps
   found.
5. **Docs sync:** update `SECURITY.md` and the privacy policy with the
   retention figures.

### Deliverables & acceptance criteria

- [ ] `audit_logs` retention implemented with a default policy + ADR
- [ ] GDPR export/delete covered by automated tests with a PII inventory
- [ ] One successful restore drill documented with before/after checksums

### Risks

| Risk | Mitigation |
|------|-----------|
| Retention policy conflicts with debugging needs | Keep 1-year window for ops/privileged actions; document the trade-off |
| Restore drill uncovers S3/backup gaps | Schedule drill quarterly; treat failures as P0 incidents |

---

## Checklist

- [x] Five distinct, prioritized plan suggestions produced (P0/P1 scope)
- [x] Each suggestion states current state with concrete codebase evidence
- [x] Each suggestion has phases, deliverables, and acceptance criteria
- [x] Each suggestion carries an effort estimate and risk register
- [x] Dependencies between suggestions made explicit (S-01/S-02 parallel; S-04 needs staging)
