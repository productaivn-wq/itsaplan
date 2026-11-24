import { Elysia, t } from 'elysia';
import { completeOAuthCallback } from './oauth-service';

const appUrl = (process.env.APP_URL?.split(',')[0]?.trim() || 'http://localhost:3001').replace(
  /\/+$/,
  '',
);

// Public OAuth2 callback mounted outside the planner session guard (like gitWebhookRoutes).
// Security relies on the AES-256-GCM authenticated state token issued by startOAuthFlow.
export const integrationOAuthCallbackRoutes = new Elysia({
  name: 'integrations-oauth-callback',
  detail: { tags: ['Integrations'] },
}).get(
  '/oauth/integrations/callback',
  async ({ query, set }) => {
    try {
      const result = await completeOAuthCallback({
        code: query.code,
        state: query.state,
        error: query.error,
        errorDescription: query.error_description,
      });
      const target = new URL(`${appUrl}${result.returnTo}`);
      target.searchParams.set('oauth', 'connected');
      target.searchParams.set('integration', result.integrationKey);
      target.searchParams.set('credentialId', String(result.credentialId));
      set.status = 302;
      set.headers.location = target.toString();
      return '';
    } catch (err) {
      const target = new URL(`${appUrl}/`);
      target.searchParams.set('oauth', 'error');
      target.searchParams.set(
        'reason',
        err instanceof Error ? err.message : 'OAuth connection failed',
      );
      set.status = 302;
      set.headers.location = target.toString();
      return '';
    }
  },
  {
    query: t.Object({
      code: t.Optional(t.String()),
      state: t.Optional(t.String()),
      error: t.Optional(t.String()),
      error_description: t.Optional(t.String()),
    }),
    detail: {
      summary: 'OAuth2 integration callback',
      description: 'Completes OAuth2 authorization code exchange for a team integration.',
      hide: true,
    },
  },
);
