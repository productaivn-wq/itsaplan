import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  clearLlmRouterCooldowns,
  getLlmRouterState,
  probeLlmRouter,
  saveLlmRouterProviders,
  syncLlmRouterCatalog,
  testLlmRouter,
  toggleLlmRouterProvider,
  updateLlmRouterCatalogDefaults,
  updateLlmRouterProviderCredentials,
  type LlmRouterState,
} from '@/lib/api/endpoints/llmRouter';

export function llmRouterQueryKey(teamId: number) {
  return ['team-llm-router', teamId] as const;
}

export function useLlmRouterStateQuery(teamId: number, enabled = true) {
  return useQuery({
    queryKey: llmRouterQueryKey(teamId),
    queryFn: () => getLlmRouterState(teamId),
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useSaveLlmRouterProviders(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { activeProviders: string[]; inactiveProviders?: string[] }) =>
      saveLlmRouterProviders(teamId, input),
    onSuccess: (data: LlmRouterState) => {
      qc.setQueryData(llmRouterQueryKey(teamId), data);
      toast.success('Saved LLM provider priority order');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to save provider order');
    },
  });
}

export function useToggleLlmRouterProvider(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ providerKey, enabled }: { providerKey: string; enabled: boolean }) =>
      toggleLlmRouterProvider(teamId, providerKey, enabled),
    onSuccess: (data: LlmRouterState, vars) => {
      qc.setQueryData(llmRouterQueryKey(teamId), data);
      toast.success(
        `${vars.providerKey} ${vars.enabled ? 'enabled' : 'disabled'} in LLM Router`,
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle provider');
    },
  });
}

export function useProbeLlmRouter(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => probeLlmRouter(teamId),
    onSuccess: (data: LlmRouterState) => {
      qc.setQueryData(llmRouterQueryKey(teamId), data);
      toast.success('Live provider & bridge probe completed');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to probe providers');
    },
  });
}

export function useSyncLlmRouterCatalog(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { providers?: string[]; timeout?: number } = {}) =>
      syncLlmRouterCatalog(teamId, input),
    onSuccess: (res) => {
      qc.setQueryData(llmRouterQueryKey(teamId), res.state);
      toast.success('Live model catalog synced');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to sync model catalog');
    },
  });
}

export function useUpdateLlmRouterCatalogDefaults(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      defaults?: Record<string, unknown>;
      providerModels?: Record<string, Record<string, string[]>>;
    }) => updateLlmRouterCatalogDefaults(teamId, input),
    onSuccess: (data: LlmRouterState) => {
      qc.setQueryData(llmRouterQueryKey(teamId), data);
      toast.success('Updated models_ssot.yaml defaults');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update catalog defaults');
    },
  });
}

export function useClearLlmRouterCooldowns(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { scopeKey?: string; platform?: string; clearAll?: boolean }) =>
      clearLlmRouterCooldowns(teamId, input),
    onSuccess: (res) => {
      qc.setQueryData(llmRouterQueryKey(teamId), res.state);
      toast.success(
        `Cleared cooldowns (${res.cleared_wal_rows} WAL, ${res.cleared_json_keys} JSON)`,
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to clear cooldowns');
    },
  });
}

export function useTestLlmRouter(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      prompt: string;
      model?: string;
      preferredProvider?: string | null;
      maxTokens?: number;
    }) => testLlmRouter(teamId, input),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: llmRouterQueryKey(teamId) });
      if (res.ok) {
        toast.success(
          `Routed via ${res.winning_provider ?? 'router'} (${res.latency_ms}ms)`,
        );
      } else {
        toast.error(res.error || 'Routing diagnostic failed');
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to run router test');
    },
  });
}

export function useUpdateLlmRouterProviderCredentials(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      providerKey,
      envKey,
      value,
    }: {
      providerKey: string;
      envKey: string;
      value: string;
    }) => updateLlmRouterProviderCredentials(teamId, providerKey, { envKey, value }),
    onSuccess: (res) => {
      qc.setQueryData(llmRouterQueryKey(teamId), res.state);
      toast.success(`Stored encrypted API key(s) in SecretVault (${res.env_key})`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to store provider credentials');
    },
  });
}
