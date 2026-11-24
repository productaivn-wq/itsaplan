import { db, integrationCredential, readSecret, writeSecret } from '@repo/db';
import { and, eq } from 'drizzle-orm';
import { decryptSecret, encryptSecret } from '@repo/crypto';
import { getOAuthProviderSpec, type OAuth2ProviderSpec } from '@repo/agent-tools';
import { HttpError } from '#shared/lib';
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
  type OAuthAppConfig,
  type OAuthTokenEnvelope,
} from './oauth-core';

const OAUTH_SECRET_PREFIX = 'integrations.oauth.';

export interface OAuthProviderConfigDto {
  integrationKey: string;
  mode: 'direct' | 'relay' | 'unconfigured';
  configured: boolean;
  source: 'db' | 'env' | 'none';
  hasClientId: boolean;
  hasClientSecret: boolean;
  relayUrl: string | null;
  hasRelaySecret: boolean;
  callbackUrl: string;
  scopes: string[];
  allowedDomains: string[];
  clientReviewNote: string | null;
}

export interface SaveOAuthProviderConfigInput {
  mode: 'direct' | 'relay';
  clientId?: string | null;
  clientSecret?: string | null;
  relayUrl?: string | null;
  relaySecret?: string | null;
}

function getApiBaseUrl(): string {
  return (process.env.API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
}

export function getOAuthCallbackUrl(): string {
  return `${getApiBaseUrl()}/oauth/integrations/callback`;
}

function getOAuthStateSecret(): string {
  const secret = (process.env.BETTER_AUTH_SECRET || process.env.APP_ENCRYPTION_KEY || '').trim();
  if (!secret) {
    throw new HttpError(500, 'BETTER_AUTH_SECRET or APP_ENCRYPTION_KEY is required for OAuth state.');
  }
  return secret;
}

function requireSpec(integrationKey: string): OAuth2ProviderSpec {
  const spec = getOAuthProviderSpec(integrationKey);
  if (!spec) {
    throw new HttpError(400, `Integration '${integrationKey}' does not support OAuth2.`);
  }
  return spec;
}

export async function getResolvedOAuthAppConfig(
  integrationKey: string,
): Promise<{ config: OAuthAppConfig | null; source: 'db' | 'env' | 'none' }> {
  const stored = await readSecret<OAuthAppConfig>(`${OAUTH_SECRET_PREFIX}${integrationKey}`);
  if (stored) {
    if (stored.mode === 'direct' && stored.clientId && stored.clientSecret) {
      return { config: stored, source: 'db' };
    }
    if (stored.mode === 'relay' && stored.relayUrl) {
      return { config: stored, source: 'db' };
    }
  }
  return resolveEnvOAuthAppConfig(integrationKey);
}

export async function getOAuthProviderConfigDto(
  integrationKey: string,
): Promise<OAuthProviderConfigDto> {
  const spec = requireSpec(integrationKey);
  const { config, source } = await getResolvedOAuthAppConfig(integrationKey);
  const configured =
    config != null &&
    ((config.mode === 'direct' && Boolean(config.clientId && config.clientSecret)) ||
      (config.mode === 'relay' && Boolean(config.relayUrl)));

  return {
    integrationKey,
    mode: config ? config.mode : 'unconfigured',
    configured,
    source,
    hasClientId: Boolean(config?.clientId),
    hasClientSecret: Boolean(config?.clientSecret),
    relayUrl: config?.relayUrl ?? null,
    hasRelaySecret: Boolean(config?.relaySecret),
    callbackUrl: getOAuthCallbackUrl(),
    scopes: [...spec.scopes],
    allowedDomains: [...spec.allowedDomains],
    clientReviewNote: spec.clientReviewNote ?? null,
  };
}

export async function saveOAuthProviderConfig(
  integrationKey: string,
  input: SaveOAuthProviderConfigInput,
): Promise<OAuthProviderConfigDto> {
  requireSpec(integrationKey);
  const secretKey = `${OAUTH_SECRET_PREFIX}${integrationKey}`;
  const current = (await readSecret<OAuthAppConfig>(secretKey)) ?? { mode: input.mode };

  let next: OAuthAppConfig;
  if (input.mode === 'direct') {
    const clientId = input.clientId?.trim() || current.clientId || '';
    const clientSecret = input.clientSecret?.trim() || current.clientSecret || '';
    if (!clientId || !clientSecret) {
      throw new HttpError(400, 'Client ID and Client Secret are required for Direct BYO-App mode.');
    }
    next = {
      mode: 'direct',
      clientId,
      clientSecret,
    };
  } else {
    const relayUrl = (input.relayUrl?.trim() || current.relayUrl || '').replace(/\/+$/, '');
    if (!relayUrl) {
      throw new HttpError(400, 'Relay URL is required for Relay mode.');
    }
    try {
      const parsed = new URL(relayUrl);
      const host = parsed.hostname.toLowerCase();
      const isLoopback = host === 'localhost' || host === '127.0.0.1';
      if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLoopback)) {
        throw new Error('bad scheme');
      }
    } catch {
      throw new HttpError(400, 'Relay URL must be a valid https:// URL (or http://localhost).');
    }
    const relaySecret = input.relaySecret?.trim() || current.relaySecret;
    next = {
      mode: 'relay',
      relayUrl,
      ...(relaySecret ? { relaySecret } : {}),
    };
  }

  const redacted = {
    mode: next.mode,
    hasClientId: Boolean(next.clientId),
    hasClientSecret: Boolean(next.clientSecret),
    relayUrl: next.relayUrl ?? null,
    hasRelaySecret: Boolean(next.relaySecret),
  };
  await writeSecret(secretKey, next, redacted);
  return getOAuthProviderConfigDto(integrationKey);
}

export async function startOAuthFlow(input: {
  teamId: number;
  userId: string;
  integrationKey: string;
  label?: string | null;
  credentialId?: number | null;
  returnTo?: string;
}): Promise<{
  authorizeUrl: string;
  mode: 'direct' | 'relay';
  integrationKey: string;
  callbackUrl: string;
}> {
  const spec = requireSpec(input.integrationKey);
  const { config } = await getResolvedOAuthAppConfig(input.integrationKey);
  if (!config) {
    throw new HttpError(
      400,
      `OAuth is not configured for '${input.integrationKey}'. Configure a BYO OAuth App or Relay URL first.`,
    );
  }

  if (input.credentialId != null) {
    const [existing] = await db
      .select({ id: integrationCredential.id, integrationKey: integrationCredential.integrationKey })
      .from(integrationCredential)
      .where(
        and(
          eq(integrationCredential.id, input.credentialId),
          eq(integrationCredential.teamId, input.teamId),
        ),
      )
      .limit(1);
    if (!existing) throw new HttpError(404, 'Credential not found');
    if (existing.integrationKey !== input.integrationKey) {
      throw new HttpError(400, 'Credential integrationKey mismatch.');
    }
  }

  const pkce = spec.pkce !== false ? generatePkcePair() : undefined;
  const redirectUri = getOAuthCallbackUrl();
  const state = sealOAuthState(
    {
      teamId: input.teamId,
      userId: input.userId,
      integrationKey: input.integrationKey,
      label: input.label?.trim() || null,
      credentialId: input.credentialId ?? null,
      codeVerifier: pkce?.codeVerifier,
      returnTo: sanitizeReturnTo(input.returnTo),
      mode: config.mode,
      redirectUri,
    },
    getOAuthStateSecret(),
  );

  const authorizeUrl = buildAuthorizationUrl(spec, config, {
    integrationKey: input.integrationKey,
    state,
    redirectUri,
    codeChallenge: pkce?.codeChallenge,
  });

  return {
    authorizeUrl,
    mode: config.mode,
    integrationKey: input.integrationKey,
    callbackUrl: redirectUri,
  };
}

export async function completeOAuthCallback(params: {
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
}): Promise<{
  returnTo: string;
  integrationKey: string;
  credentialId: number;
}> {
  if (params.error) {
    throw new HttpError(400, params.errorDescription || params.error);
  }
  if (!params.code || !params.state) {
    throw new HttpError(400, 'Missing OAuth code or state parameter.');
  }

  let statePayload;
  try {
    statePayload = openOAuthState(params.state, getOAuthStateSecret());
  } catch (err) {
    throw new HttpError(400, err instanceof Error ? err.message : 'Invalid OAuth state.');
  }

  const spec = requireSpec(statePayload.integrationKey);
  const { config } = await getResolvedOAuthAppConfig(statePayload.integrationKey);
  if (!config) {
    throw new HttpError(400, `OAuth app configuration missing for '${statePayload.integrationKey}'.`);
  }

  const envelope = await exchangeAuthorizationCode(spec, config, {
    integrationKey: statePayload.integrationKey,
    code: params.code,
    redirectUri: statePayload.redirectUri,
    codeVerifier: statePayload.codeVerifier,
  });
  envelope.accountEmail = await fetchOAuthIdentity(spec, envelope.accessToken);

  const tokenField = spec.tokenField ?? 'accessToken';
  const storedConfig = toStoredToolConfig(envelope, tokenField);
  const redacted = redactOAuthEnvelope(envelope, tokenField);
  const enc = encryptSecret(JSON.stringify(storedConfig));
  const resolvedLabel = statePayload.label || envelope.accountEmail || null;

  if (statePayload.credentialId != null) {
    const [updated] = await db
      .update(integrationCredential)
      .set({
        ...(resolvedLabel ? { label: resolvedLabel } : {}),
        ciphertext: enc.ciphertext,
        iv: enc.iv,
        authTag: enc.authTag,
        redacted,
      })
      .where(
        and(
          eq(integrationCredential.id, statePayload.credentialId),
          eq(integrationCredential.teamId, statePayload.teamId),
        ),
      )
      .returning({ id: integrationCredential.id });
    if (!updated) throw new HttpError(404, 'Credential to reconnect was not found.');
    return {
      returnTo: statePayload.returnTo,
      integrationKey: statePayload.integrationKey,
      credentialId: updated.id,
    };
  }

  const [created] = await db
    .insert(integrationCredential)
    .values({
      teamId: statePayload.teamId,
      integrationKey: statePayload.integrationKey,
      label: resolvedLabel,
      ciphertext: enc.ciphertext,
      iv: enc.iv,
      authTag: enc.authTag,
      redacted,
    })
    .returning({ id: integrationCredential.id });

  return {
    returnTo: statePayload.returnTo,
    integrationKey: statePayload.integrationKey,
    credentialId: created.id,
  };
}

export async function ensureFreshOAuthCredential<T extends Record<string, unknown>>(
  credentialId: number,
  teamId: number,
  integrationKey: string,
  config: T,
): Promise<T> {
  if (config.authMode !== 'oauth2') return config;
  const expiresAt = typeof config.expiresAt === 'string' ? config.expiresAt : undefined;
  const refreshToken = typeof config.refreshToken === 'string' ? config.refreshToken : undefined;
  if (!refreshToken || !isTokenExpiringSoon(expiresAt)) {
    return config;
  }

  const spec = getOAuthProviderSpec(integrationKey);
  if (!spec) return config;
  const { config: appConfig } = await getResolvedOAuthAppConfig(integrationKey);
  if (!appConfig) return config;

  try {
    const refreshed: OAuthTokenEnvelope = await refreshOAuthToken(spec, appConfig, {
      integrationKey,
      refreshToken,
    });
    if (typeof config.accountEmail === 'string' && config.accountEmail) {
      refreshed.accountEmail = config.accountEmail;
    }
    const tokenField = spec.tokenField ?? 'accessToken';
    const nextConfig = toStoredToolConfig(refreshed, tokenField);
    const enc = encryptSecret(JSON.stringify(nextConfig));
    const redacted = redactOAuthEnvelope(refreshed, tokenField);
    await db
      .update(integrationCredential)
      .set({
        ciphertext: enc.ciphertext,
        iv: enc.iv,
        authTag: enc.authTag,
        redacted,
      })
      .where(
        and(eq(integrationCredential.id, credentialId), eq(integrationCredential.teamId, teamId)),
      );
    return nextConfig as T;
  } catch (err) {
    console.warn(
      `[oauth-broker] Token refresh failed for credential ${credentialId} (${integrationKey}):`,
      err instanceof Error ? err.message : String(err),
    );
    return config;
  }
}

export async function leaseEphemeralToken(
  credentialId: number,
  teamId: number,
  requestedDomain?: string,
): Promise<{
  credentialId: number;
  integrationKey: string;
  accessToken: string;
  tokenType: string;
  expiresAt: string | null;
  envVar: string | null;
  allowedDomains: string[];
  accountEmail: string | null;
}> {
  const [row] = await db
    .select({
      id: integrationCredential.id,
      teamId: integrationCredential.teamId,
      integrationKey: integrationCredential.integrationKey,
      ciphertext: integrationCredential.ciphertext,
      iv: integrationCredential.iv,
      authTag: integrationCredential.authTag,
    })
    .from(integrationCredential)
    .where(
      and(eq(integrationCredential.id, credentialId), eq(integrationCredential.teamId, teamId)),
    )
    .limit(1);

  if (!row) throw new HttpError(404, 'Credential not found');
  const spec = requireSpec(row.integrationKey);

  if (requestedDomain && !isDomainAllowed(requestedDomain, spec.allowedDomains)) {
    throw new HttpError(
      403,
      `Domain '${requestedDomain}' is not allowlisted for '${row.integrationKey}'.`,
    );
  }

  const rawConfig = JSON.parse(
    decryptSecret({ ciphertext: row.ciphertext, iv: row.iv, authTag: row.authTag }),
  ) as Record<string, unknown>;

  if (rawConfig.authMode !== 'oauth2') {
    throw new HttpError(400, 'Ephemeral token lease is only supported for OAuth2 credentials.');
  }

  const fresh = await ensureFreshOAuthCredential(row.id, row.teamId, row.integrationKey, rawConfig);
  const tokenField = spec.tokenField ?? 'accessToken';
  const accessToken =
    (typeof fresh[tokenField] === 'string' ? (fresh[tokenField] as string) : '') ||
    (typeof fresh.accessToken === 'string' ? (fresh.accessToken as string) : '');
  if (!accessToken) {
    throw new HttpError(400, 'OAuth credential does not hold an active access token.');
  }

  return {
    credentialId: row.id,
    integrationKey: row.integrationKey,
    accessToken,
    tokenType: typeof fresh.tokenType === 'string' ? fresh.tokenType : 'Bearer',
    expiresAt: typeof fresh.expiresAt === 'string' ? fresh.expiresAt : null,
    envVar: spec.envVar ?? null,
    allowedDomains: [...spec.allowedDomains],
    accountEmail: typeof fresh.accountEmail === 'string' ? fresh.accountEmail : null,
  };
}
