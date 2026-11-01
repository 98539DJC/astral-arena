CREATE TABLE arena_admins (
  account_id TEXT PRIMARY KEY NOT NULL REFERENCES arena_accounts(id)
);
--> statement-breakpoint
CREATE TABLE arena_admin_audit (
  id TEXT PRIMARY KEY NOT NULL,
  actor_id TEXT NOT NULL REFERENCES arena_accounts(id),
  target_id TEXT NOT NULL REFERENCES arena_accounts(id),
  action TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX arena_admin_audit_created ON arena_admin_audit(created_at);
