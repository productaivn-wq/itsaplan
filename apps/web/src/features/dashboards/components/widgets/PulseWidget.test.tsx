import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
// @ts-expect-error bun:test is provided by the Bun test runner at runtime
import { mock } from 'bun:test';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { JSDOM } from 'jsdom';
import dashboards from '../../../../../messages/en/dashboards.json';
import common from '../../../../../messages/en/common.json';
import type { PulseBucket } from '@/lib/api/endpoints/analytics';

const MOCK_BUCKETS: PulseBucket[] = [
  // Week 1 (Oct 5..Oct 11, 2026): spread across levels 1..4
  { label: 'Mon, Oct 05, 2026', count: 10, date: '2026-10-05', isFuture: false },
  { label: 'Tue, Oct 06, 2026', count: 50, date: '2026-10-06', isFuture: false },
  { label: 'Wed, Oct 07, 2026', count: 250, date: '2026-10-07', isFuture: false },
  { label: 'Thu, Oct 08, 2026', count: 1200, date: '2026-10-08', isFuture: false },
  { label: 'Fri, Oct 09, 2026', count: 3200, date: '2026-10-09', isFuture: false },
  { label: 'Sat, Oct 10, 2026', count: 27000, date: '2026-10-10', isFuture: false },
  { label: 'Sun, Oct 11, 2026', count: 0, date: '2026-10-11', isFuture: false },
  // Week 2 (Nov 23..Nov 29, 2026): Mon active, Tue..Sun future
  { label: 'Mon, Nov 23, 2026', count: 1500, date: '2026-11-23', isFuture: false },
  { label: 'Tue, Nov 24, 2026', count: 0, date: '2026-11-24', isFuture: true },
  { label: 'Wed, Nov 25, 2026', count: 0, date: '2026-11-25', isFuture: true },
  { label: 'Thu, Nov 26, 2026', count: 0, date: '2026-11-26', isFuture: true },
  { label: 'Fri, Nov 27, 2026', count: 0, date: '2026-11-27', isFuture: true },
  { label: 'Sat, Nov 28, 2026', count: 0, date: '2026-11-28', isFuture: true },
  { label: 'Sun, Nov 29, 2026', count: 0, date: '2026-11-29', isFuture: true },
];

mock.module('../../services/analytics.service', () => ({
  usePulseQuery: () => ({ data: MOCK_BUCKETS, isLoading: false }),
}));

mock.module('@/lib/auth-client', () => ({
  useSession: () => ({ data: { user: { id: 'u-1' } } }),
}));

const replacedGlobals = [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'ResizeObserver',
  'IS_REACT_ACT_ENVIRONMENT',
] as const;

let dom: JSDOM;
let root: Root;
let originalGlobalDescriptors: Map<string, PropertyDescriptor | undefined>;

beforeEach(async () => {
  originalGlobalDescriptors = new Map(
    replacedGlobals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
  );
  dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'https://example.test/project/PM/dashboards',
  });
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: dom.window },
    document: { configurable: true, value: dom.window.document },
    navigator: { configurable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, value: dom.window.HTMLElement },
    getComputedStyle: { configurable: true, value: dom.window.getComputedStyle.bind(dom.window) },
    requestAnimationFrame: {
      configurable: true,
      value: (cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      },
    },
    cancelAnimationFrame: { configurable: true, value: () => {} },
    ResizeObserver: {
      configurable: true,
      value: class {
        private cb: ResizeObserverCallback;
        constructor(cb: ResizeObserverCallback) {
          this.cb = cb;
        }
        observe(target: Element) {
          this.cb(
            [{ target, contentRect: { width: 400 } as DOMRectReadOnly } as ResizeObserverEntry],
            this as unknown as ResizeObserver,
          );
        }
        disconnect() {}
      },
    },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true },
  });
  const { createRoot } = await import('react-dom/client');
  const element = document.querySelector('#root');
  assert.ok(element);
  root = createRoot(element);
});

afterEach(() => {
  act(() => root.unmount());
  dom.window.close();
  for (const [name, descriptor] of originalGlobalDescriptors) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete (globalThis as Record<string, unknown>)[name];
  }
});

describe('PulseWidget', () => {
  it('renders weekday/month labels, all 4 intensity tiers, and hides future days from active/muted cells', async () => {
    const { default: PulseWidget } = await import('./PulseWidget');
    act(() =>
      root.render(
        <NextIntlClientProvider locale="en" messages={{ dashboards, common }} timeZone="UTC">
          <PulseWidget projectKey="PM" config={{ granularity: 'day', pulseScope: 'project' }} />
        </NextIntlClientProvider>,
      ),
    );

    const container = document.querySelector('#root');
    assert.ok(container);
    const html = container.innerHTML;
    assert.equal(html.includes('overflow-y-auto'), false);
    assert.ok(html.includes('Mon'));
    assert.ok(html.includes('Wed'));
    assert.ok(html.includes('Fri'));
    assert.ok(html.includes('Nov'));

    // All 4 green ramp levels should be present in rendered cell styles.
    assert.ok(html.includes('rgb(167, 243, 208)')); // #a7f3d0
    assert.ok(html.includes('rgb(52, 211, 153)')); // #34d399
    assert.ok(html.includes('rgb(16, 185, 129)')); // #10b981
    assert.ok(html.includes('rgb(5, 150, 105)')); // #059669

    // 6 future cells rendered with aria-hidden="true" and without bg-muted
    const futureCells = container.querySelectorAll('span[aria-hidden="true"]');
    assert.equal(futureCells.length, 6);
    for (const fc of futureCells) {
      assert.equal(fc.classList.contains('bg-muted'), false);
    }

    // Footer shows exact non-future totals (33,210 events · 7 active)
    assert.ok(container.textContent?.includes('33,210 events'));
    assert.ok(container.textContent?.includes('7 active'));
  });
});
