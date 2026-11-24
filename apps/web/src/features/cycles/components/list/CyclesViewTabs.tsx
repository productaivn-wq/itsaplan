'use client';

import { GanttChart, Table2, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CyclesView } from '@/utils/paths';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TABS: { value: CyclesView; icon: LucideIcon }[] = [
  { value: 'table', icon: Table2 },
  { value: 'timeline', icon: GanttChart },
];

// The cycles list layout switcher: the grouped table or the day track. The open
// layout comes from the route, so Radix drives no selection of its own and each
// trigger navigates on click.
export default function CyclesViewTabs({
  view,
  onSelect,
}: {
  view: CyclesView;
  onSelect: (view: CyclesView) => void;
}) {
  const t = useTranslations('cycles.views');

  return (
    <Tabs value={view}>
      <TabsList className="inline-flex h-auto items-center gap-1 overflow-x-auto rounded-full border border-border/85 bg-muted/65 p-1">
        {TABS.map(({ value, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="shrink-0 gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors data-[state=active]:bg-foreground data-[state=active]:text-background dark:data-[state=active]:bg-foreground dark:data-[state=active]:text-background data-[state=active]:hover:bg-foreground data-[state=active]:shadow-xs"
            onClick={() => onSelect(value)}
          >
            <Icon className="size-3.5" />
            {t(value)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
