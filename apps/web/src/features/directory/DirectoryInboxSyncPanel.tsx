'use client';

import * as React from 'react';
import { Bell, CheckCircle2, Link2, MessageSquarePlus, UserPlus, VolumeX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDurationShort } from '@/utils/dates';
import type {
  DiscoveredInboxChannel,
  DiscoveredInboxContact,
  MutedInboxChannel,
} from '@/lib/api/endpoints/directory';

export default function DirectoryInboxSyncPanel({
  discoveredChannels,
  discoveredContacts,
  mutedChannels,
  availableProjects,
  showMutedOnly = false,
  isVi,
  busyKey,
  onRegisterChannel,
  onMuteDiscoveredChannel,
  onBindContact,
  onUnmuteChannel,
}: {
  discoveredChannels: DiscoveredInboxChannel[];
  discoveredContacts: DiscoveredInboxContact[];
  mutedChannels: MutedInboxChannel[];
  availableProjects: Array<{ key: string; name: string }>;
  showMutedOnly?: boolean;
  isVi: boolean;
  busyKey: string | null;
  onRegisterChannel: (ch: DiscoveredInboxChannel, projectKey: string) => void;
  onMuteDiscoveredChannel: (ch: DiscoveredInboxChannel) => void;
  onBindContact: (c: DiscoveredInboxContact, projectKey: string) => void;
  onUnmuteChannel: (m: MutedInboxChannel) => void;
}) {
  const [projChoice, setProjChoice] = React.useState<Record<string, string>>({});

  const pickProject = (key: string, fallback: string) => projChoice[key] || fallback || 'PM';

  if (showMutedOnly) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <VolumeX className="size-4" />
            {isVi ? `Kênh đang tắt theo dõi (${mutedChannels.length})` : `Muted Inbox Channels (${mutedChannels.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mutedChannels.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {isVi ? 'Không có kênh nào đang bị tắt theo dõi.' : 'No muted channels in Inbox.'}
            </p>
          ) : (
            mutedChannels.map((m) => (
              <div
                key={m.channel_key}
                data-testid={`muted-channel-row-${m.channel_key}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/60 p-3 text-xs"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="uppercase">
                      {m.channel_platform || 'zalo'}
                    </Badge>
                    <span className="font-medium text-foreground">{m.display_name || m.channel_key}</span>
                  </div>
                  <p className="text-muted-foreground">
                    {m.reason} {m.muted_at ? `· ${formatDurationShort(m.muted_at)}` : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-testid={`btn-unmute-${m.channel_key}`}
                  disabled={busyKey === `unmute:${m.channel_key}`}
                  onClick={() => onUnmuteChannel(m)}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Bell className="size-3.5" />
                  <span>{isVi ? 'Bật lại' : 'Unmute'}</span>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <MessageSquarePlus className="size-4" />
            {isVi
              ? `Kênh phát hiện từ Hộp thư (${discoveredChannels.length})`
              : `Unregistered Channels from Inbox (${discoveredChannels.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {discoveredChannels.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span>
                {isVi
                  ? 'Tất cả kênh hoạt động trong Hộp thư đã được đăng ký.'
                  : 'All active Inbox channels are registered in the Directory.'}
              </span>
            </div>
          ) : (
            discoveredChannels.map((ch) => {
              const targetProj = pickProject(ch.key, ch.suggested_project_key);
              return (
                <div
                  key={ch.key}
                  data-testid={`discovered-channel-${ch.key}`}
                  className="flex flex-col gap-2 rounded-xl border border-border/80 bg-card/60 p-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="uppercase">
                        {ch.platform}
                      </Badge>
                      <span className="font-semibold text-foreground">{ch.channel_name}</span>
                    </div>
                    <Badge variant="secondary" className="tabular-nums">
                      {ch.message_count} {isVi ? 'tin' : 'msgs'}
                    </Badge>
                  </div>
                  {ch.sample_preview && (
                    <p className="truncate text-muted-foreground">{ch.sample_preview}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <select
                      aria-label={isVi ? 'Chọn dự án' : 'Select project'}
                      value={targetProj}
                      onChange={(e) => setProjChoice((p) => ({ ...p, [ch.key]: e.target.value }))}
                      className="h-7 rounded-md border border-border bg-background px-2 font-mono text-xs"
                    >
                      {availableProjects.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.key} — {p.name}
                        </option>
                      ))}
                      {!availableProjects.some((p) => p.key === targetProj) && (
                        <option value={targetProj}>{targetProj}</option>
                      )}
                    </select>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busyKey === `mute:${ch.key}`}
                        onClick={() => onMuteDiscoveredChannel(ch)}
                        className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                      >
                        <VolumeX className="size-3" />
                        <span>{isVi ? 'Tắt' : 'Mute'}</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        data-testid={`btn-register-channel-${ch.key}`}
                        disabled={busyKey === `reg:${ch.key}`}
                        onClick={() => onRegisterChannel(ch, targetProj)}
                        className="h-7 gap-1 px-2.5 text-xs"
                      >
                        <Link2 className="size-3" />
                        <span>{isVi ? 'Đăng ký kênh' : 'Register Channel'}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <UserPlus className="size-4" />
            {isVi
              ? `Người gửi chưa có trong Danh bạ (${discoveredContacts.length})`
              : `Unlinked Senders from Inbox (${discoveredContacts.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {discoveredContacts.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span>
                {isVi
                  ? 'Tất cả người gửi trong Hộp thư đã được liên kết với Danh bạ.'
                  : 'All Inbox senders are linked to Directory contacts.'}
              </span>
            </div>
          ) : (
            discoveredContacts.map((c) => {
              const targetProj = pickProject(c.key, c.suggested_project_key);
              return (
                <div
                  key={c.key}
                  data-testid={`discovered-contact-${c.key}`}
                  className="flex flex-col gap-2 rounded-xl border border-border/80 bg-card/60 p-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="uppercase">
                        {c.platform}
                      </Badge>
                      <span className="font-semibold text-foreground">{c.sender}</span>
                    </div>
                    <Badge variant="secondary" className="tabular-nums">
                      {c.message_count} {isVi ? 'tin' : 'msgs'}
                    </Badge>
                  </div>
                  <p className="truncate text-muted-foreground">
                    {c.channel_name}
                    {c.sample_preview ? ` · ${c.sample_preview}` : ''}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <select
                      aria-label={isVi ? 'Chọn dự án' : 'Select project'}
                      value={targetProj}
                      onChange={(e) => setProjChoice((p) => ({ ...p, [c.key]: e.target.value }))}
                      className="h-7 rounded-md border border-border bg-background px-2 font-mono text-xs"
                    >
                      {availableProjects.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.key} — {p.name}
                        </option>
                      ))}
                      {!availableProjects.some((p) => p.key === targetProj) && (
                        <option value={targetProj}>{targetProj}</option>
                      )}
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      data-testid={`btn-bind-contact-${c.key}`}
                      disabled={busyKey === `bind:${c.key}`}
                      onClick={() => onBindContact(c, targetProj)}
                      className="h-7 gap-1 px-2.5 text-xs"
                    >
                      <UserPlus className="size-3" />
                      <span>{isVi ? 'Lưu vào Danh bạ' : 'Add to Directory'}</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
