import { describe, expect, it } from 'bun:test';
import {
  INTEGRATIONS,
  OAUTH2_PROVIDER_SPECS,
  getOAuthProviderSpec,
  integrationDescriptors,
  listOAuthProviderKeys,
  resolveJsonPath,
} from '../index';

describe('oauth-catalog', () => {
  it('registers valid HTTPS OAuth2 endpoints and allowedDomains for every provider', () => {
    const keys = listOAuthProviderKeys();
    expect(keys.length).toBeGreaterThanOrEqual(9);
    for (const key of keys) {
      const spec = getOAuthProviderSpec(key);
      expect(spec).toBeDefined();
      expect(spec!.authorizeUrl.startsWith('https://')).toBe(true);
      expect(spec!.tokenUrl.startsWith('https://')).toBe(true);
      expect(spec!.allowedDomains.length).toBeGreaterThan(0);
    }
  });

  it('has unique integration keys across INTEGRATIONS and exposes oauth2 metadata in descriptors', () => {
    const keys = INTEGRATIONS.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);

    const descriptors = integrationDescriptors();
    const gws = descriptors.find((d) => d.key === 'google_workspace');
    expect(gws).toBeDefined();
    expect(gws!.authModes).toEqual(['oauth2', 'api_key']);
    expect(gws!.oauth2?.envVar).toBe('GCLI_ACCESS_TOKEN');
    expect(gws!.oauth2?.pkce).toBe(true);
    expect(JSON.stringify(gws)).not.toContain('clientSecret');

    const notion = descriptors.find((d) => d.key === 'notion');
    expect(notion?.oauth2?.allowedDomains).toEqual(['api.notion.com']);
    expect(notion?.tools.length).toBeGreaterThan(0);

    const jina = descriptors.find((d) => d.key === 'jina');
    expect(jina?.authModes).toEqual(['api_key']);
    expect(jina?.oauth2).toBeUndefined();
  });

  it('resolves nested dot-separated JSON paths safely', () => {
    const payload = { user: { email: 'phuong@example.com', count: 42 } };
    expect(resolveJsonPath(payload, 'user.email')).toBe('phuong@example.com');
    expect(resolveJsonPath(payload, 'user.missing')).toBeUndefined();
    expect(resolveJsonPath(payload, 'user.count')).toBeUndefined();
    expect(resolveJsonPath(null, 'user.email')).toBeUndefined();
  });

  it('keeps every OAUTH2_PROVIDER_SPECS key backed by an integration in INTEGRATIONS', () => {
    const registered = new Set(INTEGRATIONS.map((i) => i.key));
    for (const key of Object.keys(OAUTH2_PROVIDER_SPECS)) {
      expect(registered.has(key)).toBe(true);
    }
  });
});
