CREATE TABLE `reloom_records` (
	`owner` text NOT NULL,
	`kind` text NOT NULL,
	`id` text NOT NULL,
	`data` text NOT NULL,
	`created` text NOT NULL,
	PRIMARY KEY(`owner`, `kind`, `id`)
);
--> statement-breakpoint
CREATE INDEX `reloom_public_story` ON `reloom_records` (`kind`,`id`);