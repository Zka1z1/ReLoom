CREATE TABLE `reloom_limits` (
	`owner` text NOT NULL,
	`purpose` text NOT NULL,
	`window` text NOT NULL,
	`count` integer NOT NULL,
	PRIMARY KEY(`owner`, `purpose`)
);
--> statement-breakpoint
CREATE TABLE `reloom_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`room` text NOT NULL,
	`text` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reloom_room_messages` ON `reloom_messages` (`room`,`created`,`id`);--> statement-breakpoint
CREATE INDEX `reloom_author_messages` ON `reloom_messages` (`owner`,`created`);--> statement-breakpoint
CREATE TABLE `reloom_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reloom_owner_photos` ON `reloom_photos` (`owner`,`created`);--> statement-breakpoint
CREATE TABLE `reloom_presence` (
	`owner` text NOT NULL,
	`room` text NOT NULL,
	`seen` text NOT NULL,
	PRIMARY KEY(`owner`, `room`)
);
--> statement-breakpoint
CREATE INDEX `reloom_room_presence` ON `reloom_presence` (`room`,`seen`);