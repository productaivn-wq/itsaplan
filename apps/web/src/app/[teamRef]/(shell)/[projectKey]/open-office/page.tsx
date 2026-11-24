'use client';

import OpenOfficeWorkspaceView from '@/features/vibe-canvas/components/OpenOfficeWorkspaceView';

export default function OpenOfficePage() {
  return (
    <div data-testid="open-office-page-shell" className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-background text-foreground">
      <OpenOfficeWorkspaceView apiBaseUrl="" />
    </div>
  );
}
