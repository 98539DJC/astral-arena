CREATE TABLE `arena_rooms` (
  `code` text PRIMARY KEY NOT NULL,
  `data` text NOT NULL,
  `version` integer DEFAULT 0 NOT NULL,
  `expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `arena_rooms_expires` ON `arena_rooms` (`expires`);
