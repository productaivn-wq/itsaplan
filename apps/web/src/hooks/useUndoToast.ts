'use client';

import { toast } from 'sonner';

export interface UndoToastOptions {
  message: string;
  undoLabel?: string;
  onUndo: () => void | Promise<void>;
  durationMs?: number;
}

// S7 Reversibility Contract (IAD-ITSAPLAN §4): 10-second non-blocking Sonner Undo latch.
export function showUndoToast({
  message,
  undoLabel = 'Undo',
  onUndo,
  durationMs = 10_000,
}: UndoToastOptions) {
  return toast(message, {
    duration: durationMs,
    action: {
      label: undoLabel,
      onClick: () => {
        void onUndo();
      },
    },
  });
}
