'use client';

import { memo, useCallback, useContext, useEffect, useRef } from 'react';
import { RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ShellCtx } from '@/context/shellContext';
import type { Project } from '@/lib/api/endpoints/projects';
import { useProjectAgents } from '@/hooks/useProjectAgents';
import { useEnsureDefaultWorkspaceAgent } from '@/services/aiAgents.service';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/page/EmptyState';
import { AiChatThreadSkeleton } from '../shared/AiChatThreadSkeleton';
import { WorkspaceSessionsRail } from '../workspace/WorkspaceSessionsRail';
import { ChatPanelEmpty } from './ChatPanelEmpty';
import { ChatPanelSession } from './ChatPanelSession';
import { ChatPanelTabs } from './ChatPanelTabs';
import { useChatSessions, type ChatSession } from '../../hooks/useChatSessions';
import { useProviderLabel } from '../../hooks/useProviderLabel';
import type { ActiveChatSnapshot, ChatViewPreferences } from '../../types/workspaceControls';

// What the chat panel holds under its header: the open sessions and the tab row over
// them. Memoised because resizing the panel re-renders it on every pointer move, and a
// render here reaches every transcript.
export const ChatPanelBody = memo(function ChatPanelBody({
  projectKey,
  projects,
  onSelectProject,
  onNewProject,
  newChatAgentId,
  onNewChatHandled,
  viewPrefs,
  showSessionsRail = false,
  onCloseSessionsRail,
  onActiveSnapshotChange,
  onOpenArtifact,
}: {
  projectKey: string;
  projects?: Project[];
  onSelectProject?: (ref: string) => void;
  onNewProject?: () => void;
  newChatAgentId: number | null;
  onNewChatHandled: () => void;
  viewPrefs?: Partial<ChatViewPreferences>;
  showSessionsRail?: boolean;
  onCloseSessionsRail?: () => void;
  onActiveSnapshotChange?: (snapshot: ActiveChatSnapshot | null) => void;
  onOpenArtifact?: (artifactId: string) => void;
}) {
  const t = useTranslations('aiChat');
  const project = useContext(ShellCtx)?.project?.project ?? null;
  const agentsQuery = useProjectAgents();
  const agents = agentsQuery.data ?? [];
  const defaultAgentId = agents.find((a) => a.kind === 'internal')?.id ?? agents[0]?.id ?? null;
  const ensureDefaultMutation = useEnsureDefaultWorkspaceAgent(
    projectKey,
    project?.teamId ?? null,
    project?.id,
  );
  const attemptedEnsureRef = useRef<string | null>(null);
  const providerLabel = useProviderLabel();
  const {
    sessions,
    active,
    setActive,
    markInteracted,
    newTab,
    openTab,
    openThread,
    closeSession,
    moveTab,
    swapTabs,
    setThread,
    setAgent,
    setState,
  } = useChatSessions(projectKey, defaultAgentId);

  // A page asked for a chat with one agent: it opens as a tab of its own, so whatever
  // is already open stays.
  useEffect(() => {
    if (newChatAgentId == null) return;
    openTab(newChatAgentId);
    onNewChatHandled();
  }, [newChatAgentId, openTab, onNewChatHandled]);

  useEffect(() => {
    if (agentsQuery.isLoading || agents.length === 0) {
      onActiveSnapshotChange?.(null);
    }
  }, [agentsQuery.isLoading, agents.length, onActiveSnapshotChange]);

  // A session that has said nothing changes its agent in place; one with a transcript
  // keeps it, and the other agent is chatted with in a tab of its own.
  const selectAgent = (session: ChatSession, agentId: number) => {
    if (agentId === session.agentId) return;
    if (session.hasMessages) openTab(agentId);
    else setAgent(session.id, agentId);
  };

  // A conversation that is deleted from the history cannot be shown any more.
  const handleThreadDeleted = (threadId: string) => {
    const session = sessions.find((candidate) => candidate.threadId === threadId);
    if (session) closeSession(session.id);
  };

  const handleClearChat = useCallback(() => {
    if (active && sessions.length === 1 && !active.threadId) return;
    if (active && sessions.length === 1) closeSession(active.id);
    else newTab();
  }, [active, sessions.length, closeSession, newTab]);

  useEffect(() => {
    if (
      !projectKey ||
      !project ||
      agentsQuery.isLoading ||
      agentsQuery.isError ||
      agents.length > 0 ||
      ensureDefaultMutation.isPending ||
      attemptedEnsureRef.current === projectKey
    ) {
      return;
    }
    attemptedEnsureRef.current = projectKey;
    ensureDefaultMutation.mutate();
  }, [
    projectKey,
    project,
    agentsQuery.isLoading,
    agentsQuery.isError,
    agents.length,
    ensureDefaultMutation,
  ]);

  // Recover stale persisted session tabs whose agent was detached or deleted so the
  // workspace never renders a blank canvas.
  useEffect(() => {
    if (defaultAgentId == null || agents.length === 0 || sessions.length === 0) return;
    const validIds = new Set(agents.map((a) => a.id));
    for (const session of sessions) {
      if (!validIds.has(session.agentId) && !session.running) {
        setAgent(session.id, defaultAgentId);
      }
    }
  }, [agents, sessions, defaultAgentId, setAgent]);

  const handleDraftChange = useCallback(
    (hasDraft: boolean) => {
      if (hasDraft) markInteracted();
    },
    [markInteracted],
  );

  if (agentsQuery.isLoading && agents.length === 0) {
    return (
      <div className="min-h-0 flex-1">
        <AiChatThreadSkeleton />
      </div>
    );
  }

  if (agentsQuery.isError && agents.length === 0) {
    const errorMsg =
      agentsQuery.error instanceof Error ? agentsQuery.error.message : t('loadErrorDescription');
    return (
      <div data-testid="ai-chat-load-error" className="flex h-full min-h-0 flex-1 flex-col">
        <EmptyState
          title={t('loadErrorTitle')}
          description={errorMsg}
        >
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => void agentsQuery.refetch()}
          >
            <RotateCw className="size-3.5" />
            <span>{t('retry')}</span>
          </Button>
        </EmptyState>
      </div>
    );
  }

  if (agents.length === 0) {
    if (ensureDefaultMutation.isError) {
      const provisionMsg =
        ensureDefaultMutation.error instanceof Error
          ? ensureDefaultMutation.error.message
          : t('emptyDescription');
      return (
        <div className="min-h-0 flex-1">
          <ChatPanelEmpty
            projectKey={projectKey}
            errorMessage={provisionMsg}
            onRetry={() => {
              attemptedEnsureRef.current = null;
              ensureDefaultMutation.reset();
              ensureDefaultMutation.mutate();
            }}
          />
        </div>
      );
    }
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <AiChatThreadSkeleton />
        <p className="px-4 pb-3 text-center text-xs text-muted-foreground">
          {t('loadingWorkspace')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <WorkspaceSessionsRail
        projectKey={projectKey}
        projects={projects}
        onSelectProject={onSelectProject}
        onNewProject={onNewProject}
        agents={agents}
        sessions={sessions}
        activeSession={active}
        open={showSessionsRail}
        onClose={() => onCloseSessionsRail?.()}
        onSelectSession={setActive}
        onNewTab={newTab}
        onSelectThread={openThread}
        onThreadDeleted={handleThreadDeleted}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ChatPanelTabs
          projectKey={projectKey}
          sessions={sessions}
          activeId={active?.id ?? null}
          onSelect={setActive}
          onClose={closeSession}
          onNewTab={newTab}
          onMoveTab={moveTab}
          onSwapTabs={swapTabs}
        />

        <div className="relative min-h-0 flex-1">
          {sessions.map((session) => {
            const agent = agents.find((candidate) => candidate.id === session.agentId);
            if (!agent) return null;
            return (
              <ChatPanelSession
                key={session.id}
                projectKey={projectKey}
                agents={agents}
                agent={agent}
                session={session}
                active={session.id === active?.id}
                providerLabel={providerLabel}
                onThreadCreated={setThread}
                onStateChange={setState}
                onSelectAgent={selectAgent}
                onSelectThread={openThread}
                onThreadDeleted={handleThreadDeleted}
                viewPrefs={viewPrefs}
                onActiveSnapshotChange={onActiveSnapshotChange}
                onOpenArtifact={onOpenArtifact}
                onClearChat={handleClearChat}
                onDraftChange={handleDraftChange}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});
