'use client';

import { useState } from 'react';
import {
  Check,
  CheckCheck,
  ListFilter,
  MoreHorizontal,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { NotificationFilters, NotificationType } from '@/lib/api/endpoints/notifications';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { InboxGroupBy } from '../services/inboxStreams';

const TYPES: NotificationType[] = ['assigned', 'mentioned', 'commented', 'state_changed'];

// The inbox list header: title with truthful visible count, notification type filter,
// unified Display & Grouping popover, and bulk-action menu.
export default function InboxToolbar({
  count,
  groupBy,
  onGroupByChange,
  showNotificationControls = true,
  filters,
  onFiltersChange,
  onMarkAllRead,
  onDeleteRead,
  onDeleteReadCompleted,
}: {
  count: number;
  groupBy: InboxGroupBy;
  onGroupByChange: (next: InboxGroupBy) => void;
  showNotificationControls?: boolean;
  filters: NotificationFilters;
  onFiltersChange: (next: NotificationFilters) => void;
  onMarkAllRead: () => void;
  onDeleteRead: () => void;
  onDeleteReadCompleted: () => void;
}) {
  const t = useTranslations('inbox');
  const tCommon = useTranslations('common');
  const isVi = useLocale().toLowerCase().startsWith('vi');
  const [displayOpen, setDisplayOpen] = useState(false);
  const selectedTypes = filters.types ?? [];

  const toggleType = (type: NotificationType) => {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter((item) => item !== type)
      : [...selectedTypes, type];
    onFiltersChange({ ...filters, types: next.length ? next : undefined });
  };

  const showRead = filters.includeRead !== false;
  const showSnoozed = filters.includeSnoozed === true;

  return (
    <div className="flex items-center justify-between border-b border-border/75 bg-card/50 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{t('title')}</span>
        {count > 0 && (
          <span
            data-testid="inbox-list-count"
            className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums"
          >
            {count}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {showNotificationControls && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground hover:text-foreground"
                title={t('filter')}
                aria-label={t('filter')}
              >
                <ListFilter className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('notificationType')}</DropdownMenuLabel>
              {TYPES.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => toggleType(type)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {t(`types.${type}`)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Popover open={displayOpen} onOpenChange={setDisplayOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-testid="btn-inbox-display-menu"
              className="size-8 rounded-full text-muted-foreground hover:text-foreground"
              title={t('display')}
              aria-label={t('display')}
            >
              <SlidersHorizontal className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            data-testid="inbox-display-popover"
            className="w-56 space-y-3 p-3"
          >
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-muted-foreground">
                {isVi ? 'Nhóm theo' : 'Group by'}
              </div>
              <div
                data-testid="inbox-group-by-toggle"
                className="grid grid-cols-2 gap-1 rounded-lg border border-border/80 bg-muted/60 p-1"
              >
                <button
                  type="button"
                  data-testid="btn-inbox-groupby-stream"
                  aria-pressed={groupBy === 'stream'}
                  onClick={() => {
                    onGroupByChange('stream');
                    setDisplayOpen(false);
                  }}
                  className={cn(
                    'inline-flex h-7 items-center justify-center rounded-md px-2 text-xs transition-all',
                    groupBy === 'stream'
                      ? 'bg-foreground font-semibold text-background shadow-xs'
                      : 'font-medium text-muted-foreground hover:text-foreground',
                  )}
                >
                  {isVi ? 'Theo loại' : 'By Type'}
                </button>
                <button
                  type="button"
                  data-testid="btn-inbox-groupby-project"
                  aria-pressed={groupBy === 'project'}
                  onClick={() => {
                    onGroupByChange('project');
                    setDisplayOpen(false);
                  }}
                  className={cn(
                    'inline-flex h-7 items-center justify-center rounded-md px-2 text-xs transition-all',
                    groupBy === 'project'
                      ? 'bg-foreground font-semibold text-background shadow-xs'
                      : 'font-medium text-muted-foreground hover:text-foreground',
                  )}
                >
                  {isVi ? 'Theo dự án' : 'By Project'}
                </button>
              </div>
            </div>

            {showNotificationControls && (
              <div className="space-y-1 border-t border-border/70 pt-2">
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={showRead}
                  onClick={() => onFiltersChange({ ...filters, includeRead: !showRead })}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-accent"
                >
                  <span>{t('showRead')}</span>
                  {showRead && <Check className="size-3.5 text-primary" />}
                </button>
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={showSnoozed}
                  onClick={() => onFiltersChange({ ...filters, includeSnoozed: !showSnoozed })}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-accent"
                >
                  <span>{t('showSnoozed')}</span>
                  {showSnoozed && <Check className="size-3.5 text-primary" />}
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {showNotificationControls && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground hover:text-foreground"
                title={tCommon('more')}
                aria-label={tCommon('more')}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onMarkAllRead}>
                <CheckCheck />
                {t('markAllRead')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onDeleteRead}>
                <Trash2 />
                {t('deleteAllRead')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDeleteReadCompleted}>
                <Trash2 />
                {t('deleteAllReadCompleted')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
