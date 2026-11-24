import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { JSDOM } from 'jsdom';
import dashboards from '../../../../messages/en/dashboards.json';
import common from '../../../../messages/en/common.json';
import type { WidgetInstance } from '@/utils/dashboardWidgets';
import WidgetFrame from './WidgetFrame';

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

const sampleWidget: WidgetInstance = {
  id: 'w-1',
  type: 'watched_metrics',
  x: 0,
  y: 0,
  w: 12,
  h: 5,
};

beforeEach(async () => {
  originalGlobalDescriptors = new Map(
    replacedGlobals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
  );
  dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'https://example.test/project/TEST/dashboards',
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
        observe() {}
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

describe('WidgetFrame', () => {
  it('renders content-sized widgets without inner scrollbars or scrollbar-gutter and reports measured height', () => {
    const reported: number[] = [];
    const origGetBCR = dom.window.HTMLElement.prototype.getBoundingClientRect;
    dom.window.HTMLElement.prototype.getBoundingClientRect = function () {
      if (this.tagName === 'HEADER') {
        return { width: 800, height: 33, top: 0, left: 0, right: 800, bottom: 33, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
      }
      if (this.classList.contains('flow-root')) {
        return { width: 800, height: 320, top: 0, left: 0, right: 800, bottom: 320, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
      }
      return origGetBCR.call(this);
    };

    act(() =>
      root.render(
        <NextIntlClientProvider locale="en" messages={{ dashboards, common }} timeZone="UTC">
          <WidgetFrame
            widget={sampleWidget}
            editing={false}
            movable={false}
            onRename={() => {}}
            onRemove={() => {}}
            onContentHeightChange={(h) => reported.push(h)}
          >
            <div>Metrics grid</div>
          </WidgetFrame>
        </NextIntlClientProvider>,
      ),
    );

    const container = document.querySelector('#root');
    assert.ok(container);
    assert.equal(container.innerHTML.includes('overflow-y-auto'), false);
    assert.equal(container.innerHTML.includes('scrollbar-gutter'), false);
    assert.ok(container.querySelector('.flow-root'));
    assert.deepEqual(reported, [353]);
  });

  it('renders fillHeight widgets with overflow-hidden and does not report content height', () => {
    const reported: number[] = [];
    act(() =>
      root.render(
        <NextIntlClientProvider locale="en" messages={{ dashboards, common }} timeZone="UTC">
          <WidgetFrame
            widget={{ ...sampleWidget, type: 'burnup' }}
            editing={false}
            movable={false}
            fillHeight
            onRename={() => {}}
            onRemove={() => {}}
            onContentHeightChange={(h) => reported.push(h)}
          >
            <div>Chart body</div>
          </WidgetFrame>
        </NextIntlClientProvider>,
      ),
    );

    const container = document.querySelector('#root');
    assert.ok(container);
    assert.equal(container.innerHTML.includes('overflow-y-auto'), false);
    assert.equal(container.innerHTML.includes('overflow-hidden'), true);
    assert.equal(container.querySelector('.flow-root'), null);
    assert.deepEqual(reported, []);
  });
});
