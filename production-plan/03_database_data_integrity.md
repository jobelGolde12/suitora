# Database & Data Integrity Plan

> **Pillar 03 — Suitora Production Readiness**
> This document details the database and data-integrity work needed to take the
> Suitora data layer from a local SQLite/dev setup to a production-grade system
> with scalable concurrency, safe migrations, transactional guarantees, soft
> deletes, backups/restore, and query-quality enforcement. Each strategic action
> item is expanded into a concrete, sectioned work package.

---

## Table of Contents

1. [Scope & Objectives](#1-scope--objectives)
2. [Current Architecture](#2-current-architecture)
3. [Data Model Overview](#3-data-model-overview)
4. [Production Gaps](#4-production-gaps)
5. [Strategic Action Items](#5-strategic-action-items)
6. [Transactional & Consistency Guarantees](#6-transactional--consistency-guarantees)
7. [Backup & Disaster Recovery](#7-backup--disaster-recovery)
8. [Data Retention & Privacy](#8-data-retention--privacy)
9. [Ongoing Data Operations](#9-ongoing-data-operations)
10. [Success Metrics & Definition of Done](#10-success-metrics--definition-of-done)
11. [Sequencing & Dependencies](#11-sequencing--dependencies)

---

## 1. Scope & Objectives

### 1.1 Purpose
Ensure Suitora's persistence layer can handle production traffic with correct,
consistent data, zero-downtime schema evolution, durable backups, and reliable
restore while keeping queries efficient and free of N+1 patterns.

### 1.2 In Scope
- Connection pooling & client configuration
- Database engine selection (PostgreSQL vs. Turso scale-up)
- Migration tooling & zero-downtime rollout
- Read replicas / read-heavy query routing
- Soft deletes & global query filters
- Transactions for multi-step operations
- Automated backups & restore validation
- Migration script unit tests
- Query linting (N+1 detection)

### 1.3 Out of Scope
- Cache layer tuning (see `01_architecture_scalability.md` / `lib/cache.ts`)
- Observability of query performance in prod (see `04_observability_logging.md`)
- Dependency/version pinning (see `09_dependency_management.md`)

### 1.4 Reference Standards
- **Drizzle ORM** docs & migration patterns (current ORM)
- **Turso / libSQL** documentation (embedded replica, `sqld`, HTTP/local)
- **PostgreSQL** best practices (if migration is chosen)
- **12-Factor** config & disposability

---

## 2. Current Architecture

### 2.1 ORM & Engine
- **ORM:** Drizzle ORM (`drizzle-orm@0.45.2`), configured via `drizzle.config.ts`
  with `dialect: "sqlite"`.
- **Engine:** Turso (libSQL) — remote HTTP database, falls back to a local file
  `file:./data/suitora.db` when `TURSO_DATABASE_URL` is unset.
- **Schema:** `drizzle/schema.ts` (SQLite tables).

### 2.2 Client & Connection
- `drizzle/index.ts` builds a libSQL client via `@libsql/client` and passes it to
  `drizzle(client, { schema })`.
- A custom `withRetry` `fetch` wrapper adds bounded exponential backoff
  (max 3 retries, capped at 2s) for transient network errors
  (`connect timeout|fetch failed|econnreset|und_err_|...`).
- **No explicit connection pool size, timeouts, or read/write split.**

### 2.3 Migrations
- Migration files live in `drizzle/migrations/` (Drizzle-kit journal + snapshots).
- Existing migrations: initial tables, user-profiles, trend-items, performance
  indexes, try-on columns, wardrobe fields, stylist messages, wardrobe folders.
- `scripts/fix-schema-migrations.mjs` is an **idempotent** ad-hoc sync script for
  migrations that were historically missing from some databases.
- `package.json` has **no `db:migrate` script** — migrations are applied ad hoc.

### 2.4 Data Access Layer
- `lib/db/queries.ts` centralizes read/write queries (users, analyses, favorites,
  wardrobe, profiles, trend items, stylist).
- `deleteUserRecord()` performs GDPR-style cascade deletion in explicit
  dependency order; `getUserDataExport()` assembles a full user export.
- Multi-step operations (e.g. `deleteAnalysis`, `upsertProfile`,
  `deleteWardrobeFolder`) are **not wrapped in DB transactions**.

### 2.5 Known N+1 / hot-query risks
- `getFavoritesByUserId` / `getWardrobeFavoritesByUserId` join analyses.
- `getDashboardStats` uses correlated subqueries.
- `upsertTrendItem` does a select-then-update/insert (race-prone without a unique
  guard beyond the provider+providerId index).

---

## 3. Data Model Overview

| Table | Purpose | Key columns | Notes |
|-------|---------|-------------|-------|
| `users` | Auth identities | `id`, `email` (unique), `selfImageUrl` | FK target for most tables |
| `sessions` / `accounts` / `verifications` | Better Auth | `userId` (cascade) | Sessions revocable on reset |
| `user_profiles` | Body measurements + AI estimates | `userId` (unique) | Manual vs `estimated_*` split |
| `analyses` | Fit/virtual-tryon results | `userId`, `productId`, scores, try-on state | Read-heavy; `userId`+`createdAt` indexed |
| `favorites` | Saved items + wardrobe state | `userId`, `analysisId`, `inWardrobe`, `wardrobeFolder` | Unique `(userId, analysisId)` |
| `wardrobe_folders` | Named wardrobe organization | `userId` | Cascade |
| `favorite_outfits` | Saved outfit snapshots | `userId` | JSON `outfit` blob |
| `products` | Product metadata | `sourceUrl` unique | Set-null on delete |
| `trend_items` / `trend_sync_logs` | Online trending catalog | provider+providerId unique | Bulk sync writes |
| `stylist_messages` | AI stylist history | `userId` | `userId`+`createdAt` indexed |
| `audit_logs` | Audit trail | `userId`, `action` | Currently sparse |
| `uploads` / `settings` / `meta` | Media, prefs, key/value | `userId` | — |

---

## 4. Production Gaps

| ID | Gap | Severity | Evidence / Risk |
|----|-----|----------|-----------------|
| G1 | SQLite single-writer concurrency limits | **High** | `dialect: "sqlite"` — single-writer, on-disk/HTTP bottlenecks under load |
| G2 | No explicit connection pool / timeouts | **High** | `drizzle/index.ts` has no `poolSize`, `maxRetries`, or timeout tuning |
| G3 | Migration process risks downtime | **High** | No `db:migrate` script; ad-hoc `fix-schema-migrations.mjs`; non-reversible DDL |
| G4 | No read replica for heavy queries | Medium | All queries hit one connection/client |
| G5 | No transactional guarantees for multi-step ops | **High** | `deleteWardrobeFolder`, `upsertProfile`, `deleteAnalysis` are not wrapped |
| G6 | No automated backup/restore | **High** | No `jobs/backup.ts`; no S3 dump; no restore validation |
| G7 | No migration script unit tests in CI | Medium | Scripts are `.mjs` ad-hoc; untested |
| G8 | N+1 / inefficient queries undetected | Medium | No ESLint rule or APM to catch N+1 |
| G9 | `upsertTrendItem` race (select-then-write) | Medium | Existing item may be duplicated under concurrent syncs |
| G10 | No soft-delete pattern | Medium | Hard deletes only; no audit of deleted rows |

---

## 5. Strategic Action Items

Each item is a work package with priority, objective, current status, files to
modify, steps, and acceptance criteria.

---

- [x] ### Action Item 1 — Choose Engine & Define Migration Strategy

**Priority:** P0

**Objective:** Decide between (a) scaling Turso (embedded replicas, `sqld`) or
(b) migrating to PostgreSQL, and document the chosen path in
`docs/migration.md`.

**Current status:** Drizzle + Turso SQLite; `drizzle.config.ts` uses
`dialect: "sqlite"`.

**Files to modify**
- `docs/migration.md` (create) — decision record & step-by-step plan
- `drizzle.config.ts` — dialect/credentials when switching
- `drizzle/index.ts` — client/connection for the chosen engine

**Steps**
1. Document the trade-off matrix:
   - **Turso scale-up:** embedded replicas for low-latency reads, `sqld` for
     horizontal write scaling, minimal code change (libSQL driver already in use).
   - **PostgreSQL:** rich transactional features (row-level security, native
     `deleted_at` filters, `pgvector` for future embeddings), mature pooling
     (PgBouncer), but requires a rewrite of migrations/queries.
2. Decide based on: peak QPS target, write concurrency, cost, and feature needs.
3. If PostgreSQL: convert `drizzle/schema.ts` to `pg-core`, regenerate migrations,
   and update `drizzle/index.ts` to use `drizzle-orm/node-postgres` + a pool.
4. If Turso: enable embedded replicas, configure `syncedUrl`/`syncInterval`, and
   document the write-primary architecture.
5. Write `docs/migration.md` capturing the decision, rollback plan, and runbook.

**Acceptance criteria**
- `docs/migration.md` exists with a clear decision and step-by-step plan.
- Schema/client/config reflect the chosen engine with no dead code.
- Migration path is reversible (documented rollback).

---

- [x] ### Action Item 2 — Configure Connection Pooling & Timeouts

**Priority:** P0

**Objective:** Tune the DB client with an explicit pool size, connect/statement
timeouts, and bounded retries.

**Current status:** `drizzle/index.ts` has a `withRetry` fetch wrapper but no
pool size or timeout options.

**Files to modify**
- `lib/db.ts` (create) — pooled connection factory
- `drizzle/index.ts` — use the pooled client
- `lib/env.ts` — add pool-related env vars

**Steps**
1. Create `lib/db.ts` exporting a configured pool:
   - `poolSize` from env (default based on instance CPU, e.g. 10 per web replica).
   - connection `connectTimeout` and statement `timeout` (e.g. 5s / 10s).
   - keep the existing `withRetry` exponential-backoff wrapper.
2. Replace the single-client construction in `drizzle/index.ts` with the pooled
   client so all imports (`@/db` / `@/drizzle`) resolve to the same pool.
3. For PostgreSQL: use `node-postgres` `Pool` with `max`, `connectionTimeoutMillis`,
   `idleTimeoutMillis`, and `statement_timeout`.
4. For Turso: use `@libsql/client` with `preferredLocality`, embedded replica
   sync settings, and `authToken`.
5. Add env vars to `lib/env.ts`: `DB_POOL_SIZE`, `DB_CONNECT_TIMEOUT_MS`,
   `DB_STATEMENT_TIMEOUT_MS`.
6. Document per-replica pool sizing so `--scale web=3` doesn't exhaust the DB.

**Acceptance criteria**
- All DB access flows through one configured pool.
- Pool size and timeouts are env-driven and validated by `lib/env.ts`.
- Under load, no `connection limit exceeded` errors; queries time out cleanly.

---

- [x] ### Action Item 3 — Zero-Downtime, Reversible Migrations

**Priority:** P0

**Objective:** Replace ad-hoc migration application with a repeatable,
zero-downtime, reversible migration runner.

**Current status:** Migrations exist in `drizzle/migrations/`; no
`db:migrate` script; `scripts/fix-schema-migrations.mjs` is a one-off.

**Files to modify**
- `scripts/migrate.mjs` (create) — zero-downtime runner
- `package.json` — add `db:migrate`, `db:generate`, `db:rollback` scripts
- `drizzle/migrations/**` — ensure each migration has an `up`/`down`

**Steps**
1. Add a `db:migrate` npm script that invokes `drizzle-kit migrate` (or the new
   runner) against `TURSO_DATABASE_URL`.
2. Create `scripts/migrate.mjs` implementing **expand-and-contract** (for
   PostgreSQL) or **batch + verify** (for SQLite/Turso):
   - **Expand:** apply additive DDL (new nullable columns, new tables, indexes)
     while old code still runs.
   - **Migrate:** backfill data in small batches.
   - **Contract:** drop old columns/tables only after the new code is deployed.
3. Ensure every migration is **reversible** with a `down` script; document that
   Turso/SQLite has limited `ALTER TABLE DROP COLUMN` support (SQLite ≥3.35).
4. Add a `migrations` tracking table (or rely on drizzle journal) with a
   `status` column (`pending|applied|rolled_back`) for observability.
5. Add a pre-deploy check that verifies schema version matches the deployed code.
6. Update `scripts/fix-schema-migrations.mjs` to be deprecated in favor of the
   runner, or fold its idempotency logic into `migrate.mjs`.

**Acceptance criteria**
- Migrations run with under 5s downtime in staging.
- Every migration is reversible and tested via `down`.
- Schema version is tracked and verifiable at deploy time.

---

- [x] ### Action Item 4 — Read Replicas & Query Routing

**Priority:** P1

**Objective:** Offload read-heavy endpoints to replicas to hit the 10k QPS target.

**Current status:** All queries use one client; no read/write split.

**Files to modify**
- `lib/db.ts` — add `dbRead` (replica) vs `dbWrite` (primary)
- `lib/db/queries.ts` — route read/write accordingly
- `app/api/**/route.ts` — use read client for GET endpoints

**Steps**
1. In `lib/db.ts`, expose two handles:
   - `dbWrite` — primary (writes, transactions, migrations).
   - `dbRead` — replica(s) (SELECTs, dashboard, lists, trend catalog).
2. Tag queries in `lib/db/queries.ts` as read or write; read paths use `dbRead`.
3. For Turso: use **embedded replicas** (`syncedUrl`) for low-latency local reads
   with the primary as the write origin.
4. For PostgreSQL: configure a read replica connection string and route via
   `@neondatabase/serverless` or an HAProxy/PgBouncer read/write split.
5. Keep correctness rules: replica lag is acceptable for non-critical reads;
   anything requiring immediate consistency (auth session, payment) must use
   `dbWrite`.
6. Document the routing matrix in `docs/migration.md`.

**Acceptance criteria**
- Read-heavy endpoints (dashboard, favorites, trend list) use replicas.
- Write endpoints and auth/session reads use the primary.
- Replica lag is monitored and stays within SLA.

---

- [x] ### Action Item 5 — Soft Deletes via `deletedAt` & Global Filters

**Priority:** P1

**Objective:** Retain deleted rows for audit/recovery using a `deletedAt` column
and transparent global query filters.

**Current status:** Hard deletes only (`deleteAnalysis`, `deleteUserRecord`,
`removeFavorite`).

**Files to modify**
- `drizzle/schema.ts` — add `deletedAt` to soft-deletable tables
- `drizzle/migrations/**` — additive migration
- `lib/db/queries.ts` — add a `notDeleted(alias)` filter helper
- `lib/db/filters.ts` (create) — reusable global filter

**Steps**
1. Add a nullable `deletedAt TEXT` column to soft-deletable tables: `analyses`,
   `favorites`, `user_profiles`, `stylist_messages`, `wardrobe_folders`,
   `favorite_outfits`.
2. Create `lib/db/filters.ts` exporting `notDeleted(t)` that appends
   `sql`${t.deletedAt} IS NULL`` to every filtered query.
3. Apply the global filter in `lib/db/queries.ts` on all list/get paths so
   deleted rows never surface.
4. Change destructive actions to set `deletedAt = now` **instead of** DELETE
   (logical delete), preserving cascade relationships.
5. Add a periodic cleanup job (see Action Item 6) that physically purges rows
   past a retention window (e.g. 90 days).
6. Keep `deleteUserRecord` (GDPR) as a true hard delete for compliance erasure.

**Acceptance criteria**
- Deleted rows are filtered from all user-facing queries.
- Soft-deleted rows are recoverable until purged.
- GDPR hard-delete path remains intact.

---

- [x] ### Action Item 6 — Automated Backup & Restore

**Priority:** P0

**Objective:** Back up the database daily to S3 and validate restores in a test
environment.

**Current status:** No backup job or restore procedure documented.

**Files to modify**
- `jobs/backup.ts` (create) — daily dump to S3
- `package.json` — add `backup` script
- `vercel.json` / cron scheduling — schedule the job
- `docs/migration.md` — restore runbook

**Steps**
1. Create `jobs/backup.ts` that:
   - Connects to `TURSO_DATABASE_URL` (or the primary).
   - Dumps the DB: `sqlite3`/libSQL `.backup` or `drizzle-kit` export to a SQL
     file, or a binary snapshot for Turso.
   - Uploads the dump to S3 (or compatible) with a date-stamped key
     `db/backups/suitora-YYYY-MM-DDTHHmmssZ.sql(.gz)`.
   - Retains N backups (e.g. 30 daily, 12 monthly) and prunes old objects.
   - Writes a `trend_sync_logs`-style status row or a log entry.
2. Schedule via `vercel.json` crons (add a `/api/backup` internal route) or a
   k8s `CronJob` (see `k8s/`).
3. Add a **restore job** `jobs/restore.ts` that restores the latest (or a
   specified) backup into a **test** database and exits non-zero on failure.
4. Add a CI/staging step that runs restore + verify (row counts, latest
   timestamps) to prove backup integrity.
5. Document the runbook in `docs/migration.md`: backup cadence, retention,
   restore order, and RPO/RTO targets.

**Acceptance criteria**
- Daily backup exists in S3 with retention/pruning.
- Restore succeeds in a test environment (validated in CI/staging).
- Documented RPO ≤ 24h and RTO ≤ 1h.

---

- [x] ### Action Item 7 — Unit Tests for Migration Scripts

**Priority:** P1

**Objective:** Ensure migration scripts are correct and safe to run in CI.

**Current status:** Migrations are applied ad hoc; scripts are untested.

**Files to modify**
- `scripts/__tests__/migrate.test.ts` (create)
- `jobs/backup.test.ts` (create)
- `package.json` — wire into `test` / CI

**Steps**
1. Add Vitest tests that:
   - Run `migrate.mjs` against an in-memory/temp SQLite DB and assert the schema
     matches `drizzle/schema.ts` (via `drizzle-kit` snapshot diff).
   - Test reversibility: apply `up`, assert a column exists; run `down`, assert
     it is removed.
   - Test idempotency: running the migration twice is a no-op.
   - Test `backup.ts` output format and retention/pruning logic with a mocked S3.
   - Test soft-delete filters return only non-deleted rows.
2. Wire these into `package.json` `test` and the CI pipeline
   (see `06_cicd_deployment.md`).
3. Add a pre-deploy CI step that runs migrations against a fresh DB and verifies
   schema parity.

**Acceptance criteria**
- Migration up/down/idempotency tests pass in CI.
- Backup/restore logic is covered by unit/contract tests.
- CI fails on any schema drift between migrations and `drizzle/schema.ts`.

---

- [x] ### Action Item 8 — Query Linting & N+1 Detection

**Priority:** P2

**Objective:** Detect and prevent N+1 queries and inefficient data access.

**Current status:** Manual query code; no linting or APM enforcement.

**Files to modify**
- `eslint.config.mjs` — add N+1/Drizzle rules
- `lib/db/queries.ts` — refactor flagged hot spots

**Steps**
1. Add `eslint-plugin-drizzle` (or `eslint-plugin-query`) rules to
   `eslint.config.mjs` to flag:
   - `await db.select(...)` inside loops (synchronous N+1).
   - `Promise.all` around per-row DB calls.
   - Missing `.limit()` on unbounded selects.
2. Add a `drizzle/enforce-update-with-where` rule to prevent full-table updates.
3. Refactor known hot spots:
   - Batch `getFavoritesByUserId`/`getWardrobeFavoritesByUserId` with a single
     join (already joined) instead of per-item queries.
   - Replace correlated subqueries in `getDashboardStats` with a single grouped
     query.
   - Use `onConflictDoUpdate` in `upsertTrendItem` to remove the
     select-then-write race.
4. Combine with APM (see `04_observability_logging.md`) to catch runtime N+1 not
   visible statically.

**Acceptance criteria**
- ESLint enforces N+1 and unbounded-query rules in CI.
- Hot paths are refactored to single-query joins.
- N+1 queries reduced by 90% per APM logs.

---

## 6. Transactional & Consistency Guarantees

### 6.1 Multi-Step Operations to Wrap in Transactions
| Operation | Files | Correctness concern |
|-----------|-------|---------------------|
| `deleteWardrobeFolder` | `lib/db/queries.ts` | Clear `favorites.wardrobeFolder` then delete folder — must be atomic |
| `upsertProfile` | `lib/db/queries.ts` | Create-if-missing then update — wrap in `db.transaction` |
| `deleteAnalysis` + Cloudinary cleanup | API route + `lib/db/queries.ts` | DB delete + storage delete (best-effort storage, DB atomic) |
| `persistAnalysisEstimates` history writes | `lib/db/queries.ts` | Multiple column updates — atomic |
| `upsertTrendItem` | `lib/db/queries.ts` | select-then-insert race — use `ON CONFLICT DO UPDATE` |

### 6.2 Transaction Guidelines
- Use `db.transaction(async (tx) => { ... })` for any multi-statement invariant.
- For Turso/SQLite, keep transactions small and avoid holding them across
  network calls to providers (Cloudinary, OpenAI) — those must be best-effort
  **outside** the DB transaction.
- Sweep for any write path that reads-then-writes without a unique constraint
  guard; add unique indexes or `ON CONFLICT` clauses.

---

## 7. Backup & Disaster Recovery

### 7.1 RPO / RTO Targets
- **RPO:** ≤ 24 hours (daily full backup) — tighten to 1h with continuous WAL
  shipping if feasible on Turso/Postgres.
- **RTO:** ≤ 1 hour (download, restore, verify).

### 7.2 Backup Types
| Type | Frequency | Storage | Purpose |
|------|-----------|---------|---------|
| Full dump (SQL/binary) | Daily | S3 (encrypted) | Point-in-time recovery |
| WAL/streaming (optional) | Continuous | S3 | Reduce RPO |
| Schema snapshot | On each migration | Git | Version-parity verification |

### 7.3 Restore Validation
- Automate restore into a staging/test DB in CI.
- Verify row counts, latest `createdAt`, and a sample of joined rows.

---

## 8. Data Retention & Privacy

- **GDPR hard delete:** `deleteUserRecord()` remains a true hard delete (required
  for erasure requests) — see `app/api/user/data/route.ts`.
- **Soft-delete purge:** physically purge rows past a retention window (e.g.
  90 days) via a scheduled cleanup job.
- **Audit logs:** retain `audit_logs` per policy; never store full tokens or
  secrets in DB columns.

---

## 9. Ongoing Data Operations

| Activity | Cadence | Owner |
|----------|---------|-------|
| Backup to S3 | Daily | Backend/DevOps |
| Restore validation | Per release / weekly | DevOps |
| Migration up/down tests | On every PR | Backend |
| Soft-delete purge job | Daily | Backend |
| Query linting (ESLint) | On every PR | Backend |
| APM review of slow queries | Weekly | Backend/Platform |
| Backup retention review | Monthly | DevOps |

---

## 10. Success Metrics & Definition of Done

| Metric | Target | Status now |
|--------|--------|-----------|
| Database handles concurrent load (10k QPS) | < 100 ms latency | Not met (SQLite single-writer) |
| Migration downtime in staging | < 5 s | Not measured (ad-hoc) |
| Daily backup restore in test env | Succeeds | No backup job |
| N+1 queries reduced per APM | 90% reduction | Not instrumented |
| All multi-step writes transactional | Atomic | Partial |
| Soft deletes applied to listed tables | Global filter | Not implemented |
| Migrations reversible & tested | 100% | Partial |

**Definition of Done:** Engine decision documented, pooled client live, all
multi-step operations transactional, soft deletes + global filters applied,
daily encrypted backups restored and verified in test, migration runner
zero-downtime and tested, and N+1 linting/APM enforcement active.

---

## 11. Sequencing & Dependencies

| Phase | Items | Rationale |
|-------|-------|-----------|
| **Phase 0** | A1 (engine decision), A2 (pooling), A6 (backup) | Correct engine + durable data before scale |
| **Phase 1** | A3 (zero-downtime migrations), A7 (migration tests), A5 (soft deletes) | Safe schema evolution + data retention |
| **Phase 2** | A4 (read replicas), A8 (query linting) | Scale reads + query quality |
| **Continuous** | §9 operations, §6 transaction sweep | Ongoing integrity assurance |

**Blocking dependencies**
- A2 (pooling) depends on A1 (engine choice).
- A4 (read replicas) depends on A1 + A2.
- A6 (backup) and A3 (migrations) depend on infra from
  `01_architecture_scalability.md` (containers, k8s) and CI from
  `06_cicd_deployment.md`.