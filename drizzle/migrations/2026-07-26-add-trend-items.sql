CREATE TABLE IF NOT EXISTS `trend_items` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`provider_id` text NOT NULL,
	`title` text NOT NULL,
	`brand` text,
	`description` text,
	`category` text NOT NULL,
	`subcategory` text,
	`gender` text,
	`image_url` text NOT NULL,
	`product_url` text,
	`price` real,
	`currency` text,
	`season` text,
	`occasion` text,
	`style_tags` text DEFAULT '[]' NOT NULL,
	`colors` text DEFAULT '[]' NOT NULL,
	`popularity_score` real DEFAULT 0 NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_available` integer DEFAULT true NOT NULL,
	`last_synced` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `trend_items_provider_id_idx` ON `trend_items` (`provider`,`provider_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `trend_sync_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`status` text NOT NULL,
	`items_fetched` integer DEFAULT 0 NOT NULL,
	`items_upserted` integer DEFAULT 0 NOT NULL,
	`message` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
