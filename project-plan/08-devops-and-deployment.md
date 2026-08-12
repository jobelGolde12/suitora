# 08 — DevOps & Deployment

> Author role: Senior DevOps / Infrastructure Engineer
> Environment strategy, containerization, CI/CD stages, infrastructure-as-code,
> monitoring/logging/alerting, and backup/restore for Suitora. Grounded in
> `docker/`, `k8s/`, `deploy/`, `.github/workflows/`, `jobs/`, and the
> runbooks.

---

## 1. Environment Strategy

| Environment | Purpose | Parity |
|-------------|---------|--------|
| Local (`npm run dev`) | Daily development | File DB (`file:./data/suitora.db`), in-memory rate-limit/cache fallbacks, mock AI providers, `NODE_ENV=development` |
| CI (`ci.yml`) | PR/push verification | Fresh file DB, placeholder secrets, coverage gate |
| Staging | Integration + smoke | K8s `staging` namespace, `k8s/values-staging.yml`, deployed on push to `main` |
| Production | Live traffic | K8s `production`, blue-green promotion on `v*` tags, Turso/Upstash/Cloudinary/RunPod/S3 |

Secrets: injected per-environment from platform secret managers (Vercel env,
GitHub secrets, k8s secrets). Never committed (`.env*` gitignored).

---

## 2. Containerization Specification

- **Base image:** `docker/Dockerfile` multi-stage (`deps` → `web`/`worker`
  targets).
- **Web image:** Next.js `output: "standalone"` (self-contained
  `next.config.ts`); exposed app on container port; non-root runtime.
- **Worker image:** `tsx services/worker/index.ts` entrypoint (trend sync,
  try-on orchestration, backup/retention).
- **Build/push:** `.github/workflows/docker.yml` → `ghcr.io/{owner}/suitora`
  tags `latest` + `sha`; worker tagged `-worker:latest` / `-worker:{sha}`;
  `cache-from/cache-to: type=gha,mode=max`.
- `.dockerignore` excludes node_modules/.next/coverage/env.

---

## 3. CI/CD Pipeline Stages

### 3.1 PR / push verify — `.github/workflows/ci.yml`
`checkout → node 22 → npm ci → npm run lint → tsc --noEmit → npm run
test:coverage (gate) → upload coverage-summary → db:migrate+db:status (fresh
file DB, informational) → npm run build → e2e on main`.
`concurrency` cancels stale runs; `fail-fast: false`.

### 3.2 Security — `.github/workflows/security.yml`
`gitleaks full-history secret scan` + `npm audit --omit=dev`.

### 3.3 Image build — `.github/workflows/docker.yml`
On `main`/`v*` tags: buildx → GHCR push (web + worker) with GHA cache.

### 3.4 Deploy — `.github/workflows/cicd.yml` (REBUILD TARGET — see roadmap B1)
1. **staging-deploy** (`main`): set image on `suitora-web`/`suitora-worker`
   deployments → `kubectl rollout status` → smoke `/api/health` → Slack.
2. **production-deploy** (`v*`/dispatch): read `blue-green-active` ConfigMap →
   deploy standby (blue/green) → health check → patch ingress → flip ConfigMap
   → Slack.
3. **rollback** (manual): revert previous promotion; `scripts/rollback.sh`.

> **G-01 (blocker):** the current `cicd.yml` is corrupt and must be rebuilt
> exactly per `07-implementation-roadmap.md` Phase B before these stages
> function.

---

## 4. Infrastructure-as-Code

- **K8s manifests** (plain YAML, version-controlled):
  - `k8s/deployment.yaml` (canonical web), `k8s/deployment-blue.yaml`,
    `k8s/deployment-green.yaml` (blue-green pair, probes, resources, HPA).
  - `k8s/worker-deployment.yaml`, `k8s/service.yaml`, `k8s/ingress.yaml`.
  - `k8s/canary.yaml` (weighted ingress canary), `k8s/blue-green-active.yaml`
    (ConfigMap tracking active env), `k8s/values-staging.yml`.
- **`deploy/promote.yml`**: promotion paths dev→staging (auto), staging→prod
  (manual approval), canary→prod (weighted split).
- **Compose stack** `docker/docker-compose.yml`: web + worker + nginx
  (`docker/nginx/nginx.conf` — blocks public `/metrics`) + observability stack.

---

## 5. Monitoring, Logging & Alerting

| Concern | Stack |
|---------|-------|
| Metrics | prom-client `/metrics`; Prometheus scrape (`docker/prometheus/prometheus.yml`); Grafana dashboard `docker/grafana/dashboards/suitora-overview.json` |
| Logs | pino structured JSON; correlation `requestId`/`trace_id` (OpenTelemetry via `lib/tracing.ts`); `X-Request-Id` on every response |
| Alerts | `docker/prometheus/alerts.yml` — error rate, p95 latency, provider failures, heap, DB health; routed via Alertmanager (`docker/alertmanager/alertmanager.yml`) |
| Health | `/api/health` liveness; `jobs/health-check.ts` synthetic checks |

---

## 6. Backup & Restore Procedures

- **Backup:** `jobs/backup.ts` → `lib/db/dump.ts` → S3-compatible store
  (`S3_*`), records `backup_logs`. Retention pruning `jobs/retention.ts`
  (`BACKUP_RETAIN_DAILY=30`, `BACKUP_RETAIN_MONTHLY=12`).
- **Restore:** `jobs/restore.ts`; documented in `runbooks/database-backup.md`.
- **Other runbooks:** `runbooks/service-restart.md`, `runbooks/crash-alert.md`.
- **Scheduled:** cron job cadence; `CRON_SECRET` guards trigger endpoints.

---

## 7. Deliverables for This Engagement

- Rebuild `cicd.yml` (roadmap B1) and validate with `actionlint`.
- Confirm `npm run lint` is CI-green (roadmap A1) — this unblocks `ci.yml`.
- Document env/secret requirements for the repaired pipeline in D1.

---

## Checklist

- [x] Environment strategy (development, staging, production parity)
- [x] Containerization specification (Dockerfile requirements, multi-stage builds)
- [x] CI/CD pipeline stage definitions (lint → test → build → scan → deploy)
- [x] Infrastructure-as-code requirements
- [x] Monitoring, logging, and alerting stack specification
- [x] Backup and restore procedures
