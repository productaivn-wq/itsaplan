'use client';

import Link from 'next/link';
import { Bell, KeyRound, Settings2, Users, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { splitProjectRef, teamSectionPath } from '@/utils/paths';

export type GovernanceViewKey = 'vault' | 'members' | 'notifications';

export default function GovernanceSubBar({
  baseWorkHref,
  activeKey,
}: {
  baseWorkHref: string;
  activeKey: GovernanceViewKey;
}) {
  const tNav = useTranslations('nav');
  const validBase = baseWorkHref && baseWorkHref !== '#' ? baseWorkHref : '';
  const segs = validBase.split('/').filter(Boolean);
  const teamRef = segs[0] ? decodeURIComponent(segs[0]) : splitProjectRef('').teamRef;

  const items: ReadonlyArray<{
    key: GovernanceViewKey | 'settings';
    label: string;
    href: string;
    testId: string;
    icon: LucideIcon;
  }> = [
    {
      key: 'vault',
      label: tNav('secretVault'),
      href: validBase ? `${validBase}/vault` : '#',
      testId: 'gov-subbar-vault',
      icon: KeyRound,
    },
    {
      key: 'members',
      label: tNav('members'),
      href: validBase ? `${validBase}/members` : '#',
      testId: 'gov-subbar-members',
      icon: Users,
    },
    {
      key: 'notifications',
      label: tNav('notifications'),
      href: validBase ? `${validBase}/notifications` : '#',
      testId: 'gov-subbar-notifications',
      icon: Bell,
    },
    {
      key: 'settings',
      label: tNav('controlPlane'),
      href: teamRef ? teamSectionPath(teamRef, 'info') : '#',
      testId: 'gov-subbar-settings',
      icon: Settings2,
    },
  ];

  return (
    <nav
      data-testid="governance-subbar"
      aria-label="Governance & Organization views"
      className="w-full max-w-full overflow-hidden"
    >
      <div className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-border/85 bg-muted/65 p-1 scrollbar-none">
        {items.map((item) => {
          const active = item.key === activeKey;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              data-testid={item.testId}
              prefetch={false}
              aria-current={active ? 'page' : undefined}
              onClick={(e) => {
                if (
                  item.href !== '#' &&
                  item.href.startsWith('/') &&
                  item.key !== 'settings' &&
                  e.button === 0 &&
                  !e.metaKey &&
                  !e.ctrlKey &&
                  !e.shiftKey &&
                  !e.altKey
                ) {
                  e.preventDefault();
                  navigateFeatureInstant(item.href);
                }
              }}
              className={
                active
                  ? 'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-foreground px-3.5 text-xs font-semibold text-background shadow-xs transition-all'
                  : 'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground'
              }
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
