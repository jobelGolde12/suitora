import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/drizzle/schema";
import { validateEnv } from "@/lib/env";

// Fail-fast: validates server env (and, in production at runtime, the critical
// infrastructure vars). Runs on first import of this module, i.e. at boot when
// any DB-touching code loads. Skipped during `next build`.
validateEnv();

// ─── Pool & timeout configuration ─────────────────────────────────
// All values are env-driven and validated by `lib/env.ts`. Keep per-replica
// pool sizing conservative so `web_replicas × DB_POOL_SIZE` stays under the
// database's max connections.
const DB_POOL_SIZE = Number(process.env.DB_POOL_SIZE || 10);
const DB_CONNECT_TIMEOUT_MS = Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000);
const DB_STATEMENT_TIMEOUT_MS = Number(
  process.env.DB_STATEMENT_TIMEOUT_MS || 10000
);

const tursoDbUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;
const isRemote = /^https?:\/\//.test(tursoDbUrl || "");

// Matches the network failures that benefit from retrying: connect timeouts,
// generic fetch failures and dropped/reset connections.
const RETRYABLE_ERROR =
  /connect timeout|fetch failed|econnreset|und_err_|network error|timed ?out|socket/i;

const MAX_RETRIES = 3;
// Exponential backoff, capped at 2s.
const backoffDelay = (attempt: number) =>
  Math.min(250 * 2 ** attempt, 2000);

/**
 * Bounded fetch wrapper that adds exponential-backoff retries and an overall
 * timeout for connect + statement work. Only used for remote (http/https)
 * databases; local file: databases rely on the libSQL `timeout` busy option.
 */
function buildFetch(connectTimeoutMs: number, statementTimeoutMs: number) {
  return async function withTimeoutRetry(
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1]
  ): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const deadline = setTimeout(
        () => controller.abort(),
        attempt === 0 ? connectTimeoutMs : statementTimeoutMs
      );
      try {
        return await fetch(input, { ...init, signal: controller.signal });
      } catch (err) {
        clearTimeout(deadline);
        lastError = err;
        if (controller.signal.aborted) {
          // Timeout — do not retry a statement that may still be running.
          throw new Error("Database request timed out", { cause: err });
        }
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message)
            : String(err);
        const shouldRetry =
          attempt < MAX_RETRIES && RETRYABLE_ERROR.test(message);
        if (!shouldRetry) throw err;
        await new Promise((resolve) => setTimeout(resolve, backoffDelay(attempt)));
      }
    }
    throw lastError;
  };
}

// ─── Client factory ───────────────────────────────────────────────
function createDbClient(url: string, authToken: string | undefined) {
  return createClient({
    url,
    authToken,
    // libSQL `concurrency` doubles as our connection pool size.
    concurrency: DB_POOL_SIZE,
    // Busy timeout for local file: databases.
    timeout: DB_STATEMENT_TIMEOUT_MS,
    // Retry + timeout wrapper for remote databases.
    fetch: isRemote
      ? buildFetch(DB_CONNECT_TIMEOUT_MS, DB_STATEMENT_TIMEOUT_MS)
      : undefined,
  });
}

const client = createDbClient(
  tursoDbUrl || "file:./data/suitora.db",
  tursoAuthToken
);

/**
 * Primary database handle — all writes, transactions, migrations, and
 * auth/session reads go through this.
 */
export const dbWrite = drizzle(client, { schema });

/**
 * Read replica handle for read-heavy endpoints (dashboard, favorites, trend
 * catalog). Falls back to the primary when `TURSO_REPLICA_URL` is unset so
 * development and single-node deployments stay correct by default.
 */
const replicaUrl = process.env.TURSO_REPLICA_URL;
export const dbRead = replicaUrl
  ? drizzle(createDbClient(replicaUrl, tursoAuthToken), { schema })
  : dbWrite;

/** Backwards-compatible alias — prefer `dbWrite`/`dbRead` in new code. */
export const db = dbWrite;

export { schema };
