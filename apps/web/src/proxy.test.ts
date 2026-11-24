import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

const COOKIE = 'better-auth.session_token=stale.signature';

let originalApiUrl: string | undefined;
let originalAllowBridge: string | undefined;

beforeEach(() => {
  originalApiUrl = process.env.API_URL;
  originalAllowBridge = process.env.ITSAPLAN_ALLOW_HOST_BRIDGE;
});

afterEach(() => {
  if (originalApiUrl === undefined) delete process.env.API_URL;
  else process.env.API_URL = originalApiUrl;
  if (originalAllowBridge === undefined) delete process.env.ITSAPLAN_ALLOW_HOST_BRIDGE;
  else process.env.ITSAPLAN_ALLOW_HOST_BRIDGE = originalAllowBridge;
});

function run(path: string, cookie?: string) {
  return proxy(
    new NextRequest(`http://localhost${path}`, {
      headers: cookie ? { cookie } : undefined,
    }),
  );
}

describe('proxy', () => {
  it('keeps a stale session on the expired screen instead of bouncing it back', () => {
    const res = run('/login?expired=1', COOKIE);
    assert.equal(res.headers.get('location'), null);
  });

  it('expires the stale cookies the api could not clear', () => {
    const res = run('/login?expired=1', `${COOKIE}; __Secure-better-auth.session_data=cached`);
    const cleared = res.headers.getSetCookie();
    assert.equal(cleared.length, 2);
    assert.match(cleared[0]!, /^better-auth\.session_token=;/);
    assert.match(cleared[0]!, /Expires=Thu, 01 Jan 1970/);
    assert.match(cleared[1]!, /^__Secure-better-auth\.session_data=;/);
    assert.match(cleared[1]!, /Secure/);
  });

  it('sends a signed-in user away from the login page', () => {
    const res = run('/login', COOKIE);
    assert.equal(res.headers.get('location'), 'http://localhost/');
  });

  it('sends a visitor without a session to the login page, including /onboarding', () => {
    const resRoot = run('/', undefined);
    assert.equal(resRoot.headers.get('location'), 'http://localhost/login');
    const resOnboarding = run('/onboarding', undefined);
    assert.equal(resOnboarding.headers.get('location'), 'http://localhost/login');
  });

  it('rejects empty or malformed session cookies on protected API routes', () => {
    assert.equal(run('/api/aos/onboarding', 'better-auth.session_token=bad').status, 401);
    assert.equal(run('/api/aos/onboarding', undefined).status, 401);
    assert.notEqual(run('/api/aos/onboarding', COOKIE).status, 401);
  });

  it('quarantines host-bridge routes before rewrites unless ITSAPLAN_ALLOW_HOST_BRIDGE=true with session', async () => {
    delete process.env.ITSAPLAN_ALLOW_HOST_BRIDGE;
    for (const target of ['/api/vibe/open-office/state', '/api/vibe/memory', '/api/vibe/config.json', '/api/vault-bridge']) {
      const anonRes = run(target, undefined);
      assert.equal(anonRes.status, 403);
      assert.equal((await anonRes.json()).code, 'HOST_BRIDGE_QUARANTINED');

      const authedRes = run(target, COOKIE);
      assert.equal(authedRes.status, 403);
      assert.equal((await authedRes.json()).code, 'HOST_BRIDGE_QUARANTINED');
    }

    process.env.ITSAPLAN_ALLOW_HOST_BRIDGE = 'true';
    assert.equal(run('/api/vibe/memory', undefined).status, 401);
    assert.equal(run('/api/vault-bridge', undefined).status, 401);
    const optedIn = run('/api/vibe/open-office/state', COOKIE);
    assert.notEqual(optedIn.status, 403);
    assert.notEqual(optedIn.status, 401);
  });
});

describe('proxy security headers', () => {
  it('serves every page with a content security policy excluding host vault bridge by default', () => {
    delete process.env.ITSAPLAN_ALLOW_HOST_BRIDGE;
    process.env.API_URL = 'http://api.test:3000/';
    const csp = run('/login').headers.get('content-security-policy');
    assert.match(csp!, /(^|; )connect-src 'self' blob: http:\/\/api\.test:3000(;|$)/);
    assert.doesNotMatch(csp!, /127\.0\.0\.1:8765/);
    assert.match(csp!, /(^|; )frame-ancestors 'none'(;|$)/);
    assert.match(csp!, /(^|; )object-src 'none'(;|$)/);
  });

  it('includes local vault origins in CSP only when ITSAPLAN_ALLOW_HOST_BRIDGE=true', () => {
    process.env.API_URL = 'http://api.test:3000/';
    process.env.ITSAPLAN_ALLOW_HOST_BRIDGE = 'true';
    const csp = run('/login').headers.get('content-security-policy');
    assert.match(csp!, /(^|; )connect-src 'self' blob: http:\/\/api\.test:3000 http:\/\/127\.0\.0\.1:8765 http:\/\/localhost:8765(;|$)/);
  });

  it('keeps the policy on a redirect and on the expired screen', () => {
    assert.ok(run('/', undefined).headers.get('content-security-policy'));
    assert.ok(run('/login?expired=1', COOKIE).headers.get('content-security-policy'));
  });

  it('leaves the media routes to the headers the api sends', () => {
    assert.equal(run('/media/avatars/u1', COOKIE).headers.get('content-security-policy'), null);
    const document = '/protected-media/projects/KEY/documents/1/assets/x/raw';
    assert.equal(run(document, COOKIE).headers.get('content-security-policy'), null);
  });
});
