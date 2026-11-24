CREATE TABLE IF NOT EXISTS "project_contact" (
  "id" serial PRIMARY KEY NOT NULL,
  "project_id" integer NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "external_key" text NOT NULL,
  "name" text NOT NULL,
  "role" text DEFAULT '' NOT NULL,
  "raci_role" text DEFAULT 'CONSULTED' NOT NULL,
  "org_id" text DEFAULT '' NOT NULL,
  "lifecycle_stage" text DEFAULT 'ACTIVE_CLIENT' NOT NULL,
  "primary_email" text DEFAULT '' NOT NULL,
  "phone" text DEFAULT '' NOT NULL,
  "channel_handles" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "source" text DEFAULT 'hub_yaml' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "project_contact_project_ext_uq" ON "project_contact" ("project_id", "external_key");
CREATE INDEX IF NOT EXISTS "project_contact_project_idx" ON "project_contact" ("project_id", "id");

CREATE TABLE IF NOT EXISTS "project_channel" (
  "id" serial PRIMARY KEY NOT NULL,
  "project_id" integer NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "channel_id" text NOT NULL,
  "platform" text NOT NULL,
  "thread_type" text DEFAULT 'GROUP' NOT NULL,
  "display_name" text NOT NULL,
  "target_id" text DEFAULT '' NOT NULL,
  "aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" text DEFAULT 'ACTIVE' NOT NULL,
  "last_synced_at" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "project_channel_project_cid_uq" ON "project_channel" ("project_id", "channel_id");
CREATE INDEX IF NOT EXISTS "project_channel_project_idx" ON "project_channel" ("project_id", "id");
