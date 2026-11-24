import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Gauge, LayoutDashboard, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Dashboard } from '@/lib/api/endpoints/dashboards';
import { useStripSortSensors } from '@/lib/dnd';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import DashboardTab from './DashboardTab';
import DashboardNameDialog from './DashboardNameDialog';

// The row of dashboard tabs. Each named dashboard is a sortable tab; the active
// one exposes Rename/Delete. A "New dashboard" button and a name dialog handle
// create/rename. The built-in Overview remains available beside saved dashboards.
export default function DashboardTabs({
  dashboards,
  activeDashboardId,
  isVirtual,
  watchedActive = false,
  watchedBreachCount = 0,
  actions,
  onSelect,
  onSelectWatched,
  onNewDashboard,
  onRename,
  onDelete,
  onReorder,
}: {
  dashboards: Dashboard[];
  activeDashboardId: number | null;
  isVirtual: boolean;
  watchedActive?: boolean;
  watchedBreachCount?: number;
  actions?: React.ReactNode;
  onSelect: (id: number | null) => void;
  onSelectWatched?: () => void;
  onNewDashboard: (name: string) => void;
  onRename: (d: Dashboard, name: string) => void;
  onDelete: (d: Dashboard) => void;
  onReorder: (draggedId: number, targetId: number) => void;
}) {
  const t = useTranslations('dashboards');
  const { can } = usePermissions();
  const canCreate = can('dashboards', 'create');
  const canEdit = can('dashboards', 'edit');
  const canDelete = can('dashboards', 'delete');
  const sensors = useStripSortSensors();
  const [activeId, setActiveId] = useState<number | null>(null);
  const dragged = activeId != null ? dashboards.find((d) => d.id === activeId) : null;
  // Name dialog state: 'new' to create, a dashboard to rename, or null (closed).
  const [dialog, setDialog] = useState<'new' | Dashboard | null>(null);
  const renaming = dialog && dialog !== 'new' ? dialog : null;

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (over && active.id !== over.id) onReorder(Number(active.id), Number(over.id));
  }

  return (
    <div className="flex min-h-9 items-center justify-between gap-2 border-b border-border/75 bg-card/65 px-3 py-1 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
        <div className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border/85 bg-muted/65 p-0.5">
          <button
            type="button"
            aria-current={isVirtual && !watchedActive ? 'page' : undefined}
            onClick={() => onSelect(null)}
            className={cn(
              'flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs transition-colors',
              isVirtual && !watchedActive
                ? 'bg-foreground font-semibold text-background shadow-xs'
                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
            )}
          >
            <LayoutDashboard className="size-3.5" />
            {t('defaultName')}
          </button>

          {onSelectWatched && (
            <button
              type="button"
              data-testid="dashboard-tab-watched"
              aria-current={watchedActive ? 'page' : undefined}
              onClick={onSelectWatched}
              className={cn(
                'flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs transition-colors',
                watchedActive
                  ? 'bg-foreground font-semibold text-background shadow-xs'
                  : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
              )}
            >
              <Gauge className="size-3.5" />
              <span>{t('watchedMetricsTab')}</span>
              {watchedBreachCount > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0 font-mono text-xs tabular-nums',
                    watchedActive
                      ? 'bg-background/20 text-background'
                      : 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
                  )}
                >
                  {watchedBreachCount}
                </span>
              )}
            </button>
          )}

          {dashboards.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(e: DragStartEvent) => setActiveId(Number(e.active.id))}
              onDragCancel={() => setActiveId(null)}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={dashboards.map((d) => d.id)}
                strategy={horizontalListSortingStrategy}
              >
                {dashboards.map((d) => (
                  <DashboardTab
                    key={d.id}
                    dashboard={d}
                    active={!isVirtual && !watchedActive && activeDashboardId === d.id}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onSelect={() => onSelect(d.id)}
                    onRename={() => setDialog(d)}
                    onDelete={() => onDelete(d)}
                  />
                ))}
              </SortableContext>
              <DragOverlay>
                {dragged ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1 text-xs font-semibold text-background shadow-md">
                    <LayoutDashboard className="size-3.5" />
                    {dragged.name}
                  </span>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => setDialog('new')}
            className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-border/85 bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="size-3.5" />
            {t('newDashboard')}
          </button>
        )}
      </div>

      {actions && <div className="flex shrink-0 items-center gap-2 ps-2">{actions}</div>}

      <DashboardNameDialog
        key={renaming?.id ?? (dialog === 'new' ? 'new' : 'closed')}
        open={dialog != null}
        title={renaming ? t('renameDashboard') : t('newDashboard')}
        initial={renaming?.name ?? ''}
        onClose={() => setDialog(null)}
        onSubmit={(name) => {
          if (renaming) onRename(renaming, name);
          else if (dialog === 'new') onNewDashboard(name);
          setDialog(null);
        }}
      />
    </div>
  );
}
