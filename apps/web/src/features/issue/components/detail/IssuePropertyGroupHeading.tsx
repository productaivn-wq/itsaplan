import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// The heading of one group of properties, spanning both columns of the Properties
// grid. The whole row toggles the group and surfaces a compact summary when collapsed.
export default function IssuePropertyGroupHeading({
  label,
  summary,
  open,
  onToggle,
  className,
}: {
  label: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <button
      type="button"
      className={cn(
        'col-span-2 flex min-w-0 items-center gap-1.5 text-muted-foreground/70 hover:text-foreground',
        className,
      )}
      onClick={onToggle}
    >
      <span className="h-px flex-1 bg-border/60" />
      <span className="shrink-0 text-xs font-semibold tracking-wide uppercase">{label}</span>
      {!open && summary && (
        <span className="max-w-36 truncate text-xs font-normal normal-case text-muted-foreground">
          · {summary}
        </span>
      )}
      <Chevron className="size-3 shrink-0" />
    </button>
  );
}
