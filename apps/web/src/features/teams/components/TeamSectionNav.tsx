'use client';

import {
  Bell,
  BookText,
  Bot,
  Cpu,
  FolderKanban,
  GitBranch,
  Info,
  Layers,
  Network,
  Plug,
  Route,
  ShieldCheck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Team } from '@/lib/api/endpoints/teams';
import { useInstantPathname } from '@/hooks/useInstantPathname';
import { teamSectionPath, type TeamSection } from '@/utils/paths';
import { useTeamQuery } from '@/services/teams.service';
import { SectionNav, type SectionNavItem } from '@/components/common/page/SectionNav';

// The sections of the open team, organized as three always-visible groups in the
// second rail: Workspace & Governance, AI & Capabilities, and Platform & Delivery.
// Counts come with the team list so each section shows its badge before being opened.
export default function TeamSectionNav({ team }: { team: Team }) {
  const t = useTranslations('teams');
  const pathname = useInstantPathname();
  const permissions = useTeamQuery(team.id).data?.permissions;

  function section(
    id: TeamSection,
    label: string,
    icon: LucideIcon,
    badge?: number | string,
  ): SectionNavItem {
    return {
      id,
      label,
      icon,
      badge: badge === undefined ? undefined : String(badge),
      href: teamSectionPath(team.ref, id),
    };
  }

  const isManagerOrOwner = team.role === 'owner' || team.role === 'manager';

  const workspace: SectionNavItem[] = [
    section('capabilities', t('sections.capabilities.title'), Layers),
    section('projects', t('sections.projects.title'), FolderKanban, team.projectCount),
    section('org-chart', t('sections.orgChart.title'), Network),
    ...(isManagerOrOwner
      ? [section('roles', t('sections.roles.title'), ShieldCheck, team.roleCount)]
      : []),
    section('members', t('sections.members.title'), Users, team.memberCount),
    section('info', t('sections.info.title'), Info),
  ];

  const mcpBadge = team.mcpEnabled
    ? `${team.mcpEnabledProjectCount ?? 0}/${team.projectCount}`
    : 'OFF';

  const ai: SectionNavItem[] = [
    ...(permissions?.ai_agents.read
      ? [section('ai-agents', t('sections.agents.title'), Bot, team.agentCount)]
      : []),
    ...(permissions?.agent_skills.read
      ? [section('agent-skills', t('sections.agentSkills.title'), BookText, team.skillCount)]
      : []),
    ...(permissions?.agent_tools.read
      ? [section('agent-tools', t('sections.agentTools.title'), Wrench, team.toolCount)]
      : []),
    section('mcp', t('sections.mcp.title'), Cpu, mcpBadge),
    ...(permissions?.integrations.read
      ? [section('llm-router', t('sections.llmRouter.title'), Route)]
      : []),
  ];

  const platform: SectionNavItem[] = [
    ...(permissions?.integrations.read
      ? [section('integrations', t('sections.integrations.title'), Plug, team.integrationCount)]
      : []),
    ...(isManagerOrOwner
      ? [section('git', t('sections.git.title'), GitBranch)]
      : []),
    ...(team.role === 'owner'
      ? [section('notifications', t('sections.notifications.title'), Bell)]
      : []),
  ];

  const allSections = [...workspace, ...ai, ...platform];
  const activeId = allSections.find((entry) => entry.href === pathname)?.id ?? null;

  return (
    <div className="space-y-4">
      <h2 className="truncate px-2 text-xs font-semibold tracking-wide text-foreground">
        {team.name}
      </h2>

      <div className="space-y-1">
        <p className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t('navGroups.workspace')}
        </p>
        <SectionNav sections={workspace} activeId={activeId} label={t('navGroups.workspace')} />
      </div>

      {ai.length > 0 && (
        <div className="space-y-1">
          <p className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t('navGroups.ai')}
          </p>
          <SectionNav sections={ai} activeId={activeId} label={t('navGroups.ai')} />
        </div>
      )}

      {platform.length > 0 && (
        <div className="space-y-1">
          <p className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t('navGroups.platform')}
          </p>
          <SectionNav sections={platform} activeId={activeId} label={t('navGroups.platform')} />
        </div>
      )}
    </div>
  );
}
