'use client';

import * as React from 'react';

export interface OfficeSubTabDef {
  key: string;
  label: string;
  count?: number;
  testId?: string;
}

export interface OfficeSubTabsProps {
  tabs: OfficeSubTabDef[];
  value: string;
  onChange: (key: string) => void;
  ariaLabel: string;
  testId?: string;
}

export function OfficeSubTabs({
  tabs,
  value,
  onChange,
  ariaLabel,
  testId,
}: OfficeSubTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      data-testid={testId}
      className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-full border border-border bg-muted/60 p-0.5"
    >
      {tabs.map((tab) => {
        const isActive = value === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-testid={tab.testId}
            onClick={() => onChange(tab.key)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
              isActive
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-xs font-bold tabular-nums ${
                  isActive
                    ? 'bg-background/20 text-background'
                    : 'bg-background/80 text-foreground border border-border/60'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
