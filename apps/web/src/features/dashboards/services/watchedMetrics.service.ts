import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/core/client';
import {
  bootstrapWatchedMetrics,
  createWatchedMetric,
  deleteWatchedMetric,
  listWatchedMetrics,
  listWatchedMetricSamples,
  recordWatchedMetricSample,
  updateWatchedMetric,
  type CreateWatchedMetricInput,
  type ListWatchedMetricsParams,
  type RecordWatchedMetricSampleInput,
  type UpdateWatchedMetricInput,
} from '@/lib/api/endpoints/watchedMetrics';
import { qk } from '@/services/queryKeys';

function errorText(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function useWatchedMetricsQuery(
  projectKey: string,
  params?: ListWatchedMetricsParams,
  enabled = true,
) {
  return useQuery({
    queryKey: params ? [...qk.watchedMetrics(projectKey), params] : qk.watchedMetrics(projectKey),
    queryFn: () => listWatchedMetrics(projectKey, params),
    enabled: Boolean(projectKey) && enabled,
  });
}

export function useWatchedMetricSamplesQuery(
  metricId: number | null,
  limit = 30,
  enabled = true,
) {
  return useQuery({
    queryKey:
      metricId != null
        ? [...qk.watchedMetricSamples(metricId), limit]
        : (['watchedMetricSamples', 'none'] as const),
    queryFn: () => listWatchedMetricSamples(metricId!, limit),
    enabled: metricId != null && metricId > 0 && enabled,
  });
}

export function useCreateWatchedMetric(projectKey: string) {
  const t = useTranslations('dashboards.watchedMetrics.toasts');
  const tCommon = useTranslations('common');
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWatchedMetricInput) => createWatchedMetric(projectKey, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.watchedMetrics(projectKey) });
      toast.success(t('created'));
    },
    onError: (err) => toast.error(errorText(err, tCommon('genericError'))),
    meta: { suppressErrorToast: true },
  });
}

export function useBootstrapWatchedMetrics(projectKey: string) {
  const t = useTranslations('dashboards.watchedMetrics.toasts');
  const tCommon = useTranslations('common');
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => bootstrapWatchedMetrics(projectKey),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.watchedMetrics(projectKey) });
      toast.success(t('bootstrapped'));
    },
    onError: (err) => toast.error(errorText(err, tCommon('genericError'))),
    meta: { suppressErrorToast: true },
  });
}

export function useUpdateWatchedMetric(projectKey: string) {
  const t = useTranslations('dashboards.watchedMetrics.toasts');
  const tCommon = useTranslations('common');
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ metricId, input }: { metricId: number; input: UpdateWatchedMetricInput }) =>
      updateWatchedMetric(metricId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.watchedMetrics(projectKey) });
      toast.success(t('updated'));
    },
    onError: (err) => toast.error(errorText(err, tCommon('genericError'))),
    meta: { suppressErrorToast: true },
  });
}

export function useDeleteWatchedMetric(projectKey: string) {
  const t = useTranslations('dashboards.watchedMetrics.toasts');
  const tCommon = useTranslations('common');
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (metricId: number) => deleteWatchedMetric(metricId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.watchedMetrics(projectKey) });
      toast.success(t('deleted'));
    },
    onError: (err) => toast.error(errorText(err, tCommon('genericError'))),
    meta: { suppressErrorToast: true },
  });
}

export function useRecordWatchedMetricSample(projectKey: string) {
  const t = useTranslations('dashboards.watchedMetrics.toasts');
  const tCommon = useTranslations('common');
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      metricId,
      input,
    }: {
      metricId: number;
      input: RecordWatchedMetricSampleInput;
    }) => recordWatchedMetricSample(metricId, input),
    onSuccess: (_res, vars) => {
      void qc.invalidateQueries({ queryKey: qk.watchedMetrics(projectKey) });
      void qc.invalidateQueries({ queryKey: qk.watchedMetricSamples(vars.metricId) });
      toast.success(t('sampleRecorded'));
    },
    onError: (err) => toast.error(errorText(err, tCommon('genericError'))),
    meta: { suppressErrorToast: true },
  });
}
