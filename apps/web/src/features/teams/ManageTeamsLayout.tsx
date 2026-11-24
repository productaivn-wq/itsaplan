'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { teamPath } from '@/utils/paths';
import { useInstantPathname } from '@/hooks/useInstantPathname';
import { useTeamsQuery } from '@/services/teams.service';
import NewTeamModal from './components/NewTeamModal';
import TeamsPageView from './components/TeamsPageView';
import TeamsRail from './components/TeamsRail';
import OrgTeamsBody, { parseOrgTeamRoute } from './OrgTeamsBody';
import { useRouteTeam } from './hooks/useRouteTeam';

// The teams the account belongs to, as the rail every team route is opened from.
// The list carries each team's counters, so the section rail beside it shows them
// without a request of its own.
export default function ManageTeamsLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('teams.manage');
  const { data, isPending } = useTeamsQuery();
  const router = useRouter();
  const routeTeam = useRouteTeam();
  const instantPathname = useInstantPathname();
  const parsed = parseOrgTeamRoute(instantPathname);
  const instantTeam =
    parsed.kind === 'team-section' && parsed.teamRef
      ? (data?.find(
          (item) => item.ref === parsed.teamRef || String(item.id) === parsed.teamRef,
        ) ?? null)
      : null;
  const activeId = (parsed.kind === 'company' ? null : (instantTeam?.id ?? routeTeam?.id)) ?? null;
  const [creating, setCreating] = useState(false);

  return (
    <TeamsPageView
      label={t('controlPlane')}
      list={
        <TeamsRail
          teams={data ?? []}
          isPending={isPending}
          activeId={activeId}
          onCreate={() => setCreating(true)}
        />
      }
    >
      <OrgTeamsBody>{children}</OrgTeamsBody>

      {creating && (
        <NewTeamModal
          onClose={() => setCreating(false)}
          onCreated={(team) => router.push(teamPath(team.ref))}
        />
      )}
    </TeamsPageView>
  );
}
