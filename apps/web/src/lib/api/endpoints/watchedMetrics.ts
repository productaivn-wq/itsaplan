import { request } from '@/lib/api/core/client';

export type MetricOperator = '>=' | '<=' | '>' | '<' | '==';

export type MetricSourceType =
  | 'live_stat'
  | 'live_filter'
  | 'live_agent_health'
  | 'live_webhook_health'
  | 'live_completion_rate'
  | 'manual'
  | 'api_push';

export type WatchedMetricStatus = 'healthy' | 'warning' | 'critical' | 'no_data';

export interface WatchedMetricDto {
  id: number;
  projectId: number;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  sourceType: MetricSourceType;
  sourceConfig: Record<string, unknown>;
  unit: string;
  operator: MetricOperator;
  targetValue: number;
  warnThreshold: number | null;
  critThreshold: number | null;
  currentValue: number | null;
  previousValue: number | null;
  delta: number | null;
  sparkline: number[];
  status: WatchedMetricStatus;
  lastRecordedAt: string | null;
  pinnedToOverview: boolean;
  position: number;
  externalKey: string | null;
  isVirtual: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WatchedMetricsSummaryDto {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  noData: number;
  pinnedCount: number;
}

export interface WatchedMetricsListResponse {
  items: WatchedMetricDto[];
  summary: WatchedMetricsSummaryDto;
  isStarterPreview: boolean;
}

export interface WatchedMetricSampleDto {
  id: number;
  metricId: number;
  projectId: number;
  value: number;
  status: WatchedMetricStatus;
  note: string | null;
  recordedByUserId: string | null;
  recordedAt: string;
}

export interface WatchedMetricSampleListResponse {
  items: WatchedMetricSampleDto[];
}

export interface ListWatchedMetricsParams {
  category?: string;
  status?: WatchedMetricStatus;
  pinnedOnly?: boolean;
}

export interface CreateWatchedMetricInput {
  slug?: string;
  name: string;
  description?: string | null;
  category?: string;
  sourceType: MetricSourceType;
  sourceConfig?: Record<string, unknown>;
  unit?: string;
  operator: MetricOperator;
  targetValue: number;
  warnThreshold?: number | null;
  critThreshold?: number | null;
  currentValue?: number | null;
  pinnedToOverview?: boolean;
  position?: number;
  externalKey?: string | null;
}

export type UpdateWatchedMetricInput = Partial<Omit<CreateWatchedMetricInput, 'slug'>>;

export interface RecordWatchedMetricSampleInput {
  value: number;
  note?: string | null;
  recordedAt?: string;
}

export const listWatchedMetrics = (projectKey: string, params: ListWatchedMetricsParams = {}) => {
  const q = new URLSearchParams();
  if (params.category) q.set('category', params.category);
  if (params.status) q.set('status', params.status);
  if (params.pinnedOnly) q.set('pinnedOnly', 'true');
  const qs = q.toString();
  return request<WatchedMetricsListResponse>(
    `/projects/${projectKey}/watched-metrics${qs ? `?${qs}` : ''}`,
  );
};

export const createWatchedMetric = (projectKey: string, input: CreateWatchedMetricInput) =>
  request<WatchedMetricDto>(`/projects/${projectKey}/watched-metrics`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const bootstrapWatchedMetrics = (projectKey: string) =>
  request<{ created: number; items: WatchedMetricDto[] }>(
    `/projects/${projectKey}/watched-metrics/bootstrap`,
    { method: 'POST' },
  );

export const ingestWatchedMetrics = (
  projectKey: string,
  items: CreateWatchedMetricInput[],
  recordSample = true,
) =>
  request<{ upserted: number; samplesRecorded: number }>(
    `/projects/${projectKey}/watched-metrics/ingest`,
    {
      method: 'POST',
      body: JSON.stringify({ items, recordSample }),
    },
  );

export const updateWatchedMetric = (metricId: number, input: UpdateWatchedMetricInput) =>
  request<WatchedMetricDto>(`/watched-metrics/${metricId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

export const deleteWatchedMetric = (metricId: number) =>
  request<void>(`/watched-metrics/${metricId}`, { method: 'DELETE' });

export const recordWatchedMetricSample = (
  metricId: number,
  input: RecordWatchedMetricSampleInput,
) =>
  request<{ metric: WatchedMetricDto; sample: WatchedMetricSampleDto }>(
    `/watched-metrics/${metricId}/samples`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );

export const listWatchedMetricSamples = (metricId: number, limit = 30) =>
  request<WatchedMetricSampleListResponse>(`/watched-metrics/${metricId}/samples?limit=${limit}`);
