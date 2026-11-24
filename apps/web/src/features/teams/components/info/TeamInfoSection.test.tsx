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
import type { Team, TeamDetail } from '@/lib/api/endpoints/teams';
import type { Permissions } from '@/lib/api/endpoints/roles';
import { qk } from '@/services/queryKeys';
import common from '../../../../../messages/en/common.json';
import teamsMessages from '../../../../../messages/en/teams.json';

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

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 1,
    name: 'Design',
    slug: null,
    ref: '1',
    mcpEnabled: false,
    role: 'owner',
    source: 'invite',
    joinedAt: '2026-01-01T00:00:00Z',
    projectCount: 2,
    memberCount: 3,
    ownerCount: 2,
    roleCount: 1,
    integrationCount: 0,
    agentCount: 0,
    skillCount: 0,
    toolCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeDetail(team: Team): TeamDetail {
  return {
    ...team,
    permissions: {} as Permissions,
    leads: [
      {
        userId: 'u1',
        name: 'Alice',
        email: 'alice@example.com',
        image: null,
        role: 'owner',
      },
    ],
  };
}

let dom: JSDOM;
let root: Root;
let client: QueryClient;
let replacedPaths: string[];
let patchCalls: { url: string; body: Record<string, unknown> }[];
let originalDescriptors: Map<string, PropertyDescriptor | undefined>;

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  assert.ok(setter, 'HTMLInputElement.value setter missing');
  setter.call(input, value);
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
}

function saveButton(): HTMLButtonElement | undefined {
  return [...document.querySelectorAll('button')].find(
    (btn) => btn.textContent?.trim() === common.save,
  );
}

describe('TeamInfoSection', () => {
  beforeEach(async () => {
    replacedPaths = [];
    patchCalls = [];
    originalDescriptors = new Map(
      replacedGlobals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
    );

    dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
      url: 'http://localhost:3001/1/settings',
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
          value: async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = typeof input === 'string' ? input : input.toString();
            const method = (init?.method ?? 'GET').toUpperCase();
            if (method === 'PATCH' && url.endsWith('/teams/1')) {
              const body = JSON.parse(String(init?.body ?? '{}')) as {
                name?: string;
                slug?: string;
              };
              patchCalls.push({ url, body });
              const existing =
                client.getQueryData<Team[]>(qk.teams)?.find((t) => t.id === 1) ?? makeTeam();
              const nextSlug = body.slug !== undefined ? body.slug : existing.slug;
              const updated: Team = {
                ...existing,
                name: body.name ?? existing.name,
                slug: nextSlug,
                ref: nextSlug ?? String(existing.id),
              };
              return Response.json(updated);
            }
            const current =
              client.getQueryData<Team[]>(qk.teams)?.find((t) => t.id === 1) ?? makeTeam();
            if (url.endsWith('/teams')) return Response.json([current]);
            if (url.endsWith('/teams/1')) return Response.json(makeDetail(current));
            return Response.json({});
          },
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
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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

  async function renderSection(initialTeam: Team) {
    client.setQueryData<Team[]>(qk.teams, [initialTeam]);
    client.setQueryData<TeamDetail>(qk.team(initialTeam.id), makeDetail(initialTeam));

    const router: AppRouterInstance = {
      back: () => {},
      forward: () => {},
      refresh: () => {},
      push: () => {},
      replace: (href: string) => {
        replacedPaths.push(href);
      },
      prefetch: () => {},
      bfcacheId: 'test',
    };

    const { default: TeamInfoSection } = await import('./TeamInfoSection');
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={router}>
          <QueryClientProvider client={client}>
            <NextIntlClientProvider
              locale="en"
              messages={{ common, teams: teamsMessages }}
              timeZone="UTC"
            >
              <TeamInfoSection teamId={initialTeam.id} />
            </NextIntlClientProvider>
          </QueryClientProvider>
        </AppRouterContext.Provider>,
      );
    });
  }

  it('requires a valid slug before saving a pre-slug team and navigates to the new slug ref', async () => {
    await renderSection(makeTeam({ slug: null, ref: '1', name: 'Design' }));

    const nameInput = document.querySelector<HTMLInputElement>('#team-name');
    const slugInput = document.querySelector<HTMLInputElement>('#team-slug');
    assert.ok(nameInput, 'Expected #team-name input for owner');
    assert.ok(slugInput, 'Expected #team-slug input for owner');
    assert.equal(nameInput.value, 'Design');
    assert.equal(slugInput.value, '');

    const btn = saveButton();
    assert.ok(btn, 'Expected Save button for owner');
    assert.equal(btn.disabled, true);

    // Renaming without setting a slug on a pre-slug team must stay disabled
    await act(async () => {
      setInputValue(nameInput, 'Growth');
    });
    assert.equal(saveButton()!.disabled, true);

    // Invalid slug shows error message and stays disabled
    await act(async () => {
      setInputValue(slugInput, '1bad');
    });
    assert.equal(slugInput.getAttribute('aria-invalid'), 'true');
    assert.match(document.body.textContent ?? '', /Use 2–40 lowercase letters/);
    assert.equal(saveButton()!.disabled, true);

    // Valid slug enables save, patches both name and slug, and replaces route with /growth/settings
    await act(async () => {
      setInputValue(slugInput, 'growth');
    });
    assert.equal(slugInput.getAttribute('aria-invalid'), 'false');
    assert.equal(saveButton()!.disabled, false);

    await act(async () => {
      saveButton()!.click();
    });
    for (let i = 0; i < 50 && (patchCalls.length === 0 || replacedPaths.length === 0); i++) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
    }

    assert.equal(patchCalls.length, 1);
    assert.deepEqual(patchCalls[0].body, { name: 'Growth', slug: 'growth' });
    assert.deepEqual(replacedPaths, ['/growth/settings']);
    assert.equal(client.getQueryData<Team[]>(qk.teams)?.[0].ref, 'growth');
  });

  it('updates only the name when an already-slugged team keeps its slug', async () => {
    await renderSection(makeTeam({ slug: 'acme', ref: 'acme', name: 'Acme' }));

    const nameInput = document.querySelector<HTMLInputElement>('#team-name');
    const slugInput = document.querySelector<HTMLInputElement>('#team-slug');
    assert.ok(nameInput);
    assert.ok(slugInput);
    assert.equal(slugInput.value, 'acme');

    await act(async () => {
      setInputValue(nameInput, 'Acme Labs');
    });
    assert.equal(saveButton()!.disabled, false);

    await act(async () => {
      saveButton()!.click();
    });
    for (let i = 0; i < 50 && patchCalls.length === 0; i++) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
    }

    assert.equal(patchCalls.length, 1);
    assert.deepEqual(patchCalls[0].body, { name: 'Acme Labs' });
    assert.deepEqual(replacedPaths, []);
  });

  it('renders read-only team details without edit inputs for a non-owner member', async () => {
    await renderSection(makeTeam({ role: 'member', slug: 'acme', ref: 'acme', name: 'Acme' }));

    assert.equal(document.querySelector('#team-name'), null);
    assert.equal(document.querySelector('#team-slug'), null);
    assert.equal(saveButton(), undefined);
    assert.match(document.body.textContent ?? '', /Acme/);
    assert.match(document.body.textContent ?? '', /\/acme/);
  });
});
