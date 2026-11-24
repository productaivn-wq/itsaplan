'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  FolderOpen,
  Inbox,
  Link2,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { cn } from '@/lib/utils';
import { inboxPath, splitProjectRef } from '@/utils/paths';
import {
  deleteDirectoryChannelSynced,
  deleteDirectoryContactSynced,
  deleteProjectStorageLocation,
  fetchDirectoryInboxSync,
  fetchProjectDirectory,
  setDirectoryChannelMuted,
  triggerDirectorySync,
  upsertDirectoryChannelSynced,
  upsertDirectoryContactSynced,
  upsertProjectStorageLocation,
  type DiscoveredInboxChannel,
  type DiscoveredInboxContact,
  type MutedInboxChannel,
  type ProjectChannel,
  type ProjectContact,
  type StorageAccessScope,
  type StorageLocationKind,
} from '@/lib/api/endpoints/directory';
import {
  readStoredInboxScope,
  writeInboxFocusTarget,
  writeStoredInboxScope,
} from '@/features/inbox/services/inboxStreams';
import {
  StorageLocationsEditor,
  toStorageLocationInput,
  type DraftStorageLocation,
} from './components/ProjectSourcesEditors';
import DirectoryChannelCard from './DirectoryChannelCard';
import DirectoryContactCard from './DirectoryContactCard';
import { ChannelEditorDialog, ContactEditorDialog } from './DirectoryEditorDialogs';
import DirectoryInboxSyncPanel from './DirectoryInboxSyncPanel';

type DirectoryTab = 'overview' | 'contacts' | 'channels' | 'locations' | 'inbox_sync' | 'muted';

export function maskVaultContactFields(c: ProjectContact): { email: string; phone: string } {
  const email = c.primaryEmail
    ? c.primaryEmail.startsWith('vault://')
      ? 'Protected (Vault)'
      : c.primaryEmail
    : '';
  const phone = c.phone
    ? c.phone.startsWith('vault://')
      ? 'Protected (Vault)'
      : c.phone
    : '';
  return { email, phone };
}

export default function ProjectDirectoryView({ projectKey }: { projectKey: string }) {
  const isVi = useLocale().toLowerCase().startsWith('vi');
  const qc = useQueryClient();
  const shortProjectKey = projectKey.includes('.')
    ? splitProjectRef(projectKey).key
    : projectKey || 'PM';

  const [scope, setScope] = React.useState<'project' | 'all'>(() => readStoredInboxScope());
  const [tab, setTab] = React.useState<DirectoryTab>('overview');
  const [search, setSearch] = React.useState('');
  const [platformFilter, setPlatformFilter] = React.useState('ALL');
  const [projectFilter, setProjectFilter] = React.useState('ALL');
  const [busyKey, setBusyKey] = React.useState<string | null>(null);
  const [contactDialog, setContactDialog] = React.useState<{
    open: boolean;
    initial: ProjectContact | null;
  }>({ open: false, initial: null });
  const [channelDialog, setChannelDialog] = React.useState<{
    open: boolean;
    initial: ProjectChannel | null;
  }>({ open: false, initial: null });

  const dirQuery = useQuery({
    queryKey: ['project-directory', projectKey, scope],
    queryFn: () => fetchProjectDirectory(projectKey, scope),
    enabled: Boolean(projectKey),
  });

  const syncQuery = useQuery({
    queryKey: ['directory-inbox-sync', scope === 'all' ? 'ALL' : shortProjectKey],
    queryFn: () => fetchDirectoryInboxSync(scope === 'all' ? null : shortProjectKey),
    enabled: Boolean(projectKey),
  });

  const refreshAll = React.useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['project-directory'] });
    void qc.invalidateQueries({ queryKey: ['directory-inbox-sync'] });
  }, [qc]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('itsaplan:directory-mutated', refreshAll);
    window.addEventListener('itsaplan:open-office-mutated', refreshAll);
    return () => {
      window.removeEventListener('itsaplan:directory-mutated', refreshAll);
      window.removeEventListener('itsaplan:open-office-mutated', refreshAll);
    };
  }, [refreshAll]);

  const addLocation = useMutation({
    mutationFn: (d: DraftStorageLocation) =>
      upsertProjectStorageLocation(projectKey, toStorageLocationInput(d)),
    onSuccess: () => {
      refreshAll();
      toast.success(isVi ? 'Đã lưu vị trí lưu trữ' : 'Storing location saved');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to save location'),
  });

  const removeLocation = useMutation({
    mutationFn: (locationId: string) => deleteProjectStorageLocation(projectKey, locationId),
    onSuccess: () => {
      refreshAll();
      toast.success(isVi ? 'Đã gỡ vị trí lưu trữ' : 'Storing location removed');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to remove location'),
  });

  const handleScopeChange = (next: 'project' | 'all') => {
    setScope(next);
    setProjectFilter('ALL');
    writeStoredInboxScope(next);
  };

  const handleViewInInbox = (pk: string, qSearch: string) => {
    writeInboxFocusTarget({ bucket: 'comms', projectKey: pk || 'ALL', search: qSearch });
    navigateFeatureInstant(inboxPath(projectKey));
  };

  const contacts = dirQuery.data?.contacts ?? [];
  const channels = dirQuery.data?.channels ?? [];
  const locations: DraftStorageLocation[] = (dirQuery.data?.storageLocations ?? []).map((l) => ({
    clientId: l.locationId,
    locationId: l.locationId,
    kind: l.kind as StorageLocationKind,
    label: l.label,
    uriOrPath: l.uriOrPath,
    accessScope: l.accessScope as StorageAccessScope,
    isPrimary: l.isPrimary,
    description: l.description,
  }));
  const portfolioCounts = dirQuery.data?.portfolioCounts;
  const projectsSummary = dirQuery.data?.projects ?? [];
  const inboxSync = syncQuery.data;
  const mutedChannels = inboxSync?.muted_channels ?? [];
  const discoveredChannels = inboxSync?.discovered_channels ?? [];
  const discoveredContacts = inboxSync?.discovered_contacts ?? [];
  const syncStatus = inboxSync?.sync_status;
  const bridgeEnabled = !inboxSync?.bridgeDisabled;

  const mutedTokenSet = React.useMemo(() => {
    const s = new Set<string>();
    for (const m of mutedChannels) {
      if (m.channel_key) s.add(m.channel_key.toLowerCase());
      if (m.display_name) s.add(m.display_name.toLowerCase());
    }
    return s;
  }, [mutedChannels]);

  const availableProjects = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projectsSummary) map.set(p.key, p.name);
    for (const p of inboxSync?.available_projects ?? []) if (!map.has(p.key)) map.set(p.key, p.name);
    if (!map.has(shortProjectKey)) map.set(shortProjectKey, shortProjectKey);
    return Array.from(map.entries()).map(([key, name]) => ({ key, name }));
  }, [projectsSummary, inboxSync?.available_projects, shortProjectKey]);

  const qLower = search.trim().toLowerCase();
  const filteredContacts = React.useMemo(
    () =>
      contacts.filter((c) => {
        if (scope === 'all' && projectFilter !== 'ALL' && (c.projectKey || '') !== projectFilter) {
          return false;
        }
        if (platformFilter !== 'ALL') {
          const handleKeys = Object.keys(c.channelHandles ?? {}).map((k) => k.toLowerCase());
          if (!handleKeys.includes(platformFilter.toLowerCase())) return false;
        }
        if (!qLower) return true;
        return (
          c.name.toLowerCase().includes(qLower) ||
          c.role.toLowerCase().includes(qLower) ||
          c.orgId.toLowerCase().includes(qLower) ||
          c.externalKey.toLowerCase().includes(qLower) ||
          (c.projectKey ?? '').toLowerCase().includes(qLower) ||
          JSON.stringify(c.channelHandles ?? {}).toLowerCase().includes(qLower)
        );
      }),
    [contacts, scope, projectFilter, platformFilter, qLower],
  );

  const filteredChannels = React.useMemo(
    () =>
      channels.filter((ch) => {
        if (scope === 'all' && projectFilter !== 'ALL' && (ch.projectKey || '') !== projectFilter) {
          return false;
        }
        if (platformFilter !== 'ALL' && ch.platform.toLowerCase() !== platformFilter.toLowerCase()) {
          return false;
        }
        if (!qLower) return true;
        return (
          ch.displayName.toLowerCase().includes(qLower) ||
          ch.channelId.toLowerCase().includes(qLower) ||
          ch.targetId.toLowerCase().includes(qLower) ||
          (ch.projectKey ?? '').toLowerCase().includes(qLower) ||
          (ch.aliases ?? []).some((a) => a.toLowerCase().includes(qLower))
        );
      }),
    [channels, scope, projectFilter, platformFilter, qLower],
  );

  const attentionCount = discoveredChannels.length + discoveredContacts.length;
  const activeChannelCount = channels.filter((c) => c.status === 'ACTIVE').length;

  const runAction = async (key: string, fn: () => Promise<unknown>, okMsg: string) => {
    setBusyKey(key);
    try {
      await fn();
      toast.success(okMsg);
      refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyKey(null);
    }
  };

  if (dirQuery.isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading project directory...</div>;
  }
  if (dirQuery.error) {
    return (
      <div className="p-6 text-sm text-destructive">
        {dirQuery.error instanceof Error ? dirQuery.error.message : 'Unable to load project directory.'}
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto">
      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {isVi ? 'Danh bạ Dự án & Nguồn dữ liệu' : 'Project Directory & Sources'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {scope === 'all'
                ? isVi
                  ? `Danh bạ đồng bộ toàn danh mục (${portfolioCounts?.projects ?? 0} dự án có dữ liệu)`
                  : `Synced contacts, channels, and storage across ${portfolioCounts?.projects ?? 0} active projects`
                : isVi
                  ? `Liên hệ, kênh liên lạc và nơi lưu trữ đồng bộ cho ${projectKey}`
                  : `Synced contacts, communication channels, and storing locations for ${projectKey}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-full border border-border/85 bg-muted/65 p-1">
              <button
                type="button"
                data-testid="btn-directory-scope-project"
                aria-pressed={scope === 'project'}
                onClick={() => handleScopeChange('project')}
                className={cn(
                  'inline-flex h-7 items-center rounded-full px-3 text-xs transition-all',
                  scope === 'project'
                    ? 'bg-foreground font-semibold text-background shadow-xs'
                    : 'font-medium text-muted-foreground hover:text-foreground',
                )}
              >
                {isVi ? `Dự án (${shortProjectKey})` : `This Project (${shortProjectKey})`}
              </button>
              <button
                type="button"
                data-testid="btn-directory-scope-all"
                aria-pressed={scope === 'all'}
                onClick={() => handleScopeChange('all')}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs transition-all',
                  scope === 'all'
                    ? 'bg-foreground font-semibold text-background shadow-xs'
                    : 'font-medium text-muted-foreground hover:text-foreground',
                )}
              >
                <span>{isVi ? 'Toàn danh mục' : 'All Projects'}</span>
                {scope === 'project' && portfolioCounts && portfolioCounts.contacts > contacts.length && (
                  <span className="rounded-full bg-[var(--studio-amber-soft)] px-1.5 text-xs font-semibold tabular-nums text-[var(--studio-amber)]">
                    {portfolioCounts.contacts}
                  </span>
                )}
              </button>
            </div>
            {bridgeEnabled && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-testid="btn-directory-sync-now"
                  disabled={busyKey === 'sync'}
                  onClick={() =>
                    void runAction(
                      'sync',
                      () => triggerDirectorySync(),
                      isVi ? 'Đã đồng bộ Danh bạ ↔ Hộp thư ↔ PG' : 'Synced Directory ↔ Inbox ↔ PG',
                    )
                  }
                  className="h-8 gap-1.5 text-xs"
                >
                  <RefreshCw className={cn('size-3.5', busyKey === 'sync' && 'animate-spin')} />
                  <span>{isVi ? 'Đồng bộ' : 'Sync Now'}</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-testid="btn-directory-add-contact"
                  onClick={() => setContactDialog({ open: true, initial: null })}
                  className="h-8 gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  <span>{isVi ? 'Liên hệ' : 'Contact'}</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-testid="btn-directory-add-channel"
                  onClick={() => setChannelDialog({ open: true, initial: null })}
                  className="h-8 gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  <span>{isVi ? 'Kênh' : 'Channel'}</span>
                </Button>
              </>
            )}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => navigateFeatureInstant(inboxPath(projectKey))}
              className="h-8 gap-1.5 text-xs"
            >
              <Inbox className="size-3.5" />
              <span>{isVi ? 'Hộp thư' : 'Inbox'}</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/80">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">{isVi ? 'Liên hệ' : 'Contacts'}</p>
                <p className="text-xl font-semibold tabular-nums">{contacts.length}</p>
              </div>
              <Users className="size-5 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card className="border-border/80">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">{isVi ? 'Kênh liên lạc' : 'Channels'}</p>
                <p className="text-xl font-semibold tabular-nums">
                  {activeChannelCount}{' '}
                  <span className="text-xs font-normal text-muted-foreground">/ {channels.length}</span>
                </p>
              </div>
              <MessageSquare className="size-5 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card className="border-border/80">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">{isVi ? 'Đồng bộ Hộp thư' : 'Inbox Match Rate'}</p>
                <p className="text-xl font-semibold tabular-nums">
                  {syncStatus ? `${syncStatus.linked_pct}%` : '—'}
                </p>
              </div>
              <Activity className="size-5 text-emerald-500" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-border/80 transition-colors hover:border-amber-500/50"
            onClick={() => setTab('inbox_sync')}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">{isVi ? 'Chưa liên kết Hộp thư' : 'Needs Inbox Link'}</p>
                <p className="text-xl font-semibold tabular-nums text-[var(--studio-amber)]">{attentionCount}</p>
              </div>
              <Link2 className="size-5 text-[var(--studio-amber)]" />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-border/85 bg-muted/65 p-1">
            {(
              [
                { id: 'overview', label: isVi ? 'Tổng quan' : 'Overview' },
                { id: 'contacts', label: `${isVi ? 'Liên hệ' : 'Contacts'} (${filteredContacts.length})` },
                { id: 'channels', label: `${isVi ? 'Kênh' : 'Channels'} (${filteredChannels.length})` },
                { id: 'locations', label: `${isVi ? 'Lưu trữ' : 'Locations'} (${locations.length})` },
                { id: 'inbox_sync', label: `${isVi ? 'Đồng bộ Hộp thư' : 'Inbox Sync'} (${attentionCount})` },
                { id: 'muted', label: `${isVi ? 'Đã tắt' : 'Muted'} (${mutedChannels.length})` },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                data-testid={`tab-directory-${t.id}`}
                onClick={() => setTab(t.id)}
                className={cn(
                  'inline-flex h-7 items-center rounded-full px-3 text-xs transition-all',
                  tab === t.id
                    ? 'bg-foreground font-semibold text-background shadow-xs'
                    : 'font-medium text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-56">
              <Search className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isVi ? 'Tìm tên, kênh, handle...' : 'Search name, channel, handle...'}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <select
              aria-label="Platform filter"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
            >
              <option value="ALL">{isVi ? 'Mọi nền tảng' : 'All platforms'}</option>
              {['zalo', 'telegram', 'email', 'discord', 'messenger', 'viber'].map((pl) => (
                <option key={pl} value={pl}>
                  {pl.toUpperCase()}
                </option>
              ))}
            </select>
            {scope === 'all' && (
              <select
                aria-label="Project filter"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="h-8 rounded-md border border-border bg-background px-2 font-mono text-xs"
              >
                <option value="ALL">{isVi ? 'Tất cả dự án' : 'All projects'}</option>
                {projectsSummary
                  .filter((p) => p.contactsCount > 0 || p.channelsCount > 0)
                  .map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.key} ({p.contactsCount}c · {p.channelsCount}ch)
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>

        {(tab === 'overview' || tab === 'contacts' || tab === 'channels') && (
          <div className={cn('grid gap-6', tab === 'overview' ? 'lg:grid-cols-2' : 'grid-cols-1')}>
            {(tab === 'overview' || tab === 'contacts') && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Users className="size-4" />
                    {isVi ? 'Liên hệ' : 'Contacts'} ({filteredContacts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredContacts.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {isVi ? 'Không có liên hệ nào phù hợp.' : 'No contacts match the current filter.'}
                    </p>
                  ) : (
                    filteredContacts.map((c) => {
                      const masked = maskVaultContactFields(c);
                      return (
                        <DirectoryContactCard
                          key={`${c.projectId}-${c.externalKey}`}
                          contact={c}
                          maskedEmail={masked.email}
                          maskedPhone={masked.phone}
                          showProjectBadge={scope === 'all'}
                          activity={inboxSync?.inbox_activity_by_contact?.[c.externalKey]}
                          isVi={isVi}
                          onEdit={(item) => setContactDialog({ open: true, initial: item })}
                          onDelete={(item) =>
                            void runAction(
                              `del-c:${item.externalKey}`,
                              () =>
                                deleteDirectoryContactSynced({
                                  project_key: item.projectKey || shortProjectKey,
                                  external_key: item.externalKey,
                                }),
                              isVi ? `Đã gỡ ${item.name}` : `Removed ${item.name}`,
                            )
                          }
                          onViewInInbox={handleViewInInbox}
                        />
                      );
                    })
                  )}
                </CardContent>
              </Card>
            )}

            {(tab === 'overview' || tab === 'channels') && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="size-4" />
                    {isVi ? 'Kênh liên lạc' : 'Communication Channels'} ({filteredChannels.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredChannels.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {isVi ? 'Không có kênh nào phù hợp.' : 'No channels match the current filter.'}
                    </p>
                  ) : (
                    filteredChannels.map((ch) => {
                      const act =
                        inboxSync?.inbox_activity_by_channel?.[ch.channelId] ||
                        inboxSync?.inbox_activity_by_channel?.[ch.displayName.toLowerCase()];
                      const isMuted =
                        Boolean(act?.is_muted) ||
                        mutedTokenSet.has(ch.channelId.toLowerCase()) ||
                        mutedTokenSet.has(ch.displayName.toLowerCase()) ||
                        mutedTokenSet.has(ch.targetId.toLowerCase());
                      return (
                        <DirectoryChannelCard
                          key={`${ch.projectId}-${ch.channelId}`}
                          channel={ch}
                          showProjectBadge={scope === 'all'}
                          activity={act}
                          isMuted={isMuted}
                          isVi={isVi}
                          onToggleMute={(item, nextMuted) =>
                            void runAction(
                              `mute:${item.channelId}`,
                              () =>
                                setDirectoryChannelMuted({
                                  muted: nextMuted,
                                  channel_key: item.channelId,
                                  channel: item.platform,
                                  channel_name: item.displayName,
                                }),
                              nextMuted
                                ? isVi
                                  ? `Đã tắt ${item.displayName}`
                                  : `Muted ${item.displayName}`
                                : isVi
                                  ? `Đã bật lại ${item.displayName}`
                                  : `Unmuted ${item.displayName}`,
                            )
                          }
                          onEdit={(item) => setChannelDialog({ open: true, initial: item })}
                          onDelete={(item) =>
                            void runAction(
                              `del-ch:${item.channelId}`,
                              () =>
                                deleteDirectoryChannelSynced({
                                  project_key: item.projectKey || shortProjectKey,
                                  channel_id: item.channelId,
                                }),
                              isVi ? `Đã xóa kênh ${item.displayName}` : `Deleted ${item.displayName}`,
                            )
                          }
                          onViewInInbox={handleViewInInbox}
                        />
                      );
                    })
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {(tab === 'overview' || tab === 'locations') && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FolderOpen className="size-4 text-primary" />
                {isVi ? 'Nơi lưu trữ dự án' : 'Storing Locations'} ({locations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StorageLocationsEditor
                items={locations}
                busy={addLocation.isPending || removeLocation.isPending}
                onAdd={async (d) => {
                  await addLocation.mutateAsync(d);
                }}
                onDelete={async (d) => {
                  if (d.locationId) await removeLocation.mutateAsync(d.locationId);
                }}
                onSetPrimary={async (d) => {
                  await addLocation.mutateAsync({ ...d, isPrimary: true });
                }}
              />
            </CardContent>
          </Card>
        )}

        {(tab === 'inbox_sync' || tab === 'muted') && (
          <DirectoryInboxSyncPanel
            discoveredChannels={discoveredChannels}
            discoveredContacts={discoveredContacts}
            mutedChannels={mutedChannels}
            availableProjects={availableProjects}
            showMutedOnly={tab === 'muted'}
            isVi={isVi}
            busyKey={busyKey}
            onRegisterChannel={(ch: DiscoveredInboxChannel, pk: string) =>
              void runAction(
                `reg:${ch.key}`,
                () =>
                  upsertDirectoryChannelSynced({
                    project_key: pk,
                    platform: ch.platform,
                    display_name: ch.channel_name,
                    target_id: ch.target_handle || ch.channel_name,
                    aliases: [ch.channel_name, ch.target_handle].filter(Boolean),
                  }),
                isVi ? `Đã đăng ký kênh ${ch.channel_name} vào ${pk}` : `Registered ${ch.channel_name} to ${pk}`,
              )
            }
            onMuteDiscoveredChannel={(ch: DiscoveredInboxChannel) =>
              void runAction(
                `mute:${ch.key}`,
                () =>
                  setDirectoryChannelMuted({
                    muted: true,
                    channel_key: ch.target_handle || ch.channel_name,
                    channel: ch.platform,
                    channel_name: ch.channel_name,
                  }),
                isVi ? `Đã tắt theo dõi ${ch.channel_name}` : `Muted ${ch.channel_name}`,
              )
            }
            onBindContact={(c: DiscoveredInboxContact, pk: string) =>
              void runAction(
                `bind:${c.key}`,
                () =>
                  upsertDirectoryContactSynced({
                    project_key: pk,
                    name: c.sender,
                    channel_handles: { [c.platform]: { direct: c.sender } },
                  }),
                isVi ? `Đã lưu ${c.sender} vào ${pk}` : `Saved ${c.sender} to ${pk}`,
              )
            }
            onUnmuteChannel={(m: MutedInboxChannel) =>
              void runAction(
                `unmute:${m.channel_key}`,
                () =>
                  setDirectoryChannelMuted({
                    muted: false,
                    channel_key: m.channel_key,
                    channel: m.channel_platform,
                    channel_name: m.display_name,
                  }),
                isVi ? `Đã bật lại ${m.display_name || m.channel_key}` : `Unmuted ${m.display_name || m.channel_key}`,
              )
            }
          />
        )}

        <ContactEditorDialog
          open={contactDialog.open}
          onOpenChange={(open) => setContactDialog((p) => ({ ...p, open }))}
          initial={contactDialog.initial}
          defaultProjectKey={shortProjectKey}
          availableProjects={availableProjects}
          isVi={isVi}
          saving={busyKey === 'save-contact'}
          onSave={(payload) =>
            void runAction(
              'save-contact',
              async () => {
                await upsertDirectoryContactSynced(payload);
                setContactDialog({ open: false, initial: null });
              },
              isVi ? 'Đã lưu liên hệ và đồng bộ' : 'Contact saved & synced',
            )
          }
        />

        <ChannelEditorDialog
          open={channelDialog.open}
          onOpenChange={(open) => setChannelDialog((p) => ({ ...p, open }))}
          initial={channelDialog.initial}
          defaultProjectKey={shortProjectKey}
          availableProjects={availableProjects}
          isVi={isVi}
          saving={busyKey === 'save-channel'}
          onSave={(payload) =>
            void runAction(
              'save-channel',
              async () => {
                await upsertDirectoryChannelSynced(payload);
                setChannelDialog({ open: false, initial: null });
              },
              isVi ? 'Đã lưu kênh và đồng bộ' : 'Channel saved & synced',
            )
          }
        />
      </div>
    </div>
  );
}
