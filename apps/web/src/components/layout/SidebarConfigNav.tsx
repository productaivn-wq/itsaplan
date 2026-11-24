import { useInstantPathname } from '@/hooks/useInstantPathname';
import { useTranslations } from 'next-intl';
import { Users, UsersRound } from 'lucide-react';
import { manageTeamsPath, membersPath, splitProjectRef, teamPath } from '@/utils/paths';
import { usePermissions } from '@/hooks/usePermissions';
import { useParams } from 'next/navigation';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar';
import SidebarNavItem from '@/components/layout/SidebarNavItem';

// SPEC-ITSAPLAN-CUT-PROJECT-SETTINGS-284: Project settings entry is cut entirely to speed up UI/UX.
export default function SidebarConfigNav({ projectKey }: { projectKey: string | null }) {
  const t = useTranslations('nav');
  const pathname = useInstantPathname();
  const disabled = !projectKey;
  const { can } = usePermissions();
  const params = useParams<{ teamRef?: string }>();

  if (!can('members_manage', 'read')) return null;

  const teamRef = params?.teamRef || (projectKey ? splitProjectRef(projectKey).teamRef : null);
  const teamHref = teamRef ? teamPath(teamRef) : manageTeamsPath();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('configuration')}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarNavItem
            href={teamHref}
            icon={UsersRound}
            label={t('teamManagement')}
            active={teamRef ? pathname.startsWith(`/${teamRef}/settings`) : pathname === '/account/teams'}
            disabled={false}
          />
          <SidebarNavItem
            href={projectKey ? membersPath(projectKey) : '#'}
            icon={Users}
            label={t('members')}
            active={pathname.includes('/members')}
            disabled={disabled}
          />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
