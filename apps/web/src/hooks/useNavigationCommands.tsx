import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpenText,
  BookText,
  Bot,
  Building2,
  CircleHelp,
  Cpu,
  GanttChart,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Plug,
  RefreshCw,
  Route,
  SlidersHorizontal,
  Sparkles,
  SquareKanban,
  Target,
  Users,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  aiAgentsPath,
  aiTeamPath,
  companySettingsPath,
  controlPlanePath,
  cyclesPath,
  dashboardsPath,
  documentsPath,
  inboxPath,
  initiativesPath,
  manageTeamsPath,
  membersPath,
  openOfficePath,
  projectPath,
  splitProjectRef,
  teamPath,
  teamSectionPath,
  vaultPath,
} from '@/utils/paths';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { openJtbdGuide } from '@/components/layout/JtbdWorkflowGuideDrawer';
import { ACCOUNT_SECTIONS, accountPath } from '@/utils/accountSections';
import { AI_AGENTS_SECTION, AI_TEAM_SECTIONS } from '@/utils/settingsSections';
import { usePermissions } from '@/hooks/usePermissions';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';
import {
  useAccountSectionLabel,
  useSettingsSectionText,
} from '@/hooks/useSectionLabels';
import type { Command, CommandSection } from '@/utils/commands';

// SPEC-ITSAPLAN-CUT-GOD-MODE-283 & SPEC-ITSAPLAN-CUT-PROJECT-SETTINGS-284:
// God Mode and Project Settings destinations are cut from the command palette.
export function useNavigationCommands(projectKey: string | null): CommandSection | null {
  const t = useTranslations('nav');
  const tTeams = useTranslations('teams.sections');
  const sectionText = useSettingsSectionText();
  const accountLabel = useAccountSectionLabel();
  const router = useRouter();
  const { can } = usePermissions();
  const features = useProjectFeatures();

  const items: Command[] = [];

  function add(id: string, label: string, icon: Command['icon'], href: string, keywords?: string) {
    items.push({ id, label, icon, keywords, run: () => router.push(href) });
  }

  function addInstant(
    id: string,
    label: string,
    icon: Command['icon'],
    href: string,
    keywords?: string,
  ) {
    items.push({ id, label, icon, keywords, run: () => navigateFeatureInstant(href) });
  }

  if (projectKey) {
    const key = projectKey;
    addInstant(
      'nav.ai-workspace',
      t('aiWorkspace'),
      <Sparkles />,
      aiTeamPath(key, 'chat'),
      'ai workspace chat copilot agents',
    );
    addInstant('nav.inbox', t('inbox'), <Inbox />, inboxPath(key), 'notifications unread');
    if (features.dashboards && can('dashboards', 'read'))
      addInstant(
        'nav.dashboards',
        t('dashboards'),
        <LayoutDashboard />,
        dashboardsPath(key),
        'charts',
      );
    addInstant(
      'nav.work-items',
      t('list'),
      <SquareKanban />,
      projectPath(key),
      'operations list queue issues table',
    );
    addInstant(
      'nav.timeline',
      t('timeline'),
      <GanttChart />,
      `${projectPath(key)}/timeline`,
      'gantt schedule roadmap',
    );
    addInstant('nav.cycles', t('cycles'), <RefreshCw />, cyclesPath(key), 'sprints iterations');
    if (features.initiatives && can('initiatives', 'read'))
      addInstant('nav.initiatives', t('initiatives'), <Target />, initiativesPath(key), 'epics');
    if (features.documents && can('documents', 'read'))
      addInstant(
        'nav.documents',
        t('documents'),
        <BookOpenText />,
        documentsPath(key),
        'docs pages documentation notes sticky canvas vibe spatial finder galaxy reader',
      );
    addInstant(
      'nav.open-office',
      `${t('operations')} · ${t('office')}`,
      <Building2 />,
      openOfficePath(key),
      'operations open office spatial agents telemetry',
    );
    for (const s of AI_TEAM_SECTIONS) {
      if (can(s.resource, 'read'))
        addInstant(
          `nav.ai-team.${s.slug}`,
          sectionText(s.slug).label,
          <s.icon />,
          aiTeamPath(key, s.slug),
          'ai team',
        );
    }
    if (can(AI_AGENTS_SECTION.resource, 'read'))
      addInstant(
        `nav.ai.${AI_AGENTS_SECTION.slug}`,
        sectionText(AI_AGENTS_SECTION.slug).label,
        <AI_AGENTS_SECTION.icon />,
        aiAgentsPath(key),
        'ai team agents',
      );
    const teamRef = splitProjectRef(key).teamRef;
    addInstant(
      'nav.control-plane',
      t('controlPlane'),
      <SlidersHorizontal />,
      controlPlanePath(teamRef),
      'control plane capabilities company teams projects agents skills tools mcp integrations',
    );
    if (can('ai_agents', 'read'))
      addInstant(
        'nav.control-plane.ai-agents',
        `${t('controlPlane')} · ${tTeams('agents.title')}`,
        <Bot />,
        teamSectionPath(teamRef, 'ai-agents'),
        'control plane team ai agents roster',
      );
    if (can('agent_skills', 'read'))
      addInstant(
        'nav.control-plane.agent-skills',
        `${t('controlPlane')} · ${tTeams('agentSkills.title')}`,
        <BookText />,
        teamSectionPath(teamRef, 'agent-skills'),
        'control plane agent skills skill.md',
      );
    if (can('agent_tools', 'read'))
      addInstant(
        'nav.control-plane.agent-tools',
        `${t('controlPlane')} · ${tTeams('agentTools.title')}`,
        <Wrench />,
        teamSectionPath(teamRef, 'agent-tools'),
        'control plane agent tools connectors',
      );
    if (can('integrations', 'read')) {
      addInstant(
        'nav.control-plane.integrations',
        `${t('controlPlane')} · ${tTeams('integrations.title')}`,
        <Plug />,
        teamSectionPath(teamRef, 'integrations'),
        'control plane llm integrations credentials keys',
      );
      addInstant(
        'nav.team.llm-router',
        `${t('controlPlane')} · ${tTeams('llmRouter.title')}`,
        <Route />,
        teamSectionPath(teamRef, 'llm-router'),
        'llm provider router fallback models cooldowns gateway',
      );
    }
    if (can('members_manage', 'read') || can('ai_agents', 'read'))
      addInstant(
        'nav.control-plane.mcp',
        `${t('controlPlane')} · ${tTeams('mcp.title')}`,
        <Cpu />,
        teamSectionPath(teamRef, 'mcp'),
        'control plane mcp server outbound connectors',
      );
    if (can('members_manage', 'read')) {
      addInstant(
        'nav.team-settings',
        t('teamManagement'),
        <UsersRound />,
        teamPath(teamRef),
        'team management roles permissions authorization invites',
      );
      addInstant('nav.members', t('members'), <Users />, membersPath(key), 'team people invite');
    }
    addInstant(
      'nav.vault',
      t('vault'),
      <KeyRound />,
      vaultPath(key),
      'secret vault keys credentials custody',
    );
  }

  items.push({
    id: 'nav.jtbd-guide',
    label: t('jtbdGuide'),
    icon: <CircleHelp />,
    shortcut: '?',
    keywords: 'jtbd workflow guide help map',
    run: () => openJtbdGuide(),
  });

  addInstant(
    'nav.company-settings',
    t('companySettings'),
    <Building2 />,
    companySettingsPath(),
    'company organization setup governance authorization sod',
  );
  addInstant(
    'nav.manage-teams',
    t('manageTeams'),
    <Users />,
    manageTeamsPath(),
    'account rename leave projects delete copy',
  );
  for (const s of ACCOUNT_SECTIONS) {
    add(`nav.account.${s.slug}`, accountLabel(s.slug), <s.icon />, accountPath(s.slug), 'account');
  }

  const sectionHeading = t('sections');
  return useMemo(() => {
    if (items.length === 0) return null;
    return { id: 'sections', heading: sectionHeading, items };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectKey, sectionHeading, features, can]);
}
