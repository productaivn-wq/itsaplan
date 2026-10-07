'use client';

import * as React from 'react';
import {
  FileCode,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  Bot,
  Send,
  Loader2,
  Archive,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { VibeFile, VibeDocContent } from '../types';

interface GroundedReaderViewProps {
  activeFile: VibeFile | null;
  docContent: VibeDocContent | null;
  loadingContent: boolean;
  highlightRange: { start: number; end: number } | null;
  onSetHighlightRange: (range: { start: number; end: number } | null) => void;
  onInspectArchive: (filePath: string) => void;
  onSelectFileByPath?: (path: string) => void;
  apiBaseUrl: string;
}

interface QAResponse {
  query: string;
  text_response: string;
  citations: Array<{
    document_name: string;
    file_path: string;
    start_line: number;
    end_line: number;
    confidence_score: number;
    snippet: string;
  }>;
  retrieval_latency_ms: number;
  grounded_status: string;
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
}: GroundedReaderViewProps) {
  const [copied, setCopied] = React.useState(false);
  const [question, setQuestion] = React.useState('');
  const [qaLoading, setQaLoading] = React.useState(false);
  const [qaResult, setQaResult] = React.useState<QAResponse | null>(null);
  const readerScrollRef = React.useRef<HTMLDivElement>(null);

  const lines = React.useMemo(() => {
    if (!docContent?.slice_content) return [];
    return docContent.slice_content.split('\n');
  }, [docContent]);

  // Jump and scroll to line when highlightRange changes
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

  const handleAskWeKnora = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || qaLoading) return;

    setQaLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setQaResult(data);
        if (data.citations && data.citations.length > 0) {
          const firstCit = data.citations[0];
          onSetHighlightRange({ start: firstCit.start_line, end: firstCit.end_line });
          if (onSelectFileByPath && firstCit.file_path !== activeFile?.relative_path) {
            onSelectFileByPath(firstCit.file_path);
          }
        }
      }
    } catch (err) {
      console.error('WeKnora chat query failed:', err);
    } finally {
      setQaLoading(false);
    }
  };

  const handleCitationClick = (cit: { file_path: string; start_line: number; end_line: number }) => {
    onSetHighlightRange({ start: cit.start_line, end: cit.end_line });
    if (onSelectFileByPath && cit.file_path !== activeFile?.relative_path) {
      onSelectFileByPath(cit.file_path);
    }
  };

  return (
    <div className="flex h-full w-full divide-x divide-border overflow-hidden bg-background">
      {/* LEFT: GROUNDED IDE EVIDENCE READER */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Document Header Toolbar */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4 bg-muted/20">
          <div className="flex items-center gap-2.5 truncate">
            {docContent?.is_archive ? (
              <Archive className="size-4.5 text-amber-500 shrink-0" />
            ) : (
              <FileCode className="size-4.5 text-primary shrink-0" />
            )}
            <span className="font-mono text-xs font-semibold text-foreground truncate">
              {activeFile?.relative_path || 'No document selected'}
            </span>
            {docContent && (
              <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                {docContent.displayed_lines} / {docContent.total_lines} lines
              </Badge>
            )}
            {highlightRange && (
              <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[10px] shrink-0 font-mono">
                Grounded L{highlightRange.start}..L{highlightRange.end}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
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

        {/* Document Content with Line Number Gutter */}
        <div ref={readerScrollRef} className="flex-1 overflow-auto bg-card font-mono text-xs">
          {loadingContent ? (
            <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span>Slicing document evidence...</span>
            </div>
          ) : !docContent ? (
            <div className="flex h-64 flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <BookOpen className="size-8 stroke-1 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-medium">Select a source file from the workspace</p>
              <p className="text-xs text-muted-foreground/75 mt-1 max-w-sm">
                Authoritative source lines will be rendered with full line-numbered gutters and verified citation highlights.
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
                    <div className="w-12 shrink-0 select-none py-0.5 pr-3 text-right font-mono text-[11px] text-muted-foreground/50">
                      {lineNum}
                    </div>
                    <div className="flex-1 overflow-x-auto py-0.5 pr-4 pl-2 font-mono whitespace-pre text-[12px] leading-5">
                      {lineText || ' '}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: WEKNORA GROUNDED CITATION & Q&A PANE */}
      <div className="flex w-96 shrink-0 flex-col overflow-hidden bg-background">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3 bg-muted/20">
          <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
            <Sparkles className="size-4 text-primary" />
            <span>WeKnora Grounded Q&A</span>
          </div>
          <Badge variant="secondary" className="text-[10px] font-mono">
            EAI ≥ 0.98
          </Badge>
        </div>

        {/* Citations & Evidence Stream */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {qaResult ? (
            <div className="space-y-3">
              <Card className="border-border bg-card">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      className={
                        qaResult.grounded_status === 'GROUNDED'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-muted text-muted-foreground'
                      }
                    >
                      {qaResult.grounded_status}
                    </Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {qaResult.retrieval_latency_ms} ms
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2 text-xs leading-relaxed text-foreground">
                  <p className="whitespace-pre-wrap">{qaResult.text_response}</p>
                </CardContent>
              </Card>

              {qaResult.citations && qaResult.citations.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    Grounded Citations ({qaResult.citations.length})
                  </div>
                  {qaResult.citations.map((cit, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleCitationClick(cit)}
                      className="cursor-pointer rounded-lg border border-border bg-card p-2.5 transition-all hover:border-amber-500/50 hover:bg-amber-500/5"
                    >
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="truncate text-foreground font-semibold" title={cit.document_name}>
                          {cit.document_name}
                        </span>
                        <Badge variant="outline" className="font-mono text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30">
                          L{cit.start_line}..L{cit.end_line}
                        </Badge>
                      </div>
                      <div className="mt-1 line-clamp-2 font-mono text-[11px] text-muted-foreground">
                        {cit.snippet}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Confidence: {(cit.confidence_score * 100).toFixed(0)}%</span>
                        <span className="flex items-center gap-0.5 text-primary hover:underline">
                          Jump to Source <ArrowUpRight className="size-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center p-4 text-center text-muted-foreground">
              <Bot className="size-8 text-muted-foreground/60 mb-2" />
              <p className="text-xs font-medium">Zero-Hallucination Retrieval</p>
              <p className="text-[11px] text-muted-foreground/75 mt-1">
                Ask questions across project deliverables and reference specifications with exact line citations.
              </p>
            </div>
          )}
        </div>

        {/* Question Input Form */}
        <form onSubmit={handleAskWeKnora} className="border-t border-border p-3 bg-muted/10">
          <div className="relative flex items-center">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask WeKnora about this project..."
              disabled={qaLoading}
              className="pr-10 text-xs"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              disabled={!question.trim() || qaLoading}
              className="absolute right-1 size-7 text-primary hover:bg-primary/10"
            >
              {qaLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
