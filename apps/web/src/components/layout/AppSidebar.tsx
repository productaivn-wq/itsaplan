'use client';

import { useInstantPathname } from '@/hooks/useInstantPathname';
import { KeyRound } from 'lucide-react';
import type { Project } from '@/lib/api/endpoints/projects';
import { vaultPath } from '@/utils/paths';
import { useSidebarSide } from '@/hooks/useSidebarSide';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import ProjectSwitcher from '@/components/layout/ProjectSwitcher';
import SidebarNavItem from '@/components/layout/SidebarNavItem';
import SidebarMainNav from '@/components/layout/SidebarMainNav';
import SidebarBrandFooter from '@/components/brand/SidebarBrandFooter';

// SPEC-ITSAPLAN-CUT-GOD-MODE-283 & SPEC-ITSAPLAN-CUT-PROJECT-SETTINGS-284:
// Both God Mode and Project Settings sidebar mode are cut to keep the sidebar fast.
export default function AppSidebar({
  projects,
  currentProjectKey,
  onSelectProject,
}: {
  projects: Project[];
  currentProjectKey: string | null;
  onSelectProject: (key: string) => void;
}) {
  const pathname = useInstantPathname();
  const disabled = !currentProjectKey;
  const projectId = projects.find((p) => p.ref === currentProjectKey)?.id ?? null;
  const onVault = pathname.endsWith('/vault');
  const side = useSidebarSide();

  return (
    <Sidebar collapsible="icon" side={side}>
      <SidebarHeader>
        <ProjectSwitcher
          projects={projects}
          currentProjectKey={currentProjectKey}
          onSelectProject={onSelectProject}
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarMainNav projectKey={currentProjectKey} projectId={projectId} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarNavItem
            href={currentProjectKey ? vaultPath(currentProjectKey) : '#'}
            icon={KeyRound}
            label="Secret Vault"
            active={onVault}
            disabled={disabled}
          />
        </SidebarMenu>

        <SidebarSeparator />

        <SidebarBrandFooter />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
