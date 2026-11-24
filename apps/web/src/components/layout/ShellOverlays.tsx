'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import type { ProjectDetail } from '@/lib/api/endpoints/projects';
import { issuePath, projectPath, aiTeamPath } from '@/utils/paths';
import type { useOverlays } from '@/hooks/useOverlays';

const NewProjectModal = dynamic(() => import('@/components/layout/NewProjectModal'), {
  ssr: false,
});
const InitiativeDialog = dynamic(
  () => import('@/components/common/overlay/InitiativeDialog'),
  { ssr: false },
);
const NewIssueModal = dynamic(
  () => import('@/features/issue/components/create/NewIssueModal'),
  { ssr: false },
);
const IssueDetail = dynamic(
  () => import('@/features/issue/components/detail/IssueDetail'),
  { ssr: false },
);

// The project-level overlays the Shell mounts above its content. Each renders only
// while its overlay state says it is open.
export default function ShellOverlays({
  project,
  projectKey,
  newProjectTeamId,
  onAiWorkspace = false,
  overlays,
}: {
  project: ProjectDetail | null;
  projectKey: string | null;
  newProjectTeamId: number | undefined;
  onAiWorkspace?: boolean;
  overlays: ReturnType<typeof useOverlays>;
}) {
  const router = useRouter();

  return (
    <>
      {newProjectTeamId != null && overlays.showNewProject && (
        <NewProjectModal
          teamId={newProjectTeamId}
          onClose={() => overlays.setShowNewProject(false)}
          onCreated={(key) => {
            overlays.setShowNewProject(false);
            router.push(onAiWorkspace ? aiTeamPath(key, 'chat') : projectPath(key));
          }}
        />
      )}

      {projectKey && overlays.showNewInitiative && (
        <InitiativeDialog
          projectKey={projectKey}
          onClose={() => overlays.setShowNewInitiative(false)}
        />
      )}

      {project && overlays.newIssueDefaults != null && (
        <NewIssueModal
          project={project}
          defaults={overlays.newIssueDefaults}
          onClose={() => overlays.setNewIssueDefaults(null)}
          onCreated={() => overlays.setNewIssueDefaults(null)}
        />
      )}

      {project && overlays.openIssueId != null && (
        <IssueDetail
          project={project}
          issueId={overlays.openIssueId}
          onClose={() => overlays.setOpenIssueId(null)}
          onExpand={(seq) => {
            // Prefer the number the panel loaded; fall back to the board issue.
            const n =
              seq ??
              project.issues.find((i) => i.id === overlays.openIssueId)?.sequenceNumber ??
              null;
            if (projectKey && n != null) router.push(issuePath(projectKey, n));
            overlays.setOpenIssueId(null);
          }}
        />
      )}
    </>
  );
}
