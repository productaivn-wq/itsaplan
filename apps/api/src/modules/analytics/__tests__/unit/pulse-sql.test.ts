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

describe('analytics unit — Pulse SQL query invariants', () => {
  it('preserves archived issues, includes initiative activities, and falls back to issue.created_at for whole project', () => {
    const q = dialect.sqlToQuery(svc.buildPulseQuery(1, 'day', 54));
    expect(q.sql).not.toContain('archived_at');
    expect(q.sql).toContain('init.project_id = 1');
    expect(q.sql).toContain("action IN ('created', 'issue_created')");
    expect(q.sql).toContain('pi.created_at');
    expect(q.sql).toContain('is_future');
    expect(q.sql).toContain("to_char(s.bucket, 'YYYY-MM-DD') AS date");
    expect(q.sql).toContain("'Dy, Mon DD, YYYY'");
    expect(q.params).toEqual([]);
  });

  it('scopes to actor_user_id and omits unattributed issue.created_at fallback when actorUserId is provided', () => {
    const q = dialect.sqlToQuery(svc.buildPulseQuery(7, 'day', 26, 'user-123'));
    expect(q.sql).not.toContain('archived_at');
    expect(q.sql).toContain('a.actor_user_id = $1');
    expect(q.sql).not.toContain('pi.created_at');
    expect(q.params).toEqual(['user-123', 'user-123']);
  });

  it('emits valid year-inclusive formats and future flags for hour and week units', () => {
    const hourQ = dialect.sqlToQuery(svc.buildPulseQuery(3, 'hour', 10));
    expect(hourQ.sql).toContain("'Mon DD, YYYY, HH24:00'");
    expect(hourQ.sql).toContain("date_trunc('hour', now())");

    const weekQ = dialect.sqlToQuery(svc.buildPulseQuery(3, 'week', 10));
    expect(weekQ.sql).toContain('\'"Week of" Mon DD, YYYY\'');
    expect(weekQ.sql).toContain("date_trunc('week', now())");
  });
});
