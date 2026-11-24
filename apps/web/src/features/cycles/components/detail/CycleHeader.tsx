'use client';

import { useState } from 'react';
import { Building2, GanttChart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { openOfficePath, projectPath } from '@/utils/paths';
import { Button } from '@/components/ui/button';
import type { Cycle } from '@/lib/api/endpoints/cycles';
import { CYCLE_STATUS_META } from '@/utils/cycleMeta';
import { colorDot } from '@/components/common/fields/colorDot';
import ProgressBar from '@/components/common/ProgressBar';
import CycleActions from '../CycleActions';
import CycleRange from '../CycleRange';
import TransferIssuesDialog from '../TransferIssuesDialog';

// The cycle detail header: name, the status its dates put it in, the range, and how
// much of it is done. Editing happens in the overflow menu dialog, and the transfer
// dialog is held here, the way the cycles table holds it.
export default function CycleHeader({ cycle, projectKey }: { cycle: Cycle; projectKey: string }) {
  const t = useTranslations('cycles');
  const status = CYCLE_STATUS_META[cycle.status];
  const [transferring, setTransferring] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 border-b px-6 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">{cycle.name}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {colorDot(status.color)}
          {t(`status.${cycle.status}`)}
        </span>
        <span className="text-xs text-muted-foreground">
          <CycleRange cycle={cycle} />
        </span>
        {cycle.goal && (
          <span className="max-w-md truncate text-xs text-muted-foreground">{cycle.goal}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1 px-2 text-xs"
          onClick={() => navigateFeatureInstant(`${openOfficePath(projectKey)}?cycle_id=${cycle.id}`)}
        >
          <Building2 className="size-3.5" />
          <span>Office</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1 px-2 text-xs"
          onClick={() => navigateFeatureInstant(`${projectPath(projectKey)}/timeline`)}
        >
          <GanttChart className="size-3.5" />
          <span>Timeline</span>
        </Button>
        <ProgressBar progress={cycle.progress} />
        <CycleActions
          cycle={cycle}
          projectKey={projectKey}
          onTransfer={() => setTransferring(true)}
        />
      </div>

      {transferring && (
        <TransferIssuesDialog
          cycle={cycle}
          projectKey={projectKey}
          onClose={() => setTransferring(false)}
        />
      )}
    </div>
  );
}
