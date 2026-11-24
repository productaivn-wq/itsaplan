'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ListTodo,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDurationShort } from '@/utils/dates';
import { issuePath, projectRefOf, splitProjectRef } from '@/utils/paths';
import {
  submitInboxTriageAction,
  type QueueTaskInboxItem,
} from '../services/inboxStreams';

function formatQueueCategory(category: QueueTaskInboxItem['category'], isVi: boolean): string {
  switch (category) {
    case 'blocked_task':
      return isVi ? 'Đang bị chặn' : 'Blocked Task';
    case 'schedule_alert':
      return isVi ? 'Cảnh báo lịch trình' : 'Schedule Alert';
    case 'failed_run':
      return isVi ? 'Lỗi chạy tự động' : 'Failed Run';
    default:
      return isVi ? 'Việc chờ xử lý' : 'Queued Work';
  }
}

export default function InboxQueueDetail({
  item,
  currentProjectRef,
  isMobile,
  onBack,
  onResolved,
}: {
  item: QueueTaskInboxItem;
  currentProjectRef: string;
  isMobile: boolean;
  onBack: () => void;
  onResolved: (itemId: string) => void;
}) {
  const isVi = useLocale().toLowerCase().startsWith('vi');
  const [submitting, setSubmitting] = React.useState<'dispatch' | 'dismiss' | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setError(null);
    setSubmitting(null);
  }, [item.id]);

  const teamRef = currentProjectRef.includes('.')
    ? splitProjectRef(currentProjectRef).teamRef
    : 'thanb';
  const issueHref =
    item.issueSeq != null
      ? issuePath(projectRefOf(teamRef, item.projectKey), item.issueSeq)
      : null;

  const categoryLabel = formatQueueCategory(item.category, isVi);
  const ageLabel = item.timestamp ? formatDurationShort(item.timestamp) : '';

  const handleDispatch = async () => {
    if (submitting) return;
    setSubmitting('dispatch');
    setError(null);
    try {
      await submitInboxTriageAction({
        action: 'dispatch_to_agent',
        itemId: item.id,
        title: `${item.taskKey}: ${item.title}`,
        projectKey: item.projectKey || 'PM',
        inputScope: item.taskKey,
      });
      toast.success(
        isVi
          ? `Đã giao ${item.taskKey} cho trợ lý AI`
          : `Dispatched ${item.taskKey} to agent`,
      );
      onResolved(item.id);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : isVi
            ? 'Không thể giao việc cho trợ lý AI.'
            : 'Unable to dispatch queued task.',
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleDismiss = async () => {
    if (submitting) return;
    setSubmitting('dismiss');
    setError(null);
    try {
      await submitInboxTriageAction({
        action: 'dismiss',
        itemId: item.id,
      });
      toast.success(isVi ? `Đã ẩn ${item.taskKey}` : `Dismissed ${item.taskKey}`);
      onResolved(item.id);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : isVi
            ? 'Không thể ẩn mục hàng đợi.'
            : 'Unable to dismiss queued item.',
      );
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b px-4 sm:px-6 xl:px-10">
        {isMobile && (
          <Button variant="ghost" size="sm" className="-ms-2 h-8 gap-1.5" onClick={onBack}>
            <ChevronLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
            {isVi ? 'Hộp thư' : 'Inbox'}
          </Button>
        )}
        <Badge
          variant={
            item.category === 'failed_run' || item.category === 'blocked_task'
              ? 'destructive'
              : 'secondary'
          }
          className="gap-1 text-xs"
        >
          {item.category === 'schedule_alert' ? (
            <CalendarClock className="size-3" />
          ) : item.category === 'failed_run' || item.category === 'blocked_task' ? (
            <AlertTriangle className="size-3" />
          ) : (
            <ListTodo className="size-3" />
          )}
          {categoryLabel}
        </Badge>
        <span className="font-mono text-xs text-muted-foreground">{item.taskKey}</span>
        {item.projectKey && (
          <Badge variant="outline" className="font-mono text-xs">
            {item.projectKey}
          </Badge>
        )}
        <Badge variant="secondary" className="text-xs">
          {item.priority}
        </Badge>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 xl:px-10">
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {item.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {item.projectName} · {item.status}
              {item.dueDate ? ` · Due ${item.dueDate.slice(0, 10)}` : ''}
              {ageLabel ? ` · ${ageLabel}` : ''}
            </p>
          </div>

          {item.summary && (
            <section className="space-y-2 border-t border-border pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {isVi ? 'Chi tiết hàng đợi' : 'Queue Context'}
              </h3>
              <p className="rounded-md bg-muted/40 px-3 py-2.5 text-sm leading-relaxed text-foreground">
                {item.summary}
              </p>
            </section>
          )}

          {error && (
            <div
              role="alert"
              data-testid="inbox-queue-error"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            {issueHref && (
              <Button asChild className="h-9 gap-1.5 text-xs font-semibold">
                <Link href={issueHref}>
                  <span>
                    {isVi
                      ? `Mở công việc trong ${item.projectKey}`
                      : `Open Issue in ${item.projectKey}`}
                  </span>
                  <ArrowUpRight className="size-3.5 shrink-0" />
                </Link>
              </Button>
            )}
            <Button
              type="button"
              variant={issueHref ? 'outline' : 'default'}
              data-testid="btn-inbox-queue-dispatch"
              disabled={submitting !== null}
              onClick={() => void handleDispatch()}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <Bot className="size-3.5 shrink-0" />
              <span>
                {submitting === 'dispatch'
                  ? isVi
                    ? 'Đang giao...'
                    : 'Dispatching...'
                  : isVi
                    ? 'Giao cho Trợ lý AI'
                    : 'Dispatch to Agent'}
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              data-testid="btn-inbox-queue-dismiss"
              disabled={submitting !== null}
              onClick={() => void handleDismiss()}
              className="h-9 gap-1.5 text-xs"
            >
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span>{isVi ? 'Bỏ qua (E)' : 'Dismiss (E)'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
