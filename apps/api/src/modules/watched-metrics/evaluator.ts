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

export const METRIC_OPERATORS: readonly MetricOperator[] = ['>=', '<=', '>', '<', '=='];

export const METRIC_SOURCE_TYPES: readonly MetricSourceType[] = [
  'live_stat',
  'live_filter',
  'live_agent_health',
  'live_webhook_health',
  'live_completion_rate',
  'manual',
  'api_push',
];

export function isLiveSourceType(sourceType: string): boolean {
  return sourceType.startsWith('live_');
}

export function slugifyMetricName(name: string): string {
  const ascii = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  return ascii || 'metric';
}

function satisfiesComparison(value: number, op: MetricOperator, bound: number): boolean {
  const eps = 1e-9;
  switch (op) {
    case '>=':
      return value >= bound - eps;
    case '>':
      return value > bound + eps;
    case '<=':
      return value <= bound + eps;
    case '<':
      return value < bound - eps;
    case '==':
      return Math.abs(value - bound) <= eps;
  }
}

export function evaluateMetricStatus(
  value: number | null | undefined,
  operator: MetricOperator,
  targetValue: number,
  warnThreshold: number | null | undefined,
  critThreshold: number | null | undefined,
): WatchedMetricStatus {
  if (value == null || !Number.isFinite(value)) return 'no_data';
  if (!Number.isFinite(targetValue)) return 'no_data';

  const eps = 1e-9;
  if (operator === '==') {
    if (Math.abs(value - targetValue) <= eps) return 'healthy';
    if (critThreshold != null && Number.isFinite(critThreshold)) {
      const critDist = Math.abs(critThreshold - targetValue);
      if (critDist <= eps || Math.abs(value - targetValue) >= critDist - eps) {
        return 'critical';
      }
    }
    return 'warning';
  }

  if (
    critThreshold != null &&
    Number.isFinite(critThreshold) &&
    !satisfiesComparison(value, operator, critThreshold)
  ) {
    return 'critical';
  }

  const warnBound =
    warnThreshold != null && Number.isFinite(warnThreshold) ? warnThreshold : targetValue;
  if (
    !satisfiesComparison(value, operator, warnBound) ||
    !satisfiesComparison(value, operator, targetValue)
  ) {
    return 'warning';
  }

  return 'healthy';
}

export interface MetricTrend {
  previousValue: number | null;
  delta: number | null;
  sparkline: number[];
}

export function computeTrend(
  chronologicalSamples: readonly { value: number }[],
  currentValue: number | null,
): MetricTrend {
  const finiteValues = chronologicalSamples
    .map((s) => s.value)
    .filter((v) => Number.isFinite(v));
  const sparkline = finiteValues.slice(-12);

  if (currentValue == null || !Number.isFinite(currentValue) || sparkline.length === 0) {
    return { previousValue: null, delta: null, sparkline };
  }

  // If the latest sample equals currentValue, compare against the reading before it.
  const last = sparkline[sparkline.length - 1]!;
  let previousValue: number | null = null;
  if (Math.abs(last - currentValue) <= 1e-9) {
    previousValue = sparkline.length >= 2 ? sparkline[sparkline.length - 2]! : null;
  } else {
    previousValue = last;
  }

  const delta =
    previousValue != null ? Math.round((currentValue - previousValue) * 10_000) / 10_000 : null;
  return { previousValue, delta, sparkline };
}
