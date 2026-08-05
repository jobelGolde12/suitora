/**
 * Apply wardrobe_folders + favorite_outfits tables.
 * Idempotent — safe to re-run.
 *
 * Usage: node scripts/migrate-wardrobe-folders.mjs
 */
import { createClient } from "@libsql/client";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const url =
  process.env.TURSO_DATABASE_URL ||
  `file:${path.join(root, "data", "suitora.db")}`;
const db = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

console.log("Target:", url.startsWith("file:") ? "local dev file" : "TURSO database");

try {
  const { rows: tableRows } = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table'"
  );
  const tables = new Set(tableRows.map((r) => r.name));

  if (tables.has("wardrobe_folders")) {
    console.log("wardrobe_folders: exists (skip)");
  } else {
    await db.execute(`
      CREATE TABLE wardrobe_folders (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("wardrobe_folders: created");
  }

  await db.execute(
    "CREATE INDEX IF NOT EXISTS wardrobe_folders_user_id_idx ON wardrobe_folders (user_id)"
  );

  if (tables.has("favorite_outfits")) {
    console.log("favorite_outfits: exists (skip)");
  } else {
    await db.execute(`
      CREATE TABLE favorite_outfits (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        outfit TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("favorite_outfits: created");
  }

  await db.execute(
    "CREATE INDEX IF NOT EXISTS favorite_outfits_user_id_idx ON favorite_outfits (user_id)"
  );

  console.log("wardrobe folders migration complete");
} finally {
  db.close();
}
