/**
 * Apply the virtual try-on columns migration to the local SQLite dev DB.
 * Idempotent — safe to re-run.
 *
 * Usage: node scripts/migrate-tryon.mjs
 */
import { createClient } from "@libsql/client";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || `file:${path.join(root, "data", "suitora.db")}`,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const columns = [
  ["try_on_status", "TEXT NOT NULL DEFAULT 'skipped'"],
  ["try_on_category", "TEXT"],
  ["try_on_job_id", "TEXT"],
  ["try_on_provider", "TEXT"],
  ["try_on_error", "TEXT"],
  ["try_on_latency_ms", "INTEGER"],
  ["try_on_started_at", "TEXT"],
];

try {
  const { rows } = await db.execute("PRAGMA table_info(analyses)");
  const existing = new Set(rows.map((r) => r.name));

  for (const [name, def] of columns) {
    if (existing.has(name)) {
      console.log(`skip ${name} (exists)`);
      continue;
    }
    await db.execute(`ALTER TABLE analyses ADD COLUMN ${name} ${def}`);
    console.log(`added ${name}`);
  }
  console.log("try-on migration complete");
} finally {
  db.close();
}
