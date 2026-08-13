CREATE TABLE `backup_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`key` text,
	`size_bytes` integer,
	`message` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `favorite_outfits` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`outfit` text NOT NULL,
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `favorite_outfits_user_id_idx` ON `favorite_outfits` (`user_id`);--> statement-breakpoint
CREATE INDEX `favorite_outfits_deleted_at_idx` ON `favorite_outfits` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `stylist_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stylist_messages_user_created_idx` ON `stylist_messages` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `stylist_messages_deleted_at_idx` ON `stylist_messages` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `trend_items` (
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
CREATE UNIQUE INDEX `trend_items_provider_id_idx` ON `trend_items` (`provider`,`provider_id`);--> statement-breakpoint
CREATE TABLE `trend_sync_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`status` text NOT NULL,
	`items_fetched` integer DEFAULT 0 NOT NULL,
	`items_upserted` integer DEFAULT 0 NOT NULL,
	`message` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wardrobe_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`deleted_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `wardrobe_folders_user_id_idx` ON `wardrobe_folders` (`user_id`);--> statement-breakpoint
CREATE INDEX `wardrobe_folders_deleted_at_idx` ON `wardrobe_folders` (`deleted_at`);--> statement-breakpoint
ALTER TABLE `analyses` ADD `try_on_status` text DEFAULT 'skipped' NOT NULL;--> statement-breakpoint
ALTER TABLE `analyses` ADD `try_on_category` text;--> statement-breakpoint
ALTER TABLE `analyses` ADD `try_on_job_id` text;--> statement-breakpoint
ALTER TABLE `analyses` ADD `try_on_provider` text;--> statement-breakpoint
ALTER TABLE `analyses` ADD `try_on_error` text;--> statement-breakpoint
ALTER TABLE `analyses` ADD `try_on_latency_ms` integer;--> statement-breakpoint
ALTER TABLE `analyses` ADD `try_on_started_at` text;--> statement-breakpoint
ALTER TABLE `analyses` ADD `deleted_at` text;--> statement-breakpoint
CREATE INDEX `analyses_user_id_idx` ON `analyses` (`user_id`);--> statement-breakpoint
CREATE INDEX `analyses_created_at_idx` ON `analyses` (`created_at`);--> statement-breakpoint
CREATE INDEX `analyses_deleted_at_idx` ON `analyses` (`deleted_at`);--> statement-breakpoint
ALTER TABLE `favorites` ADD `in_wardrobe` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `favorites` ADD `wardrobe_tags` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `favorites` ADD `wardrobe_folder` text;--> statement-breakpoint
ALTER TABLE `favorites` ADD `added_to_wardrobe_at` text;--> statement-breakpoint
ALTER TABLE `favorites` ADD `deleted_at` text;--> statement-breakpoint
CREATE INDEX `favorites_user_id_idx` ON `favorites` (`user_id`);--> statement-breakpoint
CREATE INDEX `favorites_wardrobe_idx` ON `favorites` (`user_id`,`in_wardrobe`);--> statement-breakpoint
CREATE INDEX `favorites_deleted_at_idx` ON `favorites` (`deleted_at`);--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `deleted_at` text;--> statement-breakpoint
CREATE INDEX `uploads_user_id_idx` ON `uploads` (`user_id`);