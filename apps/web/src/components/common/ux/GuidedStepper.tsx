'use client';

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GuidedStepDef {
  id: string;
  label: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
  testId?: string;
}

export interface GuidedStepperProps {
  steps: readonly GuidedStepDef[];
  activeStepId: string;
  onStepChange: (stepId: string) => void;
  renderStep: (stepId: string, isActive: boolean) => ReactNode;
  keepMounted?: boolean;
  testId?: string;
  ariaLabel?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Multi-step guided workflow stepper that caps each step at <= 6 controls,
 * preserves form state when stepping Back/Next, and keeps step tabs visually subordinate
 * to the step's single primary CTA.
 */
export function GuidedStepper({
  steps,
  activeStepId,
  onStepChange,
  renderStep,
  keepMounted = true,
  testId,
  ariaLabel = 'Workflow steps',
  compact = false,
  className,
}: GuidedStepperProps) {
  const activeIdx = Math.max(
    0,
    steps.findIndex((s) => s.id === activeStepId),
  );
  const activeStep = steps[activeIdx];

  return (
    <div data-testid={testId} className={cn('min-w-0 space-y-3', className)}>
      <div className="space-y-1.5">
        <div
          role="tablist"
          aria-label={ariaLabel}
          className={cn(
            'flex flex-wrap items-center gap-1 rounded-2xl border border-border/80 bg-muted/55 p-1',
            compact && 'gap-0.5 p-0.5',
          )}
        >
          {steps.map((step, index) => {
            const isActive = step.id === activeStepId;
            const isCompleted = index < activeIdx;
            return (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? 'step' : undefined}
                disabled={step.disabled}
                data-testid={step.testId}
                onClick={() => onStepChange(step.id)}
                className={cn(
                  'inline-flex min-h-8 flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                  isActive
                    ? 'border border-border/80 bg-background font-semibold text-foreground shadow-xs'
                    : isCompleted
                      ? 'font-medium text-foreground/85 hover:bg-background/60'
                      : 'font-medium text-muted-foreground hover:bg-background/60 hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'inline-flex size-4.5 shrink-0 items-center justify-center rounded-full text-xs tabular-nums',
                    isActive
                      ? 'bg-primary/15 font-bold text-primary'
                      : isCompleted
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {isCompleted ? <Check className="size-3" /> : index + 1}
                </span>
                <span className="truncate">{step.label}</span>
                {step.badge && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                    {step.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeStep?.description && (
          <p className="px-1 text-xs text-muted-foreground">{activeStep.description}</p>
        )}
      </div>

      <div className="min-w-0">
        {steps.map((step) => {
          const isActive = step.id === activeStepId;
          if (!keepMounted && !isActive) return null;
          return (
            <div
              key={step.id}
              role="tabpanel"
              data-step-id={step.id}
              data-active={isActive ? 'true' : 'false'}
              aria-hidden={!isActive}
              className={cn(isActive ? 'min-w-0 space-y-3' : 'hidden')}
            >
              {renderStep(step.id, isActive)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
