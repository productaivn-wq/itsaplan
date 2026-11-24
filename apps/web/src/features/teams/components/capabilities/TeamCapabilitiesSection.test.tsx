import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import {
  AppRouterContext,
  type AppRouterInstance,
} from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { JSDOM } from 'jsdom';
import type { AiAgent } from '@/lib/api/endpoints/agents';
import type { AgentSkill } from '@/lib/api/endpoints/agentSkills';
import type { ConfiguredTool } from '@/lib/api/endpoints/agentTools';
import type { CompanySettings } from '@/lib/api/endpoints/company';
import type { Permissions, PermissionResource, ResourcePermissions } from '@/lib/api/endpoints/roles';
import type { Team, TeamDetail, TeamProjectOption } from '@/lib/api/endpoints/teams';
import { qk } from '@/services/queryKeys';
import common from '../../../../../messages/en/common.json';
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

function buildPermissions(grantAll: boolean, overrides: Partial<Permissions> = {}): Permissions {
  const base: ResourcePermissions = {
    create: grantAll,
    edit: grantAll,
    read: grantAll,
    delete: grantAll,
  };
  const perms = {} as Permissions;
  for (const res of ALL_RESOURCES) {
    perms[res] = { ...base };
  }
  return { ...perms, ...overrides };
}

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 1,
    name: 'Thanb Workspace',
    slug: 'thanb',
    ref: 'thanb',
    mcpEnabled: true,
    role: 'owner',
    source: 'invite',
    joinedAt: '2026-01-01T00:00:00Z',
    projectCount: 2,
    memberCount: 4,
    ownerCount: 1,
    roleCount: 3,
    integrationCount: 1,
    agentCount: 2,
    skillCount: 1,
    toolCount: 1,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const SAMPLE_COMPANY: CompanySettings = {
  companyName: 'Accord Enterprise',
  legalName: 'Accord Digital LLC',
  slug: 'accord',
  domain: 'accord.local',
  industry: 'Software',
  timezone: 'Asia/Ho_Chi_Minh',
  defaultLocale: 'en',
  defaultAutonomyTier: 'TIER_2',
  requireSodApproval: true,
  allowAgentTeamBootstrap: true,
  onboardingCompleted: true,
};

const SAMPLE_PROJECTS: TeamProjectOption[] = [
  { id: 10, key: 'PM', ref: 'owner.PM', name: 'Project Management', mcpEnabled: true },
  { id: 11, key: 'ITP', ref: 'owner.ITP', name: 'ItsAPlan Core', mcpEnabled: false },
];

const SAMPLE_AGENTS: AiAgent[] = [
  {
    id: 101,
    teamId: 1,
    projects: [{ id: 10, key: 'PM', ref: 'owner.PM', name: 'Project Management' }],
    userId: 'bot-agy',
    name: 'Antigravity Coordinator',
    username: 'antigravity',
    kind: 'internal',
    modelCredentialId: 1,
    model: 'gemini-4',
    instructions: 'Coordinate waves',
    tools: ['read_issue'],
    temperature: 0.2,
    maxSteps: 10,
    memoryEnabled: true,
    memoryLastMessages: 20,
    triggerOnMention: true,
    triggerOnAssign: true,
    fieldTriggers: [],
    delegationDelaySec: 0,
    ownerUserId: 'u1',
    runnerScope: 'team',
    lastSeenAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    apiKeyStart: null,
    modelProvider: 'google',
    actionCount: 5,
    skillCount: 3,
    toolCount: 2,
  },
  {
    id: 102,
    teamId: 1,
    projects: [],
    userId: 'bot-qa',
    name: 'QualityGate Verifier',
    username: 'qualitygate',
    kind: 'external',
    modelCredentialId: null,
    model: null,
    instructions: null,
    tools: [],
    temperature: null,
    maxSteps: null,
    memoryEnabled: false,
    memoryLastMessages: null,
    triggerOnMention: false,
    triggerOnAssign: true,
    fieldTriggers: [],
    delegationDelaySec: 0,
    ownerUserId: 'u1',
    runnerScope: 'team',
    lastSeenAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    apiKeyStart: 'itp_123',
    modelProvider: null,
    actionCount: 2,
    skillCount: 1,
    toolCount: 0,
  },
];

const SAMPLE_SKILLS: AgentSkill[] = [
  {
    id: 501,
    teamId: 1,
    name: 'TaskManager',
    description: 'Kahn DAG and 7-phase lifecycle governance',
    source: 'inline',
    sourceUrl: null,
    files: [],
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const SAMPLE_TOOLS: ConfiguredTool[] = [
  {
    id: 601,
    teamId: 1,
    toolKey: 'github.create_pull_request',
    credentialId: 7,
    integrationKey: 'github',
    credentialLabel: 'Org GitHub App',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const replacedGlobals = [
  'window',
  'document',
  'navigator',
  'Node',
  'NodeFilter',
  'DocumentFragment',
  'Element',
  'HTMLElement',
  'HTMLInputElement',
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

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  assert.ok(setter, 'HTMLInputElement.value setter missing');
  setter.call(input, value);
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
}

describe('TeamCapabilitiesSection', () => {
  beforeEach(async () => {
    originalDescriptors = new Map(
      replacedGlobals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
    );
    dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
      url: 'http://localhost:3001/thanb/settings/capabilities',
    });
    (dom.window as unknown as Window).__ITSAPLAN_ENV__ = {
      apiUrl: 'http://api.test',
      privacyUrl: '',
      termsUrl: '',
    };

    for (const name of replacedGlobals) {
      if (name === 'IS_REACT_ACT_ENVIRONMENT') {
        Object.defineProperty(globalThis, name, { configurable: true, value: true });
      } else if (name === 'fetch') {
        Object.defineProperty(globalThis, name, {
          configurable: true,
          value: async () => Response.json([]),
        });
      } else if (name === 'requestAnimationFrame') {
        Object.defineProperty(globalThis, name, {
          configurable: true,
          value: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
        });
      } else if (name === 'cancelAnimationFrame') {
        Object.defineProperty(globalThis, name, {
          configurable: true,
          value: (id: number) => clearTimeout(id),
        });
      } else {
        const winVal = (dom.window as unknown as Record<string, unknown>)[name];
        if (winVal !== undefined) {
          Object.defineProperty(globalThis, name, {
            configurable: true,
            value:
              typeof winVal === 'function' && !winVal.prototype
                ? winVal.bind(dom.window)
                : winVal,
          });
        }
      }
    }

    client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    const { createRoot } = await import('react-dom/client');
    root = createRoot(document.getElementById('root')!);
  });

  afterEach(async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    act(() => root.unmount());
    client.clear();
    dom.window.close();
    for (const [name, descriptor] of originalDescriptors) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  });

  async function renderCapabilities(team: Team, permissions: Permissions) {
    const detail: TeamDetail = { ...team, permissions, leads: [] };
    client.setQueryData(qk.teams, [team]);
    client.setQueryData(qk.team(team.id), detail);
    client.setQueryData(qk.companySettings, SAMPLE_COMPANY);
    client.setQueryData(qk.teamProjectOptions(team.id), SAMPLE_PROJECTS);
    if (permissions.ai_agents.read) {
      client.setQueryData(qk.aiAgents(team.id), SAMPLE_AGENTS);
    }
    if (permissions.agent_skills.read) {
      client.setQueryData(qk.agentSkillOptions(team.id), SAMPLE_SKILLS);
    }
    if (permissions.agent_tools.read) {
      client.setQueryData(qk.configuredToolOptions(team.id), SAMPLE_TOOLS);
    }
    if (permissions.agent_tools.create) {
      client.setQueryData(qk.integrationCatalog(team.id), []);
    }

    const router: AppRouterInstance = {
      back: () => {},
      forward: () => {},
      refresh: () => {},
      push: () => {},
      replace: () => {},
      prefetch: () => {},
      bfcacheId: 'test',
    };

    const { default: TeamCapabilitiesSection } = await import('./TeamCapabilitiesSection');
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={router}>
          <QueryClientProvider client={client}>
            <NextIntlClientProvider
              locale="en"
              messages={{ common, teams: teamsMessages }}
              timeZone="UTC"
            >
              <TeamCapabilitiesSection teamId={team.id} />
            </NextIntlClientProvider>
          </QueryClientProvider>
        </AppRouterContext.Provider>,
      );
    });
  }

  it('renders KPI strip, maps agents onto projects, switches tabs, and filters rows by search', async () => {
    await renderCapabilities(makeTeam({ role: 'owner' }), buildPermissions(true));

    const companyKpi = document.querySelector('[data-testid="capabilities-kpi-company"]');
    assert.ok(companyKpi?.textContent?.includes('Accord Enterprise'));
    assert.ok(companyKpi?.textContent?.includes('TIER_2'));

    const pmRow = document.querySelector('[data-testid="capabilities-project-row-PM"]');
    const itpRow = document.querySelector('[data-testid="capabilities-project-row-ITP"]');
    assert.ok(pmRow?.textContent?.includes('@antigravity'));
    assert.ok(pmRow?.textContent?.includes('3 skills · 2 tools'));
    assert.ok(itpRow?.textContent?.includes('No agents attached'));

    const searchInput = document.querySelector<HTMLInputElement>('input');
    assert.ok(searchInput);
    await act(async () => {
      setInputValue(searchInput, 'ITP');
    });
    assert.equal(document.querySelector('[data-testid="capabilities-project-row-PM"]'), null);
    assert.ok(document.querySelector('[data-testid="capabilities-project-row-ITP"]'));

    await act(async () => {
      setInputValue(searchInput, '');
    });

    await act(async () => {
      document.querySelector<HTMLButtonElement>('[data-testid="capabilities-tab-agents"]')?.click();
    });
    assert.ok(document.querySelector('[data-testid="capabilities-agent-row-antigravity"]'));
    assert.ok(document.querySelector('[data-testid="capabilities-agent-row-qualitygate"]'));

    await act(async () => {
      document.querySelector<HTMLButtonElement>('[data-testid="capabilities-tab-library"]')?.click();
    });
    assert.ok(document.body.textContent?.includes('TaskManager'));
    assert.ok(document.body.textContent?.includes('github.create_pull_request'));
  });

  it('omits mutation buttons for read-only members while displaying read-only values', async () => {
    const readOnlyPerms = buildPermissions(false, {
      ai_agents: { create: false, edit: false, read: true, delete: false },
      agent_skills: { create: false, edit: false, read: true, delete: false },
      agent_tools: { create: false, edit: false, read: true, delete: false },
    });
    await renderCapabilities(makeTeam({ role: 'member' }), readOnlyPerms);

    const buttonTexts = [...document.querySelectorAll('button')].map((b) =>
      b.textContent?.trim(),
    );
    assert.equal(buttonTexts.includes(teamsMessages.panel.newProject), false);
    assert.equal(buttonTexts.includes(teamsMessages.agents.newAgent), false);
    assert.equal(buttonTexts.includes(teamsMessages.skills.newSkill), false);
    assert.equal(buttonTexts.includes(teamsMessages.tools.add), false);

    const pmRow = document.querySelector('[data-testid="capabilities-project-row-PM"]');
    assert.ok(pmRow?.textContent?.includes('@antigravity'));
    // Read-only agent badge is not an editable button
    const agentButtonsInPmRow = [...(pmRow?.querySelectorAll('button') ?? [])].filter((b) =>
      b.textContent?.includes('@antigravity'),
    );
    assert.equal(agentButtonsInPmRow.length, 0);
  });
});
