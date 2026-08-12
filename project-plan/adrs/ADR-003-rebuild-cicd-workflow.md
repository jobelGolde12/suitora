# ADR-003: Rebuild the CI/CD Workflow

- **Status:** Accepted
- **Date:** 2026-08-11
- **Related:** roadmap Phase B (B1, B2)

## Context

`.github/workflows/cicd.yml` contained prose (an AI-session summary) instead of
a valid GitHub Actions workflow (blocker G-01). There was no staging/production
deployment path or rollback procedure in CI, and the repo shipped Docker,
k8s manifests, and a `deploy/promote.yml` reference that were not wired to
anything.

## Decision

Author a valid `cicd.yml` with four jobs:

1. **`build-and-test`** — reuses the `ci.yml` quality gate exactly
   (lint → `tsc --noEmit` → `test:coverage` → `build`) so the deploy path never
   weakens verification.
2. **`validate-workflows`** — runs first; YAML-parses every workflow (Python
   `yaml.safe_load`, Ruby fallback) and `bash -n scripts/rollback.sh`, so a
   corrupt workflow fails fast (recurrence guard for G-01).
3. **`staging-deploy`** — on push to `main`: build/push `ghcr.io/…/suitora`
   (web + `-worker`), `kubectl set image` in the `staging` namespace, wait for
   rollout, smoke `/api/health`, Slack notify.
4. **`production-deploy`** — on `v*` tags or manual dispatch: blue-green promote
   (read `blue-green-active` ConfigMap → deploy standby → health check → patch
   ingress → flip ConfigMap), Slack notify on success/failure.
5. **`rollback`** — manual dispatch that reverts the last promotion.

Because `inputs.*` is only valid on `workflow_dispatch` events, the workflow
reads manual-dispatch values via `github.event.inputs.*` (defaulting
gracefully), which is safe on push/`schedule` triggers too.

## Consequences

- Deployment and rollback are repeatable, reviewable, and guarded by the same
  quality gate as CI.
- Required repo secrets: `KUBE_CONFIG_DATA`, `SLACK_WEBHOOK_URL` (documented in
  the workflow and `.env.example`).
- YAML corruption in any workflow is caught in CI before it can break the repo.

## Alternatives Rejected

- **Single monolithic deploy job with no gate** — rejected: it would allow
  deploying unverified code.
- **Reuse an external CD action (e.g. ArgoCD, Flux)** — rejected: heavier than
  needed for one app; the existing k8s manifests + promote script are the
  convention.
- **Skipping rollback automation** — rejected: production blue-green without a
  rollback path is a support risk.
