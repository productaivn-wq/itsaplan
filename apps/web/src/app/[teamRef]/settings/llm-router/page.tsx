'use client';

import TeamLlmRouterSection from '@/features/teams/components/llm-router/TeamLlmRouterSection';
import { useRouteTeam } from '@/features/teams/hooks/useRouteTeam';

export default function Page() {
  const team = useRouteTeam();
  return team && <TeamLlmRouterSection teamId={team.id} />;
}
