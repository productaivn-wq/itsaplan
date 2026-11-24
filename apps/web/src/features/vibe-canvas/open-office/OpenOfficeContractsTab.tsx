'use client';

import { Copy, Database, FileCheck2, FileText, History, ListChecks, RotateCcw, Send, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ProgressiveDisclosure } from '@/components/common/ux/ProgressiveDisclosure';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EvidenceFullscreenReader } from './EvidenceFullscreenReader';
import { OpenOfficeContractComposer } from './OpenOfficeContractComposer';
import type { OpenOfficeWorkspaceController } from './useOpenOfficeWorkspaceController';

function formatStatusLabel(status: string, locale: 'vi' | 'en'): string {
  const normalized = status.toUpperCase();
  switch (normalized) {
    case 'AWAITING_HITL':
      return locale === 'en' ? 'Waiting approval' : 'Chờ duyệt';
    case 'IN_PROGRESS':
      return locale === 'en' ? 'In progress' : 'Đang thực hiện';
    case 'DONE':
      return locale === 'en' ? 'Completed' : 'Hoàn thành';
    case 'RETURNED_FOR_REWORK':
      return locale === 'en' ? 'Changes requested' : 'Yêu cầu sửa';
    case 'QUEUED':
    case 'PENDING':
      return locale === 'en' ? 'Queued' : 'Đang chờ';
    default:
      return status;
  }
}

export function OpenOfficeContractsTab({ ctrl }: { ctrl: OpenOfficeWorkspaceController }) {
  const {
    acceptanceVerified,
    approverId,
    checkedCriteriaMap,
    contractDetail,
    copiedSlipNotice,
    dict,
    evidenceLinks,
    evidenceReaderOpen,
    evidenceSubmitting,
    evidenceSummary,
    handleCopyContractSlip,
    handleSubmitEvidence,
    handleSubmitReview,
    isUnitDom,
    locale,
    reviewActualMinutes,
    reviewReason,
    reviewSubmitting,
    selectedContract,
    selectedContractId,
    setAcceptanceVerified,
    setApproverId,
    setCheckedCriteriaMap,
    setEvidenceLinks,
    setEvidenceReaderOpen,
    setEvidenceSummary,
    setReviewActualMinutes,
    setReviewReason,
    setSelectedContractId,
    snapshot,
  } = ctrl;

  return (
        <div className="flex min-w-0 flex-col space-y-4 p-4">
          {/* Highlighted "Hộp Cần tôi xử lý" (Needs My Action) Queue Strip */}
          <Card
            data-testid="needs-my-action-strip"
            className="space-y-2 border-amber-500/40 bg-amber-500/10 p-4 text-slate-900 dark:text-slate-100"
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-amber-700 dark:text-amber-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-950 dark:text-amber-100">
                  Hộp Cần tôi xử lý ({snapshot.needs_my_action.length} chờ duyệt · Hợp đồng chờ nghiệm thu HITL)
                </h3>
              </div>
              <Badge
                variant="outline"
                className="ml-auto border-amber-600/50 text-xs font-semibold text-amber-950 dark:text-amber-200"
              >
                Kiểm duyệt phân tách
              </Badge>
            </div>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
              {locale === 'en'
                ? 'Completed assignments waiting for you to verify acceptance criteria before approval.'
                : 'Các công việc đã hoàn thành và đang chờ bạn kiểm tra tiêu chí trước khi phê duyệt.'}
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {snapshot.needs_my_action.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={selectedContractId === item.id ? 'default' : 'outline'}
                  size="sm"
                  
                  onClick={() => {
                    setSelectedContractId(item.id);
                    setAcceptanceVerified(!isUnitDom);
                  }}
                  data-testid={`btn-select-hitl-${item.id}`}
                  className="h-8 gap-1.5 text-xs"
                >
                  <FileCheck2 className="size-3.5 shrink-0" />
                  <span className="tabular-nums">{item.id}</span>
                  <span className="max-w-[200px] truncate">
                    {item.title}
                  </span>
                </Button>
              ))}
              {snapshot.needs_my_action.length === 0 && (
                <span className="text-xs font-medium italic text-slate-800 dark:text-slate-300">
                  Không có hợp đồng nào đang chờ phê duyệt (0 chờ duyệt).
                </span>
              )}
            </div>
          </Card>

          {/* 2-Column Working Area: Composer (Left) & Inspector (Right) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left: 1-Card Task Composer & Contract Queue List */}
            <div className="min-w-0 space-y-4 lg:col-span-5">
              <ProgressiveDisclosure
                label={locale === 'en' ? 'New Task Assignment' : '+ Giao việc mới'}
                defaultOpen={false}
                keepMounted
                triggerTestId="btn-toggle-contracts-composer"
                triggerVariant="row"
              >
                <OpenOfficeContractComposer ctrl={ctrl} />
              </ProgressiveDisclosure>

              {/* Contract Queue List */}
              <Card className="min-w-0 space-y-2 border-border bg-card p-3 text-card-foreground">
                <span className="text-xs font-semibold text-muted-foreground">
                  Danh sách hợp đồng ({snapshot.contracts.length})
                </span>
                <div className="space-y-1.5">
                  {snapshot.contracts.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedContractId(c.id);
                        setAcceptanceVerified(!isUnitDom);
                      }}
                      className={`flex min-w-0 cursor-pointer items-center gap-2 rounded-md border p-2 text-xs transition-colors ${
                        selectedContractId === c.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-muted/20 hover:bg-muted/40'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono text-xs font-semibold text-foreground">
                          [{c.project_key || 'PM'}] {c.id} · {c.title}
                        </div>
                        <div className="truncate text-muted-foreground">
                          {c.lead_agent_name || c.lead_agent_id} · {c.domain}
                        </div>
                      </div>
                      <Badge
                        variant={c.status === 'DONE' ? 'default' : 'secondary'}
                        className="ml-auto shrink-0 text-xs"
                      >
                        {formatStatusLabel(c.status, locale)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right: Selected Contract Inspector, Lineage & Action Gate */}
            <div className="min-w-0 space-y-4 lg:col-span-7">
              {selectedContract ? (
                <Card className="min-w-0 space-y-4 rounded-2xl border-border bg-card p-4 text-card-foreground">
                  {/* Contract Header */}
                  <div>
                    <div className="space-y-2 border-b border-border pb-3">
                      <div className="flex flex-wrap items-start gap-2">
                        <div className="min-w-[min(100%,14rem)] flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary">
                              {selectedContract.id}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {selectedContract.domain}
                            </Badge>
                            <Badge
                              variant={selectedContract.status === 'DONE' ? 'default' : 'secondary'}
                              className="text-xs font-semibold"
                            >
                              {formatStatusLabel(selectedContract.status, locale)}
                            </Badge>
                          </div>
                          <h4 className="mt-1 text-sm font-semibold text-foreground">
                            {selectedContract.title}
                          </h4>
                          {selectedContract.summary && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {selectedContract.summary}
                            </p>
                          )}
                        </div>
                        <div className="ml-auto flex flex-wrap items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyContractSlip(selectedContract)}
                            data-testid="btn-copy-contract-slip"
                            className="min-h-9 gap-1.5 text-xs"
                          >
                            <Copy className="size-3.5" />
                            <span>{dict.copySlipLabel}</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEvidenceReaderOpen(true)}
                            data-testid="btn-open-evidence-reader"
                            className="min-h-9 gap-1.5 text-xs"
                          >
                            <FileText className="size-3.5" />
                            <span>{dict.fullscreenEvidenceLabel}</span>
                          </Button>
                        </div>
                      </div>
                      {copiedSlipNotice && (
                        <div
                          data-testid="copied-slip-notice"
                          className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200"
                        >
                          {copiedSlipNotice}
                        </div>
                      )}
                    </div>
                    <EvidenceFullscreenReader
                      open={evidenceReaderOpen}
                      locale={locale}
                      contract={selectedContract}
                      contractDetail={contractDetail}
                      onClose={() => setEvidenceReaderOpen(false)}
                    />
                  </div>

                  {/* V61 2-Column Contract Dossier */}
                  <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(240px,1fr)]">
                    <div className="min-w-0 space-y-3">
                      {/* Acceptance Criteria Checklist */}
                      {(() => {
                        const criteriaList = Array.isArray(selectedContract.acceptance_criteria)
                          ? selectedContract.acceptance_criteria
                          : [];
                        const tickedCount = criteriaList.filter((_, idx) =>
                          Boolean(checkedCriteriaMap[idx])
                        ).length;
                        return (
                          <div
                            data-testid="criteria-checklist"
                            className="space-y-1.5 rounded-xl border border-border bg-muted/20 p-3"
                          >
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                <ListChecks className="size-3.5 text-primary" />
                                {locale === 'en'
                                  ? 'Step 1 · Verify Criteria & Evidence'
                                  : 'Bước 1 · Đối soát tiêu chí & Bằng chứng'}
                              </span>
                              <span data-testid="criteria-progress" className="ml-auto font-mono text-xs text-muted-foreground">{tickedCount}/{criteriaList.length} {dict.criteriaProgressLabel}</span>
                            </div>
                            <div className="space-y-1.5 pt-1">
                              {criteriaList.map((cr, idx) => (
                                <label
                                  key={idx}
                                  className="min-h-11 flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-card px-3 py-2 text-xs transition-colors hover:border-foreground/40"
                                >
                                  <input
                                    type="checkbox"
                                    data-testid={`criteria-tick-${idx}`}
                                    checked={Boolean(checkedCriteriaMap[idx])}
                                    onChange={(e) => {
                                      const nextMap = { ...checkedCriteriaMap, [idx]: e.target.checked };
                                      setCheckedCriteriaMap(nextMap);
                                      if (selectedContract.status === 'AWAITING_HITL' && criteriaList.length > 0) {
                                        const allChecked = criteriaList.every((_, i) => Boolean(nextMap[i]));
                                        setAcceptanceVerified(allChecked);
                                      }
                                    }}
                                    className="mt-0.5 size-4 shrink-0 rounded border-border"
                                  />
                                  <span className={checkedCriteriaMap[idx] ? 'text-foreground line-through opacity-75' : 'text-foreground'}>{cr}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Contextual Action Sub-Panel */}
                      {selectedContract.status === 'IN_PROGRESS' && (
                        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
                          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                            Cổng nộp bằng chứng nghiệm thu (Evidence Submission)
                          </span>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground">
                              Tóm tắt bằng chứng
                            </label>
                            <Input
                              value={evidenceSummary}
                              onChange={(e) => setEvidenceSummary(e.target.value)}
                              placeholder="Mô tả bằng chứng hoàn thành..."
                              data-testid="input-evidence-summary"
                              className="mt-1 min-h-9 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground">
                              Liên kết bằng chứng / Pull Request
                            </label>
                            <Input
                              value={evidenceLinks}
                              onChange={(e) => setEvidenceLinks(e.target.value)}
                              placeholder="https://..."
                              data-testid="input-evidence-links"
                              className="mt-1 min-h-9 text-xs"
                            />
                          </div>
                          <div className="pt-1">
                            <Button
                              type="button"
                              size="sm"
                              disabled={evidenceSubmitting || !evidenceSummary.trim()}
                              onClick={handleSubmitEvidence}
                              data-testid="btn-submit-evidence"
                              className="min-h-9 w-full gap-1.5 text-xs"
                            >
                              <Send className="size-3.5" />
                              <span>{evidenceSubmitting ? 'Đang nộp...' : 'Nộp bằng chứng nghiệm thu'}</span>
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedContract.status === 'AWAITING_HITL' && (
                        <div className="space-y-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                          <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                            {locale === 'en'
                              ? 'Step 2 · Approval Decision'
                              : 'Bước 2 · Quyết định phê duyệt'}
                          </span>

                          <div>
                            <label className="text-xs font-semibold text-muted-foreground">
                              Ghi chú / Lý do
                            </label>
                            <Input
                              value={reviewReason}
                              onChange={(e) => setReviewReason(e.target.value)}
                              placeholder="Nhập lý do..."
                              data-testid="input-review-reason"
                              className="mt-0.5 h-8 text-xs"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="check-acceptance-verified"
                              checked={acceptanceVerified}
                              onChange={(e) => setAcceptanceVerified(e.target.checked)}
                              data-testid="checkbox-acceptance-verified"
                              className="size-4 rounded border-border"
                            />
                            <label
                              htmlFor="check-acceptance-verified"
                              className="cursor-pointer text-xs font-medium text-foreground"
                            >
                              Đã đối soát 100% tiêu chí nghiệm thu bắt buộc
                            </label>
                          </div>

                          <ProgressiveDisclosure
                            label={
                              locale === 'en'
                                ? 'Approval details'
                                : 'Chi tiết người duyệt & thời gian'
                            }
                            summary={`${approverId} · ${reviewActualMinutes}m`}
                            defaultOpen={false}
                            keepMounted
                            triggerTestId="btn-toggle-review-details"
                            triggerVariant="ghost"
                          >
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <div>
                                <label className="text-xs font-semibold text-muted-foreground">
                                  Người duyệt (Approver)
                                </label>
                                <Input
                                  value={approverId}
                                  onChange={(e) => setApproverId(e.target.value)}
                                  placeholder="hum-phuong-vo"
                                  data-testid="input-approver-id"
                                  className="mt-0.5 h-8 text-xs"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-muted-foreground">
                                  Thời gian (phút)
                                </label>
                                <Input
                                  type="number"
                                  value={reviewActualMinutes}
                                  onChange={(e) => setReviewActualMinutes(Number(e.target.value))}
                                  data-testid="input-actual-minutes"
                                  className="mt-0.5 h-8 text-xs"
                                />
                              </div>
                            </div>
                          </ProgressiveDisclosure>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={reviewSubmitting || !reviewReason.trim()}
                              onClick={() => handleSubmitReview('RETURN_FOR_REWORK')}
                              data-testid="btn-rework-review"
                              className="min-h-9 flex-1 gap-1.5 text-xs"
                            >
                              <RotateCcw className="size-3.5" />
                              <span>Trả lại làm lại</span>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={reviewSubmitting || !acceptanceVerified}
                              onClick={() => handleSubmitReview('APPROVE')}
                              data-testid="btn-approve-review"
                              className="min-h-9 flex-1 gap-1.5 bg-foreground text-xs font-semibold text-background hover:bg-foreground/90"
                            >
                              <ShieldCheck className="size-3.5" />
                              <span>Phê duyệt nghiệm thu</span>
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Chronological TaskRun Lineage */}
                      <div className="space-y-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <History className="size-3.5" />
                          Lịch sử thực thi (TaskRun #1..N)
                        </span>

                        <div className="space-y-2">
                          {contractDetail?.runs.map((run) => (
                            <div
                              key={run.run_id}
                              className="space-y-1.5 rounded-xl border border-border bg-muted/20 p-3 text-xs"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-semibold text-foreground">
                                  Lượt chạy #{run.run_number} · {run.actor_name || run.actor_id}
                                </span>
                                <Badge
                                  variant={
                                    run.status === 'SUCCESS'
                                      ? 'default'
                                      : run.status === 'RETURNED_FOR_REWORK'
                                        ? 'outline'
                                        : 'secondary'
                                  }
                                  className="ml-auto text-xs"
                                >
                                  {formatStatusLabel(run.status, locale)}
                                </Badge>
                              </div>

                              {run.evidence_summary && (
                                <p className="text-xs text-muted-foreground">
                                  {run.evidence_summary}
                                </p>
                              )}

                              {run.return_reason && (
                                <div className="rounded border border-amber-500/40 bg-amber-500/10 p-1.5 text-xs text-amber-900 dark:text-amber-200">
                                  <strong>Lý do trả lại:</strong> {run.return_reason}
                                </div>
                              )}

                              {run.evidence_links && run.evidence_links.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {run.evidence_links.map((link, i) => (
                                    <a
                                      key={i}
                                      href={link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="max-w-[280px] truncate text-xs text-primary underline"
                                    >
                                      {link}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 space-y-3 xl:sticky xl:top-2">
                      {/* Committed vs Actual Telemetry */}
                      {contractDetail?.committed_vs_actual && (
                        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/20 p-3 text-xs xl:grid-cols-1">
                          <div>
                            <span className="text-muted-foreground">Thời gian (Phút):</span>
                            <div className="mt-0.5 font-mono tabular-nums text-foreground">
                              {contractDetail.committed_vs_actual.actual_minutes} / {contractDetail.committed_vs_actual.estimated_minutes}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tokens tiêu thụ:</span>
                            <div className="mt-0.5 font-mono tabular-nums text-foreground">
                              {contractDetail.committed_vs_actual.actual_tokens} / {contractDetail.committed_vs_actual.estimated_tokens}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Độ tin cậy cam kết:</span>
                            <div className="mt-0.5 font-mono tabular-nums whitespace-nowrap text-foreground">
                              {contractDetail.committed_vs_actual.confidence_pct}%
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Immutable Event Log Audit Strip */}
                      <ProgressiveDisclosure
                        label={
                          locale === 'en'
                            ? 'Audit event log'
                            : 'Nhật ký kiểm chứng (SHA-256)'
                        }
                        count={contractDetail?.events.length ?? 0}
                        defaultOpen={false}
                        keepMounted
                        triggerTestId="btn-toggle-audit-log"
                        triggerVariant="row"
                      >
                        <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                              <Database className="size-3.5 text-primary" />
                              Nhật ký sự kiện bất biến (SHA-256)
                            </span>
                            <Badge
                              variant="outline"
                              className="ml-auto border-emerald-500/40 text-xs text-emerald-700 dark:text-emerald-400"
                            >
                              <ShieldCheck className="mr-1 size-3" />
                              Chuỗi băm toàn vẹn
                            </Badge>
                          </div>

                          <div className="space-y-1 pt-1 font-mono text-xs">
                            {contractDetail?.events.map((ev) => {
                              const h = ev.sha256_hash || ev.event_hash || '';
                              return (
                                <div key={ev.event_id} className="flex min-w-0 items-center gap-2 py-0.5 text-muted-foreground">
                                  <span className="min-w-0 flex-1 truncate">
                                    {ev.event_type} ({ev.actor_id})
                                  </span>
                                  <span className="ml-auto max-w-[160px] truncate tabular-nums text-foreground">
                                    {h ? `${h.substring(0, 16)}...` : '---'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </ProgressiveDisclosure>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="border-border bg-card p-8 text-center text-xs text-muted-foreground">
                  Chọn một hợp đồng để kiểm tra chi tiết và đối soát bằng chứng.
                </Card>
              )}
            </div>
          </div>
        </div>
  );
}
