'use client';

// UNIFIED_AI_AGENTS_AND_SWARM_361 (SPEC-ITSAPLAN-PORTFOLIO-DEDUP-361):
// Consolidates Project AI Agents, Open Office Workspace (ACCORD v3.3.0),
// Sovereign AOP Swarm, Schedules, MCP, and API Docs into AI Agents.

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  Bot,
  Building2,
  CalendarClock,
  Cpu,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { PaneActiveProvider, useIsPaneActive } from '@/context/paneActiveContext';
import { useShell } from '@/context/shellContext';
import { useTeamQuery } from '@/services/teams.service';
import { AI_AGENTS_SECTION } from '@/utils/settingsSections';
import { useSettingsSectionText } from '@/hooks/useSectionLabels';
import { openOfficePath, splitProjectRef, teamSectionPath } from '@/utils/paths';
import { isHostVibeEnabled } from '@/lib/security/hostVibeClient';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import SectionPageView from '@/components/common/page/SectionPageView';
import RequirePermission from '@/components/common/permissions/RequirePermission';
import ListSkeleton from '@/components/common/skeleton/ListSkeleton';
import { Button } from '@/components/ui/button';
import type { VibeAgent, VibeTask } from '@/features/vibe-canvas/types';
import { AgentSectionProvider } from '../../context/agentSection';
import ProjectAiAgents from './ProjectAiAgents';

const LoadingAgentsPane = () => <ListSkeleton rows={4} />;

const OpenOfficeWorkspaceView = dynamic(
  () => import('@/features/vibe-canvas/components/OpenOfficeWorkspaceView'),
  { ssr: false, loading: LoadingAgentsPane },
);
const AgentSwarmView = dynamic(
  () => import('@/features/vibe-canvas/components/AgentSwarmView'),
  { ssr: false, loading: LoadingAgentsPane },
);
const SettingsSchedulesPage = dynamic(
  () => import('@/features/settings/SettingsSchedulesPage'),
  { ssr: false, loading: LoadingAgentsPane },
);
const McpServerPage = dynamic(() => import('@/features/mcp/McpServerPage'), {
  ssr: false,
  loading: LoadingAgentsPane,
});
const ApiDocsPage = dynamic(() => import('@/features/api-docs/ApiDocsPage'), {
  ssr: false,
  loading: LoadingAgentsPane,
});

const section = AI_AGENTS_SECTION;
export type UnifiedAgentsViewMode =
  | 'project-agents'
  | 'open-office'
  | 'aop-swarm'
  | 'schedules'
  | 'mcp'
  | 'api';

export default function ProjectAiAgentsSection() {
  const { project } = useShell();
  if (!project) return null;
  return (
    <AgentsSection
      teamId={project.project.teamId}
      projectKey={project.project.key}
      projectRef={project.project.ref}
    />
  );
}

function AgentsSection({
  teamId,
  projectKey: _projectKey,
  projectRef,
}: {
  teamId: number;
  projectKey: string;
  projectRef: string;
}) {
  const sectionText = useSettingsSectionText()(section.slug);
  const locale = useLocale();
  const isVi = locale.startsWith('vi');
  const tNav = useTranslations('nav');
  const tSettings = useTranslations('sections.settings');
  const permissions = useTeamQuery(teamId).data?.permissions.ai_agents;
  const { teamRef } = splitProjectRef(projectRef);
  const [viewMode, setViewMode] = useState<UnifiedAgentsViewMode>('project-agents');
  const [visitedModes, setVisitedModes] = useState<Set<UnifiedAgentsViewMode>>(
    () => new Set(['project-agents']),
  );
  const parentActive = useIsPaneActive();
  const [swarmAgents, setSwarmAgents] = useState<VibeAgent[]>([]);
  const [swarmTasks, setSwarmTasks] = useState<VibeTask[]>([]);
  const hostVibeEnabled = isHostVibeEnabled();

  useEffect(() => {
    setVisitedModes((prev) => {
      if (prev.has(viewMode)) return prev;
      const next = new Set(prev);
      next.add(viewMode);
      return next;
    });
  }, [viewMode]);

  const fetchSwarmAgents = useCallback(async () => {
    if (!isHostVibeEnabled()) return;
    try {
      const res = await fetch('/api/vibe/agents?scope=harness');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSwarmAgents(data);
      }
    } catch {
      // Best-effort bridge fetch
    }
  }, []);

  const fetchSwarmTasks = useCallback(async () => {
    if (!isHostVibeEnabled()) return;
    try {
      const res = await fetch('/api/vibe/tasks');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSwarmTasks(data);
      }
    } catch {
      // Best-effort bridge fetch
    }
  }, []);

  useEffect(() => {
    if (hostVibeEnabled && viewMode === 'aop-swarm') {
      void fetchSwarmAgents();
      void fetchSwarmTasks();
    }
  }, [hostVibeEnabled, viewMode, fetchSwarmAgents, fetchSwarmTasks]);

  return (
    <SectionPageView
      title={sectionText.label}
      description={sectionText.description}
      wide
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div
            data-testid="unified-agents-mode-switcher"
            aria-label={isVi ? 'Chế độ xem Tác nhân AI' : 'AI Agents view mode'}
            className="inline-flex flex-wrap items-center gap-1 rounded-full border border-border/85 bg-muted/65 p-1"
          >
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setViewMode('project-agents')}
            data-testid="btn-mode-project-agents"
            className={
              viewMode === 'project-agents'
                ? 'h-8 gap-1.5 rounded-full bg-foreground px-3 text-xs font-semibold text-background shadow-xs hover:bg-foreground/95 hover:text-background'
                : 'h-8 gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-background/60 hover:text-foreground'
            }
          >
            <Bot className="size-3.5" />
            <span>{isVi ? 'Tác nhân dự án' : 'Project Agents'}</span>
          </Button>
          {hostVibeEnabled && (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => navigateFeatureInstant(openOfficePath(projectRef))}
                data-testid="btn-mode-open-office"
                className={
                  viewMode === 'open-office'
                    ? 'h-8 gap-1.5 rounded-full bg-foreground px-3 text-xs font-semibold text-background shadow-xs hover:bg-foreground/95 hover:text-background'
                    : 'h-8 gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-background/60 hover:text-foreground'
                }
              >
                <Building2 className="size-3.5" />
                <span>{isVi ? 'Văn phòng mở' : 'Open Office'}</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setViewMode('aop-swarm')}
                data-testid="btn-mode-aop-swarm"
                className={
                  viewMode === 'aop-swarm'
                    ? 'h-8 gap-1.5 rounded-full bg-foreground px-3 text-xs font-semibold text-background shadow-xs hover:bg-foreground/95 hover:text-background'
                    : 'h-8 gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-background/60 hover:text-foreground'
                }
              >
                <ShieldCheck className="size-3.5" />
                <span>{isVi ? 'Swarm AOP' : 'AOP Swarm'}</span>
              </Button>
            </>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setViewMode('schedules')}
            data-testid="btn-mode-schedules"
            className={
              viewMode === 'schedules'
                ? 'h-8 gap-1.5 rounded-full bg-foreground px-3 text-xs font-semibold text-background shadow-xs hover:bg-foreground/95 hover:text-background'
                : 'h-8 gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-background/60 hover:text-foreground'
            }
          >
            <CalendarClock className="size-3.5" />
            <span>{tSettings('schedules.label')}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setViewMode('mcp')}
            data-testid="btn-mode-mcp"
            className={
              viewMode === 'mcp'
                ? 'h-8 gap-1.5 rounded-full bg-foreground px-3 text-xs font-semibold text-background shadow-xs hover:bg-foreground/95 hover:text-background'
                : 'h-8 gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-background/60 hover:text-foreground'
            }
          >
            <Cpu className="size-3.5" />
            <span>MCP</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setViewMode('api')}
            data-testid="btn-mode-api"
            className={
              viewMode === 'api'
                ? 'h-8 gap-1.5 rounded-full bg-foreground px-3 text-xs font-semibold text-background shadow-xs hover:bg-foreground/95 hover:text-background'
                : 'h-8 gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-background/60 hover:text-foreground'
            }
          >
            <BookOpen className="size-3.5" />
            <span>{tNav('api')}</span>
          </Button>
          </div>
          <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 rounded-full px-3 text-xs">
            <Link
              href={teamSectionPath(teamRef, 'capabilities')}
              onClick={(e) => {
                if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                  e.preventDefault();
                  navigateFeatureInstant(teamSectionPath(teamRef, 'capabilities'));
                }
              }}
            >
              <SlidersHorizontal className="size-3.5" />
              <span>{tNav('controlPlane')}</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      }
    >
      <RequirePermission resource={section.resource} action="read">
        {viewMode === 'open-office' && (
          <div className="min-h-[600px] overflow-hidden rounded-lg border border-border">
            <OpenOfficeWorkspaceView apiBaseUrl="" />
          </div>
        )}
        {viewMode === 'api' && <ApiDocsPage />}
        {visitedModes.has('aop-swarm') && (
          <div
            className={
              viewMode === 'aop-swarm'
                ? 'min-h-[600px] overflow-hidden rounded-lg border border-border'
                : 'hidden'
            }
            aria-hidden={viewMode !== 'aop-swarm'}
          >
            <PaneActiveProvider active={parentActive && viewMode === 'aop-swarm'}>
              <AgentSwarmView
                agents={swarmAgents}
                tasks={swarmTasks}
                onRefreshTasks={fetchSwarmTasks}
                onRefreshAgents={fetchSwarmAgents}
                onOpenOffice={() => navigateFeatureInstant(openOfficePath(projectRef))}
                apiBaseUrl=""
              />
            </PaneActiveProvider>
          </div>
        )}
        {visitedModes.has('schedules') && (
          <div
            className={viewMode === 'schedules' ? '' : 'hidden'}
            aria-hidden={viewMode !== 'schedules'}
          >
            <PaneActiveProvider active={parentActive && viewMode === 'schedules'}>
              <SettingsSchedulesPage />
            </PaneActiveProvider>
          </div>
        )}
        {visitedModes.has('mcp') && (
          <div className={viewMode === 'mcp' ? '' : 'hidden'} aria-hidden={viewMode !== 'mcp'}>
            <PaneActiveProvider active={parentActive && viewMode === 'mcp'}>
              <McpServerPage />
            </PaneActiveProvider>
          </div>
        )}
        {visitedModes.has('project-agents') && (
          <div
            className={viewMode === 'project-agents' ? '' : 'hidden'}
            aria-hidden={viewMode !== 'project-agents'}
          >
            <PaneActiveProvider active={parentActive && viewMode === 'project-agents'}>
              {!permissions ? (
                <ListSkeleton rows={3} rowClassName="h-12" />
              ) : (
                <AgentSectionProvider teamId={teamId} permissions={permissions}>
                  <ProjectAiAgents />
                </AgentSectionProvider>
              )}
            </PaneActiveProvider>
          </div>
        )}
      </RequirePermission>
    </SectionPageView>
  );
}
