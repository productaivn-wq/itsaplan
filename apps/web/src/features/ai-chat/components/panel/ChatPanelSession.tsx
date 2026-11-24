'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquareOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AiAgent } from '@/lib/api/endpoints/agents';
import type { ChatExecutionMode } from '@/lib/api/endpoints/agentChat';
import type { ChatMessage, ChatStatus } from '@/hooks/useAgentChat';
import { usePermissions } from '@/hooks/usePermissions';
import { AgentContextSize } from '@/components/common/agent-chat/AgentContextSize';
import { InputGroupButton } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AiChatSessionBadge } from '../shared/AiChatSessionBadge';
import { AiChatThread } from '../shared/AiChatThread';
import { ChatComposerModelPicker } from '../controls/ChatComposerModelPicker';
import { ChatComposerOptionsPopover } from '../controls/ChatComposerOptionsPopover';
import { ChatPanelAgentSwitcher } from './ChatPanelAgentSwitcher';
import { ChatPanelHistory } from './ChatPanelHistory';
import { useShownThread } from '../../hooks/useShownThread';
import { useAgentRunOptions } from '../../hooks/useChatWorkspacePreferences';
import type { ChatSession, ChatSessionState } from '../../hooks/useChatSessions';
import {
  extractArtifactsFromMessages,
  type ActiveChatSnapshot,
  type ChatViewPreferences,
} from '../../types/workspaceControls';

const MODE_CYCLE: ChatExecutionMode[] = ['ask', 'plan', 'build', 'auto'];

// One open session of the chat panel. Every session is mounted, and the ones that are
// not shown are hidden rather than dropped: that is what keeps their transcript and
// their composer, and lets a reply run to the end while another session is on screen.
//
// The thread is keyed by the agent, so picking a different agent for a session starts a
// fresh conversation with it.
export function ChatPanelSession({
  projectKey,
  agents,
  agent,
  session,
  active,
  providerLabel,
  onThreadCreated,
  onStateChange,
  onSelectAgent,
  onSelectThread,
  onThreadDeleted,
  viewPrefs,
  onActiveSnapshotChange,
  onOpenArtifact,
  onClearChat,
  onDraftChange,
}: {
  projectKey: string;
  agents: AiAgent[];
  agent: AiAgent;
  session: ChatSession;
  active: boolean;
  providerLabel: (key: string) => string;
  onThreadCreated: (sessionId: string, threadId: string) => void;
  onStateChange: (sessionId: string, state: ChatSessionState) => void;
  onSelectAgent: (session: ChatSession, agentId: number) => void;
  onSelectThread: (agentId: number, threadId: string) => void;
  onThreadDeleted: (threadId: string) => void;
  viewPrefs?: Partial<ChatViewPreferences>;
  onActiveSnapshotChange?: (snapshot: ActiveChatSnapshot) => void;
  onOpenArtifact?: (artifactId: string) => void;
  onClearChat?: () => void;
  onDraftChange?: (hasDraft: boolean) => void;
}) {
  const handleThreadCreated = useCallback(
    (threadId: string) => onThreadCreated(session.id, threadId),
    [session.id, onThreadCreated],
  );
  const handleStateChange = useCallback(
    (state: ChatSessionState) => onStateChange(session.id, state),
    [session.id, onStateChange],
  );
  const thread = useShownThread(projectKey, agent.id, session.threadId);
  const t = useTranslations('aiChat');
  const { can } = usePermissions();
  const canEditAgent = can('ai_agents', 'edit');
  const { options, updateOptions, resetOptions, hasOverrides } = useAgentRunOptions(
    projectKey,
    agent.id,
  );
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [messagesState, setMessagesState] = useState<{
    messages: ChatMessage[];
    status: ChatStatus;
    activeTool: string | null;
  }>({ messages: [], status: 'ready', activeTool: null });

  const handleMessagesSnapshot = useCallback(
    (next: { messages: ChatMessage[]; status: ChatStatus; activeTool: string | null }) => {
      setMessagesState(next);
    },
    [],
  );

  // Keyboard shortcuts for active session: Alt+M cycles mode, Ctrl/Cmd+Shift+M opens model picker.
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        const curr = options.mode ?? 'build';
        const nextMode = MODE_CYCLE[(MODE_CYCLE.indexOf(curr) + 1) % MODE_CYCLE.length]!;
        updateOptions({
          mode: nextMode,
          permissionMode:
            nextMode === 'plan' || nextMode === 'ask'
              ? 'plan'
              : nextMode === 'auto'
                ? 'auto'
                : 'ask',
        });
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setModelPickerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, options.mode, updateOptions]);

  const snapshotMetrics = useMemo(() => {
    const artifacts = extractArtifactsFromMessages(messagesState.messages);
    let thinkingCount = 0;
    let toolCallCount = 0;
    let subagentCount = 0;
    for (const msg of messagesState.messages) {
      for (const part of msg.parts) {
        if (part.type === 'thinking') thinkingCount += 1;
        else if (part.type === 'tool') toolCallCount += 1;
        else if (part.type === 'subagent') subagentCount += 1;
      }
    }
    return { artifacts, thinkingCount, toolCallCount, subagentCount };
  }, [messagesState.messages]);

  useEffect(() => {
    if (!active || !onActiveSnapshotChange) return;
    onActiveSnapshotChange({
      sessionId: session.id,
      agent,
      threadId: session.threadId,
      cliSessionId: thread?.cliSessionId ?? null,
      contextTokens: thread?.contextTokens,
      runOptions: options,
      messages: messagesState.messages,
      status: messagesState.status,
      activeTool: messagesState.activeTool,
      artifacts: snapshotMetrics.artifacts,
      thinkingCount: snapshotMetrics.thinkingCount,
      toolCallCount: snapshotMetrics.toolCallCount,
      subagentCount: snapshotMetrics.subagentCount,
    });
  }, [
    active,
    onActiveSnapshotChange,
    session.id,
    session.threadId,
    agent,
    thread?.cliSessionId,
    thread?.contextTokens,
    options,
    messagesState,
    snapshotMetrics,
  ]);

  const handleSlashCommandAction = useCallback(
    (cmd: 'model' | 'clear') => {
      if (cmd === 'model') setModelPickerOpen(true);
      else if (cmd === 'clear') onClearChat?.();
    },
    [onClearChat],
  );

  const handleResetMode = useCallback(
    () => updateOptions({ mode: 'build', permissionMode: 'ask' }),
    [updateOptions],
  );

  // An internal agent with memory off stores no thread and no message, so it has no
  // history to list and its conversation ends with the page.
  const keepsHistory = agent.kind === 'external' || agent.memoryEnabled;
  const fallbackCloudAgent =
    agents.find((candidate) => candidate.kind === 'internal' && candidate.id !== agent.id) ?? null;

  return (
    <div className={cn('absolute inset-0', !active && 'hidden')}>
      <AiChatThread
        key={agent.id}
        projectKey={projectKey}
        agent={agent}
        threadId={session.threadId}
        onThreadCreated={handleThreadCreated}
        onStateChange={handleStateChange}
        onSwitchToCloudAgent={
          fallbackCloudAgent ? () => onSelectAgent(session, fallbackCloudAgent.id) : undefined
        }
        runOptions={options}
        viewPrefs={viewPrefs}
        active={active}
        onOpenArtifact={onOpenArtifact}
        onSlashCommandAction={handleSlashCommandAction}
        onResetMode={handleResetMode}
        onMessagesSnapshot={handleMessagesSnapshot}
        draftKey={`aiChat:draft:${projectKey}:${session.id}`}
        onDraftChange={onDraftChange}
        composerStart={
          <>
            <ChatPanelAgentSwitcher
              agents={agents}
              selected={agent}
              providerLabel={providerLabel}
              disabled={session.running}
              onSelect={(agentId) => onSelectAgent(session, agentId)}
              projectKey={projectKey}
              canManageAgents={canEditAgent}
            />
            <ChatComposerModelPicker
              agent={agent}
              options={options}
              onChange={updateOptions}
              canEditAgent={canEditAgent}
              disabled={session.running}
              open={modelPickerOpen}
              onOpenChange={setModelPickerOpen}
            />
            <ChatComposerOptionsPopover
              options={options}
              hasOverrides={hasOverrides}
              onChange={updateOptions}
              onReset={resetOptions}
              disabled={session.running}
              isInternal={agent.kind === 'internal'}
            />
            {keepsHistory ? (
              <ChatPanelHistory
                projectKey={projectKey}
                agentId={agent.id}
                agentName={agent.name}
                selectedThreadId={session.threadId}
                onSelect={(threadId) => onSelectThread(agent.id, threadId)}
                onDeleted={onThreadDeleted}
              />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <InputGroupButton
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="rounded-md text-muted-foreground"
                  >
                    <MessageSquareOff />
                    <span className="sr-only">{t('noHistory')}</span>
                  </InputGroupButton>
                </TooltipTrigger>
                <TooltipContent className="max-w-56">{t('noHistory')}</TooltipContent>
              </Tooltip>
            )}
            {thread?.cliSessionId && <AiChatSessionBadge sessionId={thread.cliSessionId} />}
          </>
        }
        composerEnd={
          viewPrefs?.showTokenMeter !== false &&
          thread?.contextTokens !== undefined && <AgentContextSize tokens={thread.contextTokens} />
        }
      />
    </div>
  );
}
