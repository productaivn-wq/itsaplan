import { describe, expect, it } from 'bun:test';
import {
  computeTrend,
  evaluateMetricStatus,
  slugifyMetricName,
} from '../evaluator';

describe('watched-metrics evaluator', () => {
  it('slugifies names cleanly into URL-safe lowercase slugs', () => {
    expect(slugifyMetricName('Overdue Issues (P0)')).toBe('overdue-issues-p0');
    expect(slugifyMetricName('Tỉ lệ hoàn thành %')).toBe('ti-le-hoan-thanh');
    expect(slugifyMetricName('---')).toBe('metric');
  });

  it('returns no_data for null, undefined, or non-finite values', () => {
    expect(evaluateMetricStatus(null, '>=', 80, 80, 50)).toBe('no_data');
    expect(evaluateMetricStatus(undefined, '<=', 10, 10, 20)).toBe('no_data');
    expect(evaluateMetricStatus(Number.NaN, '>=', 80, 80, 50)).toBe('no_data');
  });

  it('evaluates >= and > operators with warn and crit thresholds', () => {
    expect(evaluateMetricStatus(90, '>=', 80, 80, 50)).toBe('healthy');
    expect(evaluateMetricStatus(80, '>=', 80, 80, 50)).toBe('healthy');
    expect(evaluateMetricStatus(65, '>=', 80, 80, 50)).toBe('warning');
    expect(evaluateMetricStatus(49, '>=', 80, 80, 50)).toBe('critical');
    expect(evaluateMetricStatus(0, '>=', 1, 1, 0)).toBe('warning');
    expect(evaluateMetricStatus(10.1, '>', 10, 10, 5)).toBe('healthy');
    expect(evaluateMetricStatus(10, '>', 10, 10, 5)).toBe('warning');
    expect(evaluateMetricStatus(5, '>', 10, 10, 5)).toBe('critical');
  });

  it('evaluates <= and < operators with warn and crit thresholds', () => {
    expect(evaluateMetricStatus(0, '<=', 0, 0, 5)).toBe('healthy');
    expect(evaluateMetricStatus(3, '<=', 0, 0, 5)).toBe('warning');
    expect(evaluateMetricStatus(6, '<=', 0, 0, 5)).toBe('critical');
    expect(evaluateMetricStatus(4.9, '<', 5, 5, 10)).toBe('healthy');
    expect(evaluateMetricStatus(5, '<', 5, 5, 10)).toBe('warning');
    expect(evaluateMetricStatus(10, '<', 5, 5, 10)).toBe('critical');
  });

  it('evaluates == operator matching MECE v4 equality KPIs', () => {
    expect(evaluateMetricStatus(0, '==', 0, 0, 5)).toBe('healthy');
    expect(evaluateMetricStatus(1, '==', 0, 0, 5)).toBe('warning');
    expect(evaluateMetricStatus(5, '==', 0, 0, 5)).toBe('critical');
    expect(evaluateMetricStatus(1, '==', 1, 1, 0)).toBe('healthy');
    expect(evaluateMetricStatus(0, '==', 1, 1, 0)).toBe('critical');
  });

  it('computes previousValue, delta, and last-12 sparkline from chronological samples', () => {
    const samples = Array.from({ length: 15 }, (_, i) => ({ value: i + 1 }));
    const trend = computeTrend(samples, 15);
    expect(trend.sparkline.length).toBe(12);
    expect(trend.sparkline[0]).toBe(4);
    expect(trend.sparkline[11]).toBe(15);
    expect(trend.previousValue).toBe(14);
    expect(trend.delta).toBe(1);

    const liveTrend = computeTrend([{ value: 10 }, { value: 12 }], 15);
    expect(liveTrend.previousValue).toBe(12);
    expect(liveTrend.delta).toBe(3);
  });
});
