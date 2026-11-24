import { useContext } from 'react';
import { useInstantPathname } from '@/hooks/useInstantPathname';
import { useTranslations } from 'next-intl';
import { ShellCtx } from '@/context/shellContext';
import { aiAgentsPath } from '@/utils/paths';
import { AI_AGENTS_SECTION } from '@/utils/settingsSections';
import { usePermissions } from '@/hooks/usePermissions';
import SidebarNavItem from '@/components/layout/SidebarNavItem';

// The AI Agents navigation item rendered inside the unified System sidebar group.
// Open Office is unified into the top Operations hub in SidebarWorkNav.
export default function SidebarAiTeamNav({ projectKey }: { projectKey: string | null }) {
  const t = useTranslations('nav');
  const pathname = useInstantPathname();
  const shell = useContext(ShellCtx);
  const { can } = usePermissions();
  const disabled = !projectKey;

  const projectLoaded = shell?.project != null;
  const showAgents = projectLoaded ? can(AI_AGENTS_SECTION.resource, 'read') : !!projectKey;
  if (!showAgents) return null;

  const onAiAgents =
    !pathname.endsWith('/open-office') &&
    !pathname.endsWith('/agents/chat') &&
    (pathname.includes('/agents') || pathname.endsWith('/mcp') || pathname.endsWith('/api'));

  return (
    <SidebarNavItem
      href={projectKey ? aiAgentsPath(projectKey) : '#'}
      icon={AI_AGENTS_SECTION.icon}
      label={t('aiAgents')}
      active={onAiAgents}
      disabled={disabled}
    />
  );
}
