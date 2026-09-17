import { useTranslations } from 'next-intl';
import type { Cycle } from '@/lib/api/endpoints/cycles';
import { formatShortDate, formatTime } from '@/utils/dates';

// The range a cycle ran or is planned for. Formats date and hours/minutes for 15-min sprints.
export default function CycleRange({ cycle }: { cycle: Cycle }) {
  const t = useTranslations('cycles');
  const start = new Date(cycle.startDate);
  const end = new Date(cycle.completedAt ?? cycle.endDate);
  const hasTime = cycle.startDate.includes('T') || cycle.startDate.includes(':');

  const formattedRange = hasTime
    ? `${formatShortDate(cycle.startDate)} ${formatTime(start)} – ${formatTime(end)}`
    : `${formatShortDate(cycle.startDate)} – ${formatShortDate(cycle.completedAt ?? cycle.endDate)}`;

  return (
    <>
      {formattedRange}
      {cycle.completedAt && ` · ${t('finishedEarly', { date: formatShortDate(cycle.endDate) })}`}
    </>
  );
}
