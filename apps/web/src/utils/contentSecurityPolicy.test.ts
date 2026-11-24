import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { contentSecurityPolicy } from './contentSecurityPolicy';

let originalApiUrl: string | undefined;
let originalHostBridge: string | undefined;

beforeEach(() => {
  originalApiUrl = process.env.API_URL;
  originalHostBridge = process.env.ITSAPLAN_ALLOW_HOST_BRIDGE;
  delete process.env.ITSAPLAN_ALLOW_HOST_BRIDGE;
});

afterEach(() => {
  if (originalApiUrl === undefined) delete process.env.API_URL;
  else process.env.API_URL = originalApiUrl;
  if (originalHostBridge === undefined) delete process.env.ITSAPLAN_ALLOW_HOST_BRIDGE;
  else process.env.ITSAPLAN_ALLOW_HOST_BRIDGE = originalHostBridge;
});

describe('contentSecurityPolicy', () => {
  it('allows requests to the api origin only, without its path, and quarantines host vault bridge by default', () => {
    process.env.API_URL = 'https://api.example.com/base/';
    assert.match(
      contentSecurityPolicy(),
      /connect-src 'self' blob: https:\/\/api\.example\.com;/,
    );
  });

  it('falls back to same-origin requests when the api url is not absolute', () => {
    process.env.API_URL = 'not a url';
    assert.match(
      contentSecurityPolicy(),
      /connect-src 'self' blob:;/,
    );
  });

  it('includes local vault bridge origins only when ITSAPLAN_ALLOW_HOST_BRIDGE=true', () => {
    process.env.API_URL = 'https://api.example.com/base/';
    process.env.ITSAPLAN_ALLOW_HOST_BRIDGE = 'true';
    assert.match(
      contentSecurityPolicy(),
      /connect-src 'self' blob: https:\/\/api\.example\.com http:\/\/127\.0\.0\.1:8765 http:\/\/localhost:8765;/,
    );
  });
});
