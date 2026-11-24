import { useEffect, useState } from 'react';
import { CloudOff, Download, Loader2, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { DocumentSyncState } from '../hooks/useDocumentCollaboration';

export default function DocumentSyncBanner({
  state,
  onRetry,
  recoveryConflict,
  onExportRecovery,
  onDiscardRecovery,
}: {
  state: DocumentSyncState;
  onRetry: () => void;
  recoveryConflict: boolean;
  onExportRecovery: () => void;
  onDiscardRecovery: () => void;
}) {
  const t = useTranslations('documents.sync');
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    if (!confirmDiscard) return;
    const timer = window.setTimeout(() => setConfirmDiscard(false), 4500);
    return () => window.clearTimeout(timer);
  }, [confirmDiscard]);

  if (state === 'saved' || state === 'saving') return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground"
    >
      {state === 'connecting' ? (
        <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
      ) : (
        <CloudOff className="size-3.5" />
      )}
      <span className="flex-1">{t(recoveryConflict ? 'recoveryConflict' : state)}</span>
      {recoveryConflict && (
        <>
          <Button size="sm" variant="ghost" onClick={onExportRecovery}>
            <Download className="size-3.5" />
            {t('exportRecovery')}
          </Button>
          {confirmDiscard ? (
            <>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setConfirmDiscard(false);
                  onDiscardRecovery();
                }}
              >
                {t('discardRecovery')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDiscard(false)}>
                ×
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              title={t('discardConfirm')}
              onClick={() => setConfirmDiscard(true)}
            >
              {t('discardRecovery')}
            </Button>
          )}
        </>
      )}
      {!recoveryConflict && state !== 'connecting' && (
        <Button type="button" size="sm" variant="ghost" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          {t('retry')}
        </Button>
      )}
    </div>
  );
}
