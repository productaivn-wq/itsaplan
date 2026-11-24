'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useInstantPathname } from '@/hooks/useInstantPathname';
import { controlPlanePath, splitProjectRef } from '@/utils/paths';
import SidebarNavItem from '@/components/layout/SidebarNavItem';

export default function SidebarControlPlaneNav({ projectKey }: { projectKey: string | null }) {
  const t = useTranslations('nav');
  const pathname = useInstantPathname();
  const teamRef = projectKey ? splitProjectRef(projectKey).teamRef : null;
  const href = controlPlanePath(teamRef);
  const encodedPrefix = teamRef ? `/${encodeURIComponent(teamRef)}/settings` : null;
  const rawPrefix = teamRef ? `/${teamRef}/settings` : null;
  const active =
    pathname === '/account/company' ||
    pathname === '/account/teams' ||
    (encodedPrefix != null && pathname.startsWith(encodedPrefix)) ||
    (rawPrefix != null && pathname.startsWith(rawPrefix));

  return (
    <SidebarNavItem
      href={href}
      icon={SlidersHorizontal}
      label={t('controlPlane')}
      active={active}
      disabled={false}
    />
  );
}
