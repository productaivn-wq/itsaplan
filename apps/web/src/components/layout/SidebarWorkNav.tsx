import { useInstantPathname } from '@/hooks/useInstantPathname';
import { useShellRoute } from '@/hooks/useShellRoute';
import { useTranslations } from 'next-intl';
import {
  BookOpenText,
  Building2,
  Inbox,
  ListTodo,
  Sparkles,
} from 'lucide-react';
import {
  aiTeamPath,
  documentsPath,
  inboxPath,
  openOfficePath,
  projectPath,
  viewPath,
} from '@/utils/paths';
import { usePermissions } from '@/hooks/usePermissions';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';
import { useInboxUnread } from '@/hooks/useInboxUnread';
import { useViewsQuery } from '@/services/views.service';
import { viewIcon } from '@/utils/viewIcons';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar';
import SidebarNavItem from '@/components/layout/SidebarNavItem';
import SidebarNavSubmenu from '@/components/layout/SidebarNavSubmenu';

// The top sidebar group: 4 daily Workspace items (Inbox, Operations, Docs, AI Workspace).
export default function SidebarWorkNav({
  projectKey,
  projectId,
}: {
  projectKey: string | null;
  projectId: number | null;
}) {
  const t = useTranslations('nav');
  const pathname = useInstantPathname();
  const routeSub = useShellRoute().sub;
  const { can } = usePermissions();
  const features = useProjectFeatures();
  const disabled = !projectKey;
  const { data: inboxUnread } = useInboxUnread(projectKey, projectId);
  const { data: views } = useViewsQuery(projectKey);
  const favorites = views?.filter((v) => v.favorite) ?? [];

  const onOperations =
    !!projectKey &&
    (pathname === projectPath(projectKey) ||
      pathname.endsWith('/open-office') ||
      pathname.startsWith(`${projectPath(projectKey)}/view`) ||
      pathname.includes('/timeline') ||
      pathname.includes('/cycles') ||
      pathname.includes('/initiatives') ||
      pathname.includes('/dashboard') ||
      routeSub === 'issue');

  const onUnifiedKnowledgeHub =
    pathname.includes('/docs') || pathname.includes('/notes') || pathname.includes('/vibe');

  const canAccessKnowledgeHub =
    (features.documents && can('documents', 'read')) ||
    (features.notes && can('note_boards', 'read')) ||
    !!projectKey;

  const operationsSubmenu =
    projectKey && favorites.length > 0
      ? [
          {
            key: 'all',
            href: projectPath(projectKey),
            icon: ListTodo,
            label: t('allWorkItems'),
            active:
              onOperations &&
              !pathname.endsWith('/open-office') &&
              !favorites.some((v) => pathname === viewPath(projectKey, v.id)),
          },
          {
            key: 'office',
            href: openOfficePath(projectKey),
            icon: Building2,
            label: t('office'),
            active: pathname.endsWith('/open-office'),
          },
          ...favorites.map((v) => ({
            key: String(v.id),
            href: viewPath(projectKey, v.id),
            icon: viewIcon(v.icon),
            label: v.name,
            active: pathname === viewPath(projectKey, v.id),
          })),
        ]
      : null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('workspaceGroup')}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarNavItem
            href={projectKey ? inboxPath(projectKey) : '#'}
            icon={Inbox}
            label={t('inbox')}
            active={pathname.endsWith('/inbox')}
            disabled={disabled}
            badge={inboxUnread}
          />
          {operationsSubmenu ? (
            <SidebarNavSubmenu
              icon={ListTodo}
              label={t('operations')}
              items={operationsSubmenu}
            />
          ) : (
            <SidebarNavItem
              href={projectKey ? projectPath(projectKey) : '#'}
              icon={ListTodo}
              label={t('operations')}
              active={onOperations}
              disabled={disabled}
            />
          )}
          {canAccessKnowledgeHub && (
            <SidebarNavItem
              href={projectKey ? documentsPath(projectKey) : '#'}
              icon={BookOpenText}
              label={t('documents')}
              active={onUnifiedKnowledgeHub}
              disabled={disabled}
            />
          )}
          <SidebarNavItem
            href={projectKey ? aiTeamPath(projectKey, 'chat') : '#'}
            icon={Sparkles}
            label={t('aiWorkspace')}
            active={pathname.endsWith('/agents/chat')}
            disabled={disabled}
          />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
