import { cn } from '@/lib/utils';
import type { HourLabel, SlotLabel } from '../../utils/cycleTimeline';

// The sticky intraday timeline header: the label column's corner, hour labels,
// and the 15-minute slot ticks (:00, :15, :30, :45).
export function CycleTimelineHeader({
  labelW,
  trackWidth,
  slotW,
  hours,
  slots,
}: {
  labelW: number;
  trackWidth: number;
  slotW: number;
  hours: HourLabel[];
  slots: SlotLabel[];
}) {
  const now = Date.now();

  return (
    <div className="sticky top-0 z-20 flex border-b bg-background select-none">
      <div
        className="sticky left-0 z-10 shrink-0 border-r bg-background"
        style={{ width: labelW }}
      />
      <div className="relative" style={{ width: trackWidth, height: 44 }}>
        <div className="relative h-5 border-b">
          {hours.map((h, i) => (
            <div
              key={i}
              className="absolute top-0 truncate border-r border-border/40 px-1.5 text-[11px] leading-5 font-semibold text-muted-foreground"
              style={{ left: h.left, width: h.width }}
            >
              {h.label}
            </div>
          ))}
        </div>
        <div className="flex h-6">
          {slots.map((s, i) => {
            const isCurrentSlot = now >= s.time.getTime() && now < s.time.getTime() + 15 * 60 * 1000;
            return (
              <div
                key={i}
                className={cn(
                  'flex shrink-0 items-center justify-center text-[10px] tabular-nums',
                  s.isHour ? 'font-bold text-foreground' : 'text-muted-foreground/70',
                  isCurrentSlot && 'bg-primary/15 font-bold text-primary',
                )}
                style={{ width: slotW }}
              >
                {s.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
