'use client';

import * as React from 'react';
import {
  Building2,
  Inbox,
  Lock,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDurationShort } from '@/utils/dates';
import type { DirectoryContactActivity, ProjectContact } from '@/lib/api/endpoints/directory';

function formatHandleValue(val: unknown): string {
  if (typeof val === 'string') {
    return val.startsWith('vault://') ? 'Protected (Vault)' : val;
  }
  if (val && typeof val === 'object') {
    const rec = val as Record<string, unknown>;
    const direct = typeof rec.direct === 'string' ? rec.direct : '';
    if (direct) return direct.startsWith('vault://') ? 'Protected (Vault)' : direct;
    const groups = Array.isArray(rec.groups) ? rec.groups.filter((g) => typeof g === 'string') : [];
    if (groups.length > 0) return `${groups.length} group(s)`;
  }
  return '';
}

export default function DirectoryContactCard({
  contact,
  maskedEmail,
  maskedPhone,
  showProjectBadge,
  activity,
  isVi,
  onEdit,
  onDelete,
  onViewInInbox,
}: {
  contact: ProjectContact;
  maskedEmail: string;
  maskedPhone: string;
  showProjectBadge: boolean;
  activity?: DirectoryContactActivity;
  isVi: boolean;
  onEdit: (c: ProjectContact) => void;
  onDelete: (c: ProjectContact) => void;
  onViewInInbox: (projectKey: string, search: string) => void;
}) {
  const handles = Object.entries(contact.channelHandles ?? {})
    .map(([plat, raw]) => ({ plat, label: formatHandleValue(raw) }))
    .filter((h) => h.label.length > 0);
  const lastTs = activity?.last_message_at || activity?.last_interaction_at || '';

  return (
    <div
      data-testid={`directory-contact-card-${contact.externalKey}`}
      className="flex flex-col gap-2 rounded-xl border border-border/80 bg-card/60 p-3.5 text-xs transition-colors hover:border-border"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {showProjectBadge && contact.projectKey && (
              <Badge variant="outline" className="font-mono text-xs">
                {contact.projectKey}
              </Badge>
            )}
            <span className="text-sm font-semibold text-foreground">{contact.name}</span>
          </div>
          {contact.role && <p className="text-muted-foreground">{contact.role}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Badge variant="outline">{contact.raciRole}</Badge>
          <Badge variant="secondary">
            {contact.source === 'spoke' ? 'Spoke' : contact.source === 'hub_yaml' ? 'Hub' : contact.source}
          </Badge>
          {contact.orgId && (
            <Badge variant="secondary" className="gap-1 font-mono">
              <Building2 className="size-3" />
              {contact.orgId}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 text-muted-foreground">
        {maskedEmail && (
          <span className="inline-flex items-center gap-1">
            {maskedEmail === 'Protected (Vault)' ? (
              <Lock className="size-3 text-amber-500" />
            ) : (
              <Mail className="size-3" />
            )}
            <span>{maskedEmail}</span>
          </span>
        )}
        {maskedPhone && (
          <span className="inline-flex items-center gap-1">
            {maskedPhone === 'Protected (Vault)' ? (
              <Lock className="size-3 text-amber-500" />
            ) : (
              <Phone className="size-3" />
            )}
            <span>{maskedPhone}</span>
          </span>
        )}
        {handles.map((h) => (
          <span
            key={h.plat}
            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/60 px-1.5 py-0.5"
          >
            <MessageSquare className="size-3 text-muted-foreground" />
            <span className="font-medium uppercase">{h.plat}:</span>
            <span>{h.label}</span>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
          {activity && (activity.open_comms > 0 || activity.total_interactions > 0) ? (
            <>
              {activity.open_comms > 0 && (
                <Badge className="bg-[var(--studio-amber-soft)] text-[var(--studio-amber)] hover:bg-[var(--studio-amber-soft)]">
                  {activity.open_comms} {isVi ? 'tin hộp thư' : 'in Inbox'}
                </Badge>
              )}
              {activity.total_interactions > 0 && (
                <span className="tabular-nums">
                  {activity.total_interactions} {isVi ? 'tương tác' : 'interactions'}
                </span>
              )}
              {lastTs && <span>· {formatDurationShort(lastTs)}</span>}
            </>
          ) : (
            <span>{contact.lifecycleStage}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onViewInInbox(contact.projectKey || 'ALL', contact.name)}
            className="h-7 gap-1 px-2 text-xs"
          >
            <Inbox className="size-3" />
            <span>{isVi ? 'Hộp thư' : 'Inbox'}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-testid={`btn-edit-contact-${contact.externalKey}`}
            onClick={() => onEdit(contact)}
            className="h-7 w-7 p-0"
            title={isVi ? 'Chỉnh sửa' : 'Edit'}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-testid={`btn-delete-contact-${contact.externalKey}`}
            onClick={() => onDelete(contact)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            title={isVi ? 'Gỡ khỏi dự án' : 'Remove'}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
