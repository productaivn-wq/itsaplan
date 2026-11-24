import { Elysia } from 'elysia';
import { authContext } from '#shared/auth-context';
import { guards } from '#shared/guards';
import { accessErrors, commonErrors } from '#shared/responses';
import { teamParams } from '#modules/teams/model';
import {
  RouterJsonResponse,
  clearCooldownsBody,
  providerKeyParams,
  saveProvidersBody,
  syncCatalogBody,
  testRouterBody,
  toggleProviderBody,
  updateCatalogDefaultsBody,
  updateProviderCredentialsBody,
} from './model';
import {
  clearRouterCooldowns,
  getRouterState,
  probeRouter,
  saveRouterProviders,
  syncRouterCatalog,
  testRouter,
  toggleRouterProvider,
  updateRouterCatalogDefaults,
  updateRouterProviderCredentials,
} from './service';

export const llmRouterRoutes = new Elysia({
  name: 'llm-router',
  detail: { tags: ['LLM Router'] },
})
  .use(authContext)
  .use(guards)

  .get('/teams/:teamId/llm-router', () => getRouterState(), {
    params: teamParams,
    teamPermission: ['integrations', 'read'],
    response: { 200: RouterJsonResponse, ...accessErrors },
    detail: {
      summary: 'Get LLM Provider Router state',
      description:
        'Read active/inactive provider priority, readiness probe, model catalog, WAL telemetry, and active cooldowns.',
    },
  })

  .put(
    '/teams/:teamId/llm-router/providers',
    ({ body }) => saveRouterProviders(body),
    {
      params: teamParams,
      body: saveProvidersBody,
      teamPermission: ['integrations', 'edit'],
      response: { 200: RouterJsonResponse, ...commonErrors },
      detail: {
        summary: 'Save LLM provider priority order',
        description:
          'Persist ordered active and inactive LLM provider tiers to llm_providers.json across sovereign mirrors.',
      },
    },
  )

  .post(
    '/teams/:teamId/llm-router/providers/:providerKey/toggle',
    ({ params, body }) => toggleRouterProvider(params.providerKey, body.enabled),
    {
      params: providerKeyParams,
      body: toggleProviderBody,
      teamPermission: ['integrations', 'edit'],
      response: { 200: RouterJsonResponse, ...commonErrors },
      detail: {
        summary: 'Toggle LLM provider enabled state',
        description: 'Enable or disable an LLM provider in the active routing chain.',
      },
    },
  )

  .post('/teams/:teamId/llm-router/probe', () => probeRouter(), {
    params: teamParams,
    teamPermission: ['integrations', 'read'],
    response: { 200: RouterJsonResponse, ...accessErrors },
    detail: {
      summary: 'Probe LLM providers and local bridges',
      description: 'Run live readiness and loopback bridge probes for all LLM providers.',
    },
  })

  .post(
    '/teams/:teamId/llm-router/catalog/sync',
    ({ body }) => syncRouterCatalog(body),
    {
      params: teamParams,
      body: syncCatalogBody,
      teamPermission: ['integrations', 'edit'],
      response: { 200: RouterJsonResponse, ...commonErrors },
      detail: {
        summary: 'Sync live model catalog',
        description: 'Refresh live_model_catalog_cache.json from configured provider endpoints.',
      },
    },
  )

  .put(
    '/teams/:teamId/llm-router/catalog/defaults',
    ({ body }) => updateRouterCatalogDefaults(body),
    {
      params: teamParams,
      body: updateCatalogDefaultsBody,
      teamPermission: ['integrations', 'edit'],
      response: { 200: RouterJsonResponse, ...commonErrors },
      detail: {
        summary: 'Update model catalog defaults and preferences',
        description: 'Safely update role defaults and provider preferred/coding/fast/vision lists in models_ssot.yaml.',
      },
    },
  )

  .post(
    '/teams/:teamId/llm-router/cooldowns/clear',
    ({ body }) => clearRouterCooldowns(body),
    {
      params: teamParams,
      body: clearCooldownsBody,
      teamPermission: ['integrations', 'edit'],
      response: { 200: RouterJsonResponse, ...commonErrors },
      detail: {
        summary: 'Clear LLM model cooldowns',
        description: 'Clear active cooldown entries from RouterStateWAL and llm_model_cooldowns.json.',
      },
    },
  )

  .post('/teams/:teamId/llm-router/test', ({ body }) => testRouter(body), {
    params: teamParams,
    body: testRouterBody,
    teamPermission: ['integrations', 'edit'],
    response: { 200: RouterJsonResponse, ...commonErrors },
    detail: {
      summary: 'Run live LLM Router diagnostic test',
      description: 'Dispatch a bounded diagnostic prompt through LLMProviderRouter or a pinned provider.',
    },
  })

  .post(
    '/teams/:teamId/llm-router/providers/:providerKey/credentials',
    ({ params, body }) => updateRouterProviderCredentials(params.providerKey, body),
    {
      params: providerKeyParams,
      body: updateProviderCredentialsBody,
      teamPermission: ['integrations', 'edit'],
      response: { 200: RouterJsonResponse, ...commonErrors },
      detail: {
        summary: 'Store encrypted LLM provider credentials in SecretVault',
        description:
          'Write-only AES-256-GCM SecretVault storage for an LLM provider API key or key pool.',
      },
    },
  );
