import ProjectDirectoryView from '@/features/directory/ProjectDirectoryView';
import { projectRefOf } from '@/utils/paths';

export default async function ProjectDirectoryPage({
  params,
}: {
  params: Promise<{ teamRef: string; projectKey: string }>;
}) {
  const { teamRef, projectKey } = await params;
  return <ProjectDirectoryView projectKey={projectRefOf(teamRef, projectKey)} />;
}
