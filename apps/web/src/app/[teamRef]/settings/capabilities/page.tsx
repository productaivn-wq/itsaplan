'use client';

import TeamCapabilitiesSection from '@/features/teams/components/capabilities/TeamCapabilitiesSection';
import { useRouteTeam } from '@/features/teams/hooks/useRouteTeam';

export default function Page() {
  const team = useRouteTeam();
  return team && <TeamCapabilitiesSection teamId={team.id} />;
}
