import type { Cycle } from '@/lib/api/endpoints/cycles';

// The lengths offered as one click each, in minutes. 15 minutes is what a new cycle
// opens with (53.REF.01 Pomodoro Sprint Agile Playbook).
export const CYCLE_LENGTHS = [15, 30, 45, 60];

export const DEFAULT_LENGTH = 15;

// What a new cycle opens with, so it can be created without filling anything in: it
// picks up where the last one ended and continues its numbering.
export interface CycleDefaults {
  name: string;
  startDate: string;
  endDate: string;
}

// Cycles are numbered rather than named, so the next one follows the last one:
// "Sprint 12" gives "Sprint 13", and any prefix works the same way ("Q3 W4" →
// "Q3 W5"). A last cycle whose name ends in no number, or no cycles at all, falls
// back to `fallbackName`, which numbers them from the count.
function nextName(cycles: Cycle[], fallbackName: (n: number) => string): string {
  const last = cycles[cycles.length - 1];
  const numbered = last?.name.match(/^(.*?)(\d+)\s*$/);
  if (numbered) return `${numbered[1]}${Number(numbered[2]) + 1}`;
  return fallbackName(cycles.length + 1);
}

// Next 15-minute slot boundary (e.g. 18:00, 18:15, 18:30, 18:45).
function next15MinuteSlot(from: Date): Date {
  const d = new Date(from);
  const minutes = d.getMinutes();
  const remainder = minutes % 15;
  const add = remainder === 0 ? 15 : 15 - remainder;
  d.setMinutes(minutes + add, 0, 0);
  return d;
}

export function cycleDefaults(cycles: Cycle[], fallbackName: (n: number) => string): CycleDefaults {
  const now = new Date();
  const last = cycles[cycles.length - 1];
  const previousEnd = last ? new Date(last.endDate) : null;
  const start =
    previousEnd && previousEnd > now
      ? new Date(previousEnd.getTime() + 1000)
      : next15MinuteSlot(now);
  const end = new Date(start.getTime() + DEFAULT_LENGTH * 60 * 1000);
  return {
    name: nextName(cycles, fallbackName),
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}
