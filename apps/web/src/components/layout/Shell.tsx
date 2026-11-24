'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { useInitiativeOptionsQuery } from '@/services/initiatives.service';
import { useIssueBySeqQuery } from '@/services/issues.service';
import { useTeamsQuery } from '@/services/teams.service';
import { useAccountPreferences } from '@/services/preferences.service';
import type { IssueOpenMode } from '@/lib/api/endpoints/userPreferences';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOverlays } from '@/hooks/useOverlays';
import { usePermissions } from '@/hooks/usePermissions';
import { useShellProject } from '@/hooks/useShellProject';
import { useShellRoute } from '@/hooks/useShellRoute';
import { useProjectRouteSync } from '@/hooks/useProjectRouteSync';
import { projectPath, issuePath } from '@/utils/paths';
import { defaultsFromFilters, type NewIssueDefaults } from '@/utils/project';
import { IssueRefsProvider } from '@/context/issueRefs';
import { ShellCtx, type ShellContext } from '@/context/shellContext';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import CommandLayer from '@/components/layout/CommandLayer';
import ShellBody from '@/components/layout/ShellBody';
import ShellHeaderTitle from '@/components/layout/ShellHeaderTitle';
import ShellOverlays from '@/components/layout/ShellOverlays';
import { ChatPanel } from '@/features/ai-chat/components/panel/ChatPanel';
import { useChatPanel } from '@/features/ai-chat/hooks/useChatPanel';
import { useTranslations } from 'next-intl';

const MemoAppSidebar = memo(AppSidebar);
const MemoAppHeader = memo(AppHeader);
const MemoChatPanel = memo(ChatPanel);
const MemoShellOverlays = memo(ShellOverlays);

// The layout for /:team/:projectKey and its children (the work items view and the
// settings pages). It owns the project data, the view editor and the
// project-level overlays, renders the sidebar + header chrome, and passes the
// project state to the active child through React context (see lib/shellContext).
export default function Shell({
  children,
  defaultSidebarOpen = true,
}: {
  children: ReactNode;
  defaultSidebarOpen?: boolean;
}) {
  const t = useTranslations('nav');
  const tShell = useTranslations('shell');
  const router = useRouter();
  const searchParams = useSearchParams();
  const route = useShellRoute();
  const { projectKey, routeIssueSeq } = route;
  const onAiWorkspace = route.sub === 'agents' && route.aiTeamSection === 'chat';
  const onInboxRoute = route.sub === 'inbox';
  const [preferredSidebarOpen, setPreferredSidebarOpen] = useState(defaultSidebarOpen);
  const [inboxSidebarOverride, setInboxSidebarOverride] = useState<boolean | null>(null);

  useEffect(() => {
    if (!onInboxRoute) {
      setInboxSidebarOverride(null);
    }
  }, [onInboxRoute]);

  const sidebarOpen = onInboxRoute ? (inboxSidebarOverride ?? false) : preferredSidebarOpen;
  const handleSidebarOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (onInboxRoute) {
        setInboxSidebarOverride(nextOpen);
      } else {
        setPreferredSidebarOpen(nextOpen);
      }
    },
    [onInboxRoute],
  );

  const {
    projects,
    projectsLoaded,
    project,
    filteredProject,
    views,
    editor,
    customFields,
    canCreateIssue,
    errorMsg,
    forbidden,
  } = useShellProject(projectKey, route.activeViewId, route.onBoard);
  const teamId = project?.project.teamId;
  const issueRefs = useMemo(
    () => projects.filter((item) => item.teamId === teamId).map((item) => item.ref),
    [projects, teamId],
  );

  const initiativeOptions = useInitiativeOptionsQuery(route.onBoard ? projectKey : null).data ?? [];
  const { issueOpenMode, showChatByDefault } = useAccountPreferences();
  const overlays = useOverlays();
  const chatPanel = useChatPanel(projectKey, showChatByDefault);
  // The agent a page asked to chat with, held until the panel has opened its tab.
  const [chatAgentId, setChatAgentId] = useState<number | null>(null);
  // The Shell renders the context provider, so its own permission check reads the
  // project it loaded rather than the context.
  const { can } = usePermissions(project);
  const chatAvailable = !!projectKey && can('ai_agents', 'read');
  const canCreateInitiative = !!project?.project.initiativesEnabled && can('initiatives', 'create');
  const issueQuery = useIssueBySeqQuery(projectKey, routeIssueSeq);
  // A project is created in a team by its owner or manager: the current project's team
  // when the user ranks so there, otherwise the first team they do.
  const managedTeams = (useTeamsQuery().data ?? []).filter((one) => one.role !== 'member');
  const newProjectTeamId = (managedTeams.find((one) => one.id === teamId) ?? managedTeams[0])?.id;
  const openNewProject = newProjectTeamId != null ? () => overlays.setShowNewProject(true) : null;

  useProjectRouteSync({ projects, projectsLoaded, projectKey });

  // Only the work items routes: a cycle or an initiative board carries its own
  // filters and merges them itself.
  const filterDefaults = route.onBoard
    ? defaultsFromFilters(editor.effectiveFilters, {
        cycles: project?.plannedCycles ?? [],
        initiatives: initiativeOptions,
      })
    : {};
  const filterDefaultsRef = useRef(filterDefaults);
  filterDefaultsRef.current = filterDefaults;
  const { setNewIssueDefaults, setOpenIssueId } = overlays;

  const addIssue = useCallback(
    (defaults: NewIssueDefaults) => {
      setNewIssueDefaults({ ...filterDefaultsRef.current, ...defaults });
    },
    [setNewIssueDefaults],
  );

  const openNewIssue = useCallback(() => addIssue({}), [addIssue]);

  // The issue the palette builds its issue commands for: the open detail panel
  // takes precedence over the issue page behind it.
  const currentIssueId = overlays.openIssueId ?? issueQuery.data?.id ?? null;
  // After deleting or archiving from the palette: close the panel, or leave the
  // issue page it was run from.
  const onIssueDeleted = () => {
    if (overlays.openIssueId != null) overlays.setOpenIssueId(null);
    else if (projectKey && routeIssueSeq != null) router.push(projectPath(projectKey));
  };

  useKeyboardShortcuts({
    hasProject: !!project,
    hasChat: chatAvailable && !onAiWorkspace,
    overlayOpen: overlays.anyOpen,
    onToggleCommand: () => overlays.setShowCommand((v) => !v),
    onChangeView: editor.changeView,
    onNewIssue: () => canCreateIssue && openNewIssue(),
    onNewInitiative: () => canCreateInitiative && overlays.setShowNewInitiative(true),
    onNewProject: () => openNewProject?.(),
    onSettings: () => {},
    onToggleChat: chatPanel.toggle,
  });

  // Every view opens an issue through this one callback, so the user's choice
  // between the side panel and a full page is applied here rather than at each call
  // site. `mode` overrides that choice for a call site that means one of them (the
  // context menu's Preview / Go to issue). The views pass the internal issue id
  // while the URL addresses an issue by its project-scoped number, so the page route
  // resolves the number first and falls back to the panel when the issue is not on
  // the loaded board.
  const projectRef = useRef(project);
  projectRef.current = project;
  const projectKeyRef = useRef(projectKey);
  projectKeyRef.current = projectKey;
  const issueOpenModeRef = useRef(issueOpenMode);
  issueOpenModeRef.current = issueOpenMode;
  const openIssueIdRef = useRef(overlays.openIssueId);
  openIssueIdRef.current = overlays.openIssueId;

  const openIssue = useCallback(
    (id: number, mode?: IssueOpenMode) => {
      const resolvedMode = mode ?? issueOpenModeRef.current;
      const activeProject = projectRef.current;
      const activeProjectKey = projectKeyRef.current;
      const seq = activeProject?.issues.find((i) => i.id === id)?.sequenceNumber;
      if (resolvedMode === 'page' && activeProjectKey) {
        if (seq != null) {
          router.push(issuePath(activeProjectKey, seq));
          return;
        }
      }
      // The issue the panel already shows closes it, so the card that opened the panel
      // is the one that puts it away. Synchronize ?issue=<SEQ> in the URL (IAD-ITSAPLAN §2.2).
      const nextOpenId = openIssueIdRef.current === id ? null : id;
      setOpenIssueId(nextOpenId);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (nextOpenId != null && seq != null) {
          url.searchParams.set('issue', String(seq));
        } else {
          url.searchParams.delete('issue');
        }
        window.history.replaceState(window.history.state, '', url.toString());
      }
    },
    [router, setOpenIssueId],
  );

  const { openIssueId, setShowCommand, setShowNewInitiative } = overlays;
  useEffect(() => {
    const rawSeq = searchParams.get('issue');
    if (!rawSeq || !project || openIssueId != null) return;
    const seqNum = Number(rawSeq);
    if (!Number.isFinite(seqNum)) return;
    const matched = project.issues.find((i) => i.sequenceNumber === seqNum);
    if (matched) setOpenIssueId(matched.id);
  }, [searchParams, project, openIssueId, setOpenIssueId]);

  const { openPanel: openChatPanel } = chatPanel;

  const onChatWithAgent = useCallback(
    (agentId: number) => {
      setChatAgentId(agentId);
      openChatPanel();
    },
    [openChatPanel],
  );

  const onOpenWeKnoraChat = useCallback(
    (subTab: 'chat' | 'memory' = 'chat') => {
      openChatPanel();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('itsaplan:open-weknora-chat', { detail: { subTab } }),
        );
      }
    },
    [openChatPanel],
  );

  const selectProject = useCallback(
    (key: string) => navigateFeatureInstant(projectPath(key)),
    [],
  );

  const openCommand = useCallback(() => setShowCommand(true), [setShowCommand]);
  const noopToggleChat = useCallback(() => {}, []);
  const handleNewChatHandled = useCallback(() => setChatAgentId(null), []);
  const handleSelectAll = useCallback(() => window.dispatchEvent(new Event('board:select-all')), []);
  const handleNewInitiative = useCallback(() => setShowNewInitiative(true), [setShowNewInitiative]);
  const handleOpenIssueBySeq = useCallback(
    (seq: number) => {
      if (projectKey) router.push(issuePath(projectKey, seq));
    },
    [projectKey, router],
  );
  const headerTitle = useMemo(
    () => (
      <ShellHeaderTitle
        route={route}
        projectName={project?.project.name ?? t('project')}
        issueIdentifier={issueQuery.data?.identifier ?? null}
        issueParent={issueQuery.data?.parent ?? null}
      />
    ),
    [route, project?.project.name, t, issueQuery.data?.identifier, issueQuery.data?.parent],
  );

  const context = useMemo<ShellContext>(
    () => ({
      project,
      filteredProject,
      views,
      editor,
      customFields,
      onOpenIssue: openIssue,
      onAddIssue: addIssue,
      onChatWithAgent,
      onOpenWeKnoraChat,
    }),
    [
      project,
      filteredProject,
      views,
      editor,
      customFields,
      openIssue,
      addIssue,
      onChatWithAgent,
      onOpenWeKnoraChat,
    ],
  );

  return (
    <ShellCtx.Provider value={context}>
      <SidebarProvider
        defaultOpen={defaultSidebarOpen}
        open={sidebarOpen}
        onOpenChange={handleSidebarOpenChange}
        className="h-svh overflow-hidden"
      >
        <MemoAppSidebar
          projects={projects}
          currentProjectKey={projectKey}
          onSelectProject={selectProject}
        />
        <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
          <MemoAppHeader
            title={headerTitle}
            hasProject={!!project}
            onOpenCommand={openCommand}
            chatActive={onAiWorkspace || chatPanel.open}
            onToggleChat={onAiWorkspace ? noopToggleChat : chatPanel.toggle}
          />

          {errorMsg && !forbidden && (
            <div className="border-b border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {errorMsg === 'Failed to fetch' ? tShell('networkUnavailable') : errorMsg}
            </div>
          )}

          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <ShellBody
                forbidden={forbidden}
                hasProject={!!project}
                hasError={!!errorMsg}
                projectsLoaded={projectsLoaded}
                projectCount={projects.length}
              >
                <IssueRefsProvider refs={issueRefs}>{children}</IssueRefsProvider>
              </ShellBody>
            </div>

            {chatAvailable && projectKey && !onAiWorkspace && (
              <MemoChatPanel
                projectKey={projectKey}
                open={chatPanel.open}
                mode={chatPanel.mode}
                fullscreen={chatPanel.fullscreen}
                onToggleMode={chatPanel.toggleMode}
                onToggleFullscreen={chatPanel.toggleFullscreen}
                onClose={chatPanel.toggle}
                onOpenPanel={chatPanel.openPanel}
                newChatAgentId={chatAgentId}
                onNewChatHandled={handleNewChatHandled}
              />
            )}
          </div>
        </SidebarInset>

        <CommandLayer
          open={overlays.showCommand}
          onOpenChange={overlays.setShowCommand}
          projects={projects}
          currentProjectKey={projectKey}
          onBoard={route.onBoard}
          view={editor.view}
          currentIssueId={currentIssueId}
          onViewChange={editor.changeView}
          onNewIssue={openNewIssue}
          // Handled by the kanban board's selection provider (mounted only on the
          // board); the constant matches BOARD_SELECT_ALL_EVENT in useSelection.
          onSelectAll={handleSelectAll}
          onNewInitiative={handleNewInitiative}
          onNewProject={openNewProject}
          onSelectProject={selectProject}
          onOpenIssue={handleOpenIssueBySeq}
          onIssueDeleted={onIssueDeleted}
          onToggleChat={chatPanel.toggle}
        />

        <IssueRefsProvider refs={issueRefs}>
          <MemoShellOverlays
            project={project}
            projectKey={projectKey}
            newProjectTeamId={newProjectTeamId}
            onAiWorkspace={onAiWorkspace}
            overlays={overlays}
          />
        </IssueRefsProvider>
      </SidebarProvider>
    </ShellCtx.Provider>
  );
}
