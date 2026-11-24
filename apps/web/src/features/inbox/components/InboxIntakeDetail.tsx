'use client';

import * as React from 'react';
import {
  ArrowUpRight,
  ChevronLeft,
  FileText,
  FolderSync,
  Send,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { formatDurationShort } from '@/utils/dates';
import { documentsPath } from '@/utils/paths';
import { isHostVibeEnabled } from '@/lib/security/hostVibeClient';
import {
  dispatchIntakeToAgent,
  fetchIntakePreview,
  triggerCustodianTriage,
  type IntakeDocumentPreview,
  type IntakeInboxItem,
} from '../services/inboxStreams';

export default function InboxIntakeDetail({
  item,
  projectKey,
  shortProjectKey,
  isMobile,
  onBack,
  onDispatched,
  onTriaged,
}: {
  item: IntakeInboxItem;
  projectKey: string;
  shortProjectKey: string;
  isMobile: boolean;
  onBack: () => void;
  onDispatched: () => void;
  onTriaged: () => void;
}) {
  const isVi = useLocale().toLowerCase().startsWith('vi');
  const [preview, setPreview] = React.useState<IntakeDocumentPreview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = React.useState<'dispatch' | 'triage' | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPreview(null);
    void fetchIntakePreview(item.relativePath, item.projectFolder)
      .then((res) => {
        if (!cancelled) setPreview(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error && err.message
              ? err.message
              : isVi
                ? 'Không thể đọc nội dung tệp.'
                : 'Unable to load file preview.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [item.relativePath, item.projectFolder, isVi]);

  const handleDispatch = async () => {
    if (submittingAction) return;
    setSubmittingAction('dispatch');
    setError(null);
    try {
      await dispatchIntakeToAgent({
        title: `Triage ${item.name}`,
        projectKey: item.projectKey || shortProjectKey || 'PM',
        relativePath: item.relativePath,
      });
      toast.success(
        isVi
          ? `Đã giao ${item.name} cho trợ lý AI xử lý`
          : `Dispatched ${item.name} to agent`,
      );
      onDispatched();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : isVi
            ? 'Không thể giao việc từ tệp đầu vào.'
            : 'Unable to dispatch intake item.',
      );
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleAutoSort = async () => {
    if (submittingAction) return;
    setSubmittingAction('triage');
    setError(null);
    try {
      const res = await triggerCustodianTriage();
      toast.success(
        res.summary ||
          (isVi
            ? 'Đã phân loại tệp trong hàng chờ đầu vào'
            : 'Auto-sorted intake queue'),
      );
      onTriaged();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : isVi
            ? 'Không thể tự động phân loại hàng chờ.'
            : 'Unable to auto-sort intake queue.',
      );
    } finally {
      setSubmittingAction(null);
    }
  };

  const ageLabel = item.modifiedAt ? formatDurationShort(item.modifiedAt) : '';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b px-4 sm:px-6 xl:px-10">
        {isMobile && (
          <Button variant="ghost" size="sm" className="-ms-2 h-8 gap-1.5" onClick={onBack}>
            <ChevronLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
            {isVi ? 'Hộp thư' : 'Inbox'}
          </Button>
        )}
        <Badge variant="secondary" className="gap-1 text-xs">
          <FileText className="size-3" />
          00_INBOX
        </Badge>
        {item.projectKey && (
          <Badge variant="outline" className="font-mono text-xs">
            {item.projectKey}
          </Badge>
        )}
        <span className="font-mono text-xs text-muted-foreground">{item.sizeFormatted}</span>
        <div className="ms-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigateFeatureInstant(documentsPath(projectKey))}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <span>{isVi ? 'Tài liệu & Tệp' : 'Open Docs & Files'}</span>
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 xl:px-10">
        <div className="max-w-3xl space-y-5">
          <div className="space-y-1.5">
            <h2 className="break-all text-base font-semibold tracking-tight text-foreground">
              {item.name}
            </h2>
            <p className="font-mono text-xs text-muted-foreground">
              {item.relativePath}
              {ageLabel ? ` · ${ageLabel}` : ''}
              {preview?.totalLines ? ` · ${preview.totalLines} lines` : ''}
            </p>
          </div>

          <section className="space-y-2 border-t border-border pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isVi ? 'Xem nhanh nội dung' : 'File Preview'}
            </h3>
            {loading ? (
              <p className="text-xs text-muted-foreground">
                {isVi ? 'Đang tải xem trước...' : 'Loading preview...'}
              </p>
            ) : preview?.bridgeDisabled || !isHostVibeEnabled() ? (
              <p className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                {isVi
                  ? 'Xem trước tệp cục bộ khả dụng khi kết nối Host Workspace Bridge.'
                  : 'Local workspace file preview is available when the Host Workspace Bridge is enabled.'}
              </p>
            ) : preview?.isBinary ? (
              <p className="rounded-md bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                {isVi
                  ? 'Tệp nhị phân — mở trong Tài liệu để kiểm tra hoặc giao cho trợ lý AI xử lý.'
                  : 'Binary file — open in Docs or dispatch directly to an agent.'}
              </p>
            ) : preview?.content ? (
              <pre className="overflow-x-auto rounded-md bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words">
                {preview.content}
              </pre>
            ) : (
              <p className="text-xs text-muted-foreground">
                {isVi ? 'Tệp trống.' : 'File has no previewable text.'}
              </p>
            )}
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Button
              type="button"
              data-testid="btn-inbox-dispatch-intake"
              disabled={submittingAction !== null || !isHostVibeEnabled()}
              onClick={() => void handleDispatch()}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <Send className="size-3.5 shrink-0" />
              <span>
                {submittingAction === 'dispatch'
                  ? isVi
                    ? 'Đang giao...'
                    : 'Dispatching...'
                  : isVi
                    ? 'Giao cho Trợ lý AI'
                    : 'Dispatch to Agent'}
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              data-testid="btn-inbox-triage-intake"
              disabled={submittingAction !== null || !isHostVibeEnabled()}
              onClick={() => void handleAutoSort()}
              className="h-9 gap-1.5 text-xs"
            >
              <FolderSync className="size-3.5 shrink-0" />
              <span>
                {submittingAction === 'triage'
                  ? isVi
                    ? 'Đang phân loại...'
                    : 'Sorting...'
                  : isVi
                    ? 'Tự động phân loại 00_INBOX'
                    : 'Auto-Sort Inbox'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
