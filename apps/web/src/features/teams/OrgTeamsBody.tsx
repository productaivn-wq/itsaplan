'use client';

import { useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { PaneActiveProvider } from '@/context/paneActiveContext';
import { useDeferredInstantPathname } from '@/hooks/useInstantPathname';
import { useTeamsQuery } from '@/services/teams.service';
import SectionPageSkeleton from '@/components/common/skeleton/SectionPageSkeleton';
import TeamsPageRail from './components/TeamsPageRail';
import TeamSectionNav from './components/TeamSectionNav';

const LoadingSection = () => <SectionPageSkeleton rows={4} />;

const TeamCapabilitiesSection = dynamic(
  () => import('./components/capabilities/TeamCapabilitiesSection'),
  { loading: LoadingSection },
);
const CompanySetupSection = dynamic(
  () => import('./components/company/CompanySetupSection'),
  { loading: LoadingSection },
);
const ManageTeamsIndex = dynamic(() => import('./ManageTeamsIndex'), {
  loading: LoadingSection,
});
const TeamInfoSection = dynamic(() => import('./components/info/TeamInfoSection'), {
  loading: LoadingSection,
});
const TeamOrgChartSection = dynamic(
  () => import('./components/org-chart/TeamOrgChartSection'),
  { loading: LoadingSection },
);
const TeamProjectsSection = dynamic(
  () => import('./components/projects/TeamProjectsSection'),
  { loading: LoadingSection },
);
const TeamRolesSection = dynamic(() => import('./components/roles/TeamRolesSection'), {
  loading: LoadingSection,
});
const TeamMembersSection = dynamic(
  () => import('./components/members/TeamMembersSection'),
  { loading: LoadingSection },
);
const TeamIntegrationsSection = dynamic(
  () => import('./components/integrations/TeamIntegrationsSection'),
  { loading: LoadingSection },
);
const TeamAiAgentsSection = dynamic(
  () => import('./components/ai-agents/TeamAiAgentsSection'),
  { loading: LoadingSection },
);
const TeamAgentSkillsSection = dynamic(
  () => import('./components/agent-skills/TeamAgentSkillsSection'),
  { loading: LoadingSection },
);
const TeamAgentToolsSection = dynamic(
  () => import('./components/agent-tools/TeamAgentToolsSection'),
  { loading: LoadingSection },
);
const TeamMcpSection = dynamic(() => import('./components/mcp/TeamMcpSection'), {
  loading: LoadingSection,
});
const TeamGitSection = dynamic(
  () => import('./components/integrations/TeamGitSection'),
  { loading: LoadingSection },
);
const TeamNotificationsSection = dynamic(
  () => import('./components/notifications/TeamNotificationsSection'),
  { loading: LoadingSection },
);

const MAX_KEEP_ALIVE_SECTIONS = 4;

const KNOWN_TEAM_SECTIONS = new Set([
  'capabilities',
  'info',
  'org-chart',
  'projects',
  'roles',
  'members',
  'integrations',
  'ai-agents',
  'agent-skills',
  'agent-tools',
  'mcp',
  'git',
  'notifications',
]);

export function parseOrgTeamRoute(pathname: string): {
  kind: 'company' | 'teams-index' | 'team-section' | 'other';
  teamRef?: string;
  section?: string;
} {
  if (pathname === '/account/company') return { kind: 'company' };
  if (pathname === '/account/teams') return { kind: 'teams-index' };
  const segs = pathname.split('/').filter(Boolean);
  if (
    segs.length >= 2 &&
    segs[0] !== 'account' &&
    segs[1] === 'settings' &&
    segs.length <= 3
  ) {
    return {
      kind: 'team-section',
      teamRef: decodeURIComponent(segs[0]!),
      section: segs[2] ?? 'info',
    };
  }
  return { kind: 'other' };
}

function renderTeamSection(teamId: number, section: string): ReactNode {
  switch (section) {
    case 'capabilities':
      return <TeamCapabilitiesSection teamId={teamId} />;
    case 'info':
      return <TeamInfoSection teamId={teamId} />;
    case 'org-chart':
      return <TeamOrgChartSection teamId={teamId} />;
    case 'projects':
      return <TeamProjectsSection teamId={teamId} />;
    case 'roles':
      return <TeamRolesSection teamId={teamId} />;
    case 'members':
      return <TeamMembersSection teamId={teamId} />;
    case 'integrations':
      return <TeamIntegrationsSection teamId={teamId} />;
    case 'ai-agents':
      return <TeamAiAgentsSection teamId={teamId} />;
    case 'agent-skills':
      return <TeamAgentSkillsSection teamId={teamId} />;
    case 'agent-tools':
      return <TeamAgentToolsSection teamId={teamId} />;
    case 'mcp':
      return <TeamMcpSection teamId={teamId} />;
    case 'git':
      return <TeamGitSection teamId={teamId} />;
    case 'notifications':
      return <TeamNotificationsSection teamId={teamId} />;
    default:
      return null;
  }
}

export default function OrgTeamsBody({ children }: { children: ReactNode }) {
  const pathname = useDeferredInstantPathname();
  const { data: teams } = useTeamsQuery();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import('./components/capabilities/TeamCapabilitiesSection');
      void import('./components/company/CompanySetupSection');
      void import('./components/info/TeamInfoSection');
      void import('./components/org-chart/TeamOrgChartSection');
      void import('./components/roles/TeamRolesSection');
      void import('./components/members/TeamMembersSection');
      void import('./components/projects/TeamProjectsSection');
    }, 1200);
    return () => window.clearTimeout(timer);
  }, []);

  const parsed = parseOrgTeamRoute(pathname);
  const team =
    parsed.kind === 'team-section' && parsed.teamRef
      ? (teams?.find(
          (item) => item.ref === parsed.teamRef || String(item.id) === parsed.teamRef,
        ) ?? null)
      : null;

  const activeKey =
    team && parsed.section && KNOWN_TEAM_SECTIONS.has(parsed.section)
      ? `${team.id}:${parsed.section}`
      : null;

  const [keptSections, setKeptSections] = useState<
    Array<{ key: string; teamId: number; section: string }>
  >(() =>
    activeKey && team && parsed.section
      ? [{ key: activeKey, teamId: team.id, section: parsed.section }]
      : [],
  );

  useEffect(() => {
    if (!activeKey || !team || !parsed.section) return;
    const nextSection = parsed.section;
    setKeptSections((prev) => {
      const filtered = prev.filter((item) => item.teamId === team.id && item.key !== activeKey);
      const next = [...filtered, { key: activeKey, teamId: team.id, section: nextSection }];
      if (next.length > MAX_KEEP_ALIVE_SECTIONS) {
        next.shift();
      }
      return next;
    });
  }, [activeKey, team?.id, parsed.section]);

  if (parsed.kind === 'company') {
    return <CompanySetupSection />;
  }
  if (parsed.kind === 'teams-index') {
    return <ManageTeamsIndex />;
  }
  if (parsed.kind === 'team-section' && parsed.teamRef) {
    if (parsed.section && !KNOWN_TEAM_SECTIONS.has(parsed.section)) {
      return <>{children}</>;
    }

    const sectionsToRender =
      activeKey && team && parsed.section && !keptSections.some((item) => item.key === activeKey)
        ? [...keptSections.filter((item) => item.teamId === team.id), { key: activeKey, teamId: team.id, section: parsed.section }]
        : team
          ? keptSections.filter((item) => item.teamId === team.id)
          : [];

    return (
      <>
        <TeamsPageRail className="lg:w-60">
          {team && <TeamSectionNav team={team} />}
        </TeamsPageRail>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {sectionsToRender.map((entry) => {
            const isActive = entry.key === activeKey;
            return (
              <div
                key={entry.key}
                className={isActive ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden' : 'hidden'}
                aria-hidden={!isActive}
              >
                <PaneActiveProvider active={isActive}>
                  {renderTeamSection(entry.teamId, entry.section)}
                </PaneActiveProvider>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  return <>{children}</>;
}
