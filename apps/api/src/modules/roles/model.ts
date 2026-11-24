import { t } from 'elysia';
import { pageQueryFields, pageResponse } from '#shared/pagination';
import { PermissionMatrixSchema } from '#shared/permissions';

export const teamParams = t.Object({ teamId: t.Numeric() });

export const roleParams = t.Object({ teamId: t.Numeric(), roleId: t.Numeric() });

// The role everything on the deleted one is moved to. Required when the role is in
// use, ignored otherwise.
export const deleteRoleQuery = t.Object({ targetRoleId: t.Optional(t.Numeric()) });

// Permission matrix carried on create/update. Kept loose (a jsonb blob) and
// sanitized by normalizePermissions in the service: unknown keys are dropped,
// values coerced to booleans, missing entries defaulted to false.
const permissions = t.Any();

export const createRoleBody = t.Object({
  name: t.String({ minLength: 1 }),
  permissions,
});

export const updateRoleBody = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  permissions: t.Optional(permissions),
});

// A role DTO (RoleRow from the service).
export const RoleResponse = t.Object({
  id: t.Number(),
  name: t.String(),
  isDefault: t.Boolean(),
  permissions: PermissionMatrixSchema,
  createdAt: t.String(),
});

export const roleListQuery = t.Object({
  search: t.Optional(t.String({ description: 'Matches the name.' })),
  ...pageQueryFields,
});

export const RolePageResponse = pageResponse(RoleResponse);

export const RoleUsageResponse = t.Object({
  members: t.Number(),
  agents: t.Number(),
  invites: t.Number(),
  groups: t.Number(),
});

export const PermissionCatalogResponse = t.Object({
  // `actions` is the full action set, in the order a matrix renders its columns;
  // each resource names the subset it supports.
  resources: t.Array(t.Object({ key: t.String(), actions: t.Array(t.String()) })),
  actions: t.Array(t.String()),
});

export const upsertRoleBody = t.Object({
  name: t.String(),
  permissions: t.Any(),
  isDefault: t.Optional(t.Boolean()),
});

export const TeamAuthorizationResponse = t.Object({
  teamId: t.Number(),
  governance: t.Object({
    defaultAutonomyTier: t.String(),
    requireSodApproval: t.Boolean(),
    allowAgentTeamBootstrap: t.Boolean(),
  }),
  teamRanks: t.Array(
    t.Object({
      rank: t.String(),
      count: t.Number(),
      fullAccess: t.Boolean(),
      canManageRoles: t.Boolean(),
      canDeleteRoles: t.Boolean(),
    }),
  ),
  roles: t.Array(RoleResponse),
  catalog: PermissionCatalogResponse,
});

export const checkAuthorizationBody = t.Object({
  userId: t.Optional(t.String()),
  roleId: t.Optional(t.Number()),
  resource: t.String(),
  action: t.String(),
  riskTier: t.Optional(
    t.Union([t.Literal('TIER_0'), t.Literal('TIER_1'), t.Literal('TIER_2')]),
  ),
  executorUserId: t.Optional(t.String()),
  approverUserId: t.Optional(t.String()),
});

export const CheckAuthorizationResponse = t.Object({
  allowed: t.Boolean(),
  sodCompliant: t.Boolean(),
  requiresHitl: t.Boolean(),
  effectiveRank: t.String(),
  roleName: t.Nullable(t.String()),
  resource: t.String(),
  action: t.String(),
  reason: t.String(),
});
