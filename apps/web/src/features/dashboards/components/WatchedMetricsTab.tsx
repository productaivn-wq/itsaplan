import { useMemo, useState } from 'react';
import {
  Activity,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type {
  WatchedMetricDto,
  WatchedMetricStatus,
} from '@/lib/api/endpoints/watchedMetrics';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  useBootstrapWatchedMetrics,
  useDeleteWatchedMetric,
  useUpdateWatchedMetric,
  useWatchedMetricsQuery,
} from '../services/watchedMetrics.service';
import RecordSampleDialog from './RecordSampleDialog';
import WatchedMetricDialog from './WatchedMetricDialog';
import {
  WatchedMetricSparkline,
  WatchedMetricStatusBadge,
  formatMetricDelta,
  formatMetricNumber,
  isLiveMetricSource,
} from './watchedMetricsShared';

const KNOWN_CATEGORIES = [
  'delivery',
  'agents',
  'quality',
  'reliability',
  'product',
  'mece_v4',
  'okr',
  'custom',
] as const;

type KnownCategory = (typeof KNOWN_CATEGORIES)[number];

function categoryLabel(cat: string, t: ReturnType<typeof useTranslations<'dashboards.watchedMetrics'>>): string {
  if ((KNOWN_CATEGORIES as readonly string[]).includes(cat)) {
    return t(`categories.${cat as KnownCategory}`);
  }
  return cat;
}

type StatusFilter = 'all' | Extract<WatchedMetricStatus, 'healthy' | 'warning' | 'critical'>;

export default function WatchedMetricsTab({
  projectKey,
  createOpen: controlledCreateOpen,
  onCreateOpenChange: controlledOnCreateOpenChange,
}: {
  projectKey: string;
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
}) {
  const t = useTranslations('dashboards.watchedMetrics');
  const tCommon = useTranslations('common');
  const { can } = usePermissions();
  const canCreate = can('dashboards', 'create');
  const canEdit = can('dashboards', 'edit');
  const canDelete = can('dashboards', 'delete');

  const { data, isLoading } = useWatchedMetricsQuery(projectKey);
  const bootstrapM = useBootstrapWatchedMetrics(projectKey);
  const updateM = useUpdateWatchedMetric(projectKey);
  const deleteM = useDeleteWatchedMetric(projectKey);

  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const createOpen = controlledCreateOpen ?? internalCreateOpen;
  const setCreateOpen = controlledOnCreateOpenChange ?? setInternalCreateOpen;

  const [editingMetric, setEditingMetric] = useState<WatchedMetricDto | null>(null);
  const [recordingMetric, setRecordingMetric] = useState<WatchedMetricDto | null>(null);
  const [deletingMetric, setDeletingMetric] = useState<WatchedMetricDto | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [pinnedOnly, setPinnedOnly] = useState(false);

  const items = data?.items ?? [];
  const summary = data?.summary ?? {
    total: 0,
    healthy: 0,
    warning: 0,
    critical: 0,
    noData: 0,
    pinnedCount: 0,
  };

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const m of items) {
      if (m.category) unique.add(m.category);
    }
    return [...unique].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
      if (pinnedOnly && !m.pinnedToOverview) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        (m.description?.toLowerCase().includes(q) ?? false) ||
        (m.externalKey?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [items, searchQuery, statusFilter, categoryFilter, pinnedOnly]);

  function toggleStatusFilter(next: StatusFilter) {
    if (next === 'all') {
      setStatusFilter('all');
      return;
    }
    setStatusFilter((prev) => (prev === next ? 'all' : next));
  }

  const renderCategoryLabel = (cat: string) => categoryLabel(cat, t);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const summaryCells: Array<{
    key: StatusFilter;
    label: string;
    count: number;
    dotClass?: string;
  }> = [
    { key: 'all', label: t('summary.total'), count: summary.total },
    {
      key: 'healthy',
      label: t('summary.healthy'),
      count: summary.healthy,
      dotClass: 'bg-emerald-500',
    },
    {
      key: 'warning',
      label: t('summary.warning'),
      count: summary.warning,
      dotClass: 'bg-amber-500',
    },
    {
      key: 'critical',
      label: t('summary.critical'),
      count: summary.critical,
      dotClass: 'bg-destructive',
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-5">
      {data?.isStarterPreview && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/85 bg-card px-4 py-3 shadow-[var(--studio-card-shadow)]">
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="size-4 shrink-0 text-amber-500" />
              <span>{t('starterBannerTitle')}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('starterBannerDescription')}</p>
          </div>
          {canCreate && (
            <Button
              type="button"
              size="sm"
              className="shrink-0 rounded-full px-4"
              disabled={bootstrapM.isPending}
              onClick={() => bootstrapM.mutate()}
            >
              <Sparkles className="size-3.5" />
              {t('saveStarters')}
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryCells.map((cell) => {
          const active = statusFilter === cell.key;
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => toggleStatusFilter(cell.key)}
              aria-pressed={active}
              className={cn(
                'flex min-w-0 flex-col gap-1 rounded-2xl border bg-card p-4 text-left shadow-[var(--studio-card-shadow)] transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                active ? 'border-foreground/50 ring-1 ring-foreground/25' : 'border-border/85',
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {cell.dotClass && (
                  <span className={cn('size-2 rounded-full', cell.dotClass)} aria-hidden="true" />
                )}
                <span className="truncate">{cell.label}</span>
              </span>
              <span className="font-heading text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {cell.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex basis-64 flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full min-w-0 sm:max-w-xs">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="ps-9 pe-9"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground"
                aria-label={t('clearSearch')}
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                categoryFilter === 'all'
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border/85 bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {t('allCategories')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter((prev) => (prev === cat ? 'all' : cat))}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  categoryFilter === cat
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border/85 bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {renderCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="watched-tab-pinned-only"
              size="sm"
              checked={pinnedOnly}
              onCheckedChange={setPinnedOnly}
            />
            <Label
              htmlFor="watched-tab-pinned-only"
              className="cursor-pointer text-xs text-muted-foreground"
            >
              {t('pinnedOnlyFilter')}
            </Label>
          </div>
          {canCreate && controlledCreateOpen === undefined && (
            <Button
              type="button"
              size="sm"
              className="rounded-full px-3.5"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              {t('addMetric')}
            </Button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-4 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            {items.length === 0 ? t('empty') : t('emptyFiltered')}
          </p>
          {items.length === 0 && canCreate && (
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              {t('addMetric')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((metric) => {
            const deltaText = formatMetricDelta(metric.delta, metric.unit);
            const isLive = isLiveMetricSource(metric.sourceType);
            const canRecord = canEdit && !metric.isVirtual && !isLive;
            return (
              <article
                key={metric.id}
                className="flex min-w-0 flex-col gap-3 gap-3 rounded-2xl border border-border/85 bg-card p-5 shadow-[var(--studio-card-shadow)]"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-heading text-base font-semibold text-foreground">
                        {metric.name}
                      </h3>
                      {metric.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {metric.description}
                        </p>
                      )}
                    </div>
                    <WatchedMetricStatusBadge
                      status={metric.status}
                      label={t(`status.${metric.status}`)}
                    />
                  </div>

                  <div className="flex min-w-0 items-end justify-between gap-3 pt-1">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1.5 font-heading text-3xl font-bold tracking-tight text-foreground tabular-nums">
                        <span className="truncate">{formatMetricNumber(metric.currentValue)}</span>
                        {metric.unit && (
                          <span className="shrink-0 font-mono text-xs font-normal text-muted-foreground">
                            {metric.unit}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 font-mono text-xs text-muted-foreground tabular-nums">
                        <span>
                          {t('targetRule', {
                            operator: metric.operator,
                            target: formatMetricNumber(metric.targetValue),
                            unit: metric.unit,
                          })}
                        </span>
                        {deltaText && (
                          <span className="font-medium text-foreground/85">{deltaText}</span>
                        )}
                      </div>
                    </div>
                    <WatchedMetricSparkline values={metric.sparkline} status={metric.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted/70 px-2 py-0.5 font-mono text-xs">
                      {renderCategoryLabel(metric.category)}
                    </span>
                    <span className="rounded-full bg-muted/70 px-2 py-0.5 text-xs">
                      {t(`sources.${metric.sourceType}`)}
                    </span>
                    {metric.pinnedToOverview && (
                      <span className="rounded-full bg-muted/70 px-2 py-0.5 text-xs text-foreground/80">
                        {t('pinnedBadge')}
                      </span>
                    )}
                    {metric.isVirtual && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                        {t('starterPreviewBadge')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/65 pt-3">
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {metric.lastRecordedAt
                      ? t('updatedAt', {
                          date: new Date(metric.lastRecordedAt).toLocaleDateString(),
                        })
                      : t('noReadingsYet')}
                  </span>

                  {!metric.isVirtual && (
                    <div className="flex flex-wrap items-center gap-1">
                      {canRecord && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-full px-2.5 text-xs"
                          onClick={() => setRecordingMetric(metric)}
                        >
                          <Activity className="size-3.5" />
                          {t('actions.record')}
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 rounded-full p-0"
                          title={
                            metric.pinnedToOverview ? t('actions.unpin') : t('actions.pin')
                          }
                          aria-label={
                            metric.pinnedToOverview ? t('actions.unpin') : t('actions.pin')
                          }
                          disabled={updateM.isPending}
                          onClick={() =>
                            updateM.mutate({
                              metricId: metric.id,
                              input: { pinnedToOverview: !metric.pinnedToOverview },
                            })
                          }
                        >
                          {metric.pinnedToOverview ? (
                            <PinOff className="size-3.5" />
                          ) : (
                            <Pin className="size-3.5" />
                          )}
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 rounded-full p-0"
                          title={t('actions.edit')}
                          aria-label={t('actions.edit')}
                          onClick={() => setEditingMetric(metric)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 rounded-full p-0 text-muted-foreground hover:text-destructive"
                          title={t('actions.delete')}
                          aria-label={t('actions.delete')}
                          onClick={() => setDeletingMetric(metric)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <WatchedMetricDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectKey={projectKey}
      />

      <WatchedMetricDialog
        open={editingMetric != null}
        onOpenChange={(next) => {
          if (!next) setEditingMetric(null);
        }}
        projectKey={projectKey}
        metric={editingMetric}
      />

      <RecordSampleDialog
        open={recordingMetric != null}
        onOpenChange={(next) => {
          if (!next) setRecordingMetric(null);
        }}
        projectKey={projectKey}
        metric={recordingMetric}
      />

      <Dialog
        open={deletingMetric != null}
        onOpenChange={(next) => {
          if (!next) setDeletingMetric(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('deleteDialog.description', { name: deletingMetric?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeletingMetric(null)}>
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteM.isPending}
              onClick={async () => {
                if (!deletingMetric) return;
                await deleteM.mutateAsync(deletingMetric.id);
                setDeletingMetric(null);
              }}
            >
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
