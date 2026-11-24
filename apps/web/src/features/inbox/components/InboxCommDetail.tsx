'use client';

import * as React from 'react';
import {
  AlertTriangle,
  BookmarkPlus,
  Bot,
  CheckCircle2,
  ChevronLeft,
  FolderKanban,
  MessageSquare,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  VolumeX,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDurationShort } from '@/utils/dates';
import {
  submitInboxTriageAction,
  type AvailableProjectOption,
  type CommInboxItem,
} from '../services/inboxStreams';

function formatChannelLabel(channel: string): string {
  switch (channel.toLowerCase()) {
    case 'zalo':
      return 'Zalo';
    case 'telegram':
      return 'Telegram';
    case 'viber':
      return 'Viber';
    case 'facebook':
    case 'messenger':
      return 'Messenger';
    case 'email':
      return 'Email';
    default:
      return channel ? channel.toUpperCase() : 'Chat';
  }
}

function formatCategoryLabel(category: CommInboxItem['category'], isVi: boolean): string {
  switch (category) {
    case 'hitl_required':
      return isVi ? 'Cần phản hồi' : 'Needs Reply';
    case 'task_created':
      return isVi ? 'Đã tách việc' : 'Task Extracted';
    case 'delivery_alert':
      return isVi ? 'Cảnh báo gửi tin' : 'Delivery Alert';
    default:
      return isVi ? 'Tin nhắn đến' : 'Inbound Message';
  }
}

export default function InboxCommDetail({
  item,
  availableProjects = [],
  isMobile,
  onBack,
  onResolved,
  onProjectReassigned,
  onChannelMuted,
  onBoundToDirectory,
  onOpenDirectory,
}: {
  item: CommInboxItem;
  availableProjects?: AvailableProjectOption[];
  isMobile: boolean;
  onBack: () => void;
  onResolved: (itemId: string) => void;
  onProjectReassigned?: (itemId: string, projectKey: string) => void;
  onChannelMuted?: (itemId: string) => void;
  onBoundToDirectory?: (itemId: string, projectKey: string) => void;
  onOpenDirectory?: () => void;
}) {
  const isVi = useLocale().toLowerCase().startsWith('vi');
  const [replyText, setReplyText] = React.useState('');
  const [showManualReply, setShowManualReply] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState(item.projectKey || 'PM');
  const [submitting, setSubmitting] = React.useState<
    'reply' | 'dispatch' | 'dismiss' | 'reassign' | 'mute' | 'bind' | null
  >(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setReplyText('');
    setShowManualReply(false);
    setSelectedProject(item.projectKey || 'PM');
    setError(null);
    setSubmitting(null);
  }, [item.id, item.projectKey]);

  const guardrail = item.guardrail;
  const isQuarantined = guardrail?.status === 'quarantined' || guardrail?.actionBlocked === true;
  const isFlagged = guardrail?.status === 'flagged';
  const ruleEval = item.ruleEvaluation;
  const isWithinRules = ruleEval ? ruleEval.withinRules : false;
  const canReply =
    !isQuarantined &&
    item.category !== 'delivery_alert' &&
    item.targetHandle.trim().length > 0;
  const channelLabel = formatChannelLabel(item.channel);
  const categoryLabel = formatCategoryLabel(item.category, isVi);
  const ageLabel = item.timestamp ? formatDurationShort(item.timestamp) : '';
  const proposal = !isWithinRules ? item.nextStepProposal : undefined;

  const projectOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const p of availableProjects) {
      map.set(p.key, p.name);
    }
    if (item.projectKey && !map.has(item.projectKey)) {
      map.set(item.projectKey, item.projectKey);
    }
    if (!map.has('PM')) map.set('PM', 'Project Management');
    return Array.from(map.entries()).map(([key, name]) => ({ key, name }));
  }, [availableProjects, item.projectKey]);

  const handleReply = async () => {
    const clean = replyText.trim();
    if (!clean || submitting) return;
    setSubmitting('reply');
    setError(null);
    try {
      await submitInboxTriageAction({
        action: 'reply_omnichat',
        itemId: item.id,
        channel: item.channel,
        target: item.targetHandle,
        message: clean,
      });
      toast.success(
        isVi
          ? `Đã gửi phản hồi qua ${channelLabel} tới ${item.sender}`
          : `Sent reply via ${channelLabel} to ${item.sender}`,
      );
      onResolved(item.id);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : isVi
            ? 'Không thể gửi tin nhắn qua kênh liên lạc.'
            : 'Unable to send reply via communication channel.',
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleDispatch = async () => {
    if (submitting) return;
    setSubmitting('dispatch');
    setError(null);
    try {
      const dispatchTitle =
        proposal?.suggestedTaskTitle || `Follow up ${channelLabel}: ${item.sender}`;
      const dispatchProject =
        proposal?.suggestedProjectKey || (item.projectKey !== 'UNASSIGNED' ? item.projectKey : 'PM') || 'PM';
      await submitInboxTriageAction({
        action: 'dispatch_to_agent',
        itemId: item.id,
        title: dispatchTitle,
        projectKey: dispatchProject,
        inputScope: `${channelLabel} (${item.channelName}): ${item.preview}`,
      });
      toast.success(
        isVi
          ? `Đã giao tin nhắn từ ${item.sender} cho trợ lý AI`
          : `Dispatched message from ${item.sender} to agent`,
      );
      onResolved(item.id);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : isVi
            ? 'Không thể giao việc cho trợ lý AI.'
            : 'Unable to dispatch message to agent.',
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleReassignProject = async () => {
    if (submitting || !selectedProject || selectedProject === item.projectKey) return;
    setSubmitting('reassign');
    setError(null);
    try {
      await submitInboxTriageAction({
        action: 'reassign_project',
        itemId: item.id,
        projectKey: selectedProject,
      });
      toast.success(
        isVi
          ? `Đã chuyển tin nhắn sang dự án ${selectedProject}`
          : `Moved message to ${selectedProject}`,
      );
      onProjectReassigned?.(item.id, selectedProject);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : isVi
            ? 'Không thể chuyển dự án cho tin nhắn.'
            : 'Unable to reassign project.',
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleMuteChannel = async () => {
    if (submitting) return;
    setSubmitting('mute');
    setError(null);
    try {
      const channelKey = item.channelId || item.targetHandle || item.channelName || item.sender;
      await submitInboxTriageAction({
        action: 'mute_channel',
        itemId: item.id,
        channel: item.channel,
        channelKey,
        channelName: item.channelName,
      });
      toast.success(
        isVi
          ? `Đã tắt theo dõi kênh ${item.channelName}`
          : `Muted channel ${item.channelName}`,
      );
      if (onChannelMuted) {
        onChannelMuted(item.id);
      } else {
        onResolved(item.id);
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : isVi
            ? 'Không thể tắt theo dõi kênh này.'
            : 'Unable to mute channel.',
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleBindToDirectory = async () => {
    if (submitting) return;
    setSubmitting('bind');
    setError(null);
    const targetProject =
      selectedProject && selectedProject !== 'UNASSIGNED'
        ? selectedProject
        : item.projectKey && item.projectKey !== 'UNASSIGNED'
          ? item.projectKey
          : 'PM';
    try {
      await submitInboxTriageAction({
        action: 'bind_to_directory',
        itemId: item.id,
        projectKey: targetProject,
        channel: item.channel,
        channelName: item.channelName,
        target: item.targetHandle,
        sender: item.sender,
        bindChannel: !item.isRegisteredChannel,
        bindContact: !item.isKnownContact,
      });
      toast.success(
        isVi
          ? `Đã lưu vào Danh bạ dự án ${targetProject}`
          : `Saved to ${targetProject} Project Directory`,
      );
      onBoundToDirectory?.(item.id, targetProject);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : isVi
            ? 'Không thể lưu vào danh bạ dự án.'
            : 'Unable to save to project directory.',
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleDismiss = async () => {
    if (submitting) return;
    setSubmitting('dismiss');
    setError(null);
    try {
      await submitInboxTriageAction({
        action: 'dismiss',
        itemId: item.id,
      });
      toast.success(isVi ? 'Đã đánh dấu xử lý xong' : 'Marked message done');
      onResolved(item.id);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : isVi
            ? 'Không thể lưu trạng thái xử lý.'
            : 'Unable to dismiss message.',
      );
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b px-4 sm:px-6 xl:px-10">
        {isMobile && (
          <Button variant="ghost" size="sm" className="-ms-2 h-8 gap-1.5" onClick={onBack}>
            <ChevronLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
            {isVi ? 'Hộp thư' : 'Inbox'}
          </Button>
        )}
        <Badge variant="secondary" className="gap-1 text-xs">
          <MessageSquare className="size-3" />
          {channelLabel}
        </Badge>
        <Badge
          variant={item.category === 'delivery_alert' ? 'destructive' : 'default'}
          className="gap-1 text-xs"
        >
          {item.category === 'delivery_alert' && <AlertTriangle className="size-3" />}
          {categoryLabel}
        </Badge>
        {item.projectKey && (
          <Badge variant="outline" className="font-mono text-xs">
            {item.projectKey}
          </Badge>
        )}
        {isQuarantined ? (
          <Badge variant="destructive" className="ms-auto gap-1 text-xs">
            <ShieldAlert className="size-3" />
            {isVi ? 'Đã cách ly' : 'Quarantined'}
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="ms-auto gap-1 bg-emerald-500/15 text-xs text-emerald-700 dark:text-emerald-300"
          >
            <ShieldCheck className="size-3" />
            {isVi ? 'Đã kiểm tra an toàn' : 'Guardrail Verified'}
          </Badge>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 xl:px-10">
        <div className="max-w-2xl space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {item.sender}
            </h2>
            <p className="text-xs text-muted-foreground">
              {item.channelName}
              {ageLabel ? ` · ${ageLabel}` : ''}
            </p>
          </div>

          {(isQuarantined || isFlagged) && guardrail && (
            <section
              data-testid="inbox-comm-guardrail-banner"
              className={
                isQuarantined
                  ? 'space-y-2 rounded-xl border border-destructive/45 bg-destructive/10 p-4 text-xs text-destructive'
                  : 'space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300'
              }
            >
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldAlert className="size-4 shrink-0" />
                <span>
                  {isQuarantined
                    ? isVi
                      ? 'Cảnh báo tiêm lệnh — Đã khóa giao việc tự động'
                      : 'Prompt-Injection Guardrail — Automated Dispatch Locked'
                    : isVi
                      ? 'Nội dung đã được làm sạch tự động'
                      : 'Content Sanitized by Guardrail'}
                </span>
              </div>
              {guardrail.reason && <p className="leading-relaxed">{guardrail.reason}</p>}
              {guardrail.matchedSignals.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {guardrail.matchedSignals.map((sig, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {sig}
                    </Badge>
                  ))}
                </div>
              )}
            </section>
          )}

          <section
            data-testid="inbox-comm-context"
            className="space-y-3 rounded-xl border border-border/80 bg-card/60 p-3.5 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <UserCheck className="size-3.5 text-muted-foreground" />
                <span>
                  {item.contactName
                    ? `${item.contactName}${item.contactRole ? ` · ${item.contactRole}` : ''}`
                    : isVi
                      ? 'Liên hệ chưa gắn hồ sơ'
                      : 'Unlinked contact'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <FolderKanban className="size-3.5 text-muted-foreground" />
                <select
                  aria-label={isVi ? 'Chọn dự án' : 'Select project'}
                  data-testid="select-inbox-comm-project"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="h-8 rounded-md border border-border bg-background px-2 font-mono text-xs text-foreground"
                >
                  {projectOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.key} — {opt.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-testid="btn-inbox-comm-reassign"
                  disabled={submitting !== null || selectedProject === item.projectKey}
                  onClick={() => void handleReassignProject()}
                  className="h-8 px-2.5 text-xs"
                >
                  {isVi ? 'Chuyển' : 'Move'}
                </Button>
              </div>
            </div>
            {item.routingReason && (
              <p className="text-xs text-muted-foreground">{item.routingReason}</p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={item.isRegisteredChannel ? 'secondary' : 'outline'} className="text-xs">
                  {item.isRegisteredChannel
                    ? isVi
                      ? 'Kênh đã đăng ký'
                      : 'Registered Channel'
                    : isVi
                      ? 'Kênh chưa lưu'
                      : 'Unregistered Channel'}
                </Badge>
                <Badge variant={item.isKnownContact ? 'secondary' : 'outline'} className="text-xs">
                  {item.isKnownContact
                    ? isVi
                      ? 'Liên hệ đã lưu'
                      : 'Known Contact'
                    : isVi
                      ? 'Chưa có trong Danh bạ'
                      : 'Unlinked Contact'}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                {(!item.isKnownContact || !item.isRegisteredChannel) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    data-testid="btn-inbox-comm-save-directory"
                    disabled={submitting !== null}
                    onClick={() => void handleBindToDirectory()}
                    className="h-8 gap-1 px-2.5 text-xs"
                  >
                    <BookmarkPlus className="size-3" />
                    <span>
                      {submitting === 'bind'
                        ? isVi
                          ? 'Đang lưu...'
                          : 'Saving...'
                        : isVi
                          ? 'Lưu vào Danh bạ'
                          : 'Save to Directory'}
                    </span>
                  </Button>
                )}
                {onOpenDirectory && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    data-testid="btn-inbox-comm-open-directory"
                    onClick={onOpenDirectory}
                    className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Users className="size-3" />
                    <span>{isVi ? 'Danh bạ' : 'Directory'}</span>
                  </Button>
                )}
              </div>
            </div>
          </section>

          {(item.updateSummary || ruleEval) && (
            <section
              data-testid="inbox-comm-summary-card"
              className="space-y-2 rounded-xl border border-border/80 bg-muted/35 p-3.5 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                  {isVi ? 'Tóm tắt cập nhật' : 'Update Summary'}
                </span>
                {ruleEval && (
                  <Badge variant={ruleEval.withinRules ? 'secondary' : 'outline'} className="text-xs">
                    {ruleEval.ruleLabel}
                  </Badge>
                )}
              </div>
              {item.updateSummary && (
                <p className="text-sm leading-relaxed text-foreground">{item.updateSummary}</p>
              )}
              {ruleEval?.reason && (
                <p className="text-xs text-muted-foreground">{ruleEval.reason}</p>
              )}
            </section>
          )}

          {proposal ? (
            <section
              data-testid="inbox-comm-proposal-card"
              className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="size-3.5 text-[var(--studio-amber)]" />
                  <span>
                    {isVi
                      ? 'Đề xuất bước tiếp theo (Ngoài quy tắc)'
                      : 'Proposed Next Steps (Outside Rules)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {proposal.ruleLabel && (
                    <Badge variant="outline" className="text-xs">
                      {proposal.ruleLabel}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {proposal.priority}
                  </Badge>
                  <Badge variant="secondary" className="text-xs tabular-nums">
                    {proposal.confidencePct}%
                  </Badge>
                </div>
              </div>
              <p className="text-sm font-medium text-foreground">{proposal.headline}</p>
              {proposal.rationale && (
                <p className="text-xs leading-relaxed text-muted-foreground">{proposal.rationale}</p>
              )}
              {proposal.steps.length > 0 && (
                <ol className="list-inside list-decimal space-y-1 text-xs text-foreground/90">
                  {proposal.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              )}
            </section>
          ) : isWithinRules ? (
            <section
              data-testid="inbox-comm-within-rules-note"
              className="flex items-center gap-2 rounded-xl border border-border/75 bg-card/50 px-3.5 py-2.5 text-xs text-muted-foreground"
            >
              <CheckCircle2 className="size-4 shrink-0 text-[var(--studio-emerald)]" />
              <span>
                {isVi
                  ? 'Cập nhật này nằm trong quy tắc vận hành và đã được tổng hợp — không cần đề xuất phản hồi 1-1.'
                  : 'This update fits operating rules and is summarized in your digest — no 1-1 reply needed.'}
              </span>
            </section>
          ) : null}

          <section className="space-y-2 border-t border-border pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isVi ? 'Nội dung tin nhắn' : 'Message Content'}
            </h3>
            <pre className="overflow-x-auto rounded-md bg-muted/40 p-3.5 text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words font-sans">
              {item.body}
            </pre>
          </section>

          {canReply && showManualReply && (
            <section className="space-y-2 border-t border-border pt-4">
              <label
                htmlFor={`inbox-comm-reply-${item.id}`}
                className="block text-xs font-medium text-muted-foreground"
              >
                {isVi
                  ? `Tin nhắn thủ công qua ${channelLabel}`
                  : `Manual message via ${channelLabel}`}
              </label>
              <textarea
                id={`inbox-comm-reply-${item.id}`}
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  isVi
                    ? `Nhập nội dung gửi tới ${item.targetHandle}...`
                    : `Write a message to ${item.targetHandle}...`
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none"
              />
            </section>
          )}

          {error && (
            <div
              role="alert"
              data-testid="inbox-comm-error"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="default"
              data-testid="btn-inbox-comm-dispatch"
              disabled={submitting !== null || isQuarantined}
              onClick={() => void handleDispatch()}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <Bot className="size-3.5 shrink-0" />
              <span>
                {isQuarantined
                  ? isVi
                    ? 'Đã khóa giao AI'
                    : 'Agent Dispatch Locked'
                  : submitting === 'dispatch'
                    ? isVi
                      ? 'Đang giao...'
                      : 'Dispatching...'
                    : isVi
                      ? 'Giao cho Trợ lý AI'
                      : 'Dispatch to Agent'}
              </span>
            </Button>
            {canReply && (
              showManualReply ? (
                <Button
                  type="button"
                  variant="outline"
                  data-testid="btn-inbox-comm-reply"
                  disabled={submitting !== null || replyText.trim().length === 0}
                  onClick={() => void handleReply()}
                  className="h-9 gap-1.5 text-xs font-semibold"
                >
                  <Send className="size-3.5 shrink-0" />
                  <span>
                    {submitting === 'reply'
                      ? isVi
                        ? 'Đang gửi...'
                        : 'Sending...'
                      : isVi
                        ? 'Gửi tin nhắn'
                        : 'Send Message'}
                  </span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  data-testid="btn-inbox-comm-open-manual-reply"
                  disabled={submitting !== null}
                  onClick={() => setShowManualReply(true)}
                  className="h-9 gap-1.5 text-xs"
                >
                  <Send className="size-3.5 shrink-0" />
                  <span>{isVi ? 'Nhắn thủ công' : 'Manual Message'}</span>
                </Button>
              )
            )}
            <Button
              type="button"
              variant="outline"
              data-testid="btn-inbox-comm-dismiss"
              disabled={submitting !== null}
              onClick={() => void handleDismiss()}
              className="h-9 gap-1.5 text-xs"
            >
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span>{isVi ? 'Đánh dấu xong (E)' : 'Mark Done (E)'}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              data-testid="btn-inbox-comm-mute"
              disabled={submitting !== null}
              onClick={() => void handleMuteChannel()}
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <VolumeX className="size-3.5 shrink-0" />
              <span>{isVi ? 'Tắt kênh này' : 'Mute Channel'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
