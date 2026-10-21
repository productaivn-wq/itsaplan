import { useInstantPathname } from '@/hooks/useInstantPathname';
import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { membersPath } from '@/utils/paths';
import { usePermissions } from '@/hooks/usePermissions';
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

  if (!can('members_manage', 'read')) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('configuration')}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
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
