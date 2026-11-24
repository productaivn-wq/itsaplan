import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { JSDOM } from 'jsdom';
import type { Project } from '@/lib/api/endpoints/projects';
import type { ShellRoute } from '@/hooks/useShellRoute';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const EN_DIR = path.resolve(TEST_DIR, '../../../messages/en');
const ALL_EN_MESSAGES = Object.fromEntries(
  fs
    .readdirSync(EN_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => [
      file.replace(/\.json$/, ''),
      JSON.parse(fs.readFileSync(path.join(EN_DIR, file), 'utf-8')) as Record<string, unknown>,
    ]),
);

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
  'HTMLSelectElement',
  'HTMLButtonElement',
  'SVGElement',
  'Event',
  'CustomEvent',
  'MutationObserver',
  'ResizeObserver',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'localStorage',
  'fetch',
  'IS_REACT_ACT_ENVIRONMENT',
] as const;

const TEST_PROJECTS: Project[] = [
  {
    id: 53,
    teamId: 1,
    teamName: 'ThanB',
    teamRef: 'thanb',
    key: 'PM',
    ref: 'owner.PM',
    name: 'Project Management',
    description: '',
    mcpEnabled: true,
    teamMcpEnabled: true,
    initiativesEnabled: true,
    dashboardsEnabled: true,
    documentsEnabled: true,
    notesEnabled: true,
    cyclesEnabled: true,
    subtasksEnabled: true,
    checklistsEnabled: true,
    issueStatsEnabled: true,
    availableFeatures: [],
    pointsEstimateEnabled: false,
    timeEstimateEnabled: false,
    timeLoggingEnabled: false,
    createdAt: '2026-11-01T00:00:00Z',
  },
];

let dom: JSDOM;
let root: Root;
let client: QueryClient;
let originalGlobalDescriptors: Map<string, PropertyDescriptor | undefined>;
let prevHostVibe: string | undefined;

beforeEach(async () => {
  prevHostVibe = process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE;
  process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE = 'true';
  originalGlobalDescriptors = new Map(
    replacedGlobals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
  );

  dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'https://example.test/thanb/PM/inbox',
    pretendToBeVisual: true,
  });

  Object.defineProperty(dom.window, '__ITSAPLAN_ENV__', {
    configurable: true,
    value: { apiUrl: 'http://api.test', privacyUrl: '', termsUrl: '' },
  });
  Object.defineProperty(dom.window, 'matchMedia', {
    configurable: true,
    value: () => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  Object.defineProperty(dom.window, 'ResizeObserver', {
    configurable: true,
    value: class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });

  for (const name of replacedGlobals) {
    if (name in dom.window) {
      Object.defineProperty(globalThis, name, {
        configurable: true,
        value: dom.window[name as keyof typeof dom.window],
      });
    }
  }
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
    configurable: true,
    value: true,
  });

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('/notifications/unread')) {
      return new Response(JSON.stringify({ unread: 1 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as unknown as typeof fetch;

  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const { createRoot } = await import('react-dom/client');
  const el = document.querySelector('#root');
  assert.ok(el);
  root = createRoot(el);
});

afterEach(async () => {
  await client.cancelQueries();
  await act(async () => {
    root.unmount();
  });
  await new Promise((resolve) => setTimeout(resolve, 50));
  client.clear();
  dom.window.close();
  for (const [name, descriptor] of originalGlobalDescriptors) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
  if (prevHostVibe === undefined) delete process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE;
  else process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE = prevHostVibe;
});

describe('Shell chrome cognitive-load reductions', () => {
  it('renders ShellHeaderTitle cleanly without permanent header-jtbd-context-hint', async () => {
    const { default: ShellHeaderTitle } = await import('./ShellHeaderTitle');
    const route: ShellRoute = {
      projectKey: 'owner.PM',
      sub: 'inbox',
      section: null,
      aiTeamSection: null,
      routeIssueSeq: null,
      routeInitiativeId: null,
      routeCycleId: null,
      activeViewId: null,
      onBoard: false,
    };

    await act(async () => {
      root.render(
        <NextIntlClientProvider locale="en" messages={ALL_EN_MESSAGES} timeZone="UTC">
          <ShellHeaderTitle
            route={route}
            projectName="Project Management"
            issueIdentifier={null}
            issueParent={null}
          />
        </NextIntlClientProvider>,
      );
    });

    assert.equal(
      document.querySelector('[data-testid="shell-header-title-text"]')?.textContent?.trim(),
      'Inbox',
    );
    assert.equal(document.querySelector('[data-testid="header-jtbd-context-hint"]'), null);
  });

  it('consolidates AppSidebar into 2 balanced groups (Workspace and System) with Inbox first and Vault in System', async () => {
    const { SyncProvider } = await import('@/context/syncContext');
    const { RelativeTimeProvider } = await import('@/context/relativeTimeContext');
    const { SidebarProvider } = await import('@/components/ui/sidebar');
    const { TooltipProvider } = await import('@/components/ui/tooltip');
    const { default: AppSidebar } = await import('./AppSidebar');

    await act(async () => {
      root.render(
        <PathnameContext.Provider value="/thanb/PM/inbox">
          <QueryClientProvider client={client}>
            <SyncProvider>
              <NextIntlClientProvider locale="en" messages={ALL_EN_MESSAGES} timeZone="UTC">
                <RelativeTimeProvider>
                  <TooltipProvider>
                    <SidebarProvider defaultOpen={true}>
                      <AppSidebar
                        projects={TEST_PROJECTS}
                        currentProjectKey="owner.PM"
                        onSelectProject={() => {}}
                      />
                    </SidebarProvider>
                  </TooltipProvider>
                </RelativeTimeProvider>
              </NextIntlClientProvider>
            </SyncProvider>
          </QueryClientProvider>
        </PathnameContext.Provider>,
      );
    });

    const groupLabels = Array.from(
      document.querySelectorAll('[data-slot="sidebar-group-label"]'),
    ).map((el) => el.textContent?.trim());
    assert.deepEqual(groupLabels, ['Workspace', 'System']);

    const groups = Array.from(document.querySelectorAll('[data-slot="sidebar-group"]'));
    assert.equal(groups.length, 2);

    const workspaceLinks = Array.from(groups[0]!.querySelectorAll('a')).map((a) =>
      a.textContent?.replace(/\d+$/, '').trim(),
    );
    assert.deepEqual(workspaceLinks, ['Inbox', 'Operations', 'Docs', 'AI Workspace']);

    const systemLinks = Array.from(groups[1]!.querySelectorAll('a')).map((a) =>
      a.textContent?.trim(),
    );
    assert.deepEqual(systemLinks, ['AI Agents', 'Directory', 'Control Plane', 'Secret Vault']);

    const footerLinks = document.querySelectorAll('[data-slot="sidebar-footer"] a');
    assert.equal(footerLinks.length, 0);
  });
});
