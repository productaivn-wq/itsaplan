import { useTranslations } from 'next-intl';
import type { InitiativeHealth } from '@/lib/api/endpoints/initiatives';
import { healthColor } from '@/utils/initiativeMeta';

// A small health signal: a colored dot plus its label. null renders a muted
// "No update". Used in the list column and the detail header.
export default function HealthBadge({ health }: { health: InitiativeHealth | null }) {
  const t = useTranslations('initiatives.health');
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border/75 bg-muted/55 px-2.5 py-0.5 text-xs font-medium text-foreground">
      <span
        className="inline-block size-2 shrink-0 rounded-full"
        style={{ backgroundColor: healthColor(health) }}
      />
      {t(health ?? 'unknown')}
    </span>
  );
}
