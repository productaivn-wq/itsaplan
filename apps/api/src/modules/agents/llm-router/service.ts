import { HttpError } from '#shared/lib';
import { assertLoopbackGatewayUrl } from '../core/runtime/tools/sovereign-harness';

const DEFAULT_GATEWAY_URL = 'http://127.0.0.1:18766';
const DEFAULT_TIMEOUT_MS = 10_000;
const SYNC_TIMEOUT_MS = 30_000;
const TEST_TIMEOUT_MS = 55_000;

function resolveGatewayConfig(): { baseUrl: string; token: string } {
  const rawUrl = process.env.ITSAPLAN_LLM_GATEWAY_URL || DEFAULT_GATEWAY_URL;
  let baseUrl: string;
  try {
    baseUrl = assertLoopbackGatewayUrl(rawUrl);
  } catch (err) {
    throw new HttpError(
      503,
      err instanceof Error ? err.message : 'Invalid sovereign LLM gateway URL',
      'ROUTER_GATEWAY_UNAVAILABLE',
    );
  }
  const token = (process.env.ITSAPLAN_LLM_GATEWAY_TOKEN || '').trim();
  if (!token) {
    throw new HttpError(
      503,
      'ITSAPLAN_LLM_GATEWAY_TOKEN is not configured on the API server',
      'ROUTER_GATEWAY_UNAVAILABLE',
    );
  }
  return { baseUrl, token };
}

async function callGateway<T extends Record<string, unknown>>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  body?: Record<string, unknown>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const { baseUrl, token } = resolveGatewayConfig();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new HttpError(
      503,
      `Sovereign LLM Router Gateway is unreachable (${baseUrl}): ${
        err instanceof Error ? err.message : 'connection failed'
      }`,
      'ROUTER_GATEWAY_UNAVAILABLE',
    );
  }

  const text = await res.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (parsed && typeof parsed === 'object') {
        data = parsed as Record<string, unknown>;
      }
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const errObj = data.error;
    const msg =
      errObj && typeof errObj === 'object' && 'message' in errObj
        ? String((errObj as Record<string, unknown>).message)
        : typeof errObj === 'string'
          ? errObj
          : `Gateway returned HTTP ${res.status}`;
    if (res.status === 400 || res.status === 404) {
      throw new HttpError(res.status, msg);
    }
    throw new HttpError(502, msg, 'ROUTER_GATEWAY_ERROR');
  }

  return data as T;
}

export function getRouterState() {
  return callGateway('GET', '/v1/router/state');
}

export function saveRouterProviders(input: {
  activeProviders: string[];
  inactiveProviders?: string[];
}) {
  return callGateway('PUT', '/v1/router/providers', {
    active_providers: input.activeProviders,
    ...(input.inactiveProviders !== undefined
      ? { inactive_providers: input.inactiveProviders }
      : {}),
  });
}

export function toggleRouterProvider(providerKey: string, enabled: boolean) {
  return callGateway('POST', '/v1/router/providers/toggle', {
    provider_key: providerKey,
    enabled,
  });
}

export function updateRouterProviderCredentials(
  providerKey: string,
  input: { envKey: string; value: string },
) {
  return callGateway('POST', '/v1/router/providers/credentials', {
    provider_key: providerKey,
    env_key: input.envKey,
    value: input.value,
  });
}

export function probeRouter() {
  return callGateway('POST', '/v1/router/probe', {});
}

export function syncRouterCatalog(input: { providers?: string[]; timeout?: number }) {
  return callGateway(
    'POST',
    '/v1/router/catalog/sync',
    {
      ...(input.providers !== undefined ? { providers: input.providers } : {}),
      ...(input.timeout !== undefined ? { timeout: input.timeout } : {}),
    },
    SYNC_TIMEOUT_MS,
  );
}

export function updateRouterCatalogDefaults(input: {
  defaults?: Record<string, unknown>;
  providerModels?: Record<string, Record<string, string[]>>;
}) {
  return callGateway('PUT', '/v1/router/catalog/defaults', {
    ...(input.defaults !== undefined ? { defaults: input.defaults } : {}),
    ...(input.providerModels !== undefined ? { provider_models: input.providerModels } : {}),
  });
}

export function clearRouterCooldowns(input: {
  scopeKey?: string;
  platform?: string;
  clearAll?: boolean;
}) {
  return callGateway('POST', '/v1/router/cooldowns/clear', {
    ...(input.scopeKey !== undefined ? { scope_key: input.scopeKey } : {}),
    ...(input.platform !== undefined ? { platform: input.platform } : {}),
    ...(input.clearAll !== undefined ? { clear_all: input.clearAll } : {}),
  });
}

export function testRouter(input: {
  prompt: string;
  model?: string;
  preferredProvider?: string | null;
  maxTokens?: number;
}) {
  return callGateway(
    'POST',
    '/v1/router/test',
    {
      prompt: input.prompt,
      ...(input.model !== undefined ? { model: input.model } : {}),
      ...(input.preferredProvider !== undefined
        ? { preferred_provider: input.preferredProvider }
        : {}),
      ...(input.maxTokens !== undefined ? { max_tokens: input.maxTokens } : {}),
    },
    TEST_TIMEOUT_MS,
  );
}
