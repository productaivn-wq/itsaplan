import { Elysia, t } from 'elysia';
import { authContext } from '#shared/auth-context';
import { requireUser } from '#shared/access';
import { errors } from '#shared/responses';
import { ProjectDirectoryResponse } from '#modules/directory/model';
import {
  PortfolioApprovalItemDto,
  PortfolioUpdatesResponse,
  portfolioApprovalsQuery,
  portfolioDirectoryQuery,
  portfolioUpdatesQuery,
} from './model';
import {
  getPortfolioApprovals,
  getPortfolioDirectory,
  getPortfolioUpdates,
} from './service';

export const portfolioRoutes = new Elysia({
  name: 'portfolio',
  detail: { tags: ['Portfolio'] },
})
  .use(authContext)
  .get(
    '/portfolio/directory',
    async ({ user, query }) => getPortfolioDirectory(requireUser(user).id, query.projectKey),
    {
      query: portfolioDirectoryQuery,
      response: { 200: ProjectDirectoryResponse, ...errors(401) },
      detail: {
        summary: 'Get portfolio-wide directory (contacts, channels, groups, storing locations)',
      },
    },
  )
  .get(
    '/portfolio/updates',
    async ({ user, query }) => {
      const userId = requireUser(user).id;
      const kinds = query.kinds
        ? new Set(
            query.kinds
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          )
        : undefined;
      return getPortfolioUpdates(userId, {
        projectKey: query.projectKey,
        days: query.days ? Number(query.days) : 7,
        perProject: query.perProject ? Number(query.perProject) : 5,
        limit: query.limit ? Number(query.limit) : 250,
        kinds,
      });
    },
    {
      query: portfolioUpdatesQuery,
      response: { 200: PortfolioUpdatesResponse, ...errors(401) },
      detail: {
        summary: 'List cross-project portfolio updates (issue activity, doc revisions, agent runs, metrics)',
      },
    },
  )
  .get(
    '/portfolio/approvals',
    async ({ user, query }) => ({
      items: await getPortfolioApprovals(requireUser(user).id, query.status ?? 'pending'),
    }),
    {
      query: portfolioApprovalsQuery,
      response: { 200: t.Object({ items: t.Array(PortfolioApprovalItemDto) }), ...errors(401) },
      detail: {
        summary: 'List pending HITL agent approval requests across all accessible projects',
      },
    },
  );
