'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  ChevronLeft,
  Clock,
  MailOpen,
  Trash2,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Notification } from '@/lib/api/endpoints/notifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDurationShort } from '@/utils/dates';
import { issuePath, projectRefOf, splitProjectRef } from '@/utils/paths';

function tomorrowMorningIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export default function InboxCrossProjectDetail({
  notification: n,
  currentProjectRef,
  isMobile,
  onBack,
  onToggleRead,
  onSnooze,
  onDelete,
}: {
  notification: Notification;
  currentProjectRef: string;
  isMobile: boolean;
  onBack: () => void;
  onToggleRead: (read: boolean) => void;
  onSnooze: (until: string | null) => void;
  onDelete: () => void;
}) {
  const isVi = useLocale().toLowerCase().startsWith('vi');
  const te = useTranslations('inbox.event');
  const ti = useTranslations('inbox.actions');
  const tc = useTranslations('common');

  const { teamRef } = splitProjectRef(currentProjectRef);
  const targetRef = projectRefOf(teamRef, n.projectKey);
  const targetHref = issuePath(targetRef, n.issueSeq);
  const who = n.actorName ?? te('someone');
  const eventText =
    n.type === 'state_changed'
      ? n.fromState && n.toState
        ? te('stateChanged', { who, from: n.fromState, to: n.toState })
        : te('stateChangedPlain', { who })
      : te(n.type, { who });

  const unread = n.readAt == null;
  const snoozed = n.snoozedUntil != null && new Date(n.snoozedUntil).getTime() > Date.now();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b px-4 sm:px-6 xl:px-10">
        {isMobile && (
          <Button variant="ghost" size="sm" className="-ms-2 h-8 gap-1.5" onClick={onBack}>
            <ChevronLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
            {isVi ? 'Hộp thư' : 'Inbox'}
          </Button>
        )}
        <Badge variant="outline" className="font-mono text-xs">
          {n.projectKey}-{n.issueSeq}
        </Badge>
        <span className="truncate text-xs text-muted-foreground">{n.projectName}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 xl:px-10">
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {n.issueTitle}
            </h2>
            <p className="text-xs text-muted-foreground">
              {eventText} · {formatDurationShort(n.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Button asChild className="h-9 gap-1.5 text-xs font-semibold">
              <Link href={targetHref}>
                <span>
                  {isVi
                    ? `Mở công việc trong ${n.projectKey}`
                    : `Open Issue in ${n.projectKey}`}
                </span>
                <ArrowUpRight className="size-3.5 shrink-0" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onToggleRead(unread)}
              className="h-9 gap-1.5 text-xs"
            >
              <MailOpen className="size-3.5 shrink-0" />
              <span>{unread ? ti('markRead') : ti('markUnread')}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onSnooze(snoozed ? null : tomorrowMorningIso())}
              className="h-9 gap-1.5 text-xs"
            >
              <Clock className="size-3.5 shrink-0" />
              <span>{snoozed ? ti('unsnooze') : ti('tomorrow')}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onDelete}
              className="h-9 gap-1.5 text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5 shrink-0" />
              <span>{tc('delete')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
