'use client';

import * as React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDurationShort } from '@/utils/dates';
import {
  compareProjectsByLastUpdatedDesc,
  parseEffectiveTimestampMs,
  type InboxCollectionStatus,
  type InboxDigest,
  type InboxStreamItem,
} from '../services/inboxStreams';

function actionButtonLabel(action: string, isVi: boolean): string {
  switch (action) {
    case 'quarantine_review':
      return isVi ? 'Kiểm tra cách ly' : 'Review Quarantine';
    case 'human_approval':
      return isVi ? 'Xem & Duyệt' : 'Review & Decide';
    case 'fix_delivery':
      return isVi ? 'Sửa kênh gửi' : 'Fix Delivery';
    case 'reassign_project':
      return isVi ? 'Gắn dự án' : 'Assign Project';
    case 'register_contact':
      return isVi ? 'Xác minh liên hệ' : 'Verify Contact';
    case 'create_task':
      return isVi ? 'Tạo / Giao việc' : 'Create / Dispatch';
    default:
      return isVi ? 'Mở chi tiết' : 'Inspect Item';
  }
}

export default function InboxDigestPanel({
  digest,
  collectionStatus,
  visibleItems,
  isCollecting,
  onCollectNow,
  onSelectItem,
}: {
  digest: InboxDigest | null;
  collectionStatus: InboxCollectionStatus | null;
  visibleItems: InboxStreamItem[];
  isCollecting: boolean;
  onCollectNow: () => void;
  onSelectItem: (itemId: string) => void;
}) {
  const isVi = useLocale().toLowerCase().startsWith('vi');

  const itemIdsSet = React.useMemo(
    () => new Set(visibleItems.map((x) => x.id)),
    [visibleItems],
  );

  const effectiveDigest: InboxDigest = React.useMemo(() => {
    if (digest) return digest;
    return {
      totalItems: visibleItems.length,
      withinRulesCount: 0,
      outOfRulesCount: visibleItems.length,
      guardrails: {
        cleanCount: visibleItems.length,
        flaggedCount: 0,
        quarantinedCount: 0,
        blockedItems: [],
      },
      executiveSummary: {
        headline: isVi
          ? `Đang hiển thị ${visibleItems.length} mục trong hộp thư`
          : `Showing ${visibleItems.length} inbox item(s)`,
        bullets: [],
      },
      projectSummaries: [],
      proposedNextSteps: [],
    };
  }, [digest, visibleItems.length, isVi]);

  const sortedProjectSummaries = React.useMemo(() => {
    const list = effectiveDigest.projectSummaries;
    const hasAnyTimestamp = list.some((p) => Number.isFinite(parseEffectiveTimestampMs(p.lastUpdatedAt)));
    if (!hasAnyTimestamp) return list;
    return [...list].sort((a, b) =>
      compareProjectsByLastUpdatedDesc(
        {
          key: a.projectKey,
          lastUpdatedMs: parseEffectiveTimestampMs(a.lastUpdatedAt),
          count: a.totalItems,
        },
        {
          key: b.projectKey,
          lastUpdatedMs: parseEffectiveTimestampMs(b.lastUpdatedAt),
          count: b.totalItems,
        },
      ),
    );
  }, [effectiveDigest.projectSummaries]);

  const lastCollectedAge = collectionStatus?.lastCollectedAt
    ? formatDurationShort(collectionStatus.lastCollectedAt)
    : '';
  const quarantinedCount = effectiveDigest.guardrails.quarantinedCount;
  const flaggedCount = effectiveDigest.guardrails.flaggedCount;

  return (
    <div
      data-testid="inbox-digest-panel"
      className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 xl:px-10"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Auto-Collection & Guardrail Strip */}
        <section
          data-testid="inbox-digest-guardrail-strip"
          className="rounded-2xl border border-border/85 bg-card p-4 shadow-[var(--studio-card-shadow)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {quarantinedCount > 0 ? (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <ShieldAlert className="size-3.5" />
                    {isVi
                      ? `Đã cách ly ${quarantinedCount} rủi ro tiêm lệnh`
                      : `${quarantinedCount} Injection Quarantined`}
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-emerald-500/15 text-xs text-emerald-700 dark:text-emerald-300"
                  >
                    <ShieldCheck className="size-3.5" />
                    {isVi ? 'Lá chắn tiêm lệnh: An toàn' : 'Injection Guardrail: Clean'}
                  </Badge>
                )}
                {flaggedCount > 0 && (
                  <Badge variant="outline" className="gap-1 border-amber-500/40 text-xs text-amber-600 dark:text-amber-300">
                    <AlertTriangle className="size-3" />
                    {isVi ? `${flaggedCount} đã làm sạch` : `${flaggedCount} Sanitized`}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs tabular-nums">
                  {collectionStatus?.autoCollectEnabled !== false
                    ? isVi
                      ? 'Thu thập tự động: Bật'
                      : 'Auto-Collect: Active'
                    : isVi
                      ? 'Thu thập thủ công'
                      : 'Manual Collect'}
                  {lastCollectedAge ? ` · ${lastCollectedAge}` : ''}
                </Badge>
              </div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                {effectiveDigest.executiveSummary.headline}
              </h2>
              {effectiveDigest.executiveSummary.bullets.length > 0 && (
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {effectiveDigest.executiveSummary.bullets.map((b, idx) => (
                    <li key={idx}>• {b}</li>
                  ))}
                </ul>
              )}
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid="btn-inbox-collect-now"
              disabled={isCollecting}
              onClick={onCollectNow}
              className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs font-medium"
            >
              <RefreshCw className={`size-3.5 ${isCollecting ? 'animate-spin' : ''}`} />
              <span>
                {isCollecting
                  ? isVi
                    ? 'Đang thu thập...'
                    : 'Collecting...'
                  : isVi
                    ? 'Thu thập ngay'
                    : 'Collect Now'}
              </span>
            </Button>
          </div>
        </section>

        {/* Proposed Next Steps (Outside Rules Only) */}
        <section data-testid="inbox-digest-next-steps" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[var(--studio-amber)]" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {isVi
                  ? 'Đề xuất bước tiếp theo (Ngoài quy tắc)'
                  : 'Proposed Next Steps (Outside Rules)'}
              </h3>
            </div>
            <Badge variant="outline" className="text-xs tabular-nums">
              {effectiveDigest.proposedNextSteps.length}
            </Badge>
          </div>

          {effectiveDigest.proposedNextSteps.length === 0 ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-border/75 bg-card/60 px-4 py-3 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 shrink-0 text-[var(--studio-emerald)]" />
              <span>
                {isVi
                  ? 'Tất cả cập nhật hiện tại đều nằm trong quy tắc và đã được tổng hợp bên dưới — không cần phản hồi 1-1.'
                  : 'All current updates are within operating rules and summarized below — no 1-1 replies needed.'}
              </span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {effectiveDigest.proposedNextSteps.slice(0, 12).map((stepItem) => (
                <div
                  key={stepItem.itemId}
                  data-testid="inbox-digest-next-step-card"
                  className={
                    stepItem.actionBlocked
                      ? 'space-y-2.5 rounded-xl border border-destructive/40 bg-destructive/5 p-3.5'
                      : 'space-y-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5'
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="font-mono text-xs">
                          {stepItem.projectKey}
                        </Badge>
                        <Badge
                          variant={stepItem.actionBlocked ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {stepItem.ruleLabel}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {stepItem.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{stepItem.sourceLabel}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{stepItem.headline || stepItem.title}</p>
                      {stepItem.rationale && (
                        <p className="text-xs text-muted-foreground">{stepItem.rationale}</p>
                      )}
                    </div>

                    {itemIdsSet.has(stepItem.itemId) && (
                      <Button
                        type="button"
                        size="sm"
                        variant={stepItem.actionBlocked ? 'destructive' : 'outline'}
                        data-testid={`btn-digest-open-${stepItem.itemId}`}
                        onClick={() => onSelectItem(stepItem.itemId)}
                        className="h-8 shrink-0 gap-1 text-xs"
                      >
                        <span>{actionButtonLabel(stepItem.recommendedAction, isVi)}</span>
                        <ArrowRight className="size-3.5" />
                      </Button>
                    )}
                  </div>

                  {stepItem.steps.length > 0 && (
                    <ol className="list-inside list-decimal space-y-0.5 text-xs text-foreground/90">
                      {stepItem.steps.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Updates Summary by Project */}
        <section data-testid="inbox-digest-project-summaries" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FolderKanban className="size-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {isVi ? 'Tổng hợp cập nhật theo dự án' : 'Updates Summary by Project'}
              </h3>
            </div>
            <Badge variant="outline" className="text-xs tabular-nums">
              {effectiveDigest.projectSummaries.length}
            </Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {sortedProjectSummaries.map((proj) => (
              <div
                key={proj.projectKey}
                data-testid={`inbox-digest-project-${proj.projectKey}`}
                className="space-y-2.5 rounded-xl border border-border/80 bg-card/70 p-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-xs">
                      {proj.projectKey}
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">{proj.projectName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs tabular-nums">
                    <Badge variant="secondary" className="text-xs">
                      {proj.withinRulesCount} {isVi ? 'đúng quy tắc' : 'within rules'}
                    </Badge>
                    {proj.outOfRulesCount > 0 && (
                      <Badge variant="outline" className="border-amber-500/40 text-xs text-amber-600 dark:text-amber-300">
                        {proj.outOfRulesCount} {isVi ? 'cần xử lý' : 'needs action'}
                      </Badge>
                    )}
                  </div>
                </div>

                {proj.updateHighlights.length > 0 && (
                  <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
                    {proj.updateHighlights.map((hl, idx) => (
                      <li key={idx} className="truncate">
                        • {hl}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
