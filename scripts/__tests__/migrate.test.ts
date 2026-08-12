import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";

const PROJECT_ROOT = join(__dirname, "..", "..");

describe("scripts/migrate.mjs", () => {
  let dir: string;
  let dbPath: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "suitora-migrate-"));
    dbPath = join(dir, "test.db");
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function run(...args: string[]): string {
    return execFileSync("node", [join(PROJECT_ROOT, "scripts", "migrate.mjs"), ...args], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, TURSO_DATABASE_URL: `file:${dbPath}` },
      encoding: "utf8",
    });
  }

  it("applies every pending migration", () => {
    const out = run();
    expect(out).toMatch(/applied/i);
    expect(out).toMatch(/Applied \d+ migration\(s\)\./);
  });

  it("is idempotent on re-run", () => {
    const out = run();
    expect(out).toContain("No pending migrations");
  });

  it("records applied migrations in the tracking table", async () => {
    const db = createClient({ url: `file:${dbPath}` });
    const rs = await db.execute(
      "SELECT COUNT(*) AS c FROM _suitora_migrations WHERE status = 'applied'"
    );
    expect(Number(rs.rows[0].c)).toBeGreaterThan(10);
    const pending = await db.execute(
      "SELECT COUNT(*) AS c FROM _suitora_migrations WHERE status != 'applied'"
    );
    expect(Number(pending.rows[0].c)).toBe(0);
    db.close();
  });

  it("reports applied migrations via --status", () => {
    const out = run("--status");
    expect(out).toContain("applied");
  });

  it("refuses to roll back a migration that has no down script", () => {
    const result = spawnSync(
      "node",
      [join(PROJECT_ROOT, "scripts", "migrate.mjs"), "--down", "2026-08-06-add-soft-deletes"],
      {
        cwd: PROJECT_ROOT,
        env: { ...process.env, TURSO_DATABASE_URL: `file:${dbPath}` },
        encoding: "utf8",
      }
    );
    expect(result.status).toBe(1);
    expect(`${result.stderr}${result.stdout}`).toMatch(/down\.sql/i);
  });

  it("rolls back a reversible migration end-to-end", async () => {
    // Create a throwaway reversible migration pair, drop it into the real
    // migrations dir for the duration of the test, apply against a scratch
    // DB, then roll back and confirm the table is gone.
    const scratchDir = join(dir, "scratch");
    const { mkdirSync, writeFileSync } = await import("node:fs");
    mkdirSync(scratchDir, { recursive: true });

    const upPath = join(scratchDir, "0000_test_reversible.sql");
    const downPath = join(scratchDir, "0000_test_reversible.down.sql");
    writeFileSync(upPath, "CREATE TABLE scratch_mark (id TEXT PRIMARY KEY);\n");
    writeFileSync(downPath, "DROP TABLE IF EXISTS scratch_mark;\n");

    const realMigrations = join(PROJECT_ROOT, "drizzle", "migrations");
    const tempTarget = join(realMigrations, "0000_test_reversible.sql");
    const tempDown = join(realMigrations, "0000_test_reversible.down.sql");
    try {
      const fs = await import("node:fs");
      fs.copyFileSync(upPath, tempTarget);
      fs.copyFileSync(downPath, tempDown);

      const up = spawnSync("node", ["scripts/migrate.mjs"], {
        cwd: PROJECT_ROOT,
        env: { ...process.env, TURSO_DATABASE_URL: `file:${join(dir, "scratch.db")}` },
        encoding: "utf8",
      });
      expect(up.stdout).toContain("0000_test_reversible.sql: applied");

      const down = spawnSync(
        "node",
        ["scripts/migrate.mjs", "--down", "0000_test_reversible.sql"],
        {
          cwd: PROJECT_ROOT,
          env: { ...process.env, TURSO_DATABASE_URL: `file:${join(dir, "scratch.db")}` },
          encoding: "utf8",
        }
      );
      expect(down.stdout).toContain("rolled back");

      const db = createClient({ url: `file:${join(dir, "scratch.db")}` });
      const rs = await db.execute(
        "SELECT name FROM sqlite_schema WHERE type='table' AND name='scratch_mark'"
      );
      expect(rs.rows.length).toBe(0);
      db.close();
    } finally {
      rmSync(tempTarget, { force: true });
      rmSync(tempDown, { force: true });
    }
  }, 30000);
});
