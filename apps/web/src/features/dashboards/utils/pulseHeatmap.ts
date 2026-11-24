import type { PulseBucket, PulseUnit } from '@/lib/api/endpoints/analytics';

export const PULSE_FILL_COLORS = ['#a7f3d0', '#34d399', '#10b981', '#059669'] as const;

// Per-unit heatmap geometry. `rows` cells stack per column (an hour column is
// 24 hours, a day column is 7 ISO days Mon..Sun, a week column is 4 weeks);
// cell/gap size the grid, maxColumns matches the server cap.
export const PULSE_GRID: Record<
  PulseUnit,
  { cell: number; gap: number; rows: number; maxColumns: number }
> = {
  hour: { cell: 11, gap: 2, rows: 24, maxColumns: 140 },
  day: { cell: 15, gap: 3, rows: 7, maxColumns: 160 },
  week: { cell: 15, gap: 3, rows: 4, maxColumns: 130 },
};

export interface PulseThresholds {
  max: number;
  q1: number;
  q2: number;
  q3: number;
}

/**
 * Computes nearest-rank quartile thresholds across strictly positive activity
 * counts so extreme outlier spikes do not flatten moderate active days.
 */
export function computePulseThresholds(counts: number[]): PulseThresholds {
  const sorted = counts.filter((c) => Number.isFinite(c) && c > 0).sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) {
    return { max: 0, q1: 0, q2: 0, q3: 0 };
  }
  return {
    max: sorted[n - 1]!,
    q1: sorted[Math.floor((n - 1) * 0.25)]!,
    q2: sorted[Math.floor((n - 1) * 0.5)]!,
    q3: sorted[Math.floor((n - 1) * 0.75)]!,
  };
}

/**
 * Maps a bucket count into 0..4. Uses quartile thresholds when there is
 * spread across active cells, falling back to linear scaling when q1 === q3.
 */
export function pulseLevel(count: number, thresholds: PulseThresholds): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || thresholds.max <= 0) return 0;
  if (thresholds.q1 === thresholds.q3) {
    return Math.min(4, Math.ceil((count / thresholds.max) * 4)) as 1 | 2 | 3 | 4;
  }
  if (count <= thresholds.q1) return 1;
  if (count <= thresholds.q2) return 2;
  if (count <= thresholds.q3) return 3;
  return 4;
}

export function slicePulseColumns(
  buckets: PulseBucket[],
  fitColumns: number,
  rows: number,
): {
  cols: PulseBucket[][];
  thresholds: PulseThresholds;
  total: number;
  active: number;
} {
  const drawColumns = Math.min(fitColumns || 0, Math.floor(buckets.length / rows));
  const visible = drawColumns > 0 ? buckets.slice(buckets.length - drawColumns * rows) : [];
  const cols: PulseBucket[][] = [];
  for (let i = 0; i < visible.length; i += rows) {
    cols.push(visible.slice(i, i + rows));
  }
  const activeCounts: number[] = [];
  let total = 0;
  let active = 0;
  for (const b of visible) {
    if (b.isFuture) continue;
    total += b.count;
    if (b.count > 0) {
      active++;
      activeCounts.push(b.count);
    }
  }
  return {
    cols,
    thresholds: computePulseThresholds(activeCounts),
    total,
    active,
  };
}

function parseUtcDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, m, d] = parts as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Generates non-overlapping column axis labels (localized short months for
 * day/week; localized short date every >= 5 columns for hour).
 */
export function buildPulseColumnLabels(
  cols: PulseBucket[][],
  unit: PulseUnit,
  locale: string,
): { colIndex: number; text: string }[] {
  if (cols.length === 0) return [];

  if (unit === 'hour') {
    const fmt = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    const labels: { colIndex: number; text: string }[] = [];
    let lastCol = -Infinity;
    for (let ci = 0; ci < cols.length; ci++) {
      const first = cols[ci]!.find((b) => !b.isFuture);
      const dt = parseUtcDate(first?.date);
      if (!dt) continue;
      if (ci - lastCol >= 5) {
        labels.push({ colIndex: ci, text: fmt.format(dt) });
        lastCol = ci;
      }
    }
    return labels;
  }

  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  const labels: { colIndex: number; text: string }[] = [];
  let prevYm = '';
  let lastPlacedCol = -Infinity;

  for (let ci = 0; ci < cols.length; ci++) {
    const first = cols[ci]!.find((b) => !b.isFuture);
    const dt = parseUtcDate(first?.date);
    if (!dt) continue;
    const ym = `${dt.getUTCFullYear()}-${dt.getUTCMonth()}`;
    if (ym === prevYm) continue;
    prevYm = ym;
    const text = monthFmt.format(dt);
    if (ci - lastPlacedCol >= 3) {
      labels.push({ colIndex: ci, text });
      lastPlacedCol = ci;
    } else if (labels.length === 1 && labels[0]!.colIndex === 0) {
      // Column 0 only had 1-2 columns before the next month started; replace it
      // so the fuller month label does not collide with column 0.
      labels[0] = { colIndex: ci, text };
      lastPlacedCol = ci;
    }
  }
  return labels;
}

// Fixed ISO Monday-aligned dates (2024-01-01 was a Monday).
const ISO_WEEKDAY_SAMPLES: Record<number, Date> = {
  0: new Date(Date.UTC(2024, 0, 1)), // Mon
  2: new Date(Date.UTC(2024, 0, 3)), // Wed
  4: new Date(Date.UTC(2024, 0, 5)), // Fri
};

export function buildPulseRowLabels(
  unit: PulseUnit,
  locale: string,
): { rowIndex: number; text: string }[] {
  if (unit === 'day') {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
    return [0, 2, 4].map((rowIndex) => ({
      rowIndex,
      text: fmt.format(ISO_WEEKDAY_SAMPLES[rowIndex]!),
    }));
  }
  if (unit === 'hour') {
    return [
      { rowIndex: 0, text: '00' },
      { rowIndex: 6, text: '06' },
      { rowIndex: 12, text: '12' },
      { rowIndex: 18, text: '18' },
    ];
  }
  return [];
}
