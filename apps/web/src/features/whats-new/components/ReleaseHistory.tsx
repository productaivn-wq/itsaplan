'use client';

import { useTranslations } from 'next-intl';
import { RefreshCw } from 'lucide-react';
import type { UpdateStatus } from '@/lib/api/endpoints/updates';
import TakeoverScreen from '@/components/common/page/TakeoverScreen';
import { Button } from '@/components/ui/button';
import { useCheckForUpdatesMutation } from '@/services/updates.service';
import { formatDateTime } from '@/utils/dates';
import { cn } from '@/lib/utils';
import { releaseSections } from './ReleaseSections';

// The same screen opened from the sidebar version rather than by an upgrade: the
// whole release history, the running version marked, and the re-check the instance
// owner runs before upgrading. Closing it records nothing — only the screen shown
// after an upgrade marks a version as seen.
export default function ReleaseHistory({
  status,
  onClose,
}: {
  status: UpdateStatus;
  onClose: () => void;
}) {
  const t = useTranslations('updates');
  const tCommon = useTranslations('common');
  const check = useCheckForUpdatesMutation();

  const sections = releaseSections(status.releases, {
    empty: t('noNotes'),
    current: status.currentVersion,
    badges: { current: t('badgeRunning'), new: t('badgeNew') },
  });

  return (
    <TakeoverScreen
      eyebrow={t('running', { current: status.currentVersion })}
      title={t(status.updateAvailable ? 'updateAvailable' : 'releaseHistory')}
      sections={sections}
      aside={
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => check.mutate()}
            disabled={check.isPending}
          >
            <RefreshCw className={cn('size-4', check.isPending && 'animate-spin')} />
            {t(check.isPending ? 'checking' : 'check')}
          </Button>
          {status.checkedAt && (
            <p className="text-end text-xs text-muted-foreground">
              {t('lastChecked')}
              <br />
              {formatDateTime(status.checkedAt)}
            </p>
          )}
        </div>
      }
      actionLabel={tCommon('close')}
      onAction={onClose}
    />
  );
}
