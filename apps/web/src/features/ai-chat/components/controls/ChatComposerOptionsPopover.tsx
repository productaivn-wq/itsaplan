'use client';

import { useState } from 'react';
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Compass,
  Hammer,
  MessageSquare,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type {
  ChatEffortLevel,
  ChatExecutionMode,
  ChatPermissionMode,
  ChatRunOptions,
} from '@/lib/api/endpoints/agentChat';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { InputGroupButton } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const MODES: {
  id: ChatExecutionMode;
  labelKey: 'modeAsk' | 'modePlan' | 'modeBuild' | 'modeAuto';
  hintKey: 'modeAskHint' | 'modePlanHint' | 'modeBuildHint' | 'modeAutoHint';
  icon: typeof Compass;
}[] = [
  { id: 'ask', labelKey: 'modeAsk', hintKey: 'modeAskHint', icon: MessageSquare },
  { id: 'plan', labelKey: 'modePlan', hintKey: 'modePlanHint', icon: Compass },
  { id: 'build', labelKey: 'modeBuild', hintKey: 'modeBuildHint', icon: Hammer },
  { id: 'auto', labelKey: 'modeAuto', hintKey: 'modeAutoHint', icon: Zap },
];

const EFFORTS: {
  id: ChatEffortLevel;
  labelKey: 'effortLow' | 'effortMedium' | 'effortHigh' | 'effortXHigh';
}[] = [
  { id: 'low', labelKey: 'effortLow' },
  { id: 'medium', labelKey: 'effortMedium' },
  { id: 'high', labelKey: 'effortHigh' },
  { id: 'xhigh', labelKey: 'effortXHigh' },
];

const PERMISSIONS: {
  id: ChatPermissionMode;
  labelKey: 'permAsk' | 'permPlan' | 'permAuto';
}[] = [
  { id: 'ask', labelKey: 'permAsk' },
  { id: 'plan', labelKey: 'permPlan' },
  { id: 'auto', labelKey: 'permAuto' },
];

const TEMP_CHIPS = [0, 0.3, 0.7, 1.0];
const STEP_CHIPS = [8, 16, 24, 48];

export function ChatComposerOptionsPopover({
  options,
  hasOverrides,
  onChange,
  onReset,
  disabled = false,
  isInternal = true,
}: {
  options: ChatRunOptions;
  hasOverrides: boolean;
  onChange: (patch: Partial<ChatRunOptions>) => void;
  onReset: () => void;
  disabled?: boolean;
  isInternal?: boolean;
}) {
  const t = useTranslations('aiChat');
  const [open, setOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const activeMode = options.mode ?? 'build';
  const activeEffort = options.effort ?? 'high';
  const activePerm = options.permissionMode ?? 'ask';
  const thinkingOn = options.thinking ?? true;

  const modeMeta = MODES.find((m) => m.id === activeMode) ?? MODES[2]!;
  const effortMeta = EFFORTS.find((e) => e.id === activeEffort) ?? EFFORTS[2]!;
  const ModeIcon = modeMeta.icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <InputGroupButton
          type="button"
          variant="ghost"
          size="xs"
          data-testid="composer-options-trigger"
          className={cn(
            'rounded-md text-muted-foreground hover:text-foreground',
            (activeMode !== 'build' || hasOverrides) && 'text-foreground',
          )}
          title={t('options')}
        >
          <ModeIcon className="shrink-0" />
          <span className="truncate">
            {t(modeMeta.labelKey)} · {t(effortMeta.labelKey)}
          </span>
          {thinkingOn && (
            <Brain className="size-3 shrink-0 text-primary" aria-hidden="true" />
          )}
          <ChevronDown className="shrink-0 opacity-60" />
        </InputGroupButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-3 p-3">
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-foreground">{t('mode')}</div>
          <div className="grid grid-cols-4 gap-0.5 rounded-full bg-muted/70 p-0.5">
            {MODES.map((m) => {
              const selected = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      mode: m.id,
                      ...(m.id === 'plan' || m.id === 'ask'
                        ? { permissionMode: 'plan' }
                        : m.id === 'auto'
                          ? { permissionMode: 'auto' }
                          : activePerm === 'plan'
                            ? { permissionMode: 'ask' }
                            : {}),
                    })
                  }
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-medium transition',
                    selected
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(m.labelKey)}
                </button>
              );
            })}
          </div>
          <p className="text-xs leading-snug text-muted-foreground">{t(modeMeta.hintKey)}</p>
        </div>

        <Separator className="bg-border/60" />

        <div className="space-y-1.5">
          <div className="text-xs font-medium text-foreground">{t('effort')}</div>
          <div className="grid grid-cols-4 gap-0.5 rounded-full bg-muted/70 p-0.5">
            {EFFORTS.map((e) => {
              const selected = activeEffort === e.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onChange({ effort: e.id })}
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-medium transition',
                    selected
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(e.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 py-0.5">
          <div className="min-w-0">
            <div className="text-xs font-medium text-foreground">{t('extendedThinking')}</div>
            <div className="text-xs text-muted-foreground">{t('extendedThinkingHint')}</div>
          </div>
          <Switch
            data-testid="options-thinking-switch"
            checked={thinkingOn}
            onCheckedChange={(checked) => onChange({ thinking: checked })}
            aria-label={t('extendedThinking')}
          />
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-medium text-foreground">{t('permissions')}</div>
          <div className="grid grid-cols-3 gap-0.5 rounded-full bg-muted/70 p-0.5">
            {PERMISSIONS.map((p) => {
              const selected = activePerm === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange({ permissionMode: p.id })}
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-medium transition',
                    selected
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(p.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {isInternal && (
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger className="flex w-full items-center gap-1.5 pt-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              <ChevronRight
                className={cn('size-3.5 transition-transform', advancedOpen && 'rotate-90')}
              />
              <span>{t('advancedTuning')}</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2.5 pt-2.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('temperature')}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    placeholder="—"
                    value={options.temperature ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      onChange({
                        temperature: v === '' ? null : Math.min(2, Math.max(0, Number(v))),
                      });
                    }}
                    className="h-6 w-16 px-2 font-mono text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => onChange({ temperature: null })}
                    className={cn(
                      'rounded px-1.5 py-0.5 text-xs',
                      options.temperature == null
                        ? 'bg-secondary font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    Default
                  </button>
                  {TEMP_CHIPS.map((temp) => (
                    <button
                      key={temp}
                      type="button"
                      onClick={() => onChange({ temperature: temp })}
                      className={cn(
                        'rounded px-1.5 py-0.5 text-xs',
                        options.temperature === temp
                          ? 'bg-secondary font-medium text-foreground'
                          : 'text-muted-foreground hover:bg-muted',
                      )}
                    >
                      <span className="font-mono">{temp.toFixed(1)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('maxSteps')}
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={64}
                    step={1}
                    placeholder="24"
                    value={options.maxSteps ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      onChange({
                        maxSteps:
                          v === '' ? null : Math.min(64, Math.max(1, Math.round(Number(v)))),
                      });
                    }}
                    className="h-6 w-16 px-2 font-mono text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => onChange({ maxSteps: null })}
                    className={cn(
                      'rounded px-1.5 py-0.5 text-xs',
                      options.maxSteps == null
                        ? 'bg-secondary font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    Default
                  </button>
                  {STEP_CHIPS.map((steps) => (
                    <button
                      key={steps}
                      type="button"
                      onClick={() => onChange({ maxSteps: steps })}
                      className={cn(
                        'rounded px-1.5 py-0.5 text-xs',
                        options.maxSteps === steps
                          ? 'bg-secondary font-medium text-foreground'
                          : 'text-muted-foreground hover:bg-muted',
                      )}
                    >
                      <span className="font-mono">{steps}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <Separator className="bg-border/60" />

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!hasOverrides}
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <RotateCcw className="size-3" />
            <span>{t('resetDefaults')}</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
