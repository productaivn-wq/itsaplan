'use client';

import { useState } from 'react';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useShell } from '@/context/shellContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { usePlannedCyclesQuery } from '@/services/cycles.service';
import { progressPercent } from '@/utils/progress';
import { cyclesViewPath, type CyclesView } from '@/utils/paths';
import { rememberCyclesView } from './utils/cyclesView';
import { useCompletedCycles } from './hooks/useCompletedCycles';
import CyclesList from './components/list/CyclesList';
import CyclesViewTabs from './components/list/CyclesViewTabs';
import CycleFormDialog from './components/CycleFormDialog';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import { revScope } from '@/utils/revScopes';
import { qk } from '@/services/queryKeys';

// A project's cycles, grouped by the status their dates put them in, as a table or
// on a timeline. Each layout is a route of its own, and the one picked becomes the
// project's remembered layout. What is still planned loads whole — it stays a
// handful of cycles however old the project is; the finished ones only accumulate,
// so they are a paged archive of their own.
export default function CyclesPage({ view }: { view: CyclesView }) {
  const t = useTranslations('cycles');
  const { project } = useShell();
  const { can } = usePermissions();
  const [creating, setCreating] = useState(false);

  const projectKey = project?.project.ref ?? null;
  const query = usePlannedCyclesQuery(projectKey);
  const completed = useCompletedCycles(projectKey);

  useLiveRefresh({
    scope: project ? revScope.board(project.project.id) : null,
    targets: [
      qk.cycles(projectKey ?? ''),
      qk.plannedCycles(projectKey ?? ''),
      qk.completedCycles(projectKey ?? ''),
    ],
  });

  if (!project || !projectKey) return null;

  const cycles = query.data ?? [];
  const activeCount = cycles.filter((c) => c.status === 'active').length;
  const activeCycle = cycles.find((c) => c.status === 'active');
  const totalIssues = cycles.reduce((sum, c) => sum + c.progress.total, 0);
  const aggProgress = cycles.reduce(
    (acc, c) => ({
      completed: acc.completed + c.progress.completed,
      canceled: acc.canceled + c.progress.canceled,
      total: acc.total + c.progress.total,
    }),
    { completed: 0, canceled: 0, total: 0 },
  );
  const avgProgressPct = activeCycle
    ? progressPercent(activeCycle.progress)
    : progressPercent(aggProgress);

  const changeView = (next: CyclesView) => {
    rememberCyclesView(projectKey, next);
    navigateFeatureInstant(cyclesViewPath(projectKey, next));
  };

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${view === 'table' ? 'overflow-y-auto' : 'overflow-hidden'}`}>
      <h1 className="sr-only">{t('title')}</h1>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <CyclesViewTabs view={view} onSelect={changeView} />
        {can('cycles', 'create') && (
          <Button
            size="sm"
            className="h-9 gap-1.5 rounded-full bg-foreground px-3.5 text-xs text-background hover:bg-foreground/90"
            onClick={() => setCreating(true)}
          >
            <Plus className="size-3.5" />
            {t('newCycle')}
          </Button>
        )}
      </div>

      <div className="mx-4 mb-2.5 sm:mx-6">
        <div className="studio-kpi-band grid grid-cols-2 divide-y divide-border/75 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {[
            { label: t('status.active'), value: activeCount, dot: 'bg-emerald-500' },
            { label: t('status.completed'), value: completed.total, dot: 'bg-sky-500' },
            { label: t('columns.issues'), value: totalIssues, dot: 'bg-amber-500' },
            { label: t('progress'), value: `${avgProgressPct}%`, dot: 'bg-foreground/70' },
          ].map((kpi) => (
            <div key={kpi.label} className="px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className={`size-1.5 rounded-full ${kpi.dot}`} />
                <span>{kpi.label}</span>
              </div>
              <div className="mt-0.5 font-heading text-xl font-bold tracking-tight text-foreground tabular-nums">
                {kpi.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CyclesList
        cycles={cycles}
        completed={completed}
        projectKey={projectKey}
        view={view}
        isLoading={query.isLoading || completed.isLoading}
        canCreate={can('cycles', 'create')}
        onCreate={() => setCreating(true)}
      />

      {creating && <CycleFormDialog projectKey={projectKey} onClose={() => setCreating(false)} />}
    </div>
  );
}
