import { Elysia, t } from 'elysia';
import { noContent } from '#shared/http';
import { guards } from '#shared/guards';
import { authContext } from '#shared/auth-context';
import { HttpError } from '#shared/lib';
import { accessErrors, commonErrors } from '#shared/responses';
import { teamParams } from '#modules/teams/model';
import {
  listTeamMcpConnections,
  createMcpConnection,
  updateMcpConnection,
  deleteMcpConnection,
  listAgentMcpLinks,
  setAgentMcpLinks,
} from './service';

const connectionParams = t.Object({
  teamId: t.Numeric(),
  connectionId: t.Numeric(),
});

const agentMcpParams = t.Object({
  teamId: t.Numeric(),
  agentId: t.Numeric(),
});

const transportSchema = t.Union([t.Literal('streamable-http'), t.Literal('sse')]);

const McpConnectionDto = t.Object({
  id: t.Integer(),
  teamId: t.Integer(),
  name: t.String(),
  transport: transportSchema,
  endpointUrl: t.String(),
  hasHeaders: t.Boolean(),
  enabled: t.Boolean(),
  allowedTools: t.Array(t.String()),
  createdBy: t.Nullable(t.String()),
  createdAt: t.String(),
  updatedAt: t.String(),
});

const AgentMcpLinkDto = t.Object({
  agentId: t.Integer(),
  connectionId: t.Integer(),
  connectionName: t.String(),
  endpointUrl: t.String(),
  transport: transportSchema,
  connectionEnabled: t.Boolean(),
  enabledTools: t.Array(t.String()),
});

const createConnectionBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 80 }),
  transport: t.Optional(transportSchema),
  endpointUrl: t.String({ minLength: 8, maxLength: 500 }),
  headers: t.Optional(t.Record(t.String(), t.String())),
  enabled: t.Optional(t.Boolean()),
  allowedTools: t.Optional(t.Array(t.String())),
});

const updateConnectionBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 80 })),
  transport: t.Optional(transportSchema),
  endpointUrl: t.Optional(t.String({ minLength: 8, maxLength: 500 })),
  headers: t.Optional(t.Nullable(t.Record(t.String(), t.String()))),
  enabled: t.Optional(t.Boolean()),
  allowedTools: t.Optional(t.Array(t.String())),
});

const setAgentMcpLinksBody = t.Object({
  links: t.Array(
    t.Object({
      connectionId: t.Integer({ minimum: 1 }),
      enabledTools: t.Optional(t.Array(t.String())),
    }),
  ),
});

export const mcpClientRoutes = new Elysia({
  name: 'mcp-client',
  detail: { tags: ['MCP Connections'] },
})
  .use(authContext)
  .use(guards)
  .get(
    '/teams/:teamId/mcp-connections',
    ({ membership }) => listTeamMcpConnections(membership.teamId),
    {
      params: teamParams,
      teamPermission: ['ai_agents', 'read'],
      response: { 200: t.Array(McpConnectionDto), ...accessErrors },
      detail: { summary: 'List outbound MCP server connections' },
    },
  )
  .post(
    '/teams/:teamId/mcp-connections',
    async ({ membership, body, set }) => {
      set.status = 201;
      return createMcpConnection(membership.teamId, membership.userId, body);
    },
    {
      params: teamParams,
      body: createConnectionBody,
      teamPermission: ['ai_agents', 'create'],
      response: { 201: McpConnectionDto, ...commonErrors },
      detail: { summary: 'Register SSRF-guarded outbound MCP server' },
    },
  )
  .patch(
    '/teams/:teamId/mcp-connections/:connectionId',
    async ({ params, membership, body }) => {
      const updated = await updateMcpConnection(
        membership.teamId,
        params.connectionId,
        body,
      );
      if (!updated) throw new HttpError(404, 'MCP connection not found');
      return updated;
    },
    {
      params: connectionParams,
      body: updateConnectionBody,
      teamPermission: ['ai_agents', 'edit'],
      response: { 200: McpConnectionDto, ...commonErrors },
      detail: { summary: 'Update outbound MCP server connection' },
    },
  )
  .delete(
    '/teams/:teamId/mcp-connections/:connectionId',
    async ({ params, membership }) => {
      const deleted = await deleteMcpConnection(membership.teamId, params.connectionId);
      if (!deleted) throw new HttpError(404, 'MCP connection not found');
      return noContent();
    },
    {
      params: connectionParams,
      teamPermission: ['ai_agents', 'delete'],
      response: { 204: t.Void(), ...accessErrors },
      detail: { summary: 'Delete outbound MCP server connection' },
    },
  )
  .get(
    '/teams/:teamId/ai-agents/:agentId/mcp-links',
    ({ params, membership }) => listAgentMcpLinks(membership.teamId, params.agentId),
    {
      params: agentMcpParams,
      teamPermission: ['ai_agents', 'read'],
      response: { 200: t.Array(AgentMcpLinkDto), ...commonErrors },
      detail: { summary: 'List outbound MCP connections bound to agent' },
    },
  )
  .put(
    '/teams/:teamId/ai-agents/:agentId/mcp-links',
    ({ params, membership, body }) =>
      setAgentMcpLinks(membership.teamId, params.agentId, body.links),
    {
      params: agentMcpParams,
      body: setAgentMcpLinksBody,
      teamPermission: ['ai_agents', 'edit'],
      response: { 200: t.Array(AgentMcpLinkDto), ...commonErrors },
      detail: { summary: 'Bind outbound MCP connections to agent' },
    },
  );
