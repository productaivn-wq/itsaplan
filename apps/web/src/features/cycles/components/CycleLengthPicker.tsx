'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CYCLE_LENGTHS } from '../utils/cycleDefaults';

// The cycle length as one click per Pomodoro option (15m, 30m, 45m, 60m).
export default function CycleLengthPicker({
  minutes,
  onChange,
}: {
  minutes: number;
  onChange: (minutes: number) => void;
}) {
  const t = useTranslations('cycles');

  return (
    <div className="flex items-center gap-1.5">
      {CYCLE_LENGTHS.map((length) => (
        <Button
          key={length}
          type="button"
          size="sm"
          variant={minutes === length ? 'secondary' : 'outline'}
          className="h-7 px-2.5 text-xs font-normal"
          onClick={() => onChange(length)}
        >
          {t('minutes', { count: length })}
        </Button>
      ))}
    </div>
  );
}
