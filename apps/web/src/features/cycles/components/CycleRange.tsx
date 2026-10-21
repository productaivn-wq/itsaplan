import { useTranslations } from 'next-intl';
import type { Cycle } from '@/lib/api/endpoints/cycles';
import { formatShortDate, formatTime } from '@/utils/dates';
import { cycleLength } from '../utils/cycleDates';

// The range a cycle ran or is planned for. Formats date and hours/minutes for 15-min sprints.
export default function CycleRange({ cycle }: { cycle: Cycle }) {
  const t = useTranslations('cycles');
  const effectiveEndStr = cycle.completedAt ?? cycle.endDate;
  const start = new Date(cycle.startDate);
  const end = new Date(effectiveEndStr);
  const isMultiDay = cycleLength(cycle) >= 2 || start.toDateString() !== end.toDateString();
  const hasTime = !isMultiDay && (cycle.startDate.includes('T') || cycle.startDate.includes(':'));

  const formattedRange = isMultiDay
    ? `${formatShortDate(cycle.startDate)} ? ${formatShortDate(effectiveEndStr)}`
    : hasTime
      ? `${formatShortDate(cycle.startDate)} ${formatTime(start)} ? ${formatTime(end)}`
      : `${formatShortDate(cycle.startDate)} ? ${formatShortDate(effectiveEndStr)}`;

  return (
    <>
      {formattedRange}
      {cycle.completedAt && ` ? ${t('finishedEarly', { date: formatShortDate(cycle.endDate) })}`}
    </>
  );
}
