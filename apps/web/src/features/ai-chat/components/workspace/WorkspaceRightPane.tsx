'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Brain,
  Check,
  Copy,
  Cpu,
  ExternalLink,
  FileCode2,
  FilePlus2,
  FolderOpen,
  Maximize2,
  MessageSquare,
  ShieldCheck,
  Users,
  Wrench,
  X,
  Download,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Direction } from 'radix-ui';
import type { AgentApprovalRequestDto } from '@/lib/api/endpoints/agents';
import { fetchProjectDirectory } from '@/lib/api/endpoints/directory';
import { createDocument } from '@/lib/api/endpoints/documents';
import { qk } from '@/services/queryKeys';
import { usePersistedWidth } from '@/hooks/usePersistedWidth';
import { directoryPath, documentPath, teamSectionPath } from '@/utils/paths';
import { cn } from '@/lib/utils';
import ResizeGrip from '@/components/common/ResizeGrip';
import Markdown from '@/components/common/Markdown';
import { AgentRunnerStatus } from '@/components/common/agent-chat/AgentRunnerStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  formatModelDisplayLabel,
  type ActiveChatSnapshot,
  type ExtractedArtifact,
  type RightPaneTab,
} from '../../types/workspaceControls';

function artifactToMarkdown(artifact: ExtractedArtifact): string {
  if (artifact.kind === 'markdown') return artifact.content;
  if (artifact.kind === 'diff') return `\`\`\`diff\n${artifact.content}\n\`\`\``;
  if (artifact.kind === 'mermaid') return `\`\`\`mermaid\n${artifact.content}\n\`\`\``;
  return `\`\`\`${artifact.language ?? ''}\n${artifact.content}\n\`\`\``;
}

function artifactExt(artifact: ExtractedArtifact): string {
  if (artifact.kind === 'diff') return 'diff';
  if (artifact.kind === 'mermaid') return 'mmd';
  if (artifact.kind === 'markdown') return 'md';
  return (artifact.language || 'txt').replace(/[^a-zA-Z0-9_-]/g, '') || 'txt';
}

export function WorkspaceRightPane({
  projectKey,
  teamRef,
  activeTab,
  onTabChange,
  onClose,
  snapshot,
  selectedArtifactId,
  onSelectArtifact,
  pendingApprovals,
  onDecideApproval,
  decidingApproval,
  onOpenSources,
}: {
  projectKey: string;
  teamRef: string;
  activeTab: RightPaneTab;
  onTabChange: (tab: RightPaneTab) => void;
  onClose: () => void;
  snapshot: ActiveChatSnapshot | null;
  selectedArtifactId: string | null;
  onSelectArtifact: (id: string) => void;
  pendingApprovals: AgentApprovalRequestDto[];
  onDecideApproval: (approvalId: string, decision: 'approved' | 'rejected', note?: string) => void;
  decidingApproval: boolean;
  onOpenSources?: () => void;
}) {
  const t = useTranslations('aiChat');
  const direction = Direction.useDirection();
  const directoryQuery = useQuery({
    queryKey: qk.projectDirectory(projectKey),
    queryFn: () => fetchProjectDirectory(projectKey),
    enabled: Boolean(projectKey) && activeTab === 'inspector',
  });
  const { width, setWidth } = usePersistedWidth(
    `aiChat:workspace:rightPaneWidth:${projectKey}`,
    420,
    340,
    680,
  );
  const [artifactViewMode, setArtifactViewMode] = useState<'preview' | 'source'>('preview');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedOpen, setExpandedOpen] = useState(false);
  const [savingDoc, setSavingDoc] = useState(false);
  const [savedDocMap, setSavedDocMap] = useState<Record<string, number>>({});
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  const [copiedSession, setCopiedSession] = useState(false);

  const artifacts = snapshot?.artifacts ?? [];
  const activeArtifact =
    artifacts.find((a) => a.id === selectedArtifactId) ??
    artifacts[artifacts.length - 1] ??
    null;

  const activityCount =
    (snapshot?.thinkingCount ?? 0) +
    (snapshot?.toolCallCount ?? 0) +
    (snapshot?.subagentCount ?? 0);

  async function copyText(id: string, text: string) {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1600);
  }

  function downloadArtifact(artifact: ExtractedArtifact) {
    if (typeof window === 'undefined') return;
    const slug =
      artifact.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'artifact';
    const blob = new Blob([artifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.${artifactExt(artifact)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function saveArtifactToDocs(artifact: ExtractedArtifact) {
    if (savingDoc || savedDocMap[artifact.id] != null) return;
    setSavingDoc(true);
    try {
      const created = await createDocument(projectKey, {
        title: artifact.title || 'AI Artifact',
        content: artifactToMarkdown(artifact),
      });
      setSavedDocMap((prev) => ({ ...prev, [artifact.id]: created.id }));
    } finally {
      setSavingDoc(false);
    }
  }

  const tabs: {
    id: RightPaneTab;
    label: string;
    count?: number;
    icon: typeof ShieldCheck;
    highlight?: boolean;
  }[] = [
    { id: 'artifacts', label: t('tabArtifacts'), count: artifacts.length, icon: FileCode2 },
    {
      id: 'approvals',
      label: t('tabApprovals'),
      count: pendingApprovals.length,
      icon: ShieldCheck,
      highlight: pendingApprovals.length > 0,
    },
    { id: 'activity', label: t('tabActivity'), count: activityCount, icon: Activity },
    { id: 'inspector', label: t('tabInspector'), icon: Cpu },
  ];

  type MsgPart = ActiveChatSnapshot['messages'][number]['parts'][number];
  type ActivityEntry =
    | { key: string; kind: 'thinking'; part: Extract<MsgPart, { type: 'thinking' }> }
    | { key: string; kind: 'tool'; part: Extract<MsgPart, { type: 'tool' }> }
    | { key: string; kind: 'subagent'; part: Extract<MsgPart, { type: 'subagent' }> };

  const activityItems: ActivityEntry[] = [];
  for (const msg of snapshot?.messages ?? []) {
    msg.parts.forEach((part, idx) => {
      if (part.type === 'thinking') {
        activityItems.push({ key: `${msg.id}:t:${idx}`, kind: 'thinking', part });
      } else if (part.type === 'tool') {
        activityItems.push({ key: `${msg.id}:tool:${part.toolCallId || idx}`, kind: 'tool', part });
      } else if (part.type === 'subagent') {
        activityItems.push({
          key: `${msg.id}:sub:${part.subagentId || idx}`,
          kind: 'subagent',
          part,
        });
      }
    });
  }

  const finopsHref = teamSectionPath(teamRef, 'ai-agents');

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        data-testid="approvals-drawer"
        style={{ width }}
        className="fixed inset-y-0 right-0 z-40 flex max-w-[92vw] shrink-0 flex-col border-s border-border bg-background shadow-2xl lg:static lg:z-auto lg:bg-muted/15 lg:shadow-none"
      >
        <ResizeGrip
          label={t('resizePanel')}
          className="absolute inset-y-0 start-0 z-10 hidden lg:block"
          onDrag={(deltaX) => setWidth(width + (direction === 'rtl' ? deltaX : -deltaX))}
        />

        <div className="flex items-center justify-between gap-2 border-b border-border px-2.5 py-2">
          <div
            role="tablist"
            aria-label={t('sidePane')}
            className="flex min-w-0 flex-1 items-center gap-0.5 rounded-full bg-muted/70 p-0.5"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  data-testid={`right-pane-tab-${tab.id}`}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    'flex h-8 min-w-0 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-medium transition',
                    selected
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-3 shrink-0',
                      tab.highlight && 'text-amber-500',
                    )}
                  />
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && tab.count > 0 && (
                    <span
                      className={cn(
                        'rounded-full px-1 font-mono text-xs',
                        tab.highlight
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="lg:hidden"
            onClick={onClose}
            aria-label="Close side pane"
          >
            <X className="size-3.5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {activeTab === 'artifacts' && (
            <div className="space-y-3" data-testid="right-pane-artifacts">
              {artifacts.length === 0 || !activeArtifact ? (
                <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                  {t('noArtifacts')}
                </p>
              ) : (
                <>
                  {artifacts.length > 1 && (
                    <div className="flex flex-wrap gap-1">
                      {artifacts.map((art) => (
                        <button
                          key={art.id}
                          type="button"
                          onClick={() => onSelectArtifact(art.id)}
                          className={cn(
                            'max-w-full truncate rounded-full border px-2 py-0.5 text-xs font-medium transition',
                            art.id === activeArtifact.id
                              ? 'border-primary/40 bg-secondary text-foreground'
                              : 'border-border/70 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                          )}
                        >
                          {art.title}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="rounded-xl border border-border bg-card p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-foreground">
                          {activeArtifact.title}
                        </div>
                        <div className="font-mono text-xs uppercase text-muted-foreground">
                          {activeArtifact.kind}
                          {activeArtifact.language ? ` · ${activeArtifact.language}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 rounded-full bg-muted/70 p-0.5">
                        <button
                          type="button"
                          onClick={() => setArtifactViewMode('preview')}
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            artifactViewMode === 'preview'
                              ? 'bg-background text-foreground shadow-2xs'
                              : 'text-muted-foreground',
                          )}
                        >
                          {t('preview')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setArtifactViewMode('source')}
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            artifactViewMode === 'source'
                              ? 'bg-background text-foreground shadow-2xs'
                              : 'text-muted-foreground',
                          )}
                        >
                          {t('source')}
                        </button>
                      </div>
                    </div>

                    <div className="mb-2 flex flex-wrap items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 px-2.5 text-xs"
                        onClick={() => void copyText(activeArtifact.id, activeArtifact.content)}
                      >
                        {copiedId === activeArtifact.id ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                        <span>{copiedId === activeArtifact.id ? t('copied') : t('copy')}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => downloadArtifact(activeArtifact)}
                      >
                        <Download className="size-3" />
                        <span>Download</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => setExpandedOpen(true)}
                      >
                        <Maximize2 className="size-3" />
                        <span>{t('expandArtifact')}</span>
                      </Button>
                      {savedDocMap[activeArtifact.id] != null ? (
                        <Link
                          href={documentPath(projectKey, savedDocMap[activeArtifact.id]!)}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 text-xs font-medium text-emerald-600 dark:text-emerald-300"
                        >
                          <ExternalLink className="size-3" />
                          <span>Open Doc</span>
                        </Link>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={savingDoc}
                          className="h-7 gap-1 px-2 text-xs"
                          onClick={() => void saveArtifactToDocs(activeArtifact)}
                        >
                          <FilePlus2 className="size-3" />
                          <span>{savingDoc ? 'Saving…' : 'Save to Docs'}</span>
                        </Button>
                      )}
                    </div>

                    <div className="max-h-[60vh] overflow-auto">
                      {artifactViewMode === 'source' ? (
                        <pre className="whitespace-pre-wrap rounded-lg bg-muted/50 p-2.5 font-mono text-xs leading-relaxed text-foreground">
                          {activeArtifact.content}
                        </pre>
                      ) : (
                        <Markdown>{artifactToMarkdown(activeArtifact)}</Markdown>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="space-y-2" data-testid="right-pane-approvals">
              {pendingApprovals.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                  No actions awaiting your approval. High-impact mutations requested by AI agents appear here for sign-off.
                </p>
              ) : (
                pendingApprovals.map((item) => (
                  <div
                    key={item.id}
                    data-testid={`approval-card-${item.id}`}
                    className="space-y-2 rounded-lg border border-border bg-card p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">{item.toolName}</span>
                      <Badge variant="secondary" className="font-mono text-xs uppercase">
                        {item.kind}
                      </Badge>
                    </div>
                    {Object.keys(item.payload ?? {}).length > 0 && (() => {
                      const payload = item.payload as Record<string, unknown>;
                      const sod = payload.sod as Record<string, unknown> | undefined;
                      return (
                        <div className="space-y-1.5 rounded-md bg-muted/45 p-2.5 text-xs">
                          {sod ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant="outline" className="font-mono text-xs">
                                SoD: {String(sod.status ?? 'PENDING')}
                              </Badge>
                              {sod.approver_id != null && (
                                <span className="text-muted-foreground">
                                  Approver: <strong className="text-foreground">{String(sod.approver_id)}</strong>
                                </span>
                              )}
                              {sod.executor_id != null && (
                                <span className="text-muted-foreground">
                                  Executor: <strong className="text-foreground">{String(sod.executor_id)}</strong>
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-muted-foreground">
                              {Object.entries(payload)
                                .slice(0, 3)
                                .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
                                .join(' · ')}
                            </div>
                          )}
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              {t('source')}
                            </summary>
                            <pre className="mt-1 max-h-28 overflow-auto rounded bg-muted/60 p-2 font-mono text-xs text-muted-foreground">
                              {JSON.stringify(item.payload, null, 2)}
                            </pre>
                          </details>
                        </div>
                      );
                    })()}
                    <Input
                      value={approvalNotes[item.id] ?? ''}
                      onChange={(e) =>
                        setApprovalNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder={t('optionalNote')}
                      className="h-8 text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={decidingApproval}
                        onClick={() =>
                          onDecideApproval(
                            item.id,
                            'approved',
                            approvalNotes[item.id]?.trim() || undefined,
                          )
                        }
                        className="h-8 gap-1"
                      >
                        <Check className="size-3" /> {t('approve')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={decidingApproval}
                        onClick={() =>
                          onDecideApproval(
                            item.id,
                            'rejected',
                            approvalNotes[item.id]?.trim() || undefined,
                          )
                        }
                        className="h-8 gap-1"
                      >
                        <X className="size-3" /> {t('reject')}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-2" data-testid="right-pane-activity">
              {snapshot && snapshot.status !== 'ready' && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-foreground">
                  {snapshot.activeTool
                    ? `Running: ${snapshot.activeTool}`
                    : snapshot.status === 'queued'
                      ? 'Waiting for local runner…'
                      : 'Streaming response…'}
                </div>
              )}
              {activityItems.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                  {t('noActivity')}
                </p>
              ) : (
                activityItems.map((entry) => {
                  if (entry.kind === 'thinking') {
                    return (
                      <details
                        key={entry.key}
                        className="rounded-lg border border-border/70 bg-card px-3 py-2 text-xs"
                      >
                        <summary className="flex cursor-pointer items-center gap-1.5 font-medium text-foreground">
                          <Brain className="size-3.5 text-primary" />
                          <span>Reasoning</span>
                          <span className="ms-auto font-mono text-xs text-muted-foreground">
                            {entry.part.text.length} chars
                          </span>
                        </summary>
                        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                          {entry.part.text}
                        </pre>
                      </details>
                    );
                  }
                  if (entry.kind === 'tool') {
                    return (
                      <details
                        key={entry.key}
                        className="rounded-lg border border-border/70 bg-card px-3 py-2 text-xs"
                      >
                        <summary className="flex cursor-pointer items-center gap-1.5 font-mono text-xs text-foreground">
                          <Wrench className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{entry.part.toolName}</span>
                        </summary>
                        {entry.part.args && (
                          <pre className="mt-2 max-h-32 overflow-auto rounded bg-muted/40 p-2 font-mono text-xs text-muted-foreground">
                            {entry.part.args}
                          </pre>
                        )}
                        {entry.part.result && (
                          <pre className="mt-1.5 max-h-32 overflow-auto rounded bg-muted/40 p-2 font-mono text-xs text-muted-foreground">
                            {entry.part.result}
                          </pre>
                        )}
                      </details>
                    );
                  }
                  return (
                    <div
                      key={entry.key}
                      className="rounded-lg border border-border/70 bg-card px-3 py-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          Subagent · {entry.part.role}
                        </span>
                        <Badge variant="outline" className="font-mono text-xs uppercase">
                          {entry.part.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">{entry.part.task}</p>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'inspector' && (
            <div className="space-y-4 text-xs" data-testid="right-pane-inspector">
              <div className="space-y-2 rounded-lg border border-border/70 bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    {t('projectSourcesTitle')}
                  </span>
                  {onOpenSources && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={onOpenSources}
                    >
                      {t('configureSources')}
                    </Button>
                  )}
                </div>
                {directoryQuery.data ? (
                  <div className="space-y-1.5 text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5">
                        <FolderOpen className="size-3.5 text-primary" />
                        <span>{t('sourcesLocations')}</span>
                      </span>
                      <span className="font-mono text-foreground">
                        {directoryQuery.data.counts.storageLocations}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5">
                        <MessageSquare className="size-3.5 text-primary" />
                        <span>{t('sourcesChannels')}</span>
                      </span>
                      <span className="font-mono text-foreground">
                        {directoryQuery.data.counts.channels}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3.5 text-primary" />
                        <span>{t('sourcesContacts')}</span>
                      </span>
                      <span className="font-mono text-foreground">
                        {directoryQuery.data.counts.contacts}
                      </span>
                    </div>
                    <Link
                      href={directoryPath(projectKey)}
                      className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-primary hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      <span>{t('openFullDirectory')}</span>
                    </Link>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {directoryQuery.isLoading ? t('loadingSources') : '—'}
                  </p>
                )}
              </div>

              {!snapshot ? (
                <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                  No active session.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {snapshot.agent.name}
                    </div>
                    <div className="divide-y divide-border/60 rounded-lg border border-border/70 bg-card">
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="text-muted-foreground">{t('inspectorRuntime')}</span>
                        {snapshot.agent.kind === 'external' ? (
                          <AgentRunnerStatus agent={snapshot.agent} compact />
                        ) : (
                          <span className="font-medium text-foreground">{t('cloudRuntime')}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="text-muted-foreground">{t('effectiveModel')}</span>
                        <span className="truncate font-mono text-xs text-foreground">
                          {formatModelDisplayLabel(
                            snapshot.runOptions.model,
                            snapshot.agent,
                            snapshot.agent.kind === 'internal'
                              ? t('modelDefault')
                              : t('runnerDefault'),
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="text-muted-foreground">{t('mode')}</span>
                        <span className="font-mono uppercase text-foreground">
                          {snapshot.runOptions.mode ?? 'build'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="text-muted-foreground">{t('effort')}</span>
                        <span className="font-mono uppercase text-foreground">
                          {snapshot.runOptions.effort ?? 'high'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="text-muted-foreground">{t('extendedThinking')}</span>
                        <span className="font-medium text-foreground">
                          {(snapshot.runOptions.thinking ?? true) ? 'On' : 'Off'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="text-muted-foreground">{t('permissions')}</span>
                        <span className="font-mono uppercase text-foreground">
                          {snapshot.runOptions.permissionMode ?? 'ask'}
                        </span>
                      </div>
                      {snapshot.runOptions.temperature != null && (
                        <div className="flex items-center justify-between gap-2 px-3 py-2">
                          <span className="text-muted-foreground">{t('temperature')}</span>
                          <span className="font-mono text-foreground">
                            {snapshot.runOptions.temperature}
                          </span>
                        </div>
                      )}
                      {snapshot.runOptions.maxSteps != null && (
                        <div className="flex items-center justify-between gap-2 px-3 py-2">
                          <span className="text-muted-foreground">{t('maxSteps')}</span>
                          <span className="font-mono text-foreground">
                            {snapshot.runOptions.maxSteps}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="text-muted-foreground">{t('contextWindow')}</span>
                        <span className="font-mono text-foreground">
                          {snapshot.contextTokens != null
                            ? `${snapshot.contextTokens.toLocaleString()} tokens`
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {snapshot.cliSessionId && (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-card px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">{t('sessionLabel')}</div>
                        <div className="truncate font-mono text-xs text-foreground">
                          {snapshot.cliSessionId}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          void navigator.clipboard?.writeText(snapshot.cliSessionId!);
                          setCopiedSession(true);
                          setTimeout(() => setCopiedSession(false), 1500);
                        }}
                        title={t('copySession')}
                      >
                        {copiedSession ? (
                          <Check className="size-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={finopsHref}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      <ExternalLink className="size-3" />
                      <span>Agent & Budget Settings</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      {activeArtifact && (
        <Dialog open={expandedOpen} onOpenChange={setExpandedOpen}>
          <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm">
                <span>{activeArtifact.title}</span>
                <Badge variant="secondary" className="font-mono text-xs uppercase">
                  {activeArtifact.kind}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            {artifactViewMode === 'source' ? (
              <pre className="overflow-auto rounded-lg bg-muted/50 p-3 font-mono text-xs">
                {activeArtifact.content}
              </pre>
            ) : (
              <Markdown>{artifactToMarkdown(activeArtifact)}</Markdown>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
