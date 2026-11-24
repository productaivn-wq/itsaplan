import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { Cycle, CyclePatch } from '@/lib/api/endpoints/cycles';
import { ApiError } from '@/lib/api/core/client';
import { useUpdateCycle } from '@/services/cycles.service';
import { cycleSpan, movableEnds } from '../utils/cycleDates';

// Whether a bar drag moves the whole cycle or resizes one end.
export type CycleDragMode = 'move' | 'start' | 'end';

// A gesture that stays within this many pixels is a click, not a drag.
const CLICK_SLOP = 3;

// Pointer-drag state and handler for the cycles timeline. A drag rewrites the
// cycle's dates; a press that does not travel opens the cycle. Every pointer
// gesture on a bar goes through here rather than through a click handler, so the
// click the browser fires after a drag cannot also open the cycle. The dates are
// held inside the gap the neighbouring cycles leave, so a drag never produces an
// overlap the API would reject. `preview` is the in-progress range of the dragged
// cycle.
export function useCycleDrag({
  projectKey,
  dayW,
  onOpen,
}: {
  projectKey: string;
  dayW: number;
  onOpen: (id: number) => void;
}) {
  const t = useTranslations('cycles');
  const update = useUpdateCycle(projectKey);
  const [preview, setPreview] = useState<{ cycleId: number; start: Date; end: Date } | null>(null);

  function beginDrag(e: React.PointerEvent, cycle: Cycle, mode: CycleDragMode) {
    e.preventDefault();
    e.stopPropagation();
    const span = cycleSpan(cycle);
    if (!span) return;
    const ends = movableEnds(cycle.status);
    const startX = e.clientX;
    const current = { start: span.start, end: span.end };
    let travelled = false;

    const onMove = (ev: PointerEvent) => {
      if (Math.abs(ev.clientX - startX) > CLICK_SLOP) travelled = true;
      const deltaSlots = Math.round((ev.clientX - startX) / dayW);
      const deltaMs = deltaSlots * 15 * 60 * 1000;
      if (!ends[mode]) return;
      if (mode === 'move') {
        current.start = new Date(span.start.getTime() + deltaMs);
        current.end = new Date(span.end.getTime() + deltaMs);
      } else if (mode === 'start') {
        let start = new Date(span.start.getTime() + deltaMs);
        if (start.getTime() > span.end.getTime() - 15 * 60 * 1000) {
          start = new Date(span.end.getTime() - 15 * 60 * 1000);
        }
        current.start = start;
      } else {
        let end = new Date(span.end.getTime() + deltaMs);
        if (end.getTime() < span.start.getTime() + 15 * 60 * 1000) {
          end = new Date(span.start.getTime() + 15 * 60 * 1000);
        }
        current.end = end;
      }
      setPreview({ cycleId: cycle.id, start: current.start, end: current.end });
    };

    // Also bound to pointercancel: a gesture the browser takes over (a touch
    // scroll, a system gesture) never reaches pointerup, and would otherwise leave
    // the listeners bound and the bar stuck at its preview position.
    const endDrag = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', endDrag);
      setPreview(null);
    };

    const onUp = () => {
      endDrag();

      const patch: CyclePatch = {};
      const startDate = current.start.toISOString();
      const endDate = current.end.toISOString();
      if (mode !== 'end' && startDate !== cycle.startDate) patch.startDate = startDate;
      if (mode !== 'start' && endDate !== cycle.endDate) patch.endDate = endDate;

      // A press that stayed put opens the cycle; a drag that changed no date (it
      // ran into a neighbour, or the status locks that end) leaves it alone.
      if (Object.keys(patch).length === 0) {
        if (!travelled) onOpen(cycle.id);
        return;
      }
      update.mutate(
        { id: cycle.id, patch },
        {
          onError: (err) => toast.error(err instanceof ApiError ? err.message : t('dragFailed')),
        },
      );
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', endDrag);
  }

  return { preview, beginDrag };
}
