'use client';

import { ArrowUpRight, Mail, MessageSquare, Phone, Users } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { directoryPath } from '@/utils/paths';
import type { ChannelInboxItem, ContactInboxItem } from '../services/inboxStreams';

function maskVaultValue(val: string, isVi: boolean): string {
  if (!val) return '';
  return val.startsWith('vault://') ? (isVi ? 'Đã mã hóa (Vault)' : 'Protected (Vault)') : val;
}

export default function InboxDirectoryItemDetail({
  item,
}: {
  item: ContactInboxItem | ChannelInboxItem;
}) {
  const locale = useLocale();
  const isVi = locale.toLowerCase().startsWith('vi');

  if (item.kind === 'contact') {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-2xl space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/75 pb-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {item.projectKey}
                </Badge>
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Users className="size-3" />
                  {item.raciRole || 'STAKEHOLDER'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {item.source}
                </Badge>
              </div>
              <h2 className="text-base font-semibold text-foreground">{item.name}</h2>
              <p className="text-xs text-muted-foreground">
                {item.projectName}
                {item.role ? ` · ${item.role}` : ''}
              </p>
            </div>
            {item.projectRef && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => navigateFeatureInstant(directoryPath(item.projectRef))}
                className="h-8 gap-1.5 rounded-full px-3 text-xs"
              >
                <span>{isVi ? 'Mở danh bạ' : 'Open Directory'}</span>
                <ArrowUpRight className="size-3.5" />
              </Button>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-border/80 bg-card/60 p-4 text-xs">
            {item.primaryEmail && (
              <div className="flex items-center gap-2 text-foreground">
                <Mail className="size-3.5 text-muted-foreground" />
                <span>{maskVaultValue(item.primaryEmail, isVi)}</span>
              </div>
            )}
            {item.phone && (
              <div className="flex items-center gap-2 text-foreground">
                <Phone className="size-3.5 text-muted-foreground" />
                <span>{maskVaultValue(item.phone, isVi)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-mono">{item.externalKey}</span>
              {item.orgId && <span>· {item.orgId}</span>}
              <span>· {item.lifecycleStage}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/75 pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {item.projectKey}
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <MessageSquare className="size-3" />
                {item.platform.toUpperCase()}
              </Badge>
              <Badge variant={item.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                {item.status}
              </Badge>
            </div>
            <h2 className="text-base font-semibold text-foreground">{item.displayName}</h2>
            <p className="text-xs text-muted-foreground">
              {item.projectName} · {item.threadType}
            </p>
          </div>
          {item.projectRef && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => navigateFeatureInstant(directoryPath(item.projectRef))}
              className="h-8 gap-1.5 rounded-full px-3 text-xs"
            >
              <span>{isVi ? 'Mở danh bạ' : 'Open Directory'}</span>
              <ArrowUpRight className="size-3.5" />
            </Button>
          )}
        </div>

        <div className="space-y-2 rounded-xl border border-border/80 bg-card/60 p-4 text-xs">
          <div className="font-mono text-foreground">
            {item.channelId} · {item.targetId}
          </div>
          {item.aliases.length > 0 && (
            <div className="text-muted-foreground">
              {isVi ? 'Bí danh:' : 'Aliases:'} {item.aliases.join(', ')}
            </div>
          )}
          {item.lastSyncedAt && (
            <div className="text-muted-foreground">
              {isVi ? 'Đồng bộ lần cuối:' : 'Last synced:'} {item.lastSyncedAt}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
