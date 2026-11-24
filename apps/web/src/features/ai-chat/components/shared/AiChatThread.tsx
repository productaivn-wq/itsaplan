'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { decideProjectApproval, type AiAgent } from '@/lib/api/endpoints/agents';
import type { ChatRunOptions } from '@/lib/api/endpoints/agentChat';
import { useAgentChat, type ChatMessage, type ChatStatus } from '@/hooks/useAgentChat';
import { useAgentThreadMessagesQuery } from '@/services/aiAgents.service';
import { qk } from '@/services/queryKeys';
import { AgentChatPanel } from '@/components/common/agent-chat/AgentChatPanel';
import type { ChatViewPreferences } from '../../types/workspaceControls';
import { AiChatThreadSkeleton } from './AiChatThreadSkeleton';

export function AiChatThread({
  projectKey,
  agent,
  threadId,
  onThreadCreated,
  onStateChange,
  onSwitchToCloudAgent,
  composerStart,
  composerEnd,
  runOptions,
  viewPrefs,
  active = false,
  onOpenArtifact,
  onSlashCommandAction,
  onResetMode,
  onMessagesSnapshot,
  draftKey,
  onDraftChange,
}: {
  projectKey: string;
  agent: AiAgent;
  threadId: string | null;
  onThreadCreated: (threadId: string) => void;
  onStateChange?: (state: { running: boolean; hasMessages: boolean }) => void;
  onSwitchToCloudAgent?: () => void;
  composerStart?: ReactNode;
  composerEnd?: ReactNode;
  runOptions?: ChatRunOptions;
  viewPrefs?: Partial<ChatViewPreferences>;
  active?: boolean;
  onOpenArtifact?: (artifactId: string) => void;
  onSlashCommandAction?: (cmd: 'model' | 'clear') => void;
  onResetMode?: () => void;
  onMessagesSnapshot?: (snapshot: {
    messages: ChatMessage[];
    status: ChatStatus;
    activeTool: string | null;
  }) => void;
  draftKey?: string;
  onDraftChange?: (hasDraft: boolean) => void;
}) {
  const {
    messages,
    status,
    activeTool,
    threadId: activeThreadId,
    pending,
    send,
    stop,
    removePending,
    steerPending,
    loadThread,
    prependHistory,
    markApprovalDecision,
  } = useAgentChat(projectKey, agent.id, agent.kind === 'external');
  const messagesQuery = useAgentThreadMessagesQuery(projectKey, agent.id, threadId);
  const qc = useQueryClient();

  useEffect(() => {
    if (status !== 'ready') return;
    void qc.invalidateQueries({ queryKey: qk.agentThreads(projectKey, agent.id) });
  }, [status, qc, projectKey, agent.id]);

  useEffect(() => {
    onStateChange?.({ running: status !== 'ready', hasMessages: messages.length > 0 });
  }, [status, messages.length, onStateChange]);

  useEffect(() => {
    if (!active || !onMessagesSnapshot) return;
    onMessagesSnapshot({ messages, status, activeTool });
  }, [active, messages, status, activeTool, onMessagesSnapshot]);

  const handleSend = useCallback(
    (prompt: string, attachmentIds?: string[]) => send(prompt, attachmentIds, runOptions),
    [send, runOptions],
  );

  const mergedRef = useRef<{ threadId: string | null; pages: number }>({
    threadId: null,
    pages: 0,
  });

  useEffect(() => {
    if (status !== 'ready') return;
    const latestMessages = messagesQuery.data?.pages[0]?.items;
    if (threadId && threadId !== activeThreadId && latestMessages) {
      loadThread(threadId, latestMessages);
    }
  }, [status, threadId, messagesQuery.data, activeThreadId, loadThread]);

  useEffect(() => {
    if (!threadId || threadId !== activeThreadId) return;
    if (mergedRef.current.threadId !== threadId) mergedRef.current = { threadId, pages: 1 };
    const pages = messagesQuery.data?.pages;
    if (!pages || pages.length <= mergedRef.current.pages) return;
    const older = pages.slice(mergedRef.current.pages);
    mergedRef.current.pages = pages.length;
    prependHistory([...older].reverse().flatMap((page) => page.items));
  }, [threadId, messagesQuery.data, activeThreadId, prependHistory]);

  useEffect(() => {
    if (activeThreadId && threadId === null) onThreadCreated(activeThreadId);
  }, [activeThreadId, threadId, onThreadCreated]);

  async function handleDecideApproval(approvalId: string, decision: 'approved' | 'rejected') {
    markApprovalDecision(approvalId, decision);
    try {
      await decideProjectApproval(projectKey, approvalId, decision);
    } catch {
      // Keep local feedback non-fatal if approval queue entry was synthetic during live stream.
    }
  }

  const restoring =
    status === 'ready' && threadId != null && threadId !== activeThreadId && messagesQuery.isLoading;
  if (restoring) return <AiChatThreadSkeleton />;

  return (
    <AgentChatPanel
      agent={agent}
      projectKey={projectKey}
      messages={messages}
      status={status}
      activeTool={activeTool}
      pending={pending}
      onSend={handleSend}
      onStop={stop}
      onRemovePending={removePending}
      onSteerPending={steerPending}
      onDecideApproval={(approvalId, decision) => void handleDecideApproval(approvalId, decision)}
      onSwitchToCloudAgent={onSwitchToCloudAgent}
      composerStart={composerStart}
      composerEnd={composerEnd}
      hasEarlierMessages={messagesQuery.hasNextPage}
      isLoadingEarlier={messagesQuery.isFetchingNextPage}
      onLoadEarlier={() => void messagesQuery.fetchNextPage()}
      viewPrefs={viewPrefs}
      runOptions={runOptions}
      onOpenArtifact={onOpenArtifact}
      onSlashCommandAction={onSlashCommandAction}
      onResetMode={onResetMode}
      draftKey={draftKey}
      onDraftChange={onDraftChange}
    />
  );
}
