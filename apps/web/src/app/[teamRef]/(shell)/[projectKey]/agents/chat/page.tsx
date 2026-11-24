import { projectRefOf } from '@/utils/paths';
import ClientWorkspaceView from '@/features/ai-chat/components/ClientWorkspaceView';

export default async function Page({
  params,
}: {
  params: Promise<{ teamRef: string; projectKey: string }>;
}) {
  const { teamRef, projectKey } = await params;
  return <ClientWorkspaceView projectKey={projectRefOf(teamRef, projectKey)} />;
}
