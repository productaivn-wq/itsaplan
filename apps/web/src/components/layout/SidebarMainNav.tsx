'use client';

import { KeyRound, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useInstantPathname } from '@/hooks/useInstantPathname';
import { isHostVibeEnabled } from '@/lib/security/hostVibeClient';
import { directoryPath, vaultPath } from '@/utils/paths';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar';
import SidebarAiTeamNav from '@/components/layout/SidebarAiTeamNav';
import SidebarControlPlaneNav from '@/components/layout/SidebarControlPlaneNav';
import SidebarNavItem from '@/components/layout/SidebarNavItem';
import SidebarWorkNav from '@/components/layout/SidebarWorkNav';

// The main sidebar body: 2 balanced groups (Workspace + System).
// Configuration/Members is accessed via BoardCustomizeSheet or the Control Plane.
export default function SidebarMainNav({
  projectKey,
  projectId,
}: {
  projectKey: string | null;
  projectId: number | null;
}) {
  const t = useTranslations('nav');
  const pathname = useInstantPathname() ?? '';
  const disabled = !projectKey;
  const showHostVault = isHostVibeEnabled();

  return (
    <>
      <SidebarWorkNav projectKey={projectKey} projectId={projectId} />

      <SidebarGroup>
        <SidebarGroupLabel>{t('systemGroup')}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarAiTeamNav projectKey={projectKey} />
            <SidebarNavItem
              href={projectKey ? directoryPath(projectKey) : '#'}
              icon={Users}
              label={t('directory')}
              active={pathname.endsWith('/directory')}
              disabled={disabled}
            />
            <SidebarControlPlaneNav projectKey={projectKey} />
            {showHostVault && (
              <SidebarNavItem
                href={projectKey ? vaultPath(projectKey) : '#'}
                icon={KeyRound}
                label={t('vault')}
                active={pathname.endsWith('/vault')}
                disabled={disabled}
              />
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
