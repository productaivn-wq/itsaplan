'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { getWorkspaceState, saveWorkspaceState } from '@/lib/api/endpoints/agents';
import { uuid } from '@/utils/uuid';

// One open conversation in the chat panel. `threadId` is null until the agent answers
// the first message, and stays null for an agent that keeps no memory. `running` and
// `hasMessages` are what the session's transcript reports back, so the panel knows what
// is going on in a session it is not showing.
export type ChatSession = {
  id: string;
  agentId: number;
  threadId: string | null;
  running: boolean;
  hasMessages: boolean;
};

export type ChatSessionState = Pick<ChatSession, 'running' | 'hasMessages'>;

const storageKey = (projectKey: string) => `aiChat:panel:tabs:${projectKey}`;

const newSession = (agentId: number, threadId: string | null = null): ChatSession => ({
  id: uuid(),
  agentId,
  threadId,
  running: false,
  hasMessages: false,
});

type StoredTabs = {
  sessions: { id: string; agentId: number; threadId: string }[];
  activeId: string | null;
};

function isStored(value: unknown): value is StoredTabs {
  if (typeof value !== 'object' || value === null) return false;
  const tabs = value as StoredTabs;
  return (
    Array.isArray(tabs.sessions) &&
    tabs.sessions.every(
      (session) =>
        typeof session.id === 'string' &&
        typeof session.agentId === 'number' &&
        typeof session.threadId === 'string',
    ) &&
    (typeof tabs.activeId === 'string' || tabs.activeId === null)
  );
}

function read(projectKey: string): { sessions: ChatSession[]; activeId: string | null } {
  try {
    const raw = localStorage.getItem(storageKey(projectKey));
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!isStored(parsed)) return { sessions: [], activeId: null };
    return {
      sessions: parsed.sessions.map((session) => ({
        ...session,
        running: false,
        hasMessages: true,
      })),
      activeId: parsed.activeId,
    };
  } catch {
    return { sessions: [], activeId: null };
  }
}

function write(projectKey: string, sessions: ChatSession[], activeId: string | null) {
  // A session with no thread is a chat that has not started: there is nothing to
  // restore it from, so it is not kept.
  const stored = sessions.flatMap((session) =>
    session.threadId
      ? [{ id: session.id, agentId: session.agentId, threadId: session.threadId }]
      : [],
  );
  try {
    localStorage.setItem(storageKey(projectKey), JSON.stringify({ sessions: stored, activeId }));
  } catch {
    // Storage unavailable (private mode / quota); the tabs still work in this tab.
  }
}

export function reconcileRemoteChatSessions({
  current,
  currentActiveId,
  remote,
  userInteracted,
}: {
  current: ChatSession[];
  currentActiveId: string | null;
  remote: StoredTabs;
  userInteracted: boolean;
}): { sessions: ChatSession[]; activeId: string | null } {
  if (remote.sessions.length === 0) {
    return { sessions: current, activeId: currentActiveId };
  }
  const restored: ChatSession[] = remote.sessions.map((session) => ({
    ...session,
    running: false,
    hasMessages: true,
  }));
  const hasActiveLocalWork =
    userInteracted ||
    current.some((s) => s.running || s.hasMessages || s.threadId != null);
  if (!hasActiveLocalWork) {
    return {
      sessions: restored,
      activeId: remote.activeId ?? restored[0]?.id ?? null,
    };
  }
  const existingThreadIds = new Set(
    current.map((s) => s.threadId).filter((id): id is string => id != null),
  );
  const extraRemote = restored.filter((s) => !existingThreadIds.has(s.threadId!));
  return {
    sessions: extraRemote.length > 0 ? [...current, ...extraRemote] : current,
    activeId: currentActiveId ?? current[0]?.id ?? null,
  };
}

// The sessions the chat panel holds open, for one project. Every session stays mounted
// while it is open, so a session that is not shown keeps its transcript and its composer
// and continues to receive its reply.
//
// The panel always holds at least one session: closing the last one leaves a fresh chat
// in its place. The tabs and the active one are kept on the device, so a reload opens
// the same conversations.
export function useChatSessions(projectKey: string | null, defaultAgentId: number | null) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // The agent a new tab starts with: the one the user picked last.
  const [lastAgentId, setLastAgentId] = useState<number | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const remoteDirtyRef = useRef(false);
  const userInteractedRef = useRef(false);
  const sessionsRef = useRef<ChatSession[]>(sessions);
  sessionsRef.current = sessions;
  const activeIdRef = useRef<string | null>(activeId);
  activeIdRef.current = activeId;

  // The panel outlives the route, so a move to a different project loads that
  // project's tabs. Storage is read here rather than in the state initializer: this
  // component also renders on the server, where there is none.
  useEffect(() => {
    if (!projectKey) return;
    let cancelled = false;
    remoteDirtyRef.current = false;
    userInteractedRef.current = false;
    const stored = read(projectKey);
    setSessions(stored.sessions);
    setActiveId(stored.activeId);
    setLastAgentId(null);
    setLoadedKey(projectKey);

    void getWorkspaceState(projectKey)
      .then((remote) => {
        if (cancelled) return;
        const payload = remote?.state;
        if (stored.sessions.length === 0 && isStored(payload) && payload.sessions.length > 0) {
          const reconciled = reconcileRemoteChatSessions({
            current: sessionsRef.current,
            currentActiveId: activeIdRef.current,
            remote: payload,
            userInteracted: userInteractedRef.current,
          });
          setSessions((prev) =>
            reconcileRemoteChatSessions({
              current: prev,
              currentActiveId: activeIdRef.current,
              remote: payload,
              userInteracted: userInteractedRef.current,
            }).sessions,
          );
          if (reconciled.activeId !== activeIdRef.current) {
            setActiveId(reconciled.activeId);
          }
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [projectKey]);

  // Only once this project's tabs have been read: a fresh chat made before that would
  // take the place of the kept ones.
  useEffect(() => {
    if (defaultAgentId == null || loadedKey !== projectKey || sessions.length > 0) return;
    const first = newSession(defaultAgentId);
    setSessions([first]);
    setActiveId(first.id);
  }, [defaultAgentId, projectKey, loadedKey, sessions.length]);

  // Only once this project's tabs have been read: an empty state on the way there
  // would overwrite them.
  useEffect(() => {
    if (!projectKey || loadedKey !== projectKey) return;
    const hasStartedThread = sessions.some((s) => s.threadId != null);
    if (!remoteDirtyRef.current && !hasStartedThread) return;

    write(projectKey, sessions, activeId);
    if (!remoteDirtyRef.current) return;

    const stored = sessions.flatMap((session) =>
      session.threadId
        ? [{ id: session.id, agentId: session.agentId, threadId: session.threadId }]
        : [],
    );
    const timer = setTimeout(() => {
      void saveWorkspaceState(projectKey, { sessions: stored, activeId }).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [projectKey, loadedKey, sessions, activeId]);

  const markInteracted = useCallback(() => {
    userInteractedRef.current = true;
  }, []);

  const update = useCallback((id: string, change: Partial<ChatSession>) => {
    userInteractedRef.current = true;
    remoteDirtyRef.current = true;
    setSessions((prev) =>
      prev.map((session) => (session.id === id ? { ...session, ...change } : session)),
    );
  }, []);

  const openTab = useCallback((agentId: number, threadId: string | null = null) => {
    userInteractedRef.current = true;
    remoteDirtyRef.current = true;
    const session = newSession(agentId, threadId);
    setSessions((prev) => [...prev, session]);
    setActiveId(session.id);
    setLastAgentId(agentId);
  }, []);

  // Opens a past conversation: one that is already open is brought forward instead of
  // opening a second tab for it.
  const openThread = useCallback(
    (agentId: number, threadId: string) => {
      userInteractedRef.current = true;
      remoteDirtyRef.current = true;
      const existing = sessions.find((session) => session.threadId === threadId);
      if (existing) {
        setActiveId(existing.id);
        return;
      }
      openTab(agentId, threadId);
    },
    [sessions, openTab],
  );

  // The session next to the closed one takes over. Closing the last session leaves an
  // empty chat with the agent that session used.
  const closeSession = useCallback(
    (id: string) => {
      userInteractedRef.current = true;
      remoteDirtyRef.current = true;
      const index = sessions.findIndex((session) => session.id === id);
      if (index < 0) return;
      const rest = sessions.filter((session) => session.id !== id);
      if (rest.length === 0) {
        const fresh = newSession(sessions[index].agentId);
        setSessions([fresh]);
        setActiveId(fresh.id);
        return;
      }
      setSessions(rest);
      if (activeId === id) setActiveId((rest[index] ?? rest[rest.length - 1]).id);
    },
    [sessions, activeId],
  );

  // A tab dragged onto another one takes its place in the row. The order is what is
  // kept on the device, so it is also the order a reload opens the chats in.
  const moveTab = useCallback((id: string, overId: string) => {
    userInteractedRef.current = true;
    remoteDirtyRef.current = true;
    setSessions((prev) => {
      const from = prev.findIndex((session) => session.id === id);
      const to = prev.findIndex((session) => session.id === overId);
      if (from < 0 || to < 0) return prev;
      return arrayMove(prev, from, to);
    });
  }, []);

  // A chat picked from the menu of the tabs the row did not fit takes the place of the
  // tab it appears in, so it stays in the row once another tab is selected.
  const swapTabs = useCallback((id: string, otherId: string) => {
    userInteractedRef.current = true;
    remoteDirtyRef.current = true;
    setSessions((prev) => {
      const from = prev.findIndex((session) => session.id === id);
      const to = prev.findIndex((session) => session.id === otherId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      next[from] = prev[to];
      next[to] = prev[from];
      return next;
    });
  }, []);

  const setActive = useCallback((id: string) => {
    userInteractedRef.current = true;
    remoteDirtyRef.current = true;
    setActiveId(id);
  }, []);

  const active = sessions.find((session) => session.id === activeId) ?? sessions[0] ?? null;

  return {
    sessions,
    active,
    setActive,
    markInteracted,
    newTab: useCallback(() => {
      const agentId = lastAgentId ?? defaultAgentId;
      if (agentId != null) openTab(agentId);
    }, [openTab, lastAgentId, defaultAgentId]),
    openTab,
    openThread,
    closeSession,
    moveTab,
    swapTabs,
    setThread: useCallback((id: string, threadId: string) => update(id, { threadId }), [update]),
    setAgent: useCallback(
      (id: string, agentId: number) => {
        setLastAgentId(agentId);
        update(id, { agentId });
      },
      [update],
    ),
    // A session reports its state on every render of its transcript. Keeping the array
    // as it is when nothing changed is what stops that from re-rendering the panel.
    setState: useCallback((id: string, state: ChatSessionState) => {
      setSessions((prev) =>
        prev.some(
          (session) =>
            session.id === id &&
            (session.running !== state.running || session.hasMessages !== state.hasMessages),
        )
          ? prev.map((session) => (session.id === id ? { ...session, ...state } : session))
          : prev,
      );
    }, []),
  };
}
