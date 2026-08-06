/**
 * Database restore job (Pillar 03, Action Item 6).
 *
 * Downloads the latest (or a chosen) backup from S3 and replays it into the
 * target database. Because the dump recreates tables, the target must be empty
 * unless `force` is passed, in which case all existing tables are dropped
 * first.
 *
 * Usage:
 *   npm run restore -- --latest          # restore newest backup
 *   npm run restore -- --date <ts>       # restore a specific backup by timestamp
 *   npm run restore -- --latest --force  # wipe target then restore
 */

import { createClient } from "@libsql/client";
import { gunzipSync } from "node:zlib";
import { s3Get, s3List, getS3Config } from "@/lib/storage/s3";
import { listTables } from "@/lib/db/dump";

const PREFIX = "db/backups/suitora-";

function openTarget() {
  return createClient({
    url:
      process.env.TURSO_DATABASE_URL ||
      `file:${process.cwd()}/data/suitora.db`,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

export interface RestoreOptions {
  /** Download a specific backup whose key contains this timestamp string. */
  date?: string;
  /** Drop existing tables before restoring. */
  force?: boolean;
}

export interface RestoreResult {
  key: string;
  sqlBytes: number;
  tablesRestored: number;
}

/** Resolve the backup key to download (newest first, or matching `date`). */
export async function pickBackupKey(options: {
  date?: string;
}): Promise<string> {
  const { bucket } = getS3Config();
  const objects = await s3List(PREFIX);
  const keys = objects
    .map((o) => o.key)
    .filter((k) => k.endsWith(".sql.gz"))
    .sort()
    .reverse();

  if (keys.length === 0) {
    throw new Error(`No backups found under s3://${bucket}/${PREFIX}`);
  }

  if (options.date) {
    const match = keys.find((k) => k.includes(options.date as string));
    if (!match) {
      throw new Error(`No backup found containing "${options.date}"`);
    }
    return match;
  }
  return keys[0];
}

export async function runRestore(options: RestoreOptions = {}): Promise<RestoreResult> {
  const key = await pickBackupKey(options);
  const { bucket } = getS3Config();
  console.log(`[restore] Downloading s3://${bucket}/${key}…`);

  const gz = await s3Get(key);
  const sql = gunzipSync(gz).toString("utf8");
  console.log(`[restore] Restore payload: ${(sql.length / 1024).toFixed(1)} KiB SQL`);

  const target = openTarget();

  try {
    const existing = await listTables(target);
    if (existing.length > 0) {
      if (!options.force) {
        throw new Error(
          `Target is not empty (${existing.length} tables). ` +
            "Use --force to drop existing tables and restore anyway."
        );
      }
      console.log(`[restore] Dropping ${existing.length} existing table(s)…`);
      for (const table of existing) {
        await target.execute(`DROP TABLE IF EXISTS ${JSON.stringify(table)}`);
      }
    }

    // The dump is already transactional (BEGIN…COMMIT inside the payload), so
    // it is executed directly — no nested transaction. On error the open
    // transaction is rolled back when the connection closes.
    await target.executeMultiple(sql);

    const tablesAfter = await listTables(target);
    console.log(`[restore] Restore complete from ${key}`);
    return {
      key,
      sqlBytes: sql.length,
      tablesRestored: tablesAfter.length,
    };
  } finally {
    target.close();
  }
}

// Only run when executed directly (`npm run restore` / `tsx jobs/restore.ts`);
// importing this module (e.g. in tests) must not trigger a restore.
if (
  process.argv[1] &&
  import.meta.url === `file://${process.argv[1]}`
) {
  const args = parseArgs(process.argv.slice(2));
  main(args).catch((err) => {
    console.error("[restore] Failed:", err);
    process.exit(1);
  });
}

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--force") args.force = true;
    else if (argv[i] === "--latest") args.latest = true;
    else if (argv[i] === "--date") args.date = argv[++i];
  }
  return args;
}

async function main(args: Record<string, string | boolean>) {
  const result = await runRestore({
    date: typeof args.date === "string" ? args.date : undefined,
    force: args.force === true,
  });
  console.log(
    `[restore] Done. ${result.key}, ${result.tablesRestored} tables restored from ${(result.sqlBytes / 1024).toFixed(1)} KiB SQL`
  );
  process.exit(0);
}
