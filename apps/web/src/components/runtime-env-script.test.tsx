import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { act } from 'react';
import { JSDOM } from 'jsdom';
import { RUNTIME_ENV_ELEMENT_ID, runtimeEnv } from '@/utils/runtimeEnv';
import { RuntimeEnvDataScript } from './runtime-env-script';

const replacedGlobals = [
  'window',
  'document',
  'navigator',
  'Node',
  'Element',
  'HTMLElement',
  'IS_REACT_ACT_ENVIRONMENT',
] as const;

let savedApiUrl: string | undefined;
let savedPrivacyUrl: string | undefined;
let savedTermsUrl: string | undefined;
let originalDescriptors: Map<string, PropertyDescriptor | undefined>;
let originalConsoleError: typeof console.error;

beforeEach(() => {
  savedApiUrl = process.env.API_URL;
  savedPrivacyUrl = process.env.PRIVACY_URL;
  savedTermsUrl = process.env.TERMS_URL;
  originalConsoleError = console.error;
  originalDescriptors = new Map(
    replacedGlobals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
  );
});

afterEach(() => {
  console.error = originalConsoleError;
  if (savedApiUrl === undefined) delete process.env.API_URL;
  else process.env.API_URL = savedApiUrl;
  if (savedPrivacyUrl === undefined) delete process.env.PRIVACY_URL;
  else process.env.PRIVACY_URL = savedPrivacyUrl;
  if (savedTermsUrl === undefined) delete process.env.TERMS_URL;
  else process.env.TERMS_URL = savedTermsUrl;

  for (const [name, desc] of originalDescriptors) {
    if (desc) Object.defineProperty(globalThis, name, desc);
    else delete (globalThis as Record<string, unknown>)[name];
  }
});

describe('RuntimeEnvScript', () => {
  it('renders a JSON script data block without React 19 client script warnings and hydrates runtimeEnv()', async () => {
    process.env.API_URL = 'http://localhost:3000';
    process.env.PRIVACY_URL = 'https://example.test/privacy?x=<tag>';
    process.env.TERMS_URL = 'https://example.test/terms';

    const element = <RuntimeEnvDataScript />;

    const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
      url: 'http://localhost:3001',
    });
    Object.defineProperties(globalThis, {
      window: { configurable: true, value: dom.window },
      document: { configurable: true, value: dom.window.document },
      navigator: { configurable: true, value: dom.window.navigator },
      Node: { configurable: true, value: dom.window.Node },
      Element: { configurable: true, value: dom.window.Element },
      HTMLElement: { configurable: true, value: dom.window.HTMLElement },
      IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true },
    });

    const errors: string[] = [];
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
    };

    const { createRoot } = await import('react-dom/client');
    const rootEl = dom.window.document.getElementById('root');
    assert.ok(rootEl);
    const root = createRoot(rootEl);

    await act(async () => {
      root.render(element);
    });

    assert.deepEqual(errors, []);

    const scriptEl = dom.window.document.getElementById(RUNTIME_ENV_ELEMENT_ID);
    assert.ok(scriptEl);
    assert.equal(scriptEl.tagName.toLowerCase(), 'script');
    assert.equal(scriptEl.getAttribute('type'), 'application/json');
    assert.ok(scriptEl.textContent?.includes('\\u003ctag>'));

    assert.deepEqual(runtimeEnv(), {
      apiUrl: 'http://localhost:3000',
      privacyUrl: 'https://example.test/privacy?x=<tag>',
      termsUrl: 'https://example.test/terms',
    });

    await act(async () => {
      root.unmount();
    });
  });
});
