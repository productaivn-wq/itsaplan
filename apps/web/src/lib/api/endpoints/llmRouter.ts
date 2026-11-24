import { request } from '@/lib/api/core/client';

export interface RouterProbeStatus {
  ready: boolean;
  kind: 'cli' | 'http' | 'sdk' | 'ipc' | string;
  key_count: number;
  binary_found: boolean;
  bridge_reachable: boolean | null;
  detail: string;
}

export interface RouterProviderModels {
  preferred: string[];
  coding: string[];
  fast: string[];
  vision: string[];
  deprecated: string[];
  resolved_candidates: string[];
  live_count: number;
}

export interface RouterProviderTelemetry {
  calls_24h: number;
  ok_24h: number;
  success_rate_24h: number | null;
  timeouts_24h: number;
  avg_latency_ms: number | null;
  avg_ttfb_ms: number | null;
  total_calls: number;
  tokens_24h: number;
  total_tokens: number;
  last_ts: number | null;
}

export interface RouterProviderEntry {
  key: string;
  display_name: string;
  tier_class: string;
  description: string;
  enabled: boolean;
  priority_index: number | null;
  kind: string;
  trust_tier: string;
  probe: RouterProbeStatus;
  models: RouterProviderModels;
  telemetry: RouterProviderTelemetry;
  active_cooldown_count: number;
  editable_env_keys?: string[];
}

export interface RouterSpendBreaker {
  spend_date: string;
  total_spend_usd: number;
  daily_limit_usd: number;
  total_tokens_in: number;
  total_tokens_out: number;
  call_count: number;
  breaker_tripped: boolean;
  last_updated: string | null;
}

export interface RouterCooldownEntry {
  scope_key: string;
  platform: string;
  model_id: string;
  key_id: number;
  provenance: string;
  expires_at: number;
  remaining_seconds: number;
  source: 'wal' | 'json' | string;
}

export interface RouterLiveModelRow {
  id: string;
  display_name?: string;
  context_window?: number;
  input_cost_per_1m_usd?: number;
  output_cost_per_1m_usd?: number;
  capabilities?: string[];
}

export interface RouterCatalogProvider {
  preferred: string[];
  coding: string[];
  fast: string[];
  vision: string[];
  deprecated: string[];
  max_candidates?: number | null;
  resolved_candidates: string[];
  live_count: number;
  live_models: RouterLiveModelRow[];
}

export interface RouterRecentAttempt {
  id: number;
  platform: string;
  model_id: string;
  ok: boolean;
  out_tokens: number;
  latency_ms: number | null;
  ttfb_ms: number | null;
  timed_out: boolean;
  ts: number;
}

export interface LlmRouterState {
  gateway: {
    status: string;
    host: string;
    port: number;
    supported_models: string[];
    updated_at: string;
  };
  registry: {
    version: string;
    active_providers: string[];
    inactive_providers: string[];
    provider_metadata: Record<string, Record<string, unknown>>;
  };
  providers: RouterProviderEntry[];
  cooldowns: RouterCooldownEntry[];
  catalog: {
    live_fresh: boolean;
    synced_at: string | null;
    ttl_seconds: number;
    defaults: Record<string, unknown>;
    providers: Record<string, RouterCatalogProvider>;
  };
  telemetry_summary: {
    calls_24h: number;
    ok_24h: number;
    success_rate_24h: number | null;
    timeouts_24h: number;
    avg_latency_ms: number | null;
    avg_ttfb_ms: number | null;
    total_tokens_24h: number;
    active_cooldowns_count: number;
    recent_attempts: RouterRecentAttempt[];
  };
  spend_breaker?: RouterSpendBreaker;
}

export interface RouterSyncResponse {
  status: string;
  sync: Record<string, unknown>;
  state: LlmRouterState;
}

export interface RouterClearCooldownsResponse {
  status: string;
  cleared_wal_rows: number;
  cleared_json_keys: number;
  state: LlmRouterState;
}

export interface RouterTestResult {
  ok: boolean;
  requested_model: string;
  preferred_provider: string | null;
  winning_provider: string | null;
  winning_model: string | null;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  response_preview: string;
  error: string | null;
}

export const getLlmRouterState = (teamId: number) =>
  request<LlmRouterState>(`/teams/${teamId}/llm-router`);

export const saveLlmRouterProviders = (
  teamId: number,
  input: { activeProviders: string[]; inactiveProviders?: string[] },
) =>
  request<LlmRouterState>(`/teams/${teamId}/llm-router/providers`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

export const toggleLlmRouterProvider = (
  teamId: number,
  providerKey: string,
  enabled: boolean,
) =>
  request<LlmRouterState>(
    `/teams/${teamId}/llm-router/providers/${encodeURIComponent(providerKey)}/toggle`,
    {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    },
  );

export const probeLlmRouter = (teamId: number) =>
  request<LlmRouterState>(`/teams/${teamId}/llm-router/probe`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

export const syncLlmRouterCatalog = (
  teamId: number,
  input: { providers?: string[]; timeout?: number } = {},
) =>
  request<RouterSyncResponse>(`/teams/${teamId}/llm-router/catalog/sync`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const updateLlmRouterCatalogDefaults = (
  teamId: number,
  input: {
    defaults?: Record<string, unknown>;
    providerModels?: Record<string, Record<string, string[]>>;
  },
) =>
  request<LlmRouterState>(`/teams/${teamId}/llm-router/catalog/defaults`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

export const clearLlmRouterCooldowns = (
  teamId: number,
  input: { scopeKey?: string; platform?: string; clearAll?: boolean },
) =>
  request<RouterClearCooldownsResponse>(`/teams/${teamId}/llm-router/cooldowns/clear`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const testLlmRouter = (
  teamId: number,
  input: {
    prompt: string;
    model?: string;
    preferredProvider?: string | null;
    maxTokens?: number;
  },
) =>
  request<RouterTestResult>(`/teams/${teamId}/llm-router/test`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const updateLlmRouterProviderCredentials = (
  teamId: number,
  providerKey: string,
  input: { envKey: string; value: string },
) =>
  request<{
    status: string;
    provider_key: string;
    env_key: string;
    key_count: number;
    state: LlmRouterState;
  }>(
    `/teams/${teamId}/llm-router/providers/${encodeURIComponent(providerKey)}/credentials`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
