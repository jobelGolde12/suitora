# 07 — Implementation Roadmap

> Author role: Tech Lead + Engineering Manager
> Phase-by-phase plan to close the blockers identified in the Phase 0 audit
> (G-01…G-04). Each phase has a deliverable, acceptance criteria, checklist,
> risks, effort estimate, and explicit dependencies. Effort = T-shirt sizes.

---

## Sequence Dependency Diagram

```
┌────────────────────────────────────────────────────────────────┐
│ Phase A — Tooling & lint pipeline recovery  (independent)      │
│   A1 fix package.json scripts ─┐                                │
│   A2 remove corrupted .eslintrc.js ─┤                            │
│   A3 flat-config coverage audit ─┘                                │
└────────────────────────────────┬───────────────────────────────┘
                                 │ (needs A1: CI lint green)
┌────────────────────────────────▼────────────────────────────────┐
│ Phase B — CI/CD recovery                                        │
│   B1 rebuild .github/workflows/cicd.yml   (depends on A1)        │
│   B2 validate YAML + scripts                                     │
└────────────────────────────────┬───────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│ Phase C — Verification & regression (depends on A, B)           │
│   C1 full verify (tsc · lint · test:coverage · build)           │
│   C2 E2E smoke (if env permits)                                 │
│   C3 test-results/ documentation                                │
└────────────────────────────────┬───────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│ Phase D — Documentation & ADRs (can start after A2)             │
│   D1 README/CONTRIBUTING sync · D2 ADR-002..n                   │
└─────────────────────────────────────────────────────────────────┘
```

Parallelizable streams: **A1/A2/A3** and **D1/D2** (docs) can proceed in
parallel with each other; B requires A; C requires A+B.

---

## Phase A — Tooling & Lint Pipeline Recovery

**Owner:** Senior Backend/Frontend Developer. **Depends on:** nothing.
**Effort: S total.**

### A1. Repair `package.json` lint/format scripts

- **Change:** `lint`, `lint:fix`, `format` reference the nonexistent
  `./src/**/*.ts`. Retarget to the real tree:
  `app components lib types config hooks` (+ `actions`). Keep
  `--max-warnings=0` and `eslint` flat-config invocation.
- **Deliverable:** `npm run lint` passes from a clean shell with zero
  warnings/errors; `npm run lint:fix` and `format` operate on the real tree.
- **Acceptance criteria:**
  - [x] `npm run lint` exits 0 (no `No files matching` error).
  - [x] Same warnings/errors count as the manual flat-config invocation (0).
  - [x] `format` (prettier) targets `app/ components/ lib/` etc.
- **Completion checklist:**
  - [x] Scripts updated and verified in package.json.
  - [x] CI-equivalent command confirmed locally.

### A2. Remove corrupted `.eslintrc.js`

- **Change:** delete the dead prose file; the ESLint 9 flat config
  (`eslint.config.mjs`) is authoritative.
- **Deliverable:** repo contains no prose-as-config files; lint still green.
- **Acceptance criteria:** `rg -n "Create a comprehensive" .eslintrc.js` →
  file absent; `npm run lint` unchanged behavior.
- **Completion checklist:**
  - [x] File removed.
  - [x] Lint re-verified.

### A3. Flat-config coverage audit

- **Change:** confirm `eslint.config.mjs` ignores and file globs cover the
  whole `app/ components/ lib/` tree; add explicit files/dirs only where the
  default `eslint-config-next` misses them.
- **Deliverable:** a lint scope documented in the config comments.
- **Acceptance criteria:** lint over the full tree reports 0 issues.
- **Completion checklist:**
  - [x] Scope documented.
  - [x] Full-tree lint green.

---

## Phase B — CI/CD Recovery

**Owner:** Senior DevOps/Infrastructure Engineer. **Depends on:** A1.
**Effort: L total.**

### B1. Rebuild `.github/workflows/cicd.yml`

- **Context:** the file currently contains prose (an AI-session summary), not a
  valid GitHub Actions workflow. Reference: `production-plan/06_cicd_deployment.md`,
  `k8s/*`, `deploy/promote.yml`, `docker/Dockerfile`.
- **Change:** author a valid workflow with jobs:
  1. `build-and-test` (reuse ci.yml steps: lint → typecheck →
     `npm run test:coverage` → `npm run build`).
  2. `staging-deploy` — on push to `main`: build/push images (GHCR),
     `kubectl set image` for web+worker in `staging` namespace, wait rollout,
     smoke `/api/health`, Slack notify.
  3. `production-deploy` — on `v*` tags or manual dispatch: blue-green promote
     (read `blue-green-active` ConfigMap → deploy standby → health check →
     patch ingress → flip ConfigMap), Slack notify on success/failure.
  4. `rollback` — manual dispatch job reverting the last promotion.
- **Deliverable:** valid, reviewable workflow; local YAML syntax validation.
- **Acceptance criteria:**
  - [x] YAML parser validates the file (no `jobs` prose).
  - [x] References exist: manifests in `k8s/`, images `ghcr.io/…/suitora`
    (web + `-worker`), secrets documented (KUBE_CONFIG_DATA, SLACK_WEBHOOK_URL).
  - [x] Staging job reuses the same quality gate as `ci.yml` (no weaker path).
- **Completion checklist:**
  - [x] Workflow authored and syntax-validated.
  - [x] Secret/env references verified against `.env.example` and `k8s/`.

### B2. Validate workflow YAML + dependent scripts

- **Change:** add a lightweight validation (e.g. `actionlint` step or
  parse check) so future corruptions fail fast; sanity-check
  `scripts/rollback.sh` (bash -n) and manifest references.
- **Deliverable:** a guard preventing recurrence of G-01.
- **Acceptance criteria:** `actionlint .github/workflows/*.yml` clean;
  `bash -n scripts/rollback.sh` clean.
- **Completion checklist:**
  - [x] Validation added to CI (`validate-workflows` job, runs first).
  - [x] Scripts pass syntax checks.

---

## Phase C — Verification & Regression

**Owner:** QA Engineer. **Depends on:** A + B. **Effort: S.**

### C1. Full verification

- **Run:** `npx tsc --noEmit`, `npm run lint`, `npm run test:coverage`
  (coverage gate ≥ 65/55/50/65), `npm run build`.
- **Acceptance criteria:** all green; coverage gate not lowered.
- **Completion checklist:**
  - [x] tsc 0 errors.
  - [x] lint 0 warnings (via the repaired `npm run lint`).
  - [x] test:coverage passes with threshold gate.
  - [x] production build succeeds.

### C2. E2E smoke

- **Run:** `npm run test:e2e` if the local env can boot the app (document
  blocker otherwise, per prior session precedent).
- **Acceptance criteria:** critical journeys pass or blocker documented.
- **Result:** all critical journeys pass — 22/22 E2E tests across 5 specs
  (`analysis`, `auth`, `dashboard`, `landing`, `wardrobe`). See
  `test-results/2026-08-11-tooling-recovery.md`. Note: on memory-constrained
  hosts run with `--browser chrome --headless` (bundled Electron can OOM); the
  default `npm run test:e2e` still targets a locally booted dev server.

### C3. Test-results documentation

- **Deliverable:** `test-results/2026-08-11-tooling-recovery.md` — suites run,
  pass/fail counts, coverage summary, flakiness, open issues.
- **Result:** created `test-results/2026-08-11-tooling-recovery.md`.

---

## Phase D — Documentation & ADRs

**Owner:** Technical Writer. **Depends on:** A2 (parallel-safe). **Effort: S.**

### D1. Sync repository docs

- Update `README.md` script table and `CONTRIBUTING.md` verification commands
  if the lint-script repair changes them; note the `.eslintrc.js` removal.
- Acceptance: `npm run lint:md` and `npm run check:links` pass.
- **Result:** README scripts table synced to `package.json`; CI badge pointed at
  the real repo; coverage badge re-encoded and updated (70.62%); Gemini link
  updated; `.eslintrc.js` removal noted in CONTRIBUTING. `lint:md` and
  `check:links` both pass.

### D2. Architecture Decision Records

- `project-plan/adrs/ADR-002-repair-lint-scripts.md`
- `project-plan/adrs/ADR-003-rebuild-cicd-workflow.md`
  Format: context / decision / consequences / alternatives rejected.
- **Result:** both ADRs created in `project-plan/adrs/`.

---

## Risk Register

| Phase | Risk | Likelihood | Impact | Mitigation |
|-------|------|-----------|--------|-----------|
| A | Retargeting lint globs changes accepted code patterns | Low | Medium | Run full-tree lint before/after; diff warning counts |
| A | Flat-config ignores previously covered by `.eslintignore` | Medium | Low | A3 audit; re-add ignores in `eslint.config.mjs` globalIgnores if needed |
| B | Rebuilt workflow YAML fails on GitHub (schema drift) | Medium | High | `actionlint` validation; reuse proven `ci.yml` steps |
| B | Secrets referenced but not configured in repo | Medium | High | Document required secrets; keep deploy jobs conditional/guardable |
| B | Blue-green manifest drift (k8s) | Medium | Medium | Verify references to `k8s/*` at write time; follow deploy/promote.yml |
| C | Build fails due to uncommitted working-tree changes | Medium | Medium | Verify on current tree; if unrelated breakage, isolate to a follow-up task |
| C | Coverage dips below gate after changes | Low | Medium | Changes are config-only (no logic); re-run gate |
| D | Docs drift from repaired commands | Low | Low | D1 runbook + D2 ADR keeps provenance |

---

## Effort Summary

| Deliverable | Size |
|-------------|------|
| A1 fix lint scripts | S |
| A2 remove corrupted file | XS |
| A3 flat-config audit | S |
| B1 rebuild cicd workflow | L |
| B2 validation guard | M |
| C1 full verification | S |
| C2 E2E smoke | S–M |
| C3 test-results doc | S |
| D1 docs sync | S |
| D2 ADRs | S |

---

## Checklist

- [x] Phase-by-phase breakdown of implementation order with dependencies made explicit
- [x] Every phase has a clear deliverable, acceptance criteria, and completion checklist
- [x] Risk register for each phase (technical risks, mitigation steps)
- [x] Effort estimates (T-shirt sizes: S, M, L, XL) per deliverable
- [x] Sequence dependency diagram (text-based: Phase A → Phase B → Phase C, parallelizable streams)
