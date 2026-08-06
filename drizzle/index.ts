import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { validateEnv } from "@/lib/env";

// Fail-fast: validates server env (and, in production at runtime, the critical
// infrastructure vars). Runs on first import of this module, i.e. at boot when
// any DB-touching code loads. Skipped during `next build`.
validateEnv();

const tursoDbUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

// Retry transient network failures (e.g. connect timeouts) when talking to a
// remote Turso database. @libsql/client does not retry on HTTP(S) URLs and its
// connect timeout is fixed (~10s), so a single transient blip currently turns
// every auth/session query into a 500. This bounded, backoff retry only kicks
// in for thrown network errors — real HTTP error responses pass through.
const MAX_RETRIES = 3;
// Matches the network failures that benefit from retrying: connect timeouts,
// generic fetch failures and dropped/reset connections.
const RETRYABLE_ERROR = /connect timeout|fetch failed|econnreset|und_err_|network error|timed ?out|socket/i;

function withRetry(fetchImpl: typeof fetch): typeof fetch {
  return async (input, init) => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fetchImpl(input, init);
      } catch (err) {
        lastError = err;
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message)
            : String(err);
        // Last attempt: throw regardless.
        const shouldRetry = attempt < MAX_RETRIES && RETRYABLE_ERROR.test(message);
        if (!shouldRetry) throw err;
        // Exponential backoff, capped at 2s.
        const delay = Math.min(250 * 2 ** attempt, 2000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  };
}

// Configure Turso client
const client = createClient({
  url: tursoDbUrl || "file:./data/suitora.db",
  authToken: tursoAuthToken,
  // Only meaningful for remote (http/https) databases; ignored for file URLs.
  fetch: withRetry(fetch),
});

export const db = drizzle(client, { schema });

export { schema };
