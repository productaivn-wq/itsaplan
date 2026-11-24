import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import type { WidgetConfig } from '@/utils/dashboardWidgets';
import { Skeleton } from '@/components/ui/skeleton';
import { usePulseQuery } from '../../services/analytics.service';
import {
  buildPulseColumnLabels,
  buildPulseRowLabels,
  PULSE_FILL_COLORS,
  PULSE_GRID,
  pulseLevel,
  slicePulseColumns,
} from '../../utils/pulseHeatmap';

// Fetch a few columns beyond what is drawn so a small resize can grow the graph
// from cache before the refetch lands. Only the columns that fully fit are drawn
// (no horizontal scroll); the extra are held in reserve.
const COLUMN_BUFFER = 4;
const TOP_AXIS_HEIGHT = 20;

// An activity heatmap whose window auto-fits the widget width: the number of
// columns is derived from the available space, not a chosen date range. It draws
// exactly the columns that fully fit — no scrollbar. The bucket unit
// (hour/day/week) is a configured setting; hovering a cell shows its date and
// count. The server returns a zero-filled, preformatted series (see analytics
// store), so this component only measures width and lays cells out.
export default function PulseWidget({
  projectKey,
  config,
}: {
  projectKey: string;
  config: WidgetConfig;
}) {
  const t = useTranslations('dashboards.pulse');
  const locale = useLocale();
  const { data: session } = useSession();
  const scope = config.pulseScope ?? 'project';
  const unit = config.granularity ?? 'day';
  const geo = PULSE_GRID[unit];
  const step = geo.cell + geo.gap;

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  // Measured in whole pixels and applied on the next frame: the columns are laid out
  // from this width, and laying them out resizes the element again. Without the
  // rounding a sub-pixel width feeds back into itself, and without the frame the
  // observer and the render that follows it chain within one frame — which is the
  // update depth React gives up on.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let frame = 0;
    const ro = new ResizeObserver((entries) => {
      const measured = Math.floor(entries[0].contentRect.width);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setWidth(measured));
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  // Columns that fully fit the measured width (drawn), and a slightly larger fetch
  // count (reserve). Before the first measurement, fetch a sensible default.
  const fitColumns = width > 0 ? Math.max(1, Math.floor((width + geo.gap) / step)) : 0;
  const fetchColumns = fitColumns > 0 ? Math.min(fitColumns + COLUMN_BUFFER, geo.maxColumns) : 26;

  const { data, isLoading } = usePulseQuery(
    projectKey,
    unit,
    fetchColumns,
    scope,
    session?.user.id,
  );

  const [tip, setTip] = useState<{ label: string; count: number; x: number; y: number } | null>(
    null,
  );

  const { cols, thresholds, total, active } = useMemo(
    () => slicePulseColumns(data ?? [], fitColumns, geo.rows),
    [data, fitColumns, geo.rows],
  );

  const colLabels = useMemo(
    () => buildPulseColumnLabels(cols, unit, locale),
    [cols, unit, locale],
  );
  const rowLabels = useMemo(() => buildPulseRowLabels(unit, locale), [unit, locale]);

  const gridHeight = geo.rows * geo.cell + (geo.rows - 1) * geo.gap;
  const hasRowAxis = rowLabels.length > 0;
  const hasColAxis = colLabels.length > 0 || unit === 'day' || unit === 'week' || unit === 'hour';

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {t(`scope.${scope}`)} · {t(`caption.${unit}`)}
      </p>

      {/* Deterministic height wrapper: loading skeleton and loaded grid occupy the
          exact same vertical height so content-height measurement never oscillates. */}
      <div
        className="flex w-full items-start gap-2"
        style={{ height: gridHeight + (hasColAxis ? TOP_AXIS_HEIGHT : 0) }}
      >
        {hasRowAxis && (
          <div
            aria-hidden="true"
            className="relative shrink-0 select-none text-xs leading-none text-muted-foreground"
            style={{
              width: unit === 'hour' ? 18 : 26,
              height: gridHeight,
              marginTop: hasColAxis ? TOP_AXIS_HEIGHT : 0,
            }}
          >
            {rowLabels.map((rl) => (
              <span
                key={rl.rowIndex}
                className={cn(
                  'absolute inset-x-0 text-end',
                  unit === 'hour' && 'font-mono tabular-nums',
                )}
                style={{
                  top: rl.rowIndex * step + Math.max(0, Math.floor((geo.cell - 11) / 2)),
                }}
              >
                {rl.text}
              </span>
            ))}
          </div>
        )}

        {/* Full-width measuring wrapper for the column grid only (excludes row gutter). */}
        <div className="min-w-0 flex-1 overflow-hidden">
          {hasColAxis && (
            <div
              aria-hidden="true"
              className="relative mb-1 h-4 overflow-hidden select-none text-xs leading-none text-muted-foreground"
            >
              {colLabels.map((cl) => (
                <span
                  key={`${cl.colIndex}-${cl.text}`}
                  className="absolute top-0 whitespace-nowrap"
                  style={{ insetInlineStart: cl.colIndex * step }}
                >
                  {cl.text}
                </span>
              ))}
            </div>
          )}

          <div
            ref={containerRef}
            className="w-full overflow-hidden"
            style={{ height: gridHeight }}
          >
            {isLoading || cols.length === 0 ? (
              <Skeleton className="size-full" />
            ) : (
              <div style={{ display: 'flex', gap: geo.gap }}>
                {cols.map((col, ci) => (
                  <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: geo.gap }}>
                    {col.map((cell, ri) => {
                      if (cell.isFuture) {
                        return (
                          <span
                            key={ri}
                            aria-hidden="true"
                            className="shrink-0"
                            style={{ width: geo.cell, height: geo.cell }}
                          />
                        );
                      }
                      const lvl = pulseLevel(cell.count, thresholds);
                      return (
                        <span
                          key={ri}
                          onMouseEnter={(e) => {
                            const r = e.currentTarget.getBoundingClientRect();
                            setTip({
                              label: cell.label,
                              count: cell.count,
                              x: r.left + r.width / 2,
                              y: r.top,
                            });
                          }}
                          onMouseLeave={() => setTip(null)}
                          className={cn('shrink-0 rounded-xs', lvl === 0 && 'bg-muted')}
                          style={{
                            width: geo.cell,
                            height: geo.cell,
                            backgroundColor: lvl === 0 ? undefined : PULSE_FILL_COLORS[lvl - 1],
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums text-muted-foreground">
        <span>
          {t('events', { count: total })} · {t('active', { count: active })}
        </span>
        <span className="flex items-center gap-1">
          {t('less')}
          <span className="size-3 rounded-xs bg-muted" />
          {PULSE_FILL_COLORS.map((c) => (
            <span key={c} className="size-3 rounded-xs" style={{ backgroundColor: c }} />
          ))}
          {t('more')}
        </span>
      </div>

      {/* Portaled to the body so it can never shift the widget's layout. */}
      {tip &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
            style={{ left: tip.x, top: tip.y - 6 }}
          >
            <span className="font-medium tabular-nums">{tip.count}</span>{' '}
            <span className="text-muted-foreground">
              {t('eventNoun', { count: tip.count })} · {tip.label}
            </span>
          </div>,
          document.body,
        )}
    </div>
  );
}
