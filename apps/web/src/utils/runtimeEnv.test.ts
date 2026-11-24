import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { JSDOM } from 'jsdom';
import { RUNTIME_ENV_ELEMENT_ID, runtimeEnv, serverRuntimeEnv } from './runtimeEnv';

const envKeys = [
  'API_URL',
  'NEXT_PUBLIC_API_URL',
  'PRIVACY_URL',
  'NEXT_PUBLIC_PRIVACY_URL',
  'TERMS_URL',
  'NEXT_PUBLIC_TERMS_URL',
  'ITSAPLAN_ALLOW_HOST_BRIDGE',
  'NEXT_PUBLIC_ENABLE_HOST_VIBE',
] as const;

let savedEnv: Record<string, string | undefined>;
let originalWindowDesc: PropertyDescriptor | undefined;
let originalDocumentDesc: PropertyDescriptor | undefined;

beforeEach(() => {
  savedEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));
  delete process.env.ITSAPLAN_ALLOW_HOST_BRIDGE;
  delete process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE;
  originalWindowDesc = Object.getOwnPropertyDescriptor(globalThis, 'window');
  originalDocumentDesc = Object.getOwnPropertyDescriptor(globalThis, 'document');
});

afterEach(() => {
  for (const key of envKeys) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  if (originalWindowDesc) Object.defineProperty(globalThis, 'window', originalWindowDesc);
  else delete (globalThis as Record<string, unknown>).window;
  if (originalDocumentDesc) Object.defineProperty(globalThis, 'document', originalDocumentDesc);
  else delete (globalThis as Record<string, unknown>).document;
});

function installDom(html: string) {
  const dom = new JSDOM(html, { url: 'http://localhost:3001' });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: dom.window.document,
  });
  return dom;
}

describe('runtimeEnv', () => {
  it('reads server environment variables when window is undefined', () => {
    delete (globalThis as Record<string, unknown>).window;
    process.env.API_URL = 'https://api.server.test';
    process.env.PRIVACY_URL = 'https://privacy.server.test';
    process.env.TERMS_URL = 'https://terms.server.test';

    assert.deepEqual(serverRuntimeEnv(), {
      apiUrl: 'https://api.server.test',
      privacyUrl: 'https://privacy.server.test',
      termsUrl: 'https://terms.server.test',
    });
    assert.deepEqual(runtimeEnv(), {
      apiUrl: 'https://api.server.test',
      privacyUrl: 'https://privacy.server.test',
      termsUrl: 'https://terms.server.test',
    });
  });

  it('prefers window.__ITSAPLAN_ENV__ when already set in the browser', () => {
    const dom = installDom('<!doctype html><html><body></body></html>');
    dom.window.__ITSAPLAN_ENV__ = {
      apiUrl: 'https://cached.api.test',
      privacyUrl: 'https://cached.privacy.test',
      termsUrl: 'https://cached.terms.test',
    };

    assert.deepEqual(runtimeEnv(), {
      apiUrl: 'https://cached.api.test',
      privacyUrl: 'https://cached.privacy.test',
      termsUrl: 'https://cached.terms.test',
    });
  });

  it('reads and caches the JSON script data block when window.__ITSAPLAN_ENV__ is unset', () => {
    const dom = installDom(
      `<!doctype html><html><body><script id="${RUNTIME_ENV_ELEMENT_ID}" type="application/json">{"apiUrl":"http://localhost:3000","privacyUrl":"https://p.test","termsUrl":"https://t.test"}</script></body></html>`,
    );

    const resolved = runtimeEnv();
    assert.deepEqual(resolved, {
      apiUrl: 'http://localhost:3000',
      privacyUrl: 'https://p.test',
      termsUrl: 'https://t.test',
    });
    assert.deepEqual(dom.window.__ITSAPLAN_ENV__, resolved);
  });

  it('falls back to empty strings when the script data block is missing or malformed', () => {
    installDom(
      `<!doctype html><html><body><script id="${RUNTIME_ENV_ELEMENT_ID}" type="application/json">{not-json</script></body></html>`,
    );

    assert.deepEqual(runtimeEnv(), { apiUrl: '', privacyUrl: '', termsUrl: '' });
  });

  it('includes hostVibeEnabled: true in serverRuntimeEnv() only when both server and public host vibe flags are true', () => {
    delete (globalThis as Record<string, unknown>).window;
    process.env.API_URL = 'https://api.server.test';
    process.env.PRIVACY_URL = '';
    process.env.TERMS_URL = '';

    const baseExpected = {
      apiUrl: 'https://api.server.test',
      privacyUrl: '',
      termsUrl: '',
    };

    const disabledCases: Array<[string | undefined, string | undefined]> = [
      [undefined, undefined],
      ['true', undefined],
      [undefined, 'true'],
      ['true', 'false'],
      ['false', 'true'],
      ['false', 'false'],
    ];

    for (const [allowBridge, enableVibe] of disabledCases) {
      if (allowBridge === undefined) delete process.env.ITSAPLAN_ALLOW_HOST_BRIDGE;
      else process.env.ITSAPLAN_ALLOW_HOST_BRIDGE = allowBridge;
      if (enableVibe === undefined) delete process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE;
      else process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE = enableVibe;

      const resolved = serverRuntimeEnv();
      assert.equal('hostVibeEnabled' in resolved, false);
      assert.deepEqual(resolved, baseExpected);
    }

    process.env.ITSAPLAN_ALLOW_HOST_BRIDGE = 'true';
    process.env.NEXT_PUBLIC_ENABLE_HOST_VIBE = 'true';
    assert.deepEqual(serverRuntimeEnv(), {
      ...baseExpected,
      hostVibeEnabled: true,
    });
    assert.deepEqual(runtimeEnv(), {
      ...baseExpected,
      hostVibeEnabled: true,
    });
  });

  it('reads hostVibeEnabled: true from #__ITSAPLAN_ENV_DATA__ in browser and omits it when absent or non-true', () => {
    const domEnabled = installDom(
      `<!doctype html><html><body><script id="${RUNTIME_ENV_ELEMENT_ID}" type="application/json">{"apiUrl":"http://localhost:3000","privacyUrl":"","termsUrl":"","hostVibeEnabled":true}</script></body></html>`,
    );
    const enabledEnv = runtimeEnv();
    assert.deepEqual(enabledEnv, {
      apiUrl: 'http://localhost:3000',
      privacyUrl: '',
      termsUrl: '',
      hostVibeEnabled: true,
    });
    assert.deepEqual(domEnabled.window.__ITSAPLAN_ENV__, enabledEnv);

    for (const payload of [
      '{"apiUrl":"http://localhost:3000","privacyUrl":"","termsUrl":""}',
      '{"apiUrl":"http://localhost:3000","privacyUrl":"","termsUrl":"","hostVibeEnabled":false}',
      '{"apiUrl":"http://localhost:3000","privacyUrl":"","termsUrl":"","hostVibeEnabled":"true"}',
    ]) {
      installDom(
        `<!doctype html><html><body><script id="${RUNTIME_ENV_ELEMENT_ID}" type="application/json">${payload}</script></body></html>`,
      );
      const resolved = runtimeEnv();
      assert.equal('hostVibeEnabled' in resolved, false);
      assert.deepEqual(resolved, {
        apiUrl: 'http://localhost:3000',
        privacyUrl: '',
        termsUrl: '',
      });
    }
  });
});
