import { t } from 'elysia';

export const providerKeyParams = t.Object({
  teamId: t.Numeric(),
  providerKey: t.String({ minLength: 1, maxLength: 64 }),
});

export const saveProvidersBody = t.Object({
  activeProviders: t.Array(t.String({ minLength: 1, maxLength: 64 })),
  inactiveProviders: t.Optional(t.Array(t.String({ minLength: 1, maxLength: 64 }))),
});

export const toggleProviderBody = t.Object({
  enabled: t.Boolean(),
});

export const updateProviderCredentialsBody = t.Object({
  envKey: t.String({ minLength: 1, maxLength: 64 }),
  value: t.String({ minLength: 1, maxLength: 8192 }),
});

export const syncCatalogBody = t.Object({
  providers: t.Optional(t.Array(t.String({ minLength: 1, maxLength: 64 }))),
  timeout: t.Optional(t.Number({ minimum: 2, maximum: 60 })),
});

export const updateCatalogDefaultsBody = t.Object({
  defaults: t.Optional(t.Record(t.String(), t.Any())),
  providerModels: t.Optional(
    t.Record(t.String(), t.Record(t.String(), t.Array(t.String()))),
  ),
});

export const clearCooldownsBody = t.Object({
  scopeKey: t.Optional(t.String()),
  platform: t.Optional(t.String()),
  clearAll: t.Optional(t.Boolean()),
});

export const testRouterBody = t.Object({
  prompt: t.String({ minLength: 1, maxLength: 4000 }),
  model: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
  preferredProvider: t.Optional(t.Nullable(t.String({ minLength: 1, maxLength: 64 }))),
  maxTokens: t.Optional(t.Integer({ minimum: 16, maximum: 1024 })),
});

export const RouterJsonResponse = t.Record(t.String(), t.Any());
