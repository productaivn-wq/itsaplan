import { useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { PaneActiveProvider } from '@/context/paneActiveContext';
import { useDeferredInstantPathname } from '@/hooks/useInstantPathname';
import { HOT_FEATURE_PRELOAD_KEYS, preloadFeatureKey } from '@/utils/featurePreload';
import { projectRefOf } from '@/utils/paths';
import PageSkeleton from '@/components/common/skeleton/PageSkeleton';
import RequireFeature from '@/components/common/permissions/RequireFeature';
import WorkDeliverySubBar, {
  type WorkDeliveryViewKey,
} from '@/components/layout/WorkDeliverySubBar';
import GovernanceSubBar, {
  type GovernanceViewKey,
} from '@/components/layout/GovernanceSubBar';
import WorkItemsPage from '@/features/work-items/WorkItemsPage';

const TimelineView = dynamic(
  () => import('@/features/work-items/components/timeline/TimelineView'),
  { loading: () => <PageSkeleton /> },
);
const InboxPage = dynamic(
  () => import('@/features/inbox/InboxPage'),
  { loading: () => <PageSkeleton /> },
);
const DashboardsPage = dynamic(
  () => import('@/features/dashboards/DashboardsPage'),
  { loading: () => <PageSkeleton /> },
);
const InitiativesPage = dynamic(
  () => import('@/features/initiatives/InitiativesPage'),
  { loading: () => <PageSkeleton /> },
);
const CyclesPage = dynamic(
  () => import('@/features/cycles/CyclesPage'),
  { loading: () => <PageSkeleton /> },
);
const VibeCanvasPage = dynamic(
  () => import('@/features/vibe-canvas/VibeCanvasPage'),
  { loading: () => <PageSkeleton /> },
);
const SettingsSchedulesPage = dynamic(
  () => import('@/features/settings/SettingsSchedulesPage'),
  { loading: () => <PageSkeleton /> },
);
const ProjectAiAgentsSection = dynamic(
  () => import('@/features/teams/components/ai-agents/ProjectAiAgentsSection'),
  { loading: () => <PageSkeleton /> },
);
const MembersPage = dynamic(
  () => import('@/features/members/MembersPage'),
  { loading: () => <PageSkeleton /> },
);
const SecretVaultPage = dynamic(
  () => import('@/app/[teamRef]/(shell)/[projectKey]/vault/page'),
  { loading: () => <PageSkeleton /> },
);
const OpenOfficePage = dynamic(
  () => import('@/app/[teamRef]/(shell)/[projectKey]/open-office/page'),
  { loading: () => <PageSkeleton /> },
);
const ClientWorkspaceView = dynamic(
  () => import('@/features/ai-chat/components/ClientWorkspaceView'),
  { loading: () => <PageSkeleton /> },
);
const McpServerPage = dynamic(
  () => import('@/features/mcp/McpServerPage'),
  { loading: () => <PageSkeleton /> },
);
const ApiDocsPage = dynamic(
  () => import('@/features/api-docs/ApiDocsPage'),
  { loading: () => <PageSkeleton /> },
);
const NotificationPreferencesPage = dynamic(
  () => import('@/features/settings/NotificationPreferencesPage'),
  { loading: () => <PageSkeleton /> },
);
const ProjectDirectoryView = dynamic(
  () => import('@/features/directory/ProjectDirectoryView'),
  { loading: () => <PageSkeleton /> },
);

const safeDecodeSegment = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const INITIATIVE_TABS = ['all', 'planned', 'active', 'completed', 'canceled'];
const CYCLE_VIEWS = ['table', 'timeline'];
const MAX_KEEP_ALIVE_PANES = 6;

type ShellPaneKey =
  | 'board'
  | 'timeline'
  | 'inbox'
  | 'dashboards'
  | 'initiatives'
  | 'cycles'
  | 'vibe-canvas'
  | 'agents/chat'
  | 'agents/schedules'
  | 'agents'
  | 'members'
  | 'directory'
  | 'vault'
  | 'open-office'
  | 'mcp'
  | 'api'
  | 'notifications';

interface ShellPaneDescriptor {
  key: ShellPaneKey;
  baseWorkHref: string;
  routeSegment?: string | null;
  initiativeTab?: string;
  cycleView?: string;
  vibeMode?: 'docs' | 'notes' | 'finder';
  projectRef?: string;
}

function resolveShellPane(segs: string[]): ShellPaneDescriptor | null {
  if (segs.length < 2) return null;
  const baseWorkHref = `/${segs[0]}/${segs[1]}`;

  if (segs.length === 2 || (segs.length === 4 && segs[2] === 'view')) {
    return { key: 'board', baseWorkHref };
  }
  if (segs.length === 3 && segs[2] === 'timeline') {
    return { key: 'timeline', baseWorkHref };
  }
  if (segs.length === 3 && segs[2] === 'inbox') {
    return { key: 'inbox', baseWorkHref };
  }
  if (segs[2] === 'dashboards' && (segs.length === 3 || segs.length === 4)) {
    return { key: 'dashboards', baseWorkHref, routeSegment: segs[3] ?? null };
  }
  if (
    segs[2] === 'initiatives' &&
    (segs.length === 3 || (segs.length === 4 && INITIATIVE_TABS.includes(segs[3]!)))
  ) {
    return { key: 'initiatives', baseWorkHref, initiativeTab: segs[3] || 'active' };
  }
  if (
    segs[2] === 'cycles' &&
    (segs.length === 3 || (segs.length === 4 && CYCLE_VIEWS.includes(segs[3]!)))
  ) {
    return { key: 'cycles', baseWorkHref, cycleView: segs[3] || 'table' };
  }
  if (segs.length === 3 && segs[2] === 'docs') {
    return { key: 'vibe-canvas', baseWorkHref, vibeMode: 'docs' };
  }
  if (segs.length === 3 && segs[2] === 'notes') {
    return { key: 'vibe-canvas', baseWorkHref, vibeMode: 'notes' };
  }
  if (segs.length === 3 && segs[2] === 'vibe') {
    return { key: 'vibe-canvas', baseWorkHref, vibeMode: 'finder' };
  }
  if (segs.length === 4 && segs[2] === 'agents' && segs[3] === 'chat') {
    return {
      key: 'agents/chat',
      baseWorkHref,
      projectRef: projectRefOf(safeDecodeSegment(segs[0]!), safeDecodeSegment(segs[1]!)),
    };
  }
  if (segs.length === 4 && segs[2] === 'agents' && segs[3] === 'schedules') {
    return { key: 'agents/schedules', baseWorkHref };
  }
  if (segs.length === 3 && segs[2] === 'agents') {
    return { key: 'agents', baseWorkHref };
  }
  if (segs.length === 3 && segs[2] === 'members') {
    return { key: 'members', baseWorkHref };
  }
  if (segs.length === 3 && segs[2] === 'directory') {
    return {
      key: 'directory',
      baseWorkHref,
      projectRef: projectRefOf(safeDecodeSegment(segs[0]!), safeDecodeSegment(segs[1]!)),
    };
  }
  if (segs.length === 3 && segs[2] === 'vault') {
    return { key: 'vault', baseWorkHref };
  }
  if (segs.length === 3 && segs[2] === 'open-office') {
    return { key: 'open-office', baseWorkHref };
  }
  if (segs.length === 3 && segs[2] === 'mcp') {
    return { key: 'mcp', baseWorkHref };
  }
  if (segs.length === 3 && segs[2] === 'api') {
    return { key: 'api', baseWorkHref };
  }
  if (segs.length === 3 && segs[2] === 'notifications') {
    return { key: 'notifications', baseWorkHref };
  }

  return null;
}

interface KeepAliveState {
  projectScope: string;
  panes: ShellPaneDescriptor[];
}

export default function ShellBody({
  forbidden,
  hasProject,
  hasError,
  projectsLoaded,
  projectCount,
  children,
}: {
  forbidden: boolean;
  hasProject: boolean;
  hasError: boolean;
  projectsLoaded: boolean;
  projectCount: number;
  children: ReactNode;
}) {
  const t = useTranslations('shell');
  const pathname = useDeferredInstantPathname();
  const segs = pathname.split('/').filter(Boolean);
  const projectScope = segs.length >= 2 ? `${segs[0]}/${segs[1]}` : '';
  const activeDescriptor = hasProject && !forbidden ? resolveShellPane(segs) : null;

  const [keepAlive, setKeepAlive] = useState<KeepAliveState>(() => ({
    projectScope,
    panes: activeDescriptor ? [activeDescriptor] : [],
  }));

  useEffect(() => {
    setKeepAlive((prev) => {
      if (prev.projectScope !== projectScope) {
        return {
          projectScope,
          panes: activeDescriptor ? [activeDescriptor] : [],
        };
      }
      if (!activeDescriptor) return prev;
      const existingIdx = prev.panes.findIndex((p) => p.key === activeDescriptor.key);
      if (existingIdx >= 0) {
        const nextPanes = prev.panes.slice();
        nextPanes.splice(existingIdx, 1);
        nextPanes.push(activeDescriptor);
        return { projectScope, panes: nextPanes };
      }
      const nextPanes = [...prev.panes, activeDescriptor];
      if (nextPanes.length > MAX_KEEP_ALIVE_PANES) {
        const evictIdx = nextPanes.findIndex((p) => p.key !== 'agents/chat');
        if (evictIdx >= 0) nextPanes.splice(evictIdx, 1);
        else nextPanes.shift();
      }
      return { projectScope, panes: nextPanes };
    });
  }, [
    projectScope,
    activeDescriptor?.key,
    activeDescriptor?.routeSegment,
    activeDescriptor?.initiativeTab,
    activeDescriptor?.cycleView,
    activeDescriptor?.vibeMode,
    activeDescriptor?.projectRef,
  ]);

  // Throttled background preloading of the 4 hottest routes after initial settle.
  useEffect(() => {
    if (
      typeof navigator !== 'undefined' &&
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    ) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | undefined;
    let idleId: number | undefined;
    let index = 0;

    const scheduleStep = (delayMs: number) => {
      if (cancelled || index >= HOT_FEATURE_PRELOAD_KEYS.length) return;
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        const runStep = () => {
          if (cancelled || index >= HOT_FEATURE_PRELOAD_KEYS.length) return;
          preloadFeatureKey(HOT_FEATURE_PRELOAD_KEYS[index++]!);
          scheduleStep(1200);
        };
        const win = window as Window & {
          requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        };
        if (typeof win.requestIdleCallback === 'function') {
          idleId = win.requestIdleCallback(runStep, { timeout: 3000 });
        } else {
          runStep();
        }
      }, delayMs);
    };

    scheduleStep(2500);

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      const win = window as Window & { cancelIdleCallback?: (id: number) => void };
      if (idleId !== undefined && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleId);
      }
    };
  }, []);

  if (forbidden) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
        {t('noProjectAccess')}
      </div>
    );
  }
  if (!hasProject) {
    if (hasError)
      return (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
          {t('projectUnavailable')}
        </div>
      );
    if (projectsLoaded && projectCount === 0)
      return (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {t('noProjects')}
        </div>
      );
    return <PageSkeleton />;
  }

  const renderWorkSubBar = (baseWorkHref: string, activeKey: WorkDeliveryViewKey) => (
    <div className="flex min-h-13 shrink-0 items-center justify-between gap-2 border-b border-border/75 bg-card/75 px-3 py-1.5 backdrop-blur-xs sm:px-4">
      <WorkDeliverySubBar baseWorkHref={baseWorkHref} activeKey={activeKey} />
    </div>
  );

  const renderGovSubBar = (baseWorkHref: string, activeKey: GovernanceViewKey) => (
    <div className="flex min-h-13 shrink-0 items-center justify-between gap-2 border-b border-border/75 bg-card/75 px-3 py-1.5 backdrop-blur-xs sm:px-4">
      <GovernanceSubBar baseWorkHref={baseWorkHref} activeKey={activeKey} />
    </div>
  );

  const renderDescriptor = (desc: ShellPaneDescriptor): ReactNode => {
    switch (desc.key) {
      case 'board':
        return (
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            {renderWorkSubBar(desc.baseWorkHref, 'board')}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <WorkItemsPage />
            </div>
          </div>
        );
      case 'timeline':
        return (
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            {renderWorkSubBar(desc.baseWorkHref, 'timeline')}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <TimelineView />
            </div>
          </div>
        );
      case 'inbox':
        return <InboxPage />;
      case 'dashboards':
        return (
          <RequireFeature feature="dashboards">
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
              {renderWorkSubBar(desc.baseWorkHref, 'dashboards')}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <DashboardsPage routeSegment={desc.routeSegment ?? null} />
              </div>
            </div>
          </RequireFeature>
        );
      case 'initiatives':
        return (
          <RequireFeature feature="initiatives">
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
              {renderWorkSubBar(desc.baseWorkHref, 'initiatives')}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <InitiativesPage tab={(desc.initiativeTab as never) || 'active'} />
              </div>
            </div>
          </RequireFeature>
        );
      case 'cycles':
        return (
          <RequireFeature feature="cycles">
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
              {renderWorkSubBar(desc.baseWorkHref, 'cycles')}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <CyclesPage view={(desc.cycleView as never) || 'table'} />
              </div>
            </div>
          </RequireFeature>
        );
      case 'vibe-canvas': {
        const mode = desc.vibeMode ?? 'docs';
        if (mode === 'docs') {
          return (
            <RequireFeature feature="documents">
              <VibeCanvasPage initialMode="docs" />
            </RequireFeature>
          );
        }
        if (mode === 'notes') {
          return (
            <RequireFeature feature="notes">
              <VibeCanvasPage initialMode="notes" />
            </RequireFeature>
          );
        }
        return <VibeCanvasPage initialMode="finder" />;
      }
      case 'agents/chat':
        return (
          <ClientWorkspaceView
            key={desc.projectRef}
            projectKey={desc.projectRef ?? ''}
          />
        );
      case 'agents/schedules':
        return <SettingsSchedulesPage />;
      case 'agents':
        return <ProjectAiAgentsSection />;
      case 'members':
        return (
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            {renderGovSubBar(desc.baseWorkHref, 'members')}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <MembersPage />
            </div>
          </div>
        );
      case 'directory':
        return (
          <ProjectDirectoryView
            key={desc.projectRef}
            projectKey={desc.projectRef ?? ''}
          />
        );
      case 'vault':
        return (
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            {renderGovSubBar(desc.baseWorkHref, 'vault')}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <SecretVaultPage />
            </div>
          </div>
        );
      case 'open-office':
        return (
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            {renderWorkSubBar(desc.baseWorkHref, 'office')}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <OpenOfficePage />
            </div>
          </div>
        );
      case 'mcp':
        return <McpServerPage />;
      case 'api':
        return <ApiDocsPage />;
      case 'notifications':
        return (
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            {renderGovSubBar(desc.baseWorkHref, 'notifications')}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <NotificationPreferencesPage />
            </div>
          </div>
        );
    }
  };

  // Ensure the active pane is rendered immediately even before keepAlive state effect flushes.
  const panesToRender =
    keepAlive.projectScope === projectScope
      ? activeDescriptor && !keepAlive.panes.some((p) => p.key === activeDescriptor.key)
        ? [...keepAlive.panes, activeDescriptor]
        : keepAlive.panes
      : activeDescriptor
        ? [activeDescriptor]
        : [];

  return (
    <>
      {panesToRender.map((entry) => {
        const isActive = activeDescriptor?.key === entry.key;
        const pane = isActive && activeDescriptor ? activeDescriptor : entry;
        return (
          <div
            key={`${projectScope}:${entry.key}`}
            data-keep-alive-pane={entry.key}
            aria-hidden={!isActive}
            className={
              isActive
                ? 'flex h-full min-h-0 flex-1 flex-col overflow-hidden'
                : 'hidden'
            }
          >
            <PaneActiveProvider active={isActive}>
              {renderDescriptor(pane)}
            </PaneActiveProvider>
          </div>
        );
      })}
      {!activeDescriptor && children}
    </>
  );
}
