'use client';

import { ArrowLeft, ArrowRight, Send, SlidersHorizontal } from 'lucide-react';
import { GuidedStepper, type GuidedStepDef } from '@/components/common/ux/GuidedStepper';
import { ProgressiveDisclosure } from '@/components/common/ux/ProgressiveDisclosure';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PixelAgentAvatar } from '../components/PixelOfficeCanvas';
import { computeAgentWorkloadAndStage } from './openOfficeConstants';
import type { OpenOfficeWorkspaceController } from './useOpenOfficeWorkspaceController';

const COMPOSER_STEPS: readonly GuidedStepDef[] = [
  { id: 'step-1', label: 'Mục tiêu & Nhân sự', testId: 'composer-step-1' },
  { id: 'step-2', label: 'Phạm vi & Tiêu chí', testId: 'composer-step-2' },
  { id: 'step-3', label: 'Ràng buộc & Xác nhận', testId: 'composer-step-3' },
];

export function OpenOfficeContractComposer({ ctrl }: { ctrl: OpenOfficeWorkspaceController }) {
  const {
    autoDraftCriteria,
    autoExecute,
    composerAcceptanceCriteria,
    composerCycleId,
    composerDescription,
    composerDueDate,
    composerForbiddenActions,
    composerInitiativeId,
    composerInputScope,
    composerLeadAgentId,
    composerNotice,
    composerOutputFormat,
    composerPriority,
    composerProjectKey,
    composerRef,
    composerStep,
    composerSubmitting,
    composerSupportAgentIds,
    composerTemplateId,
    composerTitle,
    composerWeeklyRepeat,
    cyclesList,
    dict,
    handleSelectTemplate,
    handleSubmitContract,
    initiativesList,
    locale,
    officeMode,
    projectsList,
    setActiveTab,
    setAutoDraftCriteria,
    setAutoExecute,
    setComposerAcceptanceCriteria,
    setComposerCycleId,
    setComposerDescription,
    setComposerDueDate,
    setComposerForbiddenActions,
    setComposerInitiativeId,
    setComposerInputScope,
    setComposerLeadAgentId,
    setComposerOutputFormat,
    setComposerPriority,
    setComposerProjectKey,
    setComposerStep,
    setComposerSupportAgentIds,
    setComposerTitle,
    setComposerWeeklyRepeat,
    setSelectedContractId,
    setSelectedStationId,
    setShowAdvancedComposer,
    showAdvancedComposer,
    snapshot,
    titleInputRef,
  } = ctrl;

  const criteriaCount = composerAcceptanceCriteria
    .split('\n')
    .filter((line) => line.trim().length > 0).length;
  const leadAgentLabel =
    snapshot.stations.find((s) => s.agent_id === composerLeadAgentId)?.agent_name ||
    composerLeadAgentId;

  return (
    <div
      ref={composerRef}
      data-testid="card-contract-composer"
      className="overflow-hidden rounded-[20px] border border-border/85 bg-card shadow-[var(--studio-card-shadow)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-border/75 bg-muted/55 px-3.5 py-2.5 text-foreground">
        <span className="text-xs font-bold uppercase tracking-wider">GIAO VIỆC NHANH</span>
        <div className="flex items-center gap-1.5">
          <span className="hidden text-xs text-muted-foreground sm:inline">{dict.contractSheetSubtitle}</span>
          <button
            type="button"
            data-testid="btn-toggle-advanced-composer"
            aria-label="Tùy chỉnh hợp đồng"
            aria-expanded={showAdvancedComposer}
            onClick={() => setShowAdvancedComposer((v) => !v)}
            className="inline-flex min-h-7 shrink-0 items-center gap-1 rounded-full border border-border/85 bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            <SlidersHorizontal className="size-3.5" />
            <span>{showAdvancedComposer ? 'Thu gọn' : 'Theo từng bước'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-2 p-2.5">
        {composerNotice && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-2 text-xs text-foreground">
            {composerNotice}
          </div>
        )}

        {/* Quick Goal Title Input */}
        <div className="space-y-1">
          <Input
            ref={titleInputRef}
            value={composerTitle}
            onChange={(e) => setComposerTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && composerTitle.trim() && composerAcceptanceCriteria.trim()) {
                e.preventDefault();
                void handleSubmitContract();
              }
            }}
            placeholder="Nhập mục tiêu giao việc..."
            data-testid="input-contract-title"
            className="h-8 w-full text-xs"
          />
        </div>

        {/* Quick Template Select & Single Primary Submit CTA */}
        <div className={`flex items-center gap-2 ${officeMode === 'simple' ? 'flex-wrap' : ''}`}>
          {officeMode === 'simple' ? (
            <div className="flex flex-wrap gap-1">
              {snapshot.templates.map((tpl) => {
                const selected = composerTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    data-testid={`tpl-chip-${tpl.id}`}
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                      selected
                        ? 'border-primary/40 bg-primary/10 font-semibold text-foreground'
                        : 'border-border bg-background text-foreground hover:bg-muted/60'
                    }`}
                  >
                    {tpl.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <select
              value={composerTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              data-testid="select-contract-template"
              className="flex h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-xs text-foreground"
            >
              {snapshot.templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.domain})
                </option>
              ))}
            </select>
          )}

          <Button
            type="button"
            size="sm"
            disabled={composerSubmitting || !composerAcceptanceCriteria.trim()}
            onClick={handleSubmitContract}
            data-testid="btn-submit-open-office-contract"
            className="ml-auto h-8 shrink-0 gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-semibold text-background hover:bg-foreground/90"
          >
            <Send className="size-3.5" />
            <span>{composerSubmitting ? 'Đang giao...' : 'Giao ngay'}</span>
          </Button>
        </div>

        {/* Expandable 3-Step Guided Composer */}
        <div
          aria-hidden={!showAdvancedComposer}
          className={showAdvancedComposer ? 'space-y-3 border-t border-border pt-3' : 'hidden'}
        >
          <GuidedStepper
            testId="contract-composer-stepper"
            ariaLabel="Các bước tùy chỉnh hợp đồng"
            keepMounted={true}
            compact={true}
            steps={COMPOSER_STEPS}
            activeStepId={`step-${composerStep}`}
            onStepChange={(id) => setComposerStep(Number(id.replace('step-', '')) as 1 | 2 | 3)}
            renderStep={(stepId) => {
              if (stepId === 'step-1') {
                return (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">
                        Mô tả / Bối cảnh
                      </label>
                      <textarea
                        value={composerDescription}
                        onChange={(e) => setComposerDescription(e.target.value)}
                        rows={2}
                        placeholder="Bối cảnh, ghi chú hoặc lưu ý thêm cho nhân sự AI (tùy chọn)..."
                        data-testid="textarea-contract-desc"
                        className="mt-1 flex w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>

                    {/* Quick Agent Delegation Pills: Lead & Support */}
                    <div className="space-y-1.5 border-y border-border py-2.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-muted-foreground">
                          Nhân sự AI chủ trì (Lead) &amp; Hỗ trợ ({composerSupportAgentIds.length})
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          Chủ trì:{' '}
                          <strong className="text-foreground">{leadAgentLabel}</strong>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {snapshot.stations
                          .filter((s) => s.agent_id)
                          .map((s) => {
                            const isLead = composerLeadAgentId === s.agent_id;
                            const isSupport = composerSupportAgentIds.includes(s.agent_id!);
                            const workload = computeAgentWorkloadAndStage(s, snapshot.contracts, locale);
                            return (
                              <div
                                key={s.seat_id}
                                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/20 p-0.5"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setComposerLeadAgentId(s.agent_id!);
                                    setSelectedStationId(s.seat_id);
                                    setComposerSupportAgentIds((prev) =>
                                      prev.filter((id) => id !== s.agent_id),
                                    );
                                  }}
                                  className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                    isLead
                                      ? 'bg-sky-500/20 font-semibold text-foreground ring-1 ring-sky-500/50'
                                      : 'text-foreground/80 hover:bg-muted/60'
                                  }`}
                                >
                                  <PixelAgentAvatar seed={s.agent_name} status={s.status} size={18} />
                                  <span>{s.username || s.agent_name}</span>
                                  {isLead && (
                                    <span className="text-xs font-bold text-sky-700 dark:text-sky-300">
                                      (Lead)
                                    </span>
                                  )}
                                  {workload.isOverloaded ? (
                                    <span
                                      data-testid={`composer-overload-${s.seat_id}`}
                                      className={
                                        officeMode === 'simple'
                                          ? 'rounded-full bg-muted px-1.5 py-0 text-xs font-medium text-muted-foreground'
                                          : 'rounded-full bg-amber-500/20 px-1.5 py-0 text-xs font-semibold tabular-nums text-amber-800 dark:text-amber-200'
                                      }
                                    >
                                      {officeMode === 'simple'
                                        ? `${workload.activeCount} việc`
                                        : `⚠ ${dict.overloadTag} (${workload.activeCount})`}
                                    </span>
                                  ) : (
                                    officeMode === 'simple' &&
                                    workload.activeCount > 0 && (
                                      <span className="rounded-full bg-muted px-1.5 py-0 text-xs font-medium text-muted-foreground">
                                        {workload.activeCount} việc
                                      </span>
                                    )
                                  )}
                                </button>
                                {!isLead && (
                                  <button
                                    type="button"
                                    data-testid={`btn-toggle-support-${s.agent_id}`}
                                    onClick={() =>
                                      setComposerSupportAgentIds((prev) =>
                                        prev.includes(s.agent_id!)
                                          ? prev.filter((id) => id !== s.agent_id)
                                          : [...prev, s.agent_id!],
                                      )
                                    }
                                    className={`inline-flex min-h-8 items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${
                                      isSupport
                                        ? 'border-emerald-500/60 bg-emerald-500/15 font-semibold text-emerald-800 dark:text-emerald-200'
                                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    {isSupport ? '✓ Hỗ trợ' : '+ Hỗ trợ'}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Visual Template Cards in Advanced View */}
                    {officeMode !== 'simple' && (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {snapshot.templates.map((tpl) => {
                          const selected = composerTemplateId === tpl.id;
                          return (
                            <button
                              key={tpl.id}
                              type="button"
                              data-testid={`tpl-card-${tpl.id}`}
                              onClick={() => handleSelectTemplate(tpl.id)}
                              className={`flex flex-col items-start gap-0.5 rounded-xl border p-2.5 text-left transition-colors ${
                                selected
                                  ? 'border-primary/60 bg-primary/10 ring-1 ring-primary/40'
                                  : 'border-border bg-background hover:bg-muted/50'
                              }`}
                            >
                              <span className="text-xs font-semibold text-foreground">{tpl.name}</span>
                              <span className="line-clamp-1 text-xs text-muted-foreground">
                                {tpl.default_output_format}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-end border-t border-border pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setComposerStep(2)}
                        data-testid="btn-step1-next"
                        className="min-h-8 gap-1 text-xs"
                      >
                        <span>Tiếp: Phạm vi &amp; Tiêu chí</span>
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              }

              if (stepId === 'step-2') {
                return (
                  <div className="space-y-3">
                    <div className="space-y-2.5 rounded-xl border border-border/80 bg-muted/20 p-3">
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">
                            Dự án áp dụng (Project Scope)
                          </label>
                          <select
                            value={composerProjectKey}
                            onChange={(e) => setComposerProjectKey(e.target.value)}
                            className="mt-1 flex min-h-9 w-full rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                          >
                            {projectsList.map((p) => (
                              <option key={p.key} value={p.key}>
                                [{p.key}] {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">
                            Mức ưu tiên
                          </label>
                          <select
                            value={composerPriority}
                            onChange={(e) => setComposerPriority(e.target.value)}
                            data-testid="select-contract-priority"
                            className="mt-1 flex min-h-9 w-full rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                          >
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                            <option value="URGENT">URGENT</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">
                            Hạn hoàn thành
                          </label>
                          <Input
                            type="date"
                            value={composerDueDate}
                            onChange={(e) => setComposerDueDate(e.target.value)}
                            data-testid="input-contract-due-date"
                            className="mt-1 h-9 w-full text-xs"
                          />
                        </div>
                      </div>

                      {(initiativesList.length > 0 || cyclesList.length > 0) && (
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground">
                              {locale === 'en' ? 'Initiative (H1)' : 'Sáng kiến (H1)'}
                            </label>
                            <select
                              value={composerInitiativeId ?? ''}
                              onChange={(e) =>
                                setComposerInitiativeId(e.target.value ? Number(e.target.value) : null)
                              }
                              data-testid="select-contract-initiative"
                              className="mt-1 flex min-h-9 w-full rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                            >
                              <option value="">
                                {locale === 'en' ? 'Auto-match from Harness Spine' : 'Tự động khớp theo Spine'}
                              </option>
                              {initiativesList.map((ini) => (
                                <option key={ini.id} value={ini.id}>
                                  [{ini.project_key}] {ini.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground">
                              {locale === 'en' ? 'Sprint Cycle' : 'Chu kỳ (Cycle)'}
                            </label>
                            <select
                              value={composerCycleId ?? ''}
                              onChange={(e) =>
                                setComposerCycleId(e.target.value ? Number(e.target.value) : null)
                              }
                              data-testid="select-contract-cycle"
                              className="mt-1 flex min-h-9 w-full rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                            >
                              <option value="">
                                {locale === 'en' ? 'Active Cycle (Auto)' : 'Chu kỳ đang chạy (Tự động)'}
                              </option>
                              {cyclesList.map((cyc) => (
                                <option key={cyc.id} value={cyc.id}>
                                  {cyc.is_active ? '● ' : ''}
                                  [{cyc.project_key}] {cyc.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Acceptance Criteria & AI Auto-Draft */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                          Tiêu chí nghiệm thu (Acceptance Criteria) (*)
                        </label>
                        <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={autoDraftCriteria}
                            onChange={(e) => setAutoDraftCriteria(e.target.checked)}
                            className="size-3.5 rounded border-border"
                          />
                          <span>AI Auto-Draft</span>
                        </label>
                      </div>

                      <textarea
                        value={composerAcceptanceCriteria}
                        onChange={(e) => setComposerAcceptanceCriteria(e.target.value)}
                        rows={3}
                        placeholder="Mỗi dòng là một tiêu chí nghiệm thu bắt buộc..."
                        data-testid="textarea-contract-criteria"
                        className="mt-1 flex w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setComposerStep(1)}
                        data-testid="btn-step2-back"
                        className="min-h-8 gap-1 text-xs"
                      >
                        <ArrowLeft className="size-3.5" />
                        <span>Quay lại</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!composerAcceptanceCriteria.trim()}
                        onClick={() => setComposerStep(3)}
                        data-testid="btn-step2-next"
                        className="min-h-8 gap-1 text-xs"
                      >
                        <span>Tiếp: Ràng buộc &amp; Gửi</span>
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <div className="space-y-2.5 rounded-xl border border-border/80 bg-muted/20 p-3">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground">
                          Phạm vi đầu vào (Input Scope)
                        </label>
                        <Input
                          value={composerInputScope}
                          onChange={(e) => setComposerInputScope(e.target.value)}
                          placeholder="Thư mục, tài liệu hoặc nguồn dữ liệu..."
                          data-testid="input-contract-scope"
                          className="mt-1 h-9 w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground">
                          Định dạng đầu ra (Output Format)
                        </label>
                        <Input
                          value={composerOutputFormat}
                          onChange={(e) => setComposerOutputFormat(e.target.value)}
                          placeholder="PR, báo cáo Markdown, bảng tính..."
                          data-testid="input-contract-output"
                          className="mt-1 h-9 w-full text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">
                        Hành động bị cấm (Forbidden Actions)
                      </label>
                      <textarea
                        value={composerForbiddenActions}
                        onChange={(e) => setComposerForbiddenActions(e.target.value)}
                        rows={2}
                        placeholder="Mỗi dòng một giới hạn an toàn..."
                        data-testid="textarea-contract-forbidden"
                        className="mt-1 flex w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-foreground">
                        <input
                          type="checkbox"
                          checked={autoExecute}
                          onChange={(e) => setAutoExecute(e.target.checked)}
                          className="size-3.5 rounded border-border"
                        />
                        <span>Auto Execute</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-foreground">
                        <input
                          type="checkbox"
                          checked={composerWeeklyRepeat}
                          onChange={(e) => setComposerWeeklyRepeat(e.target.checked)}
                          data-testid="checkbox-weekly-repeat"
                          className="size-3.5 rounded border-border"
                        />
                        <span>Lặp lại mỗi tuần</span>
                      </label>
                    </div>
                  </div>

                  {/* Concise 1-box Review Summary */}
                  <div className="rounded-xl border border-border/80 bg-muted/25 p-2.5 text-xs">
                    <div className="font-semibold text-foreground">Tóm tắt cam kết</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                      <span>
                        Chủ trì: <strong className="text-foreground">{leadAgentLabel}</strong>
                      </span>
                      <span>
                        Dự án: <strong className="text-foreground">{composerProjectKey}</strong>
                      </span>
                      <span>
                        Ưu tiên: <strong className="text-foreground">{composerPriority}</strong>
                      </span>
                      <span>
                        Tiêu chí: <strong className="tabular-nums text-foreground">{criteriaCount}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setComposerStep(2)}
                      data-testid="btn-step3-back"
                      className="min-h-8 gap-1 text-xs"
                    >
                      <ArrowLeft className="size-3.5" />
                      <span>Quay lại</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={composerSubmitting || !composerAcceptanceCriteria.trim()}
                      onClick={handleSubmitContract}
                      data-testid="btn-submit-contract-step3"
                      className="min-h-8 gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-semibold text-background hover:bg-foreground/90"
                    >
                      <Send className="size-3.5" />
                      <span>{composerSubmitting ? 'Đang giao...' : 'Giao việc theo cam kết'}</span>
                    </Button>
                  </div>
                </div>
              );
            }}
          />

          {/* Recent Contracts Mini-List */}
          {snapshot.contracts.length > 0 && (
            <ProgressiveDisclosure
              label="Đã giao gần đây"
              count={snapshot.contracts.length}
              defaultOpen={false}
              keepMounted
              triggerVariant="ghost"
              triggerTestId="btn-toggle-recent-contracts"
            >
              <div className="space-y-1" data-testid="composer-recent-contracts">
                {snapshot.contracts.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedContractId(c.id);
                      setActiveTab('contracts');
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted/50"
                  >
                    <span className="truncate font-medium text-foreground">{c.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {c.status}
                    </span>
                  </button>
                ))}
              </div>
            </ProgressiveDisclosure>
          )}
        </div>
      </div>
    </div>
  );
}
