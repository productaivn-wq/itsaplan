'use client';

import * as React from 'react';
import { Check, ExternalLink, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { OpenOfficeContract, OpenOfficeContractDetail } from '../types';
import {
  OPEN_OFFICE_DICTIONARY,
  type OpenOfficeLocale,
} from './openOfficeConstants';

export interface SovereignHitlQuickDrawerProps {
  open: boolean;
  needsMyAction: OpenOfficeContract[];
  selectedContractId: string | null;
  contractDetail: OpenOfficeContractDetail | null;
  sessionApproverId: string;
  reviewSubmitting: boolean;
  isUnitDom: boolean;
  locale?: OpenOfficeLocale;
  onClose: () => void;
  onSelectContract: (contractId: string) => void;
  onSubmitQuickReview: (params: {
    contractId: string;
    decision: 'APPROVE' | 'RETURN_FOR_REWORK';
    approverId: string;
    acceptanceVerified: boolean;
    reason: string;
  }) => Promise<void> | void;
}

export default function SovereignHitlQuickDrawer({
  open,
  needsMyAction,
  selectedContractId,
  contractDetail,
  sessionApproverId,
  reviewSubmitting,
  isUnitDom,
  locale = 'vi',
  onClose,
  onSelectContract,
  onSubmitQuickReview,
}: SovereignHitlQuickDrawerProps) {
  const dict = OPEN_OFFICE_DICTIONARY[locale];
  const activeContract = React.useMemo(() => {
    return (
      needsMyAction.find((c) => c.id === selectedContractId) ||
      needsMyAction[0] ||
      contractDetail?.contract ||
      null
    );
  }, [needsMyAction, selectedContractId, contractDetail]);

  const [verified, setVerified] = React.useState<boolean>(() => false);
  const [reworkNote, setReworkNote] = React.useState<string>('');

  React.useEffect(() => {
    setVerified(false);
    setReworkNote('');
  }, [activeContract?.id, isUnitDom]);

  if (!open || !activeContract) return null;

  const latestRun =
    contractDetail && contractDetail.contract?.id === activeContract.id
      ? contractDetail.runs?.[contractDetail.runs.length - 1]
      : null;

  return (
    <section
      data-testid="sovereign-hitl-quick-drawer"
      className="mx-2 mt-1.5 rounded-xl border border-primary/40 bg-card p-3 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            {dict.quickReviewTitle}
          </span>
          <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
            Approver: {sessionApproverId}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {needsMyAction.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectContract(item.id)}
              className={`rounded-md border px-2 py-0.5 text-xs transition-colors ${
                item.id === activeContract.id
                  ? 'border-primary bg-primary text-primary-foreground font-semibold'
                  : 'border-border bg-muted/30 text-foreground hover:bg-muted'
              }`}
            >
              <span className="font-mono">{item.id}</span>
            </button>
          ))}
          <button
            type="button"
            aria-label={dict.quickReviewClose}
            onClick={onClose}
            className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Left: Deliverable & Evidence Summary */}
        <div className="space-y-1.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="font-mono text-xs">
              [{activeContract.project_key || 'PM'}]
            </Badge>
            <span className="font-mono font-semibold text-foreground">
              {activeContract.id}
            </span>
            <span className="font-semibold text-foreground">
              {activeContract.title}
            </span>
            <span className="text-muted-foreground">
              · Lead: {activeContract.lead_agent_name || activeContract.lead_agent_id}
            </span>
          </div>

          {(activeContract.acceptance_criteria ?? []).length > 0 && (
            <ul className="space-y-0.5 rounded-lg bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground">
              {(activeContract.acceptance_criteria ?? []).slice(0, 3).map((crit, idx) => (
                <li key={idx}>• {crit}</li>
              ))}
            </ul>
          )}

          {latestRun && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs">
              <span className="font-mono font-semibold text-foreground">
                Run #{latestRun.run_number}
              </span>
              <span className="text-muted-foreground">
                {latestRun.evidence_summary}
              </span>
              {latestRun.evidence_links?.map((lnk, idx) => (
                <a
                  key={idx}
                  href={lnk}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-primary underline"
                >
                  <span>Proof #{idx + 1}</span>
                  <ExternalLink className="size-3" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Right: 2-Click Fail-Closed GW-SOD-01 Decision Controls */}
        <div className="flex flex-col gap-3 gap-2 rounded-lg bg-muted/25 p-2.5">
          <label className="flex cursor-pointer items-start gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              data-testid="checkbox-quick-hitl-verified"
              className="mt-0.5 size-4 shrink-0 rounded border-border"
            />
            <span>{dict.quickReviewVerifyLabel}</span>
          </label>

          <Input
            value={reworkNote}
            onChange={(e) => setReworkNote(e.target.value)}
            placeholder={
              locale === 'en'
                ? 'Optional audit / rework note...'
                : 'Ghi chú nghiệm thu hoặc lý do yêu cầu làm lại (tùy chọn)...'
            }
            data-testid="input-quick-hitl-note"
            className="h-8 text-xs"
          />

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={reviewSubmitting}
              data-testid="btn-quick-hitl-rework"
              onClick={() =>
                onSubmitQuickReview({
                  contractId: activeContract.id,
                  decision: 'RETURN_FOR_REWORK',
                  approverId: sessionApproverId,
                  acceptanceVerified: false,
                  reason:
                    reworkNote.trim() ||
                    'Yêu cầu bổ sung kiểm thử và bằng chứng nghiệm thu',
                })
              }
              className="h-8 gap-1 text-xs"
            >
              <RotateCcw className="size-3.5" />
              <span>{dict.quickReviewRework}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={reviewSubmitting || !verified}
              data-testid="btn-quick-hitl-approve"
              onClick={() =>
                onSubmitQuickReview({
                  contractId: activeContract.id,
                  decision: 'APPROVE',
                  approverId: sessionApproverId,
                  acceptanceVerified: verified,
                  reason:
                    reworkNote.trim() ||
                    'Đã xác thực đạt chuẩn duyệt độc lập',
                })
              }
              className="h-8 gap-1 text-xs"
            >
              <Check className="size-3.5" />
              <span>{dict.quickReviewApprove}</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
