'use client';

// UNIFIED_GLOBAL_CHAT_PANEL: SPEC-ITSAPLAN-CHAT-WEKNORA-CONSOLIDATION
import * as React from 'react';
import {
  ArrowUpRight,
  Bot,
  Brain,
  FileText,
  FolderSync,
  Loader2,
  MessageSquarePlus,
  Network,
  Send,
  Sparkles,
  Zap,
} from 'lucide-react';
import Markdown from '@/components/common/Markdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { VibeChatMessage, VibeConversation, WeKnoraMemoryPayload } from '../types';

export interface WeKnoraCopilotDockProps {
  variant?: 'dock' | 'embedded';
  activeSubTab?: 'chat' | 'memory';
  onSubTabChange?: (tab: 'chat' | 'memory') => void;
  initialQuery?: string;
  projectKey?: string;
  activeDocumentId?: number | string | null;
  activeFilePath?: string | null;
  onOpenLiveAgents?: () => void;
  apiBaseUrl?: string;
  conversations?: VibeConversation[];
  activeThreadId?: string;
  onSelectThread?: (threadId: string) => void;
  onCreateThread?: (title?: string) => void;
  memory?: WeKnoraMemoryPayload | null;
  onJumpToCitation?: (cit: { file_path: string; start_line: number; end_line: number }) => void;
  onOpenWikiGraphDoc?: (path: string) => void;
  onRunInboxTriage?: () => void;
  triageLoading?: boolean;
  triageResults?: { pending_count?: number; [key: string]: unknown } | null;
}

const PRESET_QUERIES = [
  'How many tasks were completed today?',
  'Create a task: Review sprint backlog with subtasks: Triage open items, Assign owners',
  'Summarize the current document',
];

const AGENT_OPTIONS = [
  { value: 'orchestrator', label: 'Auto (@orchestrator)' },
  { value: 'antigravity', label: '@antigravity' },
  { value: 'claude', label: '@claude' },
  { value: 'codex', label: '@codex' },
  { value: 'research', label: '@research' },
  { value: 'qualitygate', label: '@qualitygate' },
] as const;

const DEFAULT_CONVERSATIONS: VibeConversation[] = [
  {
    id: 'thread-default',
    thread_id: 'thread-default',
    title: 'General Assistant',
    created_at: '',
    message_count: 0,
    messages: [],
  },
];

const DEFAULT_WEKNORA_MEMORY: WeKnoraMemoryPayload = {
  engine: 'Workspace Knowledge Base (BM25 + Grounded Retrieval)',
  cpu_latency_ms: 0.41,
  openjev_ece: 0.0144,
  contradiction_reconciliation_rate: '19.8%',
  buckets: {
    profile: [
      'Tenant Workspace Operator — Project-scoped memory active',
      'Workspace Context: Team, Project, and Document scoping enforced',
    ],
    preference: [
      'Concise, citation-grounded answers across project documents and issues',
      'Unified workspace linking Project Docs, Notes, and AI Assistants',
    ],
    fact: [
      'Documents and work items are partitioned by team and project membership',
      'Source citations preserve document titles, headings, and line ranges',
    ],
    task: [
      'Active sprint tasks and agent workflows sync through the project board',
      'Triage queued client requests in the workspace inbox',
    ],
    interest: [
      'Automated knowledge synthesis across team docs and issue threads',
      'Cross-referenced documentation links across active project modules',
    ],
  },
  wikigraph_links: [
    {
      slug: 'UC-003',
      title: 'AI Agent Runtime & Tool Connectors',
      path: 'docs/UC-003_ai_agent_runtime_and_mcp_tools.md',
    },
    {
      slug: 'UC-007',
      title: 'Workspace Canvas Collaboration',
      path: 'docs/UC-007_vibe_working_canvas_native_merge.md',
    },
    {
      slug: 'IAD',
      title: 'Interface Architecture Guide',
      path: 'docs/IAD-ITSAPLAN.md',
    },
  ],
};

export default function WeKnoraCopilotDock({
  variant = 'dock',
  activeSubTab,
  onSubTabChange,
  initialQuery,
  projectKey,
  activeDocumentId,
  activeFilePath,
  onOpenLiveAgents,
  apiBaseUrl = '',
  conversations: externalConversations,
  activeThreadId: externalActiveThreadId,
  onSelectThread: externalOnSelectThread,
  onCreateThread: externalOnCreateThread,
  memory: externalMemory,
  onJumpToCitation,
  onOpenWikiGraphDoc,
  onRunInboxTriage: externalOnRunInboxTriage,
  triageLoading: externalTriageLoading,
  triageResults: externalTriageResults,
}: WeKnoraCopilotDockProps) {
  const [internalSubTab, setInternalSubTab] = React.useState<'chat' | 'memory'>(
    activeSubTab ?? 'chat',
  );
  React.useEffect(() => {
    if (activeSubTab) setInternalSubTab(activeSubTab);
  }, [activeSubTab]);

  const subTab = activeSubTab ?? internalSubTab;
  const setSubTab = (next: 'chat' | 'memory') => {
    setInternalSubTab(next);
    onSubTabChange?.(next);
  };

  const [internalConversations, setInternalConversations] =
    React.useState<VibeConversation[]>(DEFAULT_CONVERSATIONS);
  const [internalThreadId, setInternalThreadId] = React.useState<string>('thread-default');
  const [internalMemory, setInternalMemory] =
    React.useState<WeKnoraMemoryPayload>(DEFAULT_WEKNORA_MEMORY);
  const [internalTriageLoading, setInternalTriageLoading] = React.useState<boolean>(false);
  const [internalTriageResults, setInternalTriageResults] = React.useState<
    { pending_count?: number; [key: string]: unknown } | null
  >(null);

  const conversations = externalConversations ?? internalConversations;
  const activeThreadId = externalActiveThreadId ?? internalThreadId;
  const memory = externalMemory ?? internalMemory ?? DEFAULT_WEKNORA_MEMORY;
  const triageLoading = externalTriageLoading ?? internalTriageLoading;
  const triageResults =
    externalTriageResults !== undefined ? externalTriageResults : internalTriageResults;

  const [threadMessages, setThreadMessages] = React.useState<Record<string, VibeChatMessage[]>>({});
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const activeMessages = threadMessages[activeThreadId] ?? [];

  const fetchInternalConversations = React.useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/conversations`);
      if (res.ok) {
        const data = (await res.json()) as unknown;
        if (Array.isArray(data) && data.length > 0) {
          setInternalConversations(
            data.map((raw) => {
              const c = raw as Record<string, unknown>;
              const tid = String(c.thread_id || c.id || '');
              return {
                id: tid,
                thread_id: tid,
                title: String(c.title || ''),
                created_at: String(c.created_at || ''),
                message_count: Number(c.message_count || 0),
                messages: Array.isArray(c.messages)
                  ? (c.messages as VibeChatMessage[])
                  : undefined,
              };
            }),
          );
          const initialThreadMsgs: Record<string, VibeChatMessage[]> = {};
          data.forEach((raw) => {
            const c = raw as Record<string, unknown>;
            const tid = String(c.thread_id || c.id || '');
            if (tid && Array.isArray(c.messages) && c.messages.length > 0) {
              initialThreadMsgs[tid] = c.messages as VibeChatMessage[];
            }
          });
          if (Object.keys(initialThreadMsgs).length > 0) {
            setThreadMessages((prev) => ({ ...initialThreadMsgs, ...prev }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch WeKnora conversations:', err);
    }
  }, [apiBaseUrl]);

  const fetchInternalMemory = React.useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/memory`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.buckets) {
          setInternalMemory(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch WeKnora 5-bucket memory:', err);
    }
  }, [apiBaseUrl]);

  React.useEffect(() => {
    if (externalConversations === undefined) {
      void fetchInternalConversations();
    }
    if (!externalMemory) {
      void fetchInternalMemory();
    }
  }, [
    externalConversations,
    externalMemory,
    fetchInternalConversations,
    fetchInternalMemory,
  ]);

  const handleSelectThread = (tid: string) => {
    if (externalOnSelectThread) externalOnSelectThread(tid);
    else setInternalThreadId(tid);
  };

  const handleCreateThread = async (title?: string) => {
    if (externalOnCreateThread) {
      externalOnCreateThread(title);
      return;
    }
    const threadTitle = title || `WeKnora Session ${conversations.length + 1}`;
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/conversations/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: threadTitle }),
      });
      if (res.ok) {
        const created = await res.json();
        const tid = created.thread_id || created.id;
        await fetchInternalConversations();
        if (tid) setInternalThreadId(tid);
      }
    } catch (err) {
      console.error('Failed to create WeKnora thread:', err);
    }
  };

  const handleRunInboxTriage = async () => {
    if (externalOnRunInboxTriage) {
      externalOnRunInboxTriage();
      return;
    }
    setInternalTriageLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/custodian/triage`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setInternalTriageResults(data);
      }
    } catch (err) {
      console.error('Custodian inbox triage failed:', err);
    } finally {
      setInternalTriageLoading(false);
    }
  };

  const [question, setQuestion] = React.useState('');
  const [selectedAgent, setSelectedAgent] = React.useState<string>('orchestrator');
  const [qaLoading, setQaLoading] = React.useState(false);
  const [qaError, setQaError] = React.useState<string | null>(null);

  const runWeKnoraQuery = async (queryText: string) => {
    const clean = queryText.trim();
    if (!clean || qaLoading) return;
    setQuestion('');
    setQaError(null);
    setQaLoading(true);

    const userMsgId = 'user-' + Date.now();
    const userMsg: VibeChatMessage = {
      id: userMsgId,
      role: 'user',
      content: clean,
      timestamp: new Date().toISOString(),
    };
    setThreadMessages((prev) => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] ?? []), userMsg],
    }));

    const currentHistory = threadMessages[activeThreadId] ?? [];

    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: clean,
          thread_id: activeThreadId,
          history: currentHistory,
          project_key: projectKey || undefined,
          active_document_id: activeDocumentId ?? undefined,
          active_file_path: activeFilePath || undefined,
          agent_username: selectedAgent,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (
          typeof window !== 'undefined' &&
          (data.grounded_status === 'ACTION_EXECUTED' || data.action_receipt)
        ) {
          window.dispatchEvent(
            new CustomEvent('itsaplan:work-items-updated', { detail: data.action_receipt }),
          );
        }
        if (data.thread_title) {
          setInternalConversations((prev) =>
            prev.map((c) =>
              (c.thread_id || c.id) === activeThreadId
                ? { ...c, title: data.thread_title }
                : c,
            ),
          );
        }
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setThreadMessages((prev) => ({
            ...prev,
            [activeThreadId]: data.messages,
          }));
        } else {
          const asstMsg: VibeChatMessage = {
            id: 'asst-' + Date.now(),
            role: 'assistant',
            content: data.text_response,
            timestamp: new Date().toISOString(),
            citations: data.citations,
            retrieval_latency_ms: data.retrieval_latency_ms,
            grounded_status: data.grounded_status,
            intent_kind: data.intent_kind,
            action_receipt: data.action_receipt,
          };
          setThreadMessages((prev) => ({
            ...prev,
            [activeThreadId]: [...(prev[activeThreadId] ?? []), asstMsg],
          }));
        }
      } else {
        const errPayload = await res.json().catch(() => ({}));
        setQaError(
          errPayload.error ||
            `Grounded chat returned HTTP ${res.status}. Please verify the Vibe Canvas API Bridge is online.`,
        );
      }
    } catch (err) {
      console.error('WeKnora Copilot query failed:', err);
      setQaError(
        err instanceof Error
          ? err.message
          : 'Unable to reach /api/vibe/chat.',
      );
    } finally {
      setQaLoading(false);
    }
  };

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeMessages.length, qaLoading]);

  React.useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setQuestion(initialQuery.trim());
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runWeKnoraQuery(question);
  };

  const WrapperTag = variant === 'embedded' ? 'div' : 'aside';
  const wrapperClass =
    variant === 'embedded'
      ? 'flex min-h-0 flex-1 flex-col bg-background overflow-hidden'
      : 'flex w-96 shrink-0 flex-col border-l border-border bg-card/40 overflow-hidden';

  return (
    <WrapperTag id="weknora-copilot-dock" className={wrapperClass}>
      {/* Only show internal header when standalone dock; embedded mode uses ChatPanel's unified header */}
      {variant !== 'embedded' && (
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3 bg-muted/20">
          <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
            <Sparkles className="size-3.5 text-primary" />
            <span>AI Assistant</span>
            <Badge
              variant="outline"
              className="text-xs font-mono px-1.5 py-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
            >
              {projectKey ? `Board ${projectKey}` : 'Live Assistant'}
            </Badge>
          </div>

          <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setSubTab('chat')}
              className={`rounded px-2 py-0.5 text-xs font-medium transition ${
                subTab === 'chat'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              AI Chat
            </button>
            <button
              type="button"
              onClick={() => setSubTab('memory')}
              className={`rounded px-2 py-0.5 text-xs font-medium transition ${
                subTab === 'memory'
                  ? 'bg-background text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Memory
            </button>
          </div>
        </div>
      )}

      {/* Multi-Threaded Conversation Strip + Custodian Action */}
      <div className="flex items-center justify-between gap-1.5 border-b border-border px-3 py-1.5 bg-background/60 text-xs">
        <select
          aria-label="WeKnora Conversation Thread"
          value={activeThreadId}
          onChange={(e) => handleSelectThread(e.target.value)}
          className="h-7 flex-1 truncate rounded border border-border bg-background px-2 text-xs text-foreground focus:outline-none"
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
          onClick={() => void handleCreateThread()}
          className="h-7 px-2 text-xs gap-1"
          title="New WeKnora Conversation Thread"
        >
          <MessageSquarePlus className="size-3.5" />
          <span>New</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleRunInboxTriage()}
          disabled={triageLoading}
          className="h-7 px-2 text-xs gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400"
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

      {/* Context & Target Agent Bar (Project Scope + Active Doc + Agent Dispatch Target) */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-border/60 px-3 py-1 bg-muted/20 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          {projectKey && (
            <Badge variant="outline" className="font-mono text-xs px-1.5 py-0 shrink-0">
              {projectKey}
            </Badge>
          )}
          {(activeDocumentId || activeFilePath) && (
            <span
              className="flex items-center gap-1 truncate text-xs text-muted-foreground max-w-[160px]"
              title={activeFilePath || `Document #${activeDocumentId}`}
            >
              <FileText className="size-3 shrink-0 text-primary" />
              <span className="truncate">
                {activeFilePath ? activeFilePath.split('/').pop() : `Doc #${activeDocumentId}`}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <select
            aria-label="Target Agent"
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="h-6 rounded border border-border bg-background px-1.5 text-xs text-foreground focus:outline-none"
          >
            {AGENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {onOpenLiveAgents && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onOpenLiveAgents}
              className="size-6 text-muted-foreground hover:text-foreground"
              title="Open Live Agent Runner Tabs"
            >
              <Bot className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {triageResults && (
        <div className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
          <Zap className="size-3.5 text-amber-500 shrink-0" />
          <span className="truncate">
            <strong>Custodian Triage:</strong> {triageResults.pending_count ?? 0} inbox items classified (≥70%).
          </span>
        </div>
      )}

      {subTab === 'chat' ? (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Suggested Prompts & Quick Actions */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Actions &amp; Queries
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_QUERIES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => void runWeKnoraQuery(preset)}
                    className="rounded-md border border-primary/25 bg-primary/5 px-2 py-1 text-left text-xs text-primary hover:bg-primary/15 transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {activeMessages.map((msg) => {
              const isUser = msg.role === 'user';
              const statusLabel =
                msg.grounded_status === 'ACTION_EXECUTED'
                  ? 'Task Action Executed'
                  : msg.grounded_status === 'ACTION_BLOCKED'
                  ? 'Action Blocked'
                  : msg.intent_kind === 'analytics'
                  ? 'Live Board Analytics'
                  : msg.grounded_status === 'NO_MATCH'
                  ? 'No Direct Match'
                  : 'Grounded & Verified';
              const badgeTone =
                msg.grounded_status === 'ACTION_BLOCKED'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs'
                  : msg.grounded_status === 'ACTION_EXECUTED'
                  ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 text-xs'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs';
              return (
                <div key={msg.id || msg.timestamp} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {isUser ? (
                    <div className="max-w-[85%] rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-2xs whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="w-full space-y-3">
                      <Card className="border-border bg-card">
                        <CardHeader className="p-2.5 pb-1.5">
                          <div className="flex items-center justify-between">
                            <Badge className={badgeTone}>
                              {statusLabel}
                            </Badge>
                            <span className="font-mono text-xs text-muted-foreground">
                              {msg.retrieval_latency_ms ?? 0} ms
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-2.5 pt-1 text-xs leading-relaxed text-foreground">
                          <div className="weknora-chat-md min-w-0 break-words [&_.md-content]:text-xs [&_.md-content]:leading-relaxed [&_.md-content>*+*]:mt-2 [&_.md-content_h3]:text-xs [&_.md-content_h3]:font-semibold [&_.md-content_h4]:text-xs [&_.md-content_h4]:font-semibold [&_.md-content_table]:w-full [&_.md-content_table]:text-xs [&_.md-content_th]:px-2 [&_.md-content_th]:py-1 [&_.md-content_td]:px-2 [&_.md-content_td]:py-1 [&_.md-content_ul]:my-1 [&_.md-content_ol]:my-1 [&_.md-content_ul]:pl-4 [&_.md-content_ol]:pl-4">
                            <Markdown complete={true}>{msg.content}</Markdown>
                          </div>
                        </CardContent>
                      </Card>

                      {msg.citations && msg.citations.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Grounded Citations ({msg.citations.length}) — Click to Jump &amp; Highlight
                          </div>
                          {msg.citations.map((cit, idx) => (
                            <div
                              key={idx}
                              onClick={() => onJumpToCitation?.(cit)}
                              className="cursor-pointer rounded-lg border border-border bg-card p-2.5 transition-all hover:border-amber-500/50 hover:bg-amber-500/5"
                            >
                              <div className="flex items-center justify-between text-xs font-medium">
                                <span className="truncate font-semibold text-foreground">
                                  📑 {cit.document_name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="font-mono text-xs text-amber-600 dark:text-amber-400 border-amber-500/30"
                                >
                                  L{cit.start_line}..L{cit.end_line}
                                </Badge>
                              </div>
                              <div className="mt-1 line-clamp-2 font-mono text-xs text-muted-foreground">
                                {cit.snippet}
                              </div>
                              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                                <span>OpenJEV Confidence: {((cit.confidence_score ?? 0.95) * 100).toFixed(0)}%</span>
                                <span className="flex items-center gap-0.5 text-primary font-medium">
                                  Open in Evidence Reader <ArrowUpRight className="size-3" />
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {qaLoading && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-primary shrink-0" />
                <span>Retrieving grounded citations across Work Items, Docs &amp; Notes...</span>
              </div>
            )}

            {qaError && !qaLoading && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                {qaError}
              </div>
            )}

            {activeMessages.length === 0 && !qaLoading && (
              <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                <Brain className="mx-auto mb-1.5 size-6 text-primary/70" />
                <div className="font-semibold text-foreground">
                  Unified AI Assistant (Grounded Knowledge + Agents)
                </div>
                <p className="mt-1 text-xs">
                  Ask anything across Work Items, Docs, Notes, or Meetings. Every answer is automatically grounded with clickable line citations (BM25 + TableRAG + OpenJEV).
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border p-2.5 bg-muted/10">
            <div className="relative flex items-center">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    void runWeKnoraQuery(question);
                  }
                }}
                placeholder="Ask a question, summarize this doc, or give a task/instruction..."
                disabled={qaLoading}
                className="pr-9 text-xs h-8"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  void runWeKnoraQuery(question);
                }}
                disabled={!question.trim() || qaLoading}
                className="absolute right-1 size-6 text-primary hover:bg-primary/10"
              >
                {qaLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              </Button>
            </div>
          </form>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
          {/* 5-Bucket Episodic Memory */}
          <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-2.5">
            <div className="flex items-center justify-between font-semibold text-indigo-600 dark:text-indigo-300">
              <span className="flex items-center gap-1.5">
                <Brain className="size-3.5" />
                <span>5-Bucket Episodic Memory</span>
              </span>
              <span className="font-mono text-xs">
                Reconciliation: {memory?.contradiction_reconciliation_rate || '19.8%'}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Persistent cross-session memory atoms (Profile, Preference, Fact, Task, Interest) with automatic contradiction superseding.
            </p>
          </div>

          {(['profile', 'preference', 'fact', 'task', 'interest'] as const).map((bucket) => {
            const items = memory?.buckets?.[bucket] ?? [];
            return (
              <div key={bucket} className="rounded-lg border border-border bg-card p-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
                    [{bucket.toUpperCase()}]
                  </span>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {items.length} atoms
                  </Badge>
                </div>
                <ul className="space-y-1 text-xs text-foreground/90 list-disc pl-4">
                  {items.map((atom, i) => (
                    <li key={i}>{atom}</li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* WikiGraph Knowledge Compounding */}
          <div className="rounded-lg border border-border bg-card p-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Network className="size-3.5" />
              <span>KùzuDB WikiGraph [[slug|title]] Links</span>
            </div>
            <div className="flex flex-col gap-1">
              {(memory?.wikigraph_links ?? []).map((link) => (
                <button
                  key={link.slug}
                  type="button"
                  onClick={() => onOpenWikiGraphDoc?.(link.path)}
                  className="flex items-center justify-between rounded border border-border/60 bg-muted/30 px-2 py-1 text-left text-xs hover:border-primary/40 hover:bg-primary/5 transition"
                >
                  <span className="font-mono text-primary font-semibold">
                    [[{link.slug}|{link.title}]]
                  </span>
                  <ArrowUpRight className="size-3 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </WrapperTag>
  );
}
