import type {
  MetricOperator,
  MetricSourceType,
  WatchedMetricStatus,
} from '@/lib/api/endpoints/watchedMetrics';
import { cn } from '@/lib/utils';

export const METRIC_OPERATORS: readonly MetricOperator[] = ['>=', '<=', '>', '<', '=='];

export const METRIC_SOURCE_TYPES: readonly MetricSourceType[] = [
  'manual',
  'api_push',
  'live_stat',
  'live_completion_rate',
  'live_agent_health',
  'live_webhook_health',
  'live_filter',
];

export const PRESET_METRIC_CATEGORIES = [
  'delivery',
  'agents',
  'quality',
  'reliability',
  'product',
] as const;

export const LIVE_STAT_KEYS = [
  'open',
  'inProgress',
  'backlog',
  'overdue',
  'unassigned',
  'closedLast7d',
] as const;

export function isLiveMetricSource(sourceType: MetricSourceType): boolean {
  return sourceType.startsWith('live_');
}

const STATUS_STYLE: Record<
  WatchedMetricStatus,
  { badge: string; dot: string; stroke: string; fill: string }
> = {
  healthy: {
    badge:
      'border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    stroke: 'stroke-emerald-500',
    fill: 'fill-emerald-500/12',
  },
  warning: {
    badge: 'border-amber-500/30 bg-amber-500/12 text-amber-800 dark:text-amber-300',
    dot: 'bg-amber-500',
    stroke: 'stroke-amber-500',
    fill: 'fill-amber-500/12',
  },
  critical: {
    badge: 'border-destructive/35 bg-destructive/12 text-destructive',
    dot: 'bg-destructive',
    stroke: 'stroke-destructive',
    fill: 'fill-destructive/12',
  },
  no_data: {
    badge: 'border-border bg-muted/60 text-muted-foreground',
    dot: 'bg-muted-foreground/60',
    stroke: 'stroke-muted-foreground/60',
    fill: 'fill-muted-foreground/10',
  },
};

export function getStatusStyle(status: WatchedMetricStatus) {
  return STATUS_STYLE[status] ?? STATUS_STYLE.no_data;
}

export function formatMetricNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatMetricDelta(delta: number | null | undefined, unit: string): string | null {
  if (delta == null || !Number.isFinite(delta)) return null;
  const sign = delta > 0 ? '+' : '';
  const num = Number.isInteger(delta)
    ? String(delta)
    : delta.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return unit ? `${sign}${num} ${unit}` : `${sign}${num}`;
}

export function WatchedMetricStatusBadge({
  status,
  label,
  className,
}: {
  status: WatchedMetricStatus;
  label: string;
  className?: string;
}) {
  const style = getStatusStyle(status);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        style.badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', style.dot)} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function WatchedMetricSparkline({
  values,
  status,
  className,
}: {
  values: readonly number[];
  status: WatchedMetricStatus;
  className?: string;
}) {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length < 2) {
    return (
      <div
        className={cn(
          'flex h-7 w-20 shrink-0 items-center justify-end text-xs text-muted-foreground/60',
          className,
        )}
        aria-hidden="true"
      >
        <span className="h-px w-full bg-border/70" />
      </div>
    );
  }

  const width = 80;
  const height = 28;
  const padY = 3;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const span = max - min || 1;
  const points = finite.map((v, idx) => {
    const x = (idx / (finite.length - 1)) * width;
    const y = height - padY - ((v - min) / span) * (height - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;
  const style = getStatusStyle(status);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('h-7 w-20 shrink-0 overflow-visible', className)}
      aria-hidden="true"
    >
      <path d={areaPath} className={style.fill} />
      <path
        d={linePath}
        fill="none"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={style.stroke}
      />
    </svg>
  );
}
