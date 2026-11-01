CREATE TABLE arena_accounts (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT 'nova',
  profile_hash TEXT NOT NULL UNIQUE REFERENCES arena_profiles(token_hash),
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  recovery_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE arena_sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES arena_accounts(id),
  created_at INTEGER NOT NULL,
  expires INTEGER NOT NULL,
  device TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX arena_sessions_account ON arena_sessions(account_id);
--> statement-breakpoint
CREATE INDEX arena_sessions_expires ON arena_sessions(expires);
--> statement-breakpoint
CREATE TABLE arena_auth_limits (
  bucket TEXT PRIMARY KEY NOT NULL,
  attempts INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
