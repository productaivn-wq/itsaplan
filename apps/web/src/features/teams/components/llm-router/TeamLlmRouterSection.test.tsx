import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { JSDOM } from 'jsdom';
import type { LlmRouterState } from '@/lib/api/endpoints/llmRouter';
import type { Permissions, PermissionResource, ResourcePermissions } from '@/lib/api/endpoints/roles';
import type { Team, TeamDetail } from '@/lib/api/endpoints/teams';
import { llmRouterQueryKey } from '@/services/llmRouter.service';
import { qk } from '@/services/queryKeys';
import teamsMessages from '../../../../../messages/en/teams.json';

const ALL_RESOURCES: PermissionResource[] = [
  'work_items',
  'initiatives',
  'cycles',
  'dashboards',
  'documents',
  'views',
  'members_invite',
  'members_manage',
  'states',
  'issue_types',
  'labels',
  'ai_agents',
  'integrations',
  'agent_skills',
  'agent_tools',
  'custom_fields',
  'issue_templates',
  'workflow_config',
  'actions',
  'webhooks',
  'repositories',
  'note_boards',
  'danger_zone',
  'import_export',
];

function buildPermissions(): Permissions {
  const base: ResourcePermissions = { create: true, edit: true, read: true, delete: true };
  const perms = {} as Permissions;
  for (const res of ALL_RESOURCES) perms[res] = { ...base };
  return perms;
}

function makeTeam(): Team {
  return {
    id: 1,
    name: 'Thanb Workspace',
    slug: 'thanb',
    ref: 'thanb',
    mcpEnabled: true,
    role: 'owner',
    source: 'invite',
    joinedAt: '2026-01-01T00:00:00Z',
    projectCount: 3,
    mcpEnabledProjectCount: 1,
    memberCount: 5,
    ownerCount: 1,
    roleCount: 4,
    integrationCount: 2,
    agentCount: 6,
    skillCount: 10,
    toolCount: 4,
    createdAt: '2026-01-01T00:00:00Z',
  };
}

function makeState(): LlmRouterState {
  return {
    gateway: {
      status: 'ok',
      host: '127.0.0.1',
      port: 18766,
      supported_models: ['agentic-os/auto', 'agentic-os/coding'],
      updated_at: '2026-11-24T12:00:00Z',
    },
    registry: {
      version: '1.0.0',
      active_providers: ['antigravity_cli', 'nvidia_nim', 'muse_ai'],
      inactive_providers: ['openrouter'],
      provider_metadata: {},
    },
    providers: [
      {
        key: 'antigravity_cli',
        display_name: 'Antigravity CLI',
        tier_class: 'AntigravityCLITier',
        description: 'Google Antigravity CLI',
        enabled: true,
        priority_index: 1,
        kind: 'cli',
        trust_tier: 'TIER_0_A_SOVEREIGN',
        probe: {
          ready: true,
          kind: 'cli',
          key_count: 0,
          binary_found: true,
          bridge_reachable: null,
          detail: 'agy binary available',
        },
        models: {
          preferred: [],
          coding: [],
          fast: ['gemini-3.8-flash-low'],
          vision: [],
          deprecated: [],
          resolved_candidates: ['gemini-3.8-flash-low'],
          live_count: 23,
        },
        telemetry: {
          calls_24h: 0,
          ok_24h: 0,
          success_rate_24h: null,
          timeouts_24h: 0,
          avg_latency_ms: null,
          avg_ttfb_ms: null,
          total_calls: 0,
          tokens_24h: 0,
          total_tokens: 0,
          last_ts: null,
        },
        active_cooldown_count: 0,
        editable_env_keys: [],
      },
      {
        key: 'nvidia_nim',
        display_name: 'Nvidia Nim',
        tier_class: 'NvidiaNimTier',
        description: 'NVIDIA NIM Cloud API',
        enabled: true,
        priority_index: 2,
        kind: 'http',
        trust_tier: 'TIER_B1_FREE_BURST',
        probe: {
          ready: true,
          kind: 'http',
          key_count: 2,
          binary_found: false,
          bridge_reachable: null,
          detail: '2 API key(s) configured',
        },
        models: {
          preferred: ['minimaxai/minimax-m3.1-flash'],
          coding: [],
          fast: [],
          vision: [],
          deprecated: [],
          resolved_candidates: ['minimaxai/minimax-m3.1-flash'],
          live_count: 32,
        },
        telemetry: {
          calls_24h: 574,
          ok_24h: 516,
          success_rate_24h: 89.9,
          timeouts_24h: 0,
          avg_latency_ms: 10350.9,
          avg_ttfb_ms: 9847.7,
          total_calls: 574,
          tokens_24h: 97979318,
          total_tokens: 97979318,
          last_ts: 1795522114,
        },
        active_cooldown_count: 0,
        editable_env_keys: ['NVIDIA_API_KEYS', 'NVIDIA_API_KEY'],
      },
      {
        key: 'muse_ai',
        display_name: 'Muse AI',
        tier_class: 'MuseAITier',
        description: 'Muse AI Sovereign Bridge',
        enabled: true,
        priority_index: 3,
        kind: 'http',
        trust_tier: 'TIER_B1_FREE_BURST',
        probe: {
          ready: true,
          kind: 'http',
          key_count: 0,
          binary_found: false,
          bridge_reachable: true,
          detail: '0 key(s) · bridge configured · bridge online',
        },
        models: {
          preferred: ['muse-spark-1.3'],
          coding: [],
          fast: [],
          vision: [],
          deprecated: [],
          resolved_candidates: ['muse-spark-1.3'],
          live_count: 4,
        },
        telemetry: {
          calls_24h: 1,
          ok_24h: 0,
          success_rate_24h: 0,
          timeouts_24h: 0,
          avg_latency_ms: 500,
          avg_ttfb_ms: 400,
          total_calls: 1,
          tokens_24h: 0,
          total_tokens: 0,
          last_ts: 1795520000,
        },
        active_cooldown_count: 0,
        editable_env_keys: ['MUSE_API_KEYS', 'MUSE_API_KEY', 'MUSE_BRIDGE_USER_KEY'],
      },
    ],
    cooldowns: [],
    catalog: {
      live_fresh: true,
      synced_at: '2026-11-24T12:00:00Z',
      ttl_seconds: 259200,
      defaults: { fast: 'gemini-3.8-flash-low' },
      providers: {
        nvidia_nim: {
          preferred: ['minimaxai/minimax-m3.1-flash'],
          coding: [],
          fast: [],
          vision: [],
          deprecated: [],
          max_candidates: 3,
          resolved_candidates: ['minimaxai/minimax-m3.1-flash'],
          live_count: 1,
          live_models: [{ id: 'minimaxai/minimax-m3.1-flash', capabilities: ['free'] }],
        },
      },
    },
    telemetry_summary: {
      calls_24h: 575,
      ok_24h: 516,
      success_rate_24h: 89.7,
      timeouts_24h: 0,
      avg_latency_ms: 10350.9,
      avg_ttfb_ms: 9847.7,
      total_tokens_24h: 97979318,
      active_cooldowns_count: 0,
      recent_attempts: [],
    },
    spend_breaker: {
      spend_date: '2026-11-24',
      total_spend_usd: 0.0,
      daily_limit_usd: 5.0,
      total_tokens_in: 598351,
      total_tokens_out: 172210,
      call_count: 147,
      breaker_tripped: false,
      last_updated: '2026-11-24T11:45:20',
    },
  };
}

const replacedGlobals = [
  'window',
  'document',
  'navigator',
  'Node',
  'NodeFilter',
  'DocumentFragment',
  'Element',
  'HTMLElement',
  'HTMLFormElement',
  'SVGElement',
  'Event',
  'CustomEvent',
  'MutationObserver',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'localStorage',
  'fetch',
  'IS_REACT_ACT_ENVIRONMENT',
] as const;

let dom: JSDOM;
let root: Root;
let client: QueryClient;
let originalDescriptors: Map<string, PropertyDescriptor | undefined>;

describe('TeamLlmRouterSection', () => {
  beforeEach(() => {
    originalDescriptors = new Map(
      replacedGlobals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
    );
    dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
      url: 'http://localhost:3001/thanb/settings/llm-router',
    });
    (dom.window as unknown as Window).__ITSAPLAN_ENV__ = {
      apiUrl: 'http://api.test',
      privacyUrl: '',
      termsUrl: '',
    };

    for (const name of replacedGlobals) {
      if (name === 'IS_REACT_ACT_ENVIRONMENT') {
        (globalThis as unknown as Record<string, unknown>)[name] = true;
      } else if (name === 'requestAnimationFrame') {
        (globalThis as unknown as Record<string, unknown>)[name] = (cb: () => void) =>
          setTimeout(cb, 0);
      } else if (name === 'cancelAnimationFrame') {
        (globalThis as unknown as Record<string, unknown>)[name] = (id: ReturnType<typeof setTimeout>) =>
          clearTimeout(id);
      } else if (name === 'fetch') {
        (globalThis as unknown as Record<string, unknown>)[name] = () =>
          Promise.resolve(new Response('{}', { status: 200 }));
      } else {
        Object.defineProperty(globalThis, name, {
          configurable: true,
          writable: true,
          value: dom.window[name as keyof typeof dom.window],
        });
      }
    }

    client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    const detail: TeamDetail = { ...makeTeam(), leads: [], permissions: buildPermissions() };
    client.setQueryData(qk.team(1), detail);
    client.setQueryData(llmRouterQueryKey(1), makeState());
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount();
      });
    }
    dom.window.close();
    for (const name of replacedGlobals) {
      const desc = originalDescriptors.get(name);
      if (desc) Object.defineProperty(globalThis, name, desc);
      else delete (globalThis as unknown as Record<string, unknown>)[name];
    }
  });

  it('renders active providers, Keys trigger, and Spend Breaker telemetry', async () => {
    const { createRoot } = await import('react-dom/client');
    const { default: TeamLlmRouterSection } = await import('./TeamLlmRouterSection');

    const container = dom.window.document.getElementById('root')!;
    root = createRoot(container);

    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <NextIntlClientProvider locale="en" timeZone="UTC" messages={{ teams: teamsMessages }}>
            <TeamLlmRouterSection teamId={1} />
          </NextIntlClientProvider>
        </QueryClientProvider>,
      );
    });

    const html = container.innerHTML;
    assert.ok(html.includes('router-provider-row-nvidia_nim'));
    assert.ok(html.includes('router-keys-nvidia_nim'));
    assert.ok(html.includes('router-provider-row-muse_ai'));
    assert.ok(html.includes(':18766 Online'));
    assert.ok(html.includes('89.7%'));
  });
});
