'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Brain,
  ExternalLink,
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  Sparkles,
  X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Direction } from 'radix-ui';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInstantPathname, navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { usePersistedWidth } from '@/hooks/usePersistedWidth';
import { aiTeamPath, documentsPath } from '@/utils/paths';
import { isHostVibeEnabled } from '@/lib/security/hostVibeClient';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ResizeGrip from '@/components/common/ResizeGrip';
import WeKnoraCopilotDock from '@/features/vibe-canvas/components/WeKnoraCopilotDock';
import { ChatViewMenu } from '../controls/ChatViewMenu';
import { ChatPanelBody } from './ChatPanelBody';
import { chatPanelWidthKey, type ChatPanelMode } from '../../hooks/useChatPanel';
import { useChatWorkspacePreferences } from '../../hooks/useChatWorkspacePreferences';

const DEFAULT_WIDTH = 600;
const MIN_WIDTH = 340;
const MAX_WIDTH = 960;

export type UnifiedChatPanelView = 'weknora' | 'agents' | 'memory';

// Unified Client-First AI Chat drawer. Defaults to Live Cloud/Runner Agents (`agents`),
// links to the full-canvas `/agents/chat` workspace, and hides host-only legacy tabs
// unless `NEXT_PUBLIC_ENABLE_HOST_VIBE === 'true'`.
export function ChatPanel({
  projectKey,
  open,
  mode,
  fullscreen,
  onToggleMode,
  onToggleFullscreen,
  onClose,
  onOpenPanel,
  newChatAgentId,
  onNewChatHandled,
}: {
  projectKey: string;
  open: boolean;
  mode: ChatPanelMode;
  fullscreen: boolean;
  onToggleMode: () => void;
  onToggleFullscreen: () => void;
  onClose: () => void;
  onOpenPanel?: () => void;
  newChatAgentId: number | null;
  onNewChatHandled: () => void;
}) {
  const t = useTranslations('aiChat');
  const tCommon = useTranslations('common');
  const isVi = useLocale().startsWith('vi');
  const direction = Direction.useDirection();
  const isMobile = useIsMobile();
  const pathname = useInstantPathname();
  const enableHostVibe = isHostVibeEnabled();
  const { width, setWidth } = usePersistedWidth(
    chatPanelWidthKey(projectKey),
    DEFAULT_WIDTH,
    MIN_WIDTH,
    MAX_WIDTH,
  );
  const { prefs, updatePrefs, resetPrefs } = useChatWorkspacePreferences(projectKey);

  const [panelView, setPanelView] = useState<UnifiedChatPanelView>('agents');
  const [externalQuery, setExternalQuery] = useState<string>('');
  const [activeFilePath, setActiveFilePath] = useState<string | null>(() =>
    typeof window !== 'undefined'
      ? ((window as unknown as { __itsaplanActiveReaderPath?: string | null })
          .__itsaplanActiveReaderPath ?? null)
      : null,
  );

  const docMatch = pathname.match(/\/docs\/(\d+)/);
  const activeDocumentId = docMatch ? Number(docMatch[1]) : null;
  const overlay = isMobile || mode === 'overlay';

  const opened = useRef(false);
  if (open) opened.current = true;

  useEffect(() => {
    const handleActiveFile = (e: Event) => {
      const detail = (e as CustomEvent<{ path?: string | null }>).detail;
      setActiveFilePath(detail?.path ?? null);
    };
    window.addEventListener('itsaplan:active-reader-file', handleActiveFile);
    return () => window.removeEventListener('itsaplan:active-reader-file', handleActiveFile);
  }, []);

  useEffect(() => {
    if (newChatAgentId != null) {
      setPanelView('agents');
    }
  }, [newChatAgentId]);

  useEffect(() => {
    const handleOpenWeKnora = (e: Event) => {
      const detail = (
        e as CustomEvent<{ subTab?: 'chat' | 'memory'; mode?: string; query?: string }>
      ).detail;
      if (enableHostVibe) {
        const targetView: UnifiedChatPanelView =
          detail?.subTab === 'memory' ? 'memory' : 'weknora';
        setPanelView(targetView);
      } else {
        setPanelView('agents');
      }
      if (detail?.query) {
        setExternalQuery(detail.query);
      }
      opened.current = true;
      onOpenPanel?.();
    };
    window.addEventListener('itsaplan:open-weknora-chat', handleOpenWeKnora);
    return () => window.removeEventListener('itsaplan:open-weknora-chat', handleOpenWeKnora);
  }, [onOpenPanel, enableHostVibe]);

  const handleJumpToCitation = (cit: {
    file_path: string;
    start_line: number;
    end_line: number;
  }) => {
    (
      window as unknown as { __itsaplanPendingCitationJump?: typeof cit }
    ).__itsaplanPendingCitationJump = cit;
    const onKnowledgeHub =
      pathname.includes('/docs') || pathname.includes('/notes') || pathname.includes('/vibe');
    if (!onKnowledgeHub) {
      navigateFeatureInstant(documentsPath(projectKey));
    }
    window.dispatchEvent(new CustomEvent('itsaplan:weknora-citation-jump', { detail: cit }));
  };

  const handleOpenWikiGraphDoc = (path: string) => {
    (
      window as unknown as { __itsaplanPendingWikiGraphPath?: string }
    ).__itsaplanPendingWikiGraphPath = path;
    const onKnowledgeHub =
      pathname.includes('/docs') || pathname.includes('/notes') || pathname.includes('/vibe');
    if (!onKnowledgeHub) {
      navigateFeatureInstant(documentsPath(projectKey));
    }
    window.dispatchEvent(
      new CustomEvent('itsaplan:weknora-wikigraph-open', { detail: { path } }),
    );
  };

  const effectiveView: UnifiedChatPanelView =
    !enableHostVibe && panelView !== 'agents' ? 'agents' : panelView;

  return (
    <aside
      id="unified-global-chat-panel"
      className={cn(
        'flex h-full min-h-0 flex-col bg-background',
        !open && 'hidden',
        fullscreen
          ? 'fixed inset-0 z-50'
          : cn(
              'border-s',
              overlay
                ? 'absolute inset-y-0 end-0 z-30 shadow-[var(--side-panel-shadow)]'
                : 'relative shrink-0',
            ),
      )}
      style={fullscreen ? undefined : { width: isMobile ? '100%' : width }}
    >
      {!isMobile && !fullscreen && (
        <ResizeGrip
          label={t('resizePanel')}
          className="absolute inset-y-0 start-0 z-10"
          onDrag={(deltaX) => setWidth(width + (direction === 'rtl' ? deltaX : -deltaX))}
        />
      )}

      <div className="flex items-center gap-1.5 border-b px-2.5 py-1.5">
        <div
          role="tablist"
          aria-label={t('chatPanel')}
          className="flex min-w-0 flex-1 items-center gap-0.5 rounded-lg bg-muted/70 p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={effectiveView === 'agents'}
            data-testid="unified-chat-mode-agents"
            onClick={() => setPanelView('agents')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition truncate',
              effectiveView === 'agents'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Bot className="size-3.5 shrink-0 text-primary" />
            <span className="truncate">{t('chatPanel')}</span>
          </button>

          {enableHostVibe && (
            <>
              <button
                type="button"
                role="tab"
                aria-selected={effectiveView === 'weknora'}
                data-testid="unified-chat-mode-weknora"
                onClick={() => setPanelView('weknora')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition truncate',
                  effectiveView === 'weknora'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Sparkles className="size-3.5 shrink-0 text-sky-500" />
                <span className="truncate">Knowledge</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={effectiveView === 'memory'}
                data-testid="unified-chat-mode-memory"
                onClick={() => setPanelView('memory')}
                className={cn(
                  'flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition truncate',
                  effectiveView === 'memory'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Brain className="size-3.5 shrink-0 text-indigo-500" />
                <span className="truncate">{isVi ? 'Bộ nhớ' : 'Memory'}</span>
              </button>
            </>
          )}
        </div>

        <ChatViewMenu
          prefs={prefs}
          onChange={updatePrefs}
          onReset={resetPrefs}
          showWidthOption={false}
          compact
        />

        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            onClose();
            navigateFeatureInstant(aiTeamPath(projectKey, 'chat'));
          }}
          title={isVi ? 'Mở không gian làm việc đầy đủ' : 'Full Workspace'}
        >
          <ExternalLink className="size-3.5" />
          <span className="hidden sm:inline">{isVi ? 'Mở rộng' : 'Full Workspace'}</span>
        </Button>

        {!isMobile && !fullscreen && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onToggleMode}
            title={t(mode === 'push' ? 'overlayMode' : 'pushMode')}
            aria-pressed={mode === 'push'}
          >
            {mode === 'push' ? <PinOff /> : <Pin />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onToggleFullscreen}
          title={tCommon(fullscreen ? 'exitFullscreen' : 'fullscreen')}
          aria-pressed={fullscreen}
        >
          {fullscreen ? <Minimize2 /> : <Maximize2 />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          title={tCommon('close')}
        >
          <X />
        </Button>
      </div>

      {opened.current && (
        <>
          {effectiveView === 'agents' && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <ChatPanelBody
                projectKey={projectKey}
                newChatAgentId={newChatAgentId}
                onNewChatHandled={onNewChatHandled}
                viewPrefs={prefs}
              />
            </div>
          )}

          {enableHostVibe && effectiveView !== 'agents' && (
            <WeKnoraCopilotDock
              variant="embedded"
              activeSubTab={effectiveView === 'memory' ? 'memory' : 'chat'}
              onSubTabChange={(sub) => setPanelView(sub === 'memory' ? 'memory' : 'weknora')}
              initialQuery={externalQuery}
              projectKey={projectKey}
              activeDocumentId={activeDocumentId}
              activeFilePath={activeFilePath}
              onOpenLiveAgents={() => setPanelView('agents')}
              onJumpToCitation={handleJumpToCitation}
              onOpenWikiGraphDoc={handleOpenWikiGraphDoc}
            />
          )}
        </>
      )}
    </aside>
  );
}
