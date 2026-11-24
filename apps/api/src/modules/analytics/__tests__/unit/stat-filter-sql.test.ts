import { describe, it, expect, beforeAll } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';

// Ensure @repo/db client initializes without connecting to live PG during pure unit tests.
process.env.DATABASE_URL ??= 'postgresql://unit:unit@127.0.0.1:5432/unit_no_connect';

type ServiceMod = typeof import('../../service');
let svc: ServiceMod;
const dialect = new PgDialect();

beforeAll(async () => {
  svc = await import('../../service');
});

describe('analytics unit — SQL FilterSet predicate & archive invariants', () => {
  it('enforces project_id and archived_at IS NULL on empty FilterSet', () => {
    const pred = svc.buildStatFilterPredicate(42, { conditions: [] });
    const q = dialect.sqlToQuery(pred);
    expect(q.sql).toContain('"issue"."project_id"');
    expect(q.sql).toContain('"issue"."archived_at" is null');
    expect(q.params).toContain(42);
  });

  it('ignores half-built conditions with empty values for value-based operators', () => {
    expect(svc.isEffectiveStatCondition({ field: 'priority', op: 'is', values: [] })).toBe(false);
    expect(svc.isEffectiveStatCondition({ field: 'priority', op: 'is_set', values: [] })).toBe(true);
    const pred = svc.buildStatFilterPredicate(1, {
      conditions: [{ field: 'priority', op: 'is', values: [] }],
    });
    const q = dialect.sqlToQuery(pred);
    expect(q.sql).not.toContain('"issue"."priority"');
  });

  it('builds exact SQL NULL-safe negation for is_not assignee and custom fields', () => {
    const pred = svc.buildStatFilterPredicate(1, {
      conditions: [
        { field: 'assignee', op: 'is_not', values: ['user-1'] },
        { field: 'labels', op: 'is', values: [null, 5] },
        { field: 'cf:12', op: 'contains', values: ['urgent'] },
      ],
    });
    const q = dialect.sqlToQuery(pred);
    expect(q.sql).toContain('NOT (COALESCE(');
    expect(q.sql).toContain('"issue_label"');
    expect(q.sql).toContain('strpos(lower(');
    expect(q.params).toContain('user-1');
    expect(q.params).toContain(5);
    expect(q.params).toContain('urgent');
  });

  it('handles cycle status:* filters without referencing non-existent cycle.status column', () => {
    const pred = svc.buildStatFilterPredicate(7, {
      conditions: [{ field: 'cycle', op: 'is', values: ['status:active'] }],
    });
    const q = dialect.sqlToQuery(pred);
    expect(q.sql).toContain('"cycle"."completed_at"');
    expect(q.sql).toContain('"cycle"."start_date"');
    expect(q.sql).toContain('"cycle"."end_date"');
    expect(q.sql).not.toContain('"cycle"."status"');
  });

  it('provides invalidateAnalyticsCache without throwing', () => {
    expect(() => svc.invalidateAnalyticsCache(1)).not.toThrow();
  });
});
