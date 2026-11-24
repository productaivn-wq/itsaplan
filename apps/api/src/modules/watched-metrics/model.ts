import { t } from 'elysia';

export const MetricOperatorSchema = t.Union([
  t.Literal('>='),
  t.Literal('<='),
  t.Literal('>'),
  t.Literal('<'),
  t.Literal('=='),
]);

export const MetricSourceTypeSchema = t.Union([
  t.Literal('live_stat'),
  t.Literal('live_filter'),
  t.Literal('live_agent_health'),
  t.Literal('live_webhook_health'),
  t.Literal('live_completion_rate'),
  t.Literal('manual'),
  t.Literal('api_push'),
]);

export const WatchedMetricStatusSchema = t.Union([
  t.Literal('healthy'),
  t.Literal('warning'),
  t.Literal('critical'),
  t.Literal('no_data'),
]);

export const WatchedMetricDto = t.Object({
  id: t.Number(),
  projectId: t.Number(),
  slug: t.String(),
  name: t.String(),
  description: t.Nullable(t.String()),
  category: t.String(),
  sourceType: MetricSourceTypeSchema,
  sourceConfig: t.Record(t.String(), t.Unknown()),
  unit: t.String(),
  operator: MetricOperatorSchema,
  targetValue: t.Number(),
  warnThreshold: t.Nullable(t.Number()),
  critThreshold: t.Nullable(t.Number()),
  currentValue: t.Nullable(t.Number()),
  previousValue: t.Nullable(t.Number()),
  delta: t.Nullable(t.Number()),
  sparkline: t.Array(t.Number()),
  status: WatchedMetricStatusSchema,
  lastRecordedAt: t.Nullable(t.String()),
  pinnedToOverview: t.Boolean(),
  position: t.Number(),
  externalKey: t.Nullable(t.String()),
  isVirtual: t.Boolean(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export const WatchedMetricsSummaryDto = t.Object({
  total: t.Number(),
  healthy: t.Number(),
  warning: t.Number(),
  critical: t.Number(),
  noData: t.Number(),
  pinnedCount: t.Number(),
});

export const WatchedMetricsListResponse = t.Object({
  items: t.Array(WatchedMetricDto),
  summary: WatchedMetricsSummaryDto,
  isStarterPreview: t.Boolean(),
});

export const WatchedMetricSampleDto = t.Object({
  id: t.Number(),
  metricId: t.Number(),
  projectId: t.Number(),
  value: t.Number(),
  status: WatchedMetricStatusSchema,
  note: t.Nullable(t.String()),
  recordedByUserId: t.Nullable(t.String()),
  recordedAt: t.String(),
});

export const WatchedMetricSampleListResponse = t.Object({
  items: t.Array(WatchedMetricSampleDto),
});

export const watchedMetricParams = t.Object({
  metricId: t.Numeric(),
});

export const listWatchedMetricsQuery = t.Object({
  category: t.Optional(t.String()),
  status: t.Optional(WatchedMetricStatusSchema),
  pinnedOnly: t.Optional(t.Union([t.Literal('true'), t.Literal('false')])),
});

export const samplesQuery = t.Object({
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 200 })),
});

export const createWatchedMetricBody = t.Object({
  slug: t.Optional(t.String({ minLength: 1, maxLength: 80 })),
  name: t.String({ minLength: 1, maxLength: 160 }),
  description: t.Optional(t.Nullable(t.String({ maxLength: 1000 }))),
  category: t.Optional(t.String({ minLength: 1, maxLength: 60 })),
  sourceType: MetricSourceTypeSchema,
  sourceConfig: t.Optional(t.Record(t.String(), t.Unknown())),
  unit: t.Optional(t.String({ maxLength: 40 })),
  operator: MetricOperatorSchema,
  targetValue: t.Number(),
  warnThreshold: t.Optional(t.Nullable(t.Number())),
  critThreshold: t.Optional(t.Nullable(t.Number())),
  currentValue: t.Optional(t.Nullable(t.Number())),
  pinnedToOverview: t.Optional(t.Boolean()),
  position: t.Optional(t.Number()),
  externalKey: t.Optional(t.Nullable(t.String({ maxLength: 120 }))),
});

export const updateWatchedMetricBody = t.Partial(
  t.Object({
    name: t.String({ minLength: 1, maxLength: 160 }),
    description: t.Nullable(t.String({ maxLength: 1000 })),
    category: t.String({ minLength: 1, maxLength: 60 }),
    sourceType: MetricSourceTypeSchema,
    sourceConfig: t.Record(t.String(), t.Unknown()),
    unit: t.String({ maxLength: 40 }),
    operator: MetricOperatorSchema,
    targetValue: t.Number(),
    warnThreshold: t.Nullable(t.Number()),
    critThreshold: t.Nullable(t.Number()),
    currentValue: t.Nullable(t.Number()),
    pinnedToOverview: t.Boolean(),
    position: t.Number(),
    externalKey: t.Nullable(t.String({ maxLength: 120 })),
  }),
);

export const ingestWatchedMetricsBody = t.Object({
  items: t.Array(createWatchedMetricBody, { minItems: 1, maxItems: 100 }),
  recordSample: t.Optional(t.Boolean()),
});

export const recordSampleBody = t.Object({
  value: t.Number(),
  note: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
  recordedAt: t.Optional(t.String()),
});
