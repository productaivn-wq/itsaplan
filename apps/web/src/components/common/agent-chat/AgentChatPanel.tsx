'use client';

import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type ReactNode } from 'react';
import { ArrowUp, Bot, Compass, Paperclip, RotateCw, Square, X } from 'lucide-react';
import {
  uploadChatAttachment,
  type ChatAttachment,
  type ChatRunOptions,
} from '@/lib/api/endpoints/agentChat';
import type { ChatViewPreferences } from '@/features/ai-chat/types/workspaceControls';
import type { AiAgent } from '@/lib/api/endpoints/agents';
import { mediaUrl } from '@/lib/api/core/media';
import { isImageAttachmentFilename } from '@/lib/markdown';
import type { ChatMessage, ChatStatus, PendingMessage } from '@/hooks/useAgentChat';
import { AgentChatTranscript } from './AgentChatTranscript';
import { AgentRunnerStatus } from './AgentRunnerStatus';
import { isRunnerOnline } from './runnerOnline';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { MessageScrollerProvider } from '@/components/ui/message-scroller';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const MAX_ATTACHMENTS = 10;

const IMAGE_MIME_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
};

export interface StagedChatAttachment extends ChatAttachment {
  previewUrl?: string;
}

// Extracts pasted or dropped files from a DataTransfer object.
// Handles OS screenshots (Win+Shift+S, PrtScn, macOS screenshot) that arrive via
// clipboardData.items with generic names ("image.png" or "") by synthesizing a
// unique timestamped filename (pasted-image-<timestamp>-<index>.<ext>).
export function extractClipboardFiles(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer) return [];
  const extracted: File[] = [];
  const seenSignatures = new Set<string>();
  const now = Date.now();

  const normalizeClipboardFile = (rawFile: File, idx: number): File => {
    const rawName = (rawFile.name || '').trim();
    const mime = (rawFile.type || '').toLowerCase();
    const isGenericClipboardImage =
      !rawName || /^image\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(rawName) || rawName === 'blob';
    if (isGenericClipboardImage && (mime.startsWith('image/') || !rawName)) {
      const ext = IMAGE_MIME_EXTENSION[mime] || 'png';
      const named = `pasted-image-${now}-${idx + 1}.${ext}`;
      return new File([rawFile], named, {
        type: rawFile.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        lastModified: rawFile.lastModified || now,
      });
    }
    return rawFile;
  };

  if (dataTransfer.items && dataTransfer.items.length > 0) {
    Array.from(dataTransfer.items).forEach((item, idx) => {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          const sig = `${file.size}:${file.type}:${file.name}`;
          if (!seenSignatures.has(sig)) {
            seenSignatures.add(sig);
            extracted.push(normalizeClipboardFile(file, idx));
          }
        }
      }
    });
  }

  if (extracted.length === 0 && dataTransfer.files && dataTransfer.files.length > 0) {
    Array.from(dataTransfer.files).forEach((file, idx) => {
      const sig = `${file.size}:${file.type}:${file.name}`;
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        extracted.push(normalizeClipboardFile(file, idx));
      }
    });
  }

  return extracted;
}

function isImageAttachment(attachment: Pick<ChatAttachment, 'filename' | 'contentType'>): boolean {
  return (
    /^image\//i.test(attachment.contentType || '') ||
    isImageAttachmentFilename(attachment.filename || '')
  );
}

// The running transcript and the composer for one agent conversation. The
// conversation state lives above this panel (in the agent chat host), so it is
// presentational: it renders what it is given and reports sends.
export function AgentChatPanel({
  agent,
  messages,
  status,
  activeTool,
  pending,
  onSend,
  onStop,
  onRemovePending,
  onSteerPending,
  onReset,
  onDecideApproval,
  onSwitchToCloudAgent,
  composerStart,
  composerEnd,
  hasEarlierMessages,
  isLoadingEarlier,
  onLoadEarlier,
  projectKey,
  viewPrefs,
  runOptions,
  onOpenArtifact,
  onSlashCommandAction,
  onResetMode,
  draftKey,
  onDraftChange,
}: {
  agent: AiAgent;
  messages: ChatMessage[];
  status: ChatStatus;
  activeTool: string | null;
  pending: PendingMessage[];
  onSend: (prompt: string, attachmentIds?: string[]) => void;
  onStop: () => void;
  onRemovePending: (id: string) => void;
  onSteerPending?: (id: string) => void;
  onReset?: () => void;
  onDecideApproval?: (approvalId: string, decision: 'approved' | 'rejected') => void;
  onSwitchToCloudAgent?: () => void;
  composerStart?: ReactNode;
  composerEnd?: ReactNode;
  hasEarlierMessages?: boolean;
  isLoadingEarlier?: boolean;
  onLoadEarlier?: () => void;
  projectKey?: string;
  viewPrefs?: Partial<ChatViewPreferences>;
  runOptions?: ChatRunOptions;
  onOpenArtifact?: (artifactId: string) => void;
  onSlashCommandAction?: (cmd: 'model' | 'clear') => void;
  onResetMode?: () => void;
  draftKey?: string;
  onDraftChange?: (hasDraft: boolean) => void;
}) {
  const t = useTranslations('common.agentChat');
  const tAiChat = useTranslations('aiChat');
  const [input, setInput] = useState('');
  const inputRef = useRef(input);
  inputRef.current = input;
  const [slashIdx, setSlashIdx] = useState(0);
  const [attachments, setAttachments] = useState<StagedChatAttachment[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!draftKey || inputRef.current.length > 0) return;
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) {
        setInput(saved);
        onDraftChange?.(true);
      }
    } catch {
      // Ignore storage errors in restricted environments.
    }
  }, [draftKey, onDraftChange]);

  function updateDraft(next: string) {
    setInput(next);
    if (draftKey) {
      try {
        if (next.length > 0) sessionStorage.setItem(draftKey, next);
        else sessionStorage.removeItem(draftKey);
      } catch {
        // Ignore storage errors in restricted environments.
      }
    }
    onDraftChange?.(next.length > 0);
  }

  const widthClass =
    viewPrefs?.width === 'narrow'
      ? 'max-w-2xl'
      : viewPrefs?.width === 'wide'
        ? 'max-w-5xl'
        : 'max-w-3xl';

  const SLASH_COMMANDS = [
    { cmd: '/plan', hint: 'Break down implementation plan', action: null },
    { cmd: '/compact', hint: 'Summarize active context', action: null },
    { cmd: '/goal', hint: 'Define measurable objective & criteria', action: null },
    { cmd: '/review', hint: 'Audit diffs and edge cases', action: null },
    { cmd: '/model', hint: 'Switch model or provider override', action: 'model' as const },
    { cmd: '/clear', hint: 'Start a clean conversation', action: 'clear' as const },
  ];
  const slashHead = input.startsWith('/') ? input.trim().split(/\s+/)[0].toLowerCase() : '';
  const hasSlashArgs = input.startsWith('/') && /\s/.test(input.trimStart());
  const slashMatches =
    input.startsWith('/') && !input.includes('\n') && !hasSlashArgs
      ? SLASH_COMMANDS.filter((item) => item.cmd.startsWith(slashHead))
      : [];
  const activeSlashIdx = slashMatches.length > 0 ? Math.min(slashIdx, slashMatches.length - 1) : 0;

  const effectiveProjectKey = projectKey || 'PM';
  const uploading = uploadingCount > 0;
  const runnerOffline = agent.kind === 'external' && !isRunnerOnline(agent);
  const canSend =
    (input.trim().length > 0 || attachments.length > 0) && !runnerOffline && !uploading;

  function submit() {
    const text = input.trim();
    if (!canSend) return;
    updateDraft('');
    const attachmentIds = attachments.map((a) => a.id).filter(Boolean);
    const marker = attachments
      .map((a) => `[file: "${a.filename}" (attachment id: ${a.id})]`)
      .join('\n');
    setAttachments([]);
    onSend(marker ? (text ? `${text}\n\n${marker}` : marker) : text, attachmentIds);
  }

  async function attach(files: FileList | File[] | null) {
    const picked = Array.from(files ?? []);
    if (picked.length === 0) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (attachments.length + picked.length > MAX_ATTACHMENTS) {
      setUploadError(t('tooManyAttachments', { max: MAX_ATTACHMENTS }));
      return;
    }
    setUploadingCount((c) => c + 1);
    setUploadError(null);
    try {
      const results = await Promise.allSettled(
        picked.map(async (file) => {
          const uploaded = await uploadChatAttachment(effectiveProjectKey, file);
          const previewUrl =
            typeof URL !== 'undefined' &&
            typeof URL.createObjectURL === 'function' &&
            (/^image\//i.test(file.type) || isImageAttachmentFilename(file.name))
              ? URL.createObjectURL(file)
              : undefined;
          return { ...uploaded, previewUrl } as StagedChatAttachment;
        }),
      );
      const uploadedItems: StagedChatAttachment[] = [];
      const failed: string[] = [];
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          uploadedItems.push(result.value);
        } else {
          const reason = result.reason;
          failed.push(
            `${picked[i].name}: ${reason instanceof Error ? reason.message : t('uploadFailed')}`,
          );
        }
      });
      setAttachments((current) => [...current, ...uploadedItems]);
      setUploadError(failed.length > 0 ? failed.join('; ') : null);
    } finally {
      setUploadingCount((c) => Math.max(0, c - 1));
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLElement>) {
    if (runnerOffline) return;
    const pastedFiles = extractClipboardFiles(e.clipboardData);
    if (pastedFiles.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      void attach(pastedFiles);
    }
  }

  function handleDragOver(e: DragEvent<HTMLFormElement>) {
    if (runnerOffline) return;
    if (e.dataTransfer?.types?.includes('Files')) {
      e.preventDefault();
      setDragActive(true);
    }
  }

  function handleDragLeave(e: DragEvent<HTMLFormElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragActive(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLFormElement>) {
    setDragActive(false);
    if (runnerOffline) return;
    const droppedFiles = extractClipboardFiles(e.dataTransfer);
    if (droppedFiles.length > 0) {
      e.preventDefault();
      void attach(droppedFiles);
    }
  }

  const starterPrompts = [
    {
      label: tAiChat('starter1Label'),
      prompt: tAiChat('starter1Prompt'),
    },
    {
      label: tAiChat('starter2Label'),
      prompt: tAiChat('starter2Prompt'),
    },
    {
      label: tAiChat('starter3Label'),
      prompt: tAiChat('starter3Prompt'),
    },
    {
      label: tAiChat('starter4Label'),
      prompt: tAiChat('starter4Prompt'),
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MessageScrollerProvider>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {messages.length === 0 && pending.length === 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Empty className="min-h-full">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Bot />
                </EmptyMedia>
                <EmptyTitle>{t('title', { agent: agent.name })}</EmptyTitle>
                <EmptyDescription>{t('emptyHint')}</EmptyDescription>
              </EmptyHeader>
              {!runnerOffline && (
                <div
                  data-testid="client-starter-prompts"
                  className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2"
                >
                  {starterPrompts.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => onSend(item.prompt)}
                      className="rounded-xl border border-border/80 bg-card px-3 py-2 text-left text-xs font-medium text-foreground transition hover:border-primary/50 hover:bg-muted/50"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              </Empty>
            </div>
          ) : (
            <AgentChatTranscript
              messages={messages}
              status={status}
              activeTool={activeTool}
              pending={pending}
              onRemovePending={onRemovePending}
              onSteerPending={onSteerPending}
              onDecideApproval={onDecideApproval}
              hasEarlierMessages={hasEarlierMessages}
              isLoadingEarlier={isLoadingEarlier}
              onLoadEarlier={onLoadEarlier}
              projectKey={projectKey}
              viewPrefs={viewPrefs}
              onOpenArtifact={onOpenArtifact}
            />
          )}
        </div>

        <div className="chat-composer px-3 pt-2 pb-3">
          {runnerOffline && (
            <div
              className={cn(
                'mx-auto mb-2 flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-1.5',
                widthClass,
              )}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <AgentRunnerStatus agent={agent} />
                <span className="text-xs text-muted-foreground">{t('runnerOfflineHint')}</span>
              </div>
              {onSwitchToCloudAgent && (
                <button
                  type="button"
                  data-testid="switch-to-cloud-agent-btn"
                  onClick={onSwitchToCloudAgent}
                  className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Switch to Cloud Agent
                </button>
              )}
            </div>
          )}
          <form
            className={cn('mx-auto w-full', widthClass)}
            onPaste={handlePaste}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {slashMatches.length > 0 && (
              <div
                data-testid="composer-slash-menu"
                className="mb-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs"
              >
                {slashMatches.map((item, idx) => (
                  <button
                    key={item.cmd}
                    type="button"
                    onClick={() => {
                      if (item.action) {
                        setInput('');
                        onSlashCommandAction?.(item.action);
                      } else {
                        setInput(`${item.cmd} `);
                      }
                    }}
                    className={cn(
                      'rounded-md border px-2 py-0.5 text-left transition',
                      idx === activeSlashIdx
                        ? 'border-primary/50 bg-secondary text-foreground'
                        : 'border-border/70 bg-muted/40 hover:bg-muted',
                    )}
                  >
                    <span className="font-mono font-semibold text-primary">{item.cmd}</span>{' '}
                    <span className="text-muted-foreground">{item.hint}</span>
                  </button>
                ))}
              </div>
            )}
            {(runOptions?.mode === 'plan' || runOptions?.mode === 'ask') && (
              <div
                data-testid="composer-readonly-mode-banner"
                className="mb-1.5 flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/35 px-2.5 py-1 text-xs text-muted-foreground"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Compass className="size-3 shrink-0 text-primary" />
                  <span>
                    {runOptions.mode === 'plan'
                      ? 'Plan mode · Read-only analysis & approval before edits'
                      : 'Ask mode · Read-only Q&A'}
                  </span>
                </span>
                {onResetMode && (
                  <button
                    type="button"
                    onClick={onResetMode}
                    className="rounded px-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Reset mode to Build"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            )}
            {(attachments.length > 0 || uploading || uploadError) && (
              <div
                className="mb-2 flex flex-wrap items-center gap-1.5"
                data-testid="chat-attachment-bar"
              >
                {attachments.map((a) => {
                  const isImg = isImageAttachment(a);
                  const imgSrc = a.previewUrl || mediaUrl(a.url);
                  return (
                    <span
                      key={a.id}
                      data-testid="chat-attachment-chip"
                      className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted px-2 py-1 text-xs"
                      dir="auto"
                    >
                      {isImg && (
                        <img
                          src={imgSrc}
                          alt={a.filename}
                          data-testid="chat-attachment-thumbnail"
                          className="size-9 shrink-0 rounded object-cover border border-border/50"
                        />
                      )}
                      <span className="max-w-44 truncate">{a.filename}</span>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        title={t('removeAttachment')}
                        onClick={() =>
                          setAttachments((current) => current.filter((x) => x.id !== a.id))
                        }
                      >
                        <X className="size-3" />
                        <span className="sr-only">{t('removeAttachment')}</span>
                      </button>
                    </span>
                  );
                })}
                {uploading && (
                  <span
                    data-testid="chat-attachment-uploading"
                    className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground animate-pulse"
                  >
                    Uploading image…
                  </span>
                )}
                {uploadError && (
                  <span className="w-full text-xs text-destructive">{uploadError}</span>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.avif,.bmp,.svg,.xlsx,.csv,.docx,.pdf,.md,.txt"
              multiple
              className="hidden"
              onChange={(e) => void attach(e.target.files)}
            />
            <InputGroup
              className={cn(
                'rounded-2xl border-transparent bg-muted has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0 dark:bg-muted/50',
                dragActive && 'ring-2 ring-primary/60 border-primary/50',
              )}
            >
              <InputGroupTextarea
                dir={input ? 'auto' : undefined}
                className="max-h-[calc(5lh+1.25rem)] min-h-9 px-3.5 py-2.5"
                value={input}
                onChange={(e) => {
                  updateDraft(e.target.value);
                  setSlashIdx(0);
                }}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (slashMatches.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSlashIdx((i) => (i + 1) % slashMatches.length);
                      return;
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSlashIdx((i) => (i - 1 + slashMatches.length) % slashMatches.length);
                      return;
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setInput('');
                      return;
                    }
                    if (
                      e.key === 'Tab' ||
                      (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey)
                    ) {
                      const picked = slashMatches[activeSlashIdx];
                      if (picked) {
                        e.preventDefault();
                        if (picked.action) {
                          setInput('');
                          onSlashCommandAction?.(picked.action);
                        } else {
                          setInput(`${picked.cmd} `);
                        }
                        return;
                      }
                    }
                  }
                  if (e.key !== 'Enter') return;
                  if (e.metaKey || e.ctrlKey) {
                    e.preventDefault();
                    const field = e.currentTarget;
                    field.setRangeText('\n', field.selectionStart, field.selectionEnd, 'end');
                    updateDraft(field.value);
                    return;
                  }
                  if (e.shiftKey) return;
                  e.preventDefault();
                  submit();
                }}
                placeholder={
                  runnerOffline
                    ? t('runnerOffline')
                    : t('messagePlaceholder', { agent: agent.name })
                }
                disabled={runnerOffline}
                rows={1}
              />
              <InputGroupAddon
                align="block-end"
                className="gap-1 px-2.5 pb-2"
                onClick={(e) => {
                  if (!e.currentTarget.contains(e.target as Node)) return;
                  if ((e.target as HTMLElement).closest('button')) return;
                  e.currentTarget.parentElement?.querySelector('textarea')?.focus();
                }}
              >
                {composerStart}
                <InputGroupButton
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-md text-muted-foreground hover:text-foreground"
                  title={t('attachFile')}
                  disabled={uploading || runnerOffline}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip />
                  <span className="sr-only">{t('attachFile')}</span>
                </InputGroupButton>
                {onReset && (
                  <InputGroupButton
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="rounded-md text-muted-foreground hover:text-foreground"
                    title={t('reset')}
                    disabled={status !== 'ready' || messages.length === 0}
                    onClick={onReset}
                  >
                    <RotateCw />
                    <span className="sr-only">{t('reset')}</span>
                  </InputGroupButton>
                )}
                <div className="ms-auto flex items-center gap-1">
                  {composerEnd}
                  {status !== 'ready' && (
                    <InputGroupButton
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="rounded-full"
                      title={t('stop')}
                      onClick={onStop}
                    >
                      <Square className="fill-current" />
                      <span className="sr-only">{t('stop')}</span>
                    </InputGroupButton>
                  )}
                  <InputGroupButton
                    type="submit"
                    variant={canSend ? 'default' : 'secondary'}
                    size="icon-sm"
                    className="rounded-full"
                    title={t('sendHint')}
                    disabled={!canSend}
                  >
                    <ArrowUp />
                    <span className="sr-only">{t('send')}</span>
                  </InputGroupButton>
                </div>
              </InputGroupAddon>
            </InputGroup>
          </form>
        </div>
      </MessageScrollerProvider>
    </div>
  );
}
