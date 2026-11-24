'use client';

import { CornerDownRight, X } from 'lucide-react';
import type { PendingMessage } from '@/hooks/useAgentChat';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import { Message, MessageContent, MessageFooter } from '@/components/ui/message';
import { MessageScrollerItem } from '@/components/ui/message-scroller';
import AgentChatUserText from './AgentChatUserText';
import { useTranslations } from 'next-intl';

export default function AgentChatPendingMessage({
  message,
  onRemove,
  onSteer,
}: {
  message: PendingMessage;
  onRemove: (id: string) => void;
  onSteer?: (id: string) => void;
}) {
  const t = useTranslations('common.agentChat');

  return (
    <MessageScrollerItem
      messageId={message.id}
      className="motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-bottom-1"
    >
      <Message align="end">
        <MessageContent>
          <Bubble variant="muted" className="gap-2 opacity-60">
            <BubbleContent>
              <div dir="auto">
                <AgentChatUserText text={message.text} />
              </div>
            </BubbleContent>
          </Bubble>
          <MessageFooter className="gap-1">
            <span>{t('waitingToSend')}</span>
            {onSteer && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-testid="steer-pending-btn"
                className="h-5 gap-1 px-1.5 text-xs text-primary hover:text-primary"
                onClick={() => onSteer(message.id)}
                title="Interrupt current reply and send now"
              >
                <CornerDownRight className="size-3" />
                Steer
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-5 text-muted-foreground hover:text-foreground"
              onClick={() => onRemove(message.id)}
            >
              <X className="size-3" />
              <span className="sr-only">{t('removePending')}</span>
            </Button>
          </MessageFooter>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}
