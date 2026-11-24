'use client';

import { ArrowUpRight, Bot, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { formatDurationShort } from '@/utils/dates';
import { openOfficePath } from '@/utils/paths';
import type { HandoffInboxItem } from '../services/inboxStreams';

function eventLabel(eventType: string, isVi: boolean): string {
  switch (eventType) {
    case 'EVIDENCE_SUBMITTED':
      return isVi ? 'Bằng chứng đã nộp' : 'Deliverable Submitted';
    case 'CONTRACT_RETURNED':
      return isVi ? 'Trả về làm lại' : 'Returned for Rework';
    case 'AGENT_STEERED':
      return isVi ? 'Điều hướng trợ lý' : 'Agent Steered';
    case 'LIVE_SESSION':
      return isVi ? 'Đang chạy trực tiếp' : 'Active Session';
    default:
      return isVi ? 'Bàn giao AI' : 'Agent Handoff';
  }
}

export default function InboxHandoffDetail({
  item,
  projectKey,
  isMobile,
  onBack,
  onArchive,
}: {
  item: HandoffInboxItem;
  projectKey: string;
  isMobile: boolean;
  onBack: () => void;
  onArchive: (item: HandoffInboxItem) => void;
}) {
  const isVi = useLocale().toLowerCase().startsWith('vi');
  const ageLabel = item.timestamp ? formatDurationShort(item.timestamp) : '';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b px-4 sm:px-6 xl:px-10">
        {isMobile && (
          <Button variant="ghost" size="sm" className="-ms-2 h-8 gap-1.5" onClick={onBack}>
            <ChevronLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
            {isVi ? 'Hộp thư' : 'Inbox'}
          </Button>
        )}
        <Badge variant={item.isLive ? 'default' : 'secondary'} className="gap-1 text-xs">
          <Bot className="size-3" />
          {eventLabel(item.eventType, isVi)}
        </Badge>
        {item.contractId && (
          <span className="font-mono text-xs text-muted-foreground">{item.contractId}</span>
        )}
        {item.projectKey && (
          <Badge variant="outline" className="font-mono text-xs">
            {item.projectKey}
          </Badge>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 xl:px-10">
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {item.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isVi ? 'Thực hiện bởi' : 'Actor'}{' '}
              <span className="font-medium text-foreground">{item.actorName}</span>
              {ageLabel ? ` · ${ageLabel}` : ''}
            </p>
          </div>

          {item.summary && (
            <section className="space-y-2 border-t border-border pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {isVi ? 'Tóm tắt bàn giao' : 'Handoff Summary'}
              </h3>
              <p className="rounded-md bg-muted/40 px-3 py-2.5 text-sm leading-relaxed text-foreground">
                {item.summary}
              </p>
            </section>
          )}

          {item.evidenceHash && (
            <section className="space-y-1.5 border-t border-border pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {isVi ? 'Mã kiểm chứng' : 'Verification Hash'}
              </h3>
              <p className="break-all font-mono text-xs text-muted-foreground">
                {item.evidenceHash}
              </p>
            </section>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Button
              type="button"
              data-testid="btn-inbox-archive-handoff"
              onClick={() => onArchive(item)}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span>{isVi ? 'Đánh dấu xong (E)' : 'Mark Done (E)'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigateFeatureInstant(openOfficePath(projectKey))}
              className="h-9 gap-1.5 text-xs"
            >
              <span>{isVi ? 'Xem trong Văn phòng mở' : 'Inspect in Open Office'}</span>
              <ArrowUpRight className="size-3.5 shrink-0" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
