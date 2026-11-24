import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyFilters, type FilterSet } from './filters';
import type { ProjectDetail } from '@/lib/api/endpoints/projects';
import {
  WIDGET_DEFAULTS,
  defaultDashboardLayout,
  isFillHeightWidget,
  matchDefaultStatKey,
  rowsForContentHeight,
  stackLayout,
  type WidgetInstance,
} from './dashboardWidgets';

function widget(id: string, x: number, y: number, w: number, h = 3): WidgetInstance {
  return { id, type: 'stat', x, y, w, h };
}

describe('stackLayout', () => {
  it('pairs quarter-width tiles and gives everything wider the full width', () => {
    const stacked = stackLayout([
      widget('a', 0, 0, 3),
      widget('b', 3, 0, 3),
      widget('c', 6, 0, 3),
      widget('d', 0, 3, 6, 6),
    ]);
    assert.deepEqual(
      stacked.map((w) => [w.id, w.x, w.y, w.w, w.h]),
      [
        ['a', 0, 0, 1, 3],
        ['b', 1, 0, 1, 3],
        ['c', 0, 3, 1, 3],
        ['d', 0, 6, 2, 6],
      ],
    );
  });

  it('keeps the saved reading order, top row first', () => {
    const stacked = stackLayout([widget('bottom', 0, 5, 12), widget('top', 6, 0, 12)]);
    assert.deepEqual(
      stacked.map((w) => w.id),
      ['top', 'bottom'],
    );
  });
});

describe('defaultDashboardLayout & matchDefaultStatKey', () => {
  it('defines canonical OPEN_FILTER without phantom closed and UNASSIGNED_FILTER excluding terminal states', () => {
    const layout = defaultDashboardLayout((k) => k);
    const byId = new Map(layout.map((w) => [w.id, w]));

    const watchedWidget = byId.get('default-watched-metrics');
    assert.ok(watchedWidget);
    assert.equal(watchedWidget.type, 'watched_metrics');
    assert.equal(watchedWidget.w, 12);
    assert.equal(watchedWidget.y, 0);
    assert.equal(WIDGET_DEFAULTS.watched_metrics.w, 12);
    assert.equal(WIDGET_DEFAULTS.watched_metrics.config.pinnedOnly, true);

    const openFilters = byId.get('default-open')?.config?.filters;
    assert.ok(openFilters);
    assert.deepEqual(openFilters.conditions[0]?.values, ['completed', 'canceled']);
    assert.equal(openFilters.conditions[0]?.values.includes('closed'), false);

    const unassignedFilters = byId.get('default-unassigned')?.config?.filters;
    assert.ok(unassignedFilters);
    assert.equal(unassignedFilters.conditions.length, 2);
    assert.equal(matchDefaultStatKey(openFilters), 'open');
    assert.equal(matchDefaultStatKey(byId.get('default-progress')?.config?.filters), 'inProgress');
    assert.equal(matchDefaultStatKey(byId.get('default-backlog')?.config?.filters), 'backlog');
    assert.equal(matchDefaultStatKey(unassignedFilters), 'unassigned');
  });

  it('supports legacy closed literal and routes custom FilterSets to null (stat-count)', () => {
    const legacyOpen: FilterSet = {
      conditions: [
        { id: 'c1', field: 'statusType', op: 'is_not', values: ['completed', 'canceled', 'closed'] },
      ],
    };
    assert.equal(matchDefaultStatKey(legacyOpen), 'open');

    const allUnassigned: FilterSet = {
      conditions: [{ id: 'c1', field: 'assignee', op: 'is', values: [null] }],
    };
    assert.equal(matchDefaultStatKey(allUnassigned), null);

    const highPriority: FilterSet = {
      conditions: [{ id: 'c1', field: 'priority', op: 'is', values: ['high'] }],
    };
    assert.equal(matchDefaultStatKey(highPriority), null);
  });

  it('excludes completed and canceled unassigned issues under default UNASSIGNED_FILTER', () => {
    const layout = defaultDashboardLayout((k) => k);
    const unassignedFilters = layout.find((w) => w.id === 'default-unassigned')?.config?.filters;
    const project = {
      columns: [
        { id: 1, stateType: 'backlog' },
        { id: 2, stateType: 'unstarted' },
        { id: 3, stateType: 'started' },
        { id: 4, stateType: 'completed' },
        { id: 5, stateType: 'canceled' },
      ],
    } as unknown as ProjectDetail;

    const issues = [
      { id: 1, columnId: 2, assigneeUserId: null, labelIds: [] },
      { id: 2, columnId: 3, assigneeUserId: 'u1', labelIds: [] },
      { id: 3, columnId: 4, assigneeUserId: null, labelIds: [] },
      { id: 4, columnId: 5, assigneeUserId: null, labelIds: [] },
    ] as unknown as ProjectDetail['issues'];

    const matched = applyFilters(issues, unassignedFilters, project);
    assert.deepEqual(
      matched.map((i) => i.id),
      [1],
    );
  });
});

describe('rowsForContentHeight & isFillHeightWidget', () => {
  it('computes the exact grid row span needed to fit a pixel height without scrolling', () => {
    // 5 rows = 5*40 + 4*16 = 264px; 265px overflows to 6 rows; 406px needs 8 rows (8*40 + 7*16 = 432px)
    assert.equal(rowsForContentHeight(264), 5);
    assert.equal(rowsForContentHeight(265), 6);
    assert.equal(rowsForContentHeight(406), 8);
  });

  it('respects minH floor and falls back to minH on invalid or non-positive heights', () => {
    assert.equal(rowsForContentHeight(80, 4), 4);
    assert.equal(rowsForContentHeight(0, 4), 4);
    assert.equal(rowsForContentHeight(-50, 3), 3);
    assert.equal(rowsForContentHeight(Number.NaN, 5), 5);
  });

  it('marks only container-sized chart widgets as fill-height', () => {
    assert.equal(isFillHeightWidget('burnup'), true);
    assert.equal(isFillHeightWidget('watched_metrics'), false);
    assert.equal(isFillHeightWidget('stat'), false);
    assert.equal(isFillHeightWidget('pulse'), false);
    assert.equal(isFillHeightWidget('recent_issues'), false);
  });
});
