import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PulseBucket } from '@/lib/api/endpoints/analytics';
import {
  buildPulseColumnLabels,
  buildPulseRowLabels,
  computePulseThresholds,
  pulseLevel,
  slicePulseColumns,
} from './pulseHeatmap';

describe('pulseHeatmap', () => {
  it('spreads skewed spike distributions across levels 1..4 via quartiles', () => {
    const counts = [1, 10, 50, 250, 1200, 3200, 27000];
    const thresholds = computePulseThresholds(counts);
    const levels = counts.map((c) => pulseLevel(c, thresholds));
    assert.deepEqual(levels, [1, 1, 2, 2, 3, 4, 4]);
    assert.equal(pulseLevel(0, thresholds), 0);
  });

  it('handles degenerate distributions (empty, single value, uniform values)', () => {
    const empty = computePulseThresholds([]);
    assert.equal(pulseLevel(0, empty), 0);
    assert.equal(pulseLevel(5, empty), 0);

    const single = computePulseThresholds([42]);
    assert.equal(pulseLevel(42, single), 4);

    const uniform = computePulseThresholds([10, 10, 10]);
    assert.equal(pulseLevel(10, uniform), 4);
  });

  it('excludes isFuture buckets from active and total counts', () => {
    const buckets: PulseBucket[] = [
      { label: 'Mon, Nov 23, 2026', count: 150, date: '2026-11-23', isFuture: false },
      { label: 'Tue, Nov 24, 2026', count: 999, date: '2026-11-24', isFuture: true },
      { label: 'Wed, Nov 25, 2026', count: 0, date: '2026-11-25', isFuture: true },
      { label: 'Thu, Nov 26, 2026', count: 0, date: '2026-11-26', isFuture: true },
      { label: 'Fri, Nov 27, 2026', count: 0, date: '2026-11-27', isFuture: true },
      { label: 'Sat, Nov 28, 2026', count: 0, date: '2026-11-28', isFuture: true },
      { label: 'Sun, Nov 29, 2026', count: 0, date: '2026-11-29', isFuture: true },
    ];
    const sliced = slicePulseColumns(buckets, 1, 7);
    assert.equal(sliced.cols.length, 1);
    assert.equal(sliced.total, 150);
    assert.equal(sliced.active, 1);
  });

  it('generates non-colliding month column labels in UTC', () => {
    const mkCol = (date: string): PulseBucket[] =>
      Array.from({ length: 7 }, (_, i) => ({
        label: date,
        count: i === 0 ? 1 : 0,
        date,
        isFuture: false,
      }));
    // Col 0 is Sep 28 (only 1 col before Oct 5 at col 1), then Nov 2 at col 5
    const cols = [
      mkCol('2026-09-28'),
      mkCol('2026-10-05'),
      mkCol('2026-10-12'),
      mkCol('2026-10-19'),
      mkCol('2026-10-26'),
      mkCol('2026-11-02'),
    ];
    const labels = buildPulseColumnLabels(cols, 'day', 'en-US');
    assert.deepEqual(labels, [
      { colIndex: 1, text: 'Oct' },
      { colIndex: 5, text: 'Nov' },
    ]);
    for (let i = 1; i < labels.length; i++) {
      assert.ok(labels[i]!.colIndex - labels[i - 1]!.colIndex >= 3);
    }
  });

  it('generates ISO Mon/Wed/Fri row labels for day and 00/06/12/18 for hour', () => {
    const dayLabels = buildPulseRowLabels('day', 'en-US');
    assert.deepEqual(dayLabels, [
      { rowIndex: 0, text: 'Mon' },
      { rowIndex: 2, text: 'Wed' },
      { rowIndex: 4, text: 'Fri' },
    ]);

    const hourLabels = buildPulseRowLabels('hour', 'en-US');
    assert.deepEqual(hourLabels, [
      { rowIndex: 0, text: '00' },
      { rowIndex: 6, text: '06' },
      { rowIndex: 12, text: '12' },
      { rowIndex: 18, text: '18' },
    ]);

    assert.deepEqual(buildPulseRowLabels('week', 'en-US'), []);
  });
});
