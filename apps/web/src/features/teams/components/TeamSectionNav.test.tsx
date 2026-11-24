import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { JSDOM } from 'jsdom';
import type { Permissions, PermissionResource, ResourcePermissions } from '@/lib/api/endpoints/roles';
import type { Team, TeamDetail } from '@/lib/api/endpoints/teams';
import { qk } from '@/services/queryKeys';
import teamsMessages from '../../../../messages/en/teams.json';

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
    ...overrides,
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

describe('TeamSectionNav', () => {
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
          value: async () => Response.json({}),
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

  async function renderNav(team: Team, permissions: Permissions) {
    const detail: TeamDetail = { ...team, permissions, leads: [] };
    client.setQueryData(qk.team(team.id), detail);
    const { default: TeamSectionNav } = await import('./TeamSectionNav');
    await act(async () => {
      root.render(
        <PathnameContext.Provider value="/thanb/settings/capabilities">
          <QueryClientProvider client={client}>
            <NextIntlClientProvider
              locale="en"
              messages={{ teams: teamsMessages }}
              timeZone="UTC"
            >
              <TeamSectionNav team={team} />
            </NextIntlClientProvider>
          </QueryClientProvider>
        </PathnameContext.Provider>,
      );
    });
  }

  it('renders all 3 always-visible navigation groups for an owner without requiring accordion expansion', async () => {
    const team = makeTeam({ role: 'owner' });
    await renderNav(team, buildPermissions(true));

    const links = [...document.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    for (const expected of [
      '/thanb/settings/capabilities',
      '/thanb/settings/projects',
      '/thanb/settings/org-chart',
      '/thanb/settings/roles',
      '/thanb/settings/members',
      '/thanb/settings',
      '/thanb/settings/ai-agents',
      '/thanb/settings/agent-skills',
      '/thanb/settings/agent-tools',
      '/thanb/settings/mcp',
      '/thanb/settings/integrations',
      '/thanb/settings/git',
      '/thanb/settings/notifications',
    ]) {
      assert.ok(links.includes(expected), `Expected link ${expected} to be visible`);
    }

    const activeLink = document.querySelector('a[aria-current="page"]');
    assert.equal(activeLink?.getAttribute('href'), '/thanb/settings/capabilities');

    const mcpLink = document.querySelector('a[href="/thanb/settings/mcp"]');
    assert.ok(mcpLink?.textContent?.includes('1/3'), 'Expected MCP nav badge to show 1/3');
  });

  it('hides restricted owner/manager sections and denied AI sections for a plain member', async () => {
    const team = makeTeam({ role: 'member' });
    const perms = buildPermissions(false, {
      work_items: { create: true, edit: true, read: true, delete: false },
    });
    await renderNav(team, perms);

    const links = [...document.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    assert.ok(links.includes('/thanb/settings/capabilities'));
    assert.ok(links.includes('/thanb/settings/projects'));
    assert.ok(links.includes('/thanb/settings/mcp'));
    assert.equal(links.includes('/thanb/settings/roles'), false);
    assert.equal(links.includes('/thanb/settings/git'), false);
    assert.equal(links.includes('/thanb/settings/notifications'), false);
    assert.equal(links.includes('/thanb/settings/ai-agents'), false);
    assert.equal(links.includes('/thanb/settings/agent-skills'), false);
    assert.equal(links.includes('/thanb/settings/agent-tools'), false);
    assert.equal(links.includes('/thanb/settings/integrations'), false);
  });
});
