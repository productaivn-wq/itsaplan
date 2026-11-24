import { describe, expect, it } from 'bun:test';
import { getOAuthProviderSpec } from '@repo/agent-tools';
import {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  fetchOAuthIdentity,
  generatePkcePair,
  isDomainAllowed,
  isTokenExpiringSoon,
  openOAuthState,
  redactOAuthEnvelope,
  refreshOAuthToken,
  resolveEnvOAuthAppConfig,
  sanitizeReturnTo,
  sealOAuthState,
  toStoredToolConfig,
} from '../../oauth-core';

describe('oauth-core (zero-DB)', () => {
  it('generates valid S256 PKCE pairs', async () => {
    const pair = generatePkcePair();
    expect(pair.method).toBe('S256');
    expect(pair.codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(pair.codeChallenge.length).toBeGreaterThanOrEqual(43);
    expect(pair.codeChallenge).not.toBe(pair.codeVerifier);
  });

  it('blocks open redirects in sanitizeReturnTo', () => {
    expect(sanitizeReturnTo('/acme/settings')).toBe('/acme/settings');
    expect(sanitizeReturnTo('//evil.com/phish')).toBe('/');
    expect(sanitizeReturnTo('https://evil.com/phish')).toBe('/');
    expect(sanitizeReturnTo('/\\evil.com')).toBe('/');
    expect(sanitizeReturnTo('/ok\r\nSet-Cookie: bad')).toBe('/');
    expect(sanitizeReturnTo(undefined, '/fallback')).toBe('/fallback');
  });

  it('seals and opens AES-256-GCM state and rejects tampering or expiry', () => {
    const secret = 'test-signing-secret-material-32-chars';
    const token = sealOAuthState(
      {
        teamId: 7,
        userId: 'user-1',
        integrationKey: 'google_workspace',
        label: 'Work',
        returnTo: '/acme/teams/7',
        mode: 'direct',
        redirectUri: 'http://localhost:3000/oauth/integrations/callback',
      },
      secret,
      1_000_000,
    );

    const opened = openOAuthState(token, secret, 1_000_100);
    expect(opened.teamId).toBe(7);
    expect(opened.integrationKey).toBe('google_workspace');
    expect(opened.returnTo).toBe('/acme/teams/7');

    // Tampered token fails
    const parts = token.split('.');
    const tampered = `${parts[0]}.${parts[1].slice(0, -2)}AA.${parts[2]}`;
    expect(() => openOAuthState(tampered, secret, 1_000_100)).toThrow();

    // Expired token fails
    expect(() => openOAuthState(token, secret, 1_000_000 + 11 * 60 * 1000)).toThrow();
  });

  it('resolves env OAuth config with ITSAPLAN_OAUTH_* > GWS_* > RELAY precedence', () => {
    const gwsDirect = resolveEnvOAuthAppConfig('google_workspace', {
      GWS_WORK_CLIENT_ID: 'gws-cid',
      GWS_OAUTH_CLIENT_SECRET_1: 'gws-csec',
      ITSAPLAN_OAUTH_RELAY_URL: 'https://auth.itsaplan.com',
    });
    expect(gwsDirect.config?.mode).toBe('direct');
    expect(gwsDirect.config?.clientId).toBe('gws-cid');

    const explicitOverride = resolveEnvOAuthAppConfig('google_workspace', {
      ITSAPLAN_OAUTH_GOOGLE_WORKSPACE_CLIENT_ID: 'explicit-cid',
      ITSAPLAN_OAUTH_GOOGLE_WORKSPACE_CLIENT_SECRET: 'explicit-csec',
      GWS_WORK_CLIENT_ID: 'gws-cid',
      GWS_OAUTH_CLIENT_SECRET_1: 'gws-csec',
    });
    expect(explicitOverride.config?.clientId).toBe('explicit-cid');

    const relayFallback = resolveEnvOAuthAppConfig('slack', {
      ITSAPLAN_OAUTH_RELAY_URL: 'https://auth.itsaplan.com/',
      ITSAPLAN_OAUTH_RELAY_SECRET: 'relay-sec',
    });
    expect(relayFallback.config).toEqual({
      mode: 'relay',
      relayUrl: 'https://auth.itsaplan.com',
      relaySecret: 'relay-sec',
    });
  });

  it('builds direct and relay authorize URLs properly', () => {
    const spec = getOAuthProviderSpec('google_workspace')!;
    const directUrl = new URL(
      buildAuthorizationUrl(
        spec,
        { mode: 'direct', clientId: 'cid-1', clientSecret: 'sec-1' },
        {
          integrationKey: 'google_workspace',
          state: 'st-1',
          redirectUri: 'http://localhost:3000/oauth/integrations/callback',
          codeChallenge: 'cc-1',
        },
      ),
    );
    expect(directUrl.origin + directUrl.pathname).toBe(spec.authorizeUrl);
    expect(directUrl.searchParams.get('client_id')).toBe('cid-1');
    expect(directUrl.searchParams.get('code_challenge')).toBe('cc-1');
    expect(directUrl.searchParams.get('access_type')).toBe('offline');

    const relayUrl = new URL(
      buildAuthorizationUrl(
        spec,
        { mode: 'relay', relayUrl: 'https://auth.itsaplan.com' },
        {
          integrationKey: 'google_workspace',
          state: 'st-2',
          redirectUri: 'http://localhost:3000/oauth/integrations/callback',
          codeChallenge: 'cc-2',
        },
      ),
    );
    expect(relayUrl.origin + relayUrl.pathname).toBe('https://auth.itsaplan.com/start/google_workspace');
    expect(relayUrl.searchParams.get('return_to')).toBe('http://localhost:3000/oauth/integrations/callback');
  });

  it('exchanges and refreshes tokens in direct & relay modes and uses Basic auth for Notion', async () => {
    const notionSpec = getOAuthProviderSpec('notion')!;
    let capturedAuth = '';
    const mockFetch = async (_input: string | URL | Request, init?: RequestInit) => {
      capturedAuth = (init?.headers as Record<string, string>)?.Authorization ?? '';
      return new Response(
        JSON.stringify({
          access_token: 'ntn_live_secret_9876',
          token_type: 'bearer',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const notionEnv = await exchangeAuthorizationCode(
      notionSpec,
      { mode: 'direct', clientId: 'cid', clientSecret: 'csec' },
      {
        integrationKey: 'notion',
        code: 'code-1',
        redirectUri: 'http://localhost:3000/oauth/integrations/callback',
      },
      mockFetch,
    );
    expect(capturedAuth.startsWith('Basic ')).toBe(true);
    expect(notionEnv.accessToken).toBe('ntn_live_secret_9876');

    const gwsSpec = getOAuthProviderSpec('google_workspace')!;
    const relayFetch = async () =>
      new Response(
        JSON.stringify({
          access_token: 'ya29.refreshed_abcd',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );

    const refreshed = await refreshOAuthToken(
      gwsSpec,
      { mode: 'relay', relayUrl: 'https://auth.itsaplan.com', relaySecret: 'rsec' },
      { integrationKey: 'google_workspace', refreshToken: '1//keep-me' },
      relayFetch,
    );
    expect(refreshed.accessToken).toBe('ya29.refreshed_abcd');
    expect(refreshed.refreshToken).toBe('1//keep-me');
    expect(refreshed.providerMode).toBe('relay');
  });

  it('fetches identity, enforces domain allowlists, and redacts raw tokens', async () => {
    const gwsSpec = getOAuthProviderSpec('google_workspace')!;
    const email = await fetchOAuthIdentity(
      gwsSpec,
      'ya29.token',
      async () =>
        new Response(JSON.stringify({ email: 'phuong@example.com' }), {
          status: 200,
        }),
    );
    expect(email).toBe('phuong@example.com');

    expect(isDomainAllowed('www.googleapis.com', gwsSpec.allowedDomains)).toBe(true);
    expect(isDomainAllowed('evil.com', gwsSpec.allowedDomains)).toBe(false);
    expect(isTokenExpiringSoon(new Date(Date.now() + 30_000).toISOString(), 120)).toBe(true);
    expect(isTokenExpiringSoon(new Date(Date.now() + 600_000).toISOString(), 120)).toBe(false);

    const envelope = {
      authMode: 'oauth2' as const,
      accessToken: 'super-secret-token-1234',
      refreshToken: 'refresh-secret-5678',
      tokenType: 'Bearer',
      scopes: ['openid'],
      accountEmail: 'phuong@example.com',
      providerMode: 'direct' as const,
      updatedAt: new Date().toISOString(),
    };
    const redacted = redactOAuthEnvelope(envelope, 'accessToken');
    expect(JSON.stringify(redacted)).not.toContain('super-secret-token');
    expect(JSON.stringify(redacted)).not.toContain('refresh-secret');
    expect(redacted.accessToken).toBe('••••1234');
    expect(redacted.hasRefreshToken).toBe(true);

    const stored = toStoredToolConfig(envelope, 'token');
    expect(stored.token).toBe('super-secret-token-1234');
    expect(stored.accessToken).toBe('super-secret-token-1234');
  });
});
