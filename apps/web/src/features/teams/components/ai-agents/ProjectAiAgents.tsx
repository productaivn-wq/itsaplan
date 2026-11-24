'use client';

import { useState } from 'react';
import { MessageSquarePlus, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AiAgent } from '@/lib/api/endpoints/agents';
import { useProjectAgents } from '@/hooks/useProjectAgents';
import { useShell } from '@/context/shellContext';
import { useIntegrationCatalogQuery } from '@/services/integrations.service';
import { integrationLabel } from '@/utils/integrationLabels';
import { AgentRunnerStatus } from '@/components/common/agent-chat/AgentRunnerStatus';
import ListPager from '@/components/common/ListPager';
import { usePaging } from '@/hooks/usePaging';
import { EmptyState } from '@/components/common/page/EmptyState';
import ListSkeleton from '@/components/common/skeleton/ListSkeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PixelAgentAvatar } from '@/features/vibe-canvas/open-office/PixelOfficeSprites';
import { useAgentSection } from '../../context/agentSection';
import { AgentMetaChip } from './AgentMetaChip';
import { AgentMetaRow } from './AgentMetaRow';
import { AgentTriggers } from './AgentTriggers';
import { TeamAiAgentSheet } from './TeamAiAgentSheet';

export default function ProjectAiAgents() {
  const t = useTranslations('settings.agents');
  const tTeam = useTranslations('teams.agents');
  const tChat = useTranslations('aiChat');
  const tCommon = useTranslations('common');
  const { onChatWithAgent } = useShell();
  const { teamId } = useAgentSection();
  const query = useProjectAgents();
  const paging = usePaging();
  const [selectedAgent, setSelectedAgent] = useState<AiAgent | null>(null);

  const agents = query.data ?? [];
  const shown = paging.slice(agents);
  const catalog = useIntegrationCatalogQuery(teamId).data ?? [];

  if (query.isPending) return <ListSkeleton rows={3} rowClassName="h-12" />;

  if (query.isError) {
    return (
      <EmptyState
        title={tChat('loadErrorTitle')}
        description={query.error instanceof Error ? query.error.message : tChat('loadErrorDescription')}
      >
        <Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>
          {tChat('retry')}
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      {agents.length === 0 ? (
        <EmptyState title={t('empty')} description={t('emptyHint')} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border/85 bg-card shadow-[var(--studio-card-shadow)]">
            <Table className="w-full min-w-0">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-muted-foreground">
                    {tTeam('agent')}
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">
                    {tTeam('columns.triggers')}
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">
                    {tTeam('columns.configuration')}
                  </TableHead>
                  <TableHead className="text-end text-xs font-medium text-muted-foreground">
                    {tCommon('actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((agent) => (
                  <TableRow
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className="group/item cursor-pointer"
                  >
                    <TableCell className="px-3 py-3 align-middle whitespace-normal">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/40 p-1">
                          <PixelAgentAvatar seed={agent.name} status="WORKING" size={28} />
                        </div>
                        <div className="flex min-w-0 flex-col gap-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="truncate text-sm font-medium">{agent.name}</span>
                            <span className="truncate font-mono text-xs text-muted-foreground">
                              @{agent.username}
                            </span>
                          </div>
                          {agent.instructions && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="truncate text-xs text-muted-foreground">
                                  {agent.instructions}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-md whitespace-pre-wrap text-xs">
                                {agent.instructions}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 align-middle whitespace-normal">
                      <AgentTriggers agent={agent} />
                    </TableCell>
                    <TableCell className="px-3 py-3 align-middle whitespace-normal">
                      <div className="flex flex-col items-start gap-1.5">
                        <AgentMetaRow
                          agent={agent}
                          providerLabel={(key: string) => integrationLabel(catalog, key)}
                        />
                        {agent.kind === 'external' && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <AgentRunnerStatus agent={agent} />
                            <AgentMetaChip icon={Shield}>
                              {agent.runnerScope === 'owner'
                                ? tTeam('runnerScopeOwner')
                                : tTeam('runnerScopeTeam')}
                            </AgentMetaChip>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 align-middle">
                      <div className="flex items-center justify-end">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8 rounded-full"
                              aria-label={tChat('newChat')}
                              onClick={(e) => {
                                e.stopPropagation();
                                onChatWithAgent(agent.id);
                              }}
                            >
                              <MessageSquarePlus className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{tChat('newChat')}</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ListPager paging={paging} total={agents.length} />
          <TeamAiAgentSheet
            open={selectedAgent != null}
            agent={selectedAgent}
            onClose={() => setSelectedAgent(null)}
            compact
          />
        </>
      )}
    </div>
  );
}
