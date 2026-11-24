import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import FilterBar from '@/components/layout/FilterBar';
import { useShell } from '@/context/shellContext';
import type {
  MetricOperator,
  MetricSourceType,
  WatchedMetricDto,
} from '@/lib/api/endpoints/watchedMetrics';
import { EMPTY_FILTER_SET, type FilterSet } from '@/utils/filters';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateWatchedMetric,
  useUpdateWatchedMetric,
} from '../services/watchedMetrics.service';
import {
  LIVE_STAT_KEYS,
  METRIC_OPERATORS,
  METRIC_SOURCE_TYPES,
  PRESET_METRIC_CATEGORIES,
  isLiveMetricSource,
} from './watchedMetricsShared';

function parseOptionalNumber(raw: string): { valid: boolean; value: number | null } {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: true, value: null };
  const num = Number(trimmed);
  return Number.isFinite(num) ? { valid: true, value: num } : { valid: false, value: null };
}

function parseFilterSet(raw: unknown): FilterSet {
  if (raw && typeof raw === 'object' && Array.isArray((raw as FilterSet).conditions)) {
    return raw as FilterSet;
  }
  return EMPTY_FILTER_SET;
}

export default function WatchedMetricDialog({
  open,
  onOpenChange,
  projectKey,
  metric,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectKey: string;
  metric?: WatchedMetricDto | null;
}) {
  const t = useTranslations('dashboards.watchedMetrics');
  const tCommon = useTranslations('common');
  const { project, customFields } = useShell();
  const createM = useCreateWatchedMetric(projectKey);
  const updateM = useUpdateWatchedMetric(projectKey);
  const isEdit = Boolean(metric);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('delivery');
  const [sourceType, setSourceType] = useState<MetricSourceType>('manual');
  const [statKey, setStatKey] = useState<string>('open');
  const [days, setDays] = useState<string>('30');
  const [filters, setFilters] = useState<FilterSet>(EMPTY_FILTER_SET);
  const [unit, setUnit] = useState('');
  const [operator, setOperator] = useState<MetricOperator>('>=');
  const [targetValue, setTargetValue] = useState('90');
  const [warnThreshold, setWarnThreshold] = useState('');
  const [critThreshold, setCritThreshold] = useState('');
  const [initialValue, setInitialValue] = useState('');
  const [externalKey, setExternalKey] = useState('');
  const [pinnedToOverview, setPinnedToOverview] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (metric) {
      setName(metric.name);
      setDescription(metric.description ?? '');
      setCategory(metric.category);
      setSourceType(metric.sourceType);
      setStatKey(String(metric.sourceConfig?.statKey ?? 'open'));
      setDays(String(metric.sourceConfig?.days ?? 30));
      setFilters(parseFilterSet(metric.sourceConfig?.filters));
      setUnit(metric.unit);
      setOperator(metric.operator);
      setTargetValue(String(metric.targetValue));
      setWarnThreshold(metric.warnThreshold != null ? String(metric.warnThreshold) : '');
      setCritThreshold(metric.critThreshold != null ? String(metric.critThreshold) : '');
      setInitialValue(metric.currentValue != null ? String(metric.currentValue) : '');
      setExternalKey(metric.externalKey ?? '');
      setPinnedToOverview(metric.pinnedToOverview);
    } else {
      setName('');
      setDescription('');
      setCategory('delivery');
      setSourceType('manual');
      setStatKey('open');
      setDays('30');
      setFilters(EMPTY_FILTER_SET);
      setUnit('%');
      setOperator('>=');
      setTargetValue('90');
      setWarnThreshold('85');
      setCritThreshold('70');
      setInitialValue('');
      setExternalKey('');
      setPinnedToOverview(true);
    }
  }, [open, metric]);

  const parsedTarget = Number(targetValue.trim());
  const parsedWarn = parseOptionalNumber(warnThreshold);
  const parsedCrit = parseOptionalNumber(critThreshold);
  const parsedInitial = parseOptionalNumber(initialValue);
  const parsedDays = Number(days.trim());

  const validDays =
    sourceType !== 'live_agent_health' && sourceType !== 'live_webhook_health'
      ? true
      : Number.isFinite(parsedDays) && parsedDays >= 1 && parsedDays <= 365;

  const canSubmit =
    name.trim().length > 0 &&
    targetValue.trim() !== '' &&
    Number.isFinite(parsedTarget) &&
    parsedWarn.valid &&
    parsedCrit.valid &&
    parsedInitial.valid &&
    validDays;

  const saving = createM.isPending || updateM.isPending;

  function buildSourceConfig(): Record<string, unknown> {
    switch (sourceType) {
      case 'live_stat':
        return { statKey };
      case 'live_agent_health':
      case 'live_webhook_health':
        return { days: Math.min(365, Math.max(1, Math.round(parsedDays || 30))) };
      case 'live_filter':
        return { filters };
      default:
        return {};
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      name: name.trim(),
      description: description.trim() ? description.trim() : null,
      category: category.trim() || 'delivery',
      sourceType,
      sourceConfig: buildSourceConfig(),
      unit: unit.trim(),
      operator,
      targetValue: parsedTarget,
      warnThreshold: parsedWarn.value,
      critThreshold: parsedCrit.value,
      pinnedToOverview,
      externalKey: externalKey.trim() ? externalKey.trim() : null,
      ...(!isEdit && !isLiveMetricSource(sourceType) && parsedInitial.value != null
        ? { currentValue: parsedInitial.value }
        : {}),
    };

    if (metric) {
      await updateM.mutateAsync({ metricId: metric.id, input: payload });
    } else {
      await createM.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('dialog.editTitle') : t('dialog.createTitle')}</DialogTitle>
          <DialogDescription>{t('dialog.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="metric-name-input">{t('dialog.name')}</Label>
              <Input
                id="metric-name-input"
                autoFocus
                required
                maxLength={160}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('dialog.namePlaceholder')}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="metric-desc-input">{t('dialog.metricDescription')}</Label>
              <Textarea
                id="metric-desc-input"
                rows={2}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('dialog.metricDescriptionPlaceholder')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="metric-category-input">{t('dialog.category')}</Label>
              <Input
                id="metric-category-input"
                maxLength={60}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="delivery"
              />
              <div className="flex flex-wrap gap-1 pt-0.5">
                {PRESET_METRIC_CATEGORIES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCategory(preset)}
                    className="rounded-full border border-border/80 bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {t(`categories.${preset}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t('dialog.sourceType')}</Label>
              <Select
                value={sourceType}
                onValueChange={(v) => setSourceType(v as MetricSourceType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_SOURCE_TYPES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {t(`sources.${st}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {sourceType === 'live_stat' && (
            <div className="space-y-1.5 rounded-xl border border-border/75 bg-muted/30 p-3">
              <Label>{t('dialog.statKey')}</Label>
              <Select value={statKey} onValueChange={setStatKey}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIVE_STAT_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(`statKeys.${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(sourceType === 'live_agent_health' || sourceType === 'live_webhook_health') && (
            <div className="space-y-1.5 rounded-xl border border-border/75 bg-muted/30 p-3">
              <Label htmlFor="metric-days-input">{t('dialog.windowDays')}</Label>
              <Input
                id="metric-days-input"
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>
          )}

          {sourceType === 'live_filter' && project && (
            <div className="space-y-1.5 rounded-xl border border-border/75 bg-muted/30 p-3">
              <Label>{t('dialog.filterRules')}</Label>
              <FilterBar
                filters={filters}
                onChange={setFilters}
                project={project}
                customFields={customFields}
              />
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t('dialog.operator')}</Label>
              <Select value={operator} onValueChange={(v) => setOperator(v as MetricOperator)}>
                <SelectTrigger className="w-full font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_OPERATORS.map((op) => (
                    <SelectItem key={op} value={op} className="font-mono">
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="metric-target-input">{t('dialog.targetValue')}</Label>
              <Input
                id="metric-target-input"
                type="number"
                step="any"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="metric-unit-input">{t('dialog.unit')}</Label>
              <Input
                id="metric-unit-input"
                maxLength={40}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="%"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="metric-warn-input">{t('dialog.warnThreshold')}</Label>
              <Input
                id="metric-warn-input"
                type="number"
                step="any"
                value={warnThreshold}
                onChange={(e) => setWarnThreshold(e.target.value)}
                placeholder={t('dialog.optional')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="metric-crit-input">{t('dialog.critThreshold')}</Label>
              <Input
                id="metric-crit-input"
                type="number"
                step="any"
                value={critThreshold}
                onChange={(e) => setCritThreshold(e.target.value)}
                placeholder={t('dialog.optional')}
              />
            </div>

            {!isEdit && !isLiveMetricSource(sourceType) && (
              <div className="space-y-1.5">
                <Label htmlFor="metric-initial-input">{t('dialog.initialValue')}</Label>
                <Input
                  id="metric-initial-input"
                  type="number"
                  step="any"
                  value={initialValue}
                  onChange={(e) => setInitialValue(e.target.value)}
                  placeholder={t('dialog.optional')}
                />
              </div>
            )}

            {sourceType === 'api_push' && (
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="metric-extkey-input">{t('dialog.externalKey')}</Label>
                <Input
                  id="metric-extkey-input"
                  maxLength={120}
                  value={externalKey}
                  onChange={(e) => setExternalKey(e.target.value)}
                  placeholder="ci.coverage.pct"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/75 bg-muted/25 px-3 py-2.5">
            <div className="min-w-0">
              <Label htmlFor="metric-pinned-switch" className="text-sm font-medium">
                {t('dialog.pinnedToOverview')}
              </Label>
              <p className="text-xs text-muted-foreground">{t('dialog.pinnedHelp')}</p>
            </div>
            <Switch
              id="metric-pinned-switch"
              checked={pinnedToOverview}
              onCheckedChange={setPinnedToOverview}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit || saving}>
              {saving ? tCommon('saving') : isEdit ? tCommon('save') : t('dialog.createSubmit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
