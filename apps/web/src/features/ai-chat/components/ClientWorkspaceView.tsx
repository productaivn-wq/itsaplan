'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  DollarSign,
  FolderOpen,
  FolderPlus,
  PanelLeft,
  PanelRight,
  ShieldAlert,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  decideProjectApproval,
  getTeamBudgetPolicy,
  listProjectApprovals,
} from '@/lib/api/endpoints/agents';
import { fetchProjectDirectory } from '@/lib/api/endpoints/directory';
import { useProjectQuery, useProjectsQuery } from '@/services/projects.service';
import { useTeamsQuery } from '@/services/teams.service';
import { qk } from '@/services/queryKeys';
import { aiTeamPath, splitProjectRef, teamSectionPath } from '@/utils/paths';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ProjectSourcesDialog } from '@/features/directory/components/ProjectSourcesDialog';
import { ChatViewMenu } from './controls/ChatViewMenu';
import { ChatPanelBody } from './panel/ChatPanelBody';
import { WorkspaceProjectSwitcher } from './workspace/WorkspaceProjectSwitcher';
import { WorkspaceRightPane } from './workspace/WorkspaceRightPane';
import { useChatWorkspacePreferences } from '../hooks/useChatWorkspacePreferences';
import {
  formatModelDisplayLabel,
  type ActiveChatSnapshot,
  type WorkspaceLayoutView,
} from '../types/workspaceControls';

const NewProjectModal = dynamic(() => import('@/components/layout/NewProjectModal'), {
  ssr: false,
});

export default function ClientWorkspaceView({ projectKey }: { projectKey: string }) {
  const t = useTranslations('aiChat');
  const router = useRouter();
  const qc = useQueryClient();
  const { teamRef } = splitProjectRef(projectKey);
  const projectQuery = useProjectQuery(projectKey);
  const projects = useProjectsQuery().data ?? [];
  const teams = useTeamsQuery().data ?? [];
  const teamId = projectQuery.data?.project.teamId ?? null;
  const managedTeams = teams.filter((one) => one.role !== 'member');
  const newProjectTeamId = (managedTeams.find((one) => one.id === teamId) ?? managedTeams[0])?.id;

  const { prefs, updatePrefs, setLayout, openRightTab, resetPrefs } =
    useChatWorkspacePreferences(projectKey);
  const [activeSnapshot, setActiveSnapshot] = useState<ActiveChatSnapshot | null>(null);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSourcesDialog, setShowSourcesDialog] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        updatePrefs({
          showSessionsRail: !prefs.showSessionsRail,
          ...(prefs.layout === 'focus' ? { layout: 'chat' } : {}),
        });
      } else if (key === 'i') {
        e.preventDefault();
        if (prefs.rightPaneOpen && prefs.layout !== 'focus') {
          setLayout('chat');
        } else {
          setLayout('split');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [prefs.showSessionsRail, prefs.rightPaneOpen, prefs.layout, updatePrefs, setLayout]);

  const approvalsQuery = useQuery({
    queryKey: ['project-approvals', projectKey],
    queryFn: () => listProjectApprovals(projectKey, 'pending'),
    refetchInterval: 15_000,
  });

  const directoryQuery = useQuery({
    queryKey: qk.projectDirectory(projectKey),
    queryFn: () => fetchProjectDirectory(projectKey),
    enabled: Boolean(projectKey),
  });

  const budgetQuery = useQuery({
    queryKey: ['team-budget-policy', teamId],
    queryFn: () => getTeamBudgetPolicy(teamId!),
    enabled: teamId != null,
    refetchInterval: 60_000,
  });

  const decideMutation = useMutation({
    mutationFn: ({
      approvalId,
      decision,
      note,
    }: {
      approvalId: string;
      decision: 'approved' | 'rejected';
      note?: string;
    }) => decideProjectApproval(projectKey, approvalId, decision, note),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['project-approvals', projectKey] });
    },
  });

  const handleOpenArtifact = useCallback(
    (artifactId: string) => {
      setSelectedArtifactId(artifactId);
      openRightTab('artifacts');
    },
    [openRightTab],
  );

  const handleSelectProject = useCallback(
    (ref: string) => {
      router.push(aiTeamPath(ref, 'chat'));
    },
    [router],
  );

  const pendingApprovals = approvalsQuery.data?.items ?? [];
  const dirCounts = directoryQuery.data?.counts;
  const totalSources = dirCounts
    ? dirCounts.storageLocations + dirCounts.channels + dirCounts.contacts
    : null;
  const budget = budgetQuery.data;
  const usage = budget?.usage;
  const spentLabel = `$${((usage?.spentMicros ?? 0) / 1_000_000).toFixed(2)}`;
  const capLabel =
    usage && usage.capMicros > 0 ? ` / $${(usage.capMicros / 1_000_000).toFixed(2)}` : '';
  const finopsHref = teamSectionPath(teamRef, 'ai-agents');

  const showSessionsRail = prefs.showSessionsRail && prefs.layout !== 'focus';
  const showRightPane = prefs.rightPaneOpen && prefs.layout !== 'focus';

  const layoutChoices: { id: WorkspaceLayoutView; label: string }[] = [
    { id: 'chat', label: t('layoutChat') },
    { id: 'split', label: t('layoutSplit') },
    { id: 'focus', label: t('layoutFocus') },
  ];

  const activeModelSummary = activeSnapshot
    ? formatModelDisplayLabel(
        activeSnapshot.runOptions.model,
        activeSnapshot.agent,
        activeSnapshot.agent.kind === 'internal' ? t('modelDefault') : t('runnerDefault'),
      )
    : null;

  return (
    <div
      data-testid="client-full-canvas-workspace"
      className="relative flex h-full min-h-0 w-full flex-1 flex-col bg-background"
    >
      <header className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border px-3.5 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            data-testid="sessions-rail-toggle-btn"
            onClick={() =>
              updatePrefs({
                showSessionsRail: !showSessionsRail,
                ...(prefs.layout === 'focus' ? { layout: 'chat' } : {}),
              })
            }
            title={t('toggleSessions')}
            aria-pressed={showSessionsRail}
            className={cn(showSessionsRail && 'bg-secondary text-foreground')}
          >
            <PanelLeft className="size-4" />
            <span className="sr-only">{t('toggleSessions')}</span>
          </Button>
          <Bot className="size-4 shrink-0 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">{t('workspaceTitle')}</h1>
          <WorkspaceProjectSwitcher
            projects={projects}
            currentProjectKey={projectKey}
            onSelectProject={handleSelectProject}
            onNewProject={newProjectTeamId != null ? () => setShowNewProject(true) : undefined}
          />
          {newProjectTeamId != null && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="workspace-new-project-btn"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => setShowNewProject(true)}
            >
              <FolderPlus className="size-3.5 text-primary" />
              <span className="hidden sm:inline">{t('newProject')}</span>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="workspace-sources-btn"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setShowSourcesDialog(true)}
            title={t('projectSourcesTitle')}
          >
            <FolderOpen className="size-3.5 text-muted-foreground" />
            <span className="hidden md:inline">
              {totalSources != null ? `${t('sourcesShort')} (${totalSources})` : t('sourcesShort')}
            </span>
          </Button>
          {activeSnapshot && activeModelSummary && (
            <span className="hidden items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground lg:inline-flex">
              <span className="max-w-36 truncate font-medium text-foreground">
                {activeModelSummary}
              </span>
              <span aria-hidden="true">·</span>
              <span className="uppercase">{activeSnapshot.runOptions.mode ?? 'build'}</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Workspace layout"
            data-testid="workspace-layout-switcher"
            className="flex items-center gap-0.5 rounded-full bg-muted/70 p-0.5"
          >
            {layoutChoices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                data-testid={`layout-mode-${choice.id}`}
                onClick={() => setLayout(choice.id)}
                aria-pressed={prefs.layout === choice.id}
                className={cn(
                  'inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition',
                  prefs.layout === choice.id
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {choice.label}
              </button>
            ))}
          </div>

          <ChatViewMenu prefs={prefs} onChange={updatePrefs} onReset={resetPrefs} />

          {budget && (
            <Link
              href={finopsHref}
              data-testid="workspace-finops-pill"
              className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition ${
                usage?.hardStopped
                  ? 'border-destructive/50 bg-destructive/10 text-destructive'
                  : usage?.softAlertTriggered
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
              title="Open Team FinOps Budget Settings"
            >
              <DollarSign className="size-3.5" />
              <span className="font-mono">
                {spentLabel}
                {capLabel}
              </span>
            </Link>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="approvals-toggle-btn"
            className="gap-1.5"
            onClick={() => {
              if (showRightPane) setLayout('chat');
              else setLayout('split');
            }}
          >
            <PanelRight className="size-3.5" />
            <span>{t('approvalsCount', { count: pendingApprovals.length })}</span>
          </Button>
        </div>
      </header>

      {usage?.hardStopped && (
        <div
          data-testid="workspace-budget-hardstop-banner"
          className="flex flex-wrap items-center justify-between gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive"
        >
          <span className="inline-flex items-center gap-1.5 font-medium">
            <ShieldAlert className="size-3.5" />
            {usage.reason || 'Team monthly AI budget cap reached. Cloud agent runs are paused.'}
          </span>
          <Link href={finopsHref} className="font-semibold underline hover:opacity-80">
            Adjust Budget
          </Link>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ChatPanelBody
            projectKey={projectKey}
            projects={projects}
            onSelectProject={handleSelectProject}
            onNewProject={newProjectTeamId != null ? () => setShowNewProject(true) : undefined}
            newChatAgentId={null}
            onNewChatHandled={() => {}}
            viewPrefs={prefs}
            showSessionsRail={showSessionsRail}
            onCloseSessionsRail={() => updatePrefs({ showSessionsRail: false })}
            onActiveSnapshotChange={setActiveSnapshot}
            onOpenArtifact={handleOpenArtifact}
          />
        </div>

        {showRightPane && (
          <WorkspaceRightPane
            projectKey={projectKey}
            teamRef={teamRef}
            activeTab={prefs.rightPaneTab}
            onTabChange={(rightPaneTab) => updatePrefs({ rightPaneTab })}
            onClose={() => setLayout('chat')}
            snapshot={activeSnapshot}
            selectedArtifactId={selectedArtifactId}
            onSelectArtifact={setSelectedArtifactId}
            pendingApprovals={pendingApprovals}
            onDecideApproval={(approvalId, decision, note) =>
              decideMutation.mutate({ approvalId, decision, note })
            }
            decidingApproval={decideMutation.isPending}
            onOpenSources={() => setShowSourcesDialog(true)}
          />
        )}
      </div>

      {newProjectTeamId != null && showNewProject && (
        <NewProjectModal
          teamId={newProjectTeamId}
          onClose={() => setShowNewProject(false)}
          onCreated={(ref) => {
            setShowNewProject(false);
            router.push(aiTeamPath(ref, 'chat'));
          }}
        />
      )}

      <ProjectSourcesDialog
        projectKey={projectKey}
        open={showSourcesDialog}
        onOpenChange={setShowSourcesDialog}
      />
    </div>
  );
}
