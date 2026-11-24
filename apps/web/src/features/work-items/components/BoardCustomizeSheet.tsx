'use client';

import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ProjectDetail } from '@/lib/api/endpoints/projects';
import { usePermissions } from '@/hooks/usePermissions';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import BoardCustomizeSheetContent from './BoardCustomizeSheetContent';

// IAD-ITSAPLAN §5: Contextual 380px Slide-Over Governance Drawer re-homing
// UC-001.S01 (Features), UC-001.S02 (Workflow Columns & Soft/Hard WIP),
// UC-002 (Estimates, Subtasks, Auto-Archive), and UC-004.S02 (Webhooks)
// inline on the Work Items surface without re-introducing /settings/* routes.
export default function BoardCustomizeSheet({ project }: { project: ProjectDetail }) {
  const tNav = useTranslations('nav');
  const { can, isAdmin } = usePermissions();

  const canEditFeatures = isAdmin;
  const canReadWorkflow = can('workflow_config', 'read');
  const canReadWebhooks = can('webhooks', 'read');

  const [open, setOpen] = useState(false);

  if (!canEditFeatures && !canReadWorkflow && !canReadWebhooks) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          data-testid="board-customize-trigger"
          title={tNav('configuration')}
          aria-label={tNav('configuration')}
          className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Settings2 className="size-4" />
        </button>
      </SheetTrigger>
      {open && (
        <BoardCustomizeSheetContent
          project={project}
          canEditFeatures={canEditFeatures}
          canReadWorkflow={canReadWorkflow}
          canReadWebhooks={canReadWebhooks}
        />
      )}
    </Sheet>
  );
}
