'use client';

import * as React from 'react';
import { CheckCircle2, Layers, Play, SearchCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  OpenOfficeProjectOption,
  OpenOfficeStation,
  OpenOfficeTemplate,
} from '../types';
import type { OpenOfficeLocale } from './openOfficeConstants';

export interface BulkDispatchItemPayload {
  title: string;
  leadAgentId: string;
  templateId: string;
  domain: string;
  projectKey: string;
  acceptanceCriteria: string[];
  outputFormat: string;
  inputScope: string;
  forbiddenActions: string[];
  estimatedMinutes: number;
  estimatedTokens: number;
}

export interface OfficeBulkDispatchPanelProps {
  locale: OpenOfficeLocale;
  stations: OpenOfficeStation[];
  templates: OpenOfficeTemplate[];
  projects: OpenOfficeProjectOption[];
  defaultProjectKey: string;
  onDispatchBatchItem: (
    item: BulkDispatchItemPayload,
  ) => Promise<{ ok: boolean; contractId?: string; error?: string }>;
  onBatchComplete: (createdIds: string[]) => void;
}

interface BulkPreviewRow {
  title: string;
  ok: boolean;
  error: string | null;
  createdId?: string;
}

export function OfficeBulkDispatchPanel({
  locale,
  stations,
  templates,
  projects,
  defaultProjectKey,
  onDispatchBatchItem,
  onBatchComplete,
}: OfficeBulkDispatchPanelProps) {
  const isVi = locale === 'vi';
  const [leadAgentId, setLeadAgentId] = React.useState<string>(
    () => stations.find((s) => s.agent_id)?.agent_id || 'agt-antigravity',
  );
  const [templateId, setTemplateId] = React.useState<string>(templates[0]?.id || '');
  const [projectKey, setProjectKey] = React.useState<string>(
    defaultProjectKey || projects[0]?.key || 'PM',
  );
  const [criteria, setCriteria] = React.useState<string>(
    templates[0]?.default_acceptance_criteria?.join('\n') || '',
  );
  const templateHydratedRef = React.useRef<boolean>(Boolean(templates[0]?.id));
  React.useEffect(() => {
    if (templateHydratedRef.current) return;
    const first = templates[0];
    if (!first) return;
    templateHydratedRef.current = true;
    setTemplateId((prev) => prev || first.id);
    setCriteria((prev) =>
      prev.trim() ? prev : first.default_acceptance_criteria?.join('\n') || '',
    );
  }, [templates]);
  const [titlesRaw, setTitlesRaw] = React.useState<string>('');
  const [preview, setPreview] = React.useState<BulkPreviewRow[] | null>(null);
  const [statusMsg, setStatusMsg] = React.useState<{ text: string; isErr: boolean } | null>(null);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);

  const parsedTitles = React.useMemo(
    () =>
      titlesRaw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 10),
    [titlesRaw],
  );

  const selectedTemplate = React.useMemo(
    () => templates.find((t) => t.id === templateId) || templates[0],
    [templates, templateId],
  );

  const handleTemplateChange = (nextTplId: string) => {
    setTemplateId(nextTplId);
    const found = templates.find((t) => t.id === nextTplId);
    if (found) {
      setCriteria(found.default_acceptance_criteria.join('\n'));
    }
    setPreview(null);
  };

  const handleDryRun = () => {
    setIsExpanded(true);
    if (!leadAgentId) {
      setStatusMsg({
        text: isVi ? 'Chưa chọn nhân sự AI chủ trì.' : 'Select a lead AI agent first.',
        isErr: true,
      });
      return;
    }
    if (!criteria.trim()) {
      setStatusMsg({
        text: isVi
          ? 'Bắt buộc có tiêu chí nghiệm thu dùng chung cho cả loạt.'
          : 'Acceptance criteria is required for batch dispatch.',
        isErr: true,
      });
      return;
    }
    if (parsedTitles.length === 0) {
      setStatusMsg({
        text: isVi
          ? 'Nhập ít nhất 1 tiêu đề việc (tối đa 10 dòng).'
          : 'Enter at least 1 task title (max 10 lines).',
        isErr: true,
      });
      return;
    }

    const seen = new Set<string>();
    const rows: BulkPreviewRow[] = parsedTitles.map((title) => {
      const norm = title.toLowerCase();
      if (title.length < 4) {
        return {
          title,
          ok: false,
          error: isVi ? 'Tiêu đề quá ngắn (< 4 ký tự)' : 'Title too short (< 4 chars)',
        };
      }
      if (seen.has(norm)) {
        return {
          title,
          ok: false,
          error: isVi ? 'Tiêu đề trùng lặp trong danh sách' : 'Duplicate title in batch',
        };
      }
      seen.add(norm);
      return { title, ok: true, error: null };
    });

    const validCount = rows.filter((r) => r.ok).length;
    setPreview(rows);
    setStatusMsg({
      text:
        validCount === rows.length
          ? isVi
            ? `Xem trước (Dry-run): ${validCount} việc hợp lệ — chưa tạo hợp đồng thật.`
            : `Dry-run preview: ${validCount} valid items — no contracts created yet.`
          : isVi
            ? `Xem trước: ${validCount}/${rows.length} việc hợp lệ — kiểm tra lỗi bên dưới.`
            : `Dry-run: ${validCount}/${rows.length} valid — see details below.`,
      isErr: validCount === 0,
    });
  };

  const validPreviewCount = (preview || []).filter((r) => r.ok).length;

  const handleConfirmBatch = async () => {
    if (!preview || validPreviewCount === 0 || submitting) return;
    setSubmitting(true);
    const createdIds: string[] = [];
    const results: BulkPreviewRow[] = [];

    const criteriaLines = criteria
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const row of preview) {
      if (!row.ok) {
        results.push(row);
        continue;
      }
      const res = await onDispatchBatchItem({
        title: row.title,
        leadAgentId,
        templateId: selectedTemplate?.id || templateId || 'tpl-code-feature',
        domain: selectedTemplate?.domain || 'DEV',
        projectKey,
        acceptanceCriteria: criteriaLines,
        outputFormat: selectedTemplate?.default_output_format || 'Bản hoàn chỉnh kèm bằng chứng',
        inputScope: selectedTemplate?.default_input_scope || 'Ngữ cảnh dự án hiện tại',
        forbiddenActions: selectedTemplate?.default_forbidden_actions || [],
        estimatedMinutes: selectedTemplate?.default_estimated_minutes || 30,
        estimatedTokens: selectedTemplate?.default_estimated_tokens || 4000,
      });
      if (res.ok && res.contractId) {
        createdIds.push(res.contractId);
        results.push({ title: row.title, ok: true, error: null, createdId: res.contractId });
      } else {
        results.push({
          title: row.title,
          ok: false,
          error: res.error || (isVi ? 'Không tạo được' : 'Dispatch failed'),
        });
      }
    }

    setPreview(results);
    setSubmitting(false);
    if (createdIds.length > 0) {
      setTitlesRaw('');
      setStatusMsg({
        text: isVi
          ? `Đã giao thật ${createdIds.length} hợp đồng: ${createdIds.join(', ')}`
          : `Dispatched ${createdIds.length} contracts: ${createdIds.join(', ')}`,
        isErr: false,
      });
      onBatchComplete(createdIds);
    } else {
      setStatusMsg({
        text: isVi ? 'Không giao được hợp đồng nào trong loạt.' : 'Batch dispatch failed.',
        isErr: true,
      });
    }
  };

  return (
    <section
      data-testid="office-bulk-dispatch-panel"
      className="space-y-3 rounded-[20px] border border-border bg-card p-5 text-card-foreground"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            {isVi ? 'GIAO HÀNG LOẠT (DRY-RUN)' : 'BULK DISPATCH (DRY-RUN)'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isVi ? 'Tối đa 10 việc / lượt' : 'Up to 10 tasks / batch'}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="btn-toggle-bulk-dispatch"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((v) => !v)}
            className="h-7 gap-1 px-2.5 text-xs"
          >
            {isExpanded
              ? isVi
                ? 'Thu gọn'
                : 'Collapse'
              : isVi
                ? 'Mở giao hàng loạt'
                : 'Expand Bulk'}
          </Button>
        </div>
      </div>

      <div className={isExpanded ? 'space-y-3 pt-1' : 'hidden'}>
        {/* Lead Agent Chips */}
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isVi ? 'Giao cho (chủ trì cả loạt)' : 'Lead Agent'}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {stations
            .filter((s) => s.agent_id)
            .map((s) => {
              const active = leadAgentId === s.agent_id;
              return (
                <button
                  key={s.seat_id}
                  type="button"
                  onClick={() => {
                    setLeadAgentId(s.agent_id!);
                    setPreview(null);
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-foreground hover:border-foreground/50'
                  }`}
                >
                  {s.agent_name}
                </button>
              );
            })}
        </div>
      </div>

      {/* Shared Template & Project */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">
            {isVi ? 'Mẫu hợp đồng dùng chung' : 'Shared Template'}
          </label>
          <select
            value={templateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            data-testid="select-bulk-template"
            className="mt-1 h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.domain})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">
            {isVi ? 'Dự án dùng chung' : 'Shared Project'}
          </label>
          <select
            value={projectKey}
            onChange={(e) => {
              setProjectKey(e.target.value);
              setPreview(null);
            }}
            data-testid="select-bulk-project"
            className="mt-1 h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground"
          >
            {projects.map((p) => (
              <option key={p.key} value={p.key}>
                [{p.key}] {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground">
          {isVi ? 'Tiêu chí nghiệm thu dùng chung (*)' : 'Shared Acceptance Criteria (*)'}
        </label>
        <textarea
          rows={2}
          value={criteria}
          onChange={(e) => {
            setCriteria(e.target.value);
            setPreview(null);
          }}
          data-testid="textarea-bulk-criteria"
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground">
          {isVi
            ? 'Danh sách việc — Mỗi dòng một tiêu đề (tối đa 10)'
            : 'Task Titles — One per line (max 10)'}
        </label>
        <textarea
          rows={3}
          value={titlesRaw}
          onFocus={() => setIsExpanded(true)}
          onChange={(e) => {
            setTitlesRaw(e.target.value);
            setPreview(null);
          }}
          data-testid="textarea-bulk-titles"
          placeholder={
            isVi
              ? 'Rà soát báo cáo tuần 44\nĐối chiếu số liệu tháng 10\nViết bản tin nội bộ số 12'
              : 'Audit weekly metrics\nDraft release digest'
          }
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={submitting}
          onClick={handleDryRun}
          data-testid="btn-bulk-dry-run"
          className="min-h-9 gap-1.5 rounded-full px-4 text-xs font-semibold"
        >
          <SearchCheck className="size-3.5" />
          <span>{isVi ? 'Kiểm tra trước (Dry-run)' : 'Preview (Dry-run)'}</span>
        </Button>

        <Button
          type="button"
          size="sm"
          disabled={submitting || validPreviewCount === 0}
          onClick={handleConfirmBatch}
          data-testid="btn-bulk-confirm"
          className="min-h-9 gap-1.5 rounded-full bg-foreground px-4 text-xs font-semibold text-background hover:opacity-90"
        >
          <Play className="size-3.5" />
          <span>
            {submitting
              ? isVi
                ? 'Đang giao...'
                : 'Dispatching...'
              : isVi
                ? `Giao thật cả loạt (${validPreviewCount})`
                : `Confirm Dispatch (${validPreviewCount})`}
          </span>
        </Button>
      </div>

      {statusMsg && (
        <div
          data-testid="bulk-status-msg"
          className={`rounded-xl border px-3 py-2 text-xs font-medium ${
            statusMsg.isErr
              ? 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {preview && preview.length > 0 && (
        <div
          data-testid="bulk-preview-list"
          className="space-y-1 rounded-xl border border-border bg-background p-3 text-xs"
        >
          {preview.map((row, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 py-1">
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {idx + 1}. {row.title}
              </span>
              {row.ok ? (
                <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-3.5" />
                  <span>{row.createdId ? row.createdId : isVi ? 'Hợp lệ' : 'Valid'}</span>
                </span>
              ) : (
                <span className="shrink-0 font-semibold text-rose-700 dark:text-rose-300">
                  {row.error}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </section>
  );
}
