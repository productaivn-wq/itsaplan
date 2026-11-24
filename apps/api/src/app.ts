import { createHmac, randomBytes } from 'node:crypto';
import {
  auth,
  getSessionFromHeaders,
  oAuthDiscoveryMetadata,
  oAuthProtectedResourceMetadata,
  trustedOrigins,
  getAuthSettings,
  hasConfiguredGoogle,
  hasConfiguredOidc,
  getOidcLabel,
} from '@repo/auth';
import { db, hasConfiguredEmailProvider, session as sessionTable, user } from '@repo/db';
import { eq } from 'drizzle-orm';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import { planner } from './planner';
import { mountMcp } from './mcp/mount';
import { setMcpApp } from './mcp/app-ref';
import { gitWebhookRoutes } from './modules/git/webhook';
import { integrationOAuthCallbackRoutes } from './modules/agents/integrations/oauth-callback';
import { scimRoutes } from './modules/scim';
import { syncOidcGroupsAfterCallback } from './modules/scim/oidc-sync';
import { normalizeOpenApiResponse } from './openapi';
import pkg from '../../../package.json';

const apiUrl = (process.env.API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
const appUrl = (process.env.APP_URL?.split(',')[0]?.trim() || 'http://localhost:3001').replace(
  /\/+$/,
  '',
);
const apiDescription = `REST API for projects, work items, AI agents, Git integrations, analytics, and instance administration.

## Quick start

1. Create a personal API key in [Account settings](${appUrl}/account/api-keys). The key is shown once and carries the same permissions as its owner.
2. Send it in the \`x-api-key\` header. Never put a key in a URL, issue, comment, or source file.
3. In routes containing \`{projectKey}\`, name the project by its \`ref\`, \`<team>.<KEY>\` (e.g. \`acme.MKT\`). A bare key also works while only one of your teams has a project with it. This page is opened from a project, but the API document is instance-wide.

\`\`\`sh
curl "${apiUrl}/projects" \\
  --header "x-api-key: YOUR_PERSONAL_API_KEY"
\`\`\`

JSON errors use \`{ "error": "message" }\` and may also include a stable \`code\`. Pagination parameters and response envelopes are documented per operation.

For agent clients, use the MCP endpoint at [${apiUrl}/mcp](${apiUrl}/mcp). SCIM, worker-internal routes, and repository webhooks use the separate credentials shown on their operations.`;

// The assembled Elysia app, without `.listen()`. `index.ts` imports this and
// binds the port; tests import it and pass it to Eden Treaty to drive routes in
// memory (no network). Keep the chain unbroken so `type App` stays accurate.
let appAliasHandler: ((req: Request) => Response | Promise<Response>) | null = null;

// Disable Bun's native systemRouter so Elysia's AOT router constructs plain
// configurable params objects; Bun 1.4.x native req.params properties are
// non-configurable, causing elysia@1.4.32 prepareDefaultInput to throw 500
// on every route using t.Numeric() params (e.g. /teams/:teamId/*).
export const app = new Elysia({ systemRouter: false })
  .onRequest(({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/sync/rev') || url.pathname.includes('/board')) {
      console.log(`[API ${new Date().toISOString()}] ${request.method} ${url.pathname}${url.search}`);
    }
  })
  .use(
    cors({
      origin: trustedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    }),
  )
  .onAfterHandle({ as: 'global' }, ({ request, response }) =>
    normalizeOpenApiResponse(request, response),
  )
  // OpenAPI docs. Mounted on the main app (outside the planner's session guard)
  // so the UI at /docs and the spec at /docs/json are reachable without a
  // session. The spec is generated from the `t` schemas on every route.
  .use(
    swagger({
      path: '/docs',
      // Render with Scalar's own "default" theme to match the better-auth reference
      // at /api/auth/reference. `customCss: ""` drops the gradient theme that
      // @elysiajs/swagger injects by default (it falls back to elysiajsTheme only
      // when customCss is null/undefined).
      scalarConfig: {
        theme: 'default',
        customCss: '',
      },
      documentation: {
        info: {
          title: "It's a Plan API",
          version: pkg.version,
          description: apiDescription,
        },
        servers: [{ url: apiUrl, description: 'Configured public API origin' }],
        tags: [
          { name: 'Projects', description: 'Projects and the full work items view' },
          { name: 'Teams', description: 'Teams that own projects' },
          { name: 'Members', description: 'Project membership and roles' },
          { name: 'Roles', description: 'Project roles and their permissions' },
          { name: 'Invites', description: 'Project invites (create, accept, reject)' },
          { name: 'Columns', description: 'Work items columns and their order' },
          { name: 'Issue Types', description: 'Per-project issue types' },
          { name: 'Labels', description: 'Labels and label groups' },
          { name: 'AI Agents', description: 'AI agents attached to a project' },
          {
            name: 'Integrations',
            description: 'Stored integration credentials (LLM keys and tool creds)',
          },
          {
            name: 'LLM Router',
            description:
              'Sovereign LLMProviderRouter priority, catalog, cooldowns, telemetry, and live diagnostics.',
          },
          { name: 'Agent Skills', description: 'Skill library given to internal agents' },
          {
            name: 'Agent Runner',
            description: "Run queue an external agent's runner drains with the agent's API key",
          },
          {
            name: 'Agent Chat',
            description: "Chat with an external agent: the member's messages and its runner's feed",
          },
          {
            name: 'Agent Tools',
            description: 'Tools configured on a credential and given to agents',
          },
          { name: 'Custom Fields', description: 'Global and type-scoped custom fields' },
          { name: 'Issue Templates', description: 'Presets a new issue can be created from' },
          { name: 'Issues', description: 'Issues, their fields, feed, and comments' },
          {
            name: 'Initiatives',
            description: 'Initiatives (issue groupings) and their activity feed',
          },
          { name: 'Cycles', description: 'Cycles (time-boxed periods of work) and their issues' },
          { name: 'Attachments', description: 'Issue attachments and raw bytes' },
          {
            name: 'Chat attachments',
            description: 'Files uploaded in an agent chat and their raw bytes',
          },
          { name: 'Imports', description: 'Import drafts that turn an uploaded file into issues' },
          {
            name: 'Import/Export',
            description:
              'Background jobs that import issues from an external tracker (Plane), and a ' +
              "project's own data exported as a portable JSON snapshot",
          },
          { name: 'Avatars', description: "Current user's avatar image (upload and raw bytes)" },
          { name: 'Views', description: 'Saved work items views' },
          { name: 'Share', description: 'Public read-only sharing of issues and views' },
          { name: 'Actions', description: 'Project automation actions' },
          { name: 'Webhooks', description: 'Outgoing webhook subscriptions' },
          {
            name: 'Git',
            description:
              'Repository integration: the inbound pull request webhook and its per-project settings',
          },
          { name: 'Agent Schedules', description: 'Recurring tasks for internal agents' },
          { name: 'Dashboards', description: 'Saved analytics dashboards' },
          {
            name: 'Directory',
            description: 'Synced project contacts and communication channels',
          },
          {
            name: 'Watched Metrics',
            description: 'Per-project watched KPIs, targets, thresholds, and readings',
          },
          { name: 'Documents', description: 'Shared project Docs pages' },
          { name: 'Link previews', description: 'Public web link metadata' },
          { name: 'Note boards', description: 'Freeform canvases of sticky notes' },
          { name: 'Notifications', description: "The session user's inbox notifications" },
          { name: 'Sync', description: 'Change markers a client polls for live refresh' },
          {
            name: 'Telegram',
            description: "The session user's linked Telegram account",
          },
          {
            name: 'Analytics',
            description: 'Project metrics: stats, pulse, throughput, breakdowns, activity',
          },
          { name: 'Charts', description: 'Chart specs an agent builds to show in a chat' },
          {
            name: 'Webhook test',
            description: 'Test receiver for inspecting webhook deliveries (dev aid)',
          },
          {
            name: 'God',
            description:
              'Instance administration: registration policy, email provider, sign-in providers, ' +
              'SCIM provisioning',
          },
          {
            name: 'SCIM',
            description: 'SCIM 2.0 provisioning, authenticated with the instance SCIM bearer token',
          },
          {
            name: 'System',
            description: 'Liveness, the current session user, and the instance sign-in policy',
          },
        ],
        // Planner routes are session-gated. Besides the session cookie (sent by the
        // browser, not modelled here), a request may carry an `x-api-key` header:
        // better-auth's apiKey plugin resolves it to the owner's session
        // (enableSessionForAPIKeys). Declaring it here lets the Scalar UI at /docs
        // authorize with a key and call the planner routes.
        components: {
          securitySchemes: {
            apiKey: { type: 'apiKey', in: 'header', name: 'x-api-key' },
            scimBearer: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'opaque',
              description: 'Instance SCIM token generated in God mode.',
            },
            gitHubSignature: {
              type: 'apiKey',
              in: 'header',
              name: 'x-hub-signature-256',
              description: 'GitHub HMAC signature generated from the raw request body.',
            },
            gitLabToken: {
              type: 'apiKey',
              in: 'header',
              name: 'x-gitlab-token',
              description: 'GitLab secret token configured on the project webhook.',
            },
            giteaSignature: {
              type: 'apiKey',
              in: 'header',
              name: 'x-gitea-signature',
              description: 'Gitea HMAC signature generated from the raw request body.',
            },
            forgejoSignature: {
              type: 'apiKey',
              in: 'header',
              name: 'x-forgejo-signature',
              description: 'Forgejo HMAC signature generated from the raw request body.',
            },
            bitbucketSignature: {
              type: 'apiKey',
              in: 'header',
              name: 'x-hub-signature',
              description: 'Bitbucket HMAC signature generated from the raw request body.',
            },
          },
        },
        security: [{ apiKey: [] }],
      },
    }),
  )
  // OAuth discovery lives at the API origin because MCP clients resolve the
  // authorization server from protected-resource metadata before entering the
  // Better Auth base path.
  .get('/.well-known/oauth-authorization-server', ({ request }) =>
    oAuthDiscoveryMetadata(auth)(request),
  )
  .get('/.well-known/oauth-protected-resource/mcp', ({ request }) =>
    oAuthProtectedResourceMetadata(auth)(request),
  )
  // 1-Click Sovereign Agentic OS & Local Google SSO endpoint (SPEC-ITSAPLAN-AUTH-VAULT-311 / hardened by 53.ACT.588 & 53.ACT.592).
  // Strictly fail-closed in production, non-loopback hosts/peers, and cross-site/non-JSON CSRF requests; requires configured HMAC secret.
  .post('/api/auth/sso-instant', async ({ request, server }) => {
    const reqUrl = new URL(request.url);
    const hostname = reqUrl.hostname.toLowerCase();
    const isLoopback =
      hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1' || hostname === '[::1]';
    const LOOPBACK_PEER_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
    const peerIp = server?.requestIP?.(request)?.address ?? null;
    const isPeerLoopback = server ? peerIp !== null && LOOPBACK_PEER_IPS.has(peerIp) : true;
    if (process.env.NODE_ENV === 'production' || !isLoopback || !isPeerLoopback) {
      return new Response(
        JSON.stringify({ error: 'Local instant SSO is disabled outside loopback development environments' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const contentType = (request.headers.get('content-type') ?? '').toLowerCase();
    if (!contentType.startsWith('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Local instant SSO requires application/json Content-Type' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const secFetchSite = (request.headers.get('sec-fetch-site') ?? '').trim().toLowerCase();
    const ALLOWED_FETCH_SITES = new Set(['', 'same-origin', 'same-site', 'none']);
    if (!ALLOWED_FETCH_SITES.has(secFetchSite)) {
      return new Response(
        JSON.stringify({ error: 'Cross-site requests to local instant SSO are forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const origin = (request.headers.get('origin') ?? '').trim().toLowerCase();
    const ALLOWED_LOOPBACK_ORIGINS = new Set([
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]);
    if (origin && !ALLOWED_LOOPBACK_ORIGINS.has(origin)) {
      return new Response(
        JSON.stringify({ error: 'Origin is not in the loopback SSO allowlist' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const secret =
      process.env.ITSAPLAN_RESOLVED_BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET;
    if (!secret) {
      return new Response(
        JSON.stringify({ error: 'SSO signing secret is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const owners = await db
      .select()
      .from(user)
      .where(eq(user.role, 'god'));
    const activeOwner = owners.find((u) => u.active !== false) ?? owners[0];
    if (!activeOwner) {
      return new Response(JSON.stringify({ error: 'No active owner account found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const rawToken = randomBytes(24).toString('base64url').slice(0, 32);
    const sessionId = randomBytes(16).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(sessionTable).values({
      id: sessionId,
      token: rawToken,
      userId: activeOwner.id,
      expiresAt,
      createdAt: now,
      updatedAt: now,
      ipAddress: peerIp ?? '127.0.0.1',
      userAgent: request.headers.get('user-agent') ?? 'ACCORD-Sovereign-SSO/1.0',
    });
    const sig = encodeURIComponent(
      createHmac('sha256', secret).update(rawToken).digest('base64'),
    );
    const secureFlag = reqUrl.protocol === 'https:' ? '; Secure' : '';
    const cookieVal = `better-auth.session_token=${rawToken}.${sig}; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax${secureFlag}`;
    return new Response(
      JSON.stringify({
        redirect: false,
        user: {
          id: activeOwner.id,
          email: activeOwner.email,
          name: activeOwner.name,
          role: activeOwner.role,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieVal,
        },
      },
    );
  })
  // better-auth: forward every /api/auth/* request to its handler. The OIDC
  // callback gets one extra step afterwards: folding the provider's `groups` claim
  // into the SCIM group tables, so a group mapped to a project in god mode grants
  // access on an OIDC-only instance too, not just one that also runs a SCIM sync.
  .all('/api/auth/*', async ({ request }) => {
    const response = await auth.handler(request);
    if (new URL(request.url).pathname.startsWith('/api/auth/oauth2/callback/')) {
      await syncOidcGroupsAfterCallback(response);
    }
    return response;
  })
  // Example protected handler: read the session from better-auth.
  .get(
    '/me',
    async ({ request }) => {
      const session = await getSessionFromHeaders(request.headers);
      // A deactivated account is not signed in as far as the app is concerned:
      // every planner route answers 401 for it, and this is what the screens ask
      // first. Deactivation arrives over SCIM, after the session was opened.
      if (!session || session.user.active === false) return { authenticated: false };
      return { authenticated: true, user: session.user };
    },
    {
      detail: {
        tags: ['System'],
        summary: 'Get the current session user',
        description:
          'Resolve the request credentials to a session and return the user it belongs to. ' +
          'Without a session, or for a deactivated account, it answers ' +
          '`{ authenticated: false }` instead of failing.',
      },
    },
  )
  // What the sign-in and sign-up screens need before there is a session: whether
  // registration is open, invite-only, or closed, and which sign-in methods are
  // offered. Public on purpose — the screens are reached logged out. It carries no
  // credentials, only the instance's own policy.
  .get(
    '/auth-config',
    async () => {
      const settings = await getAuthSettings();
      const emailEnabled = await hasConfiguredEmailProvider();
      return {
        registration: settings.registration,
        // Only usable when the instance can actually send mail.
        magicLink: settings.magicLink && emailEnabled,
        // Cleared together with the mail provider, so the raw setting is what the
        // sign-up endpoint enforces.
        requireEmailVerification: settings.requireEmailVerification,
        emailEnabled,
        // Whether the email/password form is offered at all. The api refuses to turn
        // it off while no provider below is usable, so this is never false alone.
        emailPassword: settings.emailPassword,
        google: await hasConfiguredGoogle(),
        oidc: await hasConfiguredOidc(),
        // Names the operator's own identity provider, so the button shows it as
        // given. Empty falls back to a translated default.
        oidcLabel: await getOidcLabel(),
        hasUsers: (await db.$count(user)) > 0,
      };
    },
    {
      detail: {
        tags: ['System'],
        summary: "Get the instance's sign-in configuration",
        description:
          'Report the registration policy and the sign-in methods the instance offers, so the ' +
          'sign-in and sign-up screens can render before there is a session. Public.',
      },
    },
  )
  // Root doubles as the liveness/health endpoint.
  .get('/', () => ({ name: "ACCORD API (It's a Plan)", product: 'ACCORD', status: 'ok' }), {
    detail: {
      tags: ['System'],
      summary: 'Check that the api is up',
      description: 'Liveness probe: returns the api name and `status: "ok"`.',
    },
  })
  .get('/health', () => ({ status: 'ok' }), {
    detail: {
      tags: ['System'],
      summary: 'Check that the api is up',
      description: 'Health probe.',
    },
  })
  // Inbound repository webhook receiver (authenticated by its per-project secret).
  .use(gitWebhookRoutes)
  // Public OAuth2 integration callback (authenticated by AES-GCM sealed state).
  .use(integrationOAuthCallbackRoutes)
  // SCIM 2.0 provisioning (authenticated by the instance SCIM bearer token). Mounted
  // here rather than under the planner: the planner's session guard would answer 401
  // before the bearer check runs, and its error handler emits a body SCIM does not
  // understand.
  .use(scimRoutes)
  // Alias /api/projects and /api/projects/* to /projects and /projects/* for REST callers using /api prefix
  .all('/api/projects', ({ request }) => {
    const url = new URL(request.url);
    url.pathname = '/projects';
    return appAliasHandler!(new Request(url.toString(), request));
  })
  .all('/api/projects/*', ({ request }) => {
    const url = new URL(request.url);
    url.pathname = url.pathname.replace(/^\/api/, '');
    return appAliasHandler!(new Request(url.toString(), request));
  })
  // Planner API: projects, issues, and their dependent entities.
  .use(planner);

appAliasHandler = (req) => app.handle(req);

// MCP endpoint (POST /mcp). Added after the chain so `type App` (the Eden client
// type) stays the REST surface; the MCP endpoint is JSON-RPC, not called via Eden.
// Its tools are generated from the planner routes tagged with mcpTool().
mountMcp(app);

// Hands the assembled app to the internal agent runtime, which builds an agent's
// tools from the same mcpTool() routes and dispatches them in process. It cannot
// import this module without a cycle, so the reference is passed here.
setMcpApp(app);

// App type — useful for Eden Treaty (type-safe client) on the frontend and in tests.
export type App = typeof app;
