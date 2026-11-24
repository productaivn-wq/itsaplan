import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { afterEach, describe, it } from 'node:test';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import {
  defaultViewSettings,
  normalizeSavedDisplay,
  normalizeViewSettings,
} from './viewSettings';
import enNav from '../../messages/en/nav.json';
import enDisplay from '../../messages/en/display.json';

describe('Unified Operations Hub & Kanban retirement', () => {
  let dom: JSDOM | null = null;
  let root: Root | null = null;
  let originalGlobals: Map<string, PropertyDescriptor | undefined> | null = null;

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount();
      });
      root = null;
    }
    if (originalGlobals) {
      for (const [k, d] of originalGlobals) {
        if (d) Object.defineProperty(globalThis, k, d);
        else delete (globalThis as Record<string, unknown>)[k];
      }
      originalGlobals = null;
    }
    dom?.window.close();
    dom = null;
  });

  function setupDom() {
    dom = new JSDOM('<div id="root"></div>', { url: 'https://itsaplan.test/thanb/PM' });
    (dom.window as unknown as Record<string, unknown>).__ITSAPLAN_ENV__ = {
      apiUrl: 'http://api.test',
      privacyUrl: '',
      termsUrl: '',
    };
    const globals = {
      window: dom.window,
      document: dom.window.document,
      navigator: dom.window.navigator,
      localStorage: dom.window.localStorage,
      Node: dom.window.Node,
      Element: dom.window.Element,
      HTMLElement: dom.window.HTMLElement,
      IS_REACT_ACT_ENVIRONMENT: true,
    };
    originalGlobals = new Map(
      Object.keys(globals).map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]),
    );
    for (const [k, v] of Object.entries(globals)) {
      Object.defineProperty(globalThis, k, { configurable: true, value: v });
    }
    root = createRoot(dom.window.document.getElementById('root')!);
    return dom.window.document;
  }

  it('normalizes legacy kanban saved display to table and enriches table columns', () => {
    const migrated = normalizeSavedDisplay({ layout: 'kanban', group: 'cycle' });
    assert.equal(migrated.layout, 'table');
    assert.equal(migrated.group, 'cycle');

    const tableDefaults = defaultViewSettings('table');
    assert.ok(
      tableDefaults.properties.length <= 5,
      'Table defaults must obey Rule of 6 (Title + <= 5 properties)',
    );
    assert.ok(tableDefaults.properties.includes('initiative'));
    assert.ok(tableDefaults.properties.includes('cycle'));
    assert.ok(tableDefaults.properties.includes('delegate'));

    const normalized = normalizeViewSettings(undefined, 'table');
    assert.equal(normalized.group, 'status');
  });

  it('omits kanban tab from DisplayLayoutTabs', async () => {
    const doc = setupDom();
    const prevFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/get-session')) {
        return new Response('null', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch;
    const { spyOn } = createRequire(import.meta.url)('bun:test') as {
      spyOn: (
        target: object,
        method: string,
      ) => { mockImplementation: (impl: () => unknown) => { mockRestore: () => void } };
    };
    const auth = await import('@/lib/auth-client');
    const sessionSpy = spyOn(auth, 'useSession').mockImplementation(() => ({
      data: null,
      isPending: false,
      isRefetching: false,
      error: null,
      refetch: async () => ({}),
    }));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    try {
      const { default: DisplayLayoutTabs } = await import('../components/layout/DisplayLayoutTabs');
      const { HotkeysProvider } = await import('../context/useHotkeys');
      await act(async () => {
        root!.render(
          <QueryClientProvider client={qc}>
            <NextIntlClientProvider locale="en" timeZone="UTC" messages={{ display: enDisplay }}>
              <HotkeysProvider>
                <DisplayLayoutTabs view="table" onViewChange={() => {}} />
              </HotkeysProvider>
            </NextIntlClientProvider>
          </QueryClientProvider>,
        );
      });
      const text = doc.body.textContent ?? '';
      assert.equal(text.toLowerCase().includes('kanban'), false);
      assert.equal(text.toLowerCase().includes('board'), false);
      assert.ok(text.includes('Table'));
    } finally {
      qc.clear();
      sessionSpy.mockRestore();
      globalThis.fetch = prevFetch;
    }
  });

  it('renders unified 6-mode WorkDeliverySubBar in JTBD-2 Board-first order', async () => {
    const doc = setupDom();
    const { default: WorkDeliverySubBar } = await import('../components/layout/WorkDeliverySubBar');
    await act(async () => {
      root!.render(
        <NextIntlClientProvider locale="en" timeZone="UTC" messages={{ nav: enNav }}>
          <WorkDeliverySubBar baseWorkHref="/thanb/PM" activeKey="board" />
        </NextIntlClientProvider>,
      );
    });
    const nav = doc.querySelector('[data-testid="work-delivery-subbar"]');
    assert.ok(nav);
    const links = Array.from(nav.querySelectorAll('a'));
    assert.equal(links.length, 6);
    assert.equal(links[0]?.getAttribute('href'), '/thanb/PM');
    assert.equal(links[1]?.getAttribute('href'), '/thanb/PM/cycles');
    assert.equal(links[2]?.getAttribute('href'), '/thanb/PM/timeline');
    assert.equal(links[3]?.getAttribute('href'), '/thanb/PM/initiatives');
    assert.equal(links[4]?.getAttribute('href'), '/thanb/PM/dashboards');
    assert.equal(links[5]?.getAttribute('href'), '/thanb/PM/open-office');
  });
});
