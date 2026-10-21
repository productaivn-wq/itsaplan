import { useRouter } from 'next/navigation';
import { BookOpenText, Inbox, LayoutDashboard, SquareKanban, Target, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  aiAgentsPath,
  aiTeamPath,
  dashboardsPath,
  documentsPath,
  inboxPath,
  initiativesPath,
  manageTeamsPath,
  membersPath,
  projectPath,
} from '@/utils/paths';
import { ACCOUNT_SECTIONS, accountPath } from '@/utils/accountSections';
import { AI_AGENTS_SECTION, AI_TEAM_SECTIONS } from '@/utils/settingsSections';
import { usePermissions } from '@/hooks/usePermissions';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';
import { useAccountSectionLabel, useSettingsSectionText } from '@/hooks/useSectionLabels';
import type { Command, CommandSection } from '@/utils/commands';

// SPEC-ITSAPLAN-CUT-GOD-MODE-283 & SPEC-ITSAPLAN-CUT-PROJECT-SETTINGS-284:
// God Mode and Project Settings destinations are cut from the command palette.
export function useNavigationCommands(projectKey: string | null): CommandSection | null {
  const t = useTranslations('nav');
  const sectionText = useSettingsSectionText();
  const accountLabel = useAccountSectionLabel();
  const router = useRouter();
  const { can } = usePermissions();
  const features = useProjectFeatures();

  const items: Command[] = [];

  function add(id: string, label: string, icon: Command['icon'], href: string, keywords?: string) {
    items.push({ id, label, icon, keywords, run: () => router.push(href) });
  }

  if (projectKey) {
    const key = projectKey;
    add('nav.inbox', t('inbox'), <Inbox />, inboxPath(key), 'notifications unread');
    if (features.dashboards && can('dashboards', 'read'))
      add('nav.dashboards', t('dashboards'), <LayoutDashboard />, dashboardsPath(key), 'charts');
    add(
      'nav.work-items',
      t('workItems'),
      <SquareKanban />,
      projectPath(key),
      'board issues kanban',
    );
    if (features.initiatives && can('initiatives', 'read'))
      add('nav.initiatives', t('initiatives'), <Target />, initiativesPath(key), 'epics');
    if (features.documents && can('documents', 'read'))
      add(
        'nav.documents',
        t('documents'),
        <BookOpenText />,
        documentsPath(key),
        'docs pages documentation notes sticky canvas vibe spatial finder galaxy reader',
      );
    for (const s of AI_TEAM_SECTIONS) {
      if (can(s.resource, 'read'))
        add(
          `nav.ai-team.${s.slug}`,
          sectionText(s.slug).label,
          <s.icon />,
          aiTeamPath(key, s.slug),
          'ai team',
        );
    }
    if (can(AI_AGENTS_SECTION.resource, 'read'))
      add(
        `nav.ai.${AI_AGENTS_SECTION.slug}`,
        sectionText(AI_AGENTS_SECTION.slug).label,
        <AI_AGENTS_SECTION.icon />,
        aiAgentsPath(key),
        'ai team agents',
      );
    if (can('members_manage', 'read'))
      add('nav.members', t('members'), <Users />, membersPath(key), 'team people invite');
  }

  add(
    'nav.manage-teams',
    t('manageTeams'),
    <Users />,
    manageTeamsPath(),
    'account rename leave projects delete copy',
  );
  for (const s of ACCOUNT_SECTIONS) {
    add(`nav.account.${s.slug}`, accountLabel(s.slug), <s.icon />, accountPath(s.slug), 'account');
  }

  if (items.length === 0) return null;
  return { id: 'sections', heading: t('sections'), items };
}
