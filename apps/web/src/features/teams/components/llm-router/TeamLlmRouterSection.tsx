'use client';

import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock3,
  Cpu,
  Gauge,
  RefreshCw,
  Route,
  Sparkles,
  Terminal,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import SectionPageView from '@/components/common/page/SectionPageView';
import ListSkeleton from '@/components/common/skeleton/ListSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RouterTestResult } from '@/lib/api/endpoints/llmRouter';
import {
  useClearLlmRouterCooldowns,
  useLlmRouterStateQuery,
  useProbeLlmRouter,
  useSaveLlmRouterProviders,
  useSyncLlmRouterCatalog,
  useTestLlmRouter,
  useToggleLlmRouterProvider,
  useUpdateLlmRouterCatalogDefaults,
  useUpdateLlmRouterProviderCredentials,
} from '@/services/llmRouter.service';
import { useTeamQuery } from '@/services/teams.service';
import RouterModelsTab from './RouterModelsTab';
import RouterProvidersTab from './RouterProvidersTab';
import RouterTelemetryTab from './RouterTelemetryTab';
import RouterTestPlaygroundTab from './RouterTestPlaygroundTab';

export default function TeamLlmRouterSection({ teamId }: { teamId: number }) {
  const t = useTranslations('teams');
  const { data: team } = useTeamQuery(teamId);
  const permissions = team?.permissions.integrations;
  const canRead = Boolean(permissions?.read);
  const canEdit = Boolean(permissions?.edit);

  const stateQuery = useLlmRouterStateQuery(teamId, canRead);
  const saveOrderMutation = useSaveLlmRouterProviders(teamId);
  const toggleMutation = useToggleLlmRouterProvider(teamId);
  const probeMutation = useProbeLlmRouter(teamId);
  const syncMutation = useSyncLlmRouterCatalog(teamId);
  const defaultsMutation = useUpdateLlmRouterCatalogDefaults(teamId);
  const clearCooldownsMutation = useClearLlmRouterCooldowns(teamId);
  const testMutation = useTestLlmRouter(teamId);
  const credentialsMutation = useUpdateLlmRouterProviderCredentials(teamId);

  const [activeTab, setActiveTab] = useState<'providers' | 'models' | 'telemetry' | 'playground'>(
    'providers',
  );
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [lastTestResult, setLastTestResult] = useState<RouterTestResult | null>(null);

  const state = stateQuery.data;

  const headerActions = canRead ? (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5"
        disabled={probeMutation.isPending || stateQuery.isLoading}
        onClick={() => probeMutation.mutate()}
        data-testid="router-probe-btn"
      >
        <Activity className="size-3.5" />
        {t('llmRouter.actions.probe')}
      </Button>
      {canEdit && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          disabled={syncMutation.isPending || stateQuery.isLoading}
          onClick={() => syncMutation.mutate({})}
          data-testid="router-sync-btn"
        >
          <RefreshCw className={`size-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {t('llmRouter.actions.syncModels')}
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5"
        disabled={stateQuery.isFetching}
        onClick={() => void stateQuery.refetch()}
        data-testid="router-refresh-btn"
      >
        <RefreshCw className={`size-3.5 ${stateQuery.isFetching ? 'animate-spin' : ''}`} />
        {t('llmRouter.actions.refresh')}
      </Button>
    </div>
  ) : undefined;

  return (
    <SectionPageView
      title={t('sections.llmRouter.title')}
      description={t('sections.llmRouter.description')}
      wide
      actions={headerActions}
    >
      {!permissions ? (
        <ListSkeleton rows={4} rowClassName="h-14" />
      ) : !canRead ? (
        <p className="text-sm text-muted-foreground">{t('integrations.noAccess')}</p>
      ) : stateQuery.isLoading ? (
        <ListSkeleton rows={5} rowClassName="h-16" />
      ) : stateQuery.isError || !state ? (
        <div
          data-testid="router-gateway-offline"
          className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-5"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle className="size-4 text-amber-500" />
            <span>{t('llmRouter.offlineTitle')}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {stateQuery.error instanceof Error
              ? stateQuery.error.message
              : t('llmRouter.offlineHint')}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => void stateQuery.refetch()}
          >
            <RefreshCw className="size-3.5" />
            {t('llmRouter.actions.retry')}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-3.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('llmRouter.kpi.gateway')}</span>
                <Route className="size-3.5 text-primary" />
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  :{state.gateway.port} Online
                </Badge>
                <span className="text-sm font-semibold text-foreground">
                  {state.registry.active_providers.length} active
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('llmRouter.kpi.success24h')}</span>
                <Gauge className="size-3.5 text-emerald-500" />
              </div>
              <div className="mt-1.5 text-sm font-semibold text-foreground">
                {state.telemetry_summary.success_rate_24h !== null
                  ? `${state.telemetry_summary.success_rate_24h}%`
                  : '—'}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  ({state.telemetry_summary.ok_24h}/{state.telemetry_summary.calls_24h} calls)
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('llmRouter.kpi.latencyTokens')}</span>
                <Cpu className="size-3.5 text-primary" />
              </div>
              <div className="mt-1.5 text-sm font-semibold text-foreground">
                {state.telemetry_summary.avg_latency_ms !== null
                  ? `${Math.round(state.telemetry_summary.avg_latency_ms)}ms`
                  : '—'}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  · {state.telemetry_summary.total_tokens_24h.toLocaleString()} tok
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('llmRouter.kpi.cooldowns')}</span>
                <Clock3 className="size-3.5 text-amber-500" />
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {state.telemetry_summary.active_cooldowns_count} active
                </span>
                {canEdit && state.telemetry_summary.active_cooldowns_count > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-2 text-xs"
                    disabled={clearCooldownsMutation.isPending}
                    onClick={() => clearCooldownsMutation.mutate({ clearAll: true })}
                  >
                    <Trash2 className="size-3" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(val) =>
              setActiveTab(val as 'providers' | 'models' | 'telemetry' | 'playground')
            }
          >
            <TabsList>
              <TabsTrigger value="providers" className="gap-1.5 text-xs" data-testid="router-tab-providers">
                <Route className="size-3.5" />
                {t('llmRouter.tabs.providers')}
              </TabsTrigger>
              <TabsTrigger value="models" className="gap-1.5 text-xs" data-testid="router-tab-models">
                <Sparkles className="size-3.5" />
                {t('llmRouter.tabs.models')}
              </TabsTrigger>
              <TabsTrigger value="telemetry" className="gap-1.5 text-xs" data-testid="router-tab-telemetry">
                <Activity className="size-3.5" />
                {t('llmRouter.tabs.telemetry')}
              </TabsTrigger>
              <TabsTrigger value="playground" className="gap-1.5 text-xs" data-testid="router-tab-playground">
                <Terminal className="size-3.5" />
                {t('llmRouter.tabs.playground')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="providers" className="mt-4">
              <RouterProvidersTab
                state={state}
                canEdit={canEdit}
                savingOrder={saveOrderMutation.isPending}
                savingCredentials={credentialsMutation.isPending}
                togglingKey={togglingKey}
                onSaveOrder={(activeProviders, inactiveProviders) =>
                  saveOrderMutation.mutate({ activeProviders, inactiveProviders })
                }
                onToggleProvider={(providerKey, enabled) => {
                  setTogglingKey(providerKey);
                  toggleMutation.mutate(
                    { providerKey, enabled },
                    { onSettled: () => setTogglingKey(null) },
                  );
                }}
                onUpdateCredentials={(input) => credentialsMutation.mutateAsync(input)}
              />
            </TabsContent>

            <TabsContent value="models" className="mt-4">
              <RouterModelsTab
                state={state}
                canEdit={canEdit}
                syncing={syncMutation.isPending}
                savingDefaults={defaultsMutation.isPending}
                onSync={() => syncMutation.mutate({})}
                onSaveCatalog={(input) => defaultsMutation.mutate(input)}
              />
            </TabsContent>

            <TabsContent value="telemetry" className="mt-4">
              <RouterTelemetryTab
                state={state}
                canEdit={canEdit}
                clearing={clearCooldownsMutation.isPending}
                onClearCooldown={(input) => clearCooldownsMutation.mutate(input)}
              />
            </TabsContent>

            <TabsContent value="playground" className="mt-4">
              <RouterTestPlaygroundTab
                state={state}
                canEdit={canEdit}
                running={testMutation.isPending}
                lastResult={lastTestResult}
                onRunTest={(input) =>
                  testMutation.mutate(input, {
                    onSuccess: (res) => setLastTestResult(res),
                  })
                }
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </SectionPageView>
  );
}
