import { type LucideIcon } from 'lucide-react';
import type { ProjectDetail } from '@/lib/api/endpoints/projects';

export type SettingsNavItem = {
  key: string;
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
};

export type SettingsNavGroup = {
  key: string;
  label: string;
  items: SettingsNavItem[];
};

// SPEC-ITSAPLAN-CUT-PROJECT-SETTINGS-284: Project settings sections are cut entirely
// to eliminate route prefetching and settings UI overhead.
export function useSettingsNavGroups(
  _projectKey: string | null,
  _project?: ProjectDetail | null,
): {
  groups: SettingsNavGroup[];
  firstHref: string | null;
} {
  return { groups: [], firstHref: null };
}
