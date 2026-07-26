-- Migration: Add user_profiles table for body measurements and preferences
-- Created: 2026-07-21

CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Basic info
  phone TEXT,
  date_of_birth TEXT,
  gender TEXT,

  -- Manual body measurements
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

  -- AI-estimated fields
  estimated_height REAL,
  estimated_height_confidence REAL,
  estimated_weight REAL,
  estimated_weight_confidence REAL,
  body_shape TEXT,
  body_shape_confidence REAL,
  skin_tone TEXT,
  face_shape TEXT,
  bmi_category TEXT,

  -- Self image
  self_image_url TEXT,
  self_image_thumbnail_url TEXT,
  self_image_uploaded_at TEXT,

  -- Style preferences
  style_tags TEXT DEFAULT '[]',
  preferred_brands TEXT DEFAULT '[]',
  preferred_colors TEXT DEFAULT '[]',
  avoid_colors TEXT DEFAULT '[]',
  price_range_min INTEGER,
  price_range_max INTEGER,
  fit_preference TEXT DEFAULT 'regular',
  size_preference TEXT DEFAULT 'US',

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
