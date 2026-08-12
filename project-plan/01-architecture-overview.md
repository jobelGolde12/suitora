# 01 — Architecture Overview

> Author role: Senior Architect / Tech Lead
> Status: Planning artifact (Phase 1). Grounded in the existing Suitora codebase
> as audited on 2026-08-11. This document records the architectural decisions
> (including those already made and now documented), the component/data flow,
> the technology stack with exact versions, integration contracts, and the
> non-functional requirements the system must satisfy.

---

## 1. Architectural Decision Record (ADR-001: System Architecture Style)

**Decision:** The application is a **modular monolith** with a clear split
between a stateless web tier (Next.js App Router + Route Handlers) and a
dedicated background **worker process** for long-running jobs. The monolith is
deployed as two independently scaled container images (web + worker) sharing a
single codebase, database, and queue abstraction.

**Justification:**

- The product is a single-domain application (fashion compatibility analysis)
  with one team; a monolith maximizes developer velocity and keeps the data
  model and transactions simple.
- Route Handlers + Server Actions keep all business logic in one deployable
  unit; no cross-service RPC or event-schema versioning is required today.
- The worker/web split isolates CPU- and time-heavy work (virtual try-on
  inference, trend syncing, backups) from request latency, giving us the
  scaling benefit of a microservice boundary only where it matters.
- Read-heavy queries are already offloadable to a Turso read replica
  (`TURSO_REPLICA_URL` → `dbRead`), giving horizontal read scaling without
  service decomposition.

**Alternatives considered and rejected:**

| Alternative | Reason rejected |
|-------------|-----------------|
| Microservices (per feature) | No operational capacity for N services; increased latency and complexity for a single-domain product; contradicts the team's stated goals in `AGENTS.md` and `ARCHITECTURE.md`. |
| Serverless functions per route | Next.js Route Handlers already provide this deployment model on Vercel; a separate function-per-route split would fragment the DB connection pool and complicate the worker integration. |
| Event-driven (Kafka/PubSub) | No cross-team consumers or replay requirements; Upstash-backed Redis already covers rate-limit and cache needs. Adopt only if a second consumer of analysis events appears. |

**Trade-offs accepted:**

- Web + worker share schema/code → one bad deploy can break both; mitigated by
  the two-image Docker build (`docker/Dockerfile` targets `deps`, `web`,
  `worker`) and separate CI deploy jobs.
- No per-service DB schemas → all writes share one primary; mitigated by the
  read-replica path and connection-pool sizing (`DB_POOL_SIZE`).

> Related: `production-plan/01_architecture_scalability.md` (prior plan,
> superseded in detail by this document where they overlap).

---

## 2. High-Level Component Diagram (text)

```
┌───────────────────────────────  Client  ───────────────────────────────┐
│   Browser (SSR/RSC pages)   |   API consumers / future mobile app      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (+ HSTS, CSP headers)
                                    ▼
┌───────────────────────────────── proxy.ts (Next.js proxy) ────────────────────────┐
│  correlation ID (X-Request-Id) · CORS allow-list · global per-IP rate limit      │
│  auth gate (page + API) · response tagging                                       │
└──────────────┬──────────────────────────────────────────────┬─────────────────────┘
               │ RSC / Server Components                       │ Route Handlers (app/api/*)
               ▼                                               ▼
┌───────────────────────────┐                 ┌──────────────────────────────┐
│   Pages (App Router)      │                 │  withApiRoute() wrapper       │
│   (landing)(auth)(dashboard)(legal)         │  request ctx · metrics ·      │
│   components/ + hooks/    │                 │  error funnel (handleError)   │
└──────────────┬────────────┘                 └──────────────┬───────────────┘
               │                                              │
               │                     ┌────────────────────────▼────────────────┐
               │                     │  lib/ai      vision · fit-pipeline ·     │
               │                     │              tryon · outfit-recommender │
               │                     │  lib/db      queries · filters          │
               │                     │  lib/auth    better-auth · sessions     │
               │                     │  lib/api     response · errors · request│
               │                     │  lib/security ssrf                      │
               │                     │  lib/trend   providers · rank · cache   │
               │                     │  lib/storage cloudinary · s3            │
               │                     └───────┬──────────────────┬──────────────┘
               │                             │                  │
               ▼                             ▼                  ▼
┌──────────────────────────┐   ┌────────────────────┐  ┌───────────────────────┐
│  dbWrite / dbRead        │   │  Upstash Redis     │  │  Cloudinary CDN       │
│  Drizzle ORM over libSQL │   │  rate-limit + cache│  │  image upload/CDN     │
└──────────────────────────┘   └────────────────────┘  └───────────────────────┘
        │  primary / replica
        ▼
┌──────────────────────────┐   ┌────────────────────┐  ┌───────────────────────┐
│  Turso (libSQL) primary  │   │  OpenAI Vision     │  │  RunPod (try-on)      │
│  file:./data/suitora.db  │   │  (mock fallback)   │  │  webhook →            │
│  in development          │   └────────────────────┘  │  /api/tryon/webhook   │
└──────────────────────────┘                           └───────────┬───────────┘
                                                                    │ submits jobs
┌─────────────────────────── Worker process (services/worker) ──────▼──────────┐
│  try-on orchestration · trend sync · backups · retention · health checks     │
│  logs to same pino/OTel pipeline · writes to primary DB                      │
└───────────────────────────────────────────────────────────────────────────────┘
```

Legend: `──>` = request/data flow; `┌┴┐` groups are modular units in the same
deployable (web tier), except the Worker which ships as a separate image.

---

## 3. Data Flow Diagrams (critical paths)

### 3.1 Authentication

```
Login/Register
  → POST /api/auth/* (Better Auth, drizzleAdapter over dbWrite)
  → session row in `sessions` + httpOnly cookie `suitora.session_token`
  → proxy.ts hasSessionCookie() fast-path gates pages/API
  → Server Components / Route Handlers call getSession()/requireUser()
     (React cache() → single DB round trip per request)
  → 401 / redirect /login when invalid
```

### 3.2 Fashion analysis (core journey)

```
Upload (user photo + product image, or product URL)
  → POST /api/uploads  → Cloudinary (upload) → /api/uploads returns URL
  → POST /api/analysis (createAnalysisSchema, SSRF-guarded URL fetch, rate limit)
  → analysis row inserted status=pending, tryOnStatus=pending
  → client polls GET /api/analysis?id=...
     - <1.5s detecting · 1.5–3s analyzing · 3–4.5s try-on · 4.5–6s scoring
     - try-on lifecycle advanced via syncTryOnLifecycle() (lazy submit)
     - ≥6s → analyzeWithVision() (OpenAI Vision or mock)
         → fit-scoring → persist scores + compatibilityMetadata
         → persistAnalysisEstimates() into user_profiles (never overwrites manual)
  → results page /results/[id] renders rich metadata
```

### 3.3 Virtual try-on

```
User triggers try-on on /analysis or /results
  → syncTryOnLifecycle() enqueues job (if RUNPOD configured) or mock provider
  → worker submits to RunPod endpoint
  → RunPod POSTs result → /api/tryon/webhook (RUNPOD_WEBHOOK_SECRET check)
  → tryOnStatus updated (processing → succeeded/failed), generatedImage saved
  → client poll reflects final state
```

### 3.4 Trending items

```
Worker sync job (jobs/trend-sync.ts)
  → providers (curated/shopify/asos/serpapi/affiliate)
  → normalize → rank → upsert trend_items + trend_sync_logs
  → cache in Upstash (TTL) → GET /api/trending reads cache first
```

### 3.5 Database backup / restore

```
jobs/backup.ts → lib/db/dump.ts → S3 (S3_*) → backup_logs row
jobs/restore.ts → pulls dump → applies to target DB
jobs/retention.ts → prunes per BACKUP_RETAIN_DAILY/MONTHLY
```

---

## 4. Technology Stack (exact versions, from package.json)

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| Framework | Next.js (App Router, `proxy.ts`) | 16.2.10 | RSC-first, Route Handlers, standalone output for Docker, `output: "standalone"`. |
| UI runtime | React / React DOM | 19.2.4 | Server/Client component model; streaming. |
| Language | TypeScript | ^5 (strict) | `strict: true`, `noEmit`, path alias `@/*`. |
| Styling | Tailwind CSS | ^4.3.2 (postcss + cli) | Design tokens in `app/globals.css`; dark/light tokens. |
| Database | Drizzle ORM + libSQL (@libsql/client) | 0.45.2 / 0.17.4 | Typed queries, SQLite-compatible, migration tooling. |
| Auth | Better Auth (+ drizzle adapter) | ^1.6.23 | Sessions, email/password, optional Google OAuth, password reset. |
| Rate limit / cache | @upstash/ratelimit + @upstash/redis + ioredis | 2.0.8 / 1.38.0 / 5.11.1 | Distributed sliding window; in-memory fallback for dev. |
| Image storage | Cloudinary | ^2.10.0 | Upload, optimization, CDN. |
| Vision AI | OpenAI (via `lib/ai/providers`) | provider abstraction | Mock fallback when key absent. |
| Try-on | RunPod (provider abstraction) | provider abstraction | Webhook-driven, mock fallback. |
| Forms | React Hook Form + Zod | ^7.81.0 / ^4.4.3 | Client validation + server validation reuse. |
| Client data | SWR | ^2.5.0 | Lightweight revalidation where client fetch needed. |
| Logging | pino | ^10.3.1 | Structured JSON, correlation via requestId/trace_id. |
| Metrics | prom-client + OpenTelemetry | ^15.1.3 / api+autoinstr | `/metrics` endpoint, Grafana dashboard. |
| Animation | Framer Motion | ^12.42.2 | Declarative micro-interactions, reduced-motion aware. |
| Icons | lucide-react | ^1.24.0 | Consistent iconography. |
| Tests | Vitest + Vite, Cypress, SuperTest | 4.1.10 / ^5.4.8 / ^15.20.0 / ^7.2.2 | Unit/integration/E2E + API contract. |
| Docs | swagger-jsdoc + hand-maintained `docs/api/swagger.yaml` | ^6.3.0 | Source of truth for `/api/docs`. |

---

## 5. Integration Points & External Dependencies (contracts)

| Integration | Contract | Auth | Failure mode |
|-------------|----------|------|--------------|
| Turso / libSQL primary | `TURSO_DATABASE_URL` (+ `TURSO_AUTH_TOKEN`), libSQL protocol | token | Retry w/ backoff + timeouts in `lib/db.ts`; local `file:` fallback. |
| Turso read replica | `TURSO_REPLICA_URL` (optional) | token | Falls back to primary (`dbRead = dbWrite`). |
| Upstash Redis | `UPSTASH_REDIS_REST_URL` / `_TOKEN` | token | In-memory fallback in `lib/rate-limit.ts`/`lib/cache.ts`. |
| Cloudinary | Upload API + CDN URLs (res.cloudinary.com) | API key/secret | Upload returns error → client retry; only URLs persisted. |
| OpenAI Vision | `https://api.openai.com` (chat completions w/ image) | `OPENAI_API_KEY` | Provider abstraction → mock analysis fallback. |
| RunPod | Endpoint POST + webhook POST `/api/tryon/webhook` | `RUNPOD_WEBHOOK_SECRET` (shared secret) | Job marked failed w/ `tryOnError`; client shows retry. |
| S3-compatible | PutObject/List/Delete (backups) | `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Backup job logs failure in `backup_logs`; runbook. |
| Email (password reset) | `lib/email.ts` (Resend-compatible fetch) | `RESEND_API_KEY` | Dev logs; production returns error surfaced to user. |

All outbound HTTP from server code is SSRF-guarded via `lib/security/ssrf.ts`
(`assertSafeHttpUrl`), notably product-URL extraction in `/api/analysis`.

---

## 6. Non-Functional Requirements

### 6.1 Scalability strategy

- Stateless web replicas behind LB/CDN; session/rate-limit state externalized
  (DB + Redis) so any replica can serve any request.
- Read replica (`TURSO_REPLICA_URL`) offloads dashboard/favorites/trend reads.
- Worker scales independently of web tier; queue resilient to restarts.
- Image bandwidth offloaded to Cloudinary CDN.
- Blue-green / canary K8s deploys support zero-downtime promotion.

### 6.2 Performance budgets

| Metric | Budget | Enforcement |
|--------|--------|-------------|
| LCP (landing + dashboard) | < 2.5s p75 | Next/Image priority, minimal client JS, streaming |
| API p95 latency | < 200ms (non-AI routes) | prometheus `http_request_duration`; k6 threshold |
| API error rate | < 0.1% | k6 threshold + alerting rules |
| Client JS per page | minimized; RSC default | lint rule no client components in server tree |
| CLS | low (skeletons sized to final layout) | PERF-051 audit |

### 6.3 Availability targets

- Web tier: 99.9% target; zero-downtime deploys via blue-green; health probe
  `/api/health`; `nginx.conf` + LB liveness.
- Data: primary Turso with configured backup cadence; restore runbook.

### 6.4 Disaster recovery

- Daily automated backup (`jobs/backup.ts` → S3), retention pruning
  (`BACKUP_RETAIN_DAILY=30`, `BACKUP_RETAIN_MONTHLY=12`).
- Restore procedure in `runbooks/database-backup.md`; `jobs/restore.ts`.
- Incident runbooks: `runbooks/crash-alert.md`, `runbooks/service-restart.md`.

### 6.5 Observability

- pino structured logs correlated by `X-Request-Id` / `trace_id` (OTel).
- prom-client `/metrics`; Grafana "Suitora Overview"; Alertmanager rules
  covering error rate, latency, provider failure, heap, DB health.

---

## 7. Known Gaps to Close in This Engagement (from Phase 0 audit)

| ID | Gap | Impact | Severity |
|----|-----|--------|----------|
| G-01 | `.github/workflows/cicd.yml` is not a valid workflow (corrupt content) | Staging/prod deploy pipeline broken | **Blocker** |
| G-02 | `npm run lint`/`lint:fix`/`format` target nonexistent `./src/**/*.ts` | CI `lint` step fails; local lint broken | **Blocker** |
| G-03 | `.eslintrc.js` contains prose, not config (dead file) | Confusion; possible misconfiguration risk | Medium |
| G-04 | `.eslintignore` deleted in working tree without a replacement note | Pending decision on ignore ownership | Low |

These gaps drive the implementation roadmap (`07-implementation-roadmap.md`).
All checkbox items in this document reflect analysis complete at planning
time; implementation items live in the roadmap and component breakdown.

---

## Checklist

- [x] Architectural decision record (ADR) documenting chosen architecture style with justification, alternatives considered, and trade-offs
- [x] High-level component diagram described in text (boxes and arrows with labeled relationships)
- [x] Data flow diagrams for critical paths (text-based)
- [x] Technology stack decisions with exact versions and justification
- [x] Integration points and external dependencies catalogued with their contracts
- [x] Non-functional requirements addressed: scalability strategy, performance budgets, availability targets, disaster recovery approach
