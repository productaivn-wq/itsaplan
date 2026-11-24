import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { JSDOM } from 'jsdom';
import {
  AppRouterContext,
  type AppRouterInstance,
} from 'next/dist/shared/lib/app-router-context.shared-runtime';

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

const dummyRouter: AppRouterInstance = {
  back: () => {},
  forward: () => {},
  refresh: () => {},
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  bfcacheId: 'test',
};

const replacedGlobals = [
  'window',
  'document',
  'navigator',
  'Node',
  'NodeFilter',
  'Element',
  'HTMLElement',
  'HTMLButtonElement',
  'HTMLInputElement',
  'HTMLSelectElement',
  'CustomEvent',
  'Event',
  'KeyboardEvent',
  'MouseEvent',
  'localStorage',
  'sessionStorage',
  'fetch',
] as const;

let prevGlobals: Partial<Record<(typeof replacedGlobals)[number], unknown>> = {};
let prevHostVibe: string | undefined;
let prevApiUrl: string | undefined;
let root: Root | null = null;
let container: HTMLDivElement | null = null;

function installDom(): JSDOM {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://127.0.0.1:3001/thanb/PM/directory',
  });
  for (const key of replacedGlobals) {
    prevGlobals[key] = (globalThis as Record<string, unknown>)[key];
  }
  prevHostVibe = process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE;
  prevApiUrl = process.env.NEXT_PUBLIC_API_URL;
  process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE = 'true';
  process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
  (dom.window as unknown as { __ITSAPLAN_ENV__?: unknown }).__ITSAPLAN_ENV__ = {
    apiUrl: 'http://api.test',
    privacyUrl: '',
    termsUrl: '',
    hostVibeEnabled: true,
  };
  (globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    Node: dom.window.Node,
    NodeFilter: dom.window.NodeFilter,
    Element: dom.window.Element,
    HTMLElement: dom.window.HTMLElement,
    HTMLButtonElement: dom.window.HTMLButtonElement,
    HTMLInputElement: dom.window.HTMLInputElement,
    HTMLSelectElement: dom.window.HTMLSelectElement,
    CustomEvent: dom.window.CustomEvent,
    Event: dom.window.Event,
    KeyboardEvent: dom.window.KeyboardEvent,
    MouseEvent: dom.window.MouseEvent,
    localStorage: dom.window.localStorage,
    sessionStorage: dom.window.sessionStorage,
  });
  return dom;
}

async function flushEffects() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 30));
  });
}

describe('ProjectDirectoryView', () => {
  beforeEach(() => {
    installDom();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount();
      });
      root = null;
    }
    container?.remove();
    container = null;
    for (const key of replacedGlobals) {
      const prev = prevGlobals[key];
      if (prev === undefined) {
        delete (globalThis as Record<string, unknown>)[key];
      } else {
        (globalThis as Record<string, unknown>)[key] = prev;
      }
    }
    prevGlobals = {};
    if (prevHostVibe === undefined) delete process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE;
    else process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE = prevHostVibe;
    if (prevApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = prevApiUrl;
  });

  it('supports All Projects scope, Vault masking, Inbox Sync registration, Muted unmute, and Sync Now', async () => {
    const fetchCalls: Array<{ url: string; method: string; body?: string }> = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = (init?.method ?? 'GET').toUpperCase();
      fetchCalls.push({ url, method, body: typeof init?.body === 'string' ? init.body : undefined });

      if (url.includes('/directory/inbox-sync')) {
        return new Response(
          JSON.stringify({
            inbox_activity_by_channel: {},
            inbox_activity_by_contact: {},
            discovered_channels: [
              {
                key: 'telegram:New Lead',
                platform: 'telegram',
                channel_name: 'New Lead',
                target_handle: 'New Lead',
                suggested_project_key: 'PM',
                message_count: 3,
                last_message_at: '2026-11-24T01:00:00Z',
                sample_preview: 'Hello',
                sample_senders: ['New Lead'],
              },
            ],
            discovered_contacts: [
              {
                key: 'zalo:Huong',
                sender: 'Huong',
                platform: 'zalo',
                channel_name: 'GenAct Mentor | A Phương x Loom for Women',
                channel_id: 'CH-OFF-ZALO-LOOM',
                target_handle: '4984939793912401095',
                suggested_project_key: 'GSA',
                message_count: 7,
                last_message_at: '2026-11-24T01:00:00Z',
                sample_preview: 'Em gửi link ạ',
              },
            ],
            muted_channels: [
              {
                channel_key: 'bon',
                channel_platform: 'zalo',
                display_name: 'Bon',
                reason: 'PERSONAL_EXCLUDED',
                muted_at: '2026-11-23T09:34:27Z',
              },
            ],
            available_projects: [
              { key: 'PM', name: 'Project Management' },
              { key: 'GSA', name: 'GenAct' },
            ],
            sync_status: {
              last_synced_at: '2026-11-24T04:00:00Z',
              total_inbox_comms: 68,
              linked_comms: 62,
              linked_pct: 91.2,
              unlinked_contacts_count: 1,
              unregistered_channels_count: 1,
              muted_channels_count: 1,
              suppressed_noise_count: 27,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.includes('/directory') && method === 'GET') {
        const isAll = url.includes('scope=all');
        return new Response(
          JSON.stringify({
            scope: isAll ? 'all' : 'project',
            contacts: [
              {
                id: 1,
                projectId: 1,
                externalKey: 'CON-001',
                name: 'Workspace Owner',
                role: 'Lead',
                raciRole: 'ACCOUNTABLE',
                orgId: 'ORG-PRODUCTAI',
                lifecycleStage: 'ACTIVE_CLIENT',
                primaryEmail: 'vault://itsaplan/CONTACTS_REGISTRY_JSON#CON-001.primary_email',
                phone: 'vault://itsaplan/CONTACTS_REGISTRY_JSON#CON-001.phone',
                channelHandles: { telegram: { direct: '@thanb' } },
                source: 'hub_yaml',
                projectKey: 'PM',
              },
              ...(isAll
                ? [
                    {
                      id: 2,
                      projectId: 2,
                      externalKey: 'CON-002',
                      name: 'A. Tuấn - Chuyển Đổi Số',
                      role: 'Advisor',
                      raciRole: 'ACCOUNTABLE',
                      orgId: 'ORG-FBU',
                      lifecycleStage: 'STRATEGIC_PARTNER',
                      primaryEmail: '',
                      phone: '',
                      channelHandles: {},
                      source: 'hub_yaml',
                      projectKey: 'ESR',
                    },
                  ]
                : []),
            ],
            channels: [
              {
                id: 1,
                projectId: 1,
                channelId: 'CH-PRIV-TG-THANB',
                platform: 'telegram',
                threadType: 'USER_DM',
                displayName: 'Than B Direct Telegram',
                targetId: '@thanb',
                aliases: ['@thanb'],
                status: 'ACTIVE',
                lastSyncedAt: '2026-11-24T00:00:00Z',
                projectKey: 'PM',
              },
            ],
            counts: { contacts: isAll ? 2 : 1, channels: 1 },
            portfolioCounts: { contacts: 2, channels: 1, projects: 2 },
            projects: [
              { id: 1, key: 'PM', name: 'Project Management', ref: 'owner.PM', contactsCount: 1, channelsCount: 1 },
              { id: 2, key: 'ESR', name: 'Eureka', ref: 'thanb.ESR', contactsCount: 1, channelsCount: 0 },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.includes('/api/vibe/directory/') && method === 'POST') {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;

    const { createRoot } = await import('react-dom/client');
    const { default: ProjectDirectoryView } = await import('./ProjectDirectoryView');
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <QueryClientProvider client={qc}>
            <NextIntlClientProvider locale="en" messages={ALL_EN_MESSAGES}>
              <ProjectDirectoryView projectKey="owner.PM" />
            </NextIntlClientProvider>
          </QueryClientProvider>
        </AppRouterContext.Provider>,
      );
    });
    await flushEffects();

    // Vault masking verified
    const text = document.body.textContent ?? '';
    assert.ok(text.includes('Protected (Vault)'));
    assert.equal(text.includes('vault://'), false);

    // Switch to All Projects scope
    const allBtn = document.querySelector<HTMLButtonElement>('[data-testid="btn-directory-scope-all"]');
    assert.ok(allBtn);
    await act(async () => {
      allBtn.click();
    });
    await flushEffects();
    assert.ok((document.body.textContent ?? '').includes('A. Tuấn - Chuyển Đổi Số'));

    // Click Inbox Sync tab & register discovered channel
    const syncTab = document.querySelector<HTMLButtonElement>('[data-testid="tab-directory-inbox_sync"]');
    assert.ok(syncTab);
    await act(async () => {
      syncTab.click();
    });
    await flushEffects();

    const regBtn = document.querySelector<HTMLButtonElement>('[data-testid="btn-register-channel-telegram:New Lead"]');
    assert.ok(regBtn);
    await act(async () => {
      regBtn.click();
    });
    await flushEffects();
    assert.ok(fetchCalls.some((c) => c.url.includes('/api/vibe/directory/channels/upsert') && c.method === 'POST'));

    // Click Muted tab & unmute
    const mutedTab = document.querySelector<HTMLButtonElement>('[data-testid="tab-directory-muted"]');
    assert.ok(mutedTab);
    await act(async () => {
      mutedTab.click();
    });
    await flushEffects();
    const unmuteBtn = document.querySelector<HTMLButtonElement>('[data-testid="btn-unmute-bon"]');
    assert.ok(unmuteBtn);
    await act(async () => {
      unmuteBtn.click();
    });
    await flushEffects();
    assert.ok(fetchCalls.some((c) => c.url.includes('/api/vibe/directory/channels/unmute') && c.method === 'POST'));

    // Click Sync Now
    const syncNowBtn = document.querySelector<HTMLButtonElement>('[data-testid="btn-directory-sync-now"]');
    assert.ok(syncNowBtn);
    await act(async () => {
      syncNowBtn.click();
    });
    await flushEffects();
    assert.ok(fetchCalls.some((c) => c.url.includes('/api/vibe/directory/sync') && c.method === 'POST'));
  });
});
