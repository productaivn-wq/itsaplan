'use client';

import * as React from 'react';
import { Bell, Inbox, MessageSquare, Pencil, Trash2, VolumeX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDurationShort } from '@/utils/dates';
import type { DirectoryChannelActivity, ProjectChannel } from '@/lib/api/endpoints/directory';

export default function DirectoryChannelCard({
  channel,
  showProjectBadge,
  activity,
  isMuted,
  isVi,
  onToggleMute,
  onEdit,
  onDelete,
  onViewInInbox,
}: {
  channel: ProjectChannel;
  showProjectBadge: boolean;
  activity?: DirectoryChannelActivity;
  isMuted: boolean;
  isVi: boolean;
  onToggleMute: (ch: ProjectChannel, nextMuted: boolean) => void;
  onEdit: (ch: ProjectChannel) => void;
  onDelete: (ch: ProjectChannel) => void;
  onViewInInbox: (projectKey: string, search: string) => void;
}) {
  const aliases = (channel.aliases ?? []).filter(
    (a) => a && a !== channel.displayName && a !== channel.targetId,
  );
  const lastSyncAge = channel.lastSyncedAt ? formatDurationShort(channel.lastSyncedAt) : '';

  return (
    <div
      data-testid={`directory-channel-card-${channel.channelId}`}
      className="flex flex-col gap-2 rounded-xl border border-border/80 bg-card/60 p-3.5 text-xs transition-colors hover:border-border"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {showProjectBadge && channel.projectKey && (
              <Badge variant="outline" className="font-mono text-xs">
                {channel.projectKey}
              </Badge>
            )}
            <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{channel.displayName}</span>
          </div>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {channel.channelId} · {channel.targetId}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Badge variant="outline" className="uppercase">
            {channel.platform}
          </Badge>
          <Badge variant="secondary">{channel.threadType}</Badge>
          <Badge variant={channel.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {channel.status}
          </Badge>
          {isMuted && (
            <Badge variant="destructive" className="gap-1">
              <VolumeX className="size-3" />
              {isVi ? 'Đã tắt' : 'Muted'}
            </Badge>
          )}
        </div>
      </div>

      {aliases.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {aliases.slice(0, 4).map((al) => (
            <span
              key={al}
              className="rounded-md border border-border/60 bg-background/60 px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              {al}
            </span>
          ))}
        </div>
      )}

      {activity?.last_preview && (
        <p className="truncate rounded-md bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
          {activity.last_sender ? `${activity.last_sender}: ` : ''}
          {activity.last_preview}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
          {activity && activity.open_comms > 0 && (
            <Badge className="bg-[var(--studio-amber-soft)] text-[var(--studio-amber)] hover:bg-[var(--studio-amber-soft)]">
              {activity.open_comms} {isVi ? 'tin hộp thư' : 'in Inbox'}
            </Badge>
          )}
          {activity && activity.total_interactions > 0 && (
            <span className="tabular-nums">
              {activity.total_interactions} {isVi ? 'lượt' : 'msgs'}
            </span>
          )}
          {lastSyncAge && (
            <span>
              {isVi ? 'Đồng bộ' : 'Synced'} {lastSyncAge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onViewInInbox(channel.projectKey || 'ALL', channel.displayName)}
            className="h-7 gap-1 px-2 text-xs"
          >
            <Inbox className="size-3" />
            <span>{isVi ? 'Hộp thư' : 'Inbox'}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-testid={`btn-mute-channel-${channel.channelId}`}
            onClick={() => onToggleMute(channel, !isMuted)}
            className="h-7 gap-1 px-2 text-xs"
          >
            {isMuted ? <Bell className="size-3" /> : <VolumeX className="size-3" />}
            <span>{isMuted ? (isVi ? 'Bật lại' : 'Unmute') : isVi ? 'Tắt' : 'Mute'}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-testid={`btn-edit-channel-${channel.channelId}`}
            onClick={() => onEdit(channel)}
            className="h-7 w-7 p-0"
            title={isVi ? 'Chỉnh sửa' : 'Edit'}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-testid={`btn-delete-channel-${channel.channelId}`}
            onClick={() => onDelete(channel)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            title={isVi ? 'Xóa' : 'Delete'}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
