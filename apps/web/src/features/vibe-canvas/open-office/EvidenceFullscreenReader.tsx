'use client';

import * as React from 'react';
import { ExternalLink, FileText, X } from 'lucide-react';
import type { OpenOfficeContract, OpenOfficeContractDetail } from '../types';
import type { OpenOfficeLocale } from './openOfficeConstants';

export interface EvidenceFullscreenReaderProps {
  open: boolean;
  locale: OpenOfficeLocale;
  contract: OpenOfficeContract | null;
  contractDetail: OpenOfficeContractDetail | null;
  onClose: () => void;
}

const FONT_STEPS_PX = [16, 19, 22, 26] as const;

export function EvidenceFullscreenReader({
  open,
  locale,
  contract,
  contractDetail,
  onClose,
}: EvidenceFullscreenReaderProps) {
  const isVi = locale === 'vi';
  const [stepIdx, setStepIdx] = React.useState<number>(1);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !contract) return null;

  const fontSizePx = FONT_STEPS_PX[stepIdx] ?? 19;
  const runs = contractDetail?.runs || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${isVi ? 'Trình đọc bằng chứng' : 'Evidence Reader'} ${contract.id}`}
      data-testid="evidence-fullscreen-reader"
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground"
    >
      {/* Top Reader Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <FileText className="size-4 shrink-0 text-primary" />
          <span className="shrink-0 font-mono text-xs font-bold text-primary">
            {contract.id}
          </span>
          <h2 className="truncate text-sm font-bold text-foreground">{contract.title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background p-1">
            <button
              type="button"
              data-testid="btn-reader-font-dec"
              disabled={stepIdx <= 0}
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              aria-label={isVi ? 'Thu nhỏ cỡ chữ' : 'Decrease font size'}
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full px-2.5 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-40"
            >
              A−
            </button>
            <span
              data-testid="reader-font-size-label"
              className="px-1.5 font-mono text-xs font-semibold tabular-nums text-muted-foreground"
            >
              {fontSizePx}px
            </span>
            <button
              type="button"
              data-testid="btn-reader-font-inc"
              disabled={stepIdx >= FONT_STEPS_PX.length - 1}
              onClick={() => setStepIdx((i) => Math.min(FONT_STEPS_PX.length - 1, i + 1))}
              aria-label={isVi ? 'Phóng to cỡ chữ' : 'Increase font size'}
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full px-2.5 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-40"
            >
              A+
            </button>
          </div>

          <button
            type="button"
            data-testid="btn-reader-close"
            onClick={onClose}
            aria-label={isVi ? 'Đóng trình đọc' : 'Close reader'}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <X className="size-4" />
            <span>{isVi ? 'Đóng' : 'Close'}</span>
          </button>
        </div>
      </div>

      {/* Scrollable Prose Body */}
      <div className="flex-1 overflow-y-auto px-5 py-8">
        <div
          data-testid="evidence-reader-body"
          style={{ fontSize: `${fontSizePx}px`, lineHeight: 1.65 }}
          className="mx-auto max-w-3xl space-y-6"
        >
          {contract.summary && (
            <section className="space-y-2 rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {isVi ? 'Mục tiêu & Tóm tắt' : 'Contract Summary'}
              </h3>
              <p className="text-foreground">{contract.summary}</p>
            </section>
          )}

          {Array.isArray(contract.acceptance_criteria) && contract.acceptance_criteria.length > 0 && (
            <section className="space-y-2 rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {isVi ? 'Tiêu chí nghiệm thu' : 'Acceptance Criteria'}
              </h3>
              <ul className="list-disc space-y-1.5 pl-5 text-foreground">
                {contract.acceptance_criteria.map((crit, idx) => (
                  <li key={idx}>{crit}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isVi
                ? `Bằng chứng & Kết quả thực thi (${runs.length} lượt)`
                : `Execution Evidence (${runs.length} runs)`}
            </h3>
            {runs.length === 0 ? (
              <p className="text-muted-foreground">
                {isVi
                  ? 'Chưa có lượt chạy hoặc bằng chứng được nộp.'
                  : 'No execution runs or evidence submitted yet.'}
              </p>
            ) : (
              <div className="space-y-4">
                {runs.map((run) => (
                  <div
                    key={run.run_id || run.run_number}
                    className="space-y-2 rounded-xl border border-border bg-background p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-bold text-foreground">
                        {isVi ? `Lượt chạy #${run.run_number}` : `Run #${run.run_number}`} ·{' '}
                        {run.actor_name || run.actor_id}
                      </span>
                      <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 font-mono font-semibold text-foreground">
                        {run.status}
                      </span>
                    </div>
                    {run.evidence_summary && (
                      <p className="whitespace-pre-wrap text-foreground">
                        {run.evidence_summary}
                      </p>
                    )}
                    {run.return_reason && (
                      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-amber-900 dark:text-amber-200">
                        <strong>{isVi ? 'Lý do trả lại:' : 'Return Reason:'}</strong>{' '}
                        {run.return_reason}
                      </div>
                    )}
                    {run.evidence_links && run.evidence_links.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {run.evidence_links.map((lnk, i) => (
                          <a
                            key={i}
                            href={lnk}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-semibold text-primary underline hover:bg-muted"
                          >
                            <span>{lnk}</span>
                            <ExternalLink className="size-3.5" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
