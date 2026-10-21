import { usePathname } from 'next/navigation';
import { useShellRoute } from '@/hooks/useShellRoute';
import { useTranslations } from 'next-intl';
import {
  BookOpenText,
  Inbox,
  LayoutDashboard,
  RefreshCw,
  SquareKanban,
  Target,
} from 'lucide-react';
import {
  cyclesPath,
  dashboardsPath,
  documentsPath,
  inboxPath,
  initiativesPath,
  projectPath,
  viewPath,
} from '@/utils/paths';
import { usePermissions } from '@/hooks/usePermissions';
import { useProjectFeatures } from '@/hooks/useProjectFeatures';
import { useInboxUnread } from '@/hooks/useInboxUnread';
import { useViewsQuery } from '@/services/views.service';
import { viewIcon } from '@/utils/viewIcons';
import { SidebarGroup, SidebarGroupContent, SidebarMenu } from '@/components/ui/sidebar';
import SidebarNavItem from '@/components/layout/SidebarNavItem';
import SidebarNavSubmenu from '@/components/layout/SidebarNavSubmenu';

// The top sidebar group. Vibe Canvas, Docs, and Notes are consolidated into a
// single unified Knowledge & Canvas workspace entry (SPEC-ITSAPLAN-VIBE-DOCS-NOTES-CONSOLIDATION-278).
export default function SidebarWorkNav({
  projectKey,
  projectId,
}: {
  projectKey: string | null;
  projectId: number | null;
}) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const routeSub = useShellRoute().sub;
  const { can } = usePermissions();
  const features = useProjectFeatures();
  const disabled = !projectKey;
  const { data: inboxUnread } = useInboxUnread(projectKey, projectId);
  const { data: views } = useViewsQuery(projectKey);
  const favorites = views?.filter((v) => v.favorite) ?? [];

  const onWorkItems =
    !!projectKey &&
    (pathname === projectPath(projectKey) ||
      pathname.startsWith(`${projectPath(projectKey)}/view`) ||
      routeSub === 'issue');

  const onUnifiedKnowledgeHub =
    pathname.includes('/docs') || pathname.includes('/notes') || pathname.includes('/vibe');

  const canAccessKnowledgeHub =
    (features.documents && can('documents', 'read')) ||
    (features.notes && can('note_boards', 'read')) ||
    !!projectKey;

  const workItemsSubmenu =
    projectKey && favorites.length > 0
      ? [
          {
            key: 'all',
            href: projectPath(projectKey),
            icon: SquareKanban,
            label: t('allWorkItems'),
            active: onWorkItems && !favorites.some((v) => pathname === viewPath(projectKey, v.id)),
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
          {features.dashboards && can('dashboards', 'read') && (
            <SidebarNavItem
              href={projectKey ? dashboardsPath(projectKey) : '#'}
              icon={LayoutDashboard}
              label={t('dashboards')}
              active={pathname.includes('/dashboard')}
              disabled={disabled}
            />
          )}
          {workItemsSubmenu ? (
            <SidebarNavSubmenu
              icon={SquareKanban}
              label={t('workItems')}
              items={workItemsSubmenu}
            />
          ) : (
            <SidebarNavItem
              href={projectKey ? projectPath(projectKey) : '#'}
              icon={SquareKanban}
              label={t('workItems')}
              active={onWorkItems}
              disabled={disabled}
            />
          )}
          {features.initiatives && can('initiatives', 'read') && (
            <SidebarNavItem
              href={projectKey ? initiativesPath(projectKey) : '#'}
              icon={Target}
              label={t('initiatives')}
              active={pathname.includes('/initiatives')}
              disabled={disabled}
            />
          )}
          {features.cycles && can('cycles', 'read') && (
            <SidebarNavItem
              href={projectKey ? cyclesPath(projectKey) : '#'}
              icon={RefreshCw}
              label={t('cycles')}
              active={pathname.includes('/cycles')}
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
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
