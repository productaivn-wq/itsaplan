import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { preloadFeatureByHref } from '@/utils/featurePreload';
import { SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

// A single sidebar link. Disabled (no target) until a project is selected.
export default function SidebarNavItem({
  href,
  icon: Icon,
  label,
  active,
  disabled,
  badge,
  instant = true,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  disabled: boolean;
  badge?: number;
  instant?: boolean;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} disabled={disabled} tooltip={label}>
        <Link
          href={disabled ? '#' : href}
          prefetch={!instant}
          onMouseEnter={() => {
            if (instant && !disabled && href !== '#') preloadFeatureByHref(href);
          }}
          onFocus={() => {
            if (instant && !disabled && href !== '#') preloadFeatureByHref(href);
          }}
          onClick={(e) => {
            if (
              instant &&
              !disabled &&
              href !== '#' &&
              e.button === 0 &&
              !e.metaKey &&
              !e.ctrlKey &&
              !e.shiftKey &&
              !e.altKey
            ) {
              e.preventDefault();
              navigateFeatureInstant(href);
            }
          }}
        >
          <Icon />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
      {badge != null && badge > 0 && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
    </SidebarMenuItem>
  );
}
