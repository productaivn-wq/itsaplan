'use client';

import { Activity, ArrowUpRight, Bot, FileText, Gauge, ListChecks } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { formatDurationShort } from '@/utils/dates';
import { projectPath } from '@/utils/paths';
import type { UpdateInboxItem } from '../services/inboxStreams';

function kindMeta(kind: UpdateInboxItem['updateKind'], isVi: boolean) {
  switch (kind) {
    case 'document':
      return { label: isVi ? 'Tài liệu' : 'Document', Icon: FileText };
    case 'agent_run':
      return { label: isVi ? 'Tác vụ AI' : 'Agent Run', Icon: Bot };
    case 'metric':
      return { label: isVi ? 'Chỉ số' : 'Metric', Icon: Gauge };
    default:
      return { label: isVi ? 'Công việc' : 'Issue Activity', Icon: ListChecks };
  }
}

export default function InboxUpdateDetail({ item }: { item: UpdateInboxItem }) {
  const locale = useLocale();
  const isVi = locale.toLowerCase().startsWith('vi');
  const { label, Icon } = kindMeta(item.updateKind, isVi);
  const age = item.timestamp ? formatDurationShort(item.timestamp) : '';

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/75 pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {item.projectKey}
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Icon className="size-3" />
                {label}
              </Badge>
              {item.status && (
                <Badge variant="outline" className="text-xs">
                  {item.status}
                </Badge>
              )}
              {age && <span className="text-xs text-muted-foreground tabular-nums">{age}</span>}
            </div>
            <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
            <p className="text-xs text-muted-foreground">
              {item.projectName}
              {item.actorName ? ` · ${item.actorName}` : ''}
            </p>
          </div>
          {item.projectRef && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => navigateFeatureInstant(projectPath(item.projectRef))}
              className="h-8 gap-1.5 rounded-full px-3 text-xs"
            >
              <span>{isVi ? 'Mở dự án' : 'Open Project'}</span>
              <ArrowUpRight className="size-3.5" />
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-border/80 bg-card/60 p-4 text-sm text-foreground">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Activity className="size-3.5" />
            <span>{isVi ? 'Chi tiết cập nhật' : 'Update Summary'}</span>
          </div>
          <p className="leading-relaxed">{item.summary}</p>
        </div>
      </div>
    </div>
  );
}
