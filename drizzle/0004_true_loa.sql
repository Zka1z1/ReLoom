CREATE TABLE `reloom_letters` (
	`id` text PRIMARY KEY NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`garment_id` text NOT NULL,
	`data` text NOT NULL,
	`created` text NOT NULL,
	`opened` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reloom_letter_inbox` ON `reloom_letters` (`recipient`,`created`);--> statement-breakpoint
CREATE INDEX `reloom_letter_sender` ON `reloom_letters` (`sender`,`created`);--> statement-breakpoint
CREATE TABLE `reloom_profiles` (
	`owner` text PRIMARY KEY NOT NULL,
	`handle` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reloom_profile_handle` ON `reloom_profiles` (`handle`);