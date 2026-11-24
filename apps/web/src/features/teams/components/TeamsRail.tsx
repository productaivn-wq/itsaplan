'use client';

import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';

import { useTranslations } from 'next-intl';
import type { Team } from '@/lib/api/endpoints/teams';
import { cn } from '@/lib/utils';
import { companySettingsPath, teamSectionPath } from '@/utils/paths';
import { navigateFeatureInstant, useInstantPathname } from '@/hooks/useInstantPathname';
import ListSkeleton from '@/components/common/skeleton/ListSkeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// The teams the account belongs to, as the page's leftmost rail. Each one is a route
// of its own, opening on the team's own section.
export default function TeamsRail({
  teams,
  isPending,
  activeId,
  onCreate,
}: {
  teams: Team[];
  isPending: boolean;
  activeId: number | null;
  onCreate: () => void;
}) {
  const t = useTranslations('teams.manage');
  const tNav = useTranslations('nav');
  const pathname = useInstantPathname();

  function handleInstantNav(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      navigateFeatureInstant(href);
    }
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="px-2">
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {tNav('organization')}
          </h2>
        </div>
        <Link
          href={companySettingsPath()}
          aria-current={pathname === '/account/company' ? 'page' : undefined}
          onClick={(e) => handleInstantNav(e, companySettingsPath())}
          className={cn(
            'flex h-8 w-full items-center gap-2 rounded-md px-2 text-start text-sm transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
            pathname === '/account/company'
              ? 'bg-secondary font-medium text-secondary-foreground'
              : 'text-foreground/85 hover:bg-accent/60 hover:text-foreground',
          )}
        >
          <Building2 className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{tNav('companySettings')}</span>
        </Link>
      </div>

      <div className="flex items-center gap-2 px-2">
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t('teams')}
        </h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="ms-auto size-8 text-muted-foreground hover:text-foreground"
              aria-label={t('newTeam')}
              onClick={onCreate}
            >
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('newTeam')}</TooltipContent>
        </Tooltip>
      </div>

      {isPending ? (
        <ListSkeleton rows={3} rowClassName="h-8" />
      ) : teams.length === 0 ? (
        <p className="px-2 text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <ul className="space-y-0.5">
          {teams.map((team) => {
            const active = team.id === activeId;
            const href = teamSectionPath(team.ref, 'capabilities');
            return (
              <li key={team.id}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  onClick={(e) => handleInstantNav(e, href)}
                  className={cn(
                    'flex h-8 w-full items-center gap-2 rounded-md px-2 text-start text-sm transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                    active
                      ? 'bg-secondary font-medium text-secondary-foreground'
                      : 'text-foreground/85 hover:bg-accent/60 hover:text-foreground',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{team.name}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                    {team.projectCount}P · {team.agentCount}A
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {t(`roles.${team.role}`)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
