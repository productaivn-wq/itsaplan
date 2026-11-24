import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import {
  db,
  project as projectTable,
  projectChannel,
  projectContact,
  projectMember,
  projectSetting,
  projectStorageLocation,
  team,
  type DbExecutor,
} from '@repo/db';
import { HttpError } from '#shared/lib';

const SECRET_SIG_RE =
  /(?:sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9._-]{12,}|ghp_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{12,}|AIza[0-9A-Za-z_-]{20,})/;

export function assertNoPlaintextSecret(payload: unknown): void {
  if (SECRET_SIG_RE.test(JSON.stringify(payload))) {
    throw new HttpError(
      400,
      'Plaintext secret/token detected; store credentials in Secret Vault instead.',
    );
  }
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function shortSuffix(): string {
  return randomUUID().replace(/-/g, '').slice(0, 6);
}

export function normalizeExternalKey(name: string, rawKey?: string): string {
  const trimmed = rawKey?.trim();
  if (trimmed) return trimmed;
  const slug = slugify(name);
  return slug ? `CON-${slug.toUpperCase()}` : `CON-${shortSuffix().toUpperCase()}`;
}

export function normalizeChannelId(platform: string, displayName: string, rawId?: string): string {
  const trimmed = rawId?.trim();
  if (trimmed) return trimmed;
  const pSlug = slugify(platform) || 'ch';
  const dSlug = slugify(displayName) || shortSuffix();
  return `${pSlug}-${dSlug}`;
}

export function normalizeLocationId(kind: string, label: string, rawId?: string): string {
  const trimmed = rawId?.trim();
  if (trimmed) return trimmed;
  const kSlug = slugify(kind) || 'loc';
  const lSlug = slugify(label) || shortSuffix();
  return `${kSlug}-${lSlug}`;
}

export type ProjectContactRecord = typeof projectContact.$inferSelect;
export type ProjectChannelRecord = typeof projectChannel.$inferSelect;
export type ProjectStorageLocationRecord = typeof projectStorageLocation.$inferSelect;

export interface ProjectDirectoryPayload {
  contacts: ProjectContactRecord[];
  channels: ProjectChannelRecord[];
  groups: ProjectChannelRecord[];
  storageLocations: ProjectStorageLocationRecord[];
  counts: {
    contacts: number;
    channels: number;
    groups: number;
    storageLocations: number;
  };
}

export interface UpsertContactInput {
  externalKey?: string;
  name: string;
  role?: string;
  raciRole?: string;
  orgId?: string;
  lifecycleStage?: string;
  primaryEmail?: string;
  phone?: string;
  channelHandles?: Record<string, unknown>;
  source?: string;
}

export interface UpsertChannelInput {
  channelId?: string;
  platform: string;
  threadType?: string;
  displayName: string;
  targetId?: string;
  aliases?: string[];
  status?: string;
  lastSyncedAt?: string | null;
  source?: string;
}

export interface UpsertStorageLocationInput {
  locationId?: string;
  kind: string;
  label: string;
  uriOrPath: string;
  accessScope?: string;
  isPrimary?: boolean;
  description?: string;
  source?: string;
}

export async function getProjectDirectory(projectId: number): Promise<ProjectDirectoryPayload> {
  const [contacts, channels, storageLocations] = await Promise.all([
    db
      .select()
      .from(projectContact)
      .where(eq(projectContact.projectId, projectId))
      .orderBy(asc(projectContact.id)),
    db
      .select()
      .from(projectChannel)
      .where(eq(projectChannel.projectId, projectId))
      .orderBy(asc(projectChannel.id)),
    db
      .select()
      .from(projectStorageLocation)
      .where(eq(projectStorageLocation.projectId, projectId))
      .orderBy(desc(projectStorageLocation.isPrimary), asc(projectStorageLocation.id)),
  ]);
  const groups = channels.filter((c) => c.threadType.toUpperCase() === 'GROUP');
  return {
    contacts,
    channels,
    groups,
    storageLocations,
    counts: {
      contacts: contacts.length,
      channels: channels.length,
      groups: groups.length,
      storageLocations: storageLocations.length,
    },
  };
}

export async function getProjectDirectoryScoped(
  project: { id: number; key: string; name: string; teamId: number },
  userId: string | undefined,
  scope: 'project' | 'all' = 'project',
) {
  const teamProjects = await db
    .select({
      id: projectTable.id,
      key: projectTable.key,
      name: projectTable.name,
      teamId: projectTable.teamId,
      teamSlug: team.slug,
    })
    .from(projectTable)
    .innerJoin(team, eq(team.id, projectTable.teamId))
    .where(eq(projectTable.teamId, project.teamId))
    .orderBy(asc(projectTable.key));

  let accessibleProjects = teamProjects;
  if (userId) {
    const memberships = await db
      .select({ projectId: projectMember.projectId })
      .from(projectMember)
      .where(eq(projectMember.userId, userId));
    const memberSet = new Set(memberships.map((m) => m.projectId));
    const filtered = teamProjects.filter((p) => memberSet.has(p.id));
    if (filtered.length > 0) accessibleProjects = filtered;
  }

  const projById = new Map(
    accessibleProjects.map((p) => [p.id, { ...p, ref: `${p.teamSlug ?? p.teamId}.${p.key}` }]),
  );
  if (!projById.has(project.id)) {
    projById.set(project.id, {
      id: project.id,
      key: project.key,
      name: project.name,
      teamId: project.teamId,
      teamSlug: null,
      ref: `${project.teamId}.${project.key}`,
    });
  }

  const allIds = Array.from(projById.keys());
  const [allContacts, allChannels, allLocations, syncSettingRows] = await Promise.all([
    allIds.length > 0
      ? db
          .select()
          .from(projectContact)
          .where(inArray(projectContact.projectId, allIds))
          .orderBy(asc(projectContact.projectId), asc(projectContact.id))
      : Promise.resolve([]),
    allIds.length > 0
      ? db
          .select()
          .from(projectChannel)
          .where(inArray(projectChannel.projectId, allIds))
          .orderBy(asc(projectChannel.projectId), asc(projectChannel.id))
      : Promise.resolve([]),
    allIds.length > 0
      ? db
          .select()
          .from(projectStorageLocation)
          .where(inArray(projectStorageLocation.projectId, allIds))
          .orderBy(desc(projectStorageLocation.isPrimary), asc(projectStorageLocation.id))
      : Promise.resolve([]),
    db
      .select({ value: projectSetting.value, updatedAt: projectSetting.updatedAt })
      .from(projectSetting)
      .where(and(eq(projectSetting.projectId, project.id), eq(projectSetting.key, 'directory_sync_meta')))
      .limit(1),
  ]);

  const cCounts = new Map<number, number>();
  const chCounts = new Map<number, number>();
  const locCounts = new Map<number, number>();
  for (const c of allContacts) cCounts.set(c.projectId, (cCounts.get(c.projectId) ?? 0) + 1);
  for (const ch of allChannels) chCounts.set(ch.projectId, (chCounts.get(ch.projectId) ?? 0) + 1);
  for (const loc of allLocations) locCounts.set(loc.projectId, (locCounts.get(loc.projectId) ?? 0) + 1);

  const attachMeta = <T extends { projectId: number }>(row: T) => {
    const meta = projById.get(row.projectId);
    return {
      ...row,
      projectKey: meta?.key ?? project.key,
      projectName: meta?.name ?? project.name,
      projectRef: meta?.ref ?? `${project.teamId}.${project.key}`,
    };
  };

  const scopedContacts = (scope === 'all' ? allContacts : allContacts.filter((c) => c.projectId === project.id)).map(attachMeta);
  const scopedChannels = (scope === 'all' ? allChannels : allChannels.filter((ch) => ch.projectId === project.id)).map(attachMeta);
  const scopedGroups = scopedChannels.filter((c) => c.threadType.toUpperCase() === 'GROUP');
  const scopedLocations = (scope === 'all' ? allLocations : allLocations.filter((l) => l.projectId === project.id)).map(attachMeta);
  const allGroupsCount = allChannels.filter((c) => c.threadType.toUpperCase() === 'GROUP').length;

  const projectsSummary = Array.from(projById.values()).map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    ref: p.ref,
    contactsCount: cCounts.get(p.id) ?? 0,
    channelsCount: chCounts.get(p.id) ?? 0,
    storageLocationsCount: locCounts.get(p.id) ?? 0,
  }));

  const syncMeta = syncSettingRows[0]?.value as Record<string, unknown> | undefined;
  const lastSyncedAt =
    typeof syncMeta?.synced_at === 'string'
      ? syncMeta.synced_at
      : syncSettingRows[0]?.updatedAt?.toISOString() ?? null;

  return {
    scope,
    contacts: scopedContacts,
    channels: scopedChannels,
    groups: scopedGroups,
    storageLocations: scopedLocations,
    counts: {
      contacts: scopedContacts.length,
      channels: scopedChannels.length,
      groups: scopedGroups.length,
      storageLocations: scopedLocations.length,
    },
    portfolioCounts: {
      contacts: allContacts.length,
      channels: allChannels.length,
      groups: allGroupsCount,
      storageLocations: allLocations.length,
      projects: projectsSummary.filter((p) => p.contactsCount > 0 || p.channelsCount > 0 || p.storageLocationsCount > 0).length,
    },
    projects: projectsSummary,
    lastSyncedAt,
  };
}

export async function getProjectDirectoriesByIds(
  projectIds: number[],
): Promise<Map<number, ProjectDirectoryPayload>> {
  const out = new Map<number, ProjectDirectoryPayload>();
  if (projectIds.length === 0) return out;

  const [contacts, channels, storageLocations] = await Promise.all([
    db
      .select()
      .from(projectContact)
      .where(inArray(projectContact.projectId, projectIds))
      .orderBy(asc(projectContact.id)),
    db
      .select()
      .from(projectChannel)
      .where(inArray(projectChannel.projectId, projectIds))
      .orderBy(asc(projectChannel.id)),
    db
      .select()
      .from(projectStorageLocation)
      .where(inArray(projectStorageLocation.projectId, projectIds))
      .orderBy(desc(projectStorageLocation.isPrimary), asc(projectStorageLocation.id)),
  ]);

  const byProj = new Map<
    number,
    {
      contacts: ProjectContactRecord[];
      channels: ProjectChannelRecord[];
      storageLocations: ProjectStorageLocationRecord[];
    }
  >();
  for (const pid of projectIds) {
    byProj.set(pid, { contacts: [], channels: [], storageLocations: [] });
  }
  for (const c of contacts) byProj.get(c.projectId)?.contacts.push(c);
  for (const ch of channels) byProj.get(ch.projectId)?.channels.push(ch);
  for (const loc of storageLocations) byProj.get(loc.projectId)?.storageLocations.push(loc);

  for (const [pid, bucket] of byProj) {
    const groups = bucket.channels.filter((c) => c.threadType.toUpperCase() === 'GROUP');
    out.set(pid, {
      contacts: bucket.contacts,
      channels: bucket.channels,
      groups,
      storageLocations: bucket.storageLocations,
      counts: {
        contacts: bucket.contacts.length,
        channels: bucket.channels.length,
        groups: groups.length,
        storageLocations: bucket.storageLocations.length,
      },
    });
  }
  return out;
}

export async function listProjectContacts(projectId: number): Promise<ProjectContactRecord[]> {
  return db
    .select()
    .from(projectContact)
    .where(eq(projectContact.projectId, projectId))
    .orderBy(asc(projectContact.id));
}

export async function listProjectChannels(projectId: number): Promise<ProjectChannelRecord[]> {
  return db
    .select()
    .from(projectChannel)
    .where(eq(projectChannel.projectId, projectId))
    .orderBy(asc(projectChannel.id));
}

export async function listProjectStorageLocations(
  projectId: number,
): Promise<ProjectStorageLocationRecord[]> {
  return db
    .select()
    .from(projectStorageLocation)
    .where(eq(projectStorageLocation.projectId, projectId))
    .orderBy(desc(projectStorageLocation.isPrimary), asc(projectStorageLocation.id));
}

export async function upsertProjectContact(
  projectId: number,
  input: UpsertContactInput,
  defaultSource = 'ui',
): Promise<ProjectContactRecord> {
  assertNoPlaintextSecret(input);
  const externalKey = normalizeExternalKey(input.name, input.externalKey);
  const [row] = await db
    .insert(projectContact)
    .values({
      projectId,
      externalKey,
      name: input.name.trim(),
      role: input.role?.trim() ?? '',
      raciRole: input.raciRole?.trim() || 'CONSULTED',
      orgId: input.orgId?.trim() ?? '',
      lifecycleStage: input.lifecycleStage?.trim() || 'ACTIVE_CLIENT',
      primaryEmail: input.primaryEmail?.trim() ?? '',
      phone: input.phone?.trim() ?? '',
      channelHandles: input.channelHandles ?? {},
      source: input.source?.trim() || defaultSource,
    })
    .onConflictDoUpdate({
      target: [projectContact.projectId, projectContact.externalKey],
      set: {
        name: input.name.trim(),
        role: input.role?.trim() ?? '',
        raciRole: input.raciRole?.trim() || 'CONSULTED',
        orgId: input.orgId?.trim() ?? '',
        lifecycleStage: input.lifecycleStage?.trim() || 'ACTIVE_CLIENT',
        primaryEmail: input.primaryEmail?.trim() ?? '',
        phone: input.phone?.trim() ?? '',
        channelHandles: input.channelHandles ?? {},
        source: input.source?.trim() || defaultSource,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row!;
}

export async function deleteProjectContact(projectId: number, externalKey: string): Promise<number> {
  const deleted = await db
    .delete(projectContact)
    .where(and(eq(projectContact.projectId, projectId), eq(projectContact.externalKey, externalKey)))
    .returning({ externalKey: projectContact.externalKey });
  return deleted.length;
}

export async function upsertProjectChannel(
  projectId: number,
  input: UpsertChannelInput,
  defaultSource = 'ui',
): Promise<ProjectChannelRecord> {
  assertNoPlaintextSecret(input);
  const platform = input.platform.trim().toLowerCase();
  const displayName = input.displayName.trim();
  const channelId = normalizeChannelId(platform, displayName, input.channelId);
  const threadType = (input.threadType?.trim() || 'GROUP').toUpperCase();
  const [row] = await db
    .insert(projectChannel)
    .values({
      projectId,
      channelId,
      platform,
      threadType,
      displayName,
      targetId: input.targetId?.trim() ?? '',
      aliases: (input.aliases ?? []).map((a) => a.trim()).filter(Boolean),
      status: input.status?.trim() || 'ACTIVE',
      lastSyncedAt: input.lastSyncedAt ?? null,
      source: input.source?.trim() || defaultSource,
    })
    .onConflictDoUpdate({
      target: [projectChannel.projectId, projectChannel.channelId],
      set: {
        platform,
        threadType,
        displayName,
        targetId: input.targetId?.trim() ?? '',
        aliases: (input.aliases ?? []).map((a) => a.trim()).filter(Boolean),
        status: input.status?.trim() || 'ACTIVE',
        lastSyncedAt: input.lastSyncedAt ?? null,
        source: input.source?.trim() || defaultSource,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row!;
}

export async function deleteProjectChannel(projectId: number, channelId: string): Promise<number> {
  const deleted = await db
    .delete(projectChannel)
    .where(and(eq(projectChannel.projectId, projectId), eq(projectChannel.channelId, channelId)))
    .returning({ channelId: projectChannel.channelId });
  return deleted.length;
}

export async function upsertProjectStorageLocation(
  projectId: number,
  input: UpsertStorageLocationInput,
  defaultSource = 'ui',
): Promise<ProjectStorageLocationRecord> {
  assertNoPlaintextSecret(input);
  const kind = input.kind.trim().toLowerCase();
  const label = input.label.trim();
  const locationId = normalizeLocationId(kind, label, input.locationId);
  const isPrimary = Boolean(input.isPrimary);

  return db.transaction(async (tx) => {
    if (isPrimary) {
      await tx
        .update(projectStorageLocation)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(eq(projectStorageLocation.projectId, projectId));
    }
    const [row] = await tx
      .insert(projectStorageLocation)
      .values({
        projectId,
        locationId,
        kind,
        label,
        uriOrPath: input.uriOrPath.trim(),
        accessScope: input.accessScope?.trim() || 'read_write',
        isPrimary,
        description: input.description?.trim() ?? '',
        source: input.source?.trim() || defaultSource,
      })
      .onConflictDoUpdate({
        target: [projectStorageLocation.projectId, projectStorageLocation.locationId],
        set: {
          kind,
          label,
          uriOrPath: input.uriOrPath.trim(),
          accessScope: input.accessScope?.trim() || 'read_write',
          isPrimary,
          description: input.description?.trim() ?? '',
          source: input.source?.trim() || defaultSource,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row!;
  });
}

export async function deleteProjectStorageLocation(
  projectId: number,
  locationId: string,
): Promise<number> {
  const deleted = await db
    .delete(projectStorageLocation)
    .where(
      and(
        eq(projectStorageLocation.projectId, projectId),
        eq(projectStorageLocation.locationId, locationId),
      ),
    )
    .returning({ locationId: projectStorageLocation.locationId });
  return deleted.length;
}

function deduplicateKey(base: string, used: Set<string>): string {
  let candidate = base;
  let counter = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${counter++}`;
  }
  used.add(candidate);
  return candidate;
}

export async function seedProjectDirectory(
  tx: DbExecutor,
  projectId: number,
  setup: {
    contacts?: UpsertContactInput[];
    channels?: UpsertChannelInput[];
    storageLocations?: UpsertStorageLocationInput[];
  },
): Promise<void> {
  assertNoPlaintextSecret(setup);

  const contacts = setup.contacts ?? [];
  if (contacts.length > 0) {
    const usedKeys = new Set<string>();
    for (const c of contacts) {
      const externalKey = deduplicateKey(normalizeExternalKey(c.name, c.externalKey), usedKeys);
      await tx.insert(projectContact).values({
        projectId,
        externalKey,
        name: c.name.trim(),
        role: c.role?.trim() ?? '',
        raciRole: c.raciRole?.trim() || 'CONSULTED',
        orgId: c.orgId?.trim() ?? '',
        lifecycleStage: c.lifecycleStage?.trim() || 'ACTIVE_CLIENT',
        primaryEmail: c.primaryEmail?.trim() ?? '',
        phone: c.phone?.trim() ?? '',
        channelHandles: c.channelHandles ?? {},
        source: c.source?.trim() || 'project_setup',
      });
    }
  }

  const channels = setup.channels ?? [];
  if (channels.length > 0) {
    const usedIds = new Set<string>();
    for (const ch of channels) {
      const platform = ch.platform.trim().toLowerCase();
      const displayName = ch.displayName.trim();
      const channelId = deduplicateKey(
        normalizeChannelId(platform, displayName, ch.channelId),
        usedIds,
      );
      await tx.insert(projectChannel).values({
        projectId,
        channelId,
        platform,
        threadType: (ch.threadType?.trim() || 'GROUP').toUpperCase(),
        displayName,
        targetId: ch.targetId?.trim() ?? '',
        aliases: (ch.aliases ?? []).map((a) => a.trim()).filter(Boolean),
        status: ch.status?.trim() || 'ACTIVE',
        lastSyncedAt: ch.lastSyncedAt ?? null,
        source: ch.source?.trim() || 'project_setup',
      });
    }
  }

  const storageLocations = setup.storageLocations ?? [];
  if (storageLocations.length > 0) {
    const usedLocIds = new Set<string>();
    const hasExplicitPrimary = storageLocations.some((l) => Boolean(l.isPrimary));
    let assignedFallbackPrimary = false;

    for (const loc of storageLocations) {
      const kind = loc.kind.trim().toLowerCase();
      const label = loc.label.trim();
      const locationId = deduplicateKey(
        normalizeLocationId(kind, label, loc.locationId),
        usedLocIds,
      );
      let isPrimary = Boolean(loc.isPrimary);
      if (!hasExplicitPrimary && !assignedFallbackPrimary && kind === 'local_folder') {
        isPrimary = true;
        assignedFallbackPrimary = true;
      }
      await tx.insert(projectStorageLocation).values({
        projectId,
        locationId,
        kind,
        label,
        uriOrPath: loc.uriOrPath.trim(),
        accessScope: loc.accessScope?.trim() || 'read_write',
        isPrimary,
        description: loc.description?.trim() ?? '',
        source: loc.source?.trim() || 'project_setup',
      });
    }
  }
}
