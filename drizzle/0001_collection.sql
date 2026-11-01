CREATE TABLE `arena_profiles` (
  `token_hash` text PRIMARY KEY NOT NULL,
  `data` text NOT NULL,
  `version` integer DEFAULT 0 NOT NULL
);
