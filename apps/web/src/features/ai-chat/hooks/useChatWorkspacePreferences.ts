'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getWorkspaceState, saveWorkspaceState } from '@/lib/api/endpoints/agents';
import type { ChatRunOptions } from '@/lib/api/endpoints/agentChat';
import {
  DEFAULT_CHAT_RUN_OPTIONS,
  DEFAULT_CHAT_VIEW_PREFERENCES,
  sanitizeRunOptions,
  sanitizeViewPreferences,
  type ChatViewPreferences,
  type RightPaneTab,
  type WorkspaceLayoutView,
} from '../types/workspaceControls';

const prefsStorageKey = (projectKey: string) => `aiChat:workspace:prefs:${projectKey}`;
const agentOptionsKey = (projectKey: string, agentId: number) =>
  `aiChat:agent:options:${projectKey}:${agentId}`;

function readLocalJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function writeLocalJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota/private mode errors.
  }
}

export function useChatWorkspacePreferences(projectKey: string) {
  const [prefs, setPrefs] = useState<ChatViewPreferences>(DEFAULT_CHAT_VIEW_PREFERENCES);
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);
  const remoteDirtyRef = useRef(false);

  useEffect(() => {
    if (!projectKey) return;
    let cancelled = false;
    remoteDirtyRef.current = false;

    const stored = readLocalJson(prefsStorageKey(projectKey));
    if (stored) {
      setPrefs(sanitizeViewPreferences(stored));
      setHydratedKey(projectKey);
      return () => {
        cancelled = true;
      };
    }

    const narrowViewport = typeof window !== 'undefined' && window.innerWidth < 1024;
    const initial: ChatViewPreferences = narrowViewport
      ? { ...DEFAULT_CHAT_VIEW_PREFERENCES, rightPaneOpen: false, showSessionsRail: false }
      : { ...DEFAULT_CHAT_VIEW_PREFERENCES };
    setPrefs(initial);
    setHydratedKey(projectKey);

    void getWorkspaceState(projectKey)
      .then((res) => {
        if (cancelled || remoteDirtyRef.current) return;
        const remotePrefs = (res?.state as { viewPrefs?: unknown } | undefined)?.viewPrefs;
        if (remotePrefs) {
          const sanitized = sanitizeViewPreferences(remotePrefs);
          setPrefs(
            narrowViewport
              ? { ...sanitized, rightPaneOpen: false, showSessionsRail: false }
              : sanitized,
          );
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [projectKey]);

  useEffect(() => {
    if (!projectKey || hydratedKey !== projectKey) return;
    writeLocalJson(prefsStorageKey(projectKey), prefs);
    if (!remoteDirtyRef.current) return;
    const timer = setTimeout(() => {
      void saveWorkspaceState(projectKey, { viewPrefs: prefs }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [projectKey, hydratedKey, prefs]);

  const updatePrefs = useCallback((patch: Partial<ChatViewPreferences>) => {
    remoteDirtyRef.current = true;
    setPrefs((prev) => ({ ...prev, ...patch }));
  }, []);

  const setLayout = useCallback((layout: WorkspaceLayoutView) => {
    remoteDirtyRef.current = true;
    setPrefs((prev) => {
      if (layout === 'focus') {
        return { ...prev, layout, rightPaneOpen: false, showSessionsRail: false };
      }
      if (layout === 'split') {
        return { ...prev, layout, rightPaneOpen: true };
      }
      return { ...prev, layout, rightPaneOpen: false };
    });
  }, []);

  const openRightTab = useCallback((rightPaneTab: RightPaneTab) => {
    remoteDirtyRef.current = true;
    setPrefs((prev) => ({
      ...prev,
      layout: 'split',
      rightPaneOpen: true,
      rightPaneTab,
    }));
  }, []);

  const resetPrefs = useCallback(() => {
    remoteDirtyRef.current = true;
    setPrefs({ ...DEFAULT_CHAT_VIEW_PREFERENCES });
  }, []);

  return { prefs, updatePrefs, setLayout, openRightTab, resetPrefs };
}

export function useAgentRunOptions(projectKey: string, agentId: number) {
  const [options, setOptions] = useState<ChatRunOptions>(DEFAULT_CHAT_RUN_OPTIONS);
  const [loadedScope, setLoadedScope] = useState<string>('');
  const scope = `${projectKey}:${agentId}`;

  useEffect(() => {
    if (!projectKey || !agentId) return;
    const stored = readLocalJson(agentOptionsKey(projectKey, agentId));
    setOptions(stored ? sanitizeRunOptions(stored) : { ...DEFAULT_CHAT_RUN_OPTIONS });
    setLoadedScope(scope);
  }, [projectKey, agentId, scope]);

  useEffect(() => {
    if (!projectKey || !agentId || loadedScope !== scope) return;
    writeLocalJson(agentOptionsKey(projectKey, agentId), options);
  }, [projectKey, agentId, scope, loadedScope, options]);

  const updateOptions = useCallback((patch: Partial<ChatRunOptions>) => {
    setOptions((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetOptions = useCallback(() => {
    setOptions({ ...DEFAULT_CHAT_RUN_OPTIONS });
  }, []);

  const hasOverrides = useMemo(
    () =>
      Boolean(options.model) ||
      options.modelCredentialId != null ||
      (options.mode ?? DEFAULT_CHAT_RUN_OPTIONS.mode) !== DEFAULT_CHAT_RUN_OPTIONS.mode ||
      (options.effort ?? DEFAULT_CHAT_RUN_OPTIONS.effort) !== DEFAULT_CHAT_RUN_OPTIONS.effort ||
      (options.thinking ?? DEFAULT_CHAT_RUN_OPTIONS.thinking) !==
        DEFAULT_CHAT_RUN_OPTIONS.thinking ||
      (options.permissionMode ?? DEFAULT_CHAT_RUN_OPTIONS.permissionMode) !==
        DEFAULT_CHAT_RUN_OPTIONS.permissionMode ||
      options.temperature != null ||
      options.maxSteps != null,
    [options],
  );

  return { options, updateOptions, resetOptions, hasOverrides };
}
