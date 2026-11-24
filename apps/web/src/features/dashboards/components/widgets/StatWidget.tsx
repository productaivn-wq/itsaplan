import { EMPTY_FILTER_SET, type FilterSet } from '@/utils/filters';
import { matchDefaultStatKey, type WidgetConfig } from '@/utils/dashboardWidgets';
import { Skeleton } from '@/components/ui/skeleton';
import { useStatCountQuery, useStatsQuery } from '../../services/analytics.service';

// A single number: the count of non-archived issues matching the widget's filter set.
// Default tiles read GET /analytics/stats directly; custom FilterSets query
// POST /analytics/stat-count so counts are always server-accurate regardless of
// board pagination limits.
export default function StatWidget({
  projectKey,
  config,
}: {
  projectKey: string;
  config: WidgetConfig;
}) {
  const filters: FilterSet = config.filters ?? EMPTY_FILTER_SET;
  const defaultKey = matchDefaultStatKey(filters);
  const statsQuery = useStatsQuery(projectKey, defaultKey != null);
  const countQuery = useStatCountQuery(projectKey, filters, defaultKey == null);

  const isLoading = defaultKey != null ? statsQuery.isLoading : countQuery.isLoading;
  if (isLoading) return <Skeleton className="h-10 w-16" />;

  const count =
    defaultKey != null ? (statsQuery.data?.[defaultKey] ?? 0) : (countQuery.data?.count ?? 0);

  return (
    <div className="flex flex-col gap-2">
      <div
        data-stat-value
        className="font-heading text-3xl font-bold tracking-tight text-foreground tabular-nums"
      >
        {count.toLocaleString()}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-emerald-500/80" />
        <span className="h-px flex-1 bg-border/70" />
      </div>
    </div>
  );
}
