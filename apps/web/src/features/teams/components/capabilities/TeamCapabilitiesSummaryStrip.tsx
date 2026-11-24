'use client';

import { BookText, Bot, Building2, FolderKanban, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AiAgent } from '@/lib/api/endpoints/agents';
import type { CompanySettings } from '@/lib/api/endpoints/company';
import type { Team } from '@/lib/api/endpoints/teams';
import { companySettingsPath, teamSectionPath } from '@/utils/paths';
import { Badge } from '@/components/ui/badge';

export default function TeamCapabilitiesSummaryStrip({
  team,
  company,
  agents,
  mcpProjectCount,
  onNavigate,
}: {
  team: Team;
  company: CompanySettings | undefined;
  agents: AiAgent[];
  mcpProjectCount: number;
  onNavigate: (href: string) => void;
}) {
  const t = useTranslations('teams');
  const internalCount = agents.filter((a) => a.kind === 'internal').length;
  const externalCount = agents.filter((a) => a.kind === 'external').length;

  const cards = [
    {
      id: 'company',
      label: t('capabilities.cards.company'),
      icon: Building2,
      value: company?.companyName || team.name,
      badge: company?.defaultAutonomyTier ?? 'TIER_1',
      subtext: company?.requireSodApproval
        ? t('capabilities.sodEnforced')
        : t('capabilities.sodOptional'),
      href: companySettingsPath(),
    },
    {
      id: 'projects',
      label: t('capabilities.cards.projects'),
      icon: FolderKanban,
      value: String(team.projectCount),
      badge: null,
      subtext: t('capabilities.mcpEnabledCount', { count: mcpProjectCount }),
      href: teamSectionPath(team.ref, 'projects'),
    },
    {
      id: 'agents',
      label: t('capabilities.cards.agents'),
      icon: Bot,
      value: String(team.agentCount),
      badge: null,
      subtext:
        agents.length > 0
          ? t('capabilities.agentsSplit', { internal: internalCount, external: externalCount })
          : t('capabilities.cards.agentsHint'),
      href: teamSectionPath(team.ref, 'ai-agents'),
    },
    {
      id: 'skills',
      label: t('capabilities.cards.skills'),
      icon: BookText,
      value: String(team.skillCount),
      badge: null,
      subtext: t('capabilities.cards.skillsHint'),
      href: teamSectionPath(team.ref, 'agent-skills'),
    },
    {
      id: 'tools',
      label: t('capabilities.cards.tools'),
      icon: Wrench,
      value: String(team.toolCount),
      badge: null,
      subtext: t('capabilities.integrationsCount', { count: team.integrationCount }),
      href: teamSectionPath(team.ref, 'agent-tools'),
    },
  ];

  return (
    <div
      data-testid="capabilities-summary-strip"
      className="grid grid-cols-2 gap-3 lg:grid-cols-5"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.id}
            type="button"
            data-testid={`capabilities-kpi-${card.id}`}
            onClick={() => onNavigate(card.href)}
            className="flex min-w-0 flex-col gap-3 gap-2 overflow-hidden rounded-xl bg-muted/35 p-3.5 text-start transition-colors hover:bg-muted/65"
          >
            <div className="flex w-full min-w-0 items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate">{card.label}</span>
              </span>
              {card.badge && (
                <Badge variant="outline" className="shrink-0 font-mono text-xs">
                  {card.badge}
                </Badge>
              )}
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-lg font-semibold tabular-nums text-foreground">
                {card.value}
              </p>
              <p className="truncate text-xs text-muted-foreground">{card.subtext}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
