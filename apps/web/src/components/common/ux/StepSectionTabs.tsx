'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface StepSectionTabItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: ReactNode;
  testId?: string;
}

export interface StepSectionTabsProps {
  tabs: readonly StepSectionTabItem[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  ariaLabel: string;
  testId?: string;
  className?: string;
}

/**
 * Calm segmented pill tabs designed per DESIGN.md so section switchers
 * stay visually distinct from a screen's single solid primary CTA.
 */
export function StepSectionTabs({
  tabs,
  activeTabId,
  onTabChange,
  ariaLabel,
  testId,
  className,
}: StepSectionTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      data-testid={testId}
      className={cn(
        'inline-flex max-w-full flex-nowrap items-center gap-1 overflow-x-auto rounded-full border border-border/80 bg-muted/55 p-1 scrollbar-none',
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={tab.testId}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'inline-flex min-h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs transition-colors',
              active
                ? 'border border-border/80 bg-background font-semibold text-foreground shadow-xs'
                : 'font-medium text-muted-foreground hover:bg-background/60 hover:text-foreground',
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
