'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/hooks/usePermissions';
import { aiAgentsPath } from '@/utils/paths';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/page/EmptyState';

// Fallback shown only when auto-provisioning the project's default Workspace Assistant
// fails. Offers an immediate Retry action plus a secondary link to agent settings.
export function ChatPanelEmpty({
  projectKey,
  errorMessage,
  onRetry,
}: {
  projectKey: string;
  errorMessage?: string | null;
  onRetry?: () => void;
}) {
  const t = useTranslations('aiChat');
  const { can } = usePermissions();

  return (
    <div className="flex h-full flex-col">
      <EmptyState
        title={errorMessage ? t('provisionFailedTitle') : t('emptyTitle')}
        description={errorMessage || t('emptyDescription')}
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <Button type="button" size="sm" onClick={onRetry}>
              {t('retry')}
            </Button>
          )}
          {can('ai_agents', 'edit') && (
            <Button asChild size="sm" variant={onRetry ? 'outline' : 'default'}>
              <Link href={aiAgentsPath(projectKey)}>
                {onRetry ? t('manageAgents') : t('createAgent')}
              </Link>
            </Button>
          )}
        </div>
      </EmptyState>
    </div>
  );
}
