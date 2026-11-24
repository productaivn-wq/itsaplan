// Read-only analytics queries behind the dashboard widgets. Each hook wraps an
// api.ts call and is keyed by qk.analytics(projectKey, kind, params) so widgets
// with different windows/filters cache independently. Feature-local: only the
// dashboards feature reads these.

import { useQuery } from '@tanstack/react-query';
import {
  type BurnupParams,
  type PulseUnit,
  getStats,
  getStatCount,
  getBreakdown,
  getBurnup,
  getPulse,
  getThroughput,
  getAgentRuns,
  getAgentRunStats,
  getWebhookStats,
  getAgentWorkload,
  listActivity,
} from '@/lib/api/endpoints/analytics';
import type { BreakdownBy } from '@/utils/dashboardWidgets';
import type { FilterSet } from '@/utils/filters';
import { qk } from '@/services/queryKeys';

export function useStatsQuery(projectKey: string, enabled = true) {
  return useQuery({
    queryKey: qk.analytics(projectKey, 'stats'),
    queryFn: () => getStats(projectKey),
    enabled: Boolean(projectKey) && enabled,
  });
}

export function useStatCountQuery(projectKey: string, filters: FilterSet, enabled = true) {
  return useQuery({
    queryKey: qk.analytics(projectKey, 'stat-count', { filters }),
    queryFn: () => getStatCount(projectKey, filters),
    enabled: Boolean(projectKey) && enabled,
  });
}

export function useBreakdownQuery(projectKey: string, by: BreakdownBy) {
  return useQuery({
    queryKey: qk.analytics(projectKey, 'breakdown', { by }),
    queryFn: () => getBreakdown(projectKey, by),
  });
}

export function usePulseQuery(
  projectKey: string,
  unit: PulseUnit,
  columns: number,
  scope: 'project' | 'me' = 'project',
  currentUserId?: string | null,
) {
  return useQuery({
    queryKey: qk.analytics(projectKey, 'pulse', { unit, columns, scope, currentUserId }),
    queryFn: () => getPulse(projectKey, unit, columns, scope),
    enabled: scope !== 'me' || Boolean(currentUserId),
  });
}

export function useThroughputQuery(projectKey: string, weeks: number) {
  return useQuery({
    queryKey: qk.analytics(projectKey, 'throughput', { weeks }),
    queryFn: () => getThroughput(projectKey, weeks),
  });
}

export function useBurnupQuery(projectKey: string, params: BurnupParams) {
  return useQuery({
    queryKey: qk.analytics(projectKey, 'burnup', params),
    queryFn: () => getBurnup(projectKey, params),
  });
}

export function useAgentRunsQuery(
  projectKey: string,
  params: { status: string | null; limit: number },
) {
  return useQuery({
    queryKey: qk.analytics(projectKey, 'agent-runs', params),
    queryFn: () => getAgentRuns(projectKey, params),
    refetchInterval: 5000,
  });
}

export function useAgentRunStatsQuery(projectKey: string, days: number) {
  return useQuery({
    queryKey: qk.analytics(projectKey, 'agent-run-stats', { days }),
    queryFn: () => getAgentRunStats(projectKey, days),
    refetchInterval: 5000,
  });
}

export function useWebhookStatsQuery(projectKey: string, days: number) {
  return useQuery({
    queryKey: qk.analytics(projectKey, 'webhook-stats', { days }),
    queryFn: () => getWebhookStats(projectKey, days),
  });
}

export function useAgentWorkloadQuery(projectKey: string) {
  return useQuery({
    queryKey: qk.analytics(projectKey, 'agent-workload'),
    queryFn: () => getAgentWorkload(projectKey),
    refetchInterval: 5000,
  });
}

export function useActivityFeedQuery(
  projectKey: string,
  params: { action: string | null; issueIds: number[] | null; limit: number },
) {
  return useQuery({
    queryKey: qk.analytics(projectKey, 'activity', params),
    queryFn: () => listActivity(projectKey, params),
    refetchInterval: 5000,
  });
}
