-- Migration: Add wardrobe fields to favorites
-- Created: 2026-08-04

-- Wardrobe state lets users organize saved items (favorites) into their wardrobe.
ALTER TABLE favorites ADD COLUMN in_wardrobe INTEGER NOT NULL DEFAULT 0;
ALTER TABLE favorites ADD COLUMN wardrobe_tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE favorites ADD COLUMN wardrobe_folder TEXT;
ALTER TABLE favorites ADD COLUMN added_to_wardrobe_at TEXT;

CREATE INDEX IF NOT EXISTS favorites_wardrobe_idx ON favorites (user_id, in_wardrobe);
