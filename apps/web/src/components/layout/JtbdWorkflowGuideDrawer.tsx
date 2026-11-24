'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, Compass, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { useShellRoute } from '@/hooks/useShellRoute';
import { cn } from '@/lib/utils';
import { isTypingTarget } from '@/utils/hotkeys';
import {
  JTBD_STEPS,
  isRouteMatchingStep,
  resolveRouteJtbdHint,
  type JtbdStage,
} from '@/utils/jtbdRegistry';
import { companySettingsPath } from '@/utils/paths';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export const JTBD_GUIDE_EVENT = 'itsaplan:open-jtbd-guide';

const STAGE_GROUPS: readonly {
  id: JtbdStage;
  label: { en: string; vi: string };
}[] = [
  { id: 'daily', label: { en: 'Daily Work', vi: 'Công việc hằng ngày' } },
  { id: 'ai', label: { en: 'AI Operations', vi: 'Vận hành AI' } },
  { id: 'trust', label: { en: 'Security & Trust', vi: 'Bảo mật & Tổ chức' } },
];

export function openJtbdGuide(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(JTBD_GUIDE_EVENT));
}

export default function JtbdWorkflowGuideDrawer() {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations('nav');
  const route = useShellRoute();
  const { projectKey } = route;
  const isVi = locale.toLowerCase().startsWith('vi');
  const currentHint = resolveRouteJtbdHint(route, locale);

  useEffect(() => {
    const onOpenGuide = () => setOpen(true);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== '?' && !(e.key === '/' && e.shiftKey)) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      setOpen((prev) => !prev);
    };

    window.addEventListener(JTBD_GUIDE_EVENT, onOpenGuide);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener(JTBD_GUIDE_EVENT, onOpenGuide);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        data-testid="jtbd-workflow-guide-drawer"
        className="w-full overflow-y-auto p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b px-5 py-4 pe-12">
          <div className="flex items-center gap-2">
            <Compass className="size-4 shrink-0 text-primary" />
            <SheetTitle className="text-base">{t('jtbdGuide')}</SheetTitle>
          </div>
          <SheetDescription className="text-xs leading-relaxed">
            {isVi
              ? 'Lộ trình làm việc gồm ba giai đoạn: Công việc hằng ngày, Vận hành AI và Bảo mật & Tổ chức. Chọn bất kỳ bước nào để chuyển đến ngay.'
              : 'Navigate your workspace across three stages: Daily Work, AI Operations, and Security & Trust. Select any step to jump straight there.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div
            data-testid="guide-jtbd-context-hint"
            className="rounded-lg border border-primary/25 bg-primary/5 px-3.5 py-2.5 text-xs leading-relaxed text-foreground"
          >
            <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isVi ? 'Màn hình hiện tại' : 'Current view'}
            </div>
            <div>{currentHint}</div>
          </div>

          {STAGE_GROUPS.map((stage) => {
            const items = JTBD_STEPS.filter((item) => item.stage === stage.id);
            return (
              <section key={stage.id} className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {isVi ? stage.label.vi : stage.label.en}
                </h3>
                <div className="flex flex-col gap-2">
                  {items.map((item) => {
                    const title = isVi ? item.title.vi : item.title.en;
                    const surface = isVi ? item.surface.vi : item.surface.en;
                    const description = isVi ? item.description.vi : item.description.en;
                    const isActive = isRouteMatchingStep(route, item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`jtbd-guide-step-${item.step}`}
                        data-active-step={isActive ? 'true' : undefined}
                        aria-current={isActive ? 'step' : undefined}
                        disabled={!projectKey}
                        onClick={() => {
                          if (!projectKey) return;
                          navigateFeatureInstant(item.href(projectKey));
                          setOpen(false);
                        }}
                        className={cn(
                          'group flex w-full flex-col gap-1.5 rounded-lg border p-3.5 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                          isActive
                            ? 'border-primary bg-primary/5'
                            : 'bg-card hover:border-primary/50 hover:bg-accent/50',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{title}</span>
                            <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              {surface}
                            </span>
                            {isActive && (
                              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                                {isVi ? 'Đang mở' : 'Current'}
                              </span>
                            )}
                          </div>
                          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground rtl:rotate-180" />
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {description}
                        </p>
                        <div className="flex items-center justify-between pt-0.5">
                          <kbd
                            dir="ltr"
                            className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
                          >
                            {item.shortcut}
                          </kbd>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <div className="border-t pt-3">
            <Link
              href={companySettingsPath()}
              prefetch={false}
              data-testid="jtbd-guide-org-settings"
              onClick={() => setOpen(false)}
              className="group flex w-full items-center justify-between gap-3 rounded-lg border bg-card p-3.5 text-start transition-colors hover:border-primary/50 hover:bg-accent/50"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">
                    {isVi ? 'Tổ chức & Quyền truy cập nhóm' : 'Organization & Team Access'}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {isVi
                      ? 'Quản lý hồ sơ công ty, đội ngũ, vai trò và quyền truy cập.'
                      : 'Manage company profile, teams, member roles, and workspace access.'}
                  </p>
                </div>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground rtl:rotate-180" />
            </Link>
          </div>
        </div>

        <SheetFooter className="flex-row flex-wrap items-center justify-between gap-2 border-t px-5 py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <kbd
                dir="ltr"
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
              >
                ⌘K
              </kbd>
              <span>{isVi ? 'Tìm' : 'Search'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd
                dir="ltr"
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
              >
                N
              </kbd>
              <span>{isVi ? 'Mới' : 'New'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd
                dir="ltr"
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
              >
                1–5
              </kbd>
              <span>{isVi ? 'Xem' : 'Views'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd
                dir="ltr"
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
              >
                ?
              </kbd>
              <span>{isVi ? 'Hướng dẫn' : 'Guide'}</span>
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="btn-close-jtbd-guide"
            onClick={() => setOpen(false)}
            className="h-8 gap-1.5 text-xs"
          >
            <X className="size-3.5" />
            {isVi ? 'Đóng' : 'Close'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
