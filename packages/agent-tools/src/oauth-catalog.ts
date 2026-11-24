import type { Integration, OAuth2CatalogMeta, OAuth2ProviderSpec } from './types';

// Declarative Zero-MCP OAuth2 provider specifications (mirrors AGY's auth.json).
// Used by ItsAPlan's Dual-Mode OAuth2 Broker (Direct BYO-App & Stateless Relay) and
// by local CLI harnesses via the short-lived token lease endpoint.
export const OAUTH2_PROVIDER_SPECS: Record<string, OAuth2ProviderSpec> = {
  google_workspace: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    scopes: [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
    extraAuthorizeParams: { access_type: 'offline', prompt: 'consent' },
    allowedDomains: [
      'www.googleapis.com',
      'gmail.googleapis.com',
      'docs.googleapis.com',
      'sheets.googleapis.com',
    ],
    pkce: true,
    delivery: 'env',
    envVar: 'GCLI_ACCESS_TOKEN',
    identity: {
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
      jsonPath: 'email',
    },
    clientReviewNote:
      'Google Workspace Internal mode requires no review. Public external Gmail/Drive scopes require Google verification + CASA Tier 2; Calendar-only requires verification without CASA.',
  },
  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['repo', 'read:user', 'user:email'],
    allowedDomains: ['api.github.com'],
    pkce: true,
    delivery: 'env',
    envVar: 'GH_TOKEN',
    identity: {
      url: 'https://api.github.com/user',
      jsonPath: 'login',
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'ItsAPlan-OAuth-Broker',
      },
    },
  },
  atlassian: {
    authorizeUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    scopes: [
      'read:jira-work',
      'write:jira-work',
      'read:confluence-content.all',
      'read:me',
      'offline_access',
    ],
    extraAuthorizeParams: { audience: 'api.atlassian.com', prompt: 'consent' },
    allowedDomains: ['api.atlassian.com'],
    pkce: true,
    delivery: 'env',
    envVar: 'ATLASSIAN_ACCESS_TOKEN',
    identity: {
      url: 'https://api.atlassian.com/me',
      jsonPath: 'email',
    },
  },
  notion: {
    authorizeUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scopes: [],
    extraAuthorizeParams: { owner: 'user' },
    tokenField: 'token',
    allowedDomains: ['api.notion.com'],
    pkce: false,
    delivery: 'bearer',
    envVar: 'NOTION_TOKEN',
  },
  slack: {
    authorizeUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['channels:read', 'chat:write', 'users:read'],
    allowedDomains: ['slack.com'],
    pkce: true,
    delivery: 'bearer',
    envVar: 'SLACK_BOT_TOKEN',
  },
  linear: {
    authorizeUrl: 'https://linear.app/oauth/authorize',
    tokenUrl: 'https://api.linear.app/oauth/token',
    scopes: ['read', 'write'],
    allowedDomains: ['api.linear.app'],
    pkce: true,
    delivery: 'bearer',
    envVar: 'LINEAR_ACCESS_TOKEN',
  },
  discord: {
    authorizeUrl: 'https://discord.com/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    scopes: ['identify', 'guilds'],
    allowedDomains: ['discord.com'],
    pkce: true,
    delivery: 'bearer',
    envVar: 'DISCORD_ACCESS_TOKEN',
    identity: {
      url: 'https://discord.com/api/users/@me',
      jsonPath: 'username',
    },
  },
  threads: {
    authorizeUrl: 'https://threads.net/oauth/authorize',
    tokenUrl: 'https://graph.threads.net/oauth/access_token',
    scopes: ['threads_basic', 'threads_content_publish', 'threads_read_replies'],
    tokenField: 'accessToken',
    allowedDomains: ['graph.threads.net'],
    pkce: false,
    delivery: 'bearer',
    clientReviewNote:
      'Meta App Development mode covers your own accounts; external clients require Meta App Review.',
  },
  instagram: {
    authorizeUrl: 'https://www.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    scopes: ['instagram_business_basic', 'instagram_business_content_publish'],
    tokenField: 'accessToken',
    allowedDomains: ['graph.instagram.com', 'graph.facebook.com'],
    pkce: false,
    delivery: 'bearer',
    clientReviewNote:
      'Meta App Development mode covers your own business accounts; external clients require Meta App Review.',
  },
};

export function getOAuthProviderSpec(key: string): OAuth2ProviderSpec | undefined {
  return OAUTH2_PROVIDER_SPECS[key];
}

export function listOAuthProviderKeys(): string[] {
  return Object.keys(OAUTH2_PROVIDER_SPECS);
}

export function toOAuth2CatalogMeta(spec: OAuth2ProviderSpec): OAuth2CatalogMeta {
  return {
    scopes: [...spec.scopes],
    allowedDomains: [...spec.allowedDomains],
    pkce: spec.pkce !== false,
    delivery: spec.delivery ?? 'bearer',
    envVar: spec.envVar,
    clientReviewNote: spec.clientReviewNote,
  };
}

/**
 * Safely resolves a dot-separated JSON path on an unknown payload.
 * Returns a trimmed non-empty string if found, otherwise undefined.
 */
export function resolveJsonPath(obj: unknown, path: string): string | undefined {
  if (!obj || typeof obj !== 'object' || !path.trim()) return undefined;
  let current: unknown = obj;
  for (const segment of path.split('.')) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  if (typeof current !== 'string') return undefined;
  const trimmed = current.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function makeOAuthConnectorIntegration(key: string, label: string): Integration {
  return {
    key,
    label,
    authModes: ['oauth2', 'api_key'],
    oauth2: OAUTH2_PROVIDER_SPECS[key],
    credentialSchema: [
      {
        key: 'accessToken',
        label: 'Access token',
        type: 'secret',
        required: true,
        placeholder: 'Obtained via 1-Click OAuth or pasted manually',
      },
    ],
    tools: [],
  };
}

// Lightweight zero-MCP OAuth connectors exposed in the team catalog so CLI harnesses
// and workflows can lease OAuth tokens without duplicating secrets in SecretVault.
export const OAUTH_CONNECTOR_INTEGRATIONS: Integration[] = [
  makeOAuthConnectorIntegration('google_workspace', 'Google Workspace'),
  makeOAuthConnectorIntegration('github', 'GitHub'),
  makeOAuthConnectorIntegration('atlassian', 'Atlassian (Jira & Confluence)'),
  makeOAuthConnectorIntegration('slack', 'Slack'),
  makeOAuthConnectorIntegration('linear', 'Linear'),
  makeOAuthConnectorIntegration('discord', 'Discord'),
];
