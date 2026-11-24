'use client';

import type { ProjectDetail } from '@/lib/api/endpoints/projects';

interface SovereignConsentBarProps {
  project: ProjectDetail;
}

// Superseded by real inspectable decision items inside InboxView; kept as a no-op
// module export for backward compatibility with existing imports and governance checks.
export default function SovereignConsentBar(_props: SovereignConsentBarProps) {
  return null;
}
