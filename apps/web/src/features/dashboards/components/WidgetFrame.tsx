import { useRef, type ReactNode } from 'react';
import { GripVertical, MoreHorizontal, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { WidgetInstance } from '@/utils/dashboardWidgets';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useWidgetContentHeight } from '../hooks/useWidgetContentHeight';

// A borderless widget section: a quiet header (title + edit affordances) over a
// hairline divider, then the body directly on the page. Widget settings live in a
// popover opened from the header, not inline in the body, so shrinking the widget's
// height never hides them. The `.widget-drag-handle` grip is react-grid-layout's
// drag handle; `movable` is off when the grid does not accept drags, and size is
// set from the corner instead (see WidgetGrid). Content-sized widgets report their
// natural height so the grid expands them without inner scrollbars.
export default function WidgetFrame({
  widget,
  editing,
  movable,
  fillHeight = false,
  settings,
  onRename,
  onRemove,
  onContentHeightChange,
  children,
}: {
  widget: WidgetInstance;
  editing: boolean;
  movable: boolean;
  fillHeight?: boolean;
  settings?: ReactNode;
  onRename: (title: string) => void;
  onRemove: () => void;
  onContentHeightChange?: (heightPx: number) => void;
  children: ReactNode;
}) {
  const t = useTranslations('dashboards');
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const bodyContentRef = useRef<HTMLDivElement>(null);

  useWidgetContentHeight({
    enabled: !fillHeight && Boolean(onContentHeightChange),
    sectionRef,
    headerRef,
    bodyContentRef,
    onHeightChange: onContentHeightChange,
  });

  // A saved layout is stored as an opaque jsonb blob, so its widget type is not
  // guaranteed to be in the catalog; fall back to the raw type instead of rendering
  // a key path.
  const labelKey = `widgets.${widget.type}.label` as const;
  const defaultTitle = t.has(labelKey) ? t(labelKey) : widget.type;
  const title = widget.title || defaultTitle;
  return (
    <section
      ref={sectionRef}
      className="flex h-full flex-col rounded-2xl border border-border/85 bg-card p-5 shadow-[var(--studio-card-shadow)]"
    >
      <header ref={headerRef} className="mb-4 flex items-center gap-2 border-b border-border/65 pb-3">
        {movable && (
          <button
            type="button"
            title={t('dragToMove')}
            className="widget-drag-handle -ms-1 cursor-grab touch-none text-muted-foreground/60 hover:text-foreground"
          >
            <GripVertical className="size-4" />
          </button>
        )}
        {editing ? (
          <input
            value={widget.title ?? ''}
            onChange={(e) => onRename(e.target.value)}
            placeholder={defaultTitle}
            aria-label={t('widgetName')}
            className="min-w-0 flex-1 rounded-lg bg-transparent px-1.5 py-0.5 text-sm font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/60 focus:bg-accent/50"
          />
        ) : (
          <h3 className="min-w-0 flex-1 truncate font-heading text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h3>
        )}
        {editing && settings && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                title={t('widgetSettings')}
                className="rounded-full p-1 text-muted-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
              >
                <SlidersHorizontal className="size-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto max-w-[calc(100vw-2rem)] min-w-64 p-3">
              {settings}
            </PopoverContent>
          </Popover>
        )}
        {editing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title={t('widgetOptions')}
                className="rounded-full p-1 text-muted-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onClick={onRemove}>
                {t('removeWidget')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>
      {fillHeight ? (
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      ) : (
        <div className="min-h-0 flex-1">
          <div ref={bodyContentRef} className="flow-root">
            {children}
          </div>
        </div>
      )}
    </section>
  );
}
