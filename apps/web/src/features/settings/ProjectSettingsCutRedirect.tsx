'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useShellRoute } from '@/hooks/useShellRoute';
import { projectPath } from '@/utils/paths';

// SPEC-ITSAPLAN-CUT-PROJECT-SETTINGS-284: Project Settings UI is cut entirely to speed up UI/UX.
// Any direct navigation to /:team/:projectKey/settings/* immediately redirects to the project workspace.
export default function ProjectSettingsCutRedirect() {
  const router = useRouter();
  const { projectKey } = useShellRoute();

  useEffect(() => {
    if (projectKey) {
      router.replace(projectPath(projectKey));
    } else {
      router.replace('/');
    }
  }, [projectKey, router]);

  return null;
}
