'use client';

// UNIFIED_WORK_ITEMS_SWARM_BRIDGE_362:
// Routes all AOP Swarm tasks, Kara AI Action Items, and Tier 2 HITL Governance sign-offs (GW-SOD-01)
// directly into the canonical Hạng mục công việc (WorkItemsPage.tsx) feature.

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { useLocale } from 'next-intl';
import { createIssue, type BoardIssue } from '@/lib/api/endpoints/issues';
import type { ProjectDetail } from '@/lib/api/endpoints/projects';
import { qk } from '@/services/queryKeys';
import { Badge } from '@/components/ui/badge';
import { isHostVibeEnabled } from '@/lib/security/hostVibeClient';

type BoardColumn = ProjectDetail['columns'][number];
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SwarmBridgeTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigned_agent?: string;
  description?: string;
}

interface RawSwarmBridgeTask {
  task_id?: unknown;
  id?: unknown;
  title?: unknown;
  status?: unknown;
  priority?: unknown;
  assigned_actor?: unknown;
  assigned_agent?: unknown;
  description?: unknown;
}

interface SwarmHitlGovernanceBarProps {
  projectKey: string;
  columns: BoardColumn[];
  issues: BoardIssue[];
}

const SWARM_TASKS_TTL_MS = 30_000;
let cachedTasksEntry: { ts: number; data: SwarmBridgeTask[] } | null = null;
let inflightTasksPromise: Promise<SwarmBridgeTask[]> | null = null;
let inflightTasksController: AbortController | null = null;
let inflightSubscribers = 0;
const globalSyncedTaskIds = new Set<string>();

function invalidateSwarmTasksCache() {
  cachedTasksEntry = null;
  inflightTasksPromise = null;
  inflightTasksController?.abort();
  inflightTasksController = null;
  inflightSubscribers = 0;
}

async function loadSwarmTasks(options?: {
  force?: boolean;
  signal?: AbortSignal;
}): Promise<SwarmBridgeTask[]> {
  if (!isHostVibeEnabled()) return [];
  const { force = false, signal } = options ?? {};
  if (signal?.aborted) return [];

  if (force) {
    invalidateSwarmTasksCache();
  } else if (cachedTasksEntry && Date.now() - cachedTasksEntry.ts < SWARM_TASKS_TTL_MS) {
    return cachedTasksEntry.data;
  }

  if (!inflightTasksPromise) {
    const controller = new AbortController();
    inflightTasksController = controller;
    inflightSubscribers = 0;

    const promise = (async () => {
      try {
        const res = await fetch('/api/vibe/tasks', { signal: controller.signal });
        if (!res.ok) return [];
        const data: unknown = await res.json();
        const mapped: SwarmBridgeTask[] = (Array.isArray(data) ? data : []).map(
          (t: RawSwarmBridgeTask) => ({
            id: String(t.task_id || t.id || ''),
            title: String(t.title || ''),
            status: String(t.status || 'TODO'),
            priority: String(t.priority || 'MEDIUM'),
            assigned_agent:
              typeof t.assigned_actor === 'string'
                ? t.assigned_actor
                : typeof t.assigned_agent === 'string'
                  ? t.assigned_agent
                  : undefined,
            description: typeof t.description === 'string' ? t.description : '',
          }),
        );
        if (inflightTasksController === controller && !controller.signal.aborted) {
          cachedTasksEntry = { ts: Date.now(), data: mapped };
        }
        return mapped;
      } catch {
        // Best-effort bridge fetch (including AbortError on unmount)
        return [];
      } finally {
        if (inflightTasksController === controller) {
          inflightTasksPromise = null;
          inflightTasksController = null;
          inflightSubscribers = 0;
        }
      }
    })();

    inflightTasksPromise = promise;
  }

  const activePromise = inflightTasksPromise;
  const activeController = inflightTasksController;
  inflightSubscribers += 1;

  let onAbort: (() => void) | undefined;
  if (signal && activeController) {
    onAbort = () => {
      inflightSubscribers = Math.max(0, inflightSubscribers - 1);
      if (inflightSubscribers === 0 && inflightTasksController === activeController) {
        activeController.abort();
        if (inflightTasksPromise === activePromise) {
          inflightTasksPromise = null;
          inflightTasksController = null;
        }
      }
    };
    signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    return await activePromise;
  } finally {
    if (signal && onAbort) {
      signal.removeEventListener('abort', onAbort);
    }
    if (inflightTasksPromise === activePromise && !signal?.aborted) {
      inflightSubscribers = Math.max(0, inflightSubscribers - 1);
    }
  }
}

function resolveTargetColumnId(status: string, columns: BoardColumn[]): number {
  const st = String(status || '').toUpperCase();
  if (!columns.length) return 1;
  const byStateType = (stateType: BoardColumn['stateType']) =>
    columns.find((c) => c.stateType === stateType)?.id;
  const byName = (needle: string) =>
    columns.find((c) => c.name.toLowerCase().includes(needle.toLowerCase()))?.id;

  if (st === 'DONE' || st === 'COMPLETED') {
    return byStateType('completed') ?? byName('done') ?? byName('hoàn thành') ?? columns[columns.length - 1].id;
  }
  if (st === 'AWAITING_HITL') {
    return byName('review') ?? byName('duyệt') ?? byStateType('started') ?? columns[0].id;
  }
  if (st === 'IN_PROGRESS') {
    return byStateType('started') ?? byName('progress') ?? byName('đang') ?? columns[0].id;
  }
  return byStateType('unstarted') ?? columns[0].id;
}

export default function SwarmHitlGovernanceBar({
  projectKey,
  columns,
  issues,
}: SwarmHitlGovernanceBarProps) {
  const locale = useLocale();
  const isVi = locale.toLowerCase().startsWith('vi');
  const qc = useQueryClient();
  const [swarmTasks, setSwarmTasks] = React.useState<SwarmBridgeTask[]>([]);
  const [syncing, setSyncing] = React.useState(false);
  const [hitlTask, setHitlTask] = React.useState<SwarmBridgeTask | null>(null);
  const [approverId, setApproverId] = React.useState('hum-reviewer');
  const [approvalReason, setApprovalReason] = React.useState(() =>
    locale.toLowerCase().startsWith('vi')
      ? 'Đã kiểm tra kiến trúc và bằng chứng kiểm thử đạt yêu cầu.'
      : 'Verified architecture alignment and test evidence.'
  );
  const [governanceError, setGovernanceError] = React.useState<string | null>(null);

  const fetchSwarmTasks = React.useCallback(
    async (options?: { force?: boolean; signal?: AbortSignal }) => {
      const mapped = await loadSwarmTasks(options);
      if (!options?.signal?.aborted) {
        setSwarmTasks(mapped);
      }
      return mapped;
    },
    [],
  );

  const syncTasksIntoProjectBoard = React.useCallback(
    async (tasksToSync: SwarmBridgeTask[]) => {
      if (!projectKey || !columns.length || !tasksToSync.length) return;
      const existingTitles = new Set(issues.map((i) => i.title.trim().toLowerCase()));
      let createdAny = false;

      for (const t of tasksToSync) {
        if (!t.id) continue;
        const syncKey = `${projectKey}:${t.id}`;
        if (globalSyncedTaskIds.has(syncKey)) continue;
        const taggedTitle = t.title.includes(t.id) ? t.title : `[${t.id}] ${t.title}`;
        const alreadyExists =
          existingTitles.has(taggedTitle.trim().toLowerCase()) ||
          existingTitles.has(t.title.trim().toLowerCase()) ||
          issues.some((iss) => iss.title.includes(t.id));

        globalSyncedTaskIds.add(syncKey);
        if (alreadyExists) continue;

        try {
          const colId = resolveTargetColumnId(t.status, columns);
          const prio = ['urgent', 'high', 'medium', 'low'].includes(t.priority.toLowerCase())
            ? (t.priority.toLowerCase() as 'urgent' | 'high' | 'medium' | 'low')
            : 'medium';
          await createIssue(projectKey, {
            columnId: colId,
            title: taggedTitle.slice(0, 240),
            description:
              t.description ||
              `Synced from Sovereign AOP Swarm (${t.id}) — Assigned actor: ${t.assigned_agent || 'lead-architect'}`,
            priority: prio,
          });
          createdAny = true;
        } catch {
          // Ignore duplicate/permission errors during background sync
        }
      }

      if (createdAny) {
        void qc.invalidateQueries({ queryKey: qk.boardIssues(projectKey) });
      }
    },
    [projectKey, columns, issues, qc]
  );

  React.useEffect(() => {
    if (!isHostVibeEnabled()) return;
    const controller = new AbortController();
    void fetchSwarmTasks({ signal: controller.signal });
    return () => {
      controller.abort();
    };
  }, [fetchSwarmTasks]);

  const handleManualSync = async () => {
    setSyncing(true);
    invalidateSwarmTasksCache();
    try {
      const list = await fetchSwarmTasks({ force: true });
      await syncTasksIntoProjectBoard(list);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('itsaplan:open-office-mutated'));
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleApproveGovernance = async () => {
    if (!hitlTask) return;
    setGovernanceError(null);
    try {
      const res = await fetch('/api/vibe/governance/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: hitlTask.id,
          approver_id: approverId.trim(),
          decision: 'APPROVE',
          reason: approvalReason.trim(),
        }),
      });
      if (res.ok) {
        invalidateSwarmTasksCache();
        setHitlTask(null);
        await handleManualSync();
      } else {
        const err = await res.json();
        setGovernanceError(
          err.error || (isVi ? 'Không thể phê duyệt yêu cầu.' : 'Approval could not be completed.')
        );
      }
    } catch {
      setGovernanceError(
        isVi ? 'Lỗi kết nối khi gửi phê duyệt.' : 'Network or server error during sign-off.'
      );
    }
  };

  if (!isHostVibeEnabled()) {
    return null;
  }

  const hitlTasks = swarmTasks.filter(
    (t) => String(t.status || '').toUpperCase() === 'AWAITING_HITL'
  );

  if (hitlTasks.length === 0) {
    return null;
  }

  return (
    <>
      <div
        data-testid="work-items-swarm-governance-bar"
        className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 text-foreground px-4 py-1.5 text-xs"
      >
        <div className="flex flex-wrap items-center gap-2">
          <ShieldCheck className="size-4 text-primary shrink-0" />
          <span className="font-semibold text-foreground">
            {isVi ? 'Mục chờ nghiệm thu:' : 'Pending Review Sign-Offs:'}
          </span>
          {hitlTasks.map((t) => (
            <Badge
              key={t.id}
              variant="outline"
              onClick={() => {
                setHitlTask(t);
                setGovernanceError(null);
              }}
              className="cursor-pointer gap-1 border-border bg-card/80 text-xs text-foreground hover:bg-muted/50"
            >
              <span>{t.id}</span>
              <span className="max-w-48 truncate">{t.title}</span>
              <span className="font-semibold underline">
                {isVi ? 'Xem & Duyệt' : 'Review & Sign Off'}
              </span>
            </Badge>
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleManualSync}
          disabled={syncing}
          className="h-8 gap-1.5 px-2.5 text-xs"
        >
          {syncing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          <span>{isVi ? 'Đồng bộ' : 'Sync Updates'}</span>
        </Button>
      </div>

      {hitlTask && (
        <Dialog open={true} onOpenChange={() => setHitlTask(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <DialogTitle className="text-base font-semibold">
                  {isVi ? 'Phê duyệt nghiệm thu công việc' : 'Review & Sign Off Deliverable'}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                {isVi
                  ? 'Người phê duyệt phải độc lập với người thực hiện công việc này.'
                  : 'Reviewer must be independent from the author who completed this work.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-md border border-border bg-muted/30 p-2.5">
                <div className="font-semibold text-foreground">{hitlTask.title}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">
                  {isVi ? 'Mã' : 'ID'}: {hitlTask.id} · {isVi ? 'Mức ưu tiên' : 'Priority'}:{' '}
                  {hitlTask.priority}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  {isVi
                    ? 'Người phê duyệt (độc lập với người thực hiện)'
                    : 'Reviewer (Independent from Author)'}
                </label>
                <Input
                  value={approverId}
                  onChange={(e) => setApproverId(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  {isVi
                    ? 'Lý do phê duyệt & bằng chứng kiểm chứng'
                    : 'Approval Notes & Verification Summary'}
                </label>
                <Input
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              {governanceError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/15 p-2 text-xs text-destructive">
                  {governanceError}
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHitlTask(null)}
                className="h-8 px-3 text-xs"
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                onClick={handleApproveGovernance}
                className="h-8 gap-1 bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90"
              >
                <CheckCircle2 className="size-3.5" />
                {isVi ? 'Phê duyệt & Hoàn tất' : 'Approve & Complete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
