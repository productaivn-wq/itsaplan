'use client';

import { ArrowUpRight, BookText, Plus, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AgentSkill } from '@/lib/api/endpoints/agentSkills';
import type { ConfiguredTool } from '@/lib/api/endpoints/agentTools';
import { teamSectionPath } from '@/utils/paths';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function CapabilitiesLibraryTab({
  teamRef,
  skills,
  tools,
  canReadSkills,
  canReadTools,
  canCreateSkill,
  canCreateTool,
  search,
  onCreateSkill,
  onCreateTool,
  onNavigate,
}: {
  teamRef: string;
  skills: AgentSkill[];
  tools: ConfiguredTool[];
  canReadSkills: boolean;
  canReadTools: boolean;
  canCreateSkill: boolean;
  canCreateTool: boolean;
  search: string;
  onCreateSkill: () => void;
  onCreateTool: () => void;
  onNavigate: (href: string) => void;
}) {
  const t = useTranslations('teams');
  const q = search.trim().toLowerCase();

  const filteredSkills = q
    ? skills.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.source.toLowerCase().includes(q),
      )
    : skills;

  const filteredTools = q
    ? tools.filter(
        (tool) =>
          tool.toolKey.toLowerCase().includes(q) ||
          tool.integrationKey.toLowerCase().includes(q) ||
          (tool.credentialLabel ?? '').toLowerCase().includes(q),
      )
    : tools;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="space-y-3 rounded-2xl bg-muted/25 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookText className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{t('sections.agentSkills.title')}</h3>
            {canReadSkills && (
              <Badge variant="secondary" className="font-mono text-xs tabular-nums">
                {skills.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {canCreateSkill && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1 px-2.5 text-xs"
                onClick={onCreateSkill}
              >
                <Plus className="size-3.5" />
                {t('skills.newSkill')}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onNavigate(teamSectionPath(teamRef, 'agent-skills'))}
            >
              <span>{t('capabilities.manageAll')}</span>
              <ArrowUpRight className="size-3.5" />
            </Button>
          </div>
        </div>

        {!canReadSkills ? (
          <p className="text-xs text-muted-foreground">{t('skills.noAccess')}</p>
        ) : skills.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('skills.empty')}</p>
        ) : filteredSkills.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t('capabilities.noMatches', { query: search.trim() })}
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredSkills.map((skill) => (
              <li
                key={skill.id}
                className="flex flex-col gap-1 rounded-xl bg-card px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium" dir="auto">
                    {skill.name}
                  </span>
                  <Badge variant="outline" className="shrink-0 font-mono text-xs">
                    {skill.source}
                  </Badge>
                </div>
                {skill.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground" dir="auto">
                    {skill.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-2xl bg-muted/25 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wrench className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{t('sections.agentTools.title')}</h3>
            {canReadTools && (
              <Badge variant="secondary" className="font-mono text-xs tabular-nums">
                {tools.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {canCreateTool && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1 px-2.5 text-xs"
                onClick={onCreateTool}
              >
                <Plus className="size-3.5" />
                {t('tools.add')}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onNavigate(teamSectionPath(teamRef, 'agent-tools'))}
            >
              <span>{t('capabilities.manageAll')}</span>
              <ArrowUpRight className="size-3.5" />
            </Button>
          </div>
        </div>

        {!canReadTools ? (
          <p className="text-xs text-muted-foreground">{t('tools.noAccess')}</p>
        ) : tools.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('tools.empty')}</p>
        ) : filteredTools.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t('capabilities.noMatches', { query: search.trim() })}
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredTools.map((tool) => (
              <li
                key={tool.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-card px-3 py-2.5"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate font-mono text-xs font-medium text-foreground">
                    {tool.toolKey}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {tool.credentialLabel || tool.integrationKey}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 font-mono text-xs">
                  {tool.integrationKey}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
