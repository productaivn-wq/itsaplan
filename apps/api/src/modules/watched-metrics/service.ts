import {
  db,
  issue,
  projectColumn,
  projectWatchedMetric,
  projectWatchedMetricSample,
} from '@repo/db';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { HttpError, iso, rethrowDuplicate } from '#shared/lib';
import {
  countIssuesByFilterSet,
  getAgentRunStats,
  getStats,
  getWebhookStats,
  type StatFilterSet,
  type StatsDto,
} from '#modules/analytics/service';
import {
  computeTrend,
  evaluateMetricStatus,
  isLiveSourceType,
  slugifyMetricName,
  type MetricOperator,
  type MetricSourceType,
  type WatchedMetricStatus,
} from './evaluator';

export interface WatchedMetricRowDto {
  id: number;
  projectId: number;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  sourceType: MetricSourceType;
  sourceConfig: Record<string, unknown>;
  unit: string;
  operator: MetricOperator;
  targetValue: number;
  warnThreshold: number | null;
  critThreshold: number | null;
  currentValue: number | null;
  previousValue: number | null;
  delta: number | null;
  sparkline: number[];
  status: WatchedMetricStatus;
  lastRecordedAt: string | null;
  pinnedToOverview: boolean;
  position: number;
  externalKey: string | null;
  isVirtual: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WatchedMetricsSummary {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  noData: number;
  pinnedCount: number;
}

export interface WatchedMetricSampleRowDto {
  id: number;
  metricId: number;
  projectId: number;
  value: number;
  status: WatchedMetricStatus;
  note: string | null;
  recordedByUserId: string | null;
  recordedAt: string;
}

export interface WatchedMetricWriteInput {
  slug?: string;
  name: string;
  description?: string | null;
  category?: string;
  sourceType: MetricSourceType;
  sourceConfig?: Record<string, unknown>;
  unit?: string;
  operator: MetricOperator;
  targetValue: number;
  warnThreshold?: number | null;
  critThreshold?: number | null;
  currentValue?: number | null;
  pinnedToOverview?: boolean;
  position?: number;
  externalKey?: string | null;
}

interface StarterMetricSpec {
  slug: string;
  name: string;
  description: string;
  category: string;
  sourceType: MetricSourceType;
  sourceConfig: Record<string, unknown>;
  unit: string;
  operator: MetricOperator;
  targetValue: number;
  warnThreshold: number | null;
  critThreshold: number | null;
  pinnedToOverview: boolean;
  position: number;
}

export const STARTER_WATCHED_METRICS: readonly StarterMetricSpec[] = [
  {
    slug: 'overdue-issues',
    name: 'Overdue Issues',
    description: 'Open work items past their due date.',
    category: 'delivery',
    sourceType: 'live_stat',
    sourceConfig: { statKey: 'overdue' },
    unit: 'issues',
    operator: '<=',
    targetValue: 0,
    warnThreshold: 0,
    critThreshold: 5,
    pinnedToOverview: true,
    position: 0,
  },
  {
    slug: 'completion-rate',
    name: 'Completion Rate',
    description: 'Percentage of non-canceled issues in a completed state.',
    category: 'delivery',
    sourceType: 'live_completion_rate',
    sourceConfig: {},
    unit: '%',
    operator: '>=',
    targetValue: 80,
    warnThreshold: 80,
    critThreshold: 50,
    pinnedToOverview: true,
    position: 1,
  },
  {
    slug: 'unassigned-active',
    name: 'Unassigned Active Issues',
    description: 'Active non-terminal issues without an owner.',
    category: 'delivery',
    sourceType: 'live_stat',
    sourceConfig: { statKey: 'unassigned' },
    unit: 'issues',
    operator: '<=',
    targetValue: 5,
    warnThreshold: 5,
    critThreshold: 20,
    pinnedToOverview: true,
    position: 2,
  },
  {
    slug: 'agent-success-rate',
    name: 'Agent Run Success Rate (30d)',
    description: 'Share of completed AI agent runs that succeeded over the last 30 days.',
    category: 'agents',
    sourceType: 'live_agent_health',
    sourceConfig: { days: 30 },
    unit: '%',
    operator: '>=',
    targetValue: 95,
    warnThreshold: 95,
    critThreshold: 80,
    pinnedToOverview: true,
    position: 3,
  },
];

interface LiveEvalCache {
  stats?: Promise<StatsDto>;
  completionRate?: Promise<number | null>;
  agentHealth: Map<number, Promise<number | null>>;
  webhookHealth: Map<number, Promise<number | null>>;
}

function createEvalCache(): LiveEvalCache {
  return { agentHealth: new Map(), webhookHealth: new Map() };
}

export async function getCompletionRate(projectId: number): Promise<number | null> {
  const rows = await db
    .select({ stateType: projectColumn.stateType, count: sql<number>`count(*)::int` })
    .from(issue)
    .innerJoin(projectColumn, eq(projectColumn.id, issue.columnId))
    .where(and(eq(issue.projectId, projectId), isNull(issue.archivedAt)))
    .groupBy(projectColumn.stateType);

  let open = 0;
  let completed = 0;
  for (const row of rows) {
    if (row.stateType === 'completed') completed += row.count;
    else if (row.stateType !== 'canceled') open += row.count;
  }
  const denom = open + completed;
  if (denom === 0) return null;
  return Math.round((completed / denom) * 1000) / 10;
}

function clampDays(raw: unknown, fallback = 30): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(365, Math.max(1, Math.round(n)));
}

function parseFilterSet(raw: unknown): StatFilterSet {
  if (raw && typeof raw === 'object' && Array.isArray((raw as StatFilterSet).conditions)) {
    return raw as StatFilterSet;
  }
  return { conditions: [] };
}

async function evaluateLiveValue(
  projectId: number,
  sourceType: MetricSourceType,
  sourceConfig: Record<string, unknown>,
  cache: LiveEvalCache,
): Promise<number | null> {
  switch (sourceType) {
    case 'live_stat': {
      if (!cache.stats) cache.stats = getStats(projectId);
      const stats = await cache.stats;
      const key = String(sourceConfig.statKey ?? 'open') as keyof StatsDto;
      const val = stats[key];
      return typeof val === 'number' && Number.isFinite(val) ? val : null;
    }
    case 'live_completion_rate': {
      if (!cache.completionRate) cache.completionRate = getCompletionRate(projectId);
      return cache.completionRate;
    }
    case 'live_filter': {
      const filters = parseFilterSet(sourceConfig.filters);
      return countIssuesByFilterSet(projectId, filters);
    }
    case 'live_agent_health': {
      const days = clampDays(sourceConfig.days, 30);
      let pending = cache.agentHealth.get(days);
      if (!pending) {
        pending = getAgentRunStats(projectId, days).then((res) => {
          const settled = res.success + res.failed;
          if (settled === 0) return null;
          return Math.round((res.success / settled) * 1000) / 10;
        });
        cache.agentHealth.set(days, pending);
      }
      return pending;
    }
    case 'live_webhook_health': {
      const days = clampDays(sourceConfig.days, 30);
      let pending = cache.webhookHealth.get(days);
      if (!pending) {
        pending = getWebhookStats(projectId, days).then((res) => {
          const settled = res.success + res.failed;
          if (settled === 0) return null;
          return Math.round((res.success / settled) * 1000) / 10;
        });
        cache.webhookHealth.set(days, pending);
      }
      return pending;
    }
    default:
      return null;
  }
}

async function hydrateMetricDto(
  row: {
    id: number;
    projectId: number;
    slug: string;
    name: string;
    description: string | null;
    category: string;
    sourceType: string;
    sourceConfig: Record<string, unknown>;
    unit: string;
    operator: string;
    targetValue: number;
    warnThreshold: number | null;
    critThreshold: number | null;
    currentValue: number | null;
    lastRecordedAt: Date | null;
    pinnedToOverview: boolean;
    position: number;
    externalKey: string | null;
    createdAt: Date;
    updatedAt: Date;
    isVirtual: boolean;
  },
  samplesDesc: readonly { value: number }[],
  cache: LiveEvalCache,
): Promise<WatchedMetricRowDto> {
  const sourceType = row.sourceType as MetricSourceType;
  const operator = row.operator as MetricOperator;
  const live = isLiveSourceType(sourceType);
  const currentValue = live
    ? await evaluateLiveValue(row.projectId, sourceType, row.sourceConfig ?? {}, cache)
    : row.currentValue;
  const lastRecordedAt = live ? new Date().toISOString() : row.lastRecordedAt ? iso(row.lastRecordedAt) : null;
  const status = evaluateMetricStatus(
    currentValue,
    operator,
    row.targetValue,
    row.warnThreshold,
    row.critThreshold,
  );
  const chronological = [...samplesDesc].reverse();
  const trend = computeTrend(chronological, currentValue);

  return {
    id: row.id,
    projectId: row.projectId,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    sourceType,
    sourceConfig: row.sourceConfig ?? {},
    unit: row.unit,
    operator,
    targetValue: row.targetValue,
    warnThreshold: row.warnThreshold,
    critThreshold: row.critThreshold,
    currentValue,
    previousValue: trend.previousValue,
    delta: trend.delta,
    sparkline: trend.sparkline,
    status,
    lastRecordedAt,
    pinnedToOverview: row.pinnedToOverview,
    position: row.position,
    externalKey: row.externalKey,
    isVirtual: row.isVirtual,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function summarizeMetrics(items: readonly WatchedMetricRowDto[]): WatchedMetricsSummary {
  const summary: WatchedMetricsSummary = {
    total: items.length,
    healthy: 0,
    warning: 0,
    critical: 0,
    noData: 0,
    pinnedCount: 0,
  };
  for (const item of items) {
    if (item.pinnedToOverview) summary.pinnedCount += 1;
    if (item.status === 'healthy') summary.healthy += 1;
    else if (item.status === 'warning') summary.warning += 1;
    else if (item.status === 'critical') summary.critical += 1;
    else summary.noData += 1;
  }
  return summary;
}

export async function listWatchedMetrics(
  projectId: number,
  filters?: { category?: string; status?: WatchedMetricStatus; pinnedOnly?: boolean },
): Promise<{
  items: WatchedMetricRowDto[];
  summary: WatchedMetricsSummary;
  isStarterPreview: boolean;
}> {
  const rows = await db
    .select()
    .from(projectWatchedMetric)
    .where(eq(projectWatchedMetric.projectId, projectId))
    .orderBy(projectWatchedMetric.position, projectWatchedMetric.id);

  const cache = createEvalCache();
  let allItems: WatchedMetricRowDto[];
  let isStarterPreview = false;

  if (rows.length === 0) {
    isStarterPreview = true;
    const now = new Date();
    allItems = await Promise.all(
      STARTER_WATCHED_METRICS.map((spec, idx) =>
        hydrateMetricDto(
          {
            id: -(idx + 1),
            projectId,
            slug: spec.slug,
            name: spec.name,
            description: spec.description,
            category: spec.category,
            sourceType: spec.sourceType,
            sourceConfig: spec.sourceConfig,
            unit: spec.unit,
            operator: spec.operator,
            targetValue: spec.targetValue,
            warnThreshold: spec.warnThreshold,
            critThreshold: spec.critThreshold,
            currentValue: null,
            lastRecordedAt: null,
            pinnedToOverview: spec.pinnedToOverview,
            position: spec.position,
            externalKey: null,
            createdAt: now,
            updatedAt: now,
            isVirtual: true,
          },
          [],
          cache,
        ),
      ),
    );
  } else {
    const metricIds = rows.map((r) => r.id);
    const sampleRows = await db
      .select({
        metricId: projectWatchedMetricSample.metricId,
        value: projectWatchedMetricSample.value,
      })
      .from(projectWatchedMetricSample)
      .where(inArray(projectWatchedMetricSample.metricId, metricIds))
      .orderBy(desc(projectWatchedMetricSample.recordedAt), desc(projectWatchedMetricSample.id))
      .limit(Math.max(metricIds.length * 12, 120));

    const samplesByMetric = new Map<number, { value: number }[]>();
    for (const sample of sampleRows) {
      const bucket = samplesByMetric.get(sample.metricId);
      if (!bucket) {
        samplesByMetric.set(sample.metricId, [{ value: sample.value }]);
      } else if (bucket.length < 12) {
        bucket.push({ value: sample.value });
      }
    }

    allItems = await Promise.all(
      rows.map((row) =>
        hydrateMetricDto(
          { ...row, isVirtual: false },
          samplesByMetric.get(row.id) ?? [],
          cache,
        ),
      ),
    );
  }

  const summary = summarizeMetrics(allItems);
  let filtered = allItems;
  if (filters?.category) {
    const cat = filters.category.trim().toLowerCase();
    filtered = filtered.filter((m) => m.category.toLowerCase() === cat);
  }
  if (filters?.status) {
    filtered = filtered.filter((m) => m.status === filters.status);
  }
  if (filters?.pinnedOnly) {
    filtered = filtered.filter((m) => m.pinnedToOverview);
  }

  return { items: filtered, summary, isStarterPreview };
}

export async function getWatchedMetric(metricId: number) {
  const [row] = await db
    .select()
    .from(projectWatchedMetric)
    .where(eq(projectWatchedMetric.id, metricId));
  return row ?? null;
}

export async function hydrateSingleMetric(
  row: typeof projectWatchedMetric.$inferSelect,
): Promise<WatchedMetricRowDto> {
  const sampleRows = await db
    .select({ value: projectWatchedMetricSample.value })
    .from(projectWatchedMetricSample)
    .where(eq(projectWatchedMetricSample.metricId, row.id))
    .orderBy(desc(projectWatchedMetricSample.recordedAt), desc(projectWatchedMetricSample.id))
    .limit(12);
  return hydrateMetricDto({ ...row, isVirtual: false }, sampleRows, createEvalCache());
}

export async function createWatchedMetric(
  projectId: number,
  userId: string | null,
  input: WatchedMetricWriteInput,
): Promise<WatchedMetricRowDto> {
  const slug = slugifyMetricName(input.slug || input.name);
  const [{ nextPos }] = await db
    .select({ nextPos: sql<number>`COALESCE(MAX(${projectWatchedMetric.position}) + 1, 0)` })
    .from(projectWatchedMetric)
    .where(eq(projectWatchedMetric.projectId, projectId));

  const hasInitialValue =
    !isLiveSourceType(input.sourceType) &&
    input.currentValue != null &&
    Number.isFinite(input.currentValue);
  const now = new Date();

  try {
    const inserted = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(projectWatchedMetric)
        .values({
          projectId,
          slug,
          name: input.name.trim(),
          description: input.description ?? null,
          category: (input.category ?? 'delivery').trim() || 'delivery',
          sourceType: input.sourceType,
          sourceConfig: input.sourceConfig ?? {},
          unit: input.unit ?? '',
          operator: input.operator,
          targetValue: input.targetValue,
          warnThreshold: input.warnThreshold ?? null,
          critThreshold: input.critThreshold ?? null,
          currentValue: hasInitialValue ? input.currentValue! : null,
          lastRecordedAt: hasInitialValue ? now : null,
          pinnedToOverview: input.pinnedToOverview ?? true,
          position: input.position ?? Number(nextPos),
          externalKey: input.externalKey ?? null,
          createdByUserId: userId,
        })
        .returning();

      if (row && hasInitialValue) {
        const status = evaluateMetricStatus(
          input.currentValue!,
          input.operator,
          input.targetValue,
          input.warnThreshold ?? null,
          input.critThreshold ?? null,
        );
        await tx.insert(projectWatchedMetricSample).values({
          metricId: row.id,
          projectId,
          value: input.currentValue!,
          status,
          note: 'Initial reading',
          recordedByUserId: userId,
          recordedAt: now,
        });
      }
      return row!;
    });

    return hydrateSingleMetric(inserted);
  } catch (err) {
    rethrowDuplicate(err, 'watched metric');
  }
}

export async function bootstrapWatchedMetrics(
  projectId: number,
  userId: string | null,
): Promise<{ created: number; items: WatchedMetricRowDto[] }> {
  let created = 0;
  for (const spec of STARTER_WATCHED_METRICS) {
    const rows = await db
      .insert(projectWatchedMetric)
      .values({
        projectId,
        slug: spec.slug,
        name: spec.name,
        description: spec.description,
        category: spec.category,
        sourceType: spec.sourceType,
        sourceConfig: spec.sourceConfig,
        unit: spec.unit,
        operator: spec.operator,
        targetValue: spec.targetValue,
        warnThreshold: spec.warnThreshold,
        critThreshold: spec.critThreshold,
        pinnedToOverview: spec.pinnedToOverview,
        position: spec.position,
        createdByUserId: userId,
      })
      .onConflictDoNothing({
        target: [projectWatchedMetric.projectId, projectWatchedMetric.slug],
      })
      .returning({ id: projectWatchedMetric.id });
    if (rows.length > 0) created += 1;
  }
  const listed = await listWatchedMetrics(projectId);
  return { created, items: listed.items };
}

export async function ingestWatchedMetrics(
  projectId: number,
  userId: string | null,
  items: readonly WatchedMetricWriteInput[],
  recordSample = true,
): Promise<{ upserted: number; samplesRecorded: number }> {
  let upserted = 0;
  let samplesRecorded = 0;
  const now = new Date();

  await db.transaction(async (tx) => {
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx]!;
      const slug = slugifyMetricName(item.slug || item.name);
      const existing = await tx
        .select({
          id: projectWatchedMetric.id,
          currentValue: projectWatchedMetric.currentValue,
        })
        .from(projectWatchedMetric)
        .where(
          and(
            eq(projectWatchedMetric.projectId, projectId),
            eq(projectWatchedMetric.slug, slug),
          ),
        );

      const prevValue = existing[0]?.currentValue ?? null;
      const incomingValue =
        item.currentValue != null && Number.isFinite(item.currentValue)
          ? item.currentValue
          : null;

      const [saved] = await tx
        .insert(projectWatchedMetric)
        .values({
          projectId,
          slug,
          name: item.name.trim(),
          description: item.description ?? null,
          category: (item.category ?? 'delivery').trim() || 'delivery',
          sourceType: item.sourceType,
          sourceConfig: item.sourceConfig ?? {},
          unit: item.unit ?? '',
          operator: item.operator,
          targetValue: item.targetValue,
          warnThreshold: item.warnThreshold ?? null,
          critThreshold: item.critThreshold ?? null,
          currentValue: incomingValue,
          lastRecordedAt: incomingValue != null ? now : null,
          pinnedToOverview: item.pinnedToOverview ?? true,
          position: item.position ?? idx,
          externalKey: item.externalKey ?? null,
          createdByUserId: userId,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [projectWatchedMetric.projectId, projectWatchedMetric.slug],
          set: {
            name: item.name.trim(),
            description: item.description ?? null,
            category: (item.category ?? 'delivery').trim() || 'delivery',
            sourceType: item.sourceType,
            sourceConfig: item.sourceConfig ?? {},
            unit: item.unit ?? '',
            operator: item.operator,
            targetValue: item.targetValue,
            warnThreshold: item.warnThreshold ?? null,
            critThreshold: item.critThreshold ?? null,
            currentValue: incomingValue,
            lastRecordedAt: incomingValue != null ? now : undefined,
            pinnedToOverview: item.pinnedToOverview ?? true,
            position: item.position ?? idx,
            externalKey: item.externalKey ?? null,
            updatedAt: now,
          },
        })
        .returning({ id: projectWatchedMetric.id });

      if (saved) upserted += 1;

      const valueChanged =
        incomingValue != null &&
        (prevValue == null || Math.abs(prevValue - incomingValue) > 1e-9);
      if (saved && recordSample && incomingValue != null && (existing.length === 0 || valueChanged)) {
        const status = evaluateMetricStatus(
          incomingValue,
          item.operator,
          item.targetValue,
          item.warnThreshold ?? null,
          item.critThreshold ?? null,
        );
        await tx.insert(projectWatchedMetricSample).values({
          metricId: saved.id,
          projectId,
          value: incomingValue,
          status,
          note: 'Ingested reading',
          recordedByUserId: userId,
          recordedAt: now,
        });
        samplesRecorded += 1;
      }
    }
  });

  return { upserted, samplesRecorded };
}

export async function updateWatchedMetric(
  metricId: number,
  patch: Partial<{
    name: string;
    description: string | null;
    category: string;
    sourceType: MetricSourceType;
    sourceConfig: Record<string, unknown>;
    unit: string;
    operator: MetricOperator;
    targetValue: number;
    warnThreshold: number | null;
    critThreshold: number | null;
    currentValue: number | null;
    pinnedToOverview: boolean;
    position: number;
    externalKey: string | null;
  }>,
): Promise<WatchedMetricRowDto | null> {
  const existing = await getWatchedMetric(metricId);
  if (!existing) return null;

  const set: Partial<typeof projectWatchedMetric.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (patch.name !== undefined) set.name = patch.name.trim();
  if (patch.description !== undefined) set.description = patch.description;
  if (patch.category !== undefined) set.category = patch.category.trim() || 'delivery';
  if (patch.sourceType !== undefined) set.sourceType = patch.sourceType;
  if (patch.sourceConfig !== undefined) set.sourceConfig = patch.sourceConfig;
  if (patch.unit !== undefined) set.unit = patch.unit;
  if (patch.operator !== undefined) set.operator = patch.operator;
  if (patch.targetValue !== undefined) set.targetValue = patch.targetValue;
  if (patch.warnThreshold !== undefined) set.warnThreshold = patch.warnThreshold;
  if (patch.critThreshold !== undefined) set.critThreshold = patch.critThreshold;
  if (patch.currentValue !== undefined) {
    set.currentValue = patch.currentValue;
    if (patch.currentValue != null) set.lastRecordedAt = new Date();
  }
  if (patch.pinnedToOverview !== undefined) set.pinnedToOverview = patch.pinnedToOverview;
  if (patch.position !== undefined) set.position = patch.position;
  if (patch.externalKey !== undefined) set.externalKey = patch.externalKey;

  const [updated] = await db
    .update(projectWatchedMetric)
    .set(set)
    .where(eq(projectWatchedMetric.id, metricId))
    .returning();

  return updated ? hydrateSingleMetric(updated) : null;
}

export async function deleteWatchedMetric(metricId: number): Promise<void> {
  await db.delete(projectWatchedMetric).where(eq(projectWatchedMetric.id, metricId));
}

export async function recordWatchedMetricSample(
  metricId: number,
  userId: string | null,
  input: { value: number; note?: string | null; recordedAt?: string },
): Promise<{ metric: WatchedMetricRowDto; sample: WatchedMetricSampleRowDto }> {
  const existing = await getWatchedMetric(metricId);
  if (!existing) throw new HttpError(404, 'Watched metric not found');

  const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date();
  if (Number.isNaN(recordedAt.getTime())) {
    throw new HttpError(400, 'Invalid recordedAt timestamp');
  }

  const status = evaluateMetricStatus(
    input.value,
    existing.operator as MetricOperator,
    existing.targetValue,
    existing.warnThreshold,
    existing.critThreshold,
  );

  const { updatedMetric, sampleRow } = await db.transaction(async (tx) => {
    const [sampleRow] = await tx
      .insert(projectWatchedMetricSample)
      .values({
        metricId: existing.id,
        projectId: existing.projectId,
        value: input.value,
        status,
        note: input.note ?? null,
        recordedByUserId: userId,
        recordedAt,
      })
      .returning();

    const shouldUpdateCurrent =
      !existing.lastRecordedAt || recordedAt.getTime() >= existing.lastRecordedAt.getTime();
    const [updatedMetric] = shouldUpdateCurrent
      ? await tx
          .update(projectWatchedMetric)
          .set({
            currentValue: input.value,
            lastRecordedAt: recordedAt,
            updatedAt: new Date(),
          })
          .where(eq(projectWatchedMetric.id, existing.id))
          .returning()
      : [existing];

    return { updatedMetric: updatedMetric!, sampleRow: sampleRow! };
  });

  const metric = await hydrateSingleMetric(updatedMetric);
  return {
    metric,
    sample: {
      id: sampleRow.id,
      metricId: sampleRow.metricId,
      projectId: sampleRow.projectId,
      value: sampleRow.value,
      status: sampleRow.status as WatchedMetricStatus,
      note: sampleRow.note,
      recordedByUserId: sampleRow.recordedByUserId,
      recordedAt: iso(sampleRow.recordedAt),
    },
  };
}

export async function listWatchedMetricSamples(
  metricId: number,
  limit = 30,
): Promise<WatchedMetricSampleRowDto[]> {
  const clamped = Math.min(200, Math.max(1, Math.round(limit)));
  const rows = await db
    .select()
    .from(projectWatchedMetricSample)
    .where(eq(projectWatchedMetricSample.metricId, metricId))
    .orderBy(desc(projectWatchedMetricSample.recordedAt), desc(projectWatchedMetricSample.id))
    .limit(clamped);

  return rows.map((r) => ({
    id: r.id,
    metricId: r.metricId,
    projectId: r.projectId,
    value: r.value,
    status: r.status as WatchedMetricStatus,
    note: r.note,
    recordedByUserId: r.recordedByUserId,
    recordedAt: iso(r.recordedAt),
  }));
}
