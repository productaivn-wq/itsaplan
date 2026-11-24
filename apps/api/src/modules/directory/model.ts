import { t } from 'elysia';

export const STORAGE_LOCATION_KINDS = [
  'local_folder',
  'google_drive',
  'git_repo',
  'knowledge_base',
  'cloud_storage',
  'database',
  'other',
] as const;

export const STORAGE_ACCESS_SCOPES = ['read_only', 'read_write', 'archive'] as const;

export const CHANNEL_THREAD_TYPES = ['GROUP', 'CHANNEL', 'DIRECT', 'EMAIL'] as const;

export const ProjectContactDto = t.Object({
  id: t.Number(),
  projectId: t.Number(),
  externalKey: t.String(),
  name: t.String(),
  role: t.String(),
  raciRole: t.String(),
  orgId: t.String(),
  lifecycleStage: t.String(),
  primaryEmail: t.String(),
  phone: t.String(),
  channelHandles: t.Record(t.String(), t.Unknown()),
  source: t.String(),
  projectKey: t.Optional(t.String()),
  projectName: t.Optional(t.String()),
  projectRef: t.Optional(t.String()),
});

export const ProjectChannelDto = t.Object({
  id: t.Number(),
  projectId: t.Number(),
  channelId: t.String(),
  platform: t.String(),
  threadType: t.String(),
  displayName: t.String(),
  targetId: t.String(),
  aliases: t.Array(t.String()),
  status: t.String(),
  lastSyncedAt: t.Nullable(t.String()),
  source: t.String(),
  projectKey: t.Optional(t.String()),
  projectName: t.Optional(t.String()),
  projectRef: t.Optional(t.String()),
});

export const ProjectStorageLocationDto = t.Object({
  id: t.Number(),
  projectId: t.Number(),
  locationId: t.String(),
  kind: t.String(),
  label: t.String(),
  uriOrPath: t.String(),
  accessScope: t.String(),
  isPrimary: t.Boolean(),
  description: t.String(),
  source: t.String(),
  projectKey: t.Optional(t.String()),
  projectName: t.Optional(t.String()),
  projectRef: t.Optional(t.String()),
});

export const DirectoryProjectSummaryDto = t.Object({
  id: t.Number(),
  key: t.String(),
  name: t.String(),
  ref: t.String(),
  contactsCount: t.Number(),
  channelsCount: t.Number(),
  storageLocationsCount: t.Number(),
  lastActivityAt: t.Optional(t.Nullable(t.String())),
});

export const upsertProjectContactBody = t.Object({
  externalKey: t.Optional(t.String({ minLength: 1 })),
  name: t.String({ minLength: 1 }),
  role: t.Optional(t.String()),
  raciRole: t.Optional(t.String()),
  orgId: t.Optional(t.String()),
  lifecycleStage: t.Optional(t.String()),
  primaryEmail: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  channelHandles: t.Optional(t.Record(t.String(), t.Unknown())),
  source: t.Optional(t.String()),
});

export const upsertProjectChannelBody = t.Object({
  channelId: t.Optional(t.String({ minLength: 1 })),
  platform: t.String({ minLength: 1 }),
  threadType: t.Optional(t.UnionEnum([...CHANNEL_THREAD_TYPES])),
  displayName: t.String({ minLength: 1 }),
  targetId: t.Optional(t.String()),
  aliases: t.Optional(t.Array(t.String())),
  status: t.Optional(t.String()),
  lastSyncedAt: t.Optional(t.Nullable(t.String())),
  source: t.Optional(t.String()),
});

export const upsertProjectStorageLocationBody = t.Object({
  locationId: t.Optional(t.String({ minLength: 1 })),
  kind: t.UnionEnum([...STORAGE_LOCATION_KINDS]),
  label: t.String({ minLength: 1 }),
  uriOrPath: t.String({ minLength: 1 }),
  accessScope: t.Optional(t.UnionEnum([...STORAGE_ACCESS_SCOPES])),
  isPrimary: t.Optional(t.Boolean()),
  description: t.Optional(t.String()),
  source: t.Optional(t.String()),
});

export const ProjectDirectoryResponse = t.Object({
  scope: t.Optional(t.String()),
  contacts: t.Array(ProjectContactDto),
  channels: t.Array(ProjectChannelDto),
  groups: t.Array(ProjectChannelDto),
  storageLocations: t.Array(ProjectStorageLocationDto),
  counts: t.Object({
    contacts: t.Number(),
    channels: t.Number(),
    groups: t.Number(),
    storageLocations: t.Number(),
  }),
  portfolioCounts: t.Optional(
    t.Object({
      contacts: t.Number(),
      channels: t.Number(),
      groups: t.Number(),
      storageLocations: t.Number(),
      projects: t.Number(),
    }),
  ),
  projects: t.Optional(t.Array(DirectoryProjectSummaryDto)),
  lastSyncedAt: t.Optional(t.Nullable(t.String())),
});
