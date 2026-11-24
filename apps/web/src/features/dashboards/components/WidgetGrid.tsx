import { memo, useCallback, useMemo, useState } from 'react';
import GridLayout, { useContainerWidth, verticalCompactor, type Layout } from 'react-grid-layout';
import { Direction } from 'radix-ui';
import { useTranslations } from 'next-intl';
import type { ProjectDetail } from '@/lib/api/endpoints/projects';
import { cn } from '@/lib/utils';
import {
  COL_GAP,
  GRID_COLS,
  isFillHeightWidget,
  MIN_W,
  ROW_GAP,
  ROW_UNIT,
  rowsForContentHeight,
  STACK_COLS,
  STACK_WIDTH,
  stackLayout,
  WIDGET_DEFAULTS,
  type WidgetConfig,
  type WidgetInstance,
} from '@/utils/dashboardWidgets';
import type { DashboardEditor } from '../hooks/useDashboardEditor';
import WidgetFrame from './WidgetFrame';
import WidgetBody from './WidgetBody';
import WidgetSettings, { hasWidgetSettings } from './WidgetSettings';

// The dashboard body: a react-grid-layout board. Widgets are positioned and sized
// by (x, y, w, h); in edit mode they drag by the header handle and resize from the
// corner, with vertical compaction so short widgets stack to fill gaps. Drag and
// resize write back through editor.applyGrid; the layout persists on save.
//
// Below STACK_WIDTH the saved positions are replaced by a two-column layout
// derived from them (stackLayout), and dragging and resizing are off: what is
// stored is the desktop layout, and a drag on the derived one would overwrite it.
const WidgetSlot = memo(function WidgetSlot({
  widget,
  projectKey,
  project,
  editing,
  movable,
  fillHeight,
  catalogMinH,
  onRenameWidget,
  onRemoveWidget,
  onUpdateConfig,
  onContentHeight,
}: {
  widget: WidgetInstance;
  projectKey: string;
  project: ProjectDetail;
  editing: boolean;
  movable: boolean;
  fillHeight: boolean;
  catalogMinH: number;
  onRenameWidget: (id: string, title: string) => void;
  onRemoveWidget: (id: string) => void;
  onUpdateConfig: (id: string, config: WidgetConfig) => void;
  onContentHeight: (id: string, catalogMinH: number, heightPx: number) => void;
}) {
  const handleRename = useCallback(
    (title: string) => onRenameWidget(widget.id, title),
    [onRenameWidget, widget.id],
  );
  const handleRemove = useCallback(() => onRemoveWidget(widget.id), [onRemoveWidget, widget.id]);
  const handleConfigChange = useCallback(
    (config: WidgetConfig) => onUpdateConfig(widget.id, config),
    [onUpdateConfig, widget.id],
  );
  const handleHeight = useCallback(
    (heightPx: number) => onContentHeight(widget.id, catalogMinH, heightPx),
    [onContentHeight, widget.id, catalogMinH],
  );

  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      movable={movable}
      fillHeight={fillHeight}
      settings={
        editing && hasWidgetSettings(widget.type) ? (
          <WidgetSettings widget={widget} onConfigChange={handleConfigChange} />
        ) : undefined
      }
      onRename={handleRename}
      onRemove={handleRemove}
      onContentHeightChange={fillHeight ? undefined : handleHeight}
    >
      <WidgetBody widget={widget} projectKey={projectKey} project={project} />
    </WidgetFrame>
  );
});

export default function WidgetGrid({
  projectKey,
  project,
  editor,
  editing,
}: {
  projectKey: string;
  project: ProjectDetail;
  editor: DashboardEditor;
  editing: boolean;
}) {
  const direction = Direction.useDirection();
  const t = useTranslations('dashboards');
  // useContainerWidth starts at a sane default width and refines it after mount,
  // so the grid can render immediately — child charts always measure a nonzero
  // width instead of flashing empty on the first paint.
  const { width, containerRef } = useContainerWidth();
  const stacked = width < STACK_WIDTH;
  const movable = editing && !stacked;

  const [measuredRows, setMeasuredRows] = useState<Record<string, number>>({});

  const handleContentHeight = useCallback(
    (widgetId: string, catalogMinH: number, heightPx: number) => {
      const rows = rowsForContentHeight(heightPx, catalogMinH);
      setMeasuredRows((prev) => (prev[widgetId] === rows ? prev : { ...prev, [widgetId]: rows }));
    },
    [],
  );

  const layout = useMemo(
    () => (stacked ? stackLayout(editor.layout) : editor.layout),
    [stacked, editor.layout],
  );

  const storedHeightById = useMemo(
    () => new Map(layout.map((w) => [w.id, w.h])),
    [layout],
  );

  const rglLayout: Layout = useMemo(
    () =>
      layout.map((w) => {
        const catalogMinH = WIDGET_DEFAULTS[w.type]?.minH ?? 2;
        const autoRows = isFillHeightWidget(w.type) ? 0 : (measuredRows[w.id] ?? 0);
        return {
          i: w.id,
          x: w.x,
          y: w.y,
          w: w.w,
          h: Math.max(w.h, catalogMinH, autoRows),
          minW: stacked ? 1 : MIN_W,
          minH: Math.max(catalogMinH, autoRows),
        };
      }),
    [layout, stacked, measuredRows],
  );

  const editorUpdateWidget = editor.updateWidget;
  const editorRemoveWidget = editor.removeWidget;
  const handleRenameWidget = useCallback(
    (id: string, title: string) => editorUpdateWidget(id, { title }),
    [editorUpdateWidget],
  );
  const handleUpdateConfig = useCallback(
    (id: string, config: WidgetConfig) => editorUpdateWidget(id, { config }),
    [editorUpdateWidget],
  );
  const handleRemoveWidget = useCallback((id: string) => editorRemoveWidget(id), [editorRemoveWidget]);

  if (layout.length === 0) {
    return (
      <p className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
        {t('noWidgets')}
      </p>
    );
  }

  return (
    // react-grid-layout places every widget at an absolute `left` and has no
    // right-to-left mode, so the grid itself keeps its direction. Each widget then
    // takes the page's back, since only the placing has to stay left to right.
    <div ref={containerRef} dir="ltr">
      {width > 0 && (
        <GridLayout
          width={width}
          layout={rglLayout}
          gridConfig={{
            cols: stacked ? STACK_COLS : GRID_COLS,
            rowHeight: ROW_UNIT,
            margin: [COL_GAP, ROW_GAP],
            containerPadding: [0, 0],
          }}
          dragConfig={{ enabled: movable, handle: '.widget-drag-handle', threshold: 4 }}
          resizeConfig={{ enabled: movable, handles: ['se'] }}
          compactor={verticalCompactor}
          onDragStop={(l) =>
            editor.applyGrid(
              l.map((it) => ({ ...it, h: storedHeightById.get(it.i) ?? it.h })),
            )
          }
          onResizeStop={(l, _oldItem, newItem) =>
            editor.applyGrid(
              l.map((it) => ({
                ...it,
                h: it.i === newItem?.i ? it.h : (storedHeightById.get(it.i) ?? it.h),
              })),
            )
          }
          className={cn(movable && 'rounded-lg outline-1 outline-border/50 outline-dashed')}
        >
          {layout.map((widget) => {
            const fillHeight = isFillHeightWidget(widget.type);
            const catalogMinH = WIDGET_DEFAULTS[widget.type]?.minH ?? 2;
            return (
              <div key={widget.id} dir={direction} className="min-w-0 overflow-hidden">
                <WidgetSlot
                  widget={widget}
                  projectKey={projectKey}
                  project={project}
                  editing={editing}
                  movable={movable}
                  fillHeight={fillHeight}
                  catalogMinH={catalogMinH}
                  onRenameWidget={handleRenameWidget}
                  onRemoveWidget={handleRemoveWidget}
                  onUpdateConfig={handleUpdateConfig}
                  onContentHeight={handleContentHeight}
                />
              </div>
            );
          })}
        </GridLayout>
      )}
    </div>
  );
}
