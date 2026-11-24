'use client';

import type { Project } from '@/lib/api/endpoints/projects';
import { useSidebarSide } from '@/hooks/useSidebarSide';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import ProjectSwitcher from '@/components/layout/ProjectSwitcher';
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
  const projectId = projects.find((p) => p.ref === currentProjectKey)?.id ?? null;
  const side = useSidebarSide();

  return (
    <Sidebar collapsible="icon" side={side}>
      <SidebarHeader className="h-12 shrink-0 flex-row items-center border-b border-sidebar-border/80 px-2.5 py-0 [&_[data-size=lg]]:h-9">
        <ProjectSwitcher
          projects={projects}
          currentProjectKey={currentProjectKey}
          onSelectProject={onSelectProject}
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarMainNav projectKey={currentProjectKey} projectId={projectId} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70">
        <SidebarBrandFooter />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
