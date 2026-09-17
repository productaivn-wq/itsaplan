import type { Cycle } from '@/lib/api/endpoints/cycles';
import { formatShortDate, formatTime } from '@/utils/dates';
import { cycleSpan, type CycleSpan } from './cycleDates';
import { groupCycles, type CycleGroup } from './cycleGroups';

// Width of a 15-minute slot in pixels: 48px gives a 15-min sprint a prominent, readable bar
export const CYCLE_SLOT_15M_W = 48;
export const CYCLE_ROW_H = 40;
export const CYCLE_GROUP_H = 30;

// The dragged label-column width is a client-only preference, kept per project.
export function cycleLabelWidthKey(projectKey: string): string {
  return `cycles-timeline-label-width:${projectKey}`;
}

export type CycleTimelineItem =
  | { kind: 'group'; group: CycleGroup }
  | { kind: 'cycle'; cycle: Cycle; span: CycleSpan };

export interface HourLabel {
  label: string;
  left: number;
  width: number;
}

export interface SlotLabel {
  label: string;
  time: Date;
  left: number;
  width: number;
  isHour: boolean;
}

export interface CycleTimelineModel {
  rows: CycleTimelineItem[];
  hours: HourLabel[];
  slots: SlotLabel[];
  trackWidth: number;
  todayLeft: number;
  todayInRange: boolean;
  dayLines: { backgroundImage: string };
  spanToRect: (start: Date, end: Date) => { left: number; width: number };
}

export function buildCycleTimeline({
  cycles,
  viewportW,
  labelW,
  slotW = CYCLE_SLOT_15M_W,
}: {
  cycles: Cycle[];
  viewportW: number;
  labelW: number;
  slotW?: number;
  dayW?: number;
}): CycleTimelineModel {
  const rows: CycleTimelineItem[] = [];
  let min: Date | null = null;
  let max: Date | null = null;
  for (const group of groupCycles(cycles)) {
    rows.push({ kind: 'group', group });
    for (const cycle of group.cycles) {
      const span = cycleSpan(cycle);
      if (!span) continue;
      if (!min || span.start < min) min = span.start;
      if (!max || span.end > max) max = span.end;
      rows.push({ kind: 'cycle', cycle, span });
    }
  }

  const now = new Date();
  const baseStart = min
    ? new Date(Math.min(min.getTime(), now.getTime() - 60 * 60 * 1000))
    : new Date(now.getTime() - 60 * 60 * 1000);
  baseStart.setMinutes(0, 0, 0);

  const baseEnd = max
    ? new Date(Math.max(max.getTime(), now.getTime() + 3 * 60 * 60 * 1000))
    : new Date(now.getTime() + 3 * 60 * 60 * 1000);
  baseEnd.setMinutes(0, 0, 0);

  const rangeStart = baseStart;
  const naturalDurationMs = Math.max(15 * 60 * 1000, baseEnd.getTime() - baseStart.getTime());
  const naturalSlots = Math.ceil(naturalDurationMs / (15 * 60 * 1000));
  const slotsToFill = Math.ceil(Math.max(0, viewportW - labelW) / slotW);
  const totalSlots = Math.max(naturalSlots, slotsToFill);
  const trackWidth = totalSlots * slotW;

  const hours: HourLabel[] = [];
  const slots: SlotLabel[] = [];

  for (let i = 0; i < totalSlots; i++) {
    const slotTime = new Date(rangeStart.getTime() + i * 15 * 60 * 1000);
    const mins = slotTime.getMinutes();
    const isHour = mins === 0;
    const slotLabel = `:${String(mins).padStart(2, '0')}`;
    slots.push({
      label: slotLabel,
      time: slotTime,
      left: i * slotW,
      width: slotW,
      isHour,
    });

    if (isHour) {
      const isMidnight = slotTime.getHours() === 0;
      const hourText = formatTime(slotTime);
      const label =
        isMidnight || hours.length === 0
          ? `${formatShortDate(slotTime.toISOString())} ${hourText}`
          : hourText;
      hours.push({
        label,
        left: i * slotW,
        width: 4 * slotW,
      });
    }
  }

  const nowMs = now.getTime();
  const rangeStartMs = rangeStart.getTime();
  const rangeEndMs = rangeStartMs + totalSlots * 15 * 60 * 1000;
  const nowMins = (nowMs - rangeStartMs) / 60000;
  const todayLeft = Math.round((nowMins / 15) * slotW);
  const todayInRange = nowMs >= rangeStartMs && nowMs <= rangeEndMs;

  const dayLines = {
    backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent ${slotW - 1}px, var(--border) ${slotW - 1}px, var(--border) ${slotW}px)`,
  };

  const spanToRect = (start: Date, end: Date) => {
    const startMins = (start.getTime() - rangeStartMs) / 60000;
    const endMins = (end.getTime() - rangeStartMs) / 60000;
    const left = Math.round((startMins / 15) * slotW);
    const width = Math.max(slotW, Math.round(((endMins - startMins) / 15) * slotW));
    return { left, width };
  };

  return {
    rows,
    hours,
    slots,
    trackWidth,
    todayLeft,
    todayInRange,
    dayLines,
    spanToRect,
  };
}
