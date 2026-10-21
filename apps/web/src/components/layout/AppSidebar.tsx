'use client';

import { KeyRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import SidebarBrandFooter from '@/components/brand/SidebarBrandFooter';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from '@/components/ui/sidebar';
import { secretsVaultPath } from '@/utils/routes';
import ProjectSwitcher from './ProjectSwitcher';
import SidebarMainNav from './SidebarMainNav';
import SidebarNavItem from './SidebarNavItem';
import SidebarSettingsNav from './SidebarSettingsNav';

interface AppSidebarProps {
  variant?: 'main' | 'settings';
}

export default function AppSidebar({ variant = 'main' }: AppSidebarProps) {
  const t = useTranslations('sidebar');
  const pathname = usePathname();
  const isSettings = variant === 'settings';

  return (
    <Sidebar collapsible="icon">
      {!isSettings && (
        <SidebarHeader>
          <ProjectSwitcher />
        </SidebarHeader>
      )}
      <SidebarContent>{isSettings ? <SidebarSettingsNav /> : <SidebarMainNav />}</SidebarContent>
      <SidebarFooter>
        <SidebarGroup className="p-0">
          <SidebarMenu>
            <SidebarNavItem
              href={secretsVaultPath()}
              icon={KeyRound}
              label="Secret Vault"
              isActive={pathname.startsWith('/secrets')}
            />
          </SidebarMenu>
        </SidebarGroup>
        <SidebarBrandFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
