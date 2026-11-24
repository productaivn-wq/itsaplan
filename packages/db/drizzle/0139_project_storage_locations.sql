CREATE TABLE IF NOT EXISTS "project_storage_location" (
  "id" serial PRIMARY KEY NOT NULL,
  "project_id" integer NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "location_id" text NOT NULL,
  "kind" text DEFAULT 'local_folder' NOT NULL,
  "label" text NOT NULL,
  "uri_or_path" text NOT NULL,
  "access_scope" text DEFAULT 'read_write' NOT NULL,
  "is_primary" boolean DEFAULT false NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "source" text DEFAULT 'ui' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "project_storage_location_project_loc_uq" ON "project_storage_location" ("project_id", "location_id");
CREATE INDEX IF NOT EXISTS "project_storage_location_project_idx" ON "project_storage_location" ("project_id", "id");

ALTER TABLE "project_channel" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'hub_sync' NOT NULL;
