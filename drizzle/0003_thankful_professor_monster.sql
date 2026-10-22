CREATE TABLE `reloom_reads` (
	`owner` text NOT NULL,
	`room` text NOT NULL,
	`cursor` text NOT NULL,
	PRIMARY KEY(`owner`, `room`)
);
