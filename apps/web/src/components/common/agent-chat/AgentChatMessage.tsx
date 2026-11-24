'use client';

import { useState } from 'react';
import { Brain, Check, Copy, Download, ExternalLink, FilePlus2, PanelRightOpen } from 'lucide-react';
import type { ChatMessage } from '@/hooks/useAgentChat';
import type { ChatViewPreferences } from '@/features/ai-chat/types/workspaceControls';
import { createDocument } from '@/lib/api/endpoints/documents';
import { documentPath } from '@/utils/paths';
import { cn } from '@/lib/utils';
import type {
  AiChatApprovalPart,
  AiChatArtifactPart,
  AiChatPart,
  AiChatSubagentPart,
  AiChatToolPart,
} from '@/lib/api/endpoints/agentChat';
import { formatLongDate, formatTime } from '@/utils/dates';
import Markdown from '@/components/common/Markdown';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import { Marker, MarkerContent } from '@/components/ui/marker';
import { Message, MessageContent, MessageFooter } from '@/components/ui/message';
import { MessageScrollerItem } from '@/components/ui/message-scroller';
import AgentChatToolCalls from './AgentChatToolCalls';
import AgentChatUserText from './AgentChatUserText';
import { useTranslations } from 'next-intl';

type Block =
  | { kind: 'text'; text: string }
  | { kind: 'thinking'; text: string }
  | { kind: 'tools'; tools: AiChatToolPart[] }
  | { kind: 'approval'; approval: AiChatApprovalPart }
  | { kind: 'artifact'; artifact: AiChatArtifactPart }
  | { kind: 'subagent'; subagent: AiChatSubagentPart };

function blocksOf(parts: AiChatPart[]): Block[] {
  const blocks: Block[] = [];
  for (const part of parts) {
    if (part.type === 'text') {
      blocks.push({ kind: 'text', text: part.text });
      continue;
    }
    if (part.type === 'thinking') {
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'thinking') last.text += part.text;
      else blocks.push({ kind: 'thinking', text: part.text });
      continue;
    }
    if (part.type === 'approval') {
      blocks.push({ kind: 'approval', approval: part });
      continue;
    }
    if (part.type === 'artifact') {
      blocks.push({ kind: 'artifact', artifact: part });
      continue;
    }
    if (part.type === 'subagent') {
      blocks.push({ kind: 'subagent', subagent: part });
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (last?.kind === 'tools') last.tools.push(part);
    else blocks.push({ kind: 'tools', tools: [part] });
  }
  return blocks;
}

function artifactFileExtension(artifact: AiChatArtifactPart): string {
  if (artifact.kind === 'diff') return 'diff';
  if (artifact.kind === 'mermaid') return 'mmd';
  if (artifact.kind === 'markdown') return 'md';
  return (artifact.language || 'txt').replace(/[^a-zA-Z0-9_-]/g, '') || 'txt';
}

function ArtifactCard({
  artifact,
  body,
  complete,
  projectKey,
  onOpenArtifact,
}: {
  artifact: AiChatArtifactPart;
  body: string;
  complete: boolean;
  projectKey?: string;
  onOpenArtifact?: (artifactId: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedDocId, setSavedDocId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleCopy() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    await navigator.clipboard.writeText(artifact.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleDownload() {
    if (typeof window === 'undefined') return;
    const slug =
      artifact.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'artifact';
    const blob = new Blob([artifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slug}.${artifactFileExtension(artifact)}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function handleSaveToDocs() {
    if (!projectKey || saving || savedDocId != null) return;
    setSaving(true);
    setSaveError(null);
    try {
      const created = await createDocument(projectKey, {
        title: artifact.title || 'AI Artifact',
        content: body,
      });
      setSavedDocId(created.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      data-testid="chat-artifact-card"
      className="w-full rounded-xl border border-border bg-card p-3"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2 text-xs font-medium">
        <div className="flex items-center gap-2">
          <span>{artifact.title}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs uppercase text-muted-foreground">
            {artifact.kind}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {onOpenArtifact && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="artifact-open-split-btn"
              onClick={() => onOpenArtifact(artifact.artifactId)}
              className="h-7 gap-1 px-2 text-xs"
            >
              <PanelRightOpen className="size-3" />
              <span>Split View</span>
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="artifact-copy-btn"
            onClick={() => void handleCopy()}
            className="h-7 gap-1 px-2 text-xs"
          >
            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="artifact-download-btn"
            onClick={handleDownload}
            className="h-7 gap-1 px-2 text-xs"
          >
            <Download className="size-3" />
            <span>Download</span>
          </Button>
          {projectKey &&
            (savedDocId != null ? (
              <a
                href={documentPath(projectKey, savedDocId)}
                data-testid="artifact-saved-doc-link"
                className="inline-flex h-7 items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-300"
              >
                <ExternalLink className="size-3" />
                <span>Saved — Open Doc</span>
              </a>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="artifact-save-doc-btn"
                disabled={saving}
                onClick={() => void handleSaveToDocs()}
                className="h-7 gap-1 px-2 text-xs"
              >
                <FilePlus2 className="size-3" />
                <span>{saving ? 'Saving…' : 'Save to Docs'}</span>
              </Button>
            ))}
        </div>
      </div>
      {saveError && <p className="mb-2 text-xs text-destructive">{saveError}</p>}
      <Markdown complete={complete}>{body}</Markdown>
    </div>
  );
}

export default function AgentChatMessage({
  message,
  showDate,
  complete = true,
  onDecideApproval,
  projectKey,
  viewPrefs,
  onOpenArtifact,
}: {
  message: ChatMessage;
  showDate: boolean;
  complete?: boolean;
  onDecideApproval?: (approvalId: string, decision: 'approved' | 'rejected') => void;
  projectKey?: string;
  viewPrefs?: Partial<ChatViewPreferences>;
  onOpenArtifact?: (artifactId: string) => void;
}) {
  const t = useTranslations('common.agentChat');
  const isUser = message.role === 'user';
  const compact = viewPrefs?.density === 'compact';
  const thinkingVisibility = viewPrefs?.thinkingVisibility ?? 'collapsed';
  const toolsVisibility = viewPrefs?.toolsVisibility ?? 'collapsed';
  const showTimestamps = viewPrefs?.showTimestamps ?? true;

  return (
    <MessageScrollerItem
      messageId={message.id}
      scrollAnchor={isUser}
      className={cn(
        'flex flex-col motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-bottom-1',
        compact ? 'gap-3' : 'gap-6',
      )}
    >
      {showDate && (
        <Marker variant="separator">
          <MarkerContent>{formatLongDate(message.createdAt)}</MarkerContent>
        </Marker>
      )}
      <Message align={isUser ? 'end' : 'start'}>
        <MessageContent>
          <Bubble variant={isUser ? 'muted' : 'ghost'} className={cn('gap-2', !isUser && 'w-full')}>
            {blocksOf(message.parts).map((block, index) => {
              if (block.kind === 'tools') {
                if (toolsVisibility === 'hidden') return null;
                return (
                  <AgentChatToolCalls
                    key={`${index}-${toolsVisibility}`}
                    tools={block.tools}
                    defaultOpen={toolsVisibility === 'expanded'}
                  />
                );
              }
              if (block.kind === 'thinking') {
                if (thinkingVisibility === 'hidden') return null;
                return (
                  <details
                    key={`${index}-${thinkingVisibility}`}
                    open={thinkingVisibility === 'expanded'}
                    data-testid="chat-thinking-disclosure"
                    className="w-full rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
                  >
                    <summary className="flex cursor-pointer items-center gap-1.5 font-medium text-foreground">
                      <Brain className="size-3.5 text-primary" />
                      <span>Reasoning Trace</span>
                      <span className="ms-auto font-mono text-xs text-muted-foreground">
                        {block.text.length} chars
                      </span>
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                      {block.text}
                    </pre>
                  </details>
                );
              }
              if (block.kind === 'subagent') {
                const { subagent } = block;
                return (
                  <div
                    key={index}
                    data-testid="chat-subagent-node"
                    className="w-full rounded-lg border border-border/70 bg-muted/25 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">
                        Subagent · {subagent.role}
                      </span>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 font-mono text-xs uppercase',
                          subagent.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                            : subagent.status === 'failed'
                              ? 'bg-destructive/15 text-destructive'
                              : 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
                        )}
                      >
                        {subagent.status}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{subagent.task}</p>
                    {subagent.summary && (
                      <p className="mt-1 border-t border-border/50 pt-1 text-foreground">
                        {subagent.summary}
                      </p>
                    )}
                  </div>
                );
              }
              if (block.kind === 'approval') {
                const { approval } = block;
                const status = approval.status ?? 'pending';
                return (
                  <div
                    key={index}
                    data-testid="chat-hitl-approval-card"
                    className="w-full rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">
                        Approval Required: <code className="font-mono">{approval.toolName}</code>
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs uppercase text-muted-foreground">
                        {status}
                      </span>
                    </div>
                    {approval.args && (
                      <pre className="mt-2 max-h-36 overflow-auto rounded bg-muted/60 p-2 font-mono text-xs text-muted-foreground">
                        {approval.args}
                      </pre>
                    )}
                    {status === 'pending' && onDecideApproval && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onDecideApproval(approval.approvalId, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onDecideApproval(approval.approvalId, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              }
              if (block.kind === 'artifact') {
                const { artifact } = block;
                const body =
                  artifact.kind === 'diff'
                    ? `\`\`\`diff\n${artifact.content}\n\`\`\``
                    : artifact.kind === 'mermaid'
                      ? `\`\`\`mermaid\n${artifact.content}\n\`\`\``
                      : artifact.kind === 'markdown'
                        ? artifact.content
                        : `\`\`\`${artifact.language ?? ''}\n${artifact.content}\n\`\`\``;
                return (
                  <ArtifactCard
                    key={index}
                    artifact={artifact}
                    body={body}
                    complete={complete}
                    projectKey={projectKey}
                    onOpenArtifact={onOpenArtifact}
                  />
                );
              }
              return (
                <BubbleContent key={index} className={cn(!isUser && 'w-full')}>
                  {isUser ? (
                    <AgentChatUserText text={block.text} />
                  ) : (
                    <Markdown complete={complete}>{block.text}</Markdown>
                  )}
                </BubbleContent>
              );
            })}
          </Bubble>
          {message.error && <p className="text-xs text-destructive">{message.error}</p>}
          {(showTimestamps || message.stopped) && (
            <MessageFooter>
              {message.stopped
                ? `${t('stopped')} · ${formatTime(message.createdAt)}`
                : formatTime(message.createdAt)}
            </MessageFooter>
          )}
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}
