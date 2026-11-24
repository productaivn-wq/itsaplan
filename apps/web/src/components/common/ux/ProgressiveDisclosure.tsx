'use client';

import { useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressiveDisclosureProps {
  label: string;
  expandedLabel?: string;
  summary?: string;
  count?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  keepMounted?: boolean;
  triggerVariant?: 'pill' | 'row' | 'ghost';
  triggerTestId?: string;
  contentTestId?: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}

/**
 * Calm-First progressive disclosure container.
 * Collapses secondary controls or technical details behind a summary-aware toggle
 * so primary flows obey Miller's Law and the Rule of 6.
 */
export function ProgressiveDisclosure({
  label,
  expandedLabel,
  summary,
  count,
  open,
  defaultOpen = false,
  onOpenChange,
  keepMounted = false,
  triggerVariant = 'row',
  triggerTestId,
  contentTestId,
  className,
  contentClassName,
  children,
}: ProgressiveDisclosureProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const triggerClass =
    triggerVariant === 'pill'
      ? 'inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border/80 bg-muted/45 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
      : triggerVariant === 'ghost'
        ? 'inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground'
        : 'flex min-h-9 w-full items-center justify-between gap-2 rounded-xl border border-border/75 bg-muted/35 px-3 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted/60';

  const displayLabel = isOpen && expandedLabel ? expandedLabel : label;

  return (
    <div className={cn('min-w-0', className)}>
      <button
        type="button"
        aria-expanded={isOpen}
        data-testid={triggerTestId}
        onClick={() => setOpen(!isOpen)}
        className={triggerClass}
      >
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <ChevronRight
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform duration-150',
              isOpen && 'rotate-90',
            )}
          />
          <span className="truncate">{displayLabel}</span>
        </span>
        {!isOpen && (summary || (count !== undefined && count > 0)) && (
          <span className="inline-flex shrink-0 items-center gap-1.5">
            {summary && (
              <span className="max-w-44 truncate rounded-full bg-background/80 px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {summary}
              </span>
            )}
            {count !== undefined && count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-border/70 bg-background/80 px-1.5 text-xs font-semibold tabular-nums text-foreground">
                {count}
              </span>
            )}
          </span>
        )}
      </button>

      {keepMounted ? (
        <div
          data-testid={contentTestId}
          aria-hidden={!isOpen}
          className={cn(isOpen ? cn('pt-2.5', contentClassName) : 'hidden')}
        >
          {children}
        </div>
      ) : (
        isOpen && (
          <div data-testid={contentTestId} className={cn('pt-2.5', contentClassName)}>
            {children}
          </div>
        )
      )}
    </div>
  );
}
