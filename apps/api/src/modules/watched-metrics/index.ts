import { Elysia, t } from 'elysia';
import { authContext } from '#shared/auth-context';
import { requireUser } from '#shared/access';
import { guards, entityGuard } from '#shared/guards';
import { noContent } from '#shared/http';
import { HttpError } from '#shared/lib';
import { mcpTool } from '#mcp/generate';
import { accessErrors, commonErrors } from '#shared/responses';
import {
  WatchedMetricDto,
  WatchedMetricSampleDto,
  WatchedMetricSampleListResponse,
  WatchedMetricsListResponse,
  createWatchedMetricBody,
  ingestWatchedMetricsBody,
  listWatchedMetricsQuery,
  recordSampleBody,
  samplesQuery,
  updateWatchedMetricBody,
  watchedMetricParams,
} from './model';
import {
  bootstrapWatchedMetrics,
  createWatchedMetric,
  deleteWatchedMetric,
  getWatchedMetric,
  ingestWatchedMetrics,
  listWatchedMetricSamples,
  listWatchedMetrics,
  recordWatchedMetricSample,
  updateWatchedMetric,
} from './service';

export const watchedMetricRoutes = new Elysia({
  name: 'watched-metrics',
  detail: { tags: ['Watched Metrics'] },
})
  .use(authContext)
  .use(guards)
  .macro({
    watchedMetric: entityGuard(
      'dashboards',
      'Watched metric not found',
      async (p) => (await getWatchedMetric(Number(p.metricId)))?.projectId ?? null,
      'dashboards',
    ),
  })
  .get(
    '/projects/:projectKey/watched-metrics',
    async ({ project, query }) => {
      return listWatchedMetrics(project.id, {
        category: query.category,
        status: query.status,
        pinnedOnly: query.pinnedOnly === 'true' ? true : undefined,
      });
    },
    {
      query: listWatchedMetricsQuery,
      permission: ['dashboards', 'read'],
      feature: 'dashboards',
      response: { 200: WatchedMetricsListResponse, ...accessErrors },
      detail: {
        summary: "List a project's watched metrics",
        description:
          'Returns watched KPIs for the project with live Postgres evaluations, health status, and trend sparklines.',
        ...mcpTool('list_watched_metrics'),
      },
    },
  )
  .post(
    '/projects/:projectKey/watched-metrics',
    async ({ project, body, user, set }) => {
      set.status = 201;
      const caller = requireUser(user);
      return createWatchedMetric(project.id, caller.id, body);
    },
    {
      body: createWatchedMetricBody,
      permission: ['dashboards', 'create'],
      feature: 'dashboards',
      response: { 201: WatchedMetricDto, ...commonErrors },
      detail: {
        summary: 'Create a watched metric',
        ...mcpTool('create_watched_metric'),
      },
    },
  )
  .post(
    '/projects/:projectKey/watched-metrics/bootstrap',
    async ({ project, user }) => {
      const caller = requireUser(user);
      return bootstrapWatchedMetrics(project.id, caller.id);
    },
    {
      permission: ['dashboards', 'create'],
      feature: 'dashboards',
      response: {
        200: t.Object({ created: t.Number(), items: t.Array(WatchedMetricDto) }),
        ...accessErrors,
      },
      detail: {
        summary: 'Materialize starter watched metrics for a project',
        ...mcpTool('bootstrap_watched_metrics'),
      },
    },
  )
  .post(
    '/projects/:projectKey/watched-metrics/ingest',
    async ({ project, body, user }) => {
      const caller = requireUser(user);
      return ingestWatchedMetrics(
        project.id,
        caller.id,
        body.items,
        body.recordSample ?? true,
      );
    },
    {
      body: ingestWatchedMetricsBody,
      permission: ['dashboards', 'edit'],
      feature: 'dashboards',
      response: {
        200: t.Object({ upserted: t.Number(), samplesRecorded: t.Number() }),
        ...commonErrors,
      },
      detail: {
        summary: 'Upsert watched metrics and readings in bulk',
        ...mcpTool('ingest_watched_metrics'),
      },
    },
  )
  .patch(
    '/watched-metrics/:metricId',
    async ({ params, body }) => {
      const updated = await updateWatchedMetric(params.metricId, body);
      if (!updated) throw new HttpError(404, 'Watched metric not found');
      return updated;
    },
    {
      params: watchedMetricParams,
      body: updateWatchedMetricBody,
      watchedMetric: 'edit',
      response: { 200: WatchedMetricDto, ...commonErrors },
      detail: {
        summary: 'Update a watched metric',
        ...mcpTool('update_watched_metric'),
      },
    },
  )
  .delete(
    '/watched-metrics/:metricId',
    async ({ params }) => {
      await deleteWatchedMetric(params.metricId);
      return noContent();
    },
    {
      params: watchedMetricParams,
      watchedMetric: 'delete',
      response: { 204: t.Void(), ...commonErrors },
      detail: {
        summary: 'Delete a watched metric',
        ...mcpTool('delete_watched_metric'),
      },
    },
  )
  .post(
    '/watched-metrics/:metricId/samples',
    async ({ params, body, user, set }) => {
      set.status = 201;
      const caller = requireUser(user);
      return recordWatchedMetricSample(params.metricId, caller.id, body);
    },
    {
      params: watchedMetricParams,
      body: recordSampleBody,
      watchedMetric: 'edit',
      response: {
        201: t.Object({ metric: WatchedMetricDto, sample: WatchedMetricSampleDto }),
        ...commonErrors,
      },
      detail: {
        summary: 'Record a new reading for a watched metric',
        ...mcpTool('record_watched_metric_sample'),
      },
    },
  )
  .get(
    '/watched-metrics/:metricId/samples',
    async ({ params, query }) => {
      const items = await listWatchedMetricSamples(params.metricId, query.limit ?? 30);
      return { items };
    },
    {
      params: watchedMetricParams,
      query: samplesQuery,
      watchedMetric: 'read',
      response: { 200: WatchedMetricSampleListResponse, ...commonErrors },
      detail: {
        summary: 'List historical readings for a watched metric',
        ...mcpTool('list_watched_metric_samples'),
      },
    },
  );
