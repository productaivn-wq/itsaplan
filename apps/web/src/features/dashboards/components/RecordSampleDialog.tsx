import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { WatchedMetricDto } from '@/lib/api/endpoints/watchedMetrics';
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
import { Textarea } from '@/components/ui/textarea';
import {
  useRecordWatchedMetricSample,
  useWatchedMetricSamplesQuery,
} from '../services/watchedMetrics.service';
import { WatchedMetricStatusBadge, formatMetricNumber } from './watchedMetricsShared';

export default function RecordSampleDialog({
  open,
  onOpenChange,
  projectKey,
  metric,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectKey: string;
  metric: WatchedMetricDto | null;
}) {
  const t = useTranslations('dashboards.watchedMetrics');
  const tCommon = useTranslations('common');
  const recordM = useRecordWatchedMetricSample(projectKey);
  const samplesQ = useWatchedMetricSamplesQuery(
    metric?.id ?? null,
    10,
    open && Boolean(metric && !metric.isVirtual),
  );

  const [valueInput, setValueInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    if (open && metric) {
      const initial = metric.currentValue ?? metric.targetValue;
      setValueInput(Number.isFinite(initial) ? String(initial) : '');
      setNoteInput('');
    }
  }, [open, metric]);

  if (!metric) return null;

  const parsedValue = Number(valueInput.trim());
  const isValid = valueInput.trim() !== '' && Number.isFinite(parsedValue);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!metric || !isValid) return;
    await recordM.mutateAsync({
      metricId: metric.id,
      input: {
        value: parsedValue,
        note: noteInput.trim() ? noteInput.trim() : null,
      },
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('recordDialog.title', { name: metric.name })}</DialogTitle>
          <DialogDescription>
            {t('recordDialog.description', {
              operator: metric.operator,
              target: formatMetricNumber(metric.targetValue),
              unit: metric.unit,
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sample-value-input">
              {t('recordDialog.valueLabel')}
              {metric.unit ? ` (${metric.unit})` : ''}
            </Label>
            <Input
              id="sample-value-input"
              type="number"
              step="any"
              autoFocus
              required
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              placeholder={t('recordDialog.valuePlaceholder')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sample-note-input">{t('recordDialog.noteLabel')}</Label>
            <Textarea
              id="sample-note-input"
              rows={2}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder={t('recordDialog.notePlaceholder')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={!isValid || recordM.isPending}>
              {recordM.isPending ? tCommon('saving') : t('recordDialog.submit')}
            </Button>
          </DialogFooter>
        </form>

        <div className="border-t border-border/75 pt-3">
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t('recordDialog.historyTitle')}
          </h4>
          {samplesQ.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-7 w-full" />
            </div>
          ) : (samplesQ.data?.items ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('recordDialog.historyEmpty')}</p>
          ) : (
            <ul className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
              {(samplesQ.data?.items ?? []).map((sample) => (
                <li
                  key={sample.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold tabular-nums text-foreground">
                        {formatMetricNumber(sample.value)}
                        {metric.unit ? ` ${metric.unit}` : ''}
                      </span>
                      <WatchedMetricStatusBadge
                        status={sample.status}
                        label={t(`status.${sample.status}`)}
                      />
                    </div>
                    {sample.note && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{sample.note}</p>
                    )}
                  </div>
                  <time
                    dateTime={sample.recordedAt}
                    className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums"
                  >
                    {new Date(sample.recordedAt).toLocaleDateString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
