import {
  Bot,
  Clock3,
  Columns3,
  FileText,
  Import,
  Info,
  ListPlus,
  type LucideIcon,
  Shapes,
  SlidersHorizontal,
  Tags,
  Webhook,
  Zap,
} from 'lucide-react';
import type { PermissionAction, PermissionResource } from '@/lib/api/endpoints/roles';

export type SettingsGroup = 'general' | 'configuration' | 'automation' | 'ai' | 'ai-team';

export type SettingsSection = {
  slug: string;
  icon: LucideIcon;
  resource: PermissionResource;
  viewAction?: PermissionAction;
  group: SettingsGroup;
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    slug: 'general',
    icon: Info,
    resource: 'danger_zone',
    group: 'general',
  },
  {
    slug: 'states',
    icon: Columns3,
    resource: 'states',
    group: 'configuration',
  },
  {
    slug: 'issue-types',
    icon: Shapes,
    resource: 'issue_types',
    group: 'configuration',
  },
  {
    slug: 'labels',
    icon: Tags,
    resource: 'labels',
    group: 'configuration',
  },
  {
    slug: 'custom-fields',
    icon: ListPlus,
    resource: 'custom_fields',
    group: 'configuration',
  },
  {
    slug: 'issue-templates',
    icon: FileText,
    resource: 'issue_templates',
    group: 'configuration',
  },
  {
    slug: 'configuration',
    icon: SlidersHorizontal,
    resource: 'workflow_config',
    group: 'configuration',
  },
  {
    slug: 'actions',
    icon: Zap,
    resource: 'actions',
    group: 'automation',
  },
  {
    slug: 'schedules',
    icon: Clock3,
    resource: 'ai_agents',
    group: 'ai-team',
  },
  {
    slug: 'webhooks',
    icon: Webhook,
    resource: 'webhooks',
    group: 'automation',
  },
  {
    slug: 'import-export',
    icon: Import,
    resource: 'import_export',
    group: 'automation',
  },
];

export const AI_AGENTS_SECTION: SettingsSection = {
  slug: 'ai-agents',
  icon: Bot,
  resource: 'ai_agents',
  group: 'ai',
};

// SPEC-ITSAPLAN-CUT-PROJECT-SETTINGS-284: Project settings groups (general, configuration,
// automation) are cut from the UI; AI_TEAM_SECTIONS is preserved for SidebarAiTeamNav.
export const GENERAL_SECTIONS: SettingsSection[] = [];
export const CONFIGURATION_SECTIONS: SettingsSection[] = [];
export const AUTOMATION_SECTIONS: SettingsSection[] = [];
export const AI_TEAM_SECTIONS = SETTINGS_SECTIONS.filter((s) => s.group === 'ai-team');

const BY_SLUG = new Map(SETTINGS_SECTIONS.map((s) => [s.slug, s]));

export function settingsSection(slug: string): SettingsSection {
  const section = BY_SLUG.get(slug);
  if (!section) throw new Error(`Unknown settings section: ${slug}`);
  return section;
}
