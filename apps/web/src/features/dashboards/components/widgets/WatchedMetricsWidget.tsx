import { ArrowUpRight, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/usePermissions';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { watchedMetricsPath } from '@/utils/paths';
import type { WidgetConfig } from '@/utils/dashboardWidgets';
import {
  useBootstrapWatchedMetrics,
  useWatchedMetricsQuery,
} from '../../services/watchedMetrics.service';
import {
  WatchedMetricSparkline,
  WatchedMetricStatusBadge,
  formatMetricDelta,
  formatMetricNumber,
  getStatusStyle,
} from '../watchedMetricsShared';
import { cn } from '@/lib/utils';

export default function WatchedMetricsWidget({
  projectKey,
  config,
}: {
  projectKey: string;
  config: WidgetConfig;
}) {
  const t = useTranslations('dashboards.watchedMetrics');
  const { can } = usePermissions();
  const pinnedOnly = config.pinnedOnly ?? true;
  const category = config.metricCategory || undefined;
  const maxItems = config.maxItems ?? 8;

  const { data, isLoading } = useWatchedMetricsQuery(projectKey, {
    pinnedOnly: pinnedOnly || undefined,
    category,
  });
  const bootstrapM = useBootstrapWatchedMetrics(projectKey);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const items = (data?.items ?? []).slice(0, maxItems);
  const summary = data?.summary;
  const canCreate = can('dashboards', 'create');
  const openTab = () => navigateFeatureInstant(watchedMetricsPath(projectKey));

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {summary && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2.5 py-0.5 font-mono tabular-nums text-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                {summary.healthy} {t('status.healthy')}
              </span>
              {summary.warning > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/12 px-2.5 py-0.5 font-mono tabular-nums text-amber-800 dark:text-amber-300">
                  <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                  {summary.warning} {t('status.warning')}
                </span>
              )}
              {summary.critical > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/12 px-2.5 py-0.5 font-mono tabular-nums text-destructive">
                  <span className="size-1.5 rounded-full bg-destructive" aria-hidden="true" />
                  {summary.critical} {t('status.critical')}
                </span>
              )}
            </>
          )}
          {data?.isStarterPreview && (
            <span className="text-xs text-muted-foreground">{t('starterPreviewBadge')}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {data?.isStarterPreview && canCreate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
              disabled={bootstrapM.isPending}
              onClick={() => bootstrapM.mutate()}
            >
              <Sparkles className="size-3.5" />
              {t('saveStarters')}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={openTab}
          >
            {t('manage')}
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-6 text-center">
          <p className="text-sm text-muted-foreground">
            {pinnedOnly ? t('emptyPinned') : t('empty')}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={openTab}>
            {t('manage')}
          </Button>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((metric) => {
            const deltaText = formatMetricDelta(metric.delta, metric.unit);
            const statusStyle = getStatusStyle(metric.status);
            const unitLabel =
              metric.unit === 'pct'
                ? '%'
                : metric.unit === 'sec'
                  ? 's'
                  : metric.unit === 'usd'
                    ? 'USD'
                    : metric.unit;
            const categoryLabel =
              metric.category === 'mece_v4' ? 'System Health' : metric.category;
            return (
              <button
                key={metric.id}
                type="button"
                onClick={openTab}
                className="group flex min-w-0 flex-col gap-3 gap-2 rounded-xl bg-muted/45 p-3.5 text-left transition-colors hover:bg-muted/75 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <span className="line-clamp-2 min-w-0 flex-1 text-xs font-medium leading-snug text-foreground">
                    {metric.name}
                  </span>
                  <span
                    className={cn('mt-1 size-2 shrink-0 rounded-full', statusStyle.dot)}
                    title={t(`status.${metric.status}`)}
                    aria-label={t(`status.${metric.status}`)}
                  />
                </div>

                <div className="flex min-w-0 items-end justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1 font-heading text-2xl font-bold tracking-tight text-foreground tabular-nums">
                      <span className="truncate">{formatMetricNumber(metric.currentValue)}</span>
                      {unitLabel && (
                        <span className="shrink-0 font-mono text-xs font-normal text-muted-foreground">
                          {unitLabel}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-xs text-muted-foreground tabular-nums">
                      <span>
                        {t('targetShort', {
                          operator: metric.operator,
                          target: formatMetricNumber(metric.targetValue),
                        })}
                      </span>
                      {deltaText && <span className="text-foreground/80">{deltaText}</span>}
                    </div>
                  </div>
                  <WatchedMetricSparkline values={metric.sparkline} status={metric.status} />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <WatchedMetricStatusBadge
                    status={metric.status}
                    label={t(`status.${metric.status}`)}
                  />
                  <span className="truncate text-xs text-muted-foreground">
                    {categoryLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
