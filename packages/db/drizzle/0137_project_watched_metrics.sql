CREATE TABLE IF NOT EXISTS "project_watched_metric" (
  "id" serial PRIMARY KEY NOT NULL,
  "project_id" integer NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "category" text DEFAULT 'delivery' NOT NULL,
  "source_type" text DEFAULT 'manual' NOT NULL,
  "source_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "unit" text DEFAULT '' NOT NULL,
  "operator" text DEFAULT '>=' NOT NULL,
  "target_value" double precision NOT NULL,
  "warn_threshold" double precision,
  "crit_threshold" double precision,
  "current_value" double precision,
  "last_recorded_at" timestamp with time zone,
  "pinned_to_overview" boolean DEFAULT true NOT NULL,
  "position" double precision DEFAULT 0 NOT NULL,
  "external_key" text,
  "created_by_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "project_watched_metric_project_slug_uq" ON "project_watched_metric" ("project_id", "slug");
CREATE INDEX IF NOT EXISTS "project_watched_metric_project_pos_idx" ON "project_watched_metric" ("project_id", "position", "id");

CREATE TABLE IF NOT EXISTS "project_watched_metric_sample" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "metric_id" integer NOT NULL REFERENCES "project_watched_metric"("id") ON DELETE CASCADE,
  "project_id" integer NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "value" double precision NOT NULL,
  "status" text NOT NULL,
  "note" text,
  "recorded_by_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "project_watched_metric_sample_metric_ts_idx" ON "project_watched_metric_sample" ("metric_id", "recorded_at");
CREATE INDEX IF NOT EXISTS "project_watched_metric_sample_project_ts_idx" ON "project_watched_metric_sample" ("project_id", "recorded_at");
