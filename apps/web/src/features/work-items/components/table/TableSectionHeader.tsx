import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type IssueGroup } from '@/utils/project';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GroupDot } from '../shared/GroupDot';
import { TableDropZone } from './TableDropZone';

// A primary group header row. A drop onto it appends to the group's bucket
// (disabled when sub-grouped, where issues live under sub-headers).
export function TableSectionHeader({
  group,
  count,
  collapsed,
  disabled,
  dropId,
  onDrop,
  onToggle,
  onAddIssue,
  readOnly,
}: {
  group: IssueGroup;
  count: number;
  collapsed: boolean;
  disabled: boolean;
  dropId: string;
  onDrop: (issueId: number) => void;
  onToggle: () => void;
  onAddIssue: () => void;
  // In a read-only share the add affordance is hidden.
  readOnly?: boolean;
}) {
  const t = useTranslations('workItems');
  const { can } = usePermissions();
  const canCreateIssue = can('work_items', 'create') && !readOnly;
  return (
    <TableDropZone
      id={dropId}
      disabled={disabled}
      onDrop={onDrop}
      className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-8 items-center gap-2 text-sm font-medium text-foreground"
      >
        {collapsed ? (
          <ChevronRight className="size-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        )}
        <GroupDot group={group} />
        {group.name}
        <span className="rounded-full border border-border/70 bg-background/80 px-2 py-0.5 font-mono text-xs text-muted-foreground tabular-nums">
          {count}
        </span>
      </button>
      {canCreateIssue && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground"
              onClick={onAddIssue}
              aria-label={t('newIssue')}
            >
              <Plus />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('newIssue')}</TooltipContent>
        </Tooltip>
      )}
    </TableDropZone>
  );
}
