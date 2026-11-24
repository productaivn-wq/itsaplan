import { useTranslations } from 'next-intl';
import type { WidgetConfig } from '@/utils/dashboardWidgets';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PRESET_METRIC_CATEGORIES } from '../watchedMetricsShared';

const MAX_ITEMS_OPTIONS = [4, 8, 12, 16];

export default function WatchedMetricsWidgetSettings({
  config,
  onConfigChange,
}: {
  config: WidgetConfig;
  onConfigChange: (config: WidgetConfig) => void;
}) {
  const t = useTranslations('dashboards.watchedMetrics');
  const pinnedOnly = config.pinnedOnly ?? true;
  const category = config.metricCategory ?? 'all';
  const maxItems = config.maxItems ?? 8;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="watched-widget-pinned-only" className="text-xs font-medium">
          {t('settings.pinnedOnly')}
        </Label>
        <Switch
          id="watched-widget-pinned-only"
          size="sm"
          checked={pinnedOnly}
          onCheckedChange={(checked) => onConfigChange({ pinnedOnly: checked })}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{t('settings.category')}</span>
        <Select
          value={category}
          onValueChange={(value) =>
            onConfigChange({ metricCategory: value === 'all' ? null : value })
          }
        >
          <SelectTrigger size="sm" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories')}</SelectItem>
            {PRESET_METRIC_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {t(`categories.${cat}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{t('settings.maxItems')}</span>
        <Select
          value={String(maxItems)}
          onValueChange={(value) => onConfigChange({ maxItems: Number(value) })}
        >
          <SelectTrigger size="sm" className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MAX_ITEMS_OPTIONS.map((count) => (
              <SelectItem key={count} value={String(count)}>
                {count}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
