import { Elysia, t } from 'elysia';
import { mcpTool } from '#mcp/generate';
import { noContent } from '#shared/http';
import { guards } from '#shared/guards';
import { paginate } from '#shared/pagination';
import { HttpError, rethrowDuplicate } from '#shared/lib';
import {
  PERMISSION_RESOURCES,
  PERMISSION_ACTIONS,
  hasPermission,
  resourceActions,
  type PermissionAction,
  type PermissionResource,
} from '#shared/permissions';
import { accessErrors, commonErrors, errors } from '#shared/responses';
import { getCompanySettings } from '#modules/settings/service';
import { getTeamMembership } from '#modules/teams/service';
import {
  listRoles,
  listRolesPage,
  getRole,
  getRoleUsage,
  isRoleInUse,
  createRole,
  updateRole,
  deleteRole,
  upsertRoleByName,
  countTeamMembersByRank,
} from './service';
import {
  CheckAuthorizationResponse,
  PermissionCatalogResponse,
  RolePageResponse,
  RoleResponse,
  RoleUsageResponse,
  TeamAuthorizationResponse,
  checkAuthorizationBody,
  createRoleBody,
  deleteRoleQuery,
  roleListQuery,
  roleParams,
  teamParams,
  updateRoleBody,
  upsertRoleBody,
} from './model';

// Roles CRUD. A role belongs to a team and every project the team owns assigns from
// that one list. Who may write one is the team's own ranks, not the permission
// matrix: a member with members_manage could otherwise grant itself a more powerful
// role. An owner or a manager creates and edits; deleting stays with the owner,
// since a deletion moves every member, agent and invite on the role to another one.
export const roleRoutes = new Elysia({ name: 'roles', detail: { tags: ['Roles'] } })
  .use(guards)

  // Static; any authenticated user may read it to render a role editor.
  .get(
    '/permission-catalog',
    () => ({
      resources: PERMISSION_RESOURCES.map((key) => ({ key, actions: [...resourceActions(key)] })),
      actions: [...PERMISSION_ACTIONS],
    }),
    {
      response: { 200: PermissionCatalogResponse, ...errors(401) },
      detail: {
        summary: 'List the permission catalog',
        description:
          "List the resources and actions a role's permission matrix is built from. " +
          'A resource lists the actions it supports; one it omits is always denied. ' +
          'ai_agents is administrative: it also attaches an agent to any project of the team ' +
          'and exposes the API key of an agent.',
        ...mcpTool('list_permission_catalog'),
      },
    },
  )

  // One page of the roles of a team, read by any of its members.
  .get(
    '/teams/:teamId/roles',
    ({ membership, query }) =>
      paginate(query, (window) =>
        listRolesPage(membership.teamId, { search: query.search, ...window }),
      ),
    {
      params: teamParams,
      query: roleListQuery,
      teamMember: true,
      response: { 200: RolePageResponse, ...accessErrors },
      detail: {
        summary: "List a team's roles",
        description:
          'One page of the roles a team offers, oldest first. `search` matches the name. ' +
          'Use list_role_options to read every one of them.',
        ...mcpTool('list_roles'),
      },
    },
  )

  // The projects assign from this one list, so a member list, an add-member dialog
  // and an agent's role picker all name their options from it. The matrices come
  // along: the roles are exported to the clipboard from here as well.
  .get('/teams/:teamId/roles/options', ({ membership }) => listRoles(membership.teamId), {
    params: teamParams,
    teamMember: true,
    response: { 200: t.Array(RoleResponse), ...accessErrors },
    detail: {
      summary: "List a team's role options",
      description:
        'Every role of the team, with its permission matrix, for the pickers that assign one. ' +
        'Use list_roles to read them a page at a time.',
      ...mcpTool('list_role_options'),
    },
  })

  .post(
    '/teams/:teamId/roles',
    async ({ membership, body, set }) => {
      try {
        set.status = 201;
        return await createRole(membership.teamId, body);
      } catch (err) {
        rethrowDuplicate(err, 'role');
      }
    },
    {
      params: teamParams,
      body: createRoleBody,
      teamManager: true,
      response: { 201: RoleResponse, ...commonErrors, ...errors(409) },
      detail: { summary: 'Create a role', ...mcpTool('create_role') },
    },
  )

  .patch(
    '/teams/:teamId/roles/:roleId',
    async ({ membership, params, body }) => {
      let role;
      try {
        role = await updateRole(membership.teamId, params.roleId, body);
      } catch (err) {
        rethrowDuplicate(err, 'role');
      }
      if (!role) throw new HttpError(404, 'Role not found');
      return role;
    },
    {
      params: roleParams,
      body: updateRoleBody,
      teamManager: true,
      response: { 200: RoleResponse, ...commonErrors, ...errors(409) },
      detail: {
        summary: 'Update a role',
        description: 'Update a role.',
        ...mcpTool('update_role'),
      },
    },
  )

  // What a role would take with it if deleted, so the caller can name where to move
  // it before asking for the deletion.
  .get(
    '/teams/:teamId/roles/:roleId/usage',
    async ({ membership, params }) => {
      const role = await getRole(membership.teamId, params.roleId);
      if (!role) throw new HttpError(404, 'Role not found');
      return getRoleUsage(params.roleId);
    },
    {
      params: roleParams,
      teamOwner: true,
      response: { 200: RoleUsageResponse, ...commonErrors },
      detail: {
        summary: 'Count what a role is assigned to',
        description:
          'Count the project members, AI agents, pending invites and provisioned group mappings on a role. They have to be moved to another role before it can be deleted.',
        ...mcpTool('get_role_usage'),
      },
    },
  )

  // Deletes a custom role. The default role cannot be deleted. A role that members,
  // agents, pending invites or provisioned group mappings are on is deleted only
  // together with targetRoleId, the role they are all moved to.
  .delete(
    '/teams/:teamId/roles/:roleId',
    async ({ membership, params, query }) => {
      const role = await getRole(membership.teamId, params.roleId);
      if (!role) throw new HttpError(404, 'Role not found');
      if (role.isDefault) throw new HttpError(400, 'The default role cannot be deleted');

      let targetRoleId: number | null = null;
      if (isRoleInUse(await getRoleUsage(params.roleId))) {
        if (query.targetRoleId === undefined) {
          throw new HttpError(
            400,
            'This role is in use. Pass targetRoleId to move its members, agents, pending invites and group mappings to another role.',
          );
        }
        if (query.targetRoleId === params.roleId) {
          throw new HttpError(400, 'Move to a role other than the one being deleted');
        }
        const target = await getRole(membership.teamId, query.targetRoleId);
        if (!target) throw new HttpError(404, 'Target role not found');
        targetRoleId = target.id;
      }

      await deleteRole(membership.teamId, params.roleId, targetRoleId);
      return noContent();
    },
    {
      params: roleParams,
      query: deleteRoleQuery,
      teamOwner: true,
      response: { 204: t.Void(), ...commonErrors },
      detail: {
        summary: 'Delete a role',
        description:
          'Delete a custom role. The default role cannot be deleted. A role in use requires targetRoleId, the role its members, agents, pending invites and group mappings are moved to.',
        ...mcpTool('delete_role'),
      },
    },
  )

  .put(
    '/teams/:teamId/roles/upsert',
    async ({ membership, body }) => {
      const trimmed = body.name.trim();
      if (!trimmed) throw new HttpError(400, 'Role name is required');
      try {
        return await upsertRoleByName(membership.teamId, {
          name: trimmed,
          permissions: body.permissions,
          isDefault: body.isDefault,
        });
      } catch (err) {
        rethrowDuplicate(err, 'role');
      }
    },
    {
      params: teamParams,
      body: upsertRoleBody,
      teamManager: true,
      response: { 200: RoleResponse, ...commonErrors, ...errors(409) },
      detail: {
        summary: 'Create or update a role by name',
        description:
          'Idempotently create or update a custom role permission matrix for the team.',
        ...mcpTool('upsert_team_role', { idempotentHint: true }),
      },
    },
  )

  .get(
    '/teams/:teamId/authorization',
    async ({ membership }) => {
      const [governance, counts, roles] = await Promise.all([
        getCompanySettings(),
        countTeamMembersByRank(membership.teamId),
        listRoles(membership.teamId),
      ]);
      return {
        teamId: membership.teamId,
        governance: {
          defaultAutonomyTier: governance.defaultAutonomyTier,
          requireSodApproval: governance.requireSodApproval,
          allowAgentTeamBootstrap: governance.allowAgentTeamBootstrap,
        },
        teamRanks: [
          {
            rank: 'owner',
            count: counts.owner,
            fullAccess: true,
            canManageRoles: true,
            canDeleteRoles: true,
          },
          {
            rank: 'manager',
            count: counts.manager,
            fullAccess: true,
            canManageRoles: true,
            canDeleteRoles: false,
          },
          {
            rank: 'member',
            count: counts.member,
            fullAccess: false,
            canManageRoles: false,
            canDeleteRoles: false,
          },
          {
            rank: 'agent',
            count: counts.agent,
            fullAccess: false,
            canManageRoles: false,
            canDeleteRoles: false,
          },
        ],
        roles,
        catalog: {
          resources: PERMISSION_RESOURCES.map((key) => ({
            key,
            actions: [...resourceActions(key)],
          })),
          actions: [...PERMISSION_ACTIONS],
        },
      };
    },
    {
      params: teamParams,
      teamMember: true,
      response: { 200: TeamAuthorizationResponse, ...accessErrors },
      detail: {
        summary: 'Get unified team authorization matrix and governance posture',
        description:
          'Read team standing ranks, company autonomy/SoD governance guardrails, custom roles, and permission catalog.',
        ...mcpTool('get_team_authorization'),
      },
    },
  )

  .post(
    '/teams/:teamId/authorization/check',
    async ({ membership, body }) => {
      const governance = await getCompanySettings();
      const sodCompliant = !(
        governance.requireSodApproval &&
        body.executorUserId &&
        body.approverUserId &&
        body.executorUserId === body.approverUserId
      );

      const validResource = (PERMISSION_RESOURCES as readonly string[]).includes(body.resource);
      const validAction = (PERMISSION_ACTIONS as readonly string[]).includes(body.action);
      const validResAct = validResource && validAction;

      let matrixAllowed = false;
      let effectiveRank = 'member';
      let roleName: string | null = null;

      if (body.roleId != null) {
        const role = await getRole(membership.teamId, body.roleId);
        if (!role) throw new HttpError(404, 'Role not found');
        roleName = role.name;
        matrixAllowed = validResAct
          ? hasPermission(
              role.permissions,
              body.resource as PermissionResource,
              body.action as PermissionAction,
            )
          : false;
      } else {
        const targetUserId = body.userId ?? membership.userId;
        const standing = await getTeamMembership(membership.teamId, targetUserId);
        if (!standing) {
          effectiveRank = 'none';
          matrixAllowed = false;
        } else if (standing === 'owner' || standing === 'manager') {
          effectiveRank = standing;
          roleName = standing;
          matrixAllowed = validResAct;
        } else {
          effectiveRank = standing;
          const roles = await listRoles(membership.teamId);
          const defRole = roles.find((r) => r.isDefault);
          roleName = defRole?.name ?? null;
          matrixAllowed =
            defRole && validResAct
              ? hasPermission(
                  defRole.permissions,
                  body.resource as PermissionResource,
                  body.action as PermissionAction,
                )
              : false;
        }
      }

      const effectiveTier = body.riskTier ?? governance.defaultAutonomyTier;
      const requiresHitl = effectiveTier === 'TIER_2';
      const allowed = sodCompliant && matrixAllowed;
      const reason = !sodCompliant
        ? 'Separation of Duties (GW-SOD-01) violation: executorUserId cannot equal approverUserId.'
        : allowed
          ? 'Authorized by role/rank policy.'
          : 'Denied by role permission matrix.';

      return {
        allowed,
        sodCompliant,
        requiresHitl,
        effectiveRank,
        roleName,
        resource: body.resource,
        action: body.action,
        reason,
      };
    },
    {
      params: teamParams,
      body: checkAuthorizationBody,
      teamMember: true,
      response: { 200: CheckAuthorizationResponse, ...commonErrors },
      detail: {
        summary: 'Evaluate RBAC permission and SoD compliance',
        description:
          'Deterministically check whether a role or user is authorized for a resource action under team RBAC and GW-SOD-01.',
        ...mcpTool('check_team_authorization', { readOnlyHint: true }),
      },
    },
  );
