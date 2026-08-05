-- Migration: Add wardrobe folders + favorite outfits
-- Created: 2026-08-05

-- Named folders for organizing wardrobe items (favorites flagged in_wardrobe).
-- favorites.wardrobe_folder stores the folder id (nullable text).
CREATE TABLE IF NOT EXISTS wardrobe_folders (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS wardrobe_folders_user_id_idx
  ON wardrobe_folders (user_id);

-- Saved outfit snapshots from the wardrobe outfit recommender.
CREATE TABLE IF NOT EXISTS favorite_outfits (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  outfit TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS favorite_outfits_user_id_idx
  ON favorite_outfits (user_id);
