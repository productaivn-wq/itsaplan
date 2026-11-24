'use client';

import * as React from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { decideProjectApproval } from '@/lib/api/endpoints/agents';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { formatDurationShort } from '@/utils/dates';
import { openOfficePath } from '@/utils/paths';
import {
  submitContractDecision,
  type DecisionInboxItem,
} from '../services/inboxStreams';

export default function InboxDecisionDetail({
  item,
  projectKey,
  isMobile,
  onBack,
  onResolved,
  reworkInputRef,
}: {
  item: DecisionInboxItem;
  projectKey: string;
  isMobile: boolean;
  onBack: () => void;
  onResolved: (contractId: string, decision: 'APPROVE' | 'RETURN_FOR_REWORK') => void;
  reworkInputRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const isVi = useLocale().toLowerCase().startsWith('vi');
  const [verified, setVerified] = React.useState(true);
  const [note, setNote] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setVerified(true);
    setNote('');
    setError(null);
    setSubmitting(false);
  }, [item.contractId]);

  const handleDecision = async (decision: 'APPROVE' | 'RETURN_FOR_REWORK') => {
    if (submitting) return;
    if (decision === 'APPROVE' && !verified) return;
    setSubmitting(true);
    setError(null);
    try {
      const cleanNote = note.trim();
      const defaultReason =
        decision === 'APPROVE'
          ? isVi
            ? 'Đã nghiệm thu đạt yêu cầu'
            : 'Acceptance criteria verified and approved'
          : isVi
            ? 'Cần bổ sung theo tiêu chí'
            : 'Returned for rework per acceptance criteria';

      if (item.id.startsWith('pg-approval:')) {
        await decideProjectApproval(
          projectKey,
          item.contractId,
          decision === 'APPROVE' ? 'approved' : 'rejected',
          cleanNote || defaultReason,
        );
      } else {
        await submitContractDecision({
          contractId: item.contractId,
          decision,
          acceptanceVerified: verified,
          reason: cleanNote || defaultReason,
        });
      }

      toast.success(
        decision === 'APPROVE'
          ? isVi
            ? `Đã phê duyệt ${item.contractId}`
            : `Approved ${item.contractId}`
          : isVi
            ? `Đã trả về làm lại ${item.contractId}`
            : `Returned ${item.contractId} for rework`,
      );
      onResolved(item.contractId, decision);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : isVi
            ? 'Không thể gửi quyết định phê duyệt.'
            : 'Unable to submit review decision.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const ageLabel = item.updatedAt ? formatDurationShort(item.updatedAt) : '';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b px-4 sm:px-6 xl:px-10">
        {isMobile && (
          <Button variant="ghost" size="sm" className="-ms-2 h-8 gap-1.5" onClick={onBack}>
            <ChevronLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
            {isVi ? 'Hộp thư' : 'Inbox'}
          </Button>
        )}
        <Badge variant="default" className="gap-1 text-xs">
          <ShieldCheck className="size-3" />
          {isVi ? 'Chờ phê duyệt' : 'Pending Review'}
        </Badge>
        <span className="font-mono text-xs text-muted-foreground">{item.contractId}</span>
        {item.projectKey && (
          <Badge variant="outline" className="font-mono text-xs">
            {item.projectKey}
          </Badge>
        )}
        <Badge variant="secondary" className="text-xs">
          {item.priority}
        </Badge>
        <div className="ms-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigateFeatureInstant(openOfficePath(projectKey))}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <span>{isVi ? 'Văn phòng mở' : 'Open Office'}</span>
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 xl:px-10">
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {item.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isVi ? 'Thực hiện bởi' : 'Submitted by'}{' '}
              <span className="font-medium text-foreground">{item.actorName}</span>
              {item.domain ? ` · ${item.domain}` : ''}
              {item.confidencePct != null ? ` · ${item.confidencePct}%` : ''}
              {ageLabel ? ` · ${ageLabel}` : ''}
            </p>
          </div>

          <section className="space-y-2 border-t border-border pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isVi ? 'Tiêu chí nghiệm thu' : 'Acceptance Criteria'}
            </h3>
            {item.acceptanceCriteria.length > 0 ? (
              <ul className="space-y-1.5 text-sm text-foreground">
                {item.acceptanceCriteria.map((criterion, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                {isVi
                  ? 'Kiểm tra kết quả đầu ra và xác nhận trước khi phê duyệt.'
                  : 'Verify deliverable scope and proof before signing off.'}
              </p>
            )}
          </section>

          {(item.evidenceSummary || item.evidenceLinks.length > 0) && (
            <section className="space-y-2 border-t border-border pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {isVi ? 'Bằng chứng & Tóm tắt kiểm thử' : 'Evidence & Verification'}
              </h3>
              {item.evidenceSummary && (
                <p className="rounded-md bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-foreground">
                  {item.evidenceSummary}
                </p>
              )}
              {item.evidenceLinks.length > 0 && (
                <ul className="space-y-1 font-mono text-xs text-muted-foreground">
                  {item.evidenceLinks.map((link, idx) => (
                    <li key={idx} className="truncate">
                      {link}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className="space-y-4 border-t border-border pt-4">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="size-4 rounded border-border"
              />
              <span>
                {isVi
                  ? 'Xác nhận đã kiểm tra đủ tiêu chí nghiệm thu'
                  : 'Confirm all acceptance criteria have been verified'}
              </span>
            </label>

            <div className="space-y-1.5">
              <label
                htmlFor={`inbox-review-note-${item.contractId}`}
                className="block text-xs font-medium text-muted-foreground"
              >
                {isVi ? 'Ghi chú nghiệm thu / lý do chỉnh sửa' : 'Review note / rework instructions'}
              </label>
              <textarea
                ref={reworkInputRef}
                id={`inbox-review-note-${item.contractId}`}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  isVi
                    ? 'Nhập ghi chú (tùy chọn khi duyệt, khuyên dùng khi yêu cầu làm lại)...'
                    : 'Add context (optional on approve, helpful when requesting rework)...'
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none"
              />
            </div>

            {error && (
              <div
                role="alert"
                data-testid="inbox-decision-error"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                data-testid="btn-inbox-approve-decision"
                disabled={submitting || !verified}
                onClick={() => void handleDecision('APPROVE')}
                className="h-9 gap-1.5 text-xs font-semibold"
              >
                <Check className="size-3.5 shrink-0" />
                <span>
                  {submitting
                    ? isVi
                      ? 'Đang xử lý...'
                      : 'Submitting...'
                    : isVi
                      ? 'Phê duyệt (A)'
                      : 'Approve (A)'}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                data-testid="btn-inbox-rework-decision"
                disabled={submitting}
                onClick={() => void handleDecision('RETURN_FOR_REWORK')}
                className="h-9 gap-1.5 text-xs"
              >
                <RotateCcw className="size-3.5 shrink-0" />
                <span>{isVi ? 'Yêu cầu làm lại (R)' : 'Request Rework (R)'}</span>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
