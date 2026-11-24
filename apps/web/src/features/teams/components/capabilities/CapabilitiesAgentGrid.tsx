'use client';

import { Bot } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AiAgent } from '@/lib/api/endpoints/agents';
import { EmptyState } from '@/components/common/page/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function CapabilitiesAgentGrid({
  agents,
  canReadAgents,
  canEditAgents,
  search,
  onSelectAgent,
}: {
  agents: AiAgent[];
  canReadAgents: boolean;
  canEditAgents: boolean;
  search: string;
  onSelectAgent: (agent: AiAgent) => void;
}) {
  const t = useTranslations('teams');
  const tCommon = useTranslations('common');

  if (!canReadAgents) {
    return (
      <EmptyState title={t('sections.agents.title')} description={t('agents.noAccess')} />
    );
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? agents.filter((a) => {
        const projHaystack = a.projects.map((p) => `${p.name} ${p.key}`).join(' ');
        return (
          a.name.toLowerCase().includes(q) ||
          a.username.toLowerCase().includes(q) ||
          (a.model ?? '').toLowerCase().includes(q) ||
          (a.modelProvider ?? '').toLowerCase().includes(q) ||
          projHaystack.toLowerCase().includes(q)
        );
      })
    : agents;

  if (agents.length === 0) {
    return <EmptyState title={t('agents.empty')} description={t('agents.emptyHint')} />;
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        title={t('capabilities.noMatchesTitle')}
        description={t('capabilities.noMatches', { query: search.trim() })}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-card">
      <Table className="min-w-[740px] table-fixed">
        <colgroup>
          <col className="w-[30%]" />
          <col className="w-[28%]" />
          <col className="w-[28%]" />
          <col className="w-[14%]" />
        </colgroup>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-medium text-muted-foreground">
              {t('agents.agent')}
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground">
              {t('agents.projects')}
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground">
              {t('capabilities.columns.capabilities')}
            </TableHead>
            <TableHead className="text-end text-xs font-medium text-muted-foreground">
              {tCommon('actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((agent) => (
            <TableRow key={agent.id} data-testid={`capabilities-agent-row-${agent.username}`}>
              <TableCell className="px-3 py-3 align-middle">
                <div className="flex min-w-0 items-start gap-2">
                  <Bot className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-medium" dir="auto">
                        {agent.name}
                      </span>
                      <Badge variant="outline" className="font-mono text-xs uppercase">
                        {agent.kind}
                      </Badge>
                    </div>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      @{agent.username}
                      {agent.model ? ` · ${agent.model}` : ''}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell className="px-3 py-3 align-middle whitespace-normal">
                {agent.projects.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {t('agents.noProjectsShort')}
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {agent.projects.map((p) => (
                      <Badge key={p.id} variant="secondary" className="font-mono text-xs">
                        {p.key}
                      </Badge>
                    ))}
                  </div>
                )}
              </TableCell>

              <TableCell className="px-3 py-3 align-middle text-xs text-muted-foreground tabular-nums">
                {t('agents.skillCount', { count: agent.skillCount })} ·{' '}
                {t('agents.toolCount', { count: agent.toolCount })} ·{' '}
                {t('agents.actionCount', { count: agent.actionCount })}
              </TableCell>

              <TableCell className="px-3 py-3 text-end align-middle">
                {canEditAgents ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs"
                    onClick={() => onSelectAgent(agent)}
                  >
                    {t('capabilities.configure')}
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground capitalize">{agent.kind}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
