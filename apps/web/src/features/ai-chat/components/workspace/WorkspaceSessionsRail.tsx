'use client';

import { FolderKanban, FolderPlus, MessageSquare, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AiAgent } from '@/lib/api/endpoints/agents';
import type { Project } from '@/lib/api/endpoints/projects';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AiChatThreadList } from '../shared/AiChatThreadList';
import type { ChatSession } from '../../hooks/useChatSessions';

export function WorkspaceSessionsRail({
  projectKey,
  projects,
  onSelectProject,
  onNewProject,
  agents,
  sessions,
  activeSession,
  open,
  onClose,
  onSelectSession,
  onNewTab,
  onSelectThread,
  onThreadDeleted,
}: {
  projectKey: string;
  projects?: Project[];
  onSelectProject?: (ref: string) => void;
  onNewProject?: () => void;
  agents: AiAgent[];
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  open: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  onNewTab: () => void;
  onSelectThread: (agentId: number, threadId: string) => void;
  onThreadDeleted: (threadId: string) => void;
}) {
  const t = useTranslations('aiChat');
  if (!open || !activeSession) return null;

  const activeAgent = agents.find((a) => a.id === activeSession.agentId) ?? agents[0] ?? null;
  if (!activeAgent) return null;

  const keepsHistory = activeAgent.kind === 'external' || activeAgent.memoryEnabled;

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        data-testid="workspace-sessions-rail"
        className="fixed inset-y-0 left-0 z-40 flex w-64 max-w-[85vw] shrink-0 flex-col border-e border-border bg-background shadow-2xl lg:static lg:z-auto lg:bg-muted/15 lg:shadow-none"
      >
        {(projects && projects.length > 0) || onNewProject ? (
          <div className="border-b border-border/70 px-2.5 py-2">
            <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <FolderKanban className="size-3.5 text-primary" />
                <span>{t('workspaceProjects')}</span>
              </span>
              {onNewProject && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  data-testid="rail-new-project-btn"
                  onClick={onNewProject}
                  title={t('newProject')}
                >
                  <FolderPlus className="size-3.5" />
                  <span className="sr-only">{t('newProject')}</span>
                </Button>
              )}
            </div>
            {projects && projects.length > 0 && (
              <div className="flex max-h-36 flex-col gap-0.5 overflow-y-auto">
                {projects.map((p) => {
                  const isActive = p.ref === projectKey || p.key === projectKey;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (!isActive) onSelectProject?.(p.ref);
                      }}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-xs transition',
                        isActive
                          ? 'bg-secondary font-medium text-foreground'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                      )}
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {p.key}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <MessageSquare className="size-3.5 text-primary" />
            <span>{t('conversations')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onNewTab}
              title={t('newChat')}
            >
              <Plus className="size-3.5" />
              <span className="sr-only">{t('newChat')}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="lg:hidden"
              onClick={onClose}
              aria-label="Close conversations sidebar"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>

        {sessions.length > 1 && (
          <div className="border-b border-border/70 px-2.5 py-2">
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              {t('openTabs')} ({sessions.length})
            </div>
            <div className="flex flex-col gap-0.5">
              {sessions.map((s, idx) => {
                const a = agents.find((cand) => cand.id === s.agentId);
                const isActive = s.id === activeSession.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelectSession(s.id)}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-xs transition',
                      isActive
                        ? 'bg-secondary font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    <span className="truncate">{a?.name ?? `Chat #${idx + 1}`}</span>
                    {s.running && (
                      <span className="size-1.5 shrink-0 rounded-full bg-primary animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          {keepsHistory ? (
            <AiChatThreadList
              projectKey={projectKey}
              agentId={activeAgent.id}
              selectedThreadId={activeSession.threadId}
              onSelect={(threadId) => onSelectThread(activeAgent.id, threadId)}
              onDeleted={onThreadDeleted}
            />
          ) : (
            <p className="m-3 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              {t('noHistory')}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
