import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { SETTINGS_SECTIONS } from '@/utils/settingsSections';
import type { IssueRef } from '@/lib/api/endpoints/issues';
import type { ShellRoute } from '@/hooks/useShellRoute';
import { useSettingsSectionText } from '@/hooks/useSectionLabels';
import CycleBreadcrumb from '@/components/layout/CycleBreadcrumb';
import InitiativeBreadcrumb from '@/components/layout/InitiativeBreadcrumb';
import IssueBreadcrumb from '@/components/layout/IssueBreadcrumb';

export default function ShellHeaderTitle({
  route,
  projectName,
  issueIdentifier,
  issueParent,
}: {
  route: ShellRoute;
  projectName: string;
  issueIdentifier: string | null;
  issueParent: IssueRef | null;
}) {
  const t = useTranslations('nav');
  const sectionText = useSettingsSectionText();

  function pageLabel(): string {
    const { sub, section, aiTeamSection } = route;
    const known = (slug: string) => SETTINGS_SECTIONS.some((s) => s.slug === slug);
    if (section) return known(section) ? sectionText(section).label : t('projectSettings');
    if (sub === 'inbox') return t('inbox');
    if (sub === 'timeline') return t('timeline');
    if (sub === 'vault') return t('vault');
    if (sub === 'notifications') return t('notifications');
    if (sub === 'mcp') return t('mcpServer');
    if (sub === 'open-office') return t('operations');
    if (sub === 'members') return t('members');
    if (sub === 'dashboards') return t('dashboards');
    if (sub === 'initiatives') return t('initiatives');
    if (sub === 'cycles') return t('cycles');
    if (sub === 'docs' || sub === 'notes' || sub === 'vibe') return t('documents');
    if (sub === 'agents' && aiTeamSection === 'chat') return t('aiWorkspace');
    if (aiTeamSection) return known(aiTeamSection) ? sectionText(aiTeamSection).label : t('aiTeam');
    if (sub === 'agents') return t('aiAgents');
    if (sub === 'api') return t('api');
    return projectName;
  }

  let titleNode: ReactNode;
  if (route.routeIssueSeq != null) {
    titleNode = (
      <IssueBreadcrumb
        projectKey={route.projectKey}
        projectName={projectName}
        identifier={issueIdentifier}
        parent={issueParent}
      />
    );
  } else if (route.routeInitiativeId != null) {
    titleNode = (
      <InitiativeBreadcrumb projectKey={route.projectKey} initiativeId={route.routeInitiativeId} />
    );
  } else if (route.routeCycleId != null) {
    titleNode = <CycleBreadcrumb projectKey={route.projectKey} cycleId={route.routeCycleId} />;
  } else {
    titleNode = pageLabel();
  }

  return (
    <span className="flex max-w-full min-w-0 items-center gap-2 overflow-hidden">
      <span data-testid="shell-header-title-text" className="min-w-0 truncate">
        {titleNode}
      </span>
    </span>
  );
}
