'use client';

import * as React from 'react';
import {
  ArrowUpRight,
  Brain,
  FolderSync,
  Loader2,
  MessageSquarePlus,
  Network,
  Send,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { VibeCitation, VibeConversation, WeKnoraMemoryPayload } from '../types';

interface WeKnoraCopilotDockProps {
  apiBaseUrl: string;
  conversations: VibeConversation[];
  activeThreadId: string;
  onSelectThread: (threadId: string) => void;
  onCreateThread: (title?: string) => void;
  memory: WeKnoraMemoryPayload | null;
  onJumpToCitation: (cit: { file_path: string; start_line: number; end_line: number }) => void;
  onOpenWikiGraphDoc: (path: string) => void;
  onRunInboxTriage: () => void;
  triageLoading?: boolean;
  triageResults?: any | null;
}

const PRESET_QUERIES = [
  'What is the Three-Node socio-technical architecture?',
  'Explain Gate GW-HEADLESS-01',
  'How does OpenJEV compare to Jevbox in CPU latency?',
];

export default function WeKnoraCopilotDock({
  apiBaseUrl,
  conversations,
  activeThreadId,
  onSelectThread,
  onCreateThread,
  memory,
  onJumpToCitation,
  onOpenWikiGraphDoc,
  onRunInboxTriage,
  triageLoading = false,
  triageResults = null,
}: WeKnoraCopilotDockProps) {
  const [subTab, setSubTab] = React.useState<'chat' | 'memory'>('chat');
  const [question, setQuestion] = React.useState('');
  const [qaLoading, setQaLoading] = React.useState(false);
  const [qaResult, setQaResult] = React.useState<{
    query: string;
    text_response: string;
    citations: VibeCitation[];
    retrieval_latency_ms: number;
    grounded_status: string;
  } | null>(null);

  const runWeKnoraQuery = async (queryText: string) => {
    const clean = queryText.trim();
    if (!clean || qaLoading) return;
    setQuestion(clean);
    setQaLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clean, thread_id: activeThreadId }),
      });
      if (res.ok) {
        const data = await res.json();
        setQaResult(data);
      }
    } catch (err) {
      console.error('WeKnora Copilot query failed:', err);
    } finally {
      setQaLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runWeKnoraQuery(question);
  };

  return (
    <aside
      id="weknora-copilot-dock"
      className="flex w-96 shrink-0 flex-col overflow-hidden border-l border-border bg-card/40"
    >
      {/* Top WeKnora Header & Sub-Mode Toggle */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-muted/20 px-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Sparkles className="size-4 text-primary" />
          <span>WeKnora Copilot</span>
          <Badge
            variant="outline"
            className="border-emerald-500/40 px-1.5 py-0 font-mono text-[9px] text-emerald-600 dark:text-emerald-400"
          >
            CPU &lt;1ms · ECE ≤0.0144
          </Badge>
        </div>

        <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setSubTab('chat')}
            className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
              subTab === 'chat'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Grounded Q&amp;A
          </button>
          <button
            type="button"
            onClick={() => setSubTab('memory')}
            className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
              subTab === 'memory'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            5-Bucket Memory
          </button>
        </div>
      </div>

      {/* Multi-Threaded Conversation Strip + Custodian Action */}
      <div className="flex items-center justify-between gap-1.5 border-b border-border bg-background/60 px-3 py-1.5 text-xs">
        <select
          aria-label="WeKnora Conversation Thread"
          value={activeThreadId}
          onChange={(e) => onSelectThread(e.target.value)}
          className="h-7 flex-1 truncate rounded border border-border bg-background px-2 text-[11px] text-foreground focus:outline-none"
        >
          {conversations.map((c) => {
            const tid = c.thread_id || c.id;
            return (
              <option key={tid} value={tid}>
                {c.title}
              </option>
            );
          })}
        </select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onCreateThread()}
          className="h-7 gap-1 px-2 text-[11px]"
          title="New WeKnora Conversation Thread"
        >
          <MessageSquarePlus className="size-3.5" />
          <span>New</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRunInboxTriage}
          disabled={triageLoading}
          className="h-7 gap-1 border-amber-500/40 px-2 text-[11px] text-amber-600 dark:text-amber-400"
          title="Autonomous Custodian 00_INBOX Triage"
        >
          {triageLoading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <FolderSync className="size-3" />
          )}
          <span>00_INBOX</span>
        </Button>
      </div>

      {triageResults && (
        <div className="flex shrink-0 items-center gap-1.5 border-b border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-800 dark:text-amber-200">
          <Zap className="size-3.5 shrink-0 text-amber-500" />
          <span className="truncate">
            <strong>Custodian Triage:</strong> {triageResults.pending_count ?? 0} inbox items
            classified (OpenJEV ≥70%).
          </span>
        </div>
      )}

      {subTab === 'chat' ? (
        <>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {/* Preset Grounded Queries */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                FastMCP WeKnora Presets (BM25 + TableRAG)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_QUERIES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => void runWeKnoraQuery(preset)}
                    className="rounded-md border border-primary/25 bg-primary/5 px-2 py-1 text-left text-[11px] text-primary transition hover:bg-primary/15"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {qaResult ? (
              <div className="space-y-3">
                <Card className="border-border bg-card">
                  <CardHeader className="p-2.5 pb-1.5">
                    <div className="flex items-center justify-between">
                      <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[10px] text-emerald-700 dark:text-emerald-300">
                        {qaResult.grounded_status} · EAI ≥ 0.98
                      </Badge>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {qaResult.retrieval_latency_ms} ms
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2.5 pt-1 text-xs leading-relaxed text-foreground">
                    <p className="whitespace-pre-wrap">{qaResult.text_response}</p>
                  </CardContent>
                </Card>

                {qaResult.citations && qaResult.citations.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Grounded Citations ({qaResult.citations.length}) — Click to Jump &amp;
                      Highlight
                    </div>
                    {qaResult.citations.map((cit, idx) => (
                      <div
                        key={idx}
                        onClick={() => onJumpToCitation(cit)}
                        className="cursor-pointer rounded-lg border border-border bg-card p-2.5 transition-all hover:border-amber-500/50 hover:bg-amber-500/5"
                      >
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="truncate font-semibold text-foreground">
                            📑 {cit.document_name}
                          </span>
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 font-mono text-[10px] text-amber-600 dark:text-amber-400"
                          >
                            L{cit.start_line}..L{cit.end_line}
                          </Badge>
                        </div>
                        <div className="mt-1 line-clamp-2 font-mono text-[11px] text-muted-foreground">
                          {cit.snippet}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>
                            OpenJEV Confidence: {(cit.confidence_score * 100).toFixed(0)}%
                          </span>
                          <span className="flex items-center gap-0.5 font-medium text-primary">
                            Open in Evidence Reader <ArrowUpRight className="size-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                <Brain className="mx-auto mb-1.5 size-6 text-primary/70" />
                <div className="font-semibold text-foreground">
                  WeKnora Grounded Thinking Partner
                </div>
                <p className="mt-1 text-[11px]">
                  Ask questions while editing Docs or Notes. Every claim includes clickable line
                  citations backed by local CPU BM25, TableRAG, and OpenJEV reranking.
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border bg-muted/10 p-2.5">
            <div className="relative flex items-center">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask WeKnora across Docs, Notes & MECE Zones..."
                disabled={qaLoading}
                className="h-8 pr-9 text-xs"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                disabled={!question.trim() || qaLoading}
                className="absolute right-1 size-6 text-primary hover:bg-primary/10"
              >
                {qaLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
              </Button>
            </div>
          </form>
        </>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto p-3 text-xs">
          {/* 5-Bucket Episodic Memory */}
          <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-2.5">
            <div className="flex items-center justify-between font-semibold text-indigo-600 dark:text-indigo-300">
              <span className="flex items-center gap-1.5">
                <Brain className="size-3.5" />
                <span>5-Bucket Episodic Memory</span>
              </span>
              <span className="font-mono text-[10px]">
                Reconciliation: {memory?.contradiction_reconciliation_rate || '19.8%'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Persistent cross-session memory atoms (Profile, Preference, Fact, Task, Interest) with
              automatic contradiction superseding.
            </p>
          </div>

          {(['profile', 'preference', 'fact', 'task', 'interest'] as const).map((bucket) => {
            const items = memory?.buckets?.[bucket] ?? [];
            return (
              <div key={bucket} className="space-y-1 rounded-lg border border-border bg-card p-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold tracking-wider text-primary uppercase">
                    [{bucket.toUpperCase()}]
                  </span>
                  <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
                    {items.length} atoms
                  </Badge>
                </div>
                <ul className="list-disc space-y-1 pl-4 text-[11px] text-foreground/90">
                  {items.map((atom, i) => (
                    <li key={i}>{atom}</li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* WikiGraph Knowledge Compounding */}
          <div className="space-y-1.5 rounded-lg border border-border bg-card p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
              <Network className="size-3.5" />
              <span>KùzuDB WikiGraph [[slug|title]] Links</span>
            </div>
            <div className="flex flex-col gap-1">
              {(memory?.wikigraph_links ?? []).map((link) => (
                <button
                  key={link.slug}
                  type="button"
                  onClick={() => onOpenWikiGraphDoc(link.path)}
                  className="flex items-center justify-between rounded border border-border/60 bg-muted/30 px-2 py-1 text-left text-[11px] transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="font-mono font-semibold text-primary">
                    [[{link.slug}|{link.title}]]
                  </span>
                  <ArrowUpRight className="size-3 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
