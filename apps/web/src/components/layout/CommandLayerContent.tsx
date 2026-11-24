'use client';

import { useMemo } from 'react';
import type { Project } from '@/lib/api/endpoints/projects';
import type { WorkItemsView } from '@/utils/viewTypes';
import type { CommandSection } from '@/utils/commands';
import { useShell } from '@/context/shellContext';
import { useAppCommands } from '@/hooks/useAppCommands';
import { useNavigationCommands } from '@/hooks/useNavigationCommands';
import { useIssueCommands } from '@/features/issue/hooks/useIssueCommands';
import CommandPalette from '@/components/layout/CommandPalette';

export type CommandLayerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  currentProjectKey: string | null;
  onBoard: boolean;
  view: WorkItemsView;
  // The issue the user is looking at: the open detail panel, or the issue page.
  currentIssueId: number | null;
  onViewChange: (view: WorkItemsView) => void;
  onNewIssue: () => void;
  onSelectAll: () => void;
  onNewInitiative: () => void;
  onNewProject: (() => void) | null;
  onSelectProject: (key: string) => void;
  onOpenIssue: (sequenceNumber: number) => void;
  onIssueDeleted: () => void;
  onToggleChat: () => void;
};

// Mounts the command palette hooks and dialogs only after the user opens the
// palette, keeping initial Shell renders free of command-building overhead.
export default function CommandLayerContent({
  open,
  onOpenChange,
  projects,
  currentProjectKey,
  onBoard,
  view,
  currentIssueId,
  onViewChange,
  onNewIssue,
  onSelectAll,
  onNewInitiative,
  onNewProject,
  onSelectProject,
  onOpenIssue,
  onIssueDeleted,
  onToggleChat,
}: CommandLayerProps) {
  const { project } = useShell();
  const hasProject = !!project;

  const issue = useIssueCommands(project, currentIssueId, onIssueDeleted);
  const app = useAppCommands({
    hasProject,
    initiativesEnabled: !!project?.project.initiativesEnabled,
    onBoard,
    view,
    projects,
    currentProjectKey,
    onViewChange,
    onNewIssue,
    onSelectAll,
    onNewInitiative,
    onNewProject,
    onSelectProject,
    onToggleChat,
  });
  const navigation = useNavigationCommands(currentProjectKey);

  // Empty sections are dropped here so each hook can return one unconditionally.
  const sections = useMemo(
    () =>
      [issue.section, app.board, app.general, app.projects, navigation].filter(
        (s): s is CommandSection => s != null && s.items.length > 0,
      ),
    [issue.section, app.board, app.general, app.projects, navigation],
  );

  return (
    <>
      <CommandPalette
        open={open}
        onOpenChange={onOpenChange}
        sections={sections}
        currentProjectKey={currentProjectKey}
        hasProject={hasProject}
        onOpenIssue={onOpenIssue}
      />
      {issue.dialogs}
    </>
  );
}
