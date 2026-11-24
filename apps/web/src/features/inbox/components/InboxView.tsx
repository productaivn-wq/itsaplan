'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Inbox,
  ListTodo,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  SquareKanban,
  Users,
} from 'lucide-react';
import { PixelAgentAvatar } from '@/features/vibe-canvas/open-office/PixelOfficeSprites';
import { useLocale } from 'next-intl';
import { listProjectApprovals } from '@/lib/api/endpoints/agents';
import {
  fetchPortfolioApprovals,
  fetchPortfolioDirectory,
  fetchPortfolioUpdates,
} from '@/lib/api/endpoints/portfolio';
import type { ProjectDetail } from '@/lib/api/endpoints/projects';
import type { Notification } from '@/lib/api/endpoints/notifications';
import { cn } from '@/lib/utils';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import { revScope } from '@/utils/revScopes';
import { useIsMobile } from '@/hooks/use-mobile';
import { showUndoToast } from '@/hooks/useUndoToast';
import { isTypingTarget } from '@/utils/hotkeys';
import { formatDurationShort } from '@/utils/dates';
import { directoryPath, openOfficePath, projectPath, splitProjectRef } from '@/utils/paths';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import InboxScopePicker from './InboxScopePicker';
import InboxToolbar from './InboxToolbar';
import InboxListItem from './InboxListItem';
import InboxDetail from './InboxDetail';
import InboxDecisionDetail from './InboxDecisionDetail';
import InboxHandoffDetail from './InboxHandoffDetail';
import InboxIntakeDetail from './InboxIntakeDetail';
import InboxCrossProjectDetail from './InboxCrossProjectDetail';
import InboxCommDetail from './InboxCommDetail';
import InboxDigestPanel from './InboxDigestPanel';
import InboxDirectoryItemDetail from './InboxDirectoryItemDetail';
import InboxQueueDetail from './InboxQueueDetail';
import InboxSuppressionDrawer from './InboxSuppressionDrawer';
import InboxUpdateDetail from './InboxUpdateDetail';
import { useInboxFilters } from '../hooks/useInboxFilters';
import {
  useNotificationsQuery,
  useSetNotificationRead,
  useSnoozeNotification,
  useDeleteNotification,
  useMarkAllRead,
  useDeleteNotifications,
} from '../services/notifications.service';
import {
  compareProjectsByLastUpdatedDesc,
  consumeInboxFocusTarget,
  fetchOpenOfficeInboxData,
  fetchUnifiedInboxStreams,
  getInboxItemUpdatedMs,
  parseEffectiveTimestampMs,
  readDismissedHandoffIds,
  readStoredInboxGroupBy,
  readStoredInboxScope,
  submitInboxTriageAction,
  triggerInboxCollection,
  writeDismissedHandoffIds,
  writeStoredInboxGroupBy,
  writeStoredInboxScope,
  type AvailableProjectOption,
  type BridgeHealthStatus,
  type ChannelInboxItem,
  type CommInboxItem,
  type ContactInboxItem,
  type DecisionInboxItem,
  type HandoffInboxItem,
  type InboxBucket,
  type InboxCollectionStatus,
  type InboxDigest,
  type InboxGroupBy,
  type InboxScope,
  type InboxStreamItem,
  type IntakeInboxItem,
  type MutedChannelInfo,
  type NotificationInboxItem,
  type PortfolioInboxCounts,
  type ProjectInboxCount,
  type QueueTaskInboxItem,
  type UpdateInboxItem,
} from '../services/inboxStreams';

function worstBridgeStatus(a: BridgeHealthStatus, b: BridgeHealthStatus): BridgeHealthStatus {
  const rank: Record<BridgeHealthStatus, number> = {
    quarantined: 3,
    offline: 2,
    disabled: 1,
    ok: 0,
  };
  return rank[a] >= rank[b] ? a : b;
}

function commCategoryLabel(category: CommInboxItem['category'], isVi: boolean): string {
  switch (category) {
    case 'hitl_required':
      return isVi ? 'Cần phản hồi' : 'Reply';
    case 'task_created':
      return isVi ? 'Tách việc' : 'Task';
    case 'delivery_alert':
      return isVi ? 'Cảnh báo' : 'Alert';
    default:
      return isVi ? 'Tin mới' : 'Chat';
  }
}

function proposalActionLabel(
  action: NonNullable<CommInboxItem['nextStepProposal']>['recommendedAction'],
  isVi: boolean,
): string {
  switch (action) {
    case 'quarantine_review':
      return isVi ? 'Cách ly' : 'Quarantined';
    case 'human_approval':
      return isVi ? 'Cần duyệt' : 'Approve';
    case 'create_task':
      return isVi ? 'Tạo việc' : 'Task';
    case 'reassign_project':
      return isVi ? 'Gắn dự án' : 'Assign';
    case 'register_contact':
      return isVi ? 'Xác minh' : 'Verify';
    case 'fix_delivery':
      return isVi ? 'Sửa kênh' : 'Fix';
    case 'mute_channel':
      return isVi ? 'Tắt kênh' : 'Mute';
    case 'dispatch_agent':
    default:
      return isVi ? 'Giao AI' : 'Agent';
  }
}

function tomorrowMorningIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

function SectionHeading({ label, count }: { label: string; count: number }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-muted/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-xs">
      <span>{label}</span>
      <span className="font-mono">{count}</span>
    </div>
  );
}

export default function InboxView({ project }: { project: ProjectDetail }) {
  const locale = useLocale();
  const isVi = locale.toLowerCase().startsWith('vi');
  const projectKey = project.project.ref || '';
  const shortProjectKey = project.project.key || (projectKey.includes('.') ? splitProjectRef(projectKey).key : '');
  const projectId = project.project.id;

  const [scope, setScope] = useState<InboxScope>(() => readStoredInboxScope());
  const [groupBy, setGroupBy] = useState<InboxGroupBy>(() => readStoredInboxGroupBy());
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [channelSearchFilter, setChannelSearchFilter] = useState<string>('');
  const [bucket, setBucket] = useState<InboxBucket>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<DecisionInboxItem[]>([]);
  const [comms, setComms] = useState<CommInboxItem[]>([]);
  const [queueTasks, setQueueTasks] = useState<QueueTaskInboxItem[]>([]);
  const [handoffs, setHandoffs] = useState<HandoffInboxItem[]>([]);
  const [intakeFiles, setIntakeFiles] = useState<IntakeInboxItem[]>([]);
  const [portfolioCounts, setPortfolioCounts] = useState<PortfolioInboxCounts>({
    comms: 0,
    queue: 0,
    intake: 0,
    total: 0,
    otherProjects: 0,
  });
  const [projectCounts, setProjectCounts] = useState<Record<string, ProjectInboxCount>>({});
  const [availableProjects, setAvailableProjects] = useState<AvailableProjectOption[]>([]);
  const [suppressedNoiseCount, setSuppressedNoiseCount] = useState<number>(0);
  const [mutedChannels, setMutedChannels] = useState<MutedChannelInfo[]>([]);
  const [suppressionDrawerOpen, setSuppressionDrawerOpen] = useState<boolean>(false);
  const [inboxDigest, setInboxDigest] = useState<InboxDigest | null>(null);
  const [collectionStatus, setCollectionStatus] = useState<InboxCollectionStatus | null>(null);
  const [isCollecting, setIsCollecting] = useState<boolean>(false);
  const [officeBridgeStatus, setOfficeBridgeStatus] = useState<BridgeHealthStatus>('ok');
  const [unifiedBridgeStatus, setUnifiedBridgeStatus] = useState<BridgeHealthStatus>('ok');
  const [isUnifiedLoading, setIsUnifiedLoading] = useState<boolean>(true);
  const bridgeStatus = worstBridgeStatus(officeBridgeStatus, unifiedBridgeStatus);
  const [dismissedHandoffIds, setDismissedHandoffIds] = useState<Set<string>>(() =>
    readDismissedHandoffIds(),
  );

  const reworkInputRef = useRef<HTMLTextAreaElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const streamReqSeqRef = useRef(0);
  const isMobile = useIsMobile();

  const scopeKey = scope === 'all' ? '__all__' : projectKey;
  const scopedProjectId = scope === 'all' ? null : projectId;

  const qc = useQueryClient();
  const { filters, changeFilters } = useInboxFilters(projectKey);
  const query = useNotificationsQuery(scopeKey, scopedProjectId, filters);
  const pgApprovalsQuery = useQuery<{
    items: Array<{
      id: string;
      agentId: number;
      toolName: string;
      kind: string;
      payload: Record<string, unknown>;
      createdAt: string;
      projectKey?: string;
    }>;
  }>({
    queryKey: ['project-approvals', scope === 'all' ? '__all__' : projectKey],
    queryFn: async () =>
      scope === 'all'
        ? await fetchPortfolioApprovals('pending')
        : await listProjectApprovals(projectKey, 'pending'),
    enabled: !!projectKey,
    refetchInterval: 15_000,
  });
  const portfolioDirectoryQuery = useQuery({
    queryKey: ['portfolio-directory', scope === 'all' ? '__all__' : shortProjectKey],
    queryFn: () =>
      fetchPortfolioDirectory(scope === 'all' ? undefined : shortProjectKey || undefined),
    enabled: !!projectKey,
    refetchInterval: 30_000,
  });
  const portfolioUpdatesQuery = useQuery({
    queryKey: ['portfolio-updates', scope === 'all' ? '__all__' : shortProjectKey],
    queryFn: () =>
      fetchPortfolioUpdates({
        projectKey: scope === 'all' ? undefined : shortProjectKey || undefined,
        days: 7,
        perProject: 5,
        limit: 250,
      }),
    enabled: !!projectKey,
    refetchInterval: 30_000,
  });
  const setRead = useSetNotificationRead(scopeKey);
  const snooze = useSnoozeNotification(scopeKey);
  const deleteOne = useDeleteNotification(scopeKey);
  const markAllRead = useMarkAllRead(scopeKey, scopedProjectId);
  const deleteNotifications = useDeleteNotifications(scopeKey, scopedProjectId);

  const notifications = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );

  useLiveRefresh({
    scope: revScope.inbox(projectId),
    targets: [['notifications'], ['notificationsUnread']],
  });

  const loadStreams = useCallback(
    (showSpinner: boolean) => {
      streamAbortRef.current?.abort();
      const controller = new AbortController();
      streamAbortRef.current = controller;
      const reqId = ++streamReqSeqRef.current;
      const targetProject = scope === 'all' ? null : shortProjectKey || 'PM';

      if (showSpinner) {
        setIsUnifiedLoading(true);
      }

      void fetchUnifiedInboxStreams(targetProject, controller.signal)
        .then((unifiedData) => {
          if (reqId !== streamReqSeqRef.current || controller.signal.aborted) return;
          setComms(unifiedData.comms);
          setQueueTasks(unifiedData.queueTasks);
          setIntakeFiles(unifiedData.intakeFiles);
          setPortfolioCounts(unifiedData.portfolioCounts);
          setProjectCounts(unifiedData.projectCounts);
          setAvailableProjects(unifiedData.availableProjects);
          setSuppressedNoiseCount(unifiedData.suppressedNoiseCount);
          setMutedChannels(unifiedData.mutedChannels ?? []);
          setInboxDigest(unifiedData.inboxDigest);
          setCollectionStatus(unifiedData.collectionStatus);
          setUnifiedBridgeStatus(unifiedData.bridgeStatus);
          setIsUnifiedLoading(false);
        })
        .catch(() => {
          if (reqId !== streamReqSeqRef.current || controller.signal.aborted) return;
          setIsUnifiedLoading(false);
        });

      void fetchOpenOfficeInboxData(targetProject, controller.signal).then((officeData) => {
        if (reqId !== streamReqSeqRef.current || controller.signal.aborted) return;
        setDecisions(officeData.decisions);
        setHandoffs(officeData.handoffs);
        setOfficeBridgeStatus(officeData.bridgeStatus);
      });
    },
    [scope, shortProjectKey],
  );

  const refreshStreams = useCallback(() => {
    loadStreams(false);
  }, [loadStreams]);

  const handleCollectNow = useCallback(async () => {
    if (isCollecting) return;
    setIsCollecting(true);
    try {
      await triggerInboxCollection(true);
      loadStreams(false);
    } catch {
      // Refresh cached streams even if live poll had a partial error
      loadStreams(false);
    } finally {
      setIsCollecting(false);
    }
  }, [isCollecting, loadStreams]);

  useEffect(() => {
    const focusTarget = consumeInboxFocusTarget();
    if (focusTarget) {
      if (focusTarget.projectKey && focusTarget.projectKey !== 'ALL') {
        setScope('all');
        writeStoredInboxScope('all');
        setProjectFilter(focusTarget.projectKey.toUpperCase());
      }
      if (focusTarget.bucket) {
        setBucket(focusTarget.bucket);
      }
      if (focusTarget.search) {
        setChannelSearchFilter(focusTarget.search);
      }
    }
    loadStreams(true);

    const onMutated = () => {
      refreshStreams();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('itsaplan:open-office-mutated', onMutated);
      window.addEventListener('itsaplan:directory-mutated', onMutated);
    }
    const pollTimer =
      typeof window !== 'undefined'
        ? window.setInterval(() => {
            if (typeof document === 'undefined' || document.visibilityState === 'visible') {
              refreshStreams();
            }
          }, 60_000)
        : undefined;
    return () => {
      streamAbortRef.current?.abort();
      if (pollTimer !== undefined) {
        window.clearInterval(pollTimer);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('itsaplan:open-office-mutated', onMutated);
        window.removeEventListener('itsaplan:directory-mutated', onMutated);
      }
    };
  }, [loadStreams, refreshStreams]);

  const visibleHandoffs = useMemo(
    () => handoffs.filter((item) => !dismissedHandoffIds.has(item.id)),
    [handoffs, dismissedHandoffIds],
  );

  const notificationItems = useMemo<NotificationInboxItem[]>(
    () =>
      notifications.map((n) => ({
        kind: 'notification',
        id: `notification:${n.id}`,
        notification: n,
        timestamp: n.createdAt,
      })),
    [notifications],
  );

  const activeProjectFilter = scope === 'all' ? projectFilter : 'ALL';

  const matchesProjectFilter = useCallback(
    (itemProjKey: string | undefined): boolean => {
      if (activeProjectFilter === 'ALL') return true;
      return (itemProjKey || 'UNASSIGNED').toUpperCase() === activeProjectFilter;
    },
    [activeProjectFilter],
  );

  const pgApprovalDecisions = useMemo<DecisionInboxItem[]>(() => {
    const items = pgApprovalsQuery.data?.items ?? [];
    return items.map((a) => {
      const payload = (a.payload ?? {}) as Record<string, unknown>;
      const sod = payload.sod as Record<string, unknown> | undefined;
      const summary = sod
        ? `SoD ${String(sod.status ?? 'PENDING')} · Approver: ${String(sod.approver_id ?? 'Owner')} · Executor: ${String(sod.executor_id ?? 'Agent')}`
        : Object.keys(payload).length > 0
          ? JSON.stringify(payload)
          : isVi
            ? 'Yêu cầu phê duyệt tác vụ AI đang chờ xác nhận.'
            : 'Pending AI agent action awaiting your approval.';
      return {
        kind: 'decision',
        id: `pg-approval:${a.id}`,
        contractId: a.id,
        title: a.toolName,
        projectKey: (a as { projectKey?: string }).projectKey || shortProjectKey || 'PM',
        actorId: String(a.agentId ?? 'agent'),
        actorName: a.agentId != null ? `Agent #${a.agentId}` : 'AI Agent',
        domain: a.kind || 'approval',
        priority: 'HIGH',
        confidencePct: null,
        acceptanceCriteria: [],
        evidenceSummary: summary,
        evidenceLinks: [],
        createdAt: a.createdAt,
        updatedAt: a.createdAt,
      };
    });
  }, [pgApprovalsQuery.data?.items, shortProjectKey, isVi]);

  const filteredDecisions = useMemo(() => {
    const merged = [...pgApprovalDecisions];
    const seen = new Set(merged.map((d) => d.contractId));
    for (const d of decisions) {
      if (!seen.has(d.contractId)) {
        merged.push(d);
        seen.add(d.contractId);
      }
    }
    return merged.filter((x) => matchesProjectFilter(x.projectKey));
  }, [pgApprovalDecisions, decisions, matchesProjectFilter]);
  const filteredComms = useMemo(() => {
    const q = channelSearchFilter.trim().toLowerCase();
    return comms.filter((x) => {
      if (!matchesProjectFilter(x.projectKey)) return false;
      if (!q) return true;
      return (
        x.channelName.toLowerCase().includes(q) ||
        x.sender.toLowerCase().includes(q) ||
        x.targetHandle.toLowerCase().includes(q) ||
        (x.channelId ?? '').toLowerCase().includes(q) ||
        (x.contactName ?? '').toLowerCase().includes(q)
      );
    });
  }, [comms, matchesProjectFilter, channelSearchFilter]);
  const filteredQueueTasks = useMemo(
    () => queueTasks.filter((x) => matchesProjectFilter(x.projectKey)),
    [queueTasks, matchesProjectFilter],
  );
  const filteredIntakeFiles = useMemo(
    () => intakeFiles.filter((x) => matchesProjectFilter(x.projectKey)),
    [intakeFiles, matchesProjectFilter],
  );
  const filteredHandoffs = useMemo(
    () => visibleHandoffs.filter((x) => matchesProjectFilter(x.projectKey)),
    [visibleHandoffs, matchesProjectFilter],
  );
  const updateItems = useMemo<UpdateInboxItem[]>(
    () =>
      (portfolioUpdatesQuery.data?.items ?? []).map((u) => ({
        kind: 'update',
        id: u.id,
        updateKind: u.kind,
        projectId: u.projectId,
        projectKey: u.projectKey,
        projectName: u.projectName,
        projectRef: u.projectRef,
        title: u.title,
        summary: u.summary,
        actorName: u.actorName,
        status: u.status,
        entityId: u.entityId,
        issueSeq: u.issueSeq,
        timestamp: u.createdAt,
      })),
    [portfolioUpdatesQuery.data?.items],
  );

  const contactItems = useMemo<ContactInboxItem[]>(
    () =>
      (portfolioDirectoryQuery.data?.contacts ?? []).map((c) => ({
        kind: 'contact',
        id: `contact:${c.projectKey || c.projectId}:${c.externalKey}`,
        externalKey: c.externalKey,
        name: c.name,
        role: c.role,
        raciRole: c.raciRole,
        orgId: c.orgId,
        lifecycleStage: c.lifecycleStage,
        primaryEmail: c.primaryEmail,
        phone: c.phone,
        source: c.source,
        projectKey: c.projectKey || shortProjectKey || 'PM',
        projectName: c.projectName || c.projectKey || 'Project',
        projectRef: c.projectRef || projectKey,
      })),
    [portfolioDirectoryQuery.data?.contacts, shortProjectKey, projectKey],
  );

  const channelItems = useMemo<ChannelInboxItem[]>(
    () =>
      (portfolioDirectoryQuery.data?.channels ?? []).map((ch) => ({
        kind: 'channel',
        id: `channel:${ch.projectKey || ch.projectId}:${ch.channelId}`,
        channelId: ch.channelId,
        platform: ch.platform,
        threadType: ch.threadType,
        displayName: ch.displayName,
        targetId: ch.targetId,
        aliases: ch.aliases,
        status: ch.status,
        lastSyncedAt: ch.lastSyncedAt,
        projectKey: ch.projectKey || shortProjectKey || 'PM',
        projectName: ch.projectName || ch.projectKey || 'Project',
        projectRef: ch.projectRef || projectKey,
      })),
    [portfolioDirectoryQuery.data?.channels, shortProjectKey, projectKey],
  );

  const filteredUpdates = useMemo(
    () => updateItems.filter((x) => matchesProjectFilter(x.projectKey)),
    [updateItems, matchesProjectFilter],
  );
  const filteredContacts = useMemo(
    () => contactItems.filter((x) => matchesProjectFilter(x.projectKey)),
    [contactItems, matchesProjectFilter],
  );
  const filteredChannels = useMemo(
    () => channelItems.filter((x) => matchesProjectFilter(x.projectKey)),
    [channelItems, matchesProjectFilter],
  );

  const filteredNotifications = useMemo(
    () => notificationItems.filter((x) => matchesProjectFilter(x.notification.projectKey)),
    [notificationItems, matchesProjectFilter],
  );

  const visibleItems = useMemo<InboxStreamItem[]>(() => {
    if (bucket === 'decisions') return filteredDecisions;
    if (bucket === 'updates') return filteredUpdates;
    if (bucket === 'comms') return filteredComms;
    if (bucket === 'contacts') return filteredContacts;
    if (bucket === 'channels') return filteredChannels;
    if (bucket === 'queue') return filteredQueueTasks;
    if (bucket === 'intake') return filteredIntakeFiles;
    if (bucket === 'handoffs') return filteredHandoffs;
    if (bucket === 'mentions') return filteredNotifications;
    return [
      ...filteredDecisions,
      ...filteredUpdates,
      ...filteredComms,
      ...filteredQueueTasks,
      ...filteredIntakeFiles,
      ...filteredHandoffs,
      ...filteredNotifications,
    ];
  }, [
    bucket,
    filteredDecisions,
    filteredUpdates,
    filteredComms,
    filteredContacts,
    filteredChannels,
    filteredQueueTasks,
    filteredIntakeFiles,
    filteredHandoffs,
    filteredNotifications,
  ]);

  const itemProjectKey = useCallback(
    (item: InboxStreamItem): string => {
      switch (item.kind) {
        case 'decision':
        case 'update':
        case 'comm':
        case 'contact':
        case 'channel':
        case 'queue':
        case 'handoff':
          return (item.projectKey || 'UNASSIGNED').toUpperCase();
        case 'intake':
          return (item.projectKey || shortProjectKey || 'PM').toUpperCase();
        case 'notification':
          return (item.notification.projectKey || shortProjectKey || 'PM').toUpperCase();
      }
    },
    [shortProjectKey],
  );

  const projectLastUpdatedMs = useMemo(() => {
    const map = new Map<string, number>();
    const bump = (rawKey: string | undefined, ms: number) => {
      if (!Number.isFinite(ms)) return;
      const k = (rawKey || 'UNASSIGNED').toUpperCase();
      const prev = map.get(k) ?? Number.NEGATIVE_INFINITY;
      if (ms > prev) map.set(k, ms);
    };
    const nowMs = Date.now();
    for (const p of Object.values(projectCounts)) {
      bump(p.key, parseEffectiveTimestampMs(p.lastUpdatedAt));
    }
    for (const p of portfolioDirectoryQuery.data?.projects ?? []) {
      bump(p.key, parseEffectiveTimestampMs(p.lastActivityAt));
    }
    for (const item of comms) bump(itemProjectKey(item), getInboxItemUpdatedMs(item, nowMs));
    for (const item of queueTasks) bump(itemProjectKey(item), getInboxItemUpdatedMs(item, nowMs));
    for (const item of intakeFiles) bump(itemProjectKey(item), getInboxItemUpdatedMs(item, nowMs));
    for (const item of updateItems) bump(itemProjectKey(item), getInboxItemUpdatedMs(item, nowMs));
    for (const item of pgApprovalDecisions) bump(itemProjectKey(item), getInboxItemUpdatedMs(item, nowMs));
    for (const item of decisions) bump(itemProjectKey(item), getInboxItemUpdatedMs(item, nowMs));
    for (const item of visibleHandoffs) bump(itemProjectKey(item), getInboxItemUpdatedMs(item, nowMs));
    for (const item of notificationItems) bump(itemProjectKey(item), getInboxItemUpdatedMs(item, nowMs));
    return map;
  }, [
    projectCounts,
    portfolioDirectoryQuery.data?.projects,
    comms,
    queueTasks,
    intakeFiles,
    updateItems,
    pgApprovalDecisions,
    decisions,
    visibleHandoffs,
    notificationItems,
    itemProjectKey,
  ]);

  const groupedByProject = useMemo(() => {
    const nowMs = Date.now();
    const groups = new Map<
      string,
      { key: string; name: string; items: InboxStreamItem[]; lastUpdatedMs: number }
    >();
    for (const item of visibleItems) {
      const pk = itemProjectKey(item);
      let g = groups.get(pk);
      if (!g) {
        g = {
          key: pk,
          name: projectCounts[pk]?.name || (pk === 'UNASSIGNED' ? (isVi ? 'Chưa phân loại' : 'Unassigned') : pk),
          items: [],
          lastUpdatedMs: Number.NEGATIVE_INFINITY,
        };
        groups.set(pk, g);
      }
      g.items.push(item);
      if (item.kind !== 'contact' && item.kind !== 'channel') {
        const ms = getInboxItemUpdatedMs(item, nowMs);
        if (ms > g.lastUpdatedMs) g.lastUpdatedMs = ms;
      }
    }
    return Array.from(groups.values())
      .map((g) => ({
        ...g,
        lastUpdatedMs: Number.isFinite(g.lastUpdatedMs)
          ? g.lastUpdatedMs
          : (projectLastUpdatedMs.get(g.key) ??
            (bucket === 'channels'
              ? g.items.reduce(
                  (m, it) => Math.max(m, getInboxItemUpdatedMs(it, nowMs)),
                  Number.NEGATIVE_INFINITY,
                )
              : Number.NEGATIVE_INFINITY)),
      }))
      .sort((a, b) =>
        compareProjectsByLastUpdatedDesc(
          { key: a.key, lastUpdatedMs: a.lastUpdatedMs, count: a.items.length },
          { key: b.key, lastUpdatedMs: b.lastUpdatedMs, count: b.items.length },
        ),
      );
  }, [visibleItems, itemProjectKey, projectCounts, projectLastUpdatedMs, bucket, isVi]);

  const projectFilterChips = useMemo(() => {
    const merged = new Map<string, ProjectInboxCount>();
    for (const p of Object.values(projectCounts)) {
      if (p.total > 0) merged.set(p.key.toUpperCase(), { ...p });
    }
    for (const p of portfolioDirectoryQuery.data?.projects ?? []) {
      const k = p.key.toUpperCase();
      const dirTotal = p.contactsCount + p.channelsCount;
      const updTotal = portfolioUpdatesQuery.data?.projectCounts?.[p.key] ?? 0;
      const prev = merged.get(k);
      if (prev) {
        merged.set(k, { ...prev, total: prev.total + dirTotal + updTotal });
      } else if (dirTotal + updTotal > 0) {
        merged.set(k, {
          key: k,
          name: p.name,
          comms: 0,
          queue: 0,
          intake: 0,
          total: dirTotal + updTotal,
          lastUpdatedAt: p.lastActivityAt ?? null,
        });
      }
    }
    for (const [k, cnt] of Object.entries(portfolioUpdatesQuery.data?.projectCounts ?? {})) {
      const uk = k.toUpperCase();
      if (!merged.has(uk) && cnt > 0) {
        merged.set(uk, { key: uk, name: uk, comms: 0, queue: 0, intake: 0, total: cnt });
      }
    }
    const entries = Array.from(merged.values())
      .filter((p) => p.total > 0)
      .map((entry) => {
        const mappedMs = projectLastUpdatedMs.get(entry.key) ?? Number.NEGATIVE_INFINITY;
        const ownMs = parseEffectiveTimestampMs(entry.lastUpdatedAt);
        return {
          ...entry,
          lastUpdatedMs: Math.max(mappedMs, ownMs),
        };
      });
    entries.sort((a, b) =>
      compareProjectsByLastUpdatedDesc(
        { key: a.key, lastUpdatedMs: a.lastUpdatedMs, count: a.total },
        { key: b.key, lastUpdatedMs: b.lastUpdatedMs, count: b.total },
      ),
    );
    return entries;
  }, [
    projectCounts,
    portfolioDirectoryQuery.data?.projects,
    portfolioUpdatesQuery.data?.projectCounts,
    projectLastUpdatedMs,
  ]);

  const selectedItem = useMemo(
    () => visibleItems.find((item) => item.id === selectedId) ?? null,
    [visibleItems, selectedId],
  );

  const totalCount =
    filteredDecisions.length +
    filteredUpdates.length +
    filteredComms.length +
    filteredQueueTasks.length +
    filteredIntakeFiles.length +
    filteredHandoffs.length +
    filteredNotifications.length;

  const getNextSelectionId = useCallback(
    (removingId: string): string | null => {
      const idx = visibleItems.findIndex((item) => item.id === removingId);
      if (idx === -1) return null;
      return visibleItems[idx + 1]?.id ?? visibleItems[idx - 1]?.id ?? null;
    },
    [visibleItems],
  );

  const handleScopeChange = useCallback((nextScope: InboxScope) => {
    setScope(nextScope);
    writeStoredInboxScope(nextScope);
    if (nextScope === 'project') {
      setProjectFilter('ALL');
    }
  }, []);

  const handleGroupByChange = useCallback((nextGroupBy: InboxGroupBy) => {
    setGroupBy(nextGroupBy);
    writeStoredInboxGroupBy(nextGroupBy);
  }, []);

  const handleSelectProjectFilter = useCallback((nextKey: string) => {
    setProjectFilter(nextKey);
    if (nextKey !== 'ALL' && scope !== 'all') {
      setScope('all');
      writeStoredInboxScope('all');
    }
  }, [scope]);

  const handleSelectNotification = useCallback(
    (n: Notification) => {
      setSelectedId(`notification:${n.id}`);
      if (n.readAt == null) setRead.mutate({ id: n.id, read: true });
    },
    [setRead],
  );

  const handleDeleteNotification = useCallback(
    (n: Notification) => {
      const itemId = `notification:${n.id}`;
      if (selectedId === itemId) setSelectedId(getNextSelectionId(itemId));
      deleteOne.mutate(n.id);
    },
    [selectedId, getNextSelectionId, deleteOne],
  );

  const handleArchiveHandoff = useCallback(
    (item: HandoffInboxItem) => {
      const nextId = selectedId === item.id ? getNextSelectionId(item.id) : selectedId;
      setDismissedHandoffIds((prev) => {
        const next = new Set(prev);
        next.add(item.id);
        writeDismissedHandoffIds(next);
        return next;
      });
      setSelectedId(nextId);

      showUndoToast({
        message: isVi ? `Đã lưu trữ bàn giao: ${item.title}` : `Archived handoff: ${item.title}`,
        undoLabel: isVi ? 'Hoàn tác' : 'Undo',
        durationMs: 10_000,
        onUndo: () => {
          setDismissedHandoffIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            writeDismissedHandoffIds(next);
            return next;
          });
          setSelectedId(item.id);
        },
      });
    },
    [selectedId, getNextSelectionId, isVi],
  );

  const handleDecisionResolved = useCallback(
    (contractId: string) => {
      const pgId = `pg-approval:${contractId}`;
      const decId = `decision:${contractId}`;
      const removingId = selectedId === pgId ? pgId : decId;
      const nextId = selectedId === removingId ? getNextSelectionId(removingId) : selectedId;
      setDecisions((prev) => prev.filter((item) => item.contractId !== contractId));
      setSelectedId(nextId);
      void qc.invalidateQueries({ queryKey: ['project-approvals', projectKey] });
      void refreshStreams();
    },
    [selectedId, getNextSelectionId, qc, projectKey, refreshStreams],
  );

  const handleDismissUnifiedItem = useCallback(
    (item: CommInboxItem | QueueTaskInboxItem) => {
      const nextId = selectedId === item.id ? getNextSelectionId(item.id) : selectedId;
      if (item.kind === 'comm') {
        setComms((prev) => prev.filter((x) => x.id !== item.id));
      } else {
        setQueueTasks((prev) => prev.filter((x) => x.id !== item.id));
      }
      setSelectedId(nextId);

      void submitInboxTriageAction({ action: 'dismiss', itemId: item.id }).catch(() => {
        void refreshStreams();
      });

      const label = item.kind === 'comm' ? item.sender : item.taskKey;
      showUndoToast({
        message: isVi ? `Đã ẩn mục: ${label}` : `Dismissed: ${label}`,
        undoLabel: isVi ? 'Hoàn tác' : 'Undo',
        durationMs: 10_000,
        onUndo: () => {
          void submitInboxTriageAction({ action: 'reopen', itemId: item.id })
            .then(() => refreshStreams())
            .catch(() => {
              void refreshStreams();
            });
          setSelectedId(item.id);
        },
      });
    },
    [selectedId, getNextSelectionId, isVi, refreshStreams],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !query.hasNextPage || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !query.isFetchingNextPage) {
          void query.fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [query]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      const lower = e.key.toLowerCase();

      if (lower === 'j' || e.key === 'ArrowDown') {
        if (visibleItems.length === 0) return;
        e.preventDefault();
        const idx = selectedItem ? visibleItems.findIndex((x) => x.id === selectedItem.id) : -1;
        const nextItem = idx === -1 ? visibleItems[0] : visibleItems[Math.min(idx + 1, visibleItems.length - 1)];
        if (nextItem) setSelectedId(nextItem.id);
        return;
      }

      if (lower === 'k' || e.key === 'ArrowUp') {
        if (visibleItems.length === 0) return;
        e.preventDefault();
        const idx = selectedItem ? visibleItems.findIndex((x) => x.id === selectedItem.id) : -1;
        const prevItem =
          idx === -1 ? visibleItems[visibleItems.length - 1] : visibleItems[Math.max(idx - 1, 0)];
        if (prevItem) setSelectedId(prevItem.id);
        return;
      }

      if (lower === 'p') {
        e.preventDefault();
        handleScopeChange(scope === 'project' ? 'all' : 'project');
        return;
      }

      if (e.key === 'Escape') {
        if (selectedId != null) {
          e.preventDefault();
          setSelectedId(null);
        }
        return;
      }

      if (!selectedItem) return;

      if (lower === 'e') {
        if (selectedItem.kind === 'handoff') {
          e.preventDefault();
          handleArchiveHandoff(selectedItem);
        } else if (selectedItem.kind === 'comm' || selectedItem.kind === 'queue') {
          e.preventDefault();
          handleDismissUnifiedItem(selectedItem);
        } else if (selectedItem.kind === 'notification') {
          e.preventDefault();
          handleDeleteNotification(selectedItem.notification);
        }
        return;
      }

      if (lower === 's' && selectedItem.kind === 'notification') {
        e.preventDefault();
        const n = selectedItem.notification;
        const nextId = getNextSelectionId(selectedItem.id);
        snooze.mutate({ id: n.id, until: tomorrowMorningIso() });
        setSelectedId(nextId);
        showUndoToast({
          message: isVi ? `Đã tạm ẩn ${n.projectKey}-${n.issueSeq}` : `Snoozed ${n.projectKey}-${n.issueSeq}`,
          undoLabel: isVi ? 'Hoàn tác' : 'Undo',
          durationMs: 10_000,
          onUndo: () => {
            snooze.mutate({ id: n.id, until: null });
          },
        });
        return;
      }

      if (lower === 'a') {
        if (selectedItem.kind === 'decision') {
          e.preventDefault();
          const btn = document.querySelector<HTMLButtonElement>(
            '[data-testid="btn-inbox-approve-decision"]',
          );
          if (btn && !btn.disabled) btn.click();
        } else if (selectedItem.kind === 'notification') {
          e.preventDefault();
          const n = selectedItem.notification;
          if (n.readAt == null) setRead.mutate({ id: n.id, read: true });
        }
        return;
      }

      if (lower === 'r') {
        if (selectedItem.kind === 'decision') {
          e.preventDefault();
          reworkInputRef.current?.focus();
        } else if (selectedItem.kind === 'notification') {
          e.preventDefault();
          const n = selectedItem.notification;
          setRead.mutate({ id: n.id, read: n.readAt == null });
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    visibleItems,
    selectedItem,
    selectedId,
    scope,
    isVi,
    handleScopeChange,
    handleArchiveHandoff,
    handleDismissUnifiedItem,
    handleDeleteNotification,
    getNextSelectionId,
    snooze,
    setRead,
  ]);

  const [moreBucketsOpen, setMoreBucketsOpen] = useState(false);

  const bucketTabs = useMemo<Array<{ id: InboxBucket; label: string; count: number }>>(
    () => [
      { id: 'all', label: isVi ? 'Tất cả' : 'All', count: totalCount },
      { id: 'decisions', label: isVi ? 'Cần duyệt' : 'Decisions', count: filteredDecisions.length },
      { id: 'updates', label: isVi ? 'Cập nhật' : 'Updates', count: filteredUpdates.length },
      { id: 'comms', label: isVi ? 'Tin nhắn' : 'Comms', count: filteredComms.length },
      { id: 'contacts', label: isVi ? 'Liên hệ' : 'Contacts', count: filteredContacts.length },
      { id: 'channels', label: isVi ? 'Kênh' : 'Channels', count: filteredChannels.length },
      { id: 'queue', label: isVi ? 'Hàng đợi' : 'Queue', count: filteredQueueTasks.length },
      { id: 'handoffs', label: isVi ? 'Bàn giao AI' : 'Handoffs', count: filteredHandoffs.length },
      { id: 'intake', label: isVi ? 'Đầu vào' : 'Intake', count: filteredIntakeFiles.length },
      { id: 'mentions', label: isVi ? 'Đề cập' : 'Mentions', count: filteredNotifications.length },
    ],
    [
      isVi,
      totalCount,
      filteredDecisions.length,
      filteredUpdates.length,
      filteredComms.length,
      filteredContacts.length,
      filteredChannels.length,
      filteredQueueTasks.length,
      filteredHandoffs.length,
      filteredIntakeFiles.length,
      filteredNotifications.length,
    ],
  );

  const { primaryBucketTabs, overflowBucketTabs } = useMemo(() => {
    const allTab = bucketTabs[0]!;
    const activeNonZero = bucketTabs
      .slice(1)
      .filter((tab) => tab.count > 0 || bucket === tab.id);
    const primary = [allTab, ...activeNonZero.slice(0, 5)];
    const primaryIds = new Set(primary.map((tab) => tab.id));
    const overflow = bucketTabs.slice(1).filter((tab) => !primaryIds.has(tab.id));
    return { primaryBucketTabs: primary, overflowBucketTabs: overflow };
  }, [bucketTabs, bucket]);

  const showBridgeWarning = bridgeStatus === 'quarantined' || bridgeStatus === 'offline';

  const showGroupedHeadings = bucket === 'all';

  const renderStreamItem = (item: InboxStreamItem) => {
    const active = selectedItem?.id === item.id;
    if (item.kind === 'decision') {
      const age = item.updatedAt ? formatDurationShort(item.updatedAt) : '';
      return (
        <button
          key={item.id}
          type="button"
          data-testid="inbox-row-decision"
          onClick={() => setSelectedId(item.id)}
          className={cn(
            'flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors',
            active ? 'bg-accent' : 'hover:bg-accent/50',
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-[#1A140F] p-0.5">
            <PixelAgentAvatar seed={item.actorName || 'agent'} status="ACTIVE" size={26} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="shrink-0 px-2 py-0 text-xs tabular-nums">
                {item.projectKey}
              </Badge>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {item.title}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {item.actorName} · {item.contractId}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
            <span className="rounded-full bg-[var(--studio-amber-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--studio-amber)]">
              {isVi ? 'Duyệt' : 'Review'}
            </span>
            {age && <span className="text-xs text-muted-foreground tabular-nums">{age}</span>}
          </div>
        </button>
      );
    }

    if (item.kind === 'comm') {
      const age = item.timestamp ? formatDurationShort(item.timestamp) : '';
      const hasDistinctChannel =
        item.channelName && item.channelName.toLowerCase() !== item.sender.toLowerCase();
      return (
        <button
          key={item.id}
          type="button"
          data-testid="inbox-row-comm"
          onClick={() => setSelectedId(item.id)}
          className={cn(
            'flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors',
            active ? 'bg-accent' : 'hover:bg-accent/50',
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/75 bg-muted/60 text-muted-foreground">
            <MessageSquare className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {item.projectKey && (
                <Badge variant="outline" className="shrink-0 px-2 py-0 text-xs tabular-nums">
                  {item.projectKey}
                </Badge>
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {item.sender}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {item.channel.toUpperCase()}
              {hasDistinctChannel ? ` · ${item.channelName}` : ''} · {item.preview}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
            <div className="flex items-center gap-1">
              {item.guardrail?.status === 'quarantined' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
                  <ShieldAlert className="size-3" />
                  {isVi ? 'Cách ly' : 'Quarantined'}
                </span>
              ) : item.nextStepProposal ? (
                <span className="rounded-full border border-border/70 bg-background/80 px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {proposalActionLabel(item.nextStepProposal.recommendedAction, isVi)}
                </span>
              ) : item.ruleEvaluation?.withinRules ? (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {isVi ? 'Đã tổng hợp' : 'Summarized'}
                </span>
              ) : null}
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold',
                  item.category === 'delivery_alert'
                    ? 'bg-destructive/15 text-destructive'
                    : 'bg-[var(--studio-amber-soft)] text-[var(--studio-amber)]',
                )}
              >
                {commCategoryLabel(item.category, isVi)}
              </span>
            </div>
            {age && <span className="text-xs text-muted-foreground tabular-nums">{age}</span>}
          </div>
        </button>
      );
    }

    if (item.kind === 'queue') {
      const age = item.timestamp ? formatDurationShort(item.timestamp) : '';
      return (
        <button
          key={item.id}
          type="button"
          data-testid="inbox-row-queue"
          onClick={() => setSelectedId(item.id)}
          className={cn(
            'flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors',
            active ? 'bg-accent' : 'hover:bg-accent/50',
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/75 bg-muted/60 text-muted-foreground">
            <ListTodo className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="shrink-0 px-2 py-0 text-xs tabular-nums">
                {item.projectKey}
              </Badge>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {item.title}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {item.taskKey} · {item.status}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                item.category === 'failed_run' || item.category === 'blocked_task'
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-muted px-2 text-foreground',
              )}
            >
              {item.priority}
            </span>
            {age && <span className="text-xs text-muted-foreground tabular-nums">{age}</span>}
          </div>
        </button>
      );
    }

    if (item.kind === 'update') {
      const age = item.timestamp ? formatDurationShort(item.timestamp) : '';
      return (
        <button
          key={item.id}
          type="button"
          data-testid="inbox-row-update"
          onClick={() => setSelectedId(item.id)}
          className={cn(
            'flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors',
            active ? 'bg-accent' : 'hover:bg-accent/50',
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/75 bg-muted/60 text-muted-foreground">
            <Activity className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="shrink-0 px-2 py-0 text-xs tabular-nums">
                {item.projectKey}
              </Badge>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {item.title}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {item.summary}
              {item.actorName ? ` · ${item.actorName}` : ''}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
            <Badge variant="secondary" className="px-2 py-0 text-xs">
              {item.updateKind}
            </Badge>
            {age && <span className="text-xs text-muted-foreground tabular-nums">{age}</span>}
          </div>
        </button>
      );
    }

    if (item.kind === 'contact') {
      return (
        <button
          key={item.id}
          type="button"
          data-testid="inbox-row-contact"
          onClick={() => setSelectedId(item.id)}
          className={cn(
            'flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors',
            active ? 'bg-accent' : 'hover:bg-accent/50',
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/75 bg-muted/60 text-muted-foreground">
            <Users className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="shrink-0 px-2 py-0 text-xs tabular-nums">
                {item.projectKey}
              </Badge>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {item.name}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {item.role || item.raciRole} · {item.externalKey}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 px-2 py-0 text-xs">
            {item.raciRole}
          </Badge>
        </button>
      );
    }

    if (item.kind === 'channel') {
      return (
        <button
          key={item.id}
          type="button"
          data-testid="inbox-row-channel"
          onClick={() => setSelectedId(item.id)}
          className={cn(
            'flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors',
            active ? 'bg-accent' : 'hover:bg-accent/50',
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/75 bg-muted/60 text-muted-foreground">
            <MessageSquare className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="shrink-0 px-2 py-0 text-xs tabular-nums">
                {item.projectKey}
              </Badge>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {item.displayName}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {item.platform.toUpperCase()} · {item.threadType} · {item.targetId}
            </p>
          </div>
          <Badge variant={item.status === 'ACTIVE' ? 'default' : 'secondary'} className="shrink-0 px-2 py-0 text-xs">
            {item.status}
          </Badge>
        </button>
      );
    }

    if (item.kind === 'intake') {
      const age = item.modifiedAt ? formatDurationShort(item.modifiedAt) : '';
      return (
        <button
          key={item.id}
          type="button"
          data-testid="inbox-row-intake"
          onClick={() => setSelectedId(item.id)}
          className={cn(
            'flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors',
            active ? 'bg-accent' : 'hover:bg-accent/50',
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/75 bg-muted/60 text-muted-foreground">
            <FileText className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {item.projectKey && (
                <Badge variant="outline" className="shrink-0 px-2 py-0 text-xs tabular-nums">
                  {item.projectKey}
                </Badge>
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {item.name}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">
              00_INBOX · {item.sizeFormatted}
            </p>
          </div>
          {age && (
            <span className="shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums">
              {age}
            </span>
          )}
        </button>
      );
    }

    if (item.kind === 'handoff') {
      const age = item.timestamp ? formatDurationShort(item.timestamp) : '';
      return (
        <button
          key={item.id}
          type="button"
          data-testid="inbox-row-handoff"
          onClick={() => setSelectedId(item.id)}
          className={cn(
            'flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors',
            active ? 'bg-accent' : 'hover:bg-accent/50',
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-[#1A140F] p-0.5">
            <PixelAgentAvatar
              seed={item.actorName || 'agent'}
              status={item.isLive ? 'WORKING' : 'IDLE'}
              size={26}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {item.projectKey && (
                <Badge variant="outline" className="shrink-0 px-2 py-0 text-xs tabular-nums">
                  {item.projectKey}
                </Badge>
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {item.title}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {item.actorName}
              {item.summary ? ` · ${item.summary}` : ''}
            </p>
          </div>
          {age && (
            <span className="shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums">
              {age}
            </span>
          )}
        </button>
      );
    }

    const n = item.notification;
    return (
      <InboxListItem
        key={item.id}
        notification={n}
        selected={active}
        showProjectBadge={scope === 'all'}
        onSelect={() => handleSelectNotification(n)}
        onToggleRead={(read) => setRead.mutate({ id: n.id, read })}
        onSnooze={(until) => snooze.mutate({ id: n.id, until })}
        onDelete={() => handleDeleteNotification(n)}
      />
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Unified Triage Header Bar */}
      <div
        data-testid="inbox-hitl-bridge-bar"
        className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-card/75 px-4 py-2 text-xs backdrop-blur-xs"
      >
        <div className="flex flex-wrap items-center gap-2">
          <InboxScopePicker
            scope={scope}
            shortProjectKey={shortProjectKey}
            activeProjectFilter={activeProjectFilter}
            otherProjectsCount={portfolioCounts.otherProjects}
            projects={projectFilterChips}
            isVi={isVi}
            onScopeChange={handleScopeChange}
            onSelectProjectFilter={handleSelectProjectFilter}
          />

          <div
            role="tablist"
            aria-label={isVi ? 'Phân loại hộp thư' : 'Inbox streams'}
            data-testid="inbox-bucket-tabs"
            className="inline-flex max-w-full flex-nowrap items-center gap-1 overflow-x-auto rounded-full border border-border/85 bg-muted/65 p-1 scrollbar-none"
          >
            {primaryBucketTabs.map((tab) => {
              const active = bucket === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-testid={`tab-inbox-bucket-${tab.id}`}
                  onClick={() => setBucket(tab.id)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs transition-all',
                    active
                      ? 'bg-foreground font-semibold text-background shadow-xs'
                      : 'font-medium text-muted-foreground hover:bg-background/60 hover:text-foreground',
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    data-testid={tab.id === 'decisions' ? 'inbox-hitl-pending-count' : undefined}
                    className={cn(
                      'inline-flex h-4.5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums',
                      active
                        ? 'bg-background/20 text-background'
                        : tab.id === 'decisions' && tab.count > 0
                          ? 'bg-[var(--studio-amber-soft)] text-[var(--studio-amber)]'
                          : 'border border-border/60 bg-background/80 text-foreground',
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}

            {overflowBucketTabs.length > 0 && (
              <Popover open={moreBucketsOpen} onOpenChange={setMoreBucketsOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    data-testid="btn-inbox-more-buckets"
                    aria-label={isVi ? 'Thêm luồng hộp thư' : 'More inbox streams'}
                    className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
                  >
                    <span>{isVi ? 'Thêm' : 'More'}</span>
                    <ChevronDown className="size-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  data-testid="inbox-more-buckets-popover"
                  className="w-48 space-y-0.5 p-1.5"
                >
                  {overflowBucketTabs.map((tab) => {
                    const active = bucket === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        data-testid={`tab-inbox-bucket-${tab.id}`}
                        onClick={() => {
                          setBucket(tab.id);
                          setMoreBucketsOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors',
                          active
                            ? 'bg-accent font-semibold text-foreground'
                            : 'text-foreground hover:bg-accent/60',
                        )}
                      >
                        <span>{tab.label}</span>
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </PopoverContent>
              </Popover>
            )}
          </div>

          {channelSearchFilter && (
            <button
              type="button"
              onClick={() => setChannelSearchFilter('')}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 text-xs font-medium text-foreground"
            >
              <span>{isVi ? `Lọc: ${channelSearchFilter}` : `Filter: ${channelSearchFilter}`}</span>
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            data-testid="btn-inbox-header-collect"
            disabled={isCollecting}
            title={
              collectionStatus?.lastCollectedAt
                ? `${isVi ? 'Thu thập ngay' : 'Collect now'} · ${formatDurationShort(collectionStatus.lastCollectedAt)}`
                : isVi
                  ? 'Thu thập ngay'
                  : 'Collect now'
            }
            aria-label={isVi ? 'Thu thập ngay' : 'Collect now'}
            onClick={() => void handleCollectNow()}
            className="size-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn('size-3.5', isCollecting && 'animate-spin')} />
          </Button>
        </div>
      </div>

      <InboxSuppressionDrawer
        open={suppressionDrawerOpen}
        mutedChannels={mutedChannels}
        suppressedNoiseCount={suppressedNoiseCount}
        onUnmuteChannel={(channelKey) => {
          void submitInboxTriageAction({
            action: 'unmute_channel',
            itemId: `unmute:${channelKey}`,
            channelKey,
          }).then(() => {
            setMutedChannels((prev) => prev.filter((c) => c.channelKey !== channelKey));
            void refreshStreams();
          });
        }}
        onClose={() => setSuppressionDrawerOpen(false)}
      />

      {showBridgeWarning && (
        <div
          role="status"
          data-testid="inbox-bridge-status-banner"
          className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200"
        >
          <AlertTriangle className="size-3.5 shrink-0 text-amber-400" />
          <span>
            {bridgeStatus === 'quarantined'
              ? isVi
                ? 'Cầu nối hộp thư cục bộ (tin nhắn OmniComm, hàng đợi liên dự án & tệp 00_INBOX) đang bị khóa quyền truy cập trên máy chủ web.'
                : 'Local host bridge streams (OmniComm messages, cross-project queues, and 00_INBOX files) are currently locked on this web server.'
              : isVi
                ? 'Không kết nối được cầu nối hộp thư cục bộ — tin nhắn OmniComm và hàng đợi liên dự án tạm thời chưa thể tải.'
                : 'Local host bridge is offline — OmniComm messages, cross-project queues, and 00_INBOX files are temporarily unavailable.'}
          </span>
        </div>
      )}

      {/* Split-Pane Triage Body */}
      <div className="flex min-h-0 flex-1 bg-background">
        <div
          className={cn(
            'flex w-full min-w-0 flex-col bg-card/55 md:w-[360px] lg:w-[400px] md:border-e md:border-border/80',
            selectedItem && 'hidden md:flex',
          )}
        >
          <InboxToolbar
            count={visibleItems.length}
            groupBy={groupBy}
            onGroupByChange={handleGroupByChange}
            showNotificationControls={bucket === 'all' || bucket === 'mentions'}
            filters={filters}
            onFiltersChange={changeFilters}
            onMarkAllRead={() => markAllRead.mutate()}
            onDeleteRead={() => deleteNotifications.mutate('read')}
            onDeleteReadCompleted={() => deleteNotifications.mutate('read-completed')}
          />

          <div
            data-testid="inbox-unified-list"
            className="min-h-0 flex-1 overflow-y-auto"
          >
            {visibleItems.length === 0 ? (
              <div className="flex h-full items-center justify-center px-6 py-10 text-center text-sm text-muted-foreground">
                {(query.isLoading || isUnifiedLoading)
                  ? isVi
                    ? 'Đang tải hộp thư...'
                    : 'Loading inbox...'
                  : showBridgeWarning
                    ? isVi
                      ? 'Cầu nối hộp thư cục bộ hiện chưa kết nối.'
                      : 'Local bridge streams are currently unavailable.'
                    : isVi
                      ? 'Đã xử lý xong — không còn mục chờ.'
                      : 'All caught up — no pending items.'}
              </div>
            ) : groupBy === 'project' ? (
              <>
                {groupedByProject.map((group) => (
                  <div key={group.key} data-testid={`inbox-project-group-${group.key}`}>
                    <SectionHeading
                      label={`${group.key} — ${group.name}`}
                      count={group.items.length}
                    />
                    {group.items.map((item) => renderStreamItem(item))}
                  </div>
                ))}
              </>
            ) : (
              <>
                {(bucket === 'all' || bucket === 'decisions') && filteredDecisions.length > 0 && (
                  <>
                    {showGroupedHeadings && (
                      <SectionHeading
                        label={isVi ? 'Cần phê duyệt' : 'Needs Decision'}
                        count={filteredDecisions.length}
                      />
                    )}
                    {filteredDecisions.map((item) => renderStreamItem(item))}
                  </>
                )}

                {(bucket === 'all' || bucket === 'updates') && filteredUpdates.length > 0 && (
                  <>
                    {showGroupedHeadings && (
                      <SectionHeading
                        label={isVi ? 'Cập nhật dự án (7 ngày)' : 'Project Updates (7d)'}
                        count={filteredUpdates.length}
                      />
                    )}
                    {filteredUpdates.map((item) => renderStreamItem(item))}
                  </>
                )}

                {bucket === 'contacts' && filteredContacts.length > 0 && (
                  <>{filteredContacts.map((item) => renderStreamItem(item))}</>
                )}

                {bucket === 'channels' && filteredChannels.length > 0 && (
                  <>{filteredChannels.map((item) => renderStreamItem(item))}</>
                )}

                {(bucket === 'all' || bucket === 'comms') && filteredComms.length > 0 && (
                  <>
                    {showGroupedHeadings && (
                      <SectionHeading
                        label={isVi ? 'Tin nhắn liên lạc' : 'OmniComm Messages'}
                        count={filteredComms.length}
                      />
                    )}
                    {filteredComms.map((item) => renderStreamItem(item))}
                  </>
                )}

                {(bucket === 'all' || bucket === 'queue') && filteredQueueTasks.length > 0 && (
                  <>
                    {showGroupedHeadings && (
                      <SectionHeading
                        label={isVi ? 'Hàng đợi liên dự án' : 'Cross-Project Queue'}
                        count={filteredQueueTasks.length}
                      />
                    )}
                    {filteredQueueTasks.map((item) => renderStreamItem(item))}
                  </>
                )}

                {(bucket === 'all' || bucket === 'intake') && filteredIntakeFiles.length > 0 && (
                  <>
                    {showGroupedHeadings && (
                      <SectionHeading
                        label={isVi ? 'Đầu vào 00_INBOX' : 'Workspace Intake'}
                        count={filteredIntakeFiles.length}
                      />
                    )}
                    {filteredIntakeFiles.map((item) => renderStreamItem(item))}
                  </>
                )}

                {(bucket === 'all' || bucket === 'handoffs') && filteredHandoffs.length > 0 && (
                  <>
                    {showGroupedHeadings && (
                      <SectionHeading
                        label={isVi ? 'Bàn giao AI' : 'Agent Handoffs'}
                        count={filteredHandoffs.length}
                      />
                    )}
                    {filteredHandoffs.map((item) => renderStreamItem(item))}
                  </>
                )}

                {(bucket === 'all' || bucket === 'mentions') && filteredNotifications.length > 0 && (
                  <>
                    {showGroupedHeadings && (
                      <SectionHeading
                        label={isVi ? 'Đề cập & Cập nhật' : 'Mentions & Updates'}
                        count={filteredNotifications.length}
                      />
                    )}
                    {filteredNotifications.map((entry) => renderStreamItem(entry))}
                    {query.hasNextPage && (
                      <div ref={sentinelRef} className="p-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={query.isFetchingNextPage}
                          onClick={() => void query.fetchNextPage()}
                          className="h-8 text-xs"
                        >
                          {query.isFetchingNextPage
                            ? isVi
                              ? 'Đang tải thêm...'
                              : 'Loading more...'
                            : isVi
                              ? 'Tải thêm'
                              : 'Load more'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {(suppressedNoiseCount > 0 || mutedChannels.length > 0) && (
            <div className="flex items-center justify-between border-t border-border/60 bg-card/45 px-4 py-1.5 text-xs text-muted-foreground">
              <button
                type="button"
                data-testid="btn-inbox-suppression-drawer"
                onClick={() => setSuppressionDrawerOpen((prev) => !prev)}
                className="truncate underline-offset-2 hover:text-foreground hover:underline"
              >
                {isVi
                  ? `Đã lọc ${suppressedNoiseCount} tin · ${mutedChannels.length} kênh tắt`
                  : `Filtered ${suppressedNoiseCount} msgs · ${mutedChannels.length} muted`}
              </button>
            </div>
          )}
        </div>

        {selectedItem ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="hidden h-9 shrink-0 items-center justify-between border-b border-border/60 bg-card/35 px-4 text-xs text-muted-foreground md:flex">
              <button
                type="button"
                data-testid="btn-inbox-open-digest"
                onClick={() => setSelectedId(null)}
                className="inline-flex h-7 items-center gap-1.5 rounded-full px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                <span>{isVi ? 'Quay về tổng hợp' : 'Digest'}</span>
              </button>
              <kbd
                dir="ltr"
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
              >
                Esc
              </kbd>
            </div>
            {selectedItem.kind === 'decision' ? (
              <InboxDecisionDetail
                item={selectedItem}
                projectKey={projectKey}
                isMobile={isMobile}
                onBack={() => setSelectedId(null)}
                onResolved={handleDecisionResolved}
                reworkInputRef={reworkInputRef}
              />
            ) : selectedItem.kind === 'update' ? (
              <InboxUpdateDetail item={selectedItem} />
            ) : selectedItem.kind === 'contact' || selectedItem.kind === 'channel' ? (
              <InboxDirectoryItemDetail item={selectedItem} />
            ) : selectedItem.kind === 'comm' ? (
              <InboxCommDetail
                item={selectedItem}
                availableProjects={availableProjects}
                isMobile={isMobile}
                onBack={() => setSelectedId(null)}
                onResolved={(itemId) => {
                  const nextId = selectedId === itemId ? getNextSelectionId(itemId) : selectedId;
                  setComms((prev) => prev.filter((x) => x.id !== itemId));
                  setSelectedId(nextId);
                  void refreshStreams();
                }}
                onProjectReassigned={(itemId, nextProjKey) => {
                  setComms((prev) =>
                    prev.map((x) => (x.id === itemId ? { ...x, projectKey: nextProjKey } : x)),
                  );
                  void refreshStreams();
                }}
                onChannelMuted={(itemId) => {
                  const nextId = selectedId === itemId ? getNextSelectionId(itemId) : selectedId;
                  setComms((prev) => prev.filter((x) => x.id !== itemId));
                  setSelectedId(nextId);
                  void refreshStreams();
                }}
                onBoundToDirectory={() => {
                  void refreshStreams();
                }}
                onOpenDirectory={
                  projectKey ? () => navigateFeatureInstant(directoryPath(projectKey)) : undefined
                }
              />
            ) : selectedItem.kind === 'queue' ? (
              <InboxQueueDetail
                item={selectedItem}
                currentProjectRef={projectKey}
                isMobile={isMobile}
                onBack={() => setSelectedId(null)}
                onResolved={(itemId) => {
                  const nextId = selectedId === itemId ? getNextSelectionId(itemId) : selectedId;
                  setQueueTasks((prev) => prev.filter((x) => x.id !== itemId));
                  setSelectedId(nextId);
                  void refreshStreams();
                }}
              />
            ) : selectedItem.kind === 'handoff' ? (
              <InboxHandoffDetail
                item={selectedItem}
                projectKey={projectKey}
                isMobile={isMobile}
                onBack={() => setSelectedId(null)}
                onArchive={handleArchiveHandoff}
              />
            ) : selectedItem.kind === 'intake' ? (
              <InboxIntakeDetail
                item={selectedItem}
                projectKey={projectKey}
                shortProjectKey={shortProjectKey}
                isMobile={isMobile}
                onBack={() => setSelectedId(null)}
                onDispatched={() => {
                  void refreshStreams();
                }}
                onTriaged={() => {
                  const nextId = getNextSelectionId(selectedItem.id);
                  setSelectedId(nextId);
                  void refreshStreams();
                }}
              />
            ) : selectedItem.kind === 'notification' ? (
              selectedItem.notification.projectId === projectId ? (
                <InboxDetail
                  key={selectedItem.notification.issueId}
                  project={project}
                  issueId={selectedItem.notification.issueId}
                  issueSeq={selectedItem.notification.issueSeq}
                  isMobile={isMobile}
                  onBack={() => setSelectedId(null)}
                  onDeleted={() => setSelectedId(null)}
                />
              ) : (
                <InboxCrossProjectDetail
                  notification={selectedItem.notification}
                  currentProjectRef={projectKey}
                  isMobile={isMobile}
                  onBack={() => setSelectedId(null)}
                  onToggleRead={(read) =>
                    setRead.mutate({ id: selectedItem.notification.id, read })
                  }
                  onSnooze={(until) =>
                    snooze.mutate({ id: selectedItem.notification.id, until })
                  }
                  onDelete={() => handleDeleteNotification(selectedItem.notification)}
                />
              )
            ) : null}
          </div>
        ) : (
          <div
            data-testid="inbox-empty-detail-pane"
            className={cn(
              'hidden min-h-0 flex-1 md:flex',
              visibleItems.length > 0 ? 'flex-col' : 'items-center justify-center p-8',
            )}
          >
            {visibleItems.length > 0 ? (
              <InboxDigestPanel
                digest={inboxDigest}
                collectionStatus={collectionStatus}
                visibleItems={visibleItems}
                isCollecting={isCollecting}
                onCollectNow={() => void handleCollectNow()}
                onSelectItem={(itemId) => setSelectedId(itemId)}
              />
            ) : isUnifiedLoading && !showBridgeWarning ? (
              <div
                data-testid="inbox-loading-detail-card"
                className="w-full max-w-md space-y-4 rounded-2xl border border-border/85 bg-card p-8 text-center shadow-[var(--studio-card-shadow)]"
              >
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-border/75 bg-muted/60 text-muted-foreground">
                  <Inbox className="size-5 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-foreground">
                    {isVi ? 'Đang tải các luồng hộp thư...' : 'Loading inbox streams...'}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {isVi
                      ? 'Đang đồng bộ tin nhắn OmniComm, hàng đợi liên dự án và tệp 00_INBOX.'
                      : 'Syncing OmniComm messages, cross-project queues, and 00_INBOX intake files.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md space-y-4 rounded-2xl border border-border/85 bg-card p-8 text-center shadow-[var(--studio-card-shadow)]">
                <div
                  className={cn(
                    'mx-auto flex size-12 items-center justify-center rounded-2xl border border-border/75 bg-muted/60',
                    showBridgeWarning
                      ? 'text-[var(--studio-amber)]'
                      : 'text-[var(--studio-emerald)]',
                  )}
                >
                  {showBridgeWarning ? (
                    <AlertTriangle className="size-5" />
                  ) : (
                    <CheckCircle2 className="size-5" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-foreground">
                    {showBridgeWarning
                      ? bridgeStatus === 'quarantined'
                        ? isVi
                          ? 'Cầu nối hộp thư cục bộ đang bị khóa'
                          : 'Host inbox bridge locked'
                        : isVi
                          ? 'Cầu nối hộp thư cục bộ ngoại tuyến'
                          : 'Host inbox bridge offline'
                      : isVi
                        ? 'Hộp thư sạch — đã xử lý xong'
                        : 'Inbox Zero — all caught up'}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {showBridgeWarning
                      ? isVi
                        ? 'Không thể đọc tin nhắn OmniComm, hàng đợi liên dự án và tệp 00_INBOX từ cầu nối máy chủ cục bộ.'
                        : 'Unable to load OmniComm messages, cross-project queues, and 00_INBOX intake files from the local host bridge.'
                      : isVi
                        ? 'Không có quyết định chờ duyệt, tệp đầu vào mới hoặc đề cập chưa xử lý trong phạm vi này.'
                        : 'No pending decisions, untriaged intake files, or unread updates in this scope.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={!projectKey}
                    onClick={() => {
                      if (projectKey) navigateFeatureInstant(projectPath(projectKey));
                    }}
                    className="h-8 gap-1.5 rounded-full px-3.5 text-xs"
                  >
                    <SquareKanban className="size-3.5" />
                    <span>{isVi ? 'Công việc' : 'Work Items'}</span>
                  </Button>
                  {scope === 'project' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleScopeChange('all')}
                      className="h-8 rounded-full px-3.5 text-xs"
                    >
                      {isVi ? 'Xem toàn danh mục' : 'Switch to All Projects'}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!projectKey}
                    onClick={() => {
                      if (projectKey) navigateFeatureInstant(openOfficePath(projectKey));
                    }}
                    className="h-8 gap-1.5 rounded-full px-3.5 text-xs"
                  >
                    <span>{isVi ? 'Văn phòng mở' : 'Open Office'}</span>
                    <ArrowUpRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
