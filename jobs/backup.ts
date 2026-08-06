/**
 * Daily database backup job (Pillar 03, Action Item 6).
 *
 * Dumps the database to SQL, gzips it, uploads to S3-compatible storage at
 * `db/backups/suitora-<ISO timestamp>.sql.gz`, prunes old dumps keeping
 * `BACKUP_RETAIN_DAILY` (default 30) plus the newest dump of each of the last
 * `BACKUP_RETAIN_MONTHLY` (default 12) calendar months, then records a
 * `backup_logs` status row (trend_sync_logs-style) so runs are observable.
 *
 * Run via: npm run backup   (or tsx jobs/backup.ts)
 * Invoked by: POST /api/backup (Vercel cron, CRON_SECRET-protected).
 */

import { createClient } from "@libsql/client";
import { gzipSync } from "node:zlib";
import { dumpDatabaseSql } from "@/lib/db/dump";
import { s3Put, s3List, s3Delete } from "@/lib/storage/s3";
import { nanoid } from "@/lib/utils/id";
const PREFIX = "db/backups/suitora-";

const RETAIN_DAILY = Number(process.env.BACKUP_RETAIN_DAILY || 30);
const RETAIN_MONTHLY = Number(process.env.BACKUP_RETAIN_MONTHLY || 12);

export interface BackupResult {
  key: string;
  bytes: number;
  pruned: number;
  durationMs: number;
}

function openDb() {
  return createClient({
    url:
      process.env.TURSO_DATABASE_URL ||
      `file:${process.cwd()}/data/suitora.db`,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

/** Best-effort status row; never throws so a logging failure can't mask success. */
async function recordStatus(
  db: ReturnType<typeof createClient>,
  status: "success" | "failed",
  fields: { key?: string; sizeBytes?: number; message?: string } = {}
) {
  try {
    await db.execute({
      sql: "INSERT INTO backup_logs (id, status, key, size_bytes, message) VALUES (?, ?, ?, ?, ?)",
      args: [
        nanoid(),
        status,
        fields.key ?? null,
        fields.sizeBytes ?? null,
        fields.message ?? null,
      ],
    });
  } catch {
    // best-effort only
  }
}

export async function runBackup(): Promise<BackupResult> {
  const started = Date.now();
  const db = openDb();

  try {
    const sql = await dumpDatabaseSql(db);
    const gz = gzipSync(sql, { level: 9 });

    const key = `${PREFIX}${new Date().toISOString().replace(/[:.]/g, "-")}.sql.gz`;
    await s3Put(key, gz);

    const pruned = await pruneBackups();

    const result: BackupResult = {
      key,
      bytes: gz.length,
      pruned,
      durationMs: Date.now() - started,
    };
    await recordStatus(db, "success", {
      key,
      sizeBytes: gz.length,
      message: `dumped ${sql.length} bytes raw; pruned ${pruned} old backup(s)`,
    });
    return result;
  } catch (err) {
    await recordStatus(db, "failed", {
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  } finally {
    db.close();
  }
}

/**
 * Keep the newest RETAIN_DAILY dumps and the newest dump of each of the last
 * RETAIN_MONTHLY calendar months; delete everything else.
 */
export async function pruneBackups(): Promise<number> {
  const objects = await s3List(PREFIX);
  const keys = objects
    .map((o) => o.key)
    .filter((k) => k.endsWith(".sql.gz"))
    .sort()
    .reverse();

  if (keys.length === 0) return 0;

  const kept = new Set<string>();

  // Monthly anchors: newest dump per YYYY-MM, most recent RETAIN_MONTHLY months.
  const months = new Map<string, string>();
  for (const key of keys) {
    const match = key.match(/suitora-(\d{4}-\d{2})-/);
    if (match) {
      const month = match[1];
      if (!months.has(month)) months.set(month, key);
    }
  }
  const monthKeys = [...months.values()].slice(0, RETAIN_MONTHLY);
  for (const key of monthKeys) kept.add(key);

  // Daily: newest RETAIN_DAILY dumps overall.
  for (const key of keys.slice(0, RETAIN_DAILY)) kept.add(key);

  const toDelete = keys.filter((k) => !kept.has(k));
  for (const key of toDelete) {
    console.log(`[backup] Deleting ${key}`);
    await s3Delete(key);
  }
  return toDelete.length;
}

// Only run when executed directly (`npm run backup` / `tsx jobs/backup.ts`);
// importing this module (e.g. from tests or the /api/backup route) must not
// trigger a backup.
if (
  process.argv[1] &&
  import.meta.url === `file://${process.argv[1]}`
) {
  main().catch((err) => {
    console.error("[backup] Failed:", err);
    process.exit(1);
  });
}

async function main() {
  console.log("[backup] Starting…");
  const result = await runBackup();
  console.log(
    `[backup] Done. ${result.key} (${(result.bytes / 1024).toFixed(1)} KiB), pruned ${result.pruned}, took ${result.durationMs}ms`
  );
  process.exit(0);
}

export { main as runBackupCli };
