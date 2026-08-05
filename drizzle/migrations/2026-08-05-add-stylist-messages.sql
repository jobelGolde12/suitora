-- Migration: Add stylist messages
-- Created: 2026-08-05

-- Persistent AI Stylist conversation history for authenticated users.
CREATE TABLE IF NOT EXISTS stylist_messages (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS stylist_messages_user_created_idx
  ON stylist_messages (user_id, created_at);
