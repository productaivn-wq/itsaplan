'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  Cloud,
  Database,
  FolderOpen,
  GitBranch,
  Globe,
  HardDrive,
  Hash,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import type {
  ChannelThreadType,
  StorageAccessScope,
  StorageLocationKind,
  UpsertProjectChannelInput,
  UpsertProjectContactInput,
  UpsertProjectStorageLocationInput,
} from '@/lib/api/endpoints/directory';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface DraftChannelGroup {
  clientId: string;
  channelId?: string;
  platform: string;
  threadType: ChannelThreadType;
  displayName: string;
  targetId: string;
  aliases: string[];
  status?: string;
}

export interface DraftContact {
  clientId: string;
  externalKey?: string;
  name: string;
  role: string;
  raciRole: string;
  primaryEmail: string;
  phone: string;
  channelHandles: Record<string, unknown>;
}

export interface DraftStorageLocation {
  clientId: string;
  locationId?: string;
  kind: StorageLocationKind;
  label: string;
  uriOrPath: string;
  accessScope: StorageAccessScope;
  isPrimary: boolean;
  description: string;
}

export function inferStorageKindFromPath(raw: string): StorageLocationKind {
  const v = raw.trim().toLowerCase();
  if (!v) return 'local_folder';
  if (v.includes('drive.google.com') || v.includes('docs.google.com')) return 'google_drive';
  if (v.includes('github.com') || v.includes('gitlab.com') || v.endsWith('.git')) return 'git_repo';
  if (v.startsWith('s3://') || v.startsWith('r2://') || v.includes('storage.googleapis.com')) {
    return 'cloud_storage';
  }
  if (v.startsWith('postgres://') || v.startsWith('postgresql://') || v.startsWith('sqlite://')) {
    return 'database';
  }
  return 'local_folder';
}

export function toContactInput(c: DraftContact): UpsertProjectContactInput {
  return {
    ...(c.externalKey ? { externalKey: c.externalKey } : {}),
    name: c.name.trim(),
    role: c.role.trim(),
    raciRole: c.raciRole || 'CONSULTED',
    primaryEmail: c.primaryEmail.trim(),
    phone: c.phone.trim(),
    channelHandles: c.channelHandles,
  };
}

export function toChannelInput(ch: DraftChannelGroup): UpsertProjectChannelInput {
  return {
    ...(ch.channelId ? { channelId: ch.channelId } : {}),
    platform: ch.platform.trim().toLowerCase(),
    threadType: ch.threadType,
    displayName: ch.displayName.trim(),
    targetId: ch.targetId.trim(),
    aliases: ch.aliases,
    status: ch.status || 'ACTIVE',
  };
}

export function toStorageLocationInput(
  loc: DraftStorageLocation,
): UpsertProjectStorageLocationInput {
  return {
    ...(loc.locationId ? { locationId: loc.locationId } : {}),
    kind: loc.kind,
    label: loc.label.trim(),
    uriOrPath: loc.uriOrPath.trim(),
    accessScope: loc.accessScope,
    isPrimary: loc.isPrimary,
    description: loc.description.trim(),
  };
}

const SELECT_CLASS =
  'h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const PLATFORMS = [
  'zalo',
  'telegram',
  'discord',
  'email',
  'messenger',
  'viber',
  'whatsapp',
  'slack',
  'phone',
] as const;

const RACI_ROLES = ['ACCOUNTABLE', 'RESPONSIBLE', 'CONSULTED', 'INFORMED'] as const;

const STORAGE_KIND_LABELS: Record<StorageLocationKind, string> = {
  local_folder: 'Local Folder',
  google_drive: 'Google Drive',
  git_repo: 'Git Repo',
  knowledge_base: 'Knowledge Base',
  cloud_storage: 'Cloud Storage',
  database: 'Database',
  other: 'Other',
};

function StorageKindIcon({ kind }: { kind: string }) {
  switch (kind) {
    case 'google_drive':
      return <Cloud className="size-3.5 text-sky-500" />;
    case 'git_repo':
      return <GitBranch className="size-3.5 text-violet-500" />;
    case 'knowledge_base':
      return <Globe className="size-3.5 text-emerald-500" />;
    case 'cloud_storage':
      return <HardDrive className="size-3.5 text-amber-500" />;
    case 'database':
      return <Database className="size-3.5 text-indigo-500" />;
    default:
      return <FolderOpen className="size-3.5 text-primary" />;
  }
}

function makeClientId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Channels & Groups Editor
// ---------------------------------------------------------------------------

export function ChannelsGroupsEditor({
  items,
  onAdd,
  onDelete,
  busy = false,
  pendingDraftRef,
}: {
  items: DraftChannelGroup[];
  onAdd: (item: DraftChannelGroup) => Promise<void> | void;
  onDelete: (item: DraftChannelGroup) => Promise<void> | void;
  busy?: boolean;
  pendingDraftRef?: React.MutableRefObject<(() => DraftChannelGroup | null) | null>;
}) {
  const [threadType, setThreadType] = useState<ChannelThreadType>('GROUP');
  const [platform, setPlatform] = useState<string>('zalo');
  const [displayName, setDisplayName] = useState('');
  const [targetId, setTargetId] = useState('');
  const [aliasesRaw, setAliasesRaw] = useState('');

  const buildDraft = React.useCallback((): DraftChannelGroup | null => {
    const name = displayName.trim();
    if (!name) return null;
    const aliases = aliasesRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      clientId: makeClientId('ch'),
      platform,
      threadType,
      displayName: name,
      targetId: targetId.trim(),
      aliases,
      status: 'ACTIVE',
    };
  }, [displayName, targetId, aliasesRaw, platform, threadType]);

  React.useEffect(() => {
    if (!pendingDraftRef) return;
    pendingDraftRef.current = buildDraft;
    return () => {
      pendingDraftRef.current = null;
    };
  }, [pendingDraftRef, buildDraft]);

  async function handleAdd() {
    const draft = buildDraft();
    if (!draft) return;
    await onAdd(draft);
    setDisplayName('');
    setTargetId('');
    setAliasesRaw('');
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/80 bg-muted/25 p-3 space-y-2.5">
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <select
              aria-label="Channel type"
              value={threadType}
              onChange={(e) => setThreadType(e.target.value as ChannelThreadType)}
              className={cn(SELECT_CLASS, 'w-full')}
            >
              <option value="GROUP">Group</option>
              <option value="CHANNEL">Channel</option>
              <option value="DIRECT">Direct DM</option>
              <option value="EMAIL">Email Thread</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Platform</Label>
            <select
              aria-label="Channel platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className={cn(SELECT_CLASS, 'w-full capitalize')}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Name / Group Title *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="e.g. Nhóm Dự Án Alpha"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label className="text-xs">Group / Channel ID or Handle</Label>
            <Input
              className="h-8 text-xs"
              placeholder="e.g. group_123, #ops-alpha, team@..."
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Aliases (comma-separated)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="e.g. Alpha Ops, Zalo Group"
              value={aliasesRaw}
              onChange={(e) => setAliasesRaw(e.target.value)}
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 gap-1"
            disabled={busy || !displayName.trim()}
            onClick={() => void handleAdd()}
          >
            <Plus className="size-3.5" />
            <span>Add</span>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          No channels or groups added yet.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((ch) => (
            <div
              key={ch.clientId}
              className="flex items-start justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <MessageSquare className="size-3.5 text-primary" />
                  <span className="font-medium text-foreground">{ch.displayName}</span>
                  <Badge variant="outline" className="text-xs uppercase">
                    {ch.threadType}
                  </Badge>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {ch.platform}
                  </Badge>
                </div>
                {(ch.targetId || ch.aliases.length > 0) && (
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
                    {ch.targetId && <span>{ch.targetId}</span>}
                    {ch.aliases.length > 0 && <span>· aliases: {ch.aliases.join(', ')}</span>}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={busy}
                onClick={() => void onDelete(ch)}
                title="Remove"
              >
                <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contacts Editor
// ---------------------------------------------------------------------------

export function ContactsEditor({
  items,
  onAdd,
  onDelete,
  busy = false,
  pendingDraftRef,
}: {
  items: DraftContact[];
  onAdd: (item: DraftContact) => Promise<void> | void;
  onDelete: (item: DraftContact) => Promise<void> | void;
  busy?: boolean;
  pendingDraftRef?: React.MutableRefObject<(() => DraftContact | null) | null>;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [raciRole, setRaciRole] = useState('CONSULTED');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [zaloHandle, setZaloHandle] = useState('');
  const [telegramHandle, setTelegramHandle] = useState('');

  const buildDraft = React.useCallback((): DraftContact | null => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;
    const channelHandles: Record<string, unknown> = {};
    if (zaloHandle.trim()) channelHandles.zalo = { direct: zaloHandle.trim() };
    if (telegramHandle.trim()) channelHandles.telegram = { direct: telegramHandle.trim() };
    return {
      clientId: makeClientId('con'),
      name: trimmedName,
      role: role.trim(),
      raciRole,
      primaryEmail: primaryEmail.trim(),
      phone: phone.trim(),
      channelHandles,
    };
  }, [name, role, raciRole, primaryEmail, phone, zaloHandle, telegramHandle]);

  React.useEffect(() => {
    if (!pendingDraftRef) return;
    pendingDraftRef.current = buildDraft;
    return () => {
      pendingDraftRef.current = null;
    };
  }, [pendingDraftRef, buildDraft]);

  async function handleAdd() {
    const draft = buildDraft();
    if (!draft) return;
    await onAdd(draft);
    setName('');
    setRole('');
    setPrimaryEmail('');
    setPhone('');
    setZaloHandle('');
    setTelegramHandle('');
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/80 bg-muted/25 p-3 space-y-2.5">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Contact Name *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="e.g. Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Title / Role</Label>
            <Input
              className="h-8 text-xs"
              placeholder="e.g. Project Sponsor / Client PM"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">RACI Role</Label>
            <select
              aria-label="RACI Role"
              value={raciRole}
              onChange={(e) => setRaciRole(e.target.value)}
              className={cn(SELECT_CLASS, 'w-full')}
            >
              {RACI_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input
              className="h-8 text-xs"
              placeholder="name@company.com"
              value={primaryEmail}
              onChange={(e) => setPrimaryEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Phone</Label>
            <Input
              className="h-8 text-xs"
              placeholder="09xx..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Zalo Handle</Label>
            <Input
              className="h-8 text-xs"
              placeholder="Zalo display name"
              value={zaloHandle}
              onChange={(e) => setZaloHandle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Telegram</Label>
            <Input
              className="h-8 text-xs"
              placeholder="@username"
              value={telegramHandle}
              onChange={(e) => setTelegramHandle(e.target.value)}
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 gap-1"
            disabled={busy || !name.trim()}
            onClick={() => void handleAdd()}
          >
            <Plus className="size-3.5" />
            <span>Add</span>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          No contacts added yet.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((c) => {
            const handlesText = Object.entries(c.channelHandles ?? {})
              .map(([k, v]) => {
                if (typeof v === 'string') return `${k}: ${v}`;
                if (v && typeof v === 'object' && 'direct' in v) {
                  return `${k}: ${String((v as Record<string, unknown>).direct)}`;
                }
                return '';
              })
              .filter(Boolean)
              .join(' · ');
            return (
              <div
                key={c.clientId}
                className="flex items-start justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Users className="size-3.5 text-primary" />
                    <span className="font-medium text-foreground">{c.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {c.raciRole}
                    </Badge>
                    {c.role && <span className="text-muted-foreground">· {c.role}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {c.primaryEmail && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="size-3" />
                        {c.primaryEmail.startsWith('vault://') ? 'Protected (Vault)' : c.primaryEmail}
                      </span>
                    )}
                    {c.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3" />
                        {c.phone.startsWith('vault://') ? 'Protected (Vault)' : c.phone}
                      </span>
                    )}
                    {handlesText && (
                      <span className="inline-flex items-center gap-1">
                        <Hash className="size-3" />
                        {handlesText}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={busy}
                  onClick={() => void onDelete(c)}
                  title="Remove"
                >
                  <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Storing Locations Editor
// ---------------------------------------------------------------------------

export function StorageLocationsEditor({
  items,
  onAdd,
  onDelete,
  onSetPrimary,
  busy = false,
  pendingDraftRef,
}: {
  items: DraftStorageLocation[];
  onAdd: (item: DraftStorageLocation) => Promise<void> | void;
  onDelete: (item: DraftStorageLocation) => Promise<void> | void;
  onSetPrimary?: (item: DraftStorageLocation) => Promise<void> | void;
  busy?: boolean;
  pendingDraftRef?: React.MutableRefObject<(() => DraftStorageLocation | null) | null>;
}) {
  const [kind, setKind] = useState<StorageLocationKind>('local_folder');
  const [label, setLabel] = useState('');
  const [uriOrPath, setUriOrPath] = useState('');
  const [accessScope, setAccessScope] = useState<StorageAccessScope>('read_write');
  const [isPrimary, setIsPrimary] = useState(items.length === 0);
  const [description, setDescription] = useState('');

  const buildDraft = React.useCallback((): DraftStorageLocation | null => {
    const path = uriOrPath.trim();
    if (!path) return null;
    return {
      clientId: makeClientId('loc'),
      kind,
      label: label.trim() || STORAGE_KIND_LABELS[kind],
      uriOrPath: path,
      accessScope,
      isPrimary,
      description: description.trim(),
    };
  }, [kind, label, uriOrPath, accessScope, isPrimary, description]);

  React.useEffect(() => {
    if (!pendingDraftRef) return;
    pendingDraftRef.current = buildDraft;
    return () => {
      pendingDraftRef.current = null;
    };
  }, [pendingDraftRef, buildDraft]);

  function applyPreset(presetKind: StorageLocationKind, presetLabel: string) {
    setKind(presetKind);
    if (!label.trim()) setLabel(presetLabel);
  }

  async function handleAdd() {
    const draft = buildDraft();
    if (!draft) return;
    await onAdd(draft);
    setLabel('');
    setUriOrPath('');
    setDescription('');
    setIsPrimary(false);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/80 bg-muted/25 p-3 space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Quick presets:</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => applyPreset('local_folder', 'Project Workspace Folder')}
          >
            + Local Folder
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => applyPreset('google_drive', 'Google Drive Docs')}
          >
            + Google Drive
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => applyPreset('git_repo', 'Source Repository')}
          >
            + Git Repo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => applyPreset('knowledge_base', 'Knowledge Base')}
          >
            + Knowledge Base
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Location Kind</Label>
            <select
              aria-label="Storage location kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as StorageLocationKind)}
              className={cn(SELECT_CLASS, 'w-full')}
            >
              {Object.entries(STORAGE_KIND_LABELS).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Label *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="e.g. Main Repo / Shared Drive"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Access Scope</Label>
            <select
              aria-label="Storage access scope"
              value={accessScope}
              onChange={(e) => setAccessScope(e.target.value as StorageAccessScope)}
              className={cn(SELECT_CLASS, 'w-full')}
            >
              <option value="read_write">Read & Write</option>
              <option value="read_only">Read Only</option>
              <option value="archive">Archive</option>
            </select>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Folder Path or URL *</Label>
            <Input
              className="h-8 font-mono text-xs"
              placeholder="~/projects/... or https://drive.google.com/..."
              value={uriOrPath}
              onChange={(e) => setUriOrPath(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">What agents collect here</Label>
            <Input
              className="h-8 text-xs"
              placeholder="e.g. Specs, meeting notes, deliverables"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="rounded border-input"
            />
            <span>Mark as primary storing location</span>
          </label>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 gap-1"
            disabled={busy || !uriOrPath.trim()}
            onClick={() => void handleAdd()}
          >
            <Plus className="size-3.5" />
            <span>Add Location</span>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          No storing locations configured yet.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((loc) => (
            <div
              key={loc.clientId}
              className="flex items-start justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <StorageKindIcon kind={loc.kind} />
                  <span className="font-medium text-foreground">{loc.label}</span>
                  {loc.isPrimary && (
                    <Badge variant="default" className="text-xs">
                      Primary
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {STORAGE_KIND_LABELS[loc.kind as StorageLocationKind] ?? loc.kind}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {loc.accessScope}
                  </Badge>
                </div>
                <div className="truncate font-mono text-xs text-muted-foreground">
                  {loc.uriOrPath}
                </div>
                {loc.description && (
                  <p className="text-xs text-muted-foreground">{loc.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {onSetPrimary && !loc.isPrimary && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={busy}
                    onClick={() => void onSetPrimary(loc)}
                    title="Set as primary"
                  >
                    <Star className="size-3.5 text-muted-foreground hover:text-amber-500" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={busy}
                  onClick={() => void onDelete(loc)}
                  title="Remove"
                >
                  <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
