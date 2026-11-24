'use client';

import Link from 'next/link';
import { Bot, Check, Settings2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AiAgent } from '@/lib/api/endpoints/agents';
import { aiAgentsPath } from '@/utils/paths';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AgentRunnerStatus } from '@/components/common/agent-chat/AgentRunnerStatus';
import { agentModelLabel } from '../../utils/agentModelLabel';

// The project's agents to pick from, as the content of a dropdown the host opens with
// its own trigger. An external agent shows the state of its runner instead of a model:
// it answers only while that runner is connected.
export function AiChatAgentMenu({
  agents,
  selectedId,
  providerLabel,
  onSelect,
  projectKey,
  canManageAgents = false,
}: {
  agents: AiAgent[];
  selectedId: number | null;
  providerLabel: (key: string) => string;
  onSelect: (agentId: number) => void;
  projectKey?: string;
  canManageAgents?: boolean;
}) {
  const t = useTranslations('aiChat');

  return (
    <DropdownMenuContent align="start" className="w-64">
      <DropdownMenuLabel>{t('agents')}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {agents.map((agent) => (
        <DropdownMenuItem key={agent.id} onSelect={() => onSelect(agent.id)} className="gap-2">
          <Bot className="size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm">{agent.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {agent.kind === 'external' ? (
                <AgentRunnerStatus agent={agent} compact />
              ) : (
                agentModelLabel(agent, providerLabel, t('noModel'))
              )}
            </div>
          </div>
          {agent.id === selectedId && <Check className="size-4 shrink-0" />}
        </DropdownMenuItem>
      ))}
      {projectKey && canManageAgents && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="gap-2 text-muted-foreground">
            <Link href={aiAgentsPath(projectKey)}>
              <Settings2 className="size-4 shrink-0" />
              <span>{t('manageAgents')}</span>
            </Link>
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );
}
