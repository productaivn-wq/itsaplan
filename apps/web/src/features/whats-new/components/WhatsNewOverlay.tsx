'use client';

import { useTranslations } from 'next-intl';
import { Sparkles, X } from 'lucide-react';
import type { WhatsNew } from '@/lib/api/endpoints/updates';
import { Button } from '@/components/ui/button';

// IAD-ITSAPLAN §5: Calm, non-blocking release toast card instead of a full-screen
// post-login TakeoverScreen hijack, keeping the Kanban board immediately operable.
export default function WhatsNewOverlay({
  data,
  onClose,
}: {
  data: WhatsNew;
  onClose: () => void;
}) {
  const t = useTranslations('whatsNew');

  return (
    <aside
      role="status"
      aria-live="polite"
      data-testid="whats-new-banner"
      className="fixed right-4 bottom-4 z-40 flex w-[calc(100vw-2rem)] max-w-sm items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-md"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{t('eyebrow')}</p>
          <p className="truncate text-sm font-semibold">
            {t('title', { version: data.version })}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('done')}
        onClick={onClose}
        className="size-9 shrink-0"
      >
        <X className="size-4" />
      </Button>
    </aside>
  );
}
