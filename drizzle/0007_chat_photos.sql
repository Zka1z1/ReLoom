ALTER TABLE `reloom_messages` ADD `photo_id` text;--> statement-breakpoint
CREATE INDEX `reloom_message_photo` ON `reloom_messages` (`photo_id`);