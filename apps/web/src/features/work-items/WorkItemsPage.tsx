'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import PageSkeleton from '@/components/common/skeleton/PageSkeleton';
import { PaneActiveProvider, useIsPaneActive } from '@/context/paneActiveContext';
import { useShell } from '@/context/shellContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useGroupLabels } from '@/hooks/useGroupLabels';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';
import { buildGroups, groupIssues } from '@/utils/project';
import { countIssuesByColumn } from './utils/wipLimit';
import {
  restoreHiddenSections,
  withoutHiddenSections,
  type ViewSettings,
} from '@/utils/viewSettings';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ViewTabs from '@/components/layout/ViewTabs';
import ViewIconPicker from '@/components/layout/ViewIconPicker';
import FilterBar from '@/components/layout/FilterBar';
import DisplayPopover from '@/components/layout/DisplayPopover';
import { IssueLinksProvider } from './context/useIssueLinks';
import { SubtasksProvider } from './context/useSubtasks';
import SwarmHitlGovernanceBar from './components/SwarmHitlGovernanceBar';
import BoardCustomizeSheet from './components/BoardCustomizeSheet';

const TableView = dynamic(() => import('./components/table/TableView'), {
  loading: () => <PageSkeleton />,
});
const TimelineView = dynamic(() => import('./components/timeline/TimelineView'), {
  loading: () => <PageSkeleton />,
});
const CalendarView = dynamic(() => import('./components/calendar/CalendarView'), {
  loading: () => <PageSkeleton />,
});

interface TimelineCollapseState {
  scope: string;
  groups: Set<string>;
}

// The work items page (the index and /view/:viewId child routes of the Shell).
// It renders the saved-view tabs, the inline edit bar and the selected layout;
// the project data and the view editor come from the Shell through React context.
export default function WorkItemsPage() {
  const t = useTranslations('workItems');
  const tCommon = useTranslations('common');
  const isVi = useLocale().toLowerCase().startsWith('vi');
  const { project, filteredProject, views, editor, customFields, onOpenIssue, onAddIssue } =
    useShell();
  const isParentPaneActive = useIsPaneActive();
  const { can } = usePermissions();
  const groupLabels = useGroupLabels();
  const features = useProjectFeatures();
  const [timelineCollapseState, setTimelineCollapseState] = useState<TimelineCollapseState>({
    scope: '',
    groups: new Set(),
  });
  const [hideStale, setHideStale] = useState(false);

  const projectKey = project?.project.ref ?? '';
  const activeView: 'table' | 'timeline' | 'calendar' =
    editor.view === 'timeline' || editor.view === 'calendar' ? editor.view : 'table';
  const [visitedViewsState, setVisitedViewsState] = useState<{
    projectKey: string;
    views: Array<'table' | 'timeline' | 'calendar'>;
  }>({ projectKey, views: [activeView] });

  useEffect(() => {
    setVisitedViewsState((prev) => {
      if (prev.projectKey !== projectKey) {
        return { projectKey, views: [activeView] };
      }
      if (prev.views.includes(activeView)) return prev;
      return { projectKey, views: [...prev.views, activeView] };
    });
  }, [projectKey, activeView]);

  const viewsToRender = useMemo(() => {
    if (visitedViewsState.projectKey !== projectKey) return [activeView];
    return visitedViewsState.views.includes(activeView)
      ? visitedViewsState.views
      : [...visitedViewsState.views, activeView];
  }, [visitedViewsState, projectKey, activeView]);

  // With an optional section off, its property and grouping are left out of what
  // the layouts and the Display panel work with, and put back on the way out so the
  // stored display keeps them for when the section is on again.
  const settings = useMemo(
    () => withoutHiddenSections(editor.settings, features),
    [editor.settings, features],
  );

  // From the unfiltered project, so a column's WIP limit is measured against every
  // issue in it rather than the ones the active filters leave on screen. Prefer exact
  // server columnTotals when the board response provides them.
  const projectIssues = project?.issues;
  const serverColumnTotals = project?.columnTotals;
  const columnCounts = useMemo(() => {
    if (serverColumnTotals) {
      const map = new Map<number, number>();
      for (const [colId, cnt] of Object.entries(serverColumnTotals)) {
        map.set(Number(colId), cnt);
      }
      return map;
    }
    return projectIssues ? countIssuesByColumn(projectIssues) : new Map<number, number>();
  }, [projectIssues, serverColumnTotals]);

  const visibleTimelineGroupKeys = useMemo(() => {
    if (editor.view !== 'timeline' || !filteredProject) return [];
    const timelineGroups = buildGroups(
      filteredProject,
      settings.group,
      groupLabels,
      editor.effectiveFilters,
    );
    const timelineIssuesByGroup = groupIssues(
      timelineGroups,
      filteredProject.issues,
      settings.group,
    );
    return timelineGroups
      .filter(
        (group) =>
          settings.showEmptyGroups || (timelineIssuesByGroup.get(group.key)?.length ?? 0) > 0,
      )
      .map((group) => group.key);
  }, [
    editor.effectiveFilters,
    editor.view,
    filteredProject,
    groupLabels,
    settings.group,
    settings.showEmptyGroups,
  ]);

  if (!project || !filteredProject) return null;

  // Saving persists the view: editing an existing one is a views edit, a brand-new
  // one is a views create. Filtering/display stay available to everyone (transient,
  // client-side); only persisting is gated.
  const canSaveView = can('views', editor.activeView ? 'edit' : 'create');

  const editorChangeSettings = editor.changeSettings;
  const rawEditorSettings = editor.settings;
  const changeSettings = useCallback(
    (next: ViewSettings) =>
      editorChangeSettings(restoreHiddenSections(next, rawEditorSettings, features)),
    [editorChangeSettings, rawEditorSettings, features],
  );

  const timelineCollapseScope = [
    projectKey,
    editor.activeViewId ?? 'all',
    settings.group,
    settings.subgroup,
    settings.showEmptyGroups,
    settings.timelineCollapseAll,
  ].join(':');
  const initialTimelineCollapsedGroups = useMemo(
    () => (settings.timelineCollapseAll ? new Set(visibleTimelineGroupKeys) : new Set<string>()),
    [settings.timelineCollapseAll, visibleTimelineGroupKeys],
  );
  const collapsedTimelineGroups =
    timelineCollapseState.scope === timelineCollapseScope
      ? timelineCollapseState.groups
      : initialTimelineCollapsedGroups;

  const toggleTimelineGroup = useCallback(
    (groupKey: string) => {
      setTimelineCollapseState((current) => {
        const groups = new Set(
          current.scope === timelineCollapseScope ? current.groups : initialTimelineCollapsedGroups,
        );
        if (groups.has(groupKey)) groups.delete(groupKey);
        else groups.add(groupKey);
        return { scope: timelineCollapseScope, groups };
      });
    },
    [timelineCollapseScope, initialTimelineCollapsedGroups],
  );

  const staleCutoffMs = useMemo(() => Date.now() - 14 * 86_400_000, []);
  const staleCount = useMemo(() => {
    if (!filteredProject) return 0;
    return filteredProject.issues.filter((i) => {
      const ts = i.updatedAt ? new Date(i.updatedAt).getTime() : 0;
      return ts > 0 && ts < staleCutoffMs;
    }).length;
  }, [filteredProject, staleCutoffMs]);

  const activeFilteredProject = useMemo(() => {
    if (!filteredProject || !hideStale) return filteredProject;
    return {
      ...filteredProject,
      issues: filteredProject.issues.filter((i) => {
        const ts = i.updatedAt ? new Date(i.updatedAt).getTime() : Date.now();
        return ts >= staleCutoffMs;
      }),
    };
  }, [filteredProject, hideStale, staleCutoffMs]);

  const viewProps = {
    project: activeFilteredProject ?? filteredProject,
    filters: editor.effectiveFilters,
    columnCounts,
    customFields,
    settings,
    onSettingsChange: changeSettings,
    onOpenIssue,
    onAddIssue,
  };

  function renderView() {
    return (
      <>
        {viewsToRender.map((v) => {
          const isViewActive = activeView === v;
          return (
            <div key={v} className={isViewActive ? 'h-full w-full' : 'hidden'}>
              <PaneActiveProvider active={isParentPaneActive && isViewActive}>
                {v === 'timeline' ? (
                  <TimelineView
                    {...viewProps}
                    collapsedGroups={collapsedTimelineGroups}
                    onToggleGroup={toggleTimelineGroup}
                    viewId={editor.activeViewId}
                  />
                ) : v === 'calendar' ? (
                  <CalendarView {...viewProps} />
                ) : (
                  <TableView
                    {...viewProps}
                    widthScope={editor.activeViewId ? `view:${editor.activeViewId}` : 'all'}
                  />
                )}
              </PaneActiveProvider>
            </div>
          );
        })}
      </>
    );
  }

  const displayProps = {
    view: editor.view,
    onViewChange: editor.changeView,
    settings,
    onSettingsChange: changeSettings,
    customFields,
    issueTypes: project.issueTypes,
  };

  return (
    <>
      <ViewTabs
        views={views}
        projectKey={project.project.ref}
        activeViewId={editor.activeViewId}
        onSelect={editor.selectView}
        onNewView={editor.beginNewView}
        onEdit={editor.beginEditView}
        onDelete={(v) => void editor.deleteView(v)}
        onReorder={editor.reorderView}
        onToggleFilter={editor.toggleFilters}
        displayControl={
          <div className="flex items-center gap-1.5">
            {can('work_items', 'create') && (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-8 gap-1.5 rounded-full px-3 text-xs font-medium"
                data-testid="btn-board-new-issue"
                onClick={() => onAddIssue({})}
              >
                <Plus className="size-3.5" />
                <span>{t('newIssue')}</span>
              </Button>
            )}
            {staleCount > 0 && (
              <Button
                type="button"
                variant={hideStale ? 'secondary' : 'outline'}
                size="sm"
                className="h-8 gap-1.5 rounded-full px-3 text-xs"
                data-testid="btn-toggle-hide-stale"
                onClick={() => setHideStale((v) => !v)}
              >
                {hideStale
                  ? isVi
                    ? `Chỉ việc mới (đã ẩn ${staleCount})`
                    : `Active only (${staleCount} folded)`
                  : isVi
                    ? `Ẩn việc cũ (${staleCount})`
                    : `Hide stale (${staleCount})`}
              </Button>
            )}
            <DisplayPopover {...displayProps} />
            <BoardCustomizeSheet project={project} />
          </div>
        }
      />
      {/* UNIFIED_WORK_ITEMS_SWARM_DEDUP_362: Routes AOP Swarm tasks & Tier 2 HITL Governance sign-offs into Hạng mục công việc. */}
      <SwarmHitlGovernanceBar
        projectKey={project.project.ref}
        columns={project.columns}
        issues={project.issues}
      />
      {project.truncated && project.totalCount != null && (
        <div
          data-testid="board-truncation-notice"
          className="flex flex-wrap items-center gap-2 border-b border-border/70 bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground"
        >
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full bg-[var(--studio-emerald)]"
          />
          <span className="tabular-nums">
            {isVi
              ? `Đang hiển thị ${project.issues.length.toLocaleString()} / ${project.totalCount.toLocaleString()} công việc đang mở`
              : `Showing ${project.issues.length.toLocaleString()} of ${project.totalCount.toLocaleString()} active items`}
          </span>
        </div>
      )}

      {/* The filter row applies to the current screen only; it never writes to a
          view. The edit bar above it (icon picker + name input + Cancel/Save)
          appears only after Edit view or New view, and Save is the one write:
          it updates the active view or creates one from the live state. */}
      {(editor.editing || editor.showFilters) && (
        <div className="border-b">
          {editor.editing && (
            <div className="flex items-center gap-2 px-3 py-2">
              <ViewIconPicker icon={editor.draftIcon} onChange={editor.setDraftIcon} />
              <Input
                value={editor.draftName}
                placeholder={t('viewNamePlaceholder')}
                autoFocus
                onChange={(e) => editor.setDraftName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  (editor.activeView || editor.draftName.trim()) &&
                  void editor.saveEdits()
                }
                className="h-8 flex-1 border-0 bg-transparent px-1 text-sm font-medium shadow-none focus-visible:ring-0"
              />
              <Button variant="ghost" size="sm" onClick={editor.cancelEdits}>
                {tCommon('cancel')}
              </Button>
              {canSaveView && (
                <Button
                  size="sm"
                  disabled={!editor.activeView && !editor.draftName.trim()}
                  onClick={() => void editor.saveEdits()}
                >
                  {tCommon('save')}
                </Button>
              )}
            </div>
          )}
          <div className={cn('px-3 pb-2', editor.editing ? '' : 'pt-2')}>
            <FilterBar
              filters={editor.filters}
              onChange={editor.changeFilters}
              project={project}
              customFields={customFields}
            />
          </div>
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden bg-background p-3 sm:p-4">
        <IssueLinksProvider issues={project.issues} enabled={settings.showLinks}>
          <SubtasksProvider
            issues={project.issues}
            enabled={settings.showSubtasks}
            collapsed={settings.collapseSubtasks}
          >
            {renderView()}
          </SubtasksProvider>
        </IssueLinksProvider>
      </div>
    </>
  );
}
