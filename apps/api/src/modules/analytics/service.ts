import {
  db,
  issue,
  projectColumn,
  projectMember,
  issueActivity,
  issueType,
  issueLabel,
  issueFieldValue,
  issueFieldOption,
  user,
  aiAgent,
  agentRun,
  webhook,
  webhookDelivery,
  initiative,
  cycle,
  type ActivityPayload,
} from '@repo/db';
import {
  and,
  desc,
  eq,
  exists,
  inArray,
  isNull,
  isNotNull,
  notExists,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { HttpError, iso } from '#shared/lib';

// Read-only project metrics for the dashboards feature. Every figure is derived
// from the existing issue / project_column / issue_activity / issue_status tables —
// there is no analytics storage. This module is the only place in the API that uses
// GROUP BY and date_trunc; counts are cast to int (Postgres count() returns bigint,
// which would otherwise arrive as a string).

// One row per closed issue: when it entered the completed state it is still in. A
// move between two completed columns falls inside that stretch of the history, so it
// is not a second closing, and an issue that was reopened counts once, at the last
// entry — the one it never left. An issue that is not in a completed state now has
// no row here.
function closings(projectId: number) {
  return sql`
    SELECT s.issue_id, min(s.entered_at) AS closed_at
      FROM issue_status s
      JOIN issue i ON i.id = s.issue_id
     WHERE i.project_id = ${projectId}
       AND i.archived_at IS NULL
       AND s.state_type = 'completed'
       AND NOT EXISTS (
             SELECT 1 FROM issue_status p
              WHERE p.issue_id = s.issue_id
                AND p.state_type IS DISTINCT FROM 'completed'
                AND (p.entered_at, p.id) > (s.entered_at, s.id))
     GROUP BY s.issue_id`;
}

// --- Stats -----------------------------------------------------------------------

export interface StatsDto {
  open: number;
  inProgress: number;
  backlog: number;
  overdue: number;
  unassigned: number;
  closedLast7d: number;
}

export const OPEN_STATES = sql`${projectColumn.stateType} NOT IN ('completed', 'canceled')`;

const ANALYTICS_CACHE_TTL_MS = 15_000;
const ANALYTICS_CACHE_MAX = 200;
const statsCache = new Map<string, { ts: number; data: StatsDto }>();
const statCountCache = new Map<string, { ts: number; data: number }>();
const breakdownCache = new Map<string, { ts: number; data: BreakdownItem[] }>();
const throughputCache = new Map<string, { ts: number; data: ThroughputWeek[] }>();
const burnupCache = new Map<string, { ts: number; data: BurnupDto }>();
const agentRunStatsCache = new Map<string, { ts: number; data: AgentRunStatsDto }>();
const webhookStatsCache = new Map<string, { ts: number; data: WebhookStatsDto }>();
const agentWorkloadCache = new Map<string, { ts: number; data: AgentWorkloadItem[] }>();

function clearProjectKeys<T>(cache: Map<string, { ts: number; data: T }>, projectId: number): void {
  const exact = String(projectId);
  const prefix = `${projectId}:`;
  for (const key of [...cache.keys()]) {
    if (key === exact || key.startsWith(prefix)) cache.delete(key);
  }
}

export function invalidateAnalyticsCache(projectId: number): void {
  clearProjectKeys(statsCache, projectId);
  clearProjectKeys(statCountCache, projectId);
  clearProjectKeys(breakdownCache, projectId);
  clearProjectKeys(throughputCache, projectId);
  clearProjectKeys(burnupCache, projectId);
  clearProjectKeys(pulseCache, projectId);
  clearProjectKeys(agentRunStatsCache, projectId);
  clearProjectKeys(webhookStatsCache, projectId);
  clearProjectKeys(agentWorkloadCache, projectId);
}

async function withAnalyticsCache<T>(
  cache: Map<string, { ts: number; data: T }>,
  key: string,
  compute: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.ts < ANALYTICS_CACHE_TTL_MS) {
    return hit.data;
  }
  const data = await compute();
  if (cache.size >= ANALYTICS_CACHE_MAX) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, { ts: Date.now(), data });
  return data;
}

export async function getStats(projectId: number): Promise<StatsDto> {
  return withAnalyticsCache(statsCache, String(projectId), async () => {
    const [[countsRow], closedRows] = await Promise.all([
      db
        .select({
          open: sql<number>`count(*) filter (where ${projectColumn.stateType} not in ('completed', 'canceled'))::int`,
          inProgress: sql<number>`count(*) filter (where ${projectColumn.stateType} = 'started')::int`,
          backlog: sql<number>`count(*) filter (where ${projectColumn.stateType} = 'backlog')::int`,
          overdue: sql<number>`count(*) filter (where ${issue.dueDate} < CURRENT_DATE and ${OPEN_STATES})::int`,
          unassigned: sql<number>`count(*) filter (where ${issue.assigneeUserId} is null and ${OPEN_STATES})::int`,
        })
        .from(issue)
        .innerJoin(projectColumn, eq(projectColumn.id, issue.columnId))
        .where(and(eq(issue.projectId, projectId), isNull(issue.archivedAt))),
      db.execute(sql`
        SELECT count(*)::int AS count
          FROM (${closings(projectId)}) c
         WHERE c.closed_at >= now() - interval '7 days'`) as unknown as Promise<
        { count: number }[]
      >,
    ]);
    const closedLast7d = Number(closedRows[0]!.count);

    return {
      open: Number(countsRow?.open ?? 0),
      inProgress: Number(countsRow?.inProgress ?? 0),
      backlog: Number(countsRow?.backlog ?? 0),
      overdue: Number(countsRow?.overdue ?? 0),
      unassigned: Number(countsRow?.unassigned ?? 0),
      closedLast7d,
    };
  });
}

// --- Breakdown -------------------------------------------------------------------

export type BreakdownBy = 'status' | 'priority' | 'type' | 'assignee' | 'delegate';

export interface BreakdownItem {
  key: string;
  label: string;
  count: number;
  color: string | null;
}

const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'No priority',
};

export async function getBreakdown(projectId: number, by: BreakdownBy): Promise<BreakdownItem[]> {
  return withAnalyticsCache(breakdownCache, `${projectId}:${by}`, async () => {
    if (by === 'status') {
      // Every column, including empty ones, in work items order.
      const rows = await db
        .select({
          key: sql<string>`${projectColumn.id}::text`,
          label: projectColumn.name,
          color: projectColumn.color,
          count: sql<number>`count(${issue.id})::int`,
        })
        .from(projectColumn)
        .leftJoin(issue, and(eq(issue.columnId, projectColumn.id), isNull(issue.archivedAt)))
        .where(eq(projectColumn.projectId, projectId))
        .groupBy(projectColumn.id, projectColumn.name, projectColumn.color, projectColumn.position)
        .orderBy(projectColumn.position);
      return rows.map((r) => ({ key: r.key, label: r.label, count: r.count, color: r.color }));
    }

    if (by === 'priority') {
      const rows = await db
        .select({
          key: sql<string>`COALESCE(${issue.priority}, 'none')`,
          count: sql<number>`count(*)::int`,
        })
        .from(issue)
        .where(and(eq(issue.projectId, projectId), isNull(issue.archivedAt)))
        .groupBy(issue.priority)
        .orderBy(desc(sql`count(*)`));
      return rows.map((r) => ({
        key: r.key,
        label: PRIORITY_LABEL[r.key] ?? r.key,
        count: r.count,
        color: null,
      }));
    }

    if (by === 'type') {
      const rows = await db
        .select({
          key: sql<string>`COALESCE(${issueType.id}::text, 'none')`,
          label: sql<string>`COALESCE(${issueType.name}, 'No type')`,
          color: issueType.color,
          count: sql<number>`count(${issue.id})::int`,
        })
        .from(issue)
        .leftJoin(issueType, eq(issueType.id, issue.typeId))
        .where(and(eq(issue.projectId, projectId), isNull(issue.archivedAt)))
        .groupBy(issueType.id, issueType.name, issueType.color)
        .orderBy(desc(sql`count(${issue.id})`));
      return rows.map((r) => ({
        key: r.key,
        label: r.label,
        count: r.count,
        color: r.color ?? null,
      }));
    }

    if (by === 'delegate') {
      const rows = await db
        .select({
          key: sql<string>`COALESCE(${user.id}, 'none')`,
          label: sql<string>`COALESCE(${user.name}, 'Not delegated')`,
          count: sql<number>`count(${issue.id})::int`,
        })
        .from(issue)
        .leftJoin(user, eq(user.id, issue.delegateUserId))
        .where(and(eq(issue.projectId, projectId), isNull(issue.archivedAt)))
        .groupBy(user.id, user.name)
        .orderBy(desc(sql`count(${issue.id})`));
      return rows.map((r) => ({ key: r.key, label: r.label, count: r.count, color: null }));
    }

    // assignee
    const rows = await db
      .select({
        key: sql<string>`COALESCE(${user.id}, 'none')`,
        label: sql<string>`COALESCE(${user.name}, 'Unassigned')`,
        count: sql<number>`count(${issue.id})::int`,
      })
      .from(issue)
      .leftJoin(user, eq(user.id, issue.assigneeUserId))
      .where(and(eq(issue.projectId, projectId), isNull(issue.archivedAt)))
      .groupBy(user.id, user.name)
      .orderBy(desc(sql`count(${issue.id})`));
    return rows.map((r) => ({ key: r.key, label: r.label, count: r.count, color: null }));
  });
}

// --- Pulse (activity heatmap) ----------------------------------------------------

export type PulseUnit = 'hour' | 'day' | 'week';

export interface PulseBucket {
  label: string;
  count: number;
  date: string;
  isFuture: boolean;
}

// Per-unit heatmap geometry. `rows` cells stack in each column. `aligned` units
// snap each column to a calendar boundary so the rows carry meaning — an hour
// column is a day (rows = hours 0..23, `super` = day), a day column is an ISO
// week (rows = Mon..Sun, `super` = week). Weeks have no such boundary, so they
// are unaligned: each column just packs `rows` consecutive weeks ending at now.
// `fmt` is the tooltip label (Postgres to_char pattern, always including year).
const PULSE_UNIT: Record<
  PulseUnit,
  {
    trunc: string;
    super: string;
    superField: string;
    baseField: string;
    rows: number;
    aligned: boolean;
    fmt: string;
  }
> = {
  hour: {
    trunc: 'hour',
    super: 'day',
    superField: 'days',
    baseField: 'hours',
    rows: 24,
    aligned: true,
    fmt: 'Mon DD, YYYY, HH24:00',
  },
  day: {
    trunc: 'day',
    super: 'week',
    superField: 'weeks',
    baseField: 'days',
    rows: 7,
    aligned: true,
    fmt: 'Dy, Mon DD, YYYY',
  },
  week: {
    trunc: 'week',
    super: 'week',
    superField: 'weeks',
    baseField: 'weeks',
    rows: 4,
    aligned: false,
    fmt: '"Week of" Mon DD, YYYY',
  },
};

export function pulseRows(unit: PulseUnit): number {
  return PULSE_UNIT[unit].rows;
}

// A zero-filled activity series for the heatmap: `columns` columns of `rows` cells
// each, ending at now (see PULSE_UNIT for the geometry). Postgres generates the
// full bucket axis with generate_series and left-joins the counts, so the client
// renders the returned order directly — no client-side date math or timezone
// reconciliation. Includes archived issues (auto-archiving must not erase history),
// initiative activities, and — for whole-project scope — issues that lack a
// creation row in issue_activity. projectId and columns are validated numbers and
// the unit tokens are whitelisted, so the interpolation is injection-safe.
const pulseCache = new Map<string, { ts: number; data: PulseBucket[] }>();

export function buildPulseQuery(
  projectId: number,
  unit: PulseUnit,
  columns: number,
  actorUserId?: string,
): SQL {
  const u = PULSE_UNIT[unit];
  const range = u.aligned
    ? {
        start: `date_trunc('${u.super}', now()) - make_interval(${u.superField} => ${columns - 1})`,
        end: `date_trunc('${u.super}', now()) + make_interval(${u.baseField} => ${u.rows - 1})`,
      }
    : {
        start: `date_trunc('${u.trunc}', now()) - make_interval(${u.baseField} => ${columns * u.rows - 1})`,
        end: `date_trunc('${u.trunc}', now())`,
      };
  const actorFilter = actorUserId == null ? sql`` : sql`AND a.actor_user_id = ${actorUserId}`;
  const missingCreatedFallback =
    actorUserId == null
      ? sql.raw(`
        UNION ALL
        SELECT pi.created_at
        FROM proj_issues pi
        CROSS JOIN range_bounds rb
        LEFT JOIN (
          SELECT DISTINCT issue_id
          FROM act_rows
          WHERE action IN ('created', 'issue_created')
        ) hc ON hc.issue_id = pi.id
        WHERE hc.issue_id IS NULL
          AND pi.created_at >= rb.start_ts
          AND pi.created_at < rb.end_ts + interval '1 ${u.trunc}'`)
      : sql``;

  return sql`${sql.raw(`
      WITH range_bounds AS (
        SELECT ${range.start} AS start_ts,
               ${range.end} AS end_ts
      ),
      proj_issues AS (
        SELECT i.id, i.created_at
        FROM issue i
        WHERE i.project_id = ${projectId}
      ),
      act_rows AS (
        SELECT a.issue_id, a.action, a.created_at
        FROM issue_activity a
        JOIN proj_issues pi ON pi.id = a.issue_id
        CROSS JOIN range_bounds rb
        WHERE a.created_at >= rb.start_ts
          AND a.created_at < rb.end_ts + interval '1 ${u.trunc}'
    `)}
          ${actorFilter}
    ${sql.raw(`
      ),
      init_rows AS (
        SELECT a.created_at
        FROM issue_activity a
        JOIN initiative init ON init.id = a.initiative_id
        CROSS JOIN range_bounds rb
        WHERE a.issue_id IS NULL
          AND init.project_id = ${projectId}
          AND a.created_at >= rb.start_ts
          AND a.created_at < rb.end_ts + interval '1 ${u.trunc}'
    `)}
          ${actorFilter}
    ${sql.raw(`
      ),
      events AS (
        SELECT created_at FROM act_rows
        UNION ALL
        SELECT created_at FROM init_rows
    `)}
        ${missingCreatedFallback}
    ${sql.raw(`
      ),
      agg AS (
        SELECT date_trunc('${u.trunc}', created_at) AS bucket,
               count(*)::int AS cnt
        FROM events
        GROUP BY 1
      )
      SELECT to_char(s.bucket, '${u.fmt}') AS label,
             to_char(s.bucket, 'YYYY-MM-DD') AS date,
             (s.bucket > date_trunc('${u.trunc}', now())) AS is_future,
             COALESCE(agg.cnt, 0)::int AS count
      FROM range_bounds rb,
           generate_series(rb.start_ts, rb.end_ts, interval '1 ${u.trunc}') AS s(bucket)
      LEFT JOIN agg ON agg.bucket = s.bucket
      ORDER BY s.bucket
    `)}`;
}

export async function getPulse(
  projectId: number,
  unit: PulseUnit,
  columns: number,
  actorUserId?: string,
): Promise<PulseBucket[]> {
  const cacheKey = `${projectId}:${unit}:${columns}:${actorUserId ?? ''}`;
  return withAnalyticsCache(pulseCache, cacheKey, async () => {
    const q = buildPulseQuery(projectId, unit, columns, actorUserId);
    const rows = (await db.execute(q)) as unknown as {
      label: string;
      date: string;
      is_future: boolean;
      count: number;
    }[];
    return rows.map((r) => ({
      label: r.label,
      count: Number(r.count),
      date: r.date,
      isFuture: Boolean(r.is_future),
    }));
  });
}

// --- Throughput (created vs closed per week) -------------------------------------

export interface ThroughputWeek {
  week: string;
  created: number;
  closed: number;
}

// Creations come from the change log, closings from the status history; the two are
// counted in one pass over their union so the weeks need no merging afterwards. A
// week with neither is absent from the result.
export async function getThroughput(projectId: number, weeks: number): Promise<ThroughputWeek[]> {
  return withAnalyticsCache(throughputCache, `${projectId}:${weeks}`, async () => {
    const since = sql`date_trunc('week', now()) - make_interval(weeks => ${weeks - 1})`;
    const rows = (await db.execute(sql`
      SELECT to_char(e.week, 'YYYY-MM-DD') AS week,
             (count(*) FILTER (WHERE e.kind = 'created'))::int AS created,
             (count(*) FILTER (WHERE e.kind = 'closed'))::int AS closed
        FROM (
          SELECT date_trunc('week', a.created_at) AS week, 'created' AS kind
            FROM issue_activity a
            JOIN issue i ON i.id = a.issue_id
           WHERE i.project_id = ${projectId}
             AND i.archived_at IS NULL
             AND a.action = 'created'
             AND a.created_at >= ${since}
          UNION ALL
          SELECT date_trunc('week', c.closed_at), 'closed'
            FROM (${closings(projectId)}) c
           WHERE c.closed_at >= ${since}
        ) e
       GROUP BY e.week
       ORDER BY e.week`)) as unknown as ThroughputWeek[];
    return rows.map((r) => ({ week: r.week, created: Number(r.created), closed: Number(r.closed) }));
  });
}

// --- Burnup (scope / started / completed per day, with a forecast) ---------------

export interface BurnupDay {
  date: string;
  scope: number;
  started: number;
  completed: number;
}

export interface BurnupForecast {
  windowDays: number;
  velocityPerDay: number;
  // The scope's growth rate over the same window, never negative: cancellations
  // are not a trend.
  scopeGrowthPerDay: number;
  remaining: number;
  // The scope the projection ends at: today's plus the issues expected to appear,
  // at scopeGrowthPerDay, while today's remaining ones are closed.
  projectedScope: number;
  projectedDate: string | null;
  // The projected date with the days to go shortened and lengthened by
  // RANGE_BUFFER: the range the widget can draw around the projection. Null
  // together with projectedDate.
  optimisticDate: string | null;
  pessimisticDate: string | null;
}

export interface BurnupDto {
  days: BurnupDay[];
  forecast: BurnupForecast;
  targetDate: string | null;
}

export interface BurnupParams {
  days: number;
  initiativeId: number | null;
  forecastWeeks: number;
}

// Unlike closings() above, which dates each issue by the moment it was closed, the
// burnup asks what state every issue was in at the end of each day: the status row
// whose stretch covers that midnight. So an issue that was reopened leaves the
// completed line for the days it was open again, and a canceled issue leaves the
// scope line — the chart is a history of the project, not of the events.
export async function getBurnup(projectId: number, params: BurnupParams): Promise<BurnupDto> {
  const key = `${projectId}:${params.days}:${params.initiativeId ?? 'all'}:${params.forecastWeeks}`;
  return withAnalyticsCache(burnupCache, key, async () => {
    const targetDate = await initiativeTargetDate(projectId, params.initiativeId);
    const initiativeFilter =
      params.initiativeId == null ? sql`` : sql`AND i.initiative_id = ${params.initiativeId}::int`;
    const rows = (await db.execute(sql`
      WITH d AS (
        SELECT generate_series(current_date - ${params.days - 1}::int, current_date, '1 day')::date AS day
      )
      SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
             (count(s.issue_id) FILTER (WHERE s.state_type IS DISTINCT FROM 'canceled'))::int AS scope,
             (count(s.issue_id) FILTER (WHERE s.state_type IN ('started', 'completed')))::int AS started,
             (count(s.issue_id) FILTER (WHERE s.state_type = 'completed'))::int AS completed
        FROM d
        LEFT JOIN (
          SELECT s.issue_id, s.state_type, s.entered_at, s.left_at
            FROM issue_status s
            JOIN issue i ON i.id = s.issue_id
           WHERE i.project_id = ${projectId}
             AND i.archived_at IS NULL
             ${initiativeFilter}
        ) s ON s.entered_at < d.day + 1
           AND (s.left_at IS NULL OR s.left_at >= d.day + 1)
       GROUP BY d.day
       ORDER BY d.day`)) as unknown as BurnupDay[];
    const days = rows.map((r) => ({
      date: r.date,
      scope: Number(r.scope),
      started: Number(r.started),
      completed: Number(r.completed),
    }));
    return { days, forecast: forecastCompletion(days, params.forecastWeeks * 7), targetDate };
  });
}

// The initiative's target date, so the chart can draw it; null when the whole
// project is charted. An initiative from another project is a 404, not an empty
// chart, so a wrong id does not read as an initiative with no issues.
async function initiativeTargetDate(
  projectId: number,
  initiativeId: number | null,
): Promise<string | null> {
  if (initiativeId == null) return null;
  const [row] = await db
    .select({ targetDate: initiative.targetDate })
    .from(initiative)
    .where(and(eq(initiative.id, initiativeId), eq(initiative.projectId, projectId)))
    .limit(1);
  if (!row) throw new HttpError(404, 'Initiative not found');
  return row.targetDate;
}

// The buffer Linear's project graph puts around its projected date.
const RANGE_BUFFER = 0.4;

// A completion date from two rates over the whole weeks inside the last
// `windowDays` days of the series, the latest week weighted heaviest (a window
// with no whole week uses the plain rates): the closing rate, and the scope's
// growth rate. The days to go cover today's remaining issues plus the ones
// expected to appear while they are closed — one round, not compounded, so a
// scope growing faster than it is closed still gets a date. No date when nothing
// was closed in the window or nothing is left — the widget says so instead of
// drawing a line to infinity.
export function forecastCompletion(days: BurnupDay[], windowDays: number): BurnupForecast {
  const last = days[days.length - 1];
  if (!last) {
    return {
      windowDays: 0,
      velocityPerDay: 0,
      scopeGrowthPerDay: 0,
      remaining: 0,
      projectedScope: 0,
      projectedDate: null,
      optimisticDate: null,
      pessimisticDate: null,
    };
  }
  const lastIndex = days.length - 1;
  const startIndex = Math.max(0, lastIndex - windowDays);
  const velocity = rateOver(days, startIndex, 'completed');
  const growth = Math.max(0, rateOver(days, startIndex, 'scope'));
  const remaining = Math.max(0, last.scope - last.completed);
  const daysForRemaining = velocity > 0 && remaining > 0 ? remaining / velocity : null;
  const expected = daysForRemaining === null ? 0 : Math.round(growth * daysForRemaining);
  const daysToGo = daysForRemaining === null ? null : (remaining + expected) / velocity;
  const dateAt = (factor: number) =>
    daysToGo === null ? null : addDays(last.date, Math.ceil(daysToGo * factor));
  return {
    windowDays: lastIndex - startIndex,
    velocityPerDay: round2(velocity),
    scopeGrowthPerDay: round2(growth),
    remaining,
    projectedScope: last.scope + expected,
    projectedDate: dateAt(1),
    optimisticDate: dateAt(1 - RANGE_BUFFER),
    pessimisticDate: dateAt(1 + RANGE_BUFFER),
  };
}

// The daily rate of `key` over the whole weeks between startIndex and the last
// day, the latest week weighted n, the earliest 1; the plain rate over the span
// when there is no whole week, 0 for a single point.
function rateOver(days: BurnupDay[], startIndex: number, key: 'completed' | 'scope'): number {
  const lastIndex = days.length - 1;
  const weeks = Math.floor((lastIndex - startIndex) / 7);
  if (weeks === 0) {
    const span = lastIndex - startIndex;
    return span > 0 ? (days[lastIndex]![key] - days[startIndex]![key]) / span : 0;
  }
  let sum = 0;
  let weightSum = 0;
  for (let i = 0; i < weeks; i++) {
    const end = lastIndex - i * 7;
    const weight = weeks - i;
    sum += (weight * (days[end]![key] - days[end - 7]![key])) / 7;
    weightSum += weight;
  }
  return sum / weightSum;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// 'YYYY-MM-DD' plus n days, computed in UTC so the local timezone never shifts the
// calendar date.
function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// --- Project-wide activity feed --------------------------------------------------

export interface ActivityCursor {
  ts: string;
  id: number;
}

export interface ActivityItem {
  id: number;
  issueId: number;
  issueSequence: number;
  issueTitle: string;
  kind: string;
  actorUserId: string | null;
  actorName: string | null;
  body: string | null;
  action: string | null;
  payload: ActivityPayload;
  createdAt: string;
}

export interface ActivityPage {
  items: ActivityItem[];
  nextCursor: ActivityCursor | null;
}

// One page of the project's activity feed, newest first, keyset-paginated by
// (created_at, id) exactly like the per-issue feed. Optional filters narrow by
// action kind, actor, and — for the dashboard widget's issue filter — a set of
// issue ids the client resolved from a work items filter set. An empty issueIds array
// means "the filter matched no issues", so the feed is empty.
export async function listActivity(
  projectId: number,
  opts: {
    before?: ActivityCursor | null;
    limit?: number;
    actorUserId?: string | null;
    action?: string | null;
    issueIds?: number[] | null;
  } = {},
): Promise<ActivityPage> {
  const limit = Math.min(Math.max(opts.limit ?? 25, 1), 100);
  const before = opts.before ?? null;

  if (opts.issueIds && opts.issueIds.length === 0) return { items: [], nextCursor: null };

  const conds = [eq(issue.projectId, projectId), isNull(issue.archivedAt)];
  if (opts.issueIds) conds.push(inArray(issueActivity.issueId, opts.issueIds));
  if (opts.actorUserId != null) conds.push(eq(issueActivity.actorUserId, opts.actorUserId));
  if (opts.action) conds.push(eq(issueActivity.action, opts.action));
  if (before)
    conds.push(
      sql`(${issueActivity.createdAt}, ${issueActivity.id}) < (${before.ts}::timestamptz, ${before.id}::integer)`,
    );

  const rows = await db
    .select({
      id: issueActivity.id,
      issueId: issueActivity.issueId,
      issueSequence: issue.sequenceNumber,
      issueTitle: issue.title,
      kind: issueActivity.kind,
      actorUserId: issueActivity.actorUserId,
      actorName: issueActivity.actorName,
      body: issueActivity.body,
      action: issueActivity.action,
      payload: issueActivity.payload,
      createdAt: issueActivity.createdAt,
      cursorTs: sql<string>`${issueActivity.createdAt}::text`,
    })
    .from(issueActivity)
    .innerJoin(issue, eq(issue.id, issueActivity.issueId))
    .where(and(...conds))
    .orderBy(desc(issueActivity.createdAt), desc(issueActivity.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  return {
    items: page.map((row) => ({
      id: row.id,
      // The inner join on issueActivity.issueId excludes initiative rows, so
      // issueId is always present here despite the column being nullable.
      issueId: row.issueId as number,
      issueSequence: row.issueSequence,
      issueTitle: row.issueTitle,
      kind: row.kind,
      actorUserId: row.actorUserId,
      actorName: row.actorName,
      body: row.body,
      action: row.action,
      payload: row.payload,
      createdAt: iso(row.createdAt),
    })),
    nextCursor: hasMore && last ? { ts: last.cursorTs, id: last.id } : null,
  };
}

// --- Agent runs (project-wide feed) ----------------------------------------------

export interface AgentRunFeedItem {
  id: number;
  status: string;
  trigger: 'mention' | 'delegation' | 'field' | 'schedule' | 'manual';
  agentId: number;
  agentName: string;
  issueId: number | null;
  issueSequence: number | null;
  lastError: string | null;
  createdAt: string;
}

// The project's agent runs, newest first, optionally narrowed to one status. A run
// carries the project it worked in; ai_agent is joined for the agent name and issue
// when the run is issue-triggered.
export async function listAgentRunFeed(
  projectId: number,
  opts: { status?: string | null; limit?: number } = {},
): Promise<AgentRunFeedItem[]> {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const conds = [eq(agentRun.projectId, projectId)];
  if (opts.status) conds.push(eq(agentRun.status, opts.status));

  const rows = await db
    .select({
      id: agentRun.id,
      status: agentRun.status,
      trigger: agentRun.trigger,
      agentId: agentRun.agentId,
      agentName: aiAgent.username,
      issueId: agentRun.issueId,
      issueSequence: issue.sequenceNumber,
      lastError: agentRun.lastError,
      createdAt: agentRun.createdAt,
    })
    .from(agentRun)
    .innerJoin(aiAgent, eq(aiAgent.id, agentRun.agentId))
    .leftJoin(issue, eq(issue.id, agentRun.issueId))
    .where(and(...conds))
    .orderBy(desc(agentRun.id))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    trigger: r.trigger as AgentRunFeedItem['trigger'],
    agentId: r.agentId,
    agentName: r.agentName,
    issueId: r.issueId,
    issueSequence: r.issueSequence,
    lastError: r.lastError,
    createdAt: iso(r.createdAt),
  }));
}

// --- Agent run health (counts by status over a window) ---------------------------

export interface AgentRunStatsDto {
  total: number;
  success: number;
  failed: number;
  pending: number;
}

// Agent run outcome counts over the last `days` days for the project. Backs the
// agent health widget's success rate and failure count.
export async function getAgentRunStats(projectId: number, days: number): Promise<AgentRunStatsDto> {
  return withAnalyticsCache(agentRunStatsCache, `${projectId}:${days}`, async () => {
    const rows = await db
      .select({ status: agentRun.status, count: sql<number>`count(*)::int` })
      .from(agentRun)
      .where(
        and(
          eq(agentRun.projectId, projectId),
          sql`${agentRun.createdAt} >= now() - make_interval(days => ${days})`,
        ),
      )
      .groupBy(agentRun.status);

    const stats: AgentRunStatsDto = { total: 0, success: 0, failed: 0, pending: 0 };
    for (const r of rows) {
      stats.total += r.count;
      if (r.status === 'success') stats.success = r.count;
      else if (r.status === 'failed') stats.failed = r.count;
      else if (r.status === 'pending') stats.pending = r.count;
    }
    return stats;
  });
}

// --- Webhook delivery health -----------------------------------------------------

export interface WebhookStatsDto {
  total: number;
  success: number;
  failed: number;
  pending: number;
  activeWebhooks: number;
  disabledWebhooks: number;
}

// Webhook delivery outcome counts over the last `days` days plus the current
// active/disabled subscription split (a dead endpoint is auto-disabled once its
// consecutive failures cross the worker threshold). Backs the webhook health widget.
export async function getWebhookStats(projectId: number, days: number): Promise<WebhookStatsDto> {
  return withAnalyticsCache(webhookStatsCache, `${projectId}:${days}`, async () => {
    const [deliveryRows, webhookRows] = await Promise.all([
      db
        .select({ status: webhookDelivery.status, count: sql<number>`count(*)::int` })
        .from(webhookDelivery)
        .innerJoin(webhook, eq(webhook.id, webhookDelivery.webhookId))
        .where(
          and(
            eq(webhook.projectId, projectId),
            sql`${webhookDelivery.createdAt} >= now() - make_interval(days => ${days})`,
          ),
        )
        .groupBy(webhookDelivery.status),
      db
        .select({ isActive: webhook.isActive, count: sql<number>`count(*)::int` })
        .from(webhook)
        .where(eq(webhook.projectId, projectId))
        .groupBy(webhook.isActive),
    ]);

    const stats: WebhookStatsDto = {
      total: 0,
      success: 0,
      failed: 0,
      pending: 0,
      activeWebhooks: 0,
      disabledWebhooks: 0,
    };
    for (const r of deliveryRows) {
      stats.total += r.count;
      if (r.status === 'success') stats.success = r.count;
      else if (r.status === 'failed') stats.failed = r.count;
      else if (r.status === 'pending') stats.pending = r.count;
    }
    for (const r of webhookRows) {
      if (r.isActive) stats.activeWebhooks = r.count;
      else stats.disabledWebhooks = r.count;
    }
    return stats;
  });
}

// --- Agent workload (per-agent delegated issues and run outcomes) ----------------

export interface AgentWorkloadItem {
  agentId: number;
  agentName: string;
  kind: string;
  delegatedOpen: number;
  runsTotal: number;
  runsSuccess: number;
  runsFailed: number;
}

// Per-agent workload for the project: how many open issues each agent is currently
// delegated, and its lifetime run outcomes. Three cheap grouped reads merged in
// memory (one per source), keyed by the agent's bot user id and agent id.
export async function getAgentWorkload(projectId: number): Promise<AgentWorkloadItem[]> {
  return withAnalyticsCache(agentWorkloadCache, String(projectId), async () => {
    const agents = await db
      .select({ id: aiAgent.id, userId: aiAgent.userId, name: aiAgent.username, kind: aiAgent.kind })
      .from(aiAgent)
      .innerJoin(
        projectMember,
        and(eq(projectMember.userId, aiAgent.userId), eq(projectMember.projectId, projectId)),
      );
    if (agents.length === 0) return [];

    const [delegatedRows, runRows] = await Promise.all([
      db
        .select({ userId: issue.delegateUserId, count: sql<number>`count(*)::int` })
        .from(issue)
        .innerJoin(projectColumn, eq(projectColumn.id, issue.columnId))
        .where(
          and(
            eq(issue.projectId, projectId),
            isNull(issue.archivedAt),
            isNotNull(issue.delegateUserId),
            OPEN_STATES,
          ),
        )
        .groupBy(issue.delegateUserId),
      db
        .select({
          agentId: agentRun.agentId,
          total: sql<number>`count(*)::int`,
          success: sql<number>`(count(*) filter (where ${agentRun.status} = 'success'))::int`,
          failed: sql<number>`(count(*) filter (where ${agentRun.status} = 'failed'))::int`,
        })
        .from(agentRun)
        .where(eq(agentRun.projectId, projectId))
        .groupBy(agentRun.agentId),
    ]);
    const delegatedByUser = new Map(delegatedRows.map((r) => [r.userId, r.count]));
    const runsByAgent = new Map(runRows.map((r) => [r.agentId, r]));

    return agents
      .map((a) => {
        const runs = runsByAgent.get(a.id);
        return {
          agentId: a.id,
          agentName: a.name,
          kind: a.kind,
          delegatedOpen: delegatedByUser.get(a.userId) ?? 0,
          runsTotal: runs?.total ?? 0,
          runsSuccess: runs?.success ?? 0,
          runsFailed: runs?.failed ?? 0,
        };
      })
      .sort(
        (a, b) =>
          b.delegatedOpen - a.delegatedOpen ||
          b.runsTotal - a.runsTotal ||
          a.agentName.localeCompare(b.agentName),
      );
  });
}

// --- Server-side FilterSet stat counting -----------------------------------------

export type StatFilterOperator =
  | 'is'
  | 'is_not'
  | 'before'
  | 'after'
  | 'is_set'
  | 'is_not_set'
  | 'contains'
  | 'not_contains';

export type StatFilterValue = string | number | boolean | null;

export interface StatFilterCondition {
  id?: string;
  field: string;
  op: StatFilterOperator;
  values: StatFilterValue[];
}

export interface StatFilterSet {
  conditions: StatFilterCondition[];
}

export function isEffectiveStatCondition(cond: StatFilterCondition): boolean {
  if (cond.op === 'is_set' || cond.op === 'is_not_set') return true;
  return Array.isArray(cond.values) && cond.values.length > 0;
}

function negateSql(positive: SQL): SQL {
  return sql`NOT (COALESCE(${positive}, false))`;
}

function combineDisjunction(parts: SQL[]): SQL {
  if (parts.length === 0) return sql`false`;
  if (parts.length === 1) return parts[0]!;
  return or(...parts)!;
}

function cycleStatusSql(status: string): SQL {
  const today = sql`(now() at time zone 'utc')::date`;
  switch (status) {
    case 'completed':
      return sql`(${cycle.completedAt} IS NOT NULL OR ${cycle.endDate} < ${today})`;
    case 'upcoming':
      return sql`(${cycle.completedAt} IS NULL AND ${cycle.startDate} > ${today})`;
    case 'active':
      return sql`(${cycle.completedAt} IS NULL AND ${cycle.startDate} <= ${today} AND ${today} <= ${cycle.endDate})`;
    default:
      return sql`false`;
  }
}

function cfPresenceSql(cfId: number): SQL {
  const hasScalar = exists(
    db
      .select({ one: sql`1` })
      .from(issueFieldValue)
      .where(
        and(
          eq(issueFieldValue.issueId, issue.id),
          eq(issueFieldValue.fieldId, cfId),
          or(
            and(isNotNull(issueFieldValue.valueText), sql`${issueFieldValue.valueText} <> ''`),
            isNotNull(issueFieldValue.valueNumber),
            isNotNull(issueFieldValue.valueBool),
            isNotNull(issueFieldValue.valueDate),
            isNotNull(issueFieldValue.valueDatetime),
            isNotNull(issueFieldValue.valueUserId),
          ),
        ),
      ),
  );
  const hasOption = exists(
    db
      .select({ one: sql`1` })
      .from(issueFieldOption)
      .where(and(eq(issueFieldOption.issueId, issue.id), eq(issueFieldOption.fieldId, cfId))),
  );
  return or(hasScalar, hasOption)!;
}

function customFieldConditionSql(cfId: number, cond: StatFilterCondition): SQL {
  if (!Number.isInteger(cfId) || cfId <= 0) {
    return cond.op === 'is_not' || cond.op === 'is_not_set' || cond.op === 'not_contains'
      ? sql`true`
      : sql`false`;
  }
  const hasCf = cfPresenceSql(cfId);

  if (cond.op === 'is_set') return hasCf;
  if (cond.op === 'is_not_set') return negateSql(hasCf);

  if (cond.op === 'before' || cond.op === 'after') {
    const target = typeof cond.values[0] === 'string' ? cond.values[0] : null;
    if (!target) return sql`false`;
    const dayCol = sql`COALESCE(to_char(${issueFieldValue.valueDate}, 'YYYY-MM-DD'), to_char(${issueFieldValue.valueDatetime}, 'YYYY-MM-DD'), left(${issueFieldValue.valueText}, 10))`;
    const cmp = cond.op === 'before' ? sql`${dayCol} < ${target}` : sql`${dayCol} > ${target}`;
    return exists(
      db
        .select({ one: sql`1` })
        .from(issueFieldValue)
        .where(
          and(
            eq(issueFieldValue.issueId, issue.id),
            eq(issueFieldValue.fieldId, cfId),
            sql`${dayCol} IS NOT NULL`,
            cmp,
          ),
        ),
    );
  }

  if (cond.op === 'contains' || cond.op === 'not_contains') {
    const needle = typeof cond.values[0] === 'string' ? cond.values[0].toLowerCase() : '';
    if (!needle) return cond.op === 'contains' ? sql`false` : sql`true`;
    const hit = exists(
      db
        .select({ one: sql`1` })
        .from(issueFieldValue)
        .where(
          and(
            eq(issueFieldValue.issueId, issue.id),
            eq(issueFieldValue.fieldId, cfId),
            isNotNull(issueFieldValue.valueText),
            sql`strpos(lower(${issueFieldValue.valueText}), ${needle}) > 0`,
          ),
        ),
    );
    return cond.op === 'contains' ? hit : negateSql(hit);
  }

  // is / is_not
  const parts: SQL[] = [];
  const hasNull = cond.values.includes(null);
  const numVals = cond.values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const strVals = cond.values.filter((v): v is string => typeof v === 'string');
  const boolVals = cond.values.filter((v): v is boolean => typeof v === 'boolean');

  if (hasNull) parts.push(negateSql(hasCf));
  if (numVals.length > 0) {
    parts.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(issueFieldOption)
          .where(
            and(
              eq(issueFieldOption.issueId, issue.id),
              eq(issueFieldOption.fieldId, cfId),
              inArray(issueFieldOption.optionId, numVals),
            ),
          ),
      ),
    );
    const numStrs = numVals.map((n) => String(n));
    parts.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(issueFieldValue)
          .where(
            and(
              eq(issueFieldValue.issueId, issue.id),
              eq(issueFieldValue.fieldId, cfId),
              sql`${issueFieldValue.valueNumber}::text IN (${sql.join(
                numStrs.map((s) => sql`${s}`),
                sql`, `,
              )})`,
            ),
          ),
      ),
    );
  }
  if (strVals.length > 0) {
    parts.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(issueFieldValue)
          .where(
            and(
              eq(issueFieldValue.issueId, issue.id),
              eq(issueFieldValue.fieldId, cfId),
              or(
                inArray(issueFieldValue.valueText, strVals),
                inArray(issueFieldValue.valueUserId, strVals),
                sql`${issueFieldValue.valueDate}::text IN (${sql.join(
                  strVals.map((s) => sql`${s}`),
                  sql`, `,
                )})`,
              ),
            ),
          ),
      ),
    );
  }
  if (boolVals.length > 0) {
    parts.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(issueFieldValue)
          .where(
            and(
              eq(issueFieldValue.issueId, issue.id),
              eq(issueFieldValue.fieldId, cfId),
              inArray(issueFieldValue.valueBool, boolVals),
            ),
          ),
      ),
    );
  }

  const pos = combineDisjunction(parts);
  return cond.op === 'is' ? pos : negateSql(pos);
}

function dateFieldConditionSql(field: string, cond: StatFilterCondition): SQL {
  const col =
    field === 'dueDate'
      ? issue.dueDate
      : field === 'startDate'
        ? issue.startDate
        : field === 'created'
          ? issue.createdAt
          : issue.updatedAt;

  if (cond.op === 'is_set') return isNotNull(col);
  if (cond.op === 'is_not_set') return isNull(col);

  if (cond.op === 'before' || cond.op === 'after') {
    const target = typeof cond.values[0] === 'string' ? cond.values[0] : null;
    if (!target) return sql`false`;
    const dayExpr =
      field === 'dueDate' || field === 'startDate'
        ? sql`${col}::text`
        : sql`to_char(${col}, 'YYYY-MM-DD')`;
    const cmp = cond.op === 'before' ? sql`${dayExpr} < ${target}` : sql`${dayExpr} > ${target}`;
    return and(isNotNull(col), cmp)!;
  }

  return sql`true`;
}

function setFieldConditionSql(cond: StatFilterCondition): SQL {
  const hasNull = cond.values.includes(null);
  const strVals = cond.values.filter((v): v is string => typeof v === 'string');
  const numVals = cond.values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  if (cond.op === 'is_set' || cond.op === 'is_not_set') {
    let present: SQL;
    switch (cond.field) {
      case 'status':
        present = isNotNull(issue.columnId);
        break;
      case 'statusType':
        present = isNotNull(projectColumn.stateType);
        break;
      case 'assignee':
        present = isNotNull(issue.assigneeUserId);
        break;
      case 'delegate':
        present = isNotNull(issue.delegateUserId);
        break;
      case 'priority':
        present = and(isNotNull(issue.priority), sql`${issue.priority} <> ''`)!;
        break;
      case 'type':
        present = isNotNull(issue.typeId);
        break;
      case 'initiative':
        present = isNotNull(issue.initiativeId);
        break;
      case 'cycle':
        present = isNotNull(issue.cycleId);
        break;
      case 'labels':
        present = exists(
          db.select({ one: sql`1` }).from(issueLabel).where(eq(issueLabel.issueId, issue.id)),
        );
        break;
      default:
        present = sql`false`;
    }
    return cond.op === 'is_set' ? present : negateSql(present);
  }

  const parts: SQL[] = [];
  switch (cond.field) {
    case 'status':
      if (numVals.length > 0) parts.push(inArray(issue.columnId, numVals));
      break;
    case 'statusType':
      if (strVals.length > 0) parts.push(inArray(projectColumn.stateType, strVals));
      break;
    case 'assignee':
      if (hasNull) parts.push(isNull(issue.assigneeUserId));
      if (strVals.length > 0) parts.push(inArray(issue.assigneeUserId, strVals));
      break;
    case 'delegate':
      if (hasNull) parts.push(isNull(issue.delegateUserId));
      if (strVals.length > 0) parts.push(inArray(issue.delegateUserId, strVals));
      break;
    case 'priority':
      if (hasNull) parts.push(isNull(issue.priority));
      if (strVals.length > 0) parts.push(inArray(issue.priority, strVals));
      break;
    case 'type':
      if (hasNull) parts.push(isNull(issue.typeId));
      if (numVals.length > 0) parts.push(inArray(issue.typeId, numVals));
      break;
    case 'initiative': {
      if (hasNull) parts.push(isNull(issue.initiativeId));
      const idVals = numVals;
      const statuses = strVals
        .filter((s) => s.startsWith('status:'))
        .map((s) => s.slice(7));
      if (idVals.length > 0) parts.push(inArray(issue.initiativeId, idVals));
      if (statuses.length > 0) {
        parts.push(and(isNotNull(issue.initiativeId), inArray(initiative.status, statuses))!);
      }
      break;
    }
    case 'cycle': {
      if (hasNull) parts.push(isNull(issue.cycleId));
      const idVals = numVals;
      const statuses = strVals
        .filter((s) => s.startsWith('status:'))
        .map((s) => s.slice(7));
      if (idVals.length > 0) parts.push(inArray(issue.cycleId, idVals));
      for (const st of statuses) {
        parts.push(and(isNotNull(issue.cycleId), cycleStatusSql(st))!);
      }
      break;
    }
    case 'labels':
      if (hasNull) {
        parts.push(
          notExists(
            db.select({ one: sql`1` }).from(issueLabel).where(eq(issueLabel.issueId, issue.id)),
          ),
        );
      }
      if (numVals.length > 0) {
        parts.push(
          exists(
            db
              .select({ one: sql`1` })
              .from(issueLabel)
              .where(
                and(eq(issueLabel.issueId, issue.id), inArray(issueLabel.labelId, numVals)),
              ),
          ),
        );
      }
      break;
    default:
      break;
  }

  const pos = combineDisjunction(parts);
  return cond.op === 'is' ? pos : negateSql(pos);
}

export function buildStatFilterPredicate(projectId: number, filters: StatFilterSet): SQL {
  const conds: SQL[] = [eq(issue.projectId, projectId), isNull(issue.archivedAt)];
  for (const cond of (filters.conditions ?? []).filter(isEffectiveStatCondition)) {
    if (cond.field.startsWith('cf:')) {
      conds.push(customFieldConditionSql(Number(cond.field.slice(3)), cond));
    } else if (
      cond.field === 'dueDate' ||
      cond.field === 'startDate' ||
      cond.field === 'created' ||
      cond.field === 'updated'
    ) {
      conds.push(dateFieldConditionSql(cond.field, cond));
    } else {
      conds.push(setFieldConditionSql(cond));
    }
  }
  return and(...conds)!;
}

export async function countIssuesByFilterSet(
  projectId: number,
  filters: StatFilterSet,
): Promise<number> {
  const key = `${projectId}:${JSON.stringify(filters)}`;
  return withAnalyticsCache(statCountCache, key, async () => {
    const predicate = buildStatFilterPredicate(projectId, filters);
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(issue)
      .innerJoin(projectColumn, eq(projectColumn.id, issue.columnId))
      .leftJoin(initiative, eq(initiative.id, issue.initiativeId))
      .leftJoin(cycle, eq(cycle.id, issue.cycleId))
      .where(predicate);
    return Number(row?.count ?? 0);
  });
}
