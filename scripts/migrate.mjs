/**
 * Zero-downtime, reversible migration runner (Pillar 03, Action Item 3).
 *
 * Applies every `*.sql` file in `drizzle/migrations/` (excluding `meta/` and
 * `*.down.sql`) in lexical order, tracking each run in a `_suitora_migrations`
 * table so re-running is a safe no-op. Down migrations are applied from a
 * sibling `<name>.down.sql` file when one exists.
 *
 * Usage:
 *   node scripts/migrate.mjs                # apply pending migrations (up)
 *   node scripts/migrate.mjs --status       # list pending/applied migrations
 *   node scripts/migrate.mjs --down <name>  # roll back one migration
 */
import { createClient } from "@libsql/client";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readdirSync, readFileSync } from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "drizzle", "migrations");
const url =
  process.env.TURSO_DATABASE_URL ||
  `file:${path.join(root, "data", "suitora.db")}`;

const db = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const MIGRATIONS_TABLE = "_suitora_migrations";

async function ensureTrackingTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      name TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'pending',  -- pending | applied | rolled_back
      applied_at TEXT,
      rolled_back_at TEXT
    )
  `);
}

function listMigrations() {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql") && !f.endsWith(".down.sql"))
    .sort();
  return files;
}

async function getStatus(name) {
  const rs = await db.execute({
    sql: `SELECT status FROM ${MIGRATIONS_TABLE} WHERE name = ?`,
    args: [name],
  });
  return rs.rows[0]?.[0];
}

async function mark(name, status) {
  const now = new Date().toISOString();
  if (status === "applied") {
    await db.execute({
      sql: `
        INSERT INTO ${MIGRATIONS_TABLE} (name, status, applied_at)
        VALUES (?, 'applied', ?)
        ON CONFLICT(name) DO UPDATE SET status = 'applied', applied_at = ?,
          rolled_back_at = NULL
      `,
      args: [name, now, now],
    });
  } else {
    await db.execute({
      sql: `
        UPDATE ${MIGRATIONS_TABLE} SET status = 'rolled_back', rolled_back_at = ?
        WHERE name = ?
      `,
      args: [now, name],
    });
  }
}

async function runSql(statements) {
  const tx = await db.transaction("write");
  try {
    await tx.executeMultiple(statements);
    await tx.commit();
  } finally {
    tx.close();
  }
}

async function applyUp(name) {
  const existing = await getStatus(name);
  if (existing === "applied") return { name, skipped: true };
  const file = path.join(migrationsDir, name);
  const sql = readFileSync(file, "utf8");
  await runSql(sql);
  await mark(name, "applied");
  return { name, skipped: false };
}

async function applyDown(name) {
  const status = await getStatus(name);
  if (!status || status === "pending") {
    console.log(`[migrate] ${name}: not applied — nothing to roll back`);
    return;
  }
  const downFile = path.join(migrationsDir, name.replace(/\.sql$/, ".down.sql"));
  let sql;
  try {
    sql = readFileSync(downFile, "utf8");
  } catch {
    throw new Error(
      `[migrate] No ${name.replace(/\.sql$/, ".down.sql")} found. ` +
        "Reversible migrations require an explicit down script."
    );
  }
  await runSql(sql);
  await mark(name, "rolled_back");
  console.log(`[migrate] ${name}: rolled back`);
}

async function status() {
  await ensureTrackingTable();
  const applied = new Map();
  const rs = await db.execute(`SELECT name, status FROM ${MIGRATIONS_TABLE}`);
  for (const row of rs.rows) {
    applied.set(row.name, row.status);
  }
  const files = listMigrations();
  for (const file of files) {
    const s = applied.get(file) ?? "pending";
    console.log(`  ${s === "pending" ? "pending " : s}  ${file}`);
  }
}

const [, , ...args] = process.argv;
const downIndex = args.indexOf("--down");
const showStatus = args.includes("--status");

if (showStatus) {
  await status();
  process.exit(0);
}

if (downIndex !== -1) {
  const name = args[downIndex + 1];
  if (!name) {
    console.error("Usage: node scripts/migrate.mjs --down <migration.sql>");
    process.exit(1);
  }
  await ensureTrackingTable();
  await applyDown(name.endsWith(".sql") ? name : `${name}.sql`);
  process.exit(0);
}

await ensureTrackingTable();
console.log(`Target: ${url.startsWith("file:") ? "local dev file" : "TURSO database"}`);
const files = listMigrations();
let applied = 0;
for (const file of files) {
  const result = await applyUp(file);
  if (result.skipped) continue;
  console.log(`[migrate] ${file}: applied`);
  applied++;
}
if (applied === 0) {
  console.log("[migrate] No pending migrations.");
} else {
  console.log(`[migrate] Applied ${applied} migration(s).`);
}
