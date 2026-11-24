'use client';

import Link from 'next/link';
import {
  Building2,
  GanttChart,
  LayoutDashboard,
  ListTodo,
  RefreshCw,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { preloadFeatureByHref } from '@/utils/featurePreload';

export type WorkDeliveryViewKey =
  | 'office'
  | 'timeline'
  | 'board'
  | 'cycles'
  | 'initiatives'
  | 'dashboards';

export interface WorkDeliverySubBarProps {
  baseWorkHref: string;
  activeKey: WorkDeliveryViewKey;
}

export default function WorkDeliverySubBar({
  baseWorkHref,
  activeKey,
}: WorkDeliverySubBarProps) {
  const tNav = useTranslations('nav');
  const validBase = baseWorkHref && baseWorkHref !== '#' ? baseWorkHref : '';

  const items: ReadonlyArray<{
    key: WorkDeliveryViewKey;
    label: string;
    href: string;
    testId: string;
    icon: LucideIcon;
  }> = [
    {
      key: 'board',
      label: tNav('list'),
      href: validBase || '#',
      testId: 'subbar-item-list',
      icon: ListTodo,
    },
    {
      key: 'cycles',
      label: tNav('cycles'),
      href: validBase ? `${validBase}/cycles` : '#',
      testId: 'subbar-item-cycles',
      icon: RefreshCw,
    },
    {
      key: 'timeline',
      label: tNav('timeline'),
      href: validBase ? `${validBase}/timeline` : '#',
      testId: 'subbar-item-timeline',
      icon: GanttChart,
    },
    {
      key: 'initiatives',
      label: tNav('initiatives'),
      href: validBase ? `${validBase}/initiatives` : '#',
      testId: 'subbar-item-initiatives',
      icon: Target,
    },
    {
      key: 'dashboards',
      label: tNav('dashboards'),
      href: validBase ? `${validBase}/dashboards` : '#',
      testId: 'subbar-item-dashboards',
      icon: LayoutDashboard,
    },
    {
      key: 'office',
      label: tNav('office'),
      href: validBase ? `${validBase}/open-office` : '#',
      testId: 'subbar-item-office',
      icon: Building2,
    },
  ];

  return (
    <nav
      data-testid="work-delivery-subbar"
      aria-label="Operations views"
      className="w-full max-w-full overflow-hidden"
    >
      <div className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-border/85 bg-muted/65 p-1 scrollbar-none">
        {items.map((item) => {
          const active = item.key === activeKey;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              data-testid={item.testId}
              prefetch={false}
              aria-current={active ? 'page' : undefined}
              onMouseEnter={() => {
                if (item.href !== '#') preloadFeatureByHref(item.href);
              }}
              onFocus={() => {
                if (item.href !== '#') preloadFeatureByHref(item.href);
              }}
              onClick={(e) => {
                if (
                  item.href !== '#' &&
                  item.href.startsWith('/') &&
                  e.button === 0 &&
                  !e.metaKey &&
                  !e.ctrlKey &&
                  !e.shiftKey &&
                  !e.altKey
                ) {
                  e.preventDefault();
                  navigateFeatureInstant(item.href);
                }
              }}
              className={
                active
                  ? 'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-foreground px-3.5 text-xs font-semibold text-background shadow-xs transition-all'
                  : 'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground'
              }
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
