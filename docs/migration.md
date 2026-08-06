# Database Engine & Migration Strategy

> **Pillar 03 — Suitora Production Readiness**
> Decision record and runbook for the database engine choice, connection
> pooling, migration workflow, read replicas, backup/restore, and data
> retention. Companion to `production-plan/03_database_data_integrity.md`.

## 1. Decision Record (ADR-001)

### Decision

**Stay on Turso (libSQL / SQLite) as the primary database engine.** No migration
to PostgreSQL is planned at this stage.

### Context

The application currently runs on Drizzle ORM with `dialect: "sqlite"` and a
Turso (libSQL) remote database (with a local `file:` fallback in development).
The decision was evaluated against the needs of the product: an early-stage
fashion-fit application with modest write volume, read-heavy analytics pages,
and a small team that already ships on the libSQL driver.

### Considered Options

| Criterion | Turso scale-up (chosen) | PostgreSQL |
|-----------|-------------------------|------------|
| Code change | Minimal — libSQL driver already in use | Full rewrite of schema, migrations, queries |
| Horizontal read scaling | Embedded replicas (`syncUrl`) | Read replicas + PgBouncer |
| Horizontal write scaling | `sqld` scale-out / primary-replica | Multi-node or `citus` |
| Transactional features | SQLite ACID (single-writer) | RLS, `pgvector`, native partial indexes |
| Operational burden | Turso-managed | Self-managed or Neon/Supabase |
| Cost at current scale | Low | Higher for comparable scale |
| Future embeddings | Possible via libSQL extensions / external store | `pgvector` native |

### Consequences

- SQLite is **single-writer**. Writes are serialized by the primary. This is an
  acceptable constraint for the current product: write volume is low, and the
  write path is already rate-limited and transactional.
- Read-heavy endpoints (dashboard, favorites, trend catalog) can be offloaded to
  **embedded replicas** or a replica URL without schema changes.
- If PostgreSQL is ever required (e.g. `pgvector` embeddings, row-level
  security, high write concurrency), the migration path is documented below.

### Rollback Plan

- Keep the `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` env contract unchanged.
- Keep Drizzle as the ORM — the SQL dialect is the only thing that would change.
- Any future engine switch keeps `lib/db.ts` as the single client factory, so
  the swap is contained to one file + migrations.

---

## 2. Connection Pooling & Timeouts

Implemented in `lib/db.ts`.

- **Pool size** — `DB_POOL_SIZE` (default `10`) maps to the libSQL client
  `concurrency` limit. Per web replica, keep pool sizing conservative so
  `--scale web=3` does not exhaust the database:
  `web_replicas × DB_POOL_SIZE ≤ db_max_connections`.
- **Connect timeout** — `DB_CONNECT_TIMEOUT_MS` (default `5000`) aborts slow
  connection attempts via the fetch wrapper.
- **Statement timeout** — `DB_STATEMENT_TIMEOUT_MS` (default `10000`) aborts
  hung statements. For local `file:` databases the libSQL `timeout` option
  provides the SQLite busy timeout instead.
- **Retries** — the existing exponential-backoff wrapper is retained (max 3
  retries, capped at 2s) for transient network errors.

### Read / Write Routing

`lib/db.ts` exposes two handles:

- `dbWrite` — primary (writes, transactions, migrations, auth/session reads).
- `dbRead` — replica when `TURSO_REPLICA_URL` is set, otherwise falls back to
  the primary (safe default in development).

Routing rules:

| Query class | Handle |
|-------------|--------|
| Auth / session / user writes | `dbWrite` |
| All writes, transactions, migrations | `dbWrite` |
| Dashboard stats, favorites lists, trend catalog | `dbRead` |
| Anything requiring immediate consistency | `dbWrite` |

Replica lag is acceptable for non-critical reads; any read that must reflect a
just-committed write uses `dbWrite`.

### Embedded replicas (optional)

For latency-critical reads Turso also supports **embedded replicas**: a local
libSQL copy that stays in sync with the primary via `syncUrl`/`syncInterval`.
The current setup routes reads through `TURSO_REPLICA_URL` (a remote replica),
which needs no extra dependency. If edge-latency requires it later, switch
`dbRead` to a `libsql({ url: "file:./replica.db", syncUrl: <primary>, syncInterval })`
client — `lib/db.ts` is the single place that changes, and the routing matrix
above stays identical.

---

## 3. Migration Workflow

`scripts/migrate.mjs` is the zero-downtime, reversible migration runner.

- Migration SQL files live in `drizzle/migrations/` and are applied in lexical
  order.
- A `_suitora_migrations` tracking table records `(name, status, applied_at,
  rolled_back_at)` so runs are idempotent and observable.
- **Up** applies each pending migration inside a transaction.
- **Down** applies a `<name>.down.sql` file when present and marks the row
  `rolled_back` (SQLite has limited `ALTER TABLE DROP COLUMN` support; down
  scripts must be written deliberately).

### Expand-and-Contract (zero-downtime DDL)

1. **Expand** — ship additive DDL (new nullable columns, tables, indexes) while
   old code still runs.
2. **Migrate** — backfill data in small batches.
3. **Contract** — drop old columns/tables only after new code is deployed.

### Deploy-time verification

- `npm run db:status` prints pending/applied migrations.
- CI (`ci.yml`) runs `npm run db:migrate` + `npm run db:status` against a fresh
  temp database on every PR/push — any failing or missing migration fails the
  build.
- `scripts/__tests__/migrate.test.ts` and `jobs/__tests__/restore.test.ts`
  exercise up/down/idempotency and dump→restore round-trips in the test suite.

---

## 4. Backup & Restore Runbook

### Cadence & Retention

- **Full dump** — daily to S3 at `db/backups/suitora-YYYY-MM-DDTHHmmssZ.sql.gz`.
- **Scheduling** — Vercel cron (`vercel.json`): `POST /api/backup` at 03:15 UTC,
  protected by `CRON_SECRET` + `x-vercel-cron` (also callable by any
  authenticated user for manual runs).
- **Observability** — every run writes a `backup_logs` status row
  (`success | failed`, s3 key, size, message), the `trend_sync_logs` pattern.
- **Retention** — keep the last 30 daily backups and 12 monthly backups; prune
  everything older.
- **RPO** — ≤ 24 h (daily full backup).
- **RTO** — ≤ 1 h (download, restore, verify).

### Restore

1. `npm run restore -- --latest` downloads the newest dump (or `--date <ts>`
   for a specific one).
2. Executes the dump into the target database (override `TURSO_DATABASE_URL`
   for a **test** database). Refuses to run against a non-empty target unless
   `--force` is passed, in which case existing tables are dropped first.
3. Verifies row counts and latest `createdAt` per table; exits non-zero on
   mismatch.

### Incident flow

- Contain: if a leak/incident is storage-side, rotate credentials, revoke
  sessions, block the affected key/provider.
- Restore to the most recent good backup; replay any WAL/transaction stream if
  configured.
- Document the timeline and preventive measures in the incident post-mortem.

---

## 5. Data Retention & Privacy

- **GDPR hard delete** — `deleteUserRecord()` remains a true hard delete for
  erasure requests (`app/api/user/data/route.ts`).
- **Soft delete** — `analyses`, `favorites`, `user_profiles`,
  `stylist_messages`, `wardrobe_folders`, `favorite_outfits` carry a nullable
  `deleted_at`. User-facing queries filter via `lib/db/filters.ts`
  (`notDeleted(t)`).
- **Purge** — soft-deleted rows older than 90 days are physically removed by
  the retention job (`lib/retention.ts`).
- **Audit logs** — retained per policy; never store full tokens or secrets.

---

## 6. Queries & Integrity

- Multi-step writes are wrapped in `db.transaction(...)` (e.g.
  `deleteWardrobeFolder`, `upsertProfile`).
- `upsertTrendItem` uses `ON CONFLICT DO UPDATE` on the
  `(provider, providerId)` unique index instead of a select-then-write.
- ESLint enforces Drizzle write-guard rules (`enforce-update-with-where`,
  `enforce-delete-with-where`) in CI.
- A custom rule (`eslint-rules/no-query-in-loop.mjs`) flags `db`/`dbWrite`/
  `dbRead`/`tx` calls inside loops to prevent N+1 query patterns, `Promise.all`
  over a `.map()` callback issuing per-row DB reads, and unbounded `.select()`
  chains without `.where()`/`.limit()`. The retention job was refactored to
  batched lookups to satisfy it.
- Soft-deleted rows past the 90-day retention window are physically purged by
  `purgeSoftDeletedRows()` in `lib/retention.ts` (analyses, favorites,
  user_profiles, stylist_messages, wardrobe_folders, favorite_outfits),
  scheduled daily via `POST /api/uploads/cleanup` (Vercel cron, `CRON_SECRET`).
- Verification: `tsc --noEmit`, `eslint`, `vitest run`, and `next build` all
  pass; schema drift is checked by the CI migration step and
  `scripts/__tests__/migrate.test.ts`.
