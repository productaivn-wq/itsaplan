'use client';

import { useRef, useState, type ClipboardEvent, type DragEvent, type ReactNode } from 'react';
import { ArrowUp, Bot, Paperclip, RotateCw, Square, X } from 'lucide-react';
import { uploadChatAttachment, type ChatAttachment } from '@/lib/api/endpoints/agentChat';
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
  onReset,
  composerStart,
  composerEnd,
  hasEarlierMessages,
  isLoadingEarlier,
  onLoadEarlier,
  projectKey,
}: {
  agent: AiAgent;
  messages: ChatMessage[];
  status: ChatStatus;
  activeTool: string | null;
  pending: PendingMessage[];
  onSend: (prompt: string) => void;
  onStop: () => void;
  onRemovePending: (id: string) => void;
  onReset?: () => void;
  composerStart?: ReactNode;
  composerEnd?: ReactNode;
  hasEarlierMessages?: boolean;
  isLoadingEarlier?: boolean;
  onLoadEarlier?: () => void;
  projectKey?: string;
}) {
  const t = useTranslations('common.agentChat');
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<StagedChatAttachment[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveProjectKey = projectKey || 'PM';
  const uploading = uploadingCount > 0;
  const runnerOffline = agent.kind === 'external' && !isRunnerOnline(agent);
  const canSend =
    (input.trim().length > 0 || attachments.length > 0) && !runnerOffline && !uploading;

  function submit() {
    const text = input.trim();
    if (!canSend) return;
    setInput('');
    const marker = attachments
      .map((a) => `[file: "${a.filename}" (attachment id: ${a.id})]`)
      .join('\n');
    setAttachments([]);
    onSend(marker ? (text ? `${text}\n\n${marker}` : marker) : text);
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MessageScrollerProvider>
        <div className="min-h-0 flex-1 overflow-hidden">
          {messages.length === 0 && pending.length === 0 ? (
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Bot />
                </EmptyMedia>
                <EmptyTitle>{t('title', { agent: agent.name })}</EmptyTitle>
                <EmptyDescription>{t('emptyHint')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <AgentChatTranscript
              messages={messages}
              status={status}
              activeTool={activeTool}
              pending={pending}
              onRemovePending={onRemovePending}
              hasEarlierMessages={hasEarlierMessages}
              isLoadingEarlier={isLoadingEarlier}
              onLoadEarlier={onLoadEarlier}
            />
          )}
        </div>

        <div className="chat-composer px-3 pt-2 pb-3">
          {runnerOffline && (
            <div className="mx-auto mb-2 flex w-full max-w-3xl flex-wrap items-center gap-x-2 gap-y-0.5">
              <AgentRunnerStatus agent={agent} />
              <span className="text-xs text-muted-foreground">{t('runnerOfflineHint')}</span>
            </div>
          )}
          <form
            className="mx-auto w-full max-w-3xl"
            onPaste={handlePaste}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
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
                          className="size-9 shrink-0 rounded border border-border/50 object-cover"
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
                    className="animate-pulse rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
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
                dragActive && 'border-primary/50 ring-2 ring-primary/60',
              )}
            >
              <InputGroupTextarea
                dir={input ? 'auto' : undefined}
                className="max-h-[calc(5lh+1.25rem)] min-h-9 px-3.5 py-2.5"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  if (e.metaKey || e.ctrlKey) {
                    e.preventDefault();
                    const field = e.currentTarget;
                    field.setRangeText('\n', field.selectionStart, field.selectionEnd, 'end');
                    setInput(field.value);
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
