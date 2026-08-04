/**
 * Idempotent schema sync for migrations missing from the running database:
 *   - user_profiles table                     (2026-07-21-add-user-profiles.sql)
 *   - favorites wardrobe columns              (2026-08-04-add-wardrobe-fields.sql)
 *
 * Safe to re-run. Connects to TURSO_DATABASE_URL (or the local dev file when
 * unset), matching how the app resolves its database at runtime.
 *
 * Usage: node scripts/fix-schema-migrations.mjs
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

const { rows: tableRows } = await db.execute(
  "SELECT name FROM sqlite_master WHERE type='table'"
);
const tables = new Set(tableRows.map((r) => r.name));

// 1) user_profiles table
if (tables.has("user_profiles")) {
  console.log("user_profiles: exists (skip)");
} else {
  const ddl = String.raw`CREATE TABLE user_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    phone TEXT,
    date_of_birth TEXT,
    gender TEXT,
    height REAL,
    weight REAL,
    chest_circumference REAL,
    waist_circumference REAL,
    hip_circumference REAL,
    shoulder_width REAL,
    inseam_length REAL,
    arm_length REAL,
    neck_circumference REAL,
    foot_length REAL,
    foot_width REAL,
    shoe_size TEXT,
    bust_cup_size TEXT,
    estimated_height REAL,
    estimated_height_confidence REAL,
    estimated_weight REAL,
    estimated_weight_confidence REAL,
    body_shape TEXT,
    body_shape_confidence REAL,
    skin_tone TEXT,
    face_shape TEXT,
    bmi_category TEXT,
    self_image_url TEXT,
    self_image_thumbnail_url TEXT,
    self_image_uploaded_at TEXT,
    style_tags TEXT DEFAULT '[]',
    preferred_brands TEXT DEFAULT '[]',
    preferred_colors TEXT DEFAULT '[]',
    avoid_colors TEXT DEFAULT '[]',
    price_range_min INTEGER,
    price_range_max INTEGER,
    fit_preference TEXT DEFAULT 'regular',
    size_preference TEXT DEFAULT 'US',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`;
  await db.execute(ddl);
  await db.execute(
    "CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)"
  );
  console.log("user_profiles: created");
}

// 2) favorites wardrobe columns
if (!tables.has("favorites")) {
  console.log("favorites: MISSING (unexpected, skipped)");
} else {
  const { rows: favRows } = await db.execute("PRAGMA table_info(favorites)");
  const favCols = new Set(favRows.map((r) => r.name));
  const adds = [
    ["in_wardrobe", "INTEGER NOT NULL DEFAULT 0"],
    ["wardrobe_tags", "TEXT NOT NULL DEFAULT '[]'"],
    ["wardrobe_folder", "TEXT"],
    ["added_to_wardrobe_at", "TEXT"],
  ];
  for (const [name, def] of adds) {
    if (favCols.has(name)) {
      console.log(`favorites.${name}: exists (skip)`);
      continue;
    }
    await db.execute(`ALTER TABLE favorites ADD COLUMN ${name} ${def}`);
    console.log(`favorites.${name}: added`);
  }
  await db.execute(
    "CREATE INDEX IF NOT EXISTS favorites_wardrobe_idx ON favorites (user_id, in_wardrobe)"
  );
}

db.close();
console.log("Schema sync complete.");
