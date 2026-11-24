import { useContext, useState, type ReactNode } from 'react';
import type { ProjectDetail } from '@/lib/api/endpoints/projects';
import type { Issue } from '@/lib/api/endpoints/issues';
import { ShellCtx } from '@/context/shellContext';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import IssueContextMenuContent from './IssueContextMenuContent';

export default function IssueContextMenu({
  project,
  issue,
  onDeleted,
  children,
}: {
  project: ProjectDetail;
  issue: Issue;
  onDeleted?: () => void;
  children: ReactNode;
}) {
  // Read the Shell directly (not useShell) so this can render outside it: on the
  // public read-only board there is no Shell, and the card is shown without a menu.
  const shell = useContext(ShellCtx);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // No Shell (public share): render the card as-is, without the right-click menu.
  if (!shell) return <>{children}</>;

  return (
    <ContextMenu
      onOpenChange={(next) => {
        if (next) setMounted(true);
        setOpen(next);
      }}
    >
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      {mounted && (
        <IssueContextMenuContent
          project={project}
          issue={issue}
          shell={shell}
          open={open}
          onDeleted={onDeleted}
        />
      )}
    </ContextMenu>
  );
}
