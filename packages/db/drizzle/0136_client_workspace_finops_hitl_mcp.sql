ALTER TABLE "user_preference" DROP CONSTRAINT IF EXISTS "user_preference_start_page_check";
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_start_page_check" CHECK ("start_page" IN ('inbox', 'dashboard', 'work-items', 'initiatives', 'workspace'));

CREATE TABLE IF NOT EXISTS "agent_usage_ledger" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "team_id" integer NOT NULL REFERENCES "team"("id") ON DELETE CASCADE,
  "project_id" integer REFERENCES "project"("id") ON DELETE SET NULL,
  "agent_id" integer NOT NULL REFERENCES "ai_agent"("id") ON DELETE CASCADE,
  "thread_id" text,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "provider" text NOT NULL,
  "model" text NOT NULL,
  "input_tokens" integer NOT NULL DEFAULT 0,
  "output_tokens" integer NOT NULL DEFAULT 0,
  "cost_usd_micros" bigint NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "agent_usage_ledger_team_created_idx" ON "agent_usage_ledger" ("team_id", "created_at");
CREATE INDEX IF NOT EXISTS "agent_usage_ledger_thread_idx" ON "agent_usage_ledger" ("thread_id");

CREATE TABLE IF NOT EXISTS "team_budget_policy" (
  "team_id" integer PRIMARY KEY REFERENCES "team"("id") ON DELETE CASCADE,
  "monthly_token_budget" bigint NOT NULL DEFAULT 0,
  "monthly_usd_ceiling_micros" bigint NOT NULL DEFAULT 0,
  "soft_alert_pct" integer NOT NULL DEFAULT 80,
  "hard_stop_enabled" boolean NOT NULL DEFAULT false,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mcp_server_connection" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer NOT NULL REFERENCES "team"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "transport" text NOT NULL DEFAULT 'streamable-http',
  "endpoint_url" text NOT NULL,
  "encrypted_headers" text,
  "enabled" boolean NOT NULL DEFAULT true,
  "allowed_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_by" text REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "mcp_server_connection_team_name_uq" ON "mcp_server_connection" ("team_id", "name");

CREATE TABLE IF NOT EXISTS "agent_mcp_link" (
  "agent_id" integer NOT NULL REFERENCES "ai_agent"("id") ON DELETE CASCADE,
  "connection_id" integer NOT NULL REFERENCES "mcp_server_connection"("id") ON DELETE CASCADE,
  "enabled_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("agent_id", "connection_id")
);

CREATE TABLE IF NOT EXISTS "agent_approval_request" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" integer NOT NULL REFERENCES "team"("id") ON DELETE CASCADE,
  "project_id" integer NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "agent_id" integer NOT NULL REFERENCES "ai_agent"("id") ON DELETE CASCADE,
  "thread_id" text,
  "tool_call_id" text NOT NULL,
  "tool_name" text NOT NULL,
  "kind" text NOT NULL DEFAULT 'approval',
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "requested_by_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "decided_by_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "require_sod" boolean NOT NULL DEFAULT false,
  "status" text NOT NULL DEFAULT 'pending',
  "decision_note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "decided_at" timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "agent_approval_request_project_status_idx" ON "agent_approval_request" ("project_id", "status", "created_at");

CREATE TABLE IF NOT EXISTS "user_workspace_state" (
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "project_id" integer NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "state" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("user_id", "project_id")
);
