'use client';

import { useShell } from '@/context/shellContext';
import InboxView from './components/InboxView';

// The unified inbox (/:team/:projectKey/inbox): decision contracts, 00_INBOX intake
// files, agent handoffs, and issue notifications on the left; full inline inspection
// and sign-off controls on the right.
export default function InboxPage() {
  const { project } = useShell();
  if (!project) return null;
  // Keyed by project: stored filters are read on mount.
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-hidden">
        <InboxView key={project.project.ref} project={project} />
      </div>
    </div>
  );
}
