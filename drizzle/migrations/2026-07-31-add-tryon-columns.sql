-- Migration: Add virtual try-on lifecycle columns to analyses
-- Created: 2026-07-31
-- Applies with: node scripts/migrate-tryon.mjs (or manual sqlite execution)

ALTER TABLE analyses ADD COLUMN try_on_status TEXT NOT NULL DEFAULT 'skipped';
--> statement-breakpoint
ALTER TABLE analyses ADD COLUMN try_on_category TEXT;
--> statement-breakpoint
ALTER TABLE analyses ADD COLUMN try_on_job_id TEXT;
--> statement-breakpoint
ALTER TABLE analyses ADD COLUMN try_on_provider TEXT;
--> statement-breakpoint
ALTER TABLE analyses ADD COLUMN try_on_error TEXT;
--> statement-breakpoint
ALTER TABLE analyses ADD COLUMN try_on_latency_ms INTEGER;
--> statement-breakpoint
ALTER TABLE analyses ADD COLUMN try_on_started_at TEXT;
