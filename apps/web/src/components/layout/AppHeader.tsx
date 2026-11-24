import type { ReactNode } from 'react';
import { CircleHelp, MessagesSquare, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePermissions } from '@/hooks/usePermissions';
import { useShellRoute } from '@/hooks/useShellRoute';
import { useHotkeyLabel } from '@/context/useHotkeys';
import { resolveRouteJtbdHint } from '@/utils/jtbdRegistry';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import JtbdWorkflowGuideDrawer, { openJtbdGuide } from '@/components/layout/JtbdWorkflowGuideDrawer';
import UserMenu from '@/components/layout/UserMenu';

// The slim header inside the sidebar inset, shared by the project view and the
// settings pages.
export default function AppHeader({
  title,
  hasProject,
  onOpenCommand,
  chatActive,
  onToggleChat,
}: {
  title: ReactNode;
  hasProject: boolean;
  onOpenCommand: () => void;
  chatActive: boolean;
  onToggleChat: () => void;
}) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const route = useShellRoute();
  const { can } = usePermissions();
  const paletteKey = useHotkeyLabel('palette.toggle');
  const chatKey = useHotkeyLabel('chat.toggle');
  const canUseChat = hasProject && can('ai_agents', 'read');
  const routeHint = resolveRouteJtbdHint(route, locale);
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/80 bg-card/90 px-3 backdrop-blur-xs sm:px-4">
      <SidebarTrigger className="size-8" />
      <Separator orientation="vertical" className="me-1 h-4" />
      <div className="min-w-0 truncate text-sm font-medium">{title}</div>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onOpenCommand}
            aria-label={t('searchHint', { key: paletteKey ?? '' })}
            className="ms-auto flex size-8 shrink-0 items-center justify-center rounded-full border border-border/85 bg-muted/55 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:h-8 sm:w-auto sm:max-w-xs sm:min-w-0 sm:flex-1 sm:shrink sm:justify-start sm:gap-2 sm:px-3"
          >
            <Search className="size-3.5 shrink-0" />
            <span className="hidden truncate sm:inline">{t('search')}</span>
            <kbd
              dir="ltr"
              className="ms-auto hidden rounded-full bg-background/80 px-1.5 py-0 font-mono text-xs text-foreground/80 sm:inline"
            >
              {paletteKey}
            </kbd>
          </button>
        </TooltipTrigger>
        <TooltipContent>{t('searchHint', { key: paletteKey ?? '' })}</TooltipContent>
      </Tooltip>

      {canUseChat && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={chatActive ? 'default' : 'ghost'}
              size="icon"
              className="size-8 shrink-0 rounded-full"
              aria-label={t('aiChatHint', { key: chatKey ?? '' })}
              aria-pressed={chatActive}
              onClick={onToggleChat}
            >
              <MessagesSquare className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('aiChatHint', { key: chatKey ?? '' })}</TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-muted-foreground hover:text-foreground"
            data-testid="btn-global-jtbd-guide"
            aria-label={t('jtbdGuideHint')}
            onClick={() => openJtbdGuide()}
          >
            <CircleHelp className="size-3.5 shrink-0" />
            <span className="hidden text-xs font-medium lg:inline">{t('guideShort')}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs space-y-1">
          <p className="font-medium">{t('jtbdGuideHint')}</p>
          <p className="opacity-80">{routeHint}</p>
        </TooltipContent>
      </Tooltip>

      <UserMenu />
      <JtbdWorkflowGuideDrawer />
    </header>
  );
}
