-- Performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS `analyses_user_id_idx` ON `analyses` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `analyses_created_at_idx` ON `analyses` (`created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `favorites_user_id_idx` ON `favorites` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `uploads_user_id_idx` ON `uploads` (`user_id`);
