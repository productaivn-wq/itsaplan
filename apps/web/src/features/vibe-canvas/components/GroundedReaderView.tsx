'use client';

// UNIFIED_GLOBAL_CHAT_PANEL: SPEC-ITSAPLAN-CHAT-WEKNORA-CONSOLIDATION
import * as React from 'react';
import {
  FileCode,
  Copy,
  Check,
  BookOpen,
  Loader2,
  Archive,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  VibeFile,
  VibeDocContent,
  VibeConversation,
  WeKnoraMemoryPayload,
} from '../types';
import WeKnoraCopilotDock from './WeKnoraCopilotDock';

interface GroundedReaderViewProps {
  activeFile: VibeFile | null;
  docContent: VibeDocContent | null;
  loadingContent: boolean;
  highlightRange: { start: number; end: number } | null;
  onSetHighlightRange: (range: { start: number; end: number } | null) => void;
  onInspectArchive: (filePath: string) => void;
  onSelectFileByPath?: (path: string) => void;
  apiBaseUrl: string;
  conversations?: VibeConversation[];
  activeThreadId?: string;
  onSelectThread?: (threadId: string) => void;
  onCreateThread?: (title?: string) => void;
  memory?: WeKnoraMemoryPayload | null;
  onRunInboxTriage?: () => void;
  triageLoading?: boolean;
  triageResults?: any | null;
  showInlineDock?: boolean;
}

export default function GroundedReaderView({
  activeFile,
  docContent,
  loadingContent,
  highlightRange,
  onSetHighlightRange,
  onInspectArchive,
  onSelectFileByPath,
  apiBaseUrl,
  conversations = [],
  activeThreadId = 'thread-default',
  onSelectThread = () => {},
  onCreateThread = () => {},
  memory = null,
  onRunInboxTriage = () => {},
  triageLoading = false,
  triageResults = null,
  showInlineDock = false,
}: GroundedReaderViewProps) {
  const [copied, setCopied] = React.useState(false);
  const readerScrollRef = React.useRef<HTMLDivElement>(null);

  const lines = React.useMemo(() => {
    if (!docContent?.slice_content) return [];
    return docContent.slice_content.split('\n');
  }, [docContent]);

  React.useEffect(() => {
    if (highlightRange && readerScrollRef.current) {
      const lineEl = document.getElementById(`reader-line-${highlightRange.start}`);
      if (lineEl) {
        lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightRange]);

  const handleCopyCode = () => {
    if (!docContent?.slice_content) return;
    navigator.clipboard.writeText(docContent.slice_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCitationClick = (cit: { file_path: string; start_line: number; end_line: number }) => {
    onSetHighlightRange({ start: cit.start_line, end: cit.end_line });
    if (onSelectFileByPath && cit.file_path !== activeFile?.relative_path) {
      onSelectFileByPath(cit.file_path);
    }
  };

  const handleOpenWeKnoraGlobalChat = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('itsaplan:open-weknora-chat', { detail: { subTab: 'chat' } }),
      );
    }
  };

  return (
    <div className="flex h-full w-full divide-x divide-border overflow-hidden bg-background">
      {/* FULL-WIDTH GROUNDED IDE EVIDENCE READER WITH LINE GUTTERS & 2D BOUNDING HIGHLIGHTS */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4 bg-muted/20">
          <div className="flex items-center gap-2.5 truncate">
            {docContent?.is_archive ? (
              <Archive className="size-4.5 text-amber-500 shrink-0" />
            ) : (
              <FileCode className="size-4.5 text-primary shrink-0" />
            )}
            <span className="font-mono text-xs font-semibold text-foreground truncate">
              {activeFile?.relative_path || 'ARCHITECTURE.md'}
            </span>
            {docContent && (
              <Badge variant="outline" className="text-xs font-mono shrink-0">
                {docContent.displayed_lines} / {docContent.total_lines} lines
              </Badge>
            )}
            {highlightRange && (
              <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-xs shrink-0 font-mono">
                Grounded L{highlightRange.start}..L{highlightRange.end}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenWeKnoraGlobalChat}
              className="h-8 gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
              title="Ask AI about this document"
            >
              <Sparkles className="size-3.5" />
              <span>Ask AI</span>
            </Button>
            {docContent?.is_archive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onInspectArchive(activeFile?.relative_path || '')}
                className="h-8 gap-1.5 text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
              >
                <Archive className="size-3.5" />
                Inspect Manifest
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              disabled={!docContent}
              className="h-8 gap-1.5 text-xs"
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        <div ref={readerScrollRef} className="flex-1 overflow-auto bg-card font-mono text-xs">
          {loadingContent ? (
            <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span>Slicing document evidence...</span>
            </div>
          ) : !docContent ? (
            <div className="flex h-64 flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <BookOpen className="size-8 stroke-1 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-medium">Select a source file or click a WeKnora citation pill</p>
              <p className="text-xs text-muted-foreground/75 mt-1 max-w-sm">
                Authoritative source lines are rendered with line-numbered gutters and verified bounding-box highlights.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/20 py-2">
              {lines.map((lineText, idx) => {
                const lineNum = idx + 1;
                const isHighlighted =
                  highlightRange && lineNum >= highlightRange.start && lineNum <= highlightRange.end;

                return (
                  <div
                    key={lineNum}
                    id={`reader-line-${lineNum}`}
                    className={`flex items-start hover:bg-muted/40 transition-colors ${
                      isHighlighted
                        ? 'bg-amber-500/15 border-l-2 border-amber-500 text-foreground font-medium'
                        : 'text-foreground/90'
                    }`}
                  >
                    <div className="w-12 shrink-0 select-none py-0.5 pr-3 text-right font-mono text-xs text-muted-foreground/50">
                      {lineNum}
                    </div>
                    <div className="flex-1 overflow-x-auto py-0.5 pr-4 pl-2 font-mono whitespace-pre text-xs leading-5">
                      {lineText || ' '}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Optional inline dock (disabled by default in favor of the unified global ChatPanel) */}
      {showInlineDock && (
        <WeKnoraCopilotDock
          apiBaseUrl={apiBaseUrl}
          conversations={conversations}
          activeThreadId={activeThreadId}
          onSelectThread={onSelectThread}
          onCreateThread={onCreateThread}
          memory={memory}
          onJumpToCitation={handleCitationClick}
          onOpenWikiGraphDoc={(path) => onSelectFileByPath && onSelectFileByPath(path)}
          onRunInboxTriage={onRunInboxTriage}
          triageLoading={triageLoading}
          triageResults={triageResults}
        />
      )}
    </div>
  );
}
