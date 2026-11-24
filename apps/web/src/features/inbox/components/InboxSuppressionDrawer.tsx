'use client';

import { BellOff, X } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MutedChannelInfo } from '../services/inboxStreams';

export default function InboxSuppressionDrawer({
  open,
  mutedChannels,
  suppressedNoiseCount,
  onUnmuteChannel,
  onClose,
}: {
  open: boolean;
  mutedChannels: MutedChannelInfo[];
  suppressedNoiseCount: number;
  onUnmuteChannel: (channelKey: string) => void;
  onClose: () => void;
}) {
  const locale = useLocale();
  const isVi = locale.toLowerCase().startsWith('vi');
  if (!open) return null;

  return (
    <div
      data-testid="inbox-suppression-drawer"
      className="border-b border-border/80 bg-muted/35 px-4 py-3 text-xs"
    >
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <BellOff className="size-3.5 text-amber-400" />
          <span>
            {isVi
              ? `Kênh đã tắt (${mutedChannels.length}) & Tin đã lọc (${suppressedNoiseCount})`
              : `Muted Channels (${mutedChannels.length}) & Filtered Noise (${suppressedNoiseCount})`}
          </span>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onClose} className="h-6 px-2 text-xs">
          <X className="size-3.5" />
        </Button>
      </div>
      {mutedChannels.length === 0 ? (
        <p className="text-muted-foreground">
          {isVi
            ? 'Chưa có kênh nào bị tắt thủ công; chỉ các tin cộng đồng/bot không gắn dự án được lọc tự động.'
            : 'No manually muted channels; only unbound community/bot messages are auto-filtered.'}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {mutedChannels.map((ch) => (
            <div
              key={ch.channelKey}
              className="flex items-center gap-2 rounded-lg border border-border/80 bg-background/80 px-2.5 py-1.5"
            >
              <Badge variant="outline" className="text-xs">
                {ch.platform || 'chat'}
              </Badge>
              <span className="font-medium text-foreground">{ch.displayName || ch.channelKey}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                data-testid={`btn-unmute-${ch.channelKey}`}
                onClick={() => onUnmuteChannel(ch.channelKey)}
                className="h-6 px-2 text-xs text-amber-400 hover:text-amber-300"
              >
                {isVi ? 'Bỏ tắt' : 'Unmute'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
