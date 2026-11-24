'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectsQuery } from '@/services/projects.service';
import { documentsPath } from '@/utils/paths';
import VibeCanvasPage from '@/features/vibe-canvas/VibeCanvasPage';

// IAD-ITSAPLAN §2.2 (UC-007): Consolidates standalone /kara into the Shell-mounted
// project Knowledge Hub (/:team/:key/docs?tab=notes) whenever an active project
// exists so AppSidebar and global ChatPanel (itsaplan:open-weknora-chat) stay mounted.
export default function KaraWorkspacePage() {
  const router = useRouter();
  const { data: projects } = useProjectsQuery();
  const targetRef = projects?.[0]?.ref ?? null;

  useEffect(() => {
    if (targetRef) {
      router.replace(`${documentsPath(targetRef)}?tab=notes`);
    }
  }, [targetRef, router]);

  return <VibeCanvasPage initialMode="kara" />;
}
