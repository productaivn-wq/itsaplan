'use client';

import ItsAPlanMark, { AccordWordmarkSvg } from '@/components/brand/ItsAPlanMark';
import { useAppVersionQuery } from '@/services/updates.service';
import { APP_NAME } from '@/utils/app';

// The ACCORD Sovereign Agentic OS product mark and custom Swiss geometric wordmark
// at the bottom of both sidebars, with the running version and 3-node treaty bar.
export default function SidebarBrandFooter() {
  const { data: appVersion } = useAppVersionQuery();
  const version = appVersion?.version;

  return (
    <div className="ag-brand-lockup flex w-full items-center gap-2.5 px-2 pt-2 pb-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <ItsAPlanMark className="size-9 shrink-0 text-sidebar-foreground" />
      <div className="grid text-left leading-none group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-2">
          <AccordWordmarkSvg className="h-4 w-auto text-sidebar-foreground" />
          <span className="sr-only">{APP_NAME}</span>
        </div>
        <span className="mt-1 font-mono text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
          {version ? `Sovereign OS · v${version}` : 'Sovereign OS · P=1'}
        </span>
      </div>
    </div>
  );
}
