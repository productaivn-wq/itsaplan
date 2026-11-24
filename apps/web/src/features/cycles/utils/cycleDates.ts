import type { Cycle, CycleStatus } from '@/lib/api/endpoints/cycles';
import { addDays, daysBetween, parseDate } from '@/utils/dates';

export interface CycleSpan {
  start: Date;
  end: Date;
}

export function cycleSpan(cycle: Pick<Cycle, 'startDate' | 'endDate'>): CycleSpan | null {
  const start = parseDate(cycle.startDate);
  const end = parseDate(cycle.endDate);
  return start && end ? { start, end } : null;
}

// The cycle's length in days, both ends counted. 0 when a date does not parse.
export function cycleLength(cycle: Pick<Cycle, 'startDate' | 'endDate'>): number {
  const span = cycleSpan(cycle);
  return span ? daysBetween(span.start, span.end) + 1 : 0;
}

// The cycle's length in minutes (53.REF.01 Pomodoro 15m sprints).
export function cycleLengthMinutes(cycle: Pick<Cycle, 'startDate' | 'endDate'>): number {
  const span = cycleSpan(cycle);
  if (!span) return 0;
  const ms = Math.max(0, span.end.getTime() - span.start.getTime());
  return Math.max(1, Math.round(ms / 60000));
}

// Days from today to the last day, both counted; negative once the cycle is over.
export function daysLeft(
  cycle: Pick<Cycle, 'startDate' | 'endDate'>,
  today: Date = new Date(),
): number {
  const span = cycleSpan(cycle);
  return span ? daysBetween(today, span.end) + 1 : 0;
}

// Minutes left from now to cycle end; negative once the cycle is over.
export function minutesLeft(
  cycle: Pick<Cycle, 'startDate' | 'endDate'>,
  today: Date = new Date(),
): number {
  const span = cycleSpan(cycle);
  if (!span) return 0;
  const ms = span.end.getTime() - today.getTime();
  return Math.round(ms / 60000);
}

// Which ends of a cycle may still move, mirroring what the API accepts: an upcoming
// cycle moves freely, a running one may only be cut short or extended, a finished
// one keeps its dates.
export function movableEnds(status: CycleStatus): { move: boolean; start: boolean; end: boolean } {
  return {
    move: status === 'upcoming',
    start: status === 'upcoming',
    end: status !== 'completed',
  };
}

// The days a cycle's dates may move within: the gap left by the cycles around it,
// since cycles of one project may not overlap. Null on a side with no neighbour,
// which leaves that direction open.
export function dateWindow(cycles: Cycle[], cycle: Cycle): { from: Date | null; to: Date | null } {
  const others = cycles.filter((c) => c.id !== cycle.id);
  const before = others
    .filter((c) => c.endDate < cycle.startDate)
    .map((c) => c.endDate)
    .sort();
  const after = others
    .filter((c) => c.startDate > cycle.endDate)
    .map((c) => c.startDate)
    .sort();
  const prevEnd = parseDate(before[before.length - 1] ?? null);
  const nextStart = parseDate(after[0] ?? null);
  return {
    from: prevEnd ? addDays(prevEnd, 1) : null,
    to: nextStart ? addDays(nextStart, -1) : null,
  };
}

export function formatCycleDuration(
  cycle: Pick<Cycle, 'startDate' | 'endDate'>,
  isVi = false,
): string {
  const days = cycleLength(cycle);
  const mins = cycleLengthMinutes(cycle);
  if (days >= 2 || mins >= 1440) {
    if (days >= 7 && days % 7 === 0) {
      return isVi ? `${days / 7} tuần (${days} ngày)` : `${days / 7}w (${days}d)`;
    }
    return isVi ? `${days} ngày` : `${days}d`;
  }
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  }
  return `${mins}m`;
}

export function formatCycleTimeLeft(
  cycle: Pick<Cycle, 'startDate' | 'endDate'> & { completedAt?: string | null },
  today = new Date(),
  isVi = false,
): string {
  if (cycle.completedAt) {
    return isVi ? 'Đã hoàn thành' : 'Completed';
  }
  const days = cycleLength(cycle);
  const mins = cycleLengthMinutes(cycle);
  if (days >= 2 || mins >= 1440) {
    const remDays = daysLeft(cycle, today);
    if (remDays > 0) return isVi ? `còn ${remDays} ngày` : `${remDays}d left`;
    if (remDays === 0) return isVi ? 'Hết hạn hôm nay' : 'Ends today';
    return isVi ? `trễ ${Math.abs(remDays)} ngày` : `${Math.abs(remDays)}d overdue`;
  }
  const remMins = minutesLeft(cycle, today);
  if (remMins >= 60) {
    const hrs = Math.floor(remMins / 60);
    const rem = remMins % 60;
    return rem > 0
      ? isVi
        ? `còn ${hrs}g ${rem}p`
        : `${hrs}h ${rem}m left`
      : isVi
        ? `còn ${hrs}g`
        : `${hrs}h left`;
  }
  return remMins > 0 ? (isVi ? `còn ${remMins}p` : `${remMins}m left`) : isVi ? 'Đã kết thúc' : 'Ended';
}
