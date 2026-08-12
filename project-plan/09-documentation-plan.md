# 09 — Documentation Plan

> Author role: Technical Writer / Documentation Specialist
> API documentation, code documentation standards, repository docs,
> architecture-diagram cadence, and runbooks for Suitora.

---

## 1. API Documentation Tooling & Standard

- **Standard:** OpenAPI 3.0 — hand-maintained `docs/api/swagger.yaml`
  (~1500 lines) is the **source of truth** for the public API.
- **Serving:** `/api/docs` renders Swagger UI (CDN bundles) loading
  `/api/docs/spec` (`app/api/docs/spec/route.ts`); `swagger-config.json`
  drives `swagger-jsdoc` metadata.
- **Convention:** any change to a Route Handler contract updates
  `docs/api/swagger.yaml` **in the same PR** (enforced by review +
  `docs/README.md` contribution rules).
- **Keep-sync rule:** the README API table must match the spec or be replaced
  by a link to `/api/docs` (known debt in `ARCHITECTURE.md` §Known Technical
  Debt — include in docs sync pass).

---

## 2. Code Documentation Standard

- **Language:** JSDoc-style TSDoc for public APIs of modules.
- **Scope:** public functions/classes/modules and the *why* (never restate the
  *what* — per `AGENTS.md` "Comments: only add when explaining *why*").
- **Required on:** `lib/api/*`, `lib/ai/*` pipeline entry points,
  `lib/auth/*`, `lib/db/*`, `lib/security/*`, `jobs/*`, `scripts/*`,
  `drizzle/schema.ts` tables (one-line purpose comment per table, as
  convention already used for `trend_items`/`stylist_messages`).
- **Pattern example:** `lib/db.ts` and `lib/api/route.ts` already follow this
  (module-level doc block with rationale). New code must match.

---

## 3. Repository Documentation Files (required)

| File | Status | Owner |
|------|--------|-------|
| `README.md` | Exists (comprehensive: vision, stack, flow, schema, API, roadmap, security, perf, a11y, deployment) | Engineering lead |
| `CONTRIBUTING.md` | Exists (setup, conventions, PR process, testing) | Engineering lead |
| `ARCHITECTURE.md` | Exists (system context, decisions, data flow, observability, scaling, debt) | Engineering lead |
| `SECURITY.md` | Exists (security policy) | Security |
| `CHANGELOG.md` | **Missing** — create, Keep a Changelog format, versioned + dated | Technical writer |
| `LICENSE` | Proprietary (all rights reserved; no file — confirm with product) | Product |
| `docs/` index + `docs/testing_policy.md` + `docs/data_schema.md` | Exist | Eng/QA/Data |
| `project-plan/` | Created this engagement | Tech lead |

**Deliverable for this engagement:** `CHANGELOG.md` (0.1.0 baseline from the
current state, plus an entry for the tooling/CI recovery work).

---

## 4. Architecture Diagram Regeneration Cadence

- `ARCHITECTURE.md` Mermaid diagrams are hand-maintained and reviewed:
  - **On every architectural change** (new external dependency, new
    component, changed data flow).
  - **Quarterly** as part of the docs review (`docs/README.md` §Ownership).
- System-context/component/data-flow diagrams live in `ARCHITECTURE.md`;
  this plan's `01-architecture-overview.md` mirrors them for the plan scope.
- Rule: if `01-architecture-overview.md` changes, sync `ARCHITECTURE.md`.

---

## 5. Runbook Documentation

| Runbook | Purpose | Location |
|---------|---------|----------|
| Database backup | S3 backup + restore procedure | `runbooks/database-backup.md`, `docs/runbooks.md` |
| Service restart | Deploy/restart playbook | `runbooks/service-restart.md` |
| Crash alert | Incident response for crash alert | `runbooks/crash-alert.md` |
| Observability | Alert rules + Grafana dashboard mapping | `docs/runbooks.md`, `docker/prometheus/alerts.yml` |

Runbooks must be updated whenever alert rules or recovery steps change.

---

## 6. Document Quality Gates

- `npm run lint:md` (markdownlint) and `npm run check:links`
  (markdown-link-check) must pass — enforced in CI/review.
- Broken links or lint violations block merges.

---

## 7. Deliverables for This Engagement

| Item | File |
|------|------|
| ADR — lint script repair | `project-plan/adrs/ADR-002-repair-lint-scripts.md` |
| ADR — CICD workflow rebuild | `project-plan/adrs/ADR-003-rebuild-cicd-workflow.md` |
| CHANGELOG baseline | `CHANGELOG.md` |
| Test results record | `test-results/2026-08-11-tooling-recovery.md` |

---

## Checklist

- [x] API documentation tooling and standard (OpenAPI/Swagger, etc.)
- [x] Code documentation standard (JSDoc, docstrings, XML comments, etc.)
- [x] Repository documentation files required (README, CONTRIBUTING, LICENSE, CHANGELOG)
- [x] Architecture diagram regeneration cadence
- [x] Runbook documentation for operations
