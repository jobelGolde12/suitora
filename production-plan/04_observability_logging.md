# Observability & Logging Plan

> **Pillar 04 — Suitora Production Readiness**
> This document details the work needed to bring Suitora from ad-hoc
> `console.*` logging and opaque error handling to a production-grade
> observability stack: structured JSON logs, correlation IDs, distributed
> tracing, Prometheus metrics, Grafana dashboards, and alerting with a fast
> resolution SLA. Each strategic action item is expanded into a concrete,
> sectioned work package.

---

## Table of Contents

1. [Scope & Objectives](#1-scope--objectives)
2. [Current State Analysis](#2-current-state-analysis)
3. [Production Gaps](#3-production-gaps)
4. [Strategic Action Items](#4-strategic-action-items)
5. [Error Handling Model](#5-error-handling-model)
6. [Logging Conventions](#6-logging-conventions)
7. [Metrics & SLOs](#7-metrics--slos)
8. [Tracing & Context Propagation](#8-tracing--context-propagation)
9. [Alerting & On-Call](#9-alerting--on-call)
10. [Success Metrics & Definition of Done](#10-success-metrics--definition-of-done)
11. [Sequencing & Dependencies](#11-sequencing--dependencies)

---

## 1. Scope & Objectives

### 1.1 Purpose
Give operators visibility into Suitora's health: standardized error handling
that never leaks stack traces, structured JSON logs with correlation IDs,
end-to-end request tracing, exported metrics, and dashboards/alerts that catch
issues before users do.

### 1.2 In Scope
- Standardized error handling & HTTP status mapping
- Structured JSON logging (pino)
- Request-level correlation IDs
- OpenTelemetry instrumentation & trace export
- Prometheus `/metrics` endpoint
- Grafana dashboards (latency, errors, traffic, saturation)
- Alerting & incident resolution SLA

### 1.3 Out of Scope
- Database query performance tuning (see `03_database_data_integrity.md`)
- CI/CD pipeline (see `06_cicd_deployment.md`)
- Dependency management (see `09_dependency_management.md`)

### 1.4 Reference Standards
- **OpenTelemetry** semantic conventions (HTTP, DB, messaging)
- **Prometheus** naming & histogram best practices
- **Google SRE** SLO/error-budget guidance
- **pino** structured-logger conventions (binding, redaction, serializers)

---

## 2. Current State Analysis

### 2.1 Error Handling
- `lib/api/response.ts` centralizes API responses and already provides:
  - `apiError(message, status)`
  - `apiOk(data, message)`
  - `apiValidationError(error)` — structured field-level 400s
  - `apiRateLimitError(message, retryAfterSeconds)` — 429 with `Retry-After`
- Route handlers wrap logic in `try/catch` and call `apiError("Internal server
  error", 500)` — good, but inconsistent error messages and no logging helper.
- `app/error.tsx` is a client-side boundary — it calls `console.error(error)` but
  renders a generic message (no stack trace leaked to the UI).

### 2.2 Logging
- **38 `console.log/error/warn` calls** across `app/api/**/route.ts`.
- Format is unstructured free text, e.g.
  `[trend-sync] Completed in ${duration}ms: ...`
  and `Error in POST /api/analysis:`.
- `lib/ai/tryon/monitoring.ts` is the one bright spot: it already emits a
  structured `console.info("[tryon]", { action, jobId, provider, latencyMs,
  status, error })` line and persists events to the `audit_logs` table.

### 2.3 Correlation & Tracing
- No correlation ID is generated or propagated per request.
- No OpenTelemetry SDK or instrumentation anywhere.

### 2.4 Metrics
- No `/metrics` endpoint.
- Some business metrics are computed ad hoc in `lib/ai/tryon/monitoring.ts`
  (`getTryOnStats`) and `lib/db/queries.ts` (`getDashboardStats`) but these are
  app-facing, not Prometheus-exported.
- Redis client exists (`lib/cache.ts`) but there's no Prometheus/`prom-client`
  integration.

### 2.5 Dashboards & Alerting
- No Grafana dashboards, Prometheus rules, or alert channels configured.

---

## 3. Production Gaps

| ID | Gap | Severity | Evidence |
|----|-----|----------|----------|
| G1 | No standardized error taxonomy / HTTP mapping | **High** | Messages differ per route; only `apiError` shape |
| G2 | Unstructured `console.*` logging | **High** | 38 call sites; no JSON, no level handling |
| G3 | No correlation ID per request | **High** | No middleware/header generation |
| G4 | No distributed tracing | Medium | No OpenTelemetry SDK |
| G5 | No Prometheus metrics endpoint | **High** | No `/metrics`, no `prom-client` |
| G6 | No dashboards or alerting | **High** | No Grafana/Prometheus rules |
| G7 | No structured error capture to an error-tracking service (Sentry) | Medium | Only `console.error` |
| G8 | Stack traces risk in raw error logs (not client-facing) | Medium | `console.error(err)` logs full objects |

---

## 4. Strategic Action Items

Each item is a work package with priority, objective, current status, files to
modify, steps, and acceptance criteria.

---

- [x] ### Action Item 1 — Standardized Error Handling & HTTP Mapping

**Priority:** P0

**Objective:** Classify errors into a consistent taxonomy mapped to standard HTTP
status codes, and never leak stack traces to clients.

**Current status:** `lib/api/response.ts` has `apiError`, `apiValidationError`,
`apiRateLimitError`. Handlers manually `try/catch` and return generic 500s.

**Files to modify**
- `lib/api/errors.ts` (create) — `AppError` class + HTTP mapping
- `lib/api/response.ts` — add `handleError`/`toHttpError`
- `app/api/**/route.ts` — replace bespoke `try/catch` with `handleError`

**Steps**
1. Create `lib/api/errors.ts` with an `AppError` class carrying `code`, `status`,
   `message`, `details`, and `cause` (never the raw stack for clients).
2. Define an error taxonomy: `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`,
   `VALIDATION`, `RATE_LIMIT`, `CONFLICT`, `BAD_REQUEST`, `INTERNAL`,
   `UPSTREAM_UNAVAILABLE`, `PAYLOAD_TOO_LARGE`.
3. Add a `toHttpError(err)` mapper in `lib/api/response.ts` that:
   - Maps known `AppError`/Zod errors to their status + `{ error, code }`.
   - Maps unexpected errors to `500` with a generic message (no stack).
4. Add `handleError(err, ctx)` that logs the full error (with stack) **server-side**
   via the structured logger (Action Item 2) and returns a safe client payload.
5. Replace route-level `catch (err) { console.error(...); return apiError("Internal server error", 500); }`
   with a single `return handleError(err)` call.
6. Keep `app/error.tsx` as a generic client boundary; ensure it never renders
   `error.stack` or `error.message` verbatim.

**Acceptance criteria**
- Every error maps to a standard HTTP status + machine-readable `code`.
- No stack trace or internal message is returned to clients.
- All API routes route through `handleError`.

---

- [x] ### Action Item 2 — Structured JSON Logging (pino)

**Priority:** P0

**Objective:** Replace `console.*` with a pino-based structured logger emitting
JSON with `requestId`/`correlationId`, level filtering, and redaction.

**Current status:** 38 `console.*` call sites; `lib/ai/tryon/monitoring.ts` emits
a semi-structured `[tryon]` line.

**Files to modify**
- `lib/logger.ts` (create) — pino instance + serializers
- `app/api/**/route.ts` — replace `console.*` with `logger.*`
- `lib/ai/tryon/monitoring.ts` — route through `logger`
- `lib/ai/**` / `jobs/**` — adopt logger

**Steps**
1. Create `lib/logger.ts` exporting a pino instance:
   - `level` from `LOG_LEVEL` env (default `info`, `debug` in dev).
   - `base: { service: "suitora", env }` for grouping.
   - `redact` paths for secrets (`*.password`, `*.token`, `BETTER_AUTH_SECRET`,
     `authorization`, `cookie`, `x-*secret`).
   - `serializers` for `err`, `req`, `res` (pino-std-serializers).
   - `transport` to stdout in JSON (production) and pretty in dev.
2. Add a `child({ requestId, correlationId })` helper for per-request context.
3. Define structured log fields: `requestId`, `correlationId`, `route`, `method`,
   `status`, `durationMs`, `userId`, `errorCode`, `provider`.
4. Replace all `console.*` in `app/api/**`, `lib/ai/**`, `jobs/**` with `logger.*`.
5. Update `lib/ai/tryon/monitoring.ts` to use `logger.child({...})` so its
   `[tryon]` events become JSON with the same schema.

**Acceptance criteria**
- 100% of logs are valid JSON with a `requestId`/`correlationId`.
- Secrets are redacted from all log output.
- No `console.*` remains in `app/api/**`, `lib/ai/**`, or `jobs/**`.

---

- [x] ### Action Item 3 — Request Correlation ID

**Priority:** P0

**Objective:** Generate a correlation ID per request, attach it as a header, and
propagate it through logs and outbound calls.

**Current status:** No correlation ID exists.

**Files to modify**
- `middleware.ts` — generate/read `X-Request-Id` header
- `lib/logger.ts` — read `requestId` from headers
- `next.config.ts` (optional) — header pass-through

**Steps**
1. In `middleware.ts`, generate a `crypto.randomUUID()` correlation ID when no
   `X-Request-Id` header is present; set it on the request and response headers.
2. Accept an upstream `X-Request-Id`/`x-correlation-id` if provided (for
   client/server correlation) but never trust it blindly — normalize length.
3. Make `lib/logger.ts` read the correlation ID from the request headers so every
   log line in a request carries it.
4. Propagate the ID to outbound requests (OpenAI, RunPod, Cloudinary, Redis) via
   the OTel context (Action Item 4) or a header.
5. Return the ID in response headers (`X-Request-Id`) so clients/SRE can correlate.

**Acceptance criteria**
- Every request has a unique correlation ID in headers and logs.
- The same ID appears across all logs generated by that request.
- Outbound provider calls carry the ID for end-to-end correlation.

---

- [x] ### Action Item 4 — OpenTelemetry Instrumentation & Tracing

**Priority:** P1

**Objective:** Instrument the app with OpenTelemetry and export traces/spans to a
backend (Jaeger or Prometheus-exposed OTLP).

**Current status:** No OTel SDK or instrumentation.

**Files to modify**
- `lib/tracing.ts` (create) — OTel SDK + resource
- `instrumentation.ts` (root) — Next.js instrumentation hook
- `middleware.ts` — start/end root span
- `lib/logger.ts` — bridge logs with trace context

**Steps**
1. Add `@opentelemetry/sdk-node`, exporters (`@opentelemetry/exporter-trace-otlp-http`),
   and auto-instrumentations (`@opentelemetry/auto-instrumentations-node`).
2. Create `lib/tracing.ts` that initializes the SDK with:
   - `service.name = "suitora"`, `deployment.environment`.
   - trace exporter to Jaeger (or OTLP/jaeger compatible) via `OTEL_EXPORTER_OTLP_ENDPOINT`.
   - auto-instrumentations for HTTP, DB (libSQL/Postgres), and Fetch.
3. Add a root `instrumentation.ts` (Next.js) that registers OTel on server startup.
4. In `middleware.ts`, start a root span for each request and set
   `requestId`/`correlationId` attributes; end it in the response.
5. Instrument the critical paths: `app/api/analysis` (vision + try-on pipeline),
   `lib/ai/tryon/lifecycle.ts`, `lib/ai/vision.ts`, `lib/storage/cloudinary.ts`,
   Redis (`lib/cache.ts`), and DB queries.
6. Bridge logs and traces: include `trace_id`/`span_id` from the active span in
   every `lib/logger.ts` log line.

**Acceptance criteria**
- Traces export to the configured backend with nested spans per request.
- DB, HTTP, Redis, and provider calls are visible as spans.
- Every log line carries `trace_id`/`span_id` linking logs to traces.

---

- [x] ### Action Item 5 — Prometheus `/metrics` Endpoint

**Priority:** P0

**Objective:** Expose a `/metrics` endpoint in Prometheus format for latency,
error rate, and traffic, plus key business counters.

**Current status:** No `/metrics`; `prom-client` not installed; only ad hoc
business stats in `lib/ai/tryon/monitoring.ts` and `lib/db/queries.ts`.

**Files to modify**
- `lib/metrics.ts` (create) — `prom-client` registry + custom metrics
- `app/metrics/route.ts` (create) — `/metrics` endpoint
- `middleware.ts` — record request latency/histogram
- `lib/ai/tryon/monitoring.ts` — increment counters

**Steps**
1. Add `prom-client` and create `lib/metrics.ts` with:
   - `http_requests_total` (counter, labels: `route`, `method`, `status`).
   - `http_request_duration_seconds` (histogram buckets: 0.005 → 10s).
   - `http_errors_total` (counter, labels: `route`, `error_code`).
   - `http_in_flight_requests` (gauge).
   - `upstream_request_duration_seconds` (histogram, label: `provider`).
   - `db_query_duration_seconds` (histogram, label: op).
2. Create `app/metrics/route.ts` returning `prometheus.register.metrics()` with
   `Content-Type: text/plain; version=0.0.4; charset=utf-8`.
3. In `middleware.ts` (or a wrap), record `http_requests_total`,
   `http_request_duration_seconds`, and `http_in_flight_requests` on each request.
4. In `lib/ai/tryon/monitoring.ts`, increment counters for try-on outcomes
   (`tryon_events_total{action}`) and record latency histograms.
5. Protect `/metrics` from public access (internal network / auth) — see
   `02_security_compliance.md`.
6. Ensure the endpoint is scraped by Prometheus (see `docker/` or k8s ServiceMonitor).

**Acceptance criteria**
- `/metrics` returns valid Prometheus text format.
- Latency, error-rate, and traffic metrics are recorded per route.
- Try-on and provider metrics are exported.
- Endpoint is reachable only from the monitoring network.

---

- [x] ### Action Item 6 — Grafana Dashboards

**Priority:** P1

**Objective:** Deploy Grafana dashboards visualizing latency, errors, traffic, and
saturation.

**Current status:** No Grafana or dashboards.

**Files to modify**
- `docker/grafana/dashboards/` (create) — JSON dashboards + provisioning
- `docker/docker-compose.yml` — add Grafana + Prometheus services
- `k8s/` — optional ServiceMonitor + Prometheus/Grafana manifests

**Steps**
1. Add Prometheus + Grafana to `docker/docker-compose.yml` (or `k8s/`).
2. Provision Grafana with a Prometheus datasource and a default folder.
3. Create dashboard JSON covering:
   - **Latency:** p50/p95/p99 `http_request_duration_seconds` per route.
   - **Errors:** `http_errors_total` as a rate, split by `error_code`.
   - **Traffic:** `http_requests_total` rate per route/status.
   - **Saturation:** Redis memory, DB pool utilization, in-flight requests,
     upstream (provider) latency.
4. Add a try-on-specific dashboard using `tryon_events_total` and latency.
5. Version the dashboards in `docker/grafana/dashboards/` and import them
   automatically on startup.

**Acceptance criteria**
- Latency, error, traffic, and saturation panels are visible in Grafana.
- Dashboards are versioned in the repo and auto-provisioned.
- Try-on/provider panels surface provider latency and failures.

---

- [x] ### Action Item 7 — Alerting & Error-Spike SLA

**Priority:** P0

**Objective:** Configure Prometheus alert rules for error-rate spikes and open
resolved incident within 5 minutes.

**Current status:** No alert rules or channels.

**Files to modify**
- `docker/prometheus/alerts.yml` (create) — alert rules
- `docker/docker-compose.yml` — mount alerts + Alertmanager
- `docker/alertmanager/alertmanager.yml` (create) — channel config
- `docs/runbooks.md` (see `08_documentation_runbooks.md`) — on-call runbook

**Steps**
1. Define SLO-based alert rules in `alerts.yml`:
   - `HighErrorRate`: `error_ratio` over a 5m window > 5% (or SLO threshold).
   - `HighLatency`: p99 > 2s for 5m.
   - `TrafficAnomaly` / `Saturation`: Redis/DB utilization > 80%.
   - `NoData`: app instance down for > 1m.
2. Configure Alertmanager to route to Slack/email/on-call with severity labels
   (`critical`, `warning`, `info`).
3. Set the **error-rate spike** alert to fire within 5 minutes of onset and
   require acknowledgement/triage.
4. Document the 5-minute resolution SLA and on-call escalation in the runbook
   (see `08_documentation_runbooks.md`).
5. Add a synthetic check (cron) that hits `/api/health` or `/metrics` and alerts
   if the app is unreachable.

**Acceptance criteria**
- Error-rate spike alert triggers within 5 minutes of onset.
- Alert routes to the on-call channel with severity.
- Runbook documents the 5-minute resolution SLA and escalation path.

---

## 5. Error Handling Model

### 5.1 Error Taxonomy → HTTP Mapping
| `code` | HTTP | Meaning |
|--------|------|---------|
| `VALIDATION` | 400 | Zod/body validation failed |
| `UNAUTHORIZED` | 401 | Missing/invalid session |
| `FORBIDDEN` | 403 | Authenticated but not permitted |
| `NOT_FOUND` | 404 | Resource missing |
| `CONFLICT` | 409 | Duplicate/state conflict |
| `RATE_LIMIT` | 429 | Rate or quota exceeded |
| `PAYLOAD_TOO_LARGE` | 413 | File/body too large |
| `UPSTREAM_UNAVAILABLE` | 503 | Provider/DB unavailable |
| `BAD_REQUEST` | 400 | Generic malformed request |
| `INTERNAL` | 500 | Unexpected error (generic message) |

### 5.2 Client Safety
- Client payload shape: `{ "error": string, "code": string, "requestId": string }`.
- Server-side full detail (stack, cause) goes only to the structured logger.
- `app/error.tsx` renders a generic message; it never renders `error.stack`.

---

## 6. Logging Conventions

### 6.1 Required Fields
| Field | Source | Example |
|-------|--------|---------|
| `level` | pino | `info` |
| `time` | pino | ISO timestamp |
| `requestId` / `correlationId` | middleware | `uuid` |
| `trace_id` / `span_id` | OTel | hex |
| `route` | request | `/api/analysis` |
| `method` | request | `POST` |
| `status` | response | `200` |
| `durationMs` | timing | `345` |
| `userId` | session | `user_...` |
| `errorCode` | taxonomy | `VALIDATION` |

### 6.2 Redaction
- Redact: passwords, tokens, cookies, `authorization`, `x-*secret`,
  `BETTER_AUTH_SECRET`, `access_token`, `refresh_token`, `id_token`.
- Never log full Cloudinary/RunPod/OpenAI credentials.

---

## 7. Metrics & SLOs

### 7.1 Core Metrics
- `http_requests_total{route,method,status}`
- `http_request_duration_seconds{route}` (p50/p95/p99)
- `http_errors_total{route,error_code}`
- `http_in_flight_requests`
- `tryon_events_total{action}`
- `tryon_latency_seconds{provider}`
- `db_query_duration_seconds{op}`
- `upstream_request_duration_seconds{provider}`

### 7.2 Proposed SLOs
- **Availability:** 99.9% of requests succeed (HTTP < 500).
- **Latency:** p95 < 500ms, p99 < 2s for API.
- **Error rate:** < 0.5% of requests return 5xx.

---

## 8. Tracing & Context Propagation

- One root span per request (started in `middleware.ts`).
- Child spans: DB query, Redis, HTTP fetch to providers, try-on lifecycle.
- Attributes: `http.route`, `http.method`, `http.status_code`,
  `requestId`, `correlationId`, `provider`, `jobId`.
- Export via OTLP to Jaeger/Prometheus (`OTEL_EXPORTER_OTLP_ENDPOINT`).
- Bridge to logs: every log line carries `trace_id`/`span_id`.

---

## 9. Alerting & On-Call

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| `HighErrorRate` | 5m error ratio > 5% | critical | Page on-call; resolve ≤ 5 min |
| `HighLatency` | p99 > 2s for 5m | warning | Investigate; scale if needed |
| `Saturation` | Redis/DB > 80% | warning | Scale/cache tune |
| `NoData` | app down > 1m | critical | Page on-call |
| `ProviderFailure` | upstream error rate > 10% | warning | Check provider status |

---

## 10. Success Metrics & Definition of Done

| Metric | Target | Status now |
|--------|--------|-----------|
| Errors logged in JSON with correlation ID | 100% | No structured logging |
| Stack traces leaked to clients | 0 | Already safe (generic 500) |
| `/metrics` returns valid Prometheus format | Yes | Not implemented |
| Alert on error-rate spike resolved within 5 min | Yes | No alerts |
| Correlation ID per request | Yes | Not implemented |
| Distributed tracing exported | Yes | Not implemented |
| Dashboards for latency/errors/traffic/saturation | Yes | Not implemented |

**Definition of Done:** All API routes use `handleError` with a standard taxonomy
and no client leak; 100% of logs are structured JSON with correlation/trace IDs;
traces export to a backend; `/metrics` is valid and scraped; Grafana dashboards
are live; error-spike alerts fire and are resolved within 5 minutes.

---

## 11. Sequencing & Dependencies

| Phase | Items | Rationale |
|-------|-------|-----------|
| **Phase 0** | A1 (error model), A2 (pino), A3 (correlation ID) | Foundation: safe, correlated logging |
| **Phase 1** | A5 (metrics), A4 (tracing) | Export signal before building views |
| **Phase 2** | A6 (Grafana), A7 (alerting) | Dashboards + alerts on exported signals |
| **Continuous** | §5-§9 conventions, SLO review | Ongoing visibility |

**Blocking dependencies**
- A2 (pino) must precede A1 (route adoption) and A7 (alerting on logs).
- A5 (metrics) must precede A6 (Grafana) and A7 (error-rate alerts).
- A4 (tracing) enhances A2 (log/trace bridge) and A6 (span latency).
- Deployment of Prometheus/Grafana/Alertmanager depends on `docker/` and `k8s/`
  from `01_architecture_scalability.md`, and secret/network policies from
  `02_security_compliance.md`.
