import { ChevronDown, ChevronRight } from 'lucide-react';
import { colorDot } from '@/components/common/fields/colorDot';

// A group header above the cycles of one status, collapsible like the work items
// table sections. `count` is how many cycles the group holds in all, which for the
// archive is more than the rows loaded under it.
export default function CycleTableSection({
  label,
  color,
  count,
  collapsed,
  onToggle,
}: {
  label: string;
  color: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 border-b border-border/65 bg-muted/45 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70"
    >
      {collapsed ? (
        <ChevronRight className="size-3.5 text-muted-foreground" />
      ) : (
        <ChevronDown className="size-3.5 text-muted-foreground" />
      )}
      {colorDot(color)}
      <span>{label}</span>
      <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
        {count}
      </span>
    </button>
  );
}
