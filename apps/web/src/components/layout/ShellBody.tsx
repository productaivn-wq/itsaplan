import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useInstantPathname } from '@/hooks/useInstantPathname';
import PageSkeleton from '@/components/common/skeleton/PageSkeleton';
import RequireFeature from '@/components/common/permissions/RequireFeature';
import WorkItemsPage from '@/features/work-items/WorkItemsPage';
import InboxPage from '@/features/inbox/InboxPage';
import DashboardsPage from '@/features/dashboards/DashboardsPage';
import InitiativesPage from '@/features/initiatives/InitiativesPage';
import CyclesPage from '@/features/cycles/CyclesPage';
import VibeCanvasPage from '@/features/vibe-canvas/VibeCanvasPage';
import SettingsSchedulesPage from '@/features/settings/SettingsSchedulesPage';
import ProjectAiAgentsSection from '@/features/teams/components/ai-agents/ProjectAiAgentsSection';
import MembersPage from '@/features/members/MembersPage';
import SecretVaultPage from '@/app/[teamRef]/(shell)/[projectKey]/vault/page';

const INITIATIVE_TABS = ['all', 'planned', 'active', 'completed', 'canceled'];
const CYCLE_VIEWS = ['table', 'timeline'];

export default function ShellBody({
  forbidden,
  hasProject,
  hasError,
  projectsLoaded,
  projectCount,
  children,
}: {
  forbidden: boolean;
  hasProject: boolean;
  hasError: boolean;
  projectsLoaded: boolean;
  projectCount: number;
  children: ReactNode;
}) {
  const t = useTranslations('shell');
  const pathname = useInstantPathname();

  if (forbidden) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
        {t('noProjectAccess')}
      </div>
    );
  }
  if (!hasProject) {
    if (hasError)
      return (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
          {t('projectUnavailable')}
        </div>
      );
    if (projectsLoaded && projectCount === 0)
      return (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {t('noProjects')}
        </div>
      );
    return <PageSkeleton />;
  }

  const segs = pathname.split('/').filter(Boolean);
  if (segs.length === 2 || (segs.length === 3 && segs[2] === 'timeline')) {
    return <WorkItemsPage />;
  }
  if (segs.length === 3 && segs[2] === 'inbox') {
    return <InboxPage />;
  }
  if (segs.length === 3 && segs[2] === 'dashboards') {
    return (
      <RequireFeature feature="dashboards">
        <DashboardsPage />
      </RequireFeature>
    );
  }
  if (
    segs[2] === 'initiatives' &&
    (segs.length === 3 || (segs.length === 4 && INITIATIVE_TABS.includes(segs[3]!)))
  ) {
    return (
      <RequireFeature feature="initiatives">
        <InitiativesPage tab={(segs[3] as any) || 'active'} />
      </RequireFeature>
    );
  }
  if (
    segs[2] === 'cycles' &&
    (segs.length === 3 || (segs.length === 4 && CYCLE_VIEWS.includes(segs[3]!)))
  ) {
    return (
      <RequireFeature feature="cycles">
        <CyclesPage view={(segs[3] as any) || 'table'} />
      </RequireFeature>
    );
  }
  if (segs.length === 3 && segs[2] === 'docs') {
    return (
      <RequireFeature feature="documents">
        <VibeCanvasPage initialMode="docs" />
      </RequireFeature>
    );
  }
  if (segs.length === 3 && segs[2] === 'notes') {
    return (
      <RequireFeature feature="notes">
        <VibeCanvasPage initialMode="notes" />
      </RequireFeature>
    );
  }
  if (segs.length === 3 && segs[2] === 'vibe') {
    return <VibeCanvasPage initialMode="finder" />;
  }
  if (segs.length === 4 && segs[2] === 'agents' && segs[3] === 'schedules') {
    return <SettingsSchedulesPage />;
  }
  if (segs.length === 3 && segs[2] === 'agents') {
    return <ProjectAiAgentsSection />;
  }
  if (segs.length === 3 && segs[2] === 'members') {
    return <MembersPage />;
  }
  if (segs.length === 3 && segs[2] === 'vault') {
    return <SecretVaultPage />;
  }

  return <>{children}</>;
}
