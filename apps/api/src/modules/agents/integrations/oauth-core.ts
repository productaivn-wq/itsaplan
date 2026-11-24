import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { resolveJsonPath, type OAuth2ProviderSpec } from '@repo/agent-tools';

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
  method: 'S256';
}

export interface OAuthStatePayload {
  teamId: number;
  userId: string;
  integrationKey: string;
  label?: string | null;
  credentialId?: number | null;
  codeVerifier?: string;
  returnTo: string;
  mode: 'direct' | 'relay';
  redirectUri: string;
  exp: number;
}

export interface OAuthAppConfig {
  mode: 'direct' | 'relay';
  clientId?: string;
  clientSecret?: string;
  relayUrl?: string;
  relaySecret?: string;
  scopesOverride?: string[];
}

export interface OAuthTokenEnvelope {
  authMode: 'oauth2';
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresAt?: string;
  scopes: string[];
  accountEmail?: string;
  providerMode: 'direct' | 'relay';
  updatedAt: string;
}

const STATE_TTL_MS = 10 * 60 * 1000;

export function generatePkcePair(): PkcePair {
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256').update(codeVerifier, 'ascii').digest('base64url');
  return { codeVerifier, codeChallenge, method: 'S256' };
}

/**
 * Accepts only same-origin relative paths (blocks //host, https://, CR/LF).
 */
export function sanitizeReturnTo(returnTo: string | undefined, fallback = '/'): string {
  if (!returnTo) return fallback;
  const trimmed = returnTo.trim();
  if (!trimmed || trimmed.includes('\r') || trimmed.includes('\n')) return fallback;
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }
  return trimmed;
}

function deriveStateKey(secretMaterial: string): Buffer {
  if (!secretMaterial || !secretMaterial.trim()) {
    throw new Error('OAuth state signing secret is empty.');
  }
  return createHash('sha256').update(`itsaplan:oauth-state:v1:${secretMaterial}`, 'utf8').digest();
}

export function sealOAuthState(
  payload: Omit<OAuthStatePayload, 'exp'> & { exp?: number },
  secretMaterial: string,
  nowMs = Date.now(),
): string {
  const fullPayload: OAuthStatePayload = {
    ...payload,
    returnTo: sanitizeReturnTo(payload.returnTo),
    exp: payload.exp ?? nowMs + STATE_TTL_MS,
  };
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveStateKey(secretMaterial), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(fullPayload), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${ciphertext.toString('base64url')}.${tag.toString('base64url')}`;
}

export function openOAuthState(
  token: string,
  secretMaterial: string,
  nowMs = Date.now(),
): OAuthStatePayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed OAuth state token.');
  }
  const [ivB64, ctB64, tagB64] = parts;
  const decipher = createDecipheriv(
    'aes-256-gcm',
    deriveStateKey(secretMaterial),
    Buffer.from(ivB64, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
  const parsed = JSON.parse(plaintext) as OAuthStatePayload;
  if (typeof parsed.exp !== 'number' || parsed.exp <= nowMs) {
    throw new Error('OAuth state token has expired.');
  }
  parsed.returnTo = sanitizeReturnTo(parsed.returnTo);
  return parsed;
}

export function resolveEnvOAuthAppConfig(
  integrationKey: string,
  env: Record<string, string | undefined> = process.env,
): { config: OAuthAppConfig | null; source: 'env' | 'none' } {
  const upper = integrationKey.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  let clientId = env[`ITSAPLAN_OAUTH_${upper}_CLIENT_ID`]?.trim();
  let clientSecret = env[`ITSAPLAN_OAUTH_${upper}_CLIENT_SECRET`]?.trim();

  if ((!clientId || !clientSecret) && integrationKey === 'google_workspace') {
    clientId =
      clientId ||
      env.GWS_WORK_CLIENT_ID?.trim() ||
      env.GOOGLE_CLIENT_ID?.trim();
    clientSecret =
      clientSecret ||
      env.GWS_OAUTH_CLIENT_SECRET_1?.trim() ||
      env.GOOGLE_CLIENT_SECRET?.trim();
  }

  if (clientId && clientSecret) {
    return {
      config: { mode: 'direct', clientId, clientSecret },
      source: 'env',
    };
  }

  const relayUrl = env.ITSAPLAN_OAUTH_RELAY_URL?.trim();
  if (relayUrl) {
    return {
      config: {
        mode: 'relay',
        relayUrl: relayUrl.replace(/\/+$/, ''),
        relaySecret: env.ITSAPLAN_OAUTH_RELAY_SECRET?.trim() || undefined,
      },
      source: 'env',
    };
  }

  return { config: null, source: 'none' };
}

function assertValidRelayUrl(rawUrl: string): URL {
  const parsed = new URL(rawUrl);
  const host = parsed.hostname.toLowerCase();
  const isLoopback = host === 'localhost' || host === '127.0.0.1';
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLoopback)) {
    throw new Error('OAuth relay URL must use HTTPS (or http://localhost for local dev).');
  }
  return parsed;
}

export function buildAuthorizationUrl(
  spec: OAuth2ProviderSpec,
  appConfig: OAuthAppConfig,
  opts: {
    integrationKey: string;
    state: string;
    redirectUri: string;
    codeChallenge?: string;
  },
): string {
  const scopes =
    appConfig.scopesOverride && appConfig.scopesOverride.length > 0
      ? appConfig.scopesOverride
      : spec.scopes;

  if (appConfig.mode === 'relay') {
    if (!appConfig.relayUrl) {
      throw new Error('OAuth relay URL is not configured.');
    }
    const base = assertValidRelayUrl(appConfig.relayUrl);
    const url = new URL(`${base.toString().replace(/\/+$/, '')}/start/${encodeURIComponent(opts.integrationKey)}`);
    url.searchParams.set('state', opts.state);
    url.searchParams.set('return_to', opts.redirectUri);
    if (scopes.length > 0) url.searchParams.set('scope', scopes.join(' '));
    if (opts.codeChallenge && spec.pkce !== false) {
      url.searchParams.set('code_challenge', opts.codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
    }
    return url.toString();
  }

  if (!appConfig.clientId) {
    throw new Error('OAuth clientId is not configured for direct mode.');
  }
  const url = new URL(spec.authorizeUrl);
  url.searchParams.set('client_id', appConfig.clientId);
  url.searchParams.set('redirect_uri', opts.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', opts.state);
  if (scopes.length > 0) url.searchParams.set('scope', scopes.join(' '));
  if (opts.codeChallenge && spec.pkce !== false) {
    url.searchParams.set('code_challenge', opts.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
  }
  if (spec.extraAuthorizeParams) {
    for (const [k, v] of Object.entries(spec.extraAuthorizeParams)) {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

function normalizeTokenPayload(
  raw: Record<string, unknown>,
  mode: 'direct' | 'relay',
  defaultScopes: string[],
  fallbackRefreshToken?: string,
  nowMs = Date.now(),
): OAuthTokenEnvelope {
  const accessToken = typeof raw.access_token === 'string' ? raw.access_token.trim() : '';
  if (!accessToken) {
    const errDesc =
      typeof raw.error_description === 'string'
        ? raw.error_description
        : typeof raw.error === 'string'
          ? raw.error
          : 'OAuth token response missing access_token';
    throw new Error(errDesc);
  }
  const refreshToken =
    typeof raw.refresh_token === 'string' && raw.refresh_token.trim()
      ? raw.refresh_token.trim()
      : fallbackRefreshToken;
  const tokenType = typeof raw.token_type === 'string' && raw.token_type.trim() ? raw.token_type.trim() : 'Bearer';
  const expiresIn = typeof raw.expires_in === 'number' ? raw.expires_in : Number(raw.expires_in);
  const expiresAt =
    Number.isFinite(expiresIn) && expiresIn > 0
      ? new Date(nowMs + expiresIn * 1000).toISOString()
      : undefined;
  const scopes =
    typeof raw.scope === 'string' && raw.scope.trim()
      ? raw.scope
          .trim()
          .split(/[\s,]+/)
          .filter(Boolean)
      : [...defaultScopes];

  return {
    authMode: 'oauth2',
    accessToken,
    refreshToken,
    tokenType,
    expiresAt,
    scopes,
    providerMode: mode,
    updatedAt: new Date(nowMs).toISOString(),
  };
}

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export async function exchangeAuthorizationCode(
  spec: OAuth2ProviderSpec,
  appConfig: OAuthAppConfig,
  opts: {
    integrationKey: string;
    code: string;
    redirectUri: string;
    codeVerifier?: string;
  },
  fetchImpl: FetchLike = fetch,
): Promise<OAuthTokenEnvelope> {
  if (appConfig.mode === 'relay') {
    if (!appConfig.relayUrl) throw new Error('OAuth relay URL is not configured.');
    const base = assertValidRelayUrl(appConfig.relayUrl);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (appConfig.relaySecret) {
      headers.Authorization = `Bearer ${appConfig.relaySecret}`;
    }
    const res = await fetchImpl(
      `${base.toString().replace(/\/+$/, '')}/exchange/${encodeURIComponent(opts.integrationKey)}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: opts.code,
          redirectUri: opts.redirectUri,
          codeVerifier: opts.codeVerifier,
        }),
      },
    );
    const payload = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error(String(payload.error_description ?? payload.error ?? `Relay exchange failed (${res.status})`));
    }
    return normalizeTokenPayload(payload, 'relay', spec.scopes);
  }

  if (!appConfig.clientId || !appConfig.clientSecret) {
    throw new Error('OAuth clientId and clientSecret are required for direct mode.');
  }

  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    code: opts.code,
    redirect_uri: opts.redirectUri,
  });
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  };

  if (opts.integrationKey === 'notion') {
    const basic = Buffer.from(`${appConfig.clientId}:${appConfig.clientSecret}`, 'utf8').toString('base64');
    headers.Authorization = `Basic ${basic}`;
  } else {
    form.set('client_id', appConfig.clientId);
    form.set('client_secret', appConfig.clientSecret);
  }
  if (opts.codeVerifier && spec.pkce !== false) {
    form.set('code_verifier', opts.codeVerifier);
  }

  const res = await fetchImpl(spec.tokenUrl, {
    method: 'POST',
    headers,
    body: form.toString(),
  });
  const payload = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(String(payload.error_description ?? payload.error ?? `Token exchange failed (${res.status})`));
  }
  return normalizeTokenPayload(payload, 'direct', spec.scopes);
}

export async function refreshOAuthToken(
  spec: OAuth2ProviderSpec,
  appConfig: OAuthAppConfig,
  opts: {
    integrationKey: string;
    refreshToken: string;
  },
  fetchImpl: FetchLike = fetch,
): Promise<OAuthTokenEnvelope> {
  if (appConfig.mode === 'relay') {
    if (!appConfig.relayUrl) throw new Error('OAuth relay URL is not configured.');
    const base = assertValidRelayUrl(appConfig.relayUrl);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (appConfig.relaySecret) {
      headers.Authorization = `Bearer ${appConfig.relaySecret}`;
    }
    const res = await fetchImpl(
      `${base.toString().replace(/\/+$/, '')}/refresh/${encodeURIComponent(opts.integrationKey)}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ refreshToken: opts.refreshToken }),
      },
    );
    const payload = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error(String(payload.error_description ?? payload.error ?? `Relay refresh failed (${res.status})`));
    }
    return normalizeTokenPayload(payload, 'relay', spec.scopes, opts.refreshToken);
  }

  if (!appConfig.clientId || !appConfig.clientSecret) {
    throw new Error('OAuth clientId and clientSecret are required for direct refresh.');
  }

  const form = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: opts.refreshToken,
    client_id: appConfig.clientId,
    client_secret: appConfig.clientSecret,
  });
  const res = await fetchImpl(spec.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: form.toString(),
  });
  const payload = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(String(payload.error_description ?? payload.error ?? `Token refresh failed (${res.status})`));
  }
  return normalizeTokenPayload(payload, 'direct', spec.scopes, opts.refreshToken);
}

export async function fetchOAuthIdentity(
  spec: OAuth2ProviderSpec,
  accessToken: string,
  fetchImpl: FetchLike = fetch,
): Promise<string | undefined> {
  if (!spec.identity) return undefined;
  try {
    const res = await fetchImpl(spec.identity.url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        ...(spec.identity.headers ?? {}),
      },
    });
    if (!res.ok) return undefined;
    const json = (await res.json()) as unknown;
    return resolveJsonPath(json, spec.identity.jsonPath);
  } catch {
    return undefined;
  }
}

export function isTokenExpiringSoon(
  expiresAt: string | undefined,
  skewSeconds = 120,
  nowMs = Date.now(),
): boolean {
  if (!expiresAt) return false;
  const parsed = Date.parse(expiresAt);
  if (!Number.isFinite(parsed)) return false;
  return parsed <= nowMs + skewSeconds * 1000;
}

export function isDomainAllowed(domain: string, allowedDomains: string[]): boolean {
  const clean = domain.trim().toLowerCase().replace(/\.$/, '');
  if (!clean) return false;
  return allowedDomains.some((allowed) => allowed.trim().toLowerCase() === clean);
}

function maskToken(value: string): string {
  return value.length <= 4 ? '••••' : `••••${value.slice(-4)}`;
}

export function redactOAuthEnvelope(
  envelope: OAuthTokenEnvelope,
  tokenField = 'accessToken',
): Record<string, unknown> {
  return {
    authMode: 'oauth2',
    providerMode: envelope.providerMode,
    accountEmail: envelope.accountEmail ?? null,
    scopes: envelope.scopes,
    expiresAt: envelope.expiresAt ?? null,
    hasRefreshToken: Boolean(envelope.refreshToken),
    [tokenField]: maskToken(envelope.accessToken),
  };
}

export function toStoredToolConfig(
  envelope: OAuthTokenEnvelope,
  tokenField = 'accessToken',
): Record<string, unknown> {
  return {
    authMode: 'oauth2',
    [tokenField]: envelope.accessToken,
    accessToken: envelope.accessToken,
    ...(envelope.refreshToken ? { refreshToken: envelope.refreshToken } : {}),
    tokenType: envelope.tokenType,
    ...(envelope.expiresAt ? { expiresAt: envelope.expiresAt } : {}),
    scopes: envelope.scopes,
    ...(envelope.accountEmail ? { accountEmail: envelope.accountEmail } : {}),
    providerMode: envelope.providerMode,
    updatedAt: envelope.updatedAt,
  };
}
