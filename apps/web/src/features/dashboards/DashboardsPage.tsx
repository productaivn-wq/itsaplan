'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { useShellRoute } from '@/hooks/useShellRoute';
import { useTranslations } from 'next-intl';
import { useShell } from '@/context/shellContext';
import { usePermissions } from '@/hooks/usePermissions';
import { dashboardPath, dashboardsPath, watchedMetricsPath } from '@/utils/paths';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardsQuery } from '@/services/dashboards.service';
import { useWatchedMetricsQuery } from './services/watchedMetrics.service';
import { useDashboardEditor } from './hooks/useDashboardEditor';
import DashboardTabs from './components/DashboardTabs';
import WidgetGrid from './components/WidgetGrid';
import AddWidgetDialog from './components/AddWidgetDialog';
import WatchedMetricsTab from './components/WatchedMetricsTab';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import { revScope } from '@/utils/revScopes';
import { qk } from '@/services/queryKeys';

// The dashboards section: a tab strip of named dashboards over a grid of analytics
// widgets. The active dashboard comes from the route; with none selected the
// built-in Overview stays active even when the project also has saved dashboards.
// Layout edits are local until saved (see useDashboardEditor).
export default function DashboardsPage({
  initialMode,
  routeSegment,
}: {
  initialMode?: 'watched';
  routeSegment?: string | null;
} = {}) {
  const t = useTranslations('dashboards');
  const tCommon = useTranslations('common');
  const { project } = useShell();
  const { can } = usePermissions();
  const params = useParams<{ dashboardId?: string }>();
  const router = useRouter();
  const projectKey = useShellRoute().projectKey ?? '';

  const canRead = can('dashboards', 'read');
  const { data: dashboards, isLoading, isFetching, isSuccess } = useDashboardsQuery(projectKey);
  const watchedQuery = useWatchedMetricsQuery(
    projectKey,
    undefined,
    Boolean(projectKey) && canRead,
  );
  const [editing, setEditing] = useState(false);
  const [createMetricOpen, setCreateMetricOpen] = useState(false);

  const projectId = project?.project.id ?? null;
  useLiveRefresh({
    scope: projectId ? revScope.board(projectId) : null,
    targets: [
      qk.boardIssues(projectKey),
      qk.analyticsForProject(projectKey),
      qk.watchedMetrics(projectKey),
    ],
  });

  useLiveRefresh({
    scope: projectId ? revScope.agents(projectId) : null,
    targets: [
      qk.anyAiAgents,
      qk.analyticsForProject(projectKey),
      qk.watchedMetrics(projectKey),
    ],
  });

  const list = dashboards ?? [];
  const rawSegment = routeSegment !== undefined ? routeSegment : (params.dashboardId ?? null);
  const isWatchedTab = initialMode === 'watched' || rawSegment === 'watched';
  const parsedRouteId = !isWatchedTab && rawSegment ? Number(rawSegment) : null;
  const routeId =
    parsedRouteId != null && Number.isSafeInteger(parsedRouteId) && parsedRouteId > 0
      ? parsedRouteId
      : null;
  const activeDashboardId = routeId;
  const missingDashboard =
    !isWatchedTab &&
    isSuccess &&
    !isFetching &&
    rawSegment != null &&
    (routeId == null || !list.some((dashboard) => dashboard.id === routeId));

  const selectDashboard = (id: number | null) => {
    setEditing(false);
    navigateFeatureInstant(id != null ? dashboardPath(projectKey, id) : dashboardsPath(projectKey));
  };

  const selectWatched = () => {
    setEditing(false);
    navigateFeatureInstant(watchedMetricsPath(projectKey));
  };

  const editor = useDashboardEditor(projectKey, list, activeDashboardId, selectDashboard);

  useEffect(() => {
    if (missingDashboard) router.replace(dashboardsPath(projectKey));
  }, [missingDashboard, projectKey, router]);

  if (!project || isLoading || missingDashboard) {
    return (
      <div className="flex-1 space-y-4 p-6">
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!canRead) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
        {t('noAccess')}
      </div>
    );
  }

  const watchedBreachCount =
    (watchedQuery.data?.summary.warning ?? 0) + (watchedQuery.data?.summary.critical ?? 0);

  // Saving Overview creates a dashboard; saved layouts require edit permission.
  const canEditLayout = editor.isVirtual ? can('dashboards', 'create') : can('dashboards', 'edit');

  function saveLabel() {
    if (editor.saving) return tCommon('saving');
    return editor.isVirtual ? t('saveDashboard') : t('saveChanges');
  }

  function layoutActions() {
    if (isWatchedTab) {
      if (!can('dashboards', 'create')) return undefined;
      return (
        <Button
          type="button"
          size="sm"
          className="rounded-full px-3.5"
          data-testid="add-watched-metric-btn"
          onClick={() => setCreateMetricOpen(true)}
        >
          <Plus className="size-4" />
          {t('watchedMetrics.addMetric')}
        </Button>
      );
    }
    if (!canEditLayout) return undefined;
    if (!editing) {
      return (
        <Button variant="ghost" size="sm" className="rounded-full px-3.5" onClick={() => setEditing(true)}>
          {t('editLayout')}
        </Button>
      );
    }
    return (
      <>
        <AddWidgetDialog onAdd={(type) => editor.addWidget(type)} />
        {editor.dirty ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full px-3.5"
              disabled={editor.saving}
              onClick={() => editor.discard()}
            >
              {t('discard')}
            </Button>
            <Button
              size="sm"
              className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-4"
              disabled={editor.saving}
              onClick={() => void editor.save()}
            >
              {saveLabel()}
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" className="rounded-full px-4" onClick={() => setEditing(false)}>
            {tCommon('done')}
          </Button>
        )}
      </>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DashboardTabs
        dashboards={list}
        activeDashboardId={activeDashboardId}
        isVirtual={editor.isVirtual}
        watchedActive={isWatchedTab}
        watchedBreachCount={watchedBreachCount}
        onSelect={selectDashboard}
        onSelectWatched={selectWatched}
        onNewDashboard={(name) => void editor.createDashboard(name)}
        onRename={(d, name) => void editor.renameDashboard(d, name)}
        onDelete={(d) => void editor.deleteDashboard(d)}
        onReorder={(dragged, target) => editor.reorderDashboards(dragged, target)}
        actions={layoutActions()}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="w-full px-4 py-4 sm:px-6 sm:py-5">
          {isWatchedTab ? (
            <WatchedMetricsTab
              projectKey={projectKey}
              createOpen={createMetricOpen}
              onCreateOpenChange={setCreateMetricOpen}
            />
          ) : (
            <WidgetGrid projectKey={projectKey} project={project} editor={editor} editing={editing} />
          )}
        </div>
      </div>
    </div>
  );
}
