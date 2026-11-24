import { Elysia, t } from 'elysia';
import { db, teamBudgetPolicy, userWorkspaceState } from '@repo/db';
import { and, eq, sql } from 'drizzle-orm';
import { guards } from '#shared/guards';
import { authContext } from '#shared/auth-context';
import { requireUser } from '#shared/access';
import { HttpError, iso } from '#shared/lib';
import { accessErrors, commonErrors } from '#shared/responses';
import { teamParams } from '#modules/teams/model';
import { getCompanySettings } from '#modules/settings/service';
import { evaluateTeamBudget } from '../chat-usage';
import { projectAgentParams } from '../core/model';
import { getAgentInProject } from '../core/service';
import {
  createApprovalRequest,
  listProjectApprovals,
  decideApprovalRequest,
} from './service';

const projectKeyParams = t.Object({ projectKey: t.String() });
const decideParams = t.Object({
  projectKey: t.String(),
  approvalId: t.String(),
});

const approvalStatusQuery = t.Object({
  status: t.Optional(
    t.Union([
      t.Literal('pending'),
      t.Literal('approved'),
      t.Literal('rejected'),
      t.Literal('expired'),
    ]),
  ),
});

const ApprovalDto = t.Object({
  id: t.String(),
  teamId: t.Integer(),
  projectId: t.Integer(),
  agentId: t.Integer(),
  threadId: t.Nullable(t.String()),
  toolCallId: t.String(),
  toolName: t.String(),
  kind: t.Union([t.Literal('approval'), t.Literal('ask_user'), t.Literal('plan_proposal')]),
  payload: t.Record(t.String(), t.Unknown()),
  requestedByUserId: t.Nullable(t.String()),
  decidedByUserId: t.Nullable(t.String()),
  requireSod: t.Boolean(),
  status: t.Union([
    t.Literal('pending'),
    t.Literal('approved'),
    t.Literal('rejected'),
    t.Literal('expired'),
  ]),
  decisionNote: t.Nullable(t.String()),
  createdAt: t.String(),
  decidedAt: t.Nullable(t.String()),
});

const createApprovalBody = t.Object({
  threadId: t.Optional(t.Nullable(t.String())),
  toolCallId: t.String({ minLength: 1 }),
  toolName: t.String({ minLength: 1 }),
  kind: t.Optional(
    t.Union([t.Literal('approval'), t.Literal('ask_user'), t.Literal('plan_proposal')]),
  ),
  payload: t.Optional(t.Record(t.String(), t.Unknown())),
  requireSod: t.Optional(t.Boolean()),
});

const decideApprovalBody = t.Object({
  decision: t.Union([t.Literal('approved'), t.Literal('rejected')]),
  note: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
});

const BudgetPolicyResponse = t.Object({
  teamId: t.Integer(),
  monthlyTokenBudget: t.Number(),
  monthlyUsdCeilingMicros: t.Number(),
  softAlertPct: t.Integer(),
  hardStopEnabled: t.Boolean(),
  usage: t.Object({
    allowed: t.Boolean(),
    spentMicros: t.Number(),
    capMicros: t.Number(),
    spentTokens: t.Number(),
    tokenCap: t.Number(),
    utilizationPct: t.Number(),
    softAlertTriggered: t.Boolean(),
    hardStopped: t.Boolean(),
    reason: t.Optional(t.String()),
  }),
});

const updateBudgetPolicyBody = t.Object({
  monthlyTokenBudget: t.Integer({ minimum: 0 }),
  monthlyUsdCeilingMicros: t.Integer({ minimum: 0 }),
  softAlertPct: t.Optional(t.Integer({ minimum: 10, maximum: 100 })),
  hardStopEnabled: t.Boolean(),
});

const WorkspaceStateDto = t.Object({
  projectId: t.Integer(),
  state: t.Record(t.String(), t.Unknown()),
  updatedAt: t.Nullable(t.String()),
});

const putWorkspaceStateBody = t.Object({
  state: t.Record(t.String(), t.Unknown()),
  replace: t.Optional(t.Boolean()),
});

export const agentHitlRoutes = new Elysia({
  name: 'agent-hitl',
  detail: { tags: ['AI Agents HITL & Workspace'] },
})
  .use(authContext)
  .use(guards)
  .get(
    '/projects/:projectKey/ai-agents/approvals',
    async ({ project, query }) => ({
      items: await listProjectApprovals(project.id, query.status),
    }),
    {
      params: projectKeyParams,
      query: approvalStatusQuery,
      permission: ['ai_agents', 'read'],
      response: { 200: t.Object({ items: t.Array(ApprovalDto) }), ...commonErrors },
      detail: { summary: 'List HITL agent approval requests for a project' },
    },
  )
  .post(
    '/projects/:projectKey/ai-agents/:agentId/approvals',
    async ({ params, project, body, user, set }) => {
      const caller = requireUser(user);
      const agent = await getAgentInProject(params.agentId, project.id);
      if (!agent) throw new HttpError(404, 'Agent not found');
      set.status = 201;
      const companyRequireSod = await getCompanySettings()
        .then((s) => s.requireSodApproval)
        .catch(() => false);
      return createApprovalRequest({
        teamId: project.teamId,
        projectId: project.id,
        agentId: agent.id,
        threadId: body.threadId ?? null,
        toolCallId: body.toolCallId,
        toolName: body.toolName,
        kind: body.kind ?? 'approval',
        payload: body.payload ?? {},
        requestedByUserId: caller.id,
        requireSod: body.requireSod ?? companyRequireSod,
      });
    },
    {
      params: projectAgentParams,
      body: createApprovalBody,
      permission: ['ai_agents', 'read'],
      response: { 201: ApprovalDto, ...commonErrors },
      detail: { summary: 'Create interactive HITL approval / ask-user / plan request' },
    },
  )
  .post(
    '/projects/:projectKey/ai-agents/approvals/:approvalId/decide',
    async ({ params, project, body, user }) => {
      const caller = requireUser(user);
      return decideApprovalRequest({
        approvalId: params.approvalId,
        projectId: project.id,
        deciderUserId: caller.id,
        decision: body.decision,
        note: body.note ?? null,
      });
    },
    {
      params: decideParams,
      body: decideApprovalBody,
      permission: ['ai_agents', 'edit'],
      response: {
        200: ApprovalDto,
        409: t.Object({ error: t.String(), code: t.Optional(t.String()) }),
        ...commonErrors,
      },
      detail: { summary: 'Approve or reject a pending HITL agent request' },
    },
  )
  .get(
    '/teams/:teamId/budget-policy',
    async ({ membership }) => {
      const [policy] = await db
        .select()
        .from(teamBudgetPolicy)
        .where(eq(teamBudgetPolicy.teamId, membership.teamId))
        .limit(1);
      const usage = await evaluateTeamBudget(membership.teamId);
      return {
        teamId: membership.teamId,
        monthlyTokenBudget: Number(policy?.monthlyTokenBudget ?? 0),
        monthlyUsdCeilingMicros: Number(policy?.monthlyUsdCeilingMicros ?? 0),
        softAlertPct: policy?.softAlertPct ?? 80,
        hardStopEnabled: policy?.hardStopEnabled ?? false,
        usage,
      };
    },
    {
      params: teamParams,
      teamPermission: ['ai_agents', 'read'],
      response: { 200: BudgetPolicyResponse, ...accessErrors },
      detail: { summary: 'Read team FinOps monthly budget policy & current spend' },
    },
  )
  .put(
    '/teams/:teamId/budget-policy',
    async ({ membership, body }) => {
      const [saved] = await db
        .insert(teamBudgetPolicy)
        .values({
          teamId: membership.teamId,
          monthlyTokenBudget: body.monthlyTokenBudget,
          monthlyUsdCeilingMicros: body.monthlyUsdCeilingMicros,
          softAlertPct: body.softAlertPct ?? 80,
          hardStopEnabled: body.hardStopEnabled,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: teamBudgetPolicy.teamId,
          set: {
            monthlyTokenBudget: body.monthlyTokenBudget,
            monthlyUsdCeilingMicros: body.monthlyUsdCeilingMicros,
            softAlertPct: body.softAlertPct ?? 80,
            hardStopEnabled: body.hardStopEnabled,
            updatedAt: new Date(),
          },
        })
        .returning();
      const usage = await evaluateTeamBudget(membership.teamId);
      return {
        teamId: membership.teamId,
        monthlyTokenBudget: Number(saved.monthlyTokenBudget),
        monthlyUsdCeilingMicros: Number(saved.monthlyUsdCeilingMicros),
        softAlertPct: saved.softAlertPct,
        hardStopEnabled: saved.hardStopEnabled,
        usage,
      };
    },
    {
      params: teamParams,
      body: updateBudgetPolicyBody,
      teamManager: true,
      response: { 200: BudgetPolicyResponse, ...commonErrors },
      detail: { summary: 'Configure team monthly FinOps token/USD budget ceiling' },
    },
  )
  .get(
    '/projects/:projectKey/workspace-state',
    async ({ project, user }) => {
      const caller = requireUser(user);
      const [row] = await db
        .select()
        .from(userWorkspaceState)
        .where(
          and(
            eq(userWorkspaceState.userId, caller.id),
            eq(userWorkspaceState.projectId, project.id),
          ),
        )
        .limit(1);
      return {
        projectId: project.id,
        state: row?.state ?? {},
        updatedAt: row?.updatedAt ? iso(row.updatedAt) : null,
      };
    },
    {
      params: projectKeyParams,
      permission: ['ai_agents', 'read'],
      response: { 200: WorkspaceStateDto, ...accessErrors },
      detail: { summary: 'Read cross-device persisted client workspace state' },
    },
  )
  .put(
    '/projects/:projectKey/workspace-state',
    async ({ project, body, user }) => {
      const caller = requireUser(user);
      const [saved] = await db
        .insert(userWorkspaceState)
        .values({
          userId: caller.id,
          projectId: project.id,
          state: body.state,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [userWorkspaceState.userId, userWorkspaceState.projectId],
          set: {
            state: body.replace
              ? body.state
              : sql`coalesce(${userWorkspaceState.state}, '{}'::jsonb) || ${JSON.stringify(body.state)}::jsonb`,
            updatedAt: new Date(),
          },
        })
        .returning();
      return {
        projectId: project.id,
        state: saved.state ?? {},
        updatedAt: iso(saved.updatedAt),
      };
    },
    {
      params: projectKeyParams,
      body: putWorkspaceStateBody,
      permission: ['ai_agents', 'read'],
      response: { 200: WorkspaceStateDto, ...commonErrors },
      detail: { summary: 'Persist cross-device client workspace state' },
    },
  );
