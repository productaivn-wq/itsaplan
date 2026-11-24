import { t } from 'elysia';

export const PortfolioUpdateKindDto = t.Union([
  t.Literal('issue'),
  t.Literal('document'),
  t.Literal('agent_run'),
  t.Literal('metric'),
]);

export const PortfolioUpdateItemDto = t.Object({
  id: t.String(),
  kind: PortfolioUpdateKindDto,
  projectId: t.Integer(),
  projectKey: t.String(),
  projectName: t.String(),
  projectRef: t.String(),
  title: t.String(),
  summary: t.String(),
  actorName: t.Nullable(t.String()),
  status: t.Nullable(t.String()),
  entityId: t.Integer(),
  issueSeq: t.Nullable(t.Integer()),
  createdAt: t.String(),
});

export const PortfolioUpdatesResponse = t.Object({
  items: t.Array(PortfolioUpdateItemDto),
  counts: t.Object({
    issue: t.Integer(),
    document: t.Integer(),
    agent_run: t.Integer(),
    metric: t.Integer(),
    total: t.Integer(),
  }),
  projectCounts: t.Record(t.String(), t.Integer()),
  coveredProjectsCount: t.Integer(),
  totalProjectsCount: t.Integer(),
  days: t.Integer(),
});

export const PortfolioApprovalItemDto = t.Object({
  id: t.String(),
  teamId: t.Integer(),
  projectId: t.Integer(),
  projectKey: t.String(),
  projectName: t.String(),
  projectRef: t.String(),
  agentId: t.Integer(),
  threadId: t.Nullable(t.String()),
  toolCallId: t.String(),
  toolName: t.String(),
  kind: t.String(),
  payload: t.Record(t.String(), t.Unknown()),
  requestedByUserId: t.Nullable(t.String()),
  decidedByUserId: t.Nullable(t.String()),
  requireSod: t.Boolean(),
  status: t.String(),
  decisionNote: t.Nullable(t.String()),
  createdAt: t.String(),
  decidedAt: t.Nullable(t.String()),
});

export const portfolioDirectoryQuery = t.Object({
  projectKey: t.Optional(t.String()),
});

export const portfolioUpdatesQuery = t.Object({
  projectKey: t.Optional(t.String()),
  days: t.Optional(t.String()),
  perProject: t.Optional(t.String()),
  limit: t.Optional(t.String()),
  kinds: t.Optional(t.String()),
});

export const portfolioApprovalsQuery = t.Object({
  status: t.Optional(
    t.Union([
      t.Literal('pending'),
      t.Literal('approved'),
      t.Literal('rejected'),
      t.Literal('expired'),
    ]),
  ),
});
