# Runbook: Service Restart

| Field        | Value                                            |
|--------------|--------------------------------------------------|
| Incident type | Unhealthy / hung / OOM'd service                |
| Severity     | critical → warning (depends on user impact)      |
| Owner        | Platform / on-call engineering                    |
| Review cadence | Quarterly                                        |

## Purpose

How to restart Suitora's processes (web, API, worker) safely — with a rolling
restart that avoids downtime, verification after the restart, and rollback if
the new process fails to start.

## Recovery Objectives

| Metric | Target                               |
|--------|--------------------------------------|
| RTO    | ≤ 10 minutes to healthy for a single tier |
| RPO    | n/a (restart must not lose durable data) |

## Services

| Service      | Entrypoint                     | Notes                          |
|--------------|--------------------------------|--------------------------------|
| Web / API    | Next.js (`npm start` / web tier) | Serves pages + `/api/*`       |
| Worker       | `services/worker/index.ts`     | Jobs: try-on, trend sync       |
| DB           | Turso (external)                | Restart only if unreachable    |

## Prerequisites / Access

- Access to the deployment platform (Vercel, Kubernetes, or Docker Compose
  depending on environment).
- Ability to read logs (see `docs/runbooks.md` for log access).

## Why You Might Need This

- `SuitoraNoData` (metrics scrape down), `SuitoraHighLatency`, or
  `SuitoraNodeHeapExhaustion` alerts (see `docs/runbooks.md`).
- A deployment rolled out a broken process and the health check fails.
- OOM kill, hung event loop, or an exhausted fd/connection pool.

## Restart Procedure

### 1. Pre-flight

- Confirm which tier is affected: check `/metrics`, `/api/health`, and error
  rates.
- If this is a **failed deployment**, prefer rollback over restart (Section 4).

### 2. Rolling restart (web tier) — Docker Compose

```bash
docker compose up -d --no-deps --force-recreate web
```

Multiple replicas restart one at a time thanks to the orchestrator/load
balancer draining connections; the `restart: always` policy brings the
container back if it exits.

### 2. Rolling restart (web tier) — Kubernetes

```bash
kubectl rollout restart deployment/suitora-web -n <env>
kubectl rollout status deployment/suitora-web -n <env> --timeout=5m
```

### 3. Restart the worker

```bash
# Docker
# docker compose up -d --no-deps --force-recreate worker
# Kubernetes
kubectl rollout restart deployment/suitora-worker -n <env>
kubectl rollout status deployment/suitora-worker -n <env> --timeout=5m
```

> Restarting the web tier before the worker avoids a window where submissions
> queue with no consumer. Restart the worker next.

## Verify After Restart

1. **Health check:**

   ```bash
   curl -fsS http://localhost:3000/api/health
   ```

   Expect `200` and a `success: true` envelope.

2. **Metrics:** confirm `/metrics` is scraped and error rate returns to normal
   in Grafana (`Suitora Overview`).

3. **Worker:** confirm the worker process is running and draining its queue
   (no growth in pending jobs).

4. **Functional check:** sign in and perform a representative action (e.g. run
   an analysis, open a result).

## Rollback

If the *restarted* process fails to start or immediately crashes:

- **Image/version rollback:** redeploy the previous known-good version. On
  Kubernetes use the blue-green manifests (see `k8s/`) to flip the active
  environment, or run `scripts/rollback.sh` (logs the operation and switches
  the active deployment back).
- The rollback script's purpose is to return to the last known-good image tag
  — run it if a deployment rolls out unhealthy code.

## Verification / Completion

- [ ] `/api/health` returns healthy
- [ ] No active `SuitoraNoData` / `SuitoraHighLatency` alert
- [ ] Worker is consuming its queue
- [ ] A representational user flow works

## Escalation

- If a single tier restart does not restore health, page the on-call
  secondary and engineering lead (see escalation in `docs/runbooks.md`).
- If restarts recur repeatedly, treat it as a crash-loop incident and use
  `runbooks/crash-alert.md`.
