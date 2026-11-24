'use client';

import TeamOrgChartSection from '@/features/teams/components/org-chart/TeamOrgChartSection';
import { useRouteTeam } from '@/features/teams/hooks/useRouteTeam';

export default function Page() {
  const team = useRouteTeam();
  return team && <TeamOrgChartSection teamId={team.id} />;
}
