'use client';

import { memo, useCallback, useMemo, useRef, type RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDocumentNavigation } from '@/hooks/useDocumentNavigation';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FilePlus2, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ProjectDocumentSummary } from '@/lib/api/endpoints/documents';
import { Button } from '@/components/ui/button';
import { projectedDocumentMove } from '../utils/documentMove';
import SortableDocumentRow from './SortableDocumentRow';

export type DocumentSort = 'position' | 'title' | 'created' | 'updated';

const treeDefaults: { collapsed: number[] } = { collapsed: [] };

type FlatDocumentItem = {
  document: ProjectDocumentSummary;
  depth: number;
  hasChildren: boolean;
  isCollapsed: boolean;
  nested: boolean;
};

function DocumentTree({
  projectKey,
  documents,
  scrollContainerRef,
  activeId,
  searching,
  sortBy,
  sortDirection,
  canCreate,
  reorderEnabled,
  favoritePending,
  onCreate,
  onMove,
  onFavoriteChange,
}: {
  projectKey: string;
  documents: ProjectDocumentSummary[];
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  activeId: number | null;
  searching: boolean;
  sortBy: DocumentSort;
  sortDirection: 'asc' | 'desc';
  canCreate: boolean;
  reorderEnabled: boolean;
  favoritePending: boolean;
  onCreate: (parentId: number | null) => void;
  onMove: (input: {
    documentId: number;
    version: number;
    parentId: number | null;
    position: number;
    previousSiblingId: number | null;
    nextSiblingId: number | null;
  }) => void;
  onFavoriteChange: (documentId: number, isFavorite: boolean) => void;
}) {
  const t = useTranslations('documents');
  const [treeState, setTreeState] = useDocumentNavigation(projectKey, 'tree', treeDefaults);
  const collapsed = useMemo(() => new Set(treeState.collapsed), [treeState.collapsed]);
  const localScrollRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const byId = useMemo(() => new Map(documents.map((item) => [item.id, item])), [documents]);
  const byParent = useMemo(() => {
    const groups = new Map<number | null, ProjectDocumentSummary[]>();
    for (const item of documents) {
      const parentId = item.parentId !== null && byId.has(item.parentId) ? item.parentId : null;
      const siblings = groups.get(parentId) ?? [];
      siblings.push(item);
      groups.set(parentId, siblings);
    }

    for (const siblings of groups.values()) {
      siblings.sort((a, b) => {
        let result = a.position - b.position || a.id - b.id;
        if (sortBy === 'title') result = a.title.localeCompare(b.title) || a.id - b.id;
        if (sortBy === 'created') {
          result = Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id - b.id;
        }
        if (sortBy === 'updated') {
          result = Date.parse(a.updatedAt) - Date.parse(b.updatedAt) || a.id - b.id;
        }
        return sortBy !== 'position' && sortDirection === 'desc' ? -result : result;
      });
    }
    return groups;
  }, [byId, documents, sortBy, sortDirection]);
  const ordered = useMemo(() => {
    const result: ProjectDocumentSummary[] = [];
    const visited = new Set<number>();
    const visit = (parentId: number | null) => {
      for (const item of byParent.get(parentId) ?? []) {
        if (visited.has(item.id)) continue;
        visited.add(item.id);
        result.push(item);
        visit(item.id);
      }
    };
    visit(null);
    for (const item of documents) {
      if (!visited.has(item.id)) result.push(item);
    }
    return result;
  }, [byParent, documents]);
  const flatItems = useMemo<FlatDocumentItem[]>(() => {
    if (searching) {
      return ordered.map((item) => ({
        document: item,
        depth: 0,
        hasChildren: (byParent.get(item.id)?.length ?? 0) > 0,
        isCollapsed: collapsed.has(item.id),
        nested: false,
      }));
    }
    const result: FlatDocumentItem[] = [];
    const visited = new Set<number>();
    const visit = (parentId: number | null, depth: number) => {
      for (const item of byParent.get(parentId) ?? []) {
        if (visited.has(item.id)) continue;
        visited.add(item.id);
        const children = byParent.get(item.id) ?? [];
        const isCollapsed = collapsed.has(item.id);
        result.push({
          document: item,
          depth,
          hasChildren: children.length > 0,
          isCollapsed,
          nested: true,
        });
        if (!isCollapsed && children.length > 0) {
          visit(item.id, depth + 1);
        }
      }
    };
    visit(null, 0);
    return result;
  }, [byParent, collapsed, ordered, searching]);
  const visibleIds = useMemo(() => flatItems.map((item) => item.document.id), [flatItems]);

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollContainerRef?.current ?? localScrollRef.current,
    estimateSize: () => 36,
    overscan: 12,
    initialRect: { width: 800, height: 800 },
    getItemKey: (i) => flatItems[i]!.document.id,
  });

  const handleToggle = useCallback(
    (documentId: number) => {
      setTreeState((previous) => {
        const next = new Set(previous.collapsed);
        if (next.has(documentId)) next.delete(documentId);
        else next.add(documentId);
        return { collapsed: [...next] };
      });
    },
    [setTreeState],
  );

  if (documents.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
        <div className="mb-3 grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
          <FilePlus2 className="size-4" />
        </div>
        <p className="text-sm font-medium">{t('noResults')}</p>
        {canCreate && !searching && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => onCreate(null)}
          >
            <Plus />
            {t('newDocument')}
          </Button>
        )}
      </div>
    );
  }

  const dragEnd = ({ active, over, delta }: DragEndEvent) => {
    if (!reorderEnabled || !over || active.id === over.id) return;
    const source = byId.get(Number(active.id));
    const target = byId.get(Number(over.id));
    if (!source || !target) return;
    const projected = projectedDocumentMove({
      source,
      target,
      deltaX:
        typeof document !== 'undefined' && document.documentElement.dir === 'rtl'
          ? -delta.x
          : delta.x,
      ordered,
      byParent,
      byId,
    });
    if (projected) onMove({ documentId: source.id, version: source.version, ...projected });
  };

  const treeContent = (
    <nav aria-label={t('treeLabel')}>
      <ul
        role="tree"
        style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((vi) => {
          const entry = flatItems[vi.index]!;
          return (
            <SortableDocumentRow
              key={vi.key}
              projectKey={projectKey}
              document={entry.document}
              depth={entry.depth}
              nested={entry.nested}
              active={activeId === entry.document.id}
              collapsed={entry.isCollapsed}
              hasChildren={entry.hasChildren}
              canCreate={canCreate}
              reorderEnabled={reorderEnabled}
              favoritePending={favoritePending}
              virtualStart={vi.start}
              onToggle={handleToggle}
              onCreate={onCreate}
              onFavoriteChange={onFavoriteChange}
            />
          );
        })}
      </ul>
    </nav>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={dragEnd}
      accessibility={{
        screenReaderInstructions: { draggable: t('dragInstructions') },
        announcements: {
          onDragStart: ({ active }) =>
            t('dragStarted', { title: byId.get(Number(active.id))?.title ?? '' }),
          onDragOver: ({ over }) =>
            over ? t('dragOver', { title: byId.get(Number(over.id))?.title ?? '' }) : undefined,
          onDragEnd: ({ over }) =>
            over
              ? t('dragEnded', { title: byId.get(Number(over.id))?.title ?? '' })
              : t('dragCanceled'),
          onDragCancel: () => t('dragCanceled'),
        },
      }}
    >
      <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
        {scrollContainerRef ? (
          treeContent
        ) : (
          <div ref={localScrollRef} className="h-full overflow-y-auto">
            {treeContent}
          </div>
        )}
      </SortableContext>
    </DndContext>
  );
}

export default memo(DocumentTree);
