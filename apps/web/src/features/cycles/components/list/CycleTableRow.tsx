import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { Cycle } from '@/lib/api/endpoints/cycles';
import { cyclePath } from '@/utils/paths';
import ProgressBar from '@/components/common/ProgressBar';
import CycleActions from '../CycleActions';
import CycleRange from '../CycleRange';
import { formatCycleDuration, formatCycleTimeLeft } from '../../utils/cycleDates';

// One cycle as a table row. The whole row navigates to the cycle; the name is also
// a real anchor so middle/cmd-click opens it in a new tab.
export default function CycleTableRow({
  cycle,
  projectKey,
  gridTemplate,
  onTransfer,
}: {
  cycle: Cycle;
  projectKey: string;
  gridTemplate: string;
  onTransfer: (cycle: Cycle) => void;
}) {
  const router = useRouter();
  const isVi = useLocale().toLowerCase().startsWith('vi');
  const href = cyclePath(projectKey, cycle.id);

  return (
    <div
      onClick={() => router.push(href)}
      className="grid cursor-pointer items-center gap-3 border-b border-border/65 px-4 py-3 text-sm transition-colors hover:bg-muted/45"
      style={{ gridTemplateColumns: gridTemplate }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex min-h-8 items-center truncate font-medium text-foreground hover:underline"
        >
          {cycle.name}
        </Link>
        {cycle.goal && <span className="truncate text-xs text-muted-foreground">{cycle.goal}</span>}
      </div>

      <span className="text-xs text-muted-foreground tabular-nums">
        <CycleRange cycle={cycle} />
        {cycle.status === 'active' && ` · ${formatCycleTimeLeft(cycle, new Date(), isVi)}`}
      </span>

      <span className="text-xs text-muted-foreground tabular-nums">{formatCycleDuration(cycle, isVi)}</span>

      <span className="text-xs font-medium text-foreground tabular-nums">{cycle.progress.total}</span>

      <ProgressBar progress={cycle.progress} />

      <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
        <CycleActions cycle={cycle} projectKey={projectKey} onTransfer={onTransfer} />
      </div>
    </div>
  );
}
