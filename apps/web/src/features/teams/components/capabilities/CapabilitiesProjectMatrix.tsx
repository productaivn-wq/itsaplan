'use client';

import Link from 'next/link';
import { ArrowUpRight, Bot } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AiAgent } from '@/lib/api/endpoints/agents';
import type { TeamProjectOption } from '@/lib/api/endpoints/teams';
import { projectPath } from '@/utils/paths';
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

export default function CapabilitiesProjectMatrix({
  projects,
  agents,
  teamMcpEnabled,
  search,
  canReadAgents,
  canEditAgents,
  onSelectAgent,
  onOpenMcp,
}: {
  projects: TeamProjectOption[];
  agents: AiAgent[];
  teamMcpEnabled: boolean;
  search: string;
  canReadAgents: boolean;
  canEditAgents: boolean;
  onSelectAgent: (agent: AiAgent) => void;
  onOpenMcp: () => void;
}) {
  const t = useTranslations('teams');
  const q = search.trim().toLowerCase();
  const filtered = q
    ? projects.filter(
        (p) => p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q),
      )
    : projects;

  if (projects.length === 0) {
    return (
      <EmptyState
        title={t('capabilities.noProjects')}
        description={t('capabilities.noProjectsHint')}
      />
    );
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
      <Table className="min-w-[720px] table-fixed">
        <colgroup>
          <col className="w-[30%]" />
          <col className="w-[36%]" />
          <col className="w-[20%]" />
          <col className="w-[14%]" />
        </colgroup>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-medium text-muted-foreground">
              {t('columns.project')}
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground">
              {t('capabilities.columns.assignedAgents')}
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground">
              {t('capabilities.columns.coverage')}
            </TableHead>
            <TableHead className="text-end text-xs font-medium text-muted-foreground">
              {t('capabilities.columns.mcpReach')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((project) => {
            const attached = agents.filter((a) => a.projects.some((p) => p.id === project.id));
            const totalSkills = attached.reduce((sum, a) => sum + a.skillCount, 0);
            const totalTools = attached.reduce((sum, a) => sum + a.toolCount, 0);
            const mcpOn = teamMcpEnabled && project.mcpEnabled;

            return (
              <TableRow key={project.id} data-testid={`capabilities-project-row-${project.key}`}>
                <TableCell className="px-3 py-3 align-middle">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge
                      variant="outline"
                      className="min-w-12 shrink-0 justify-center rounded px-1.5 py-0 font-mono text-xs text-muted-foreground"
                    >
                      {project.key}
                    </Badge>
                    <span className="min-w-0 truncate text-sm font-medium" dir="auto">
                      {project.name}
                    </span>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="ms-auto size-8 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label={t('panel.openProject')}
                      title={t('panel.openProject')}
                    >
                      <Link href={projectPath(project.ref)}>
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>

                <TableCell className="px-3 py-3 align-middle whitespace-normal">
                  {!canReadAgents ? (
                    <span className="text-xs text-muted-foreground">
                      {t('capabilities.restricted')}
                    </span>
                  ) : attached.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {t('capabilities.noAgentsAttached')}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {attached.map((agent) =>
                        canEditAgents ? (
                          <button
                            key={agent.id}
                            type="button"
                            onClick={() => onSelectAgent(agent)}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent"
                          >
                            <Bot className="size-3 shrink-0" />
                            <span className="font-mono">@{agent.username}</span>
                          </button>
                        ) : (
                          <Badge
                            key={agent.id}
                            variant="secondary"
                            className="rounded-full font-mono text-xs"
                          >
                            @{agent.username}
                          </Badge>
                        ),
                      )}
                    </div>
                  )}
                </TableCell>

                <TableCell className="px-3 py-3 align-middle text-xs text-muted-foreground tabular-nums">
                  {!canReadAgents
                    ? '—'
                    : t('capabilities.coverageSummary', {
                        skills: totalSkills,
                        tools: totalTools,
                      })}
                </TableCell>

                <TableCell className="px-3 py-3 text-end align-middle">
                  <button
                    type="button"
                    onClick={onOpenMcp}
                    className="inline-flex items-center rounded-full focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
                  >
                    <Badge
                      variant={mcpOn ? 'default' : 'outline'}
                      className="font-mono text-xs"
                    >
                      {mcpOn ? t('mcp.statusOn') : t('mcp.statusOff')}
                    </Badge>
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
