'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { companySettingsPath } from '@/utils/paths';
import { useTeamAuthorizationQuery } from '@/services/roles.service';
import SettingsCard from '@/components/common/page/SettingsCard';
import { Badge } from '@/components/ui/badge';

export default function AuthorizationOverviewCard({
  teamId,
  canManage,
}: {
  teamId: number;
  canManage: boolean;
}) {
  const t = useTranslations('teams');
  const tManage = useTranslations('teams.manage');
  const { data } = useTeamAuthorizationQuery(canManage ? teamId : null);

  if (!data) return null;

  return (
    <SettingsCard className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <span className="text-sm font-medium">{t('authorization.overviewTitle')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {t('authorization.autonomyLabel')}: {data.governance.defaultAutonomyTier}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Independent Review: {data.governance.requireSodApproval ? t('authorization.sodOn') : t('authorization.sodOff')}
          </Badge>
          <Link
            href={companySettingsPath()}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
          >
            {t('authorization.editCompanyPolicy')}
          </Link>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t('authorization.overviewHint')}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {data.teamRanks.map((r) => (
          <div key={r.rank} className="space-y-1 rounded-md border border-border/40 bg-background/50 p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium capitalize">{tManage(`roles.${r.rank}`)}</span>
              <span className="font-mono text-muted-foreground">{r.count}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {r.fullAccess ? t('authorization.fullScope') : t('authorization.roleScoped')}
            </p>
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}
