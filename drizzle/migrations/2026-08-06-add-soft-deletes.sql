-- Migration: Soft deletes via deleted_at (Pillar 03, Action Item 5)
-- Created: 2026-08-06

-- Soft-deletable user-owned tables get a nullable deleted_at column plus an
-- index so the global "not deleted" filter stays a cheap index scan.
ALTER TABLE `analyses` ADD COLUMN `deleted_at` text;
ALTER TABLE `favorites` ADD COLUMN `deleted_at` text;
ALTER TABLE `user_profiles` ADD COLUMN `deleted_at` text;
ALTER TABLE `stylist_messages` ADD COLUMN `deleted_at` text;
ALTER TABLE `wardrobe_folders` ADD COLUMN `deleted_at` text;
ALTER TABLE `favorite_outfits` ADD COLUMN `deleted_at` text;

CREATE INDEX IF NOT EXISTS `analyses_deleted_at_idx` ON `analyses` (`deleted_at`);
CREATE INDEX IF NOT EXISTS `favorites_deleted_at_idx` ON `favorites` (`deleted_at`);
CREATE INDEX IF NOT EXISTS `user_profiles_deleted_at_idx` ON `user_profiles` (`deleted_at`);
CREATE INDEX IF NOT EXISTS `stylist_messages_deleted_at_idx` ON `stylist_messages` (`deleted_at`);
CREATE INDEX IF NOT EXISTS `wardrobe_folders_deleted_at_idx` ON `wardrobe_folders` (`deleted_at`);
CREATE INDEX IF NOT EXISTS `favorite_outfits_deleted_at_idx` ON `favorite_outfits` (`deleted_at`);
