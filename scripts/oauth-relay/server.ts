#!/usr/bin/env bun
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { getOAuthProviderSpec, listOAuthProviderKeys } from '@repo/agent-tools';

/**
 * Stateless Zero-DB OAuth2 Relay for packaged ItsAPlan client deployments (Mode A).
 *
 * Holds ONLY the shared OAuth clientId/clientSecret in memory via env vars:
 *   RELAY_<UPPER_PROVIDER>_CLIENT_ID
 *   RELAY_<UPPER_PROVIDER>_CLIENT_SECRET
 *   RELAY_PUBLIC_URL (e.g. https://auth.itsaplan.com)
 *   RELAY_SHARED_SECRET (optional Bearer secret for /exchange and /refresh)
 *   ALLOWED_RETURN_ORIGINS (comma-separated origins; localhost/127.0.0.1 always allowed)
 *
 * Stores ZERO user tokens, ZERO client data, ZERO database state.
 */

const PORT = Number(process.env.PORT || 8787);
const PUBLIC_URL = (process.env.RELAY_PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
const SHARED_SECRET = (process.env.RELAY_SHARED_SECRET || '').trim();
const STATE_KEY = createHash('sha256')
  .update(`itsaplan-relay-state:${process.env.RELAY_STATE_SECRET || randomBytes(32).toString('hex')}`)
  .digest();

const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_RETURN_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

function isAllowedReturnTo(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') return true;
    return parsed.protocol === 'https:' && ALLOWED_ORIGINS.has(parsed.origin.toLowerCase());
  } catch {
    return false;
  }
}

function sealRelayState(payload: { returnTo: string; clientState: string }): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', STATE_KEY, iv);
  const ct = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${ct.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}`;
}

function openRelayState(token: string): { returnTo: string; clientState: string } {
  const [ivB64, ctB64, tagB64] = token.split('.');
  const decipher = createDecipheriv('aes-256-gcm', STATE_KEY, Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
  return JSON.parse(plain) as { returnTo: string; clientState: string };
}

function getRelayCreds(provider: string): { clientId: string; clientSecret: string } | null {
  const upper = provider.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const clientId = (process.env[`RELAY_${upper}_CLIENT_ID`] || '').trim();
  const clientSecret = (process.env[`RELAY_${upper}_CLIENT_SECRET`] || '').trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

function verifySharedSecret(req: Request): boolean {
  if (!SHARED_SECRET) return true;
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (token.length !== SHARED_SECRET.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(SHARED_SECRET));
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);

    if (req.method === 'GET' && url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        stateless: true,
        providers: listOAuthProviderKeys(),
      });
    }

    if (req.method === 'GET' && parts[0] === 'start' && parts[1]) {
      const provider = parts[1];
      const spec = getOAuthProviderSpec(provider);
      const creds = getRelayCreds(provider);
      if (!spec || !creds) return Response.json({ error: 'Provider not enabled on relay' }, { status: 404 });

      const returnTo = url.searchParams.get('return_to') || '';
      const clientState = url.searchParams.get('state') || '';
      if (!clientState || !isAllowedReturnTo(returnTo)) {
        return Response.json({ error: 'Invalid state or disallowed return_to origin' }, { status: 400 });
      }

      const authUrl = new URL(spec.authorizeUrl);
      authUrl.searchParams.set('client_id', creds.clientId);
      authUrl.searchParams.set('redirect_uri', `${PUBLIC_URL}/callback/${encodeURIComponent(provider)}`);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('state', sealRelayState({ returnTo, clientState }));
      const scope = url.searchParams.get('scope') || spec.scopes.join(' ');
      if (scope) authUrl.searchParams.set('scope', scope);
      const challenge = url.searchParams.get('code_challenge');
      if (challenge && spec.pkce !== false) {
        authUrl.searchParams.set('code_challenge', challenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');
      }
      if (spec.extraAuthorizeParams) {
        for (const [k, v] of Object.entries(spec.extraAuthorizeParams)) authUrl.searchParams.set(k, v);
      }
      return Response.redirect(authUrl.toString(), 302);
    }

    if (req.method === 'GET' && parts[0] === 'callback' && parts[1]) {
      const stateRaw = url.searchParams.get('state') || '';
      const { returnTo, clientState } = openRelayState(stateRaw);
      const target = new URL(returnTo);
      target.searchParams.set('state', clientState);
      for (const k of ['code', 'error', 'error_description']) {
        const val = url.searchParams.get(k);
        if (val) target.searchParams.set(k, val);
      }
      return Response.redirect(target.toString(), 302);
    }

    if (req.method === 'POST' && (parts[0] === 'exchange' || parts[0] === 'refresh') && parts[1]) {
      if (!verifySharedSecret(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const provider = parts[1];
      const spec = getOAuthProviderSpec(provider);
      const creds = getRelayCreds(provider);
      if (!spec || !creds) return Response.json({ error: 'Provider not enabled on relay' }, { status: 404 });

      const body = (await req.json()) as Record<string, string | undefined>;
      const form = new URLSearchParams();
      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      };

      if (parts[0] === 'exchange') {
        form.set('grant_type', 'authorization_code');
        form.set('code', body.code || '');
        form.set('redirect_uri', `${PUBLIC_URL}/callback/${encodeURIComponent(provider)}`);
        if (body.codeVerifier && spec.pkce !== false) form.set('code_verifier', body.codeVerifier);
      } else {
        form.set('grant_type', 'refresh_token');
        form.set('refresh_token', body.refreshToken || '');
      }

      if (provider === 'notion' && parts[0] === 'exchange') {
        headers.Authorization = `Basic ${Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')}`;
      } else {
        form.set('client_id', creds.clientId);
        form.set('client_secret', creds.clientSecret);
      }

      const vendorRes = await fetch(spec.tokenUrl, { method: 'POST', headers, body: form.toString() });
      const data = await vendorRes.json();
      return Response.json(data, { status: vendorRes.status });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  },
});

console.log(`[itsaplan-oauth-relay] Stateless OAuth2 relay listening on :${PORT} (${PUBLIC_URL})`);
