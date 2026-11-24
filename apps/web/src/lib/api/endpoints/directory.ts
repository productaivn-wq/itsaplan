import { request } from '../core/client';
import { isHostVibeEnabled } from '@/lib/security/hostVibeClient';

export type StorageLocationKind =
  | 'local_folder'
  | 'google_drive'
  | 'git_repo'
  | 'knowledge_base'
  | 'cloud_storage'
  | 'database'
  | 'other';

export type StorageAccessScope = 'read_only' | 'read_write' | 'archive';

export type ChannelThreadType = 'GROUP' | 'CHANNEL' | 'DIRECT' | 'EMAIL';

export interface ProjectContact {
  id: number;
  projectId: number;
  externalKey: string;
  name: string;
  role: string;
  raciRole: string;
  orgId: string;
  lifecycleStage: string;
  primaryEmail: string;
  phone: string;
  channelHandles: Record<string, unknown>;
  source: string;
  projectKey?: string;
  projectName?: string;
  projectRef?: string;
}

export interface ProjectChannel {
  id: number;
  projectId: number;
  channelId: string;
  platform: string;
  threadType: string;
  displayName: string;
  targetId: string;
  aliases: string[];
  status: string;
  lastSyncedAt: string | null;
  source?: string;
  projectKey?: string;
  projectName?: string;
  projectRef?: string;
}

export interface ProjectStorageLocation {
  id: number;
  projectId: number;
  locationId: string;
  kind: StorageLocationKind | string;
  label: string;
  uriOrPath: string;
  accessScope: StorageAccessScope | string;
  isPrimary: boolean;
  description: string;
  source: string;
  projectKey?: string;
  projectName?: string;
  projectRef?: string;
}

export interface DirectoryProjectSummary {
  id: number;
  key: string;
  name: string;
  ref: string;
  contactsCount: number;
  channelsCount: number;
  storageLocationsCount?: number;
  lastActivityAt?: string | null;
}

export interface UpsertProjectContactInput {
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

export interface UpsertProjectChannelInput {
  channelId?: string;
  platform: string;
  threadType?: ChannelThreadType;
  displayName: string;
  targetId?: string;
  aliases?: string[];
  status?: string;
  lastSyncedAt?: string | null;
  source?: string;
}

export interface UpsertProjectStorageLocationInput {
  locationId?: string;
  kind: StorageLocationKind;
  label: string;
  uriOrPath: string;
  accessScope?: StorageAccessScope;
  isPrimary?: boolean;
  description?: string;
  source?: string;
}

export interface ProjectDirectoryResponse {
  scope?: string;
  contacts: ProjectContact[];
  channels: ProjectChannel[];
  groups: ProjectChannel[];
  storageLocations: ProjectStorageLocation[];
  counts: {
    contacts: number;
    channels: number;
    groups: number;
    storageLocations: number;
  };
  portfolioCounts?: {
    contacts: number;
    channels: number;
    groups: number;
    storageLocations: number;
    projects: number;
  };
  projects?: DirectoryProjectSummary[];
  lastSyncedAt?: string | null;
}

export function fetchProjectDirectory(
  projectKey: string,
  scope: 'project' | 'all' = 'project',
): Promise<ProjectDirectoryResponse> {
  const qs = scope === 'all' ? '?scope=all' : '';
  return request<ProjectDirectoryResponse>(
    `/projects/${encodeURIComponent(projectKey)}/directory${qs}`,
  );
}

export function upsertProjectContact(
  projectKey: string,
  input: UpsertProjectContactInput,
): Promise<{ contact: ProjectContact }> {
  return request<{ contact: ProjectContact }>(
    `/projects/${encodeURIComponent(projectKey)}/contacts`,
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export function deleteProjectContact(
  projectKey: string,
  externalKey: string,
): Promise<{ deleted: number }> {
  return request<{ deleted: number }>(
    `/projects/${encodeURIComponent(projectKey)}/contacts/${encodeURIComponent(externalKey)}`,
    { method: 'DELETE' },
  );
}

export function upsertProjectChannel(
  projectKey: string,
  input: UpsertProjectChannelInput,
): Promise<{ channel: ProjectChannel }> {
  return request<{ channel: ProjectChannel }>(
    `/projects/${encodeURIComponent(projectKey)}/channels`,
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export function deleteProjectChannel(
  projectKey: string,
  channelId: string,
): Promise<{ deleted: number }> {
  return request<{ deleted: number }>(
    `/projects/${encodeURIComponent(projectKey)}/channels/${encodeURIComponent(channelId)}`,
    { method: 'DELETE' },
  );
}

export function listProjectStorageLocations(
  projectKey: string,
): Promise<{ storageLocations: ProjectStorageLocation[] }> {
  return request<{ storageLocations: ProjectStorageLocation[] }>(
    `/projects/${encodeURIComponent(projectKey)}/storage-locations`,
  );
}

export function upsertProjectStorageLocation(
  projectKey: string,
  input: UpsertProjectStorageLocationInput,
): Promise<{ storageLocation: ProjectStorageLocation }> {
  return request<{ storageLocation: ProjectStorageLocation }>(
    `/projects/${encodeURIComponent(projectKey)}/storage-locations`,
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export function deleteProjectStorageLocation(
  projectKey: string,
  locationId: string,
): Promise<{ deleted: number }> {
  return request<{ deleted: number }>(
    `/projects/${encodeURIComponent(projectKey)}/storage-locations/${encodeURIComponent(locationId)}`,
    { method: 'DELETE' },
  );
}

export interface DirectoryChannelActivity {
  open_comms: number;
  last_message_at: string;
  last_sender: string;
  last_preview: string;
  total_interactions: number;
  last_interaction_at: string;
  is_muted: boolean;
}

export interface DirectoryContactActivity {
  open_comms: number;
  last_message_at: string;
  last_preview: string;
  total_interactions: number;
  last_interaction_at: string;
  salutation_note?: string | null;
}

export interface DiscoveredInboxChannel {
  key: string;
  platform: string;
  channel_name: string;
  target_handle: string;
  suggested_project_key: string;
  message_count: number;
  last_message_at: string;
  sample_preview: string;
  sample_senders: string[];
}

export interface DiscoveredInboxContact {
  key: string;
  sender: string;
  platform: string;
  channel_name: string;
  channel_id: string;
  target_handle: string;
  suggested_project_key: string;
  message_count: number;
  last_message_at: string;
  sample_preview: string;
}

export interface MutedInboxChannel {
  channel_key: string;
  channel_platform: string;
  display_name: string;
  reason: string;
  muted_at: string;
}

export interface DirectoryInboxSyncResponse {
  inbox_activity_by_channel: Record<string, DirectoryChannelActivity>;
  inbox_activity_by_contact: Record<string, DirectoryContactActivity>;
  discovered_channels: DiscoveredInboxChannel[];
  discovered_contacts: DiscoveredInboxContact[];
  muted_channels: MutedInboxChannel[];
  available_projects?: Array<{ key: string; name: string }>;
  sync_status: {
    last_synced_at: string;
    total_inbox_comms: number;
    linked_comms: number;
    linked_pct: number;
    unlinked_contacts_count: number;
    unregistered_channels_count: number;
    muted_channels_count: number;
    suppressed_noise_count: number;
  };
  bridgeDisabled?: boolean;
}

function emitDirectoryMutated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('itsaplan:directory-mutated'));
    window.dispatchEvent(new CustomEvent('itsaplan:open-office-mutated'));
  }
}

export async function fetchDirectoryInboxSync(
  shortProjectKey?: string | null,
): Promise<DirectoryInboxSyncResponse> {
  if (!isHostVibeEnabled()) {
    return {
      inbox_activity_by_channel: {},
      inbox_activity_by_contact: {},
      discovered_channels: [],
      discovered_contacts: [],
      muted_channels: [],
      sync_status: {
        last_synced_at: '',
        total_inbox_comms: 0,
        linked_comms: 0,
        linked_pct: 100,
        unlinked_contacts_count: 0,
        unregistered_channels_count: 0,
        muted_channels_count: 0,
        suppressed_noise_count: 0,
      },
      bridgeDisabled: true,
    };
  }
  const query = shortProjectKey ? `?project_key=${encodeURIComponent(shortProjectKey)}` : '';
  const res = await fetch(`/api/vibe/directory/inbox-sync${query}`);
  if (!res.ok) {
    throw new Error(`Directory Inbox sync HTTP ${res.status}`);
  }
  return (await res.json()) as DirectoryInboxSyncResponse;
}

async function postVibeDirectory(
  path: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) {
    const msg = typeof data?.error === 'string' ? data.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  emitDirectoryMutated();
  return data ?? { ok: true };
}

export async function triggerDirectorySync(): Promise<Record<string, unknown>> {
  if (!isHostVibeEnabled()) {
    throw new Error('Local workspace bridge is not enabled in client mode');
  }
  return postVibeDirectory('/api/vibe/directory/sync', {});
}

export async function upsertDirectoryContactSynced(
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (!isHostVibeEnabled()) {
    throw new Error('Local workspace bridge is not enabled in client mode');
  }
  return postVibeDirectory('/api/vibe/directory/contacts/upsert', input);
}

export async function deleteDirectoryContactSynced(input: {
  project_key: string;
  external_key: string;
}): Promise<Record<string, unknown>> {
  if (!isHostVibeEnabled()) {
    throw new Error('Local workspace bridge is not enabled in client mode');
  }
  return postVibeDirectory('/api/vibe/directory/contacts/delete', input);
}

export async function upsertDirectoryChannelSynced(
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (!isHostVibeEnabled()) {
    throw new Error('Local workspace bridge is not enabled in client mode');
  }
  return postVibeDirectory('/api/vibe/directory/channels/upsert', input);
}

export async function deleteDirectoryChannelSynced(input: {
  project_key: string;
  channel_id: string;
}): Promise<Record<string, unknown>> {
  if (!isHostVibeEnabled()) {
    throw new Error('Local workspace bridge is not enabled in client mode');
  }
  return postVibeDirectory('/api/vibe/directory/channels/delete', input);
}

export async function setDirectoryChannelMuted(input: {
  muted: boolean;
  channel_key: string;
  channel?: string;
  channel_name?: string;
  reason?: string;
}): Promise<Record<string, unknown>> {
  if (!isHostVibeEnabled()) {
    throw new Error('Local workspace bridge is not enabled in client mode');
  }
  const path = input.muted
    ? '/api/vibe/directory/channels/mute'
    : '/api/vibe/directory/channels/unmute';
  return postVibeDirectory(path, input);
}
