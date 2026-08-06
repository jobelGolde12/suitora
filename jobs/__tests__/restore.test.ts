import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { createClient } from "@libsql/client";
import { dumpDatabaseSql } from "@/lib/db/dump";

vi.mock("@/lib/storage/s3", () => ({
  s3Put: vi.fn(),
  s3Get: vi.fn(),
  s3List: vi.fn(),
  s3Delete: vi.fn(),
  getS3Config: vi.fn(() => ({
    endpoint: "https://example.invalid",
    region: "us-east-1",
    bucket: "backups",
    accessKeyId: "ak",
    secretAccessKey: "sk",
  })),
}));

import { s3List, s3Get } from "@/lib/storage/s3";
import { runRestore, pickBackupKey } from "@/jobs/restore";

const mockedS3List = vi.mocked(s3List);
const mockedS3Get = vi.mocked(s3Get);

const KEY = "db/backups/suitora-2026-08-06T000000000Z.sql.gz";

async function makeSourceDb(dir: string) {
  const client = createClient({ url: `file:${join(dir, "source.db")}` });
  await client.executeMultiple(`
    CREATE TABLE users (id text PRIMARY KEY, email text NOT NULL);
    CREATE TABLE trend_items (
      id text PRIMARY KEY,
      title text NOT NULL,
      style_tags text,
      created_at text DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO users (id, email) VALUES ('u1', 'a@example.com'), ('u2', 'b@example.com');
    INSERT INTO trend_items (id, title, style_tags) VALUES ('t1', 'Linen shirt', '["casual","summer"]');
    INSERT INTO trend_items (id, title, style_tags) VALUES ('t2', 'Wool coat', NULL);
    CREATE INDEX trend_items_title_idx ON trend_items (title);
  `);
  return client;
}

describe("restore contract", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "suitora-restore-"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(dir, { recursive: true, force: true });
  });

  it("round-trips a dump into an empty target (rows, JSON, indexes intact)", async () => {
    const source = await makeSourceDb(dir);
    const sql = await dumpDatabaseSql(source);
    source.close();

    mockedS3List.mockResolvedValue([{ key: KEY, lastModified: null }]);
    mockedS3Get.mockResolvedValue(gzipSync(sql));

    vi.stubEnv("TURSO_DATABASE_URL", `file:${join(dir, "target.db")}`);
    const result = await runRestore();

    expect(result.key).toBe(KEY);

    const target = createClient({ url: `file:${join(dir, "target.db")}` });
    const tables = await target.execute(
      "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
    );
    const tableNames = tables.rows.map((r) => r.name).sort();
    expect(tableNames).toEqual(["trend_items", "users"]);

    const users = await target.execute("SELECT COUNT(*) AS n FROM users");
    expect(Number(users.rows[0].n)).toBe(2);

    const tags = await target.execute(
      "SELECT style_tags FROM trend_items WHERE id = 't1'"
    );
    expect(tags.rows[0].style_tags).toBe('["casual","summer"]');
    const nullTags = await target.execute(
      "SELECT style_tags FROM trend_items WHERE id = 't2'"
    );
    expect(nullTags.rows[0].style_tags).toBeNull();

    const idx = await target.execute(
      "SELECT name FROM sqlite_schema WHERE type = 'index' AND name = 'trend_items_title_idx'"
    );
    expect(idx.rows).toHaveLength(1);
    target.close();
  });

  it("refuses a non-empty target without --force", async () => {
    const source = await makeSourceDb(dir);
    const sql = await dumpDatabaseSql(source);
    source.close();

    mockedS3List.mockResolvedValue([{ key: KEY, lastModified: null }]);
    mockedS3Get.mockResolvedValue(gzipSync(sql));

    // Target is not empty: it already contains the users table from the source.
    vi.stubEnv("TURSO_DATABASE_URL", `file:${join(dir, "source.db")}`);
    await expect(runRestore()).rejects.toThrow(/not empty/);
  });

  it("wipe-restores when --force is passed", async () => {
    const source = await makeSourceDb(dir);
    const sql = await dumpDatabaseSql(source);
    source.close();

    mockedS3List.mockResolvedValue([{ key: KEY, lastModified: null }]);
    mockedS3Get.mockResolvedValue(gzipSync(sql));

    vi.stubEnv("TURSO_DATABASE_URL", `file:${join(dir, "source.db")}`);
    const result = await runRestore({ force: true });
    expect(result.tablesRestored).toBeGreaterThan(0);
  });

  it("pickBackupKey picks newest and filters by date", async () => {
    mockedS3List.mockResolvedValue([
      { key: "db/backups/suitora-2026-08-01T000000000Z.sql.gz", lastModified: null },
      { key: "db/backups/suitora-2026-08-06T000000000Z.sql.gz", lastModified: null },
    ]);

    expect(await pickBackupKey({})).toBe(
      "db/backups/suitora-2026-08-06T000000000Z.sql.gz"
    );
    expect(await pickBackupKey({ date: "2026-08-01" })).toBe(
      "db/backups/suitora-2026-08-01T000000000Z.sql.gz"
    );
  });

  it("pickBackupKey throws when no backup contains the requested date", async () => {
    mockedS3List.mockResolvedValue([
      { key: "db/backups/suitora-2026-08-01T000000000Z.sql.gz", lastModified: null },
    ]);
    await expect(pickBackupKey({ date: "2026-09-01" })).rejects.toThrow(
      /No backup found/
    );
  });
});
