'use client';

import ItsAPlanMark, { AccordWordmarkSvg } from '@/components/brand/ItsAPlanMark';
import { isHostVibeEnabled } from '@/lib/security/hostVibeClient';
import { useCompanySettingsQuery } from '@/services/company.service';
import { useAppVersionQuery } from '@/services/updates.service';
import { APP_NAME } from '@/utils/app';

// The ACCORD Sovereign Agentic OS product mark and white-label company wordmark
// at the bottom of both sidebars, with the running version and 3-node treaty bar.
export default function SidebarBrandFooter() {
  const { data: appVersion } = useAppVersionQuery();
  const { data: company } = useCompanySettingsQuery();
  const version = appVersion?.version;

  const showHostBrand = isHostVibeEnabled();
  const companyTitle = !showHostBrand ? company?.companyName?.trim() : '';
  const brandSubtitle = showHostBrand
    ? version
      ? `Sovereign OS · v${version}`
      : 'Sovereign OS · Ready'
    : version
      ? `AI Workspace · v${version}`
      : 'AI Workspace · Ready';

  return (
    <div className="ag-brand-lockup flex w-full items-center gap-2.5 px-2 pt-2 pb-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <ItsAPlanMark className="size-9 shrink-0 text-sidebar-foreground" />
      <div className="grid min-w-0 text-left leading-none group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-2">
          {companyTitle ? (
            <span
              data-testid="sidebar-brand-name"
              className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground"
            >
              {companyTitle}
            </span>
          ) : (
            <AccordWordmarkSvg className="h-4 w-auto text-sidebar-foreground" />
          )}
          <span className="sr-only">{companyTitle || APP_NAME}</span>
        </div>
        <span className="mt-1 font-mono text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {brandSubtitle}
        </span>
      </div>
    </div>
  );
}
