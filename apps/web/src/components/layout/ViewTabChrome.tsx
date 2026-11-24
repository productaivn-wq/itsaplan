import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

// Shared tab shell (background/active styling), used by the All tab, the saved
// tabs and the drag overlay so they look identical. Extra div props (the sortable
// ref and drag listeners) pass through.
export default function ViewTabChrome({
  active,
  className,
  children,
  ...props
}: { active: boolean } & ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center rounded-full border text-xs transition-colors',
        active
          ? 'border-foreground bg-foreground font-semibold text-background shadow-xs'
          : 'border-transparent text-muted-foreground hover:bg-accent/70 hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
