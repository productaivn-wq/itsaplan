'use client';

import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type {
  ChatViewPreferences,
  TraceVisibility,
  TranscriptDensity,
  TranscriptWidth,
} from '../../types/workspaceControls';

function SegmentedRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-foreground">{label}</div>
      <div
        className="grid gap-0.5 rounded-full bg-muted/70 p-0.5"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'rounded-full px-2 py-1 text-xs font-medium transition truncate',
              value === opt.id
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatViewMenu({
  prefs,
  onChange,
  onReset,
  showWidthOption = true,
  compact = false,
}: {
  prefs: ChatViewPreferences;
  onChange: (patch: Partial<ChatViewPreferences>) => void;
  onReset: () => void;
  showWidthOption?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations('aiChat');

  const densityOptions: { id: TranscriptDensity; label: string }[] = [
    { id: 'comfortable', label: t('densityComfortable') },
    { id: 'compact', label: t('densityCompact') },
  ];

  const widthOptions: { id: TranscriptWidth; label: string }[] = [
    { id: 'narrow', label: t('widthNarrow') },
    { id: 'standard', label: t('widthStandard') },
    { id: 'wide', label: t('widthWide') },
  ];

  const traceOptions: { id: TraceVisibility; label: string }[] = [
    { id: 'collapsed', label: t('traceCollapsed') },
    { id: 'expanded', label: t('traceExpanded') },
    { id: 'hidden', label: t('traceHidden') },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={compact ? 'ghost' : 'outline'}
          size={compact ? 'icon' : 'sm'}
          data-testid="workspace-view-menu-btn"
          className={cn(
            compact
              ? 'size-7 shrink-0 text-muted-foreground hover:text-foreground'
              : 'gap-1.5',
          )}
          title={t('view')}
        >
          <SlidersHorizontal className="size-3.5" />
          {!compact && <span>{t('view')}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3 p-3">
        <SegmentedRow
          label={t('viewDensity')}
          value={prefs.density}
          options={densityOptions}
          onChange={(density) => onChange({ density })}
        />

        {showWidthOption && (
          <SegmentedRow
            label={t('viewWidth')}
            value={prefs.width}
            options={widthOptions}
            onChange={(width) => onChange({ width })}
          />
        )}

        <SegmentedRow
          label={t('thinkingTrace')}
          value={prefs.thinkingVisibility}
          options={traceOptions}
          onChange={(thinkingVisibility) => onChange({ thinkingVisibility })}
        />

        <SegmentedRow
          label={t('toolTrace')}
          value={prefs.toolsVisibility}
          options={traceOptions}
          onChange={(toolsVisibility) => onChange({ toolsVisibility })}
        />

        <Separator className="bg-border/60" />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-foreground">{t('showTimestamps')}</span>
            <Switch
              checked={prefs.showTimestamps}
              onCheckedChange={(showTimestamps) => onChange({ showTimestamps })}
              aria-label={t('showTimestamps')}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-foreground">{t('showTokenMeter')}</span>
            <Switch
              checked={prefs.showTokenMeter}
              onCheckedChange={(showTokenMeter) => onChange({ showTokenMeter })}
              aria-label={t('showTokenMeter')}
            />
          </div>
        </div>

        <Separator className="bg-border/60" />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            <span>{t('resetView')}</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
