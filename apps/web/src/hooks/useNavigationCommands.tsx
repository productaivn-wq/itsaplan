'use client';

import {
  Bell,
  Blocks,
  Bot,
  FileText,
  FolderKanban,
  Gauge,
  KeyRound,
  Repeat,
  Rocket,
  Settings,
  Sparkles,
  UserCog,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { CommandItem } from '@/context/CommandContext';
import { useCommandLayer } from '@/hooks/useCommandLayer';
import { useCurrentProject } from '@/hooks/useCurrentProject';
import { useCurrentTeam } from '@/hooks/useCurrentTeam';
import { useProjectSectionText, useTeamSectionText } from '@/hooks/useSectionMetadata';
import { ProjectFeatures, resolveFeatures } from '@/types/project';
import { ACCOUNT_SECTIONS, PROJECT_SECTIONS, TEAM_SECTIONS } from '@/utils/sections';
import {
  accountSectionPath,
  boardPath,
  cyclesPath,
  dashboardsPath,
  documentsPath,
  initiativesPath,
  projectSettingsPath,
  teamSettingsPath,
  teamsManagePath,
} from '@/utils/routes';

interface NavTarget {
  id: string;
  label: string;
  href: string;
  icon: typeof FolderKanban;
  keywords?: string;
  feature?: keyof ProjectFeatures;
}

// Registers the baseline "Go to..." navigation commands at the lowest layer
// priority (10) so active views and modals win when ids collide.
export function useNavigationCommands() {
  const router = useRouter();
  const pathname = usePathname();
  const { teamRef } = useCurrentTeam();
  const { projectKey, currentProject } = useCurrentProject();
  const tCmd = useTranslations('commands');
  const tSidebar = useTranslations('sidebar');
  const tCommon = useTranslations('common');
  const tSettings = useTranslations('settings');
  const tTeams = useTranslations('teams');
  const projectSectionText = useProjectSectionText();
  const teamSectionText = useTeamSectionText();
  const features = resolveFeatures(currentProject?.features);

  const items = useMemo<CommandItem[]>(() => {
    const goPrefix = tCmd('goToPrefix');
    const group = tCmd('groups.navigation');
    const out: CommandItem[] = [];

    const push = (t: NavTarget) => {
      if (t.feature && !features[t.feature]) return;
      if (pathname === t.href) return;
      const Icon = t.icon;
      out.push({
        id: `nav.${t.id}`,
        label: `${goPrefix} ${t.label}`,
        group,
        keywords: t.keywords,
        icon: <Icon className="size-4" />,
        perform: () => router.push(t.href),
      });
    };

    if (teamRef && projectKey) {
      const name = currentProject?.name ?? projectKey;
      push({
        id: 'board',
        label: `${name} — ${tSidebar('board')}`,
        href: boardPath(teamRef, projectKey),
        icon: FolderKanban,
        keywords: 'kanban issues columns tasks',
      });
      push({
        id: 'dashboard',
        label: `${name} — ${tSidebar('dashboard')}`,
        href: dashboardsPath(teamRef, projectKey),
        icon: Gauge,
        keywords: 'charts metrics analytics overview',
        feature: 'dashboards',
      });
      push({
        id: 'initiatives',
        label: `${name} — ${tSidebar('initiatives')}`,
        href: initiativesPath(teamRef, projectKey),
        icon: Rocket,
        keywords: 'roadmap goals',
        feature: 'initiatives',
      });
      push({
        id: 'cycles',
        label: `${name} — ${tSidebar('cycles')}`,
        href: cyclesPath(teamRef, projectKey),
        icon: Repeat,
        keywords: 'sprints iterations',
        feature: 'cycles',
      });
      push({
        id: 'documents',
        label: `${name} — ${tSidebar('documents')}`,
        href: documentsPath(teamRef, projectKey),
        icon: FileText,
        keywords: 'docs pages documentation notes sticky canvas vibe spatial finder galaxy reader',
        feature: 'documents',
      });
      for (const s of PROJECT_SECTIONS) {
        const { label } = projectSectionText(s);
        push({
          id: `project-settings.${s.slug}`,
          label: `${name} — ${tCommon('settings')}: ${label}`,
          href: projectSettingsPath(teamRef, projectKey, s.slug),
          icon: s.icon,
          keywords: s.keywords,
        });
      }
    }

    if (teamRef) {
      push({
        id: 'ai-team',
        label: tSidebar('aiTeam'),
        href: teamSettingsPath(teamRef, 'ai-team'),
        icon: Sparkles,
        keywords: 'agents',
      });
      push({
        id: 'ai-agents',
        label: tSidebar('aiAgents'),
        href: teamSettingsPath(teamRef, 'ai-agents'),
        icon: Bot,
        keywords: 'llm providers models',
      });
      push({
        id: 'members',
        label: tSidebar('members'),
        href: teamSettingsPath(teamRef, 'members'),
        icon: Users,
        keywords: 'team users invite roles',
      });
      push({
        id: 'notifications',
        label: tSidebar('notifications'),
        href: teamSettingsPath(teamRef, 'notifications'),
        icon: Bell,
        keywords: 'alerts telegram email',
      });
      push({
        id: 'api',
        label: tSidebar('api'),
        href: teamSettingsPath(teamRef, 'api'),
        icon: KeyRound,
        keywords: 'keys tokens webhooks',
      });
      push({
        id: 'mcp',
        label: tSidebar('mcp'),
        href: teamSettingsPath(teamRef, 'mcp'),
        icon: Blocks,
        keywords: 'model context protocol integrations',
      });
      for (const s of TEAM_SECTIONS) {
        if (
          s.slug === 'ai-team' ||
          s.slug === 'ai-agents' ||
          s.slug === 'members' ||
          s.slug === 'notifications' ||
          s.slug === 'api' ||
          s.slug === 'mcp'
        ) {
          continue;
        }
        const { label } = teamSectionText(s);
        push({
          id: `team-settings.${s.slug}`,
          label: `${tSettings('teamGroup')}: ${label}`,
          href: teamSettingsPath(teamRef, s.slug),
          icon: s.icon,
          keywords: s.keywords,
        });
      }
      push({
        id: 'team-settings',
        label: tSidebar('settings'),
        href: teamSettingsPath(teamRef),
        icon: Settings,
        keywords: 'workspace configuration',
      });
    }

    push({
      id: 'manage-teams',
      label: tTeams('manageTeams'),
      href: teamsManagePath(),
      icon: Users,
      keywords: 'workspaces switch create',
    });

    for (const s of ACCOUNT_SECTIONS) {
      push({
        id: `account.${s.slug}`,
        label: `${tSettings('accountGroup')}: ${tSettings(`${s.i18nKey}.label`)}`,
        href: accountSectionPath(s.slug),
        icon: UserCog,
        keywords: s.keywords,
      });
    }

    return out;
  }, [
    teamRef,
    projectKey,
    currentProject,
    pathname,
    router,
    tCmd,
    tSidebar,
    tCommon,
    tSettings,
    tTeams,
    projectSectionText,
    teamSectionText,
    features,
  ]);

  useCommandLayer('navigation', 10, items);
}
