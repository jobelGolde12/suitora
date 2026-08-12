/**
 * One-time schema sync for databases that predate the migration runner.
 *
 * Databases created before `scripts/migrate.mjs` had a `_suitora_migrations`
 * tracking table (e.g. the local dev file, or a remote Turso DB migrated by
 * hand). Running the runner against them re-applies every migration from
 * scratch and fails with "table already exists".
 *
 * This script verifies which migrations are already present in the database by
 * inspecting its schema, records those as `applied` in the tracking table, then
 * hands off to `scripts/migrate.mjs` to apply whatever is genuinely missing.
 *
 * It loads `.env.local` the same way Next.js does (`@next/env`), so it resolves
 * the same TURSO_DATABASE_URL / TURSO_AUTH_TOKEN the app uses at runtime.
 *
 * Usage:
 *   node scripts/fix-migration-tracking.mjs         # mark applied + apply pending
 *   node scripts/fix-migration-tracking.mjs --status # read-only report
 *
 * Safe to re-run: schema markers are idempotent, and migrate.mjs is a no-op
 * once everything is tracked.
 */
import envPkg from "@next/env";
import { createClient } from "@libsql/client";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readdirSync } from "node:fs";

const { loadEnvConfig } = envPkg;
loadEnvConfig(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), true);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "drizzle", "migrations");
const url =
  process.env.TURSO_DATABASE_URL || `file:${path.join(root, "data", "suitora.db")}`;
const MIGRATIONS_TABLE = "_suitora_migrations";

const db = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const tables = (
  await db.execute("SELECT name FROM sqlite_master WHERE type='table'")
).rows.map((r) => r.name);

async function hasTable(t) {
  return tables.includes(t);
}

async function hasCol(table, col) {
  if (!tables.includes(table)) return false;
  const cols = await db.execute(`PRAGMA table_info(${table})`);
  return cols.rows.some((r) => r.name === col);
}

async function hasIndex(name) {
  const r = await db.execute({
    sql: "SELECT count(*) c FROM sqlite_master WHERE type='index' AND name=?",
    args: [name],
  });
  return Number(r.rows[0].c) > 0;
}

const all = (ps) => Promise.all(ps.map((p) => p.then(Boolean)));
const count = (rs) => rs.filter(Boolean).length;

async function migrationPresent(name) {
  switch (name) {
    case "0000_outgoing_warhawk.sql":
      return (
        count(
          await all(
            ["accounts","analyses","audit_logs","favorites","meta","products",
             "sessions","settings","uploads","users","verifications"].map(hasTable)
          )
        ) === 11
      );
    case "0001_flashy_wiccan.sql":
      return hasCol("favorites", "product_id");
    case "2026-07-16-add-missing-tables.sql":
      return (
        count(
          await all(["products","uploads","settings","audit_logs","meta"].map(hasTable))
        ) === 5
      );
    case "2026-07-21-add-user-profiles.sql":
      return hasTable("user_profiles");
    case "2026-07-26-add-trend-items.sql":
      return count(await all(["trend_items","trend_sync_logs"].map(hasTable))) === 2;
    case "2026-07-31-add-performance-indexes.sql":
      return hasIndex("analyses_user_id_idx");
    case "2026-07-31-add-tryon-columns.sql":
      return (
        count(
          await all(
            ["height","weight","compatibility_metadata","try_on_status"].map((c) =>
              hasCol("analyses", c)
            )
          )
        ) === 4
      );
    case "2026-08-04-add-wardrobe-fields.sql":
      return (
        count(
          await all(
            ["in_wardrobe","wardrobe_tags","wardrobe_folder","added_to_wardrobe_at"].map((c) =>
              hasCol("favorites", c)
            )
          )
        ) === 4
      );
    case "2026-08-05-add-stylist-messages.sql":
      return hasTable("stylist_messages");
    case "2026-08-05-add-wardrobe-folders.sql":
      return count(await all(["wardrobe_folders","favorite_outfits"].map(hasTable))) === 2;
    case "2026-08-06-add-backup-logs.sql":
      return hasTable("backup_logs");
    case "2026-08-06-add-soft-deletes.sql":
      return (
        count(
          await all(
            ["favorites","analyses","user_profiles"].map((t) => hasCol(t, "deleted_at"))
          )
        ) === 3
      );
    default:
      return false;
  }
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql") && !f.endsWith(".down.sql"))
  .sort();

console.log(
  "Target:",
  url.startsWith("file:") ? "local dev file" : "TURSO database"
);

if (process.argv.includes("--status")) {
  for (const f of files) {
    const present = await migrationPresent(f);
    console.log(`  ${present ? "present " : "missing "}  ${f}`);
  }
  db.close();
  process.exit(0);
}

await db.execute(`
  CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
    name TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'pending',
    applied_at TEXT,
    rolled_back_at TEXT
  )
`);

const now = new Date().toISOString();
const appliedRows = await db.execute({
  sql: `SELECT name FROM ${MIGRATIONS_TABLE} WHERE status = 'applied'`,
});
const appliedNames = new Set(appliedRows.rows.map((r) => r.name));

const toMark = [];
for (const f of files) {
  if (appliedNames.has(f)) continue;
  if (await migrationPresent(f)) toMark.push(f);
}

if (toMark.length > 0) {
  // Batched single-row inserts: multi-row VALUES with >32 bound params is
  // misaligned by the local libSQL driver, so one statement per migration.
  await db.batch(
    toMark.map((f) => ({
      sql: `
        INSERT INTO ${MIGRATIONS_TABLE} (name, status, applied_at)
        VALUES (?, 'applied', ?)
        ON CONFLICT(name) DO UPDATE SET status = 'applied',
          applied_at = excluded.applied_at, rolled_back_at = NULL
      `,
      args: [f, now],
    })),
    "write"
  );
  for (const f of toMark) {
    console.log(`[fix] ${f}: recorded as applied (already in schema)`);
  }
}

console.log(`[fix] Recorded ${toMark.length} pre-existing migration(s).`);
db.close();
console.log("[fix] Running migration runner for pending migrations...");
execFileSync(process.execPath, ["scripts/migrate.mjs"], {
  cwd: root,
  stdio: "inherit",
});
