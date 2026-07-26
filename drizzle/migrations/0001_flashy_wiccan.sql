-- Migration: Add product_id to favorites and unique constraint
-- Generated from schema changes

ALTER TABLE `favorites` ADD `product_id` text REFERENCES products(id);--> statement-breakpoint
CREATE UNIQUE INDEX `favorites_user_analysis_idx` ON `favorites` (`user_id`,`analysis_id`);
