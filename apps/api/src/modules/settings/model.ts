import { t } from 'elysia';

export const StorageSettingsSchema = t.Object({
  maxAttachmentMb: t.Number(),
  maxAvatarMb: t.Number(),
  attachmentMimeTypes: t.Array(t.String()),
  projectQuotaMb: t.Number(),
});

export const AutonomyTierSchema = t.UnionEnum(['TIER_0', 'TIER_1', 'TIER_2']);

export const CompanySettingsSchema = t.Object({
  companyName: t.String(),
  legalName: t.String(),
  slug: t.String(),
  domain: t.String(),
  industry: t.String(),
  timezone: t.String(),
  defaultLocale: t.String(),
  defaultAutonomyTier: AutonomyTierSchema,
  requireSodApproval: t.Boolean(),
  allowAgentTeamBootstrap: t.Boolean(),
  onboardingCompleted: t.Boolean(),
  updatedByUserId: t.Nullable(t.String()),
  updatedAt: t.Nullable(t.String()),
});

export const UpdateCompanySettingsBody = t.Partial(
  t.Object({
    companyName: t.String({ minLength: 1, maxLength: 120 }),
    legalName: t.String({ maxLength: 160 }),
    slug: t.String({ pattern: '^[a-z][a-z0-9-]{1,39}$' }),
    domain: t.String({ maxLength: 160 }),
    industry: t.String({ maxLength: 120 }),
    timezone: t.String({ maxLength: 80 }),
    defaultLocale: t.String({ maxLength: 16 }),
    defaultAutonomyTier: AutonomyTierSchema,
    requireSodApproval: t.Boolean(),
    allowAgentTeamBootstrap: t.Boolean(),
    onboardingCompleted: t.Boolean(),
  }),
);

export const ProjectDefaultsSchema = t.Object({
  mcpEnabled: t.Boolean(),
});

// A command id bound to a combination written as modifier tokens plus a key
// ('mod+k', 'n'). The set of commands lives in the web app (its lib/hotkeys), so
// the API checks the shape and stores the map as given.
export const HotkeyCombosSchema = t.Record(
  t.String({ pattern: '^[a-z][a-z0-9.-]{0,63}$' }),
  t.String({ pattern: '^(mod\\+|shift\\+|alt\\+)*[a-z0-9]{1,10}$' }),
);

const ReleaseSchema = t.Object({
  tag: t.String(),
  version: t.String(),
  publishedAt: t.String(),
  url: t.Nullable(t.String()),
  notes: t.String(),
  notesFormat: t.UnionEnum(['html', 'markdown']),
});

export const UpdateStatusSchema = t.Object({
  currentVersion: t.String(),
  latestVersion: t.Nullable(t.String()),
  updateAvailable: t.Boolean(),
  checkedAt: t.Nullable(t.String()),
  releases: t.Array(ReleaseSchema),
});

export const VersionResponse = t.Object({ version: t.String() });

const RenameSchema = t.Object({ from: t.String(), to: t.String() });

// What migration 0115 did to this instance's data, as the migration recorded it.
const TeamsMigrationSchema = t.Object({
  version: t.Number(),
  teams: t.Array(
    t.Object({
      name: t.String(),
      projects: t.Array(t.Object({ key: t.String(), name: t.String() })),
    }),
  ),
  renamed: t.Record(t.String(), t.Array(RenameSchema)),
  merged: t.Object({ roles: t.Number(), agentTools: t.Number() }),
  movedInvites: t.Number(),
  droppedNotificationSettings: t.Array(t.String()),
});

const BackupSchema = t.Object({
  path: t.String(),
  sizeBytes: t.Number(),
  createdAt: t.String(),
  expiresAt: t.String(),
  migrations: t.Array(t.String()),
});

export const WhatsNewSchema = t.Object({
  version: t.String(),
  pending: t.Boolean(),
  releases: t.Array(ReleaseSchema),
  backup: t.Nullable(BackupSchema),
  migration: t.Nullable(TeamsMigrationSchema),
});
