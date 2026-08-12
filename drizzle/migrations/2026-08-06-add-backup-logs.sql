-- Migration: backup_logs status table (Pillar 03, Action Item 6)
-- Created: 2026-08-06

-- Tracks each automated backup run so failures are observable in-app, mirroring
-- the trend_sync_logs pattern.
CREATE TABLE IF NOT EXISTS `backup_logs` (
  `id` text PRIMARY KEY NOT NULL,
  `status` text NOT NULL,
  `key` text,
  `size_bytes` integer,
  `message` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS `backup_logs_created_at_idx` ON `backup_logs` (`created_at`);
