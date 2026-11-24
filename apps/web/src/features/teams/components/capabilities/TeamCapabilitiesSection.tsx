'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { navigateFeatureInstant } from '@/hooks/useInstantPathname';
import { projectPath, teamSectionPath } from '@/utils/paths';
import { useCompanySettingsQuery } from '@/services/company.service';
import { useTeam, useTeamProjectOptionsQuery, useTeamQuery } from '@/services/teams.service';
import { useAiAgentsQuery } from '@/services/aiAgents.service';
import { useSkillOptionsQuery } from '@/services/agentSkills.service';
import { useConfiguredToolOptionsQuery } from '@/services/customTools.service';
import { useIntegrationCatalogQuery } from '@/services/integrations.service';
import SectionPageView from '@/components/common/page/SectionPageView';
import SearchInput from '@/components/common/SearchInput';
import ListSkeleton from '@/components/common/skeleton/ListSkeleton';
import NewProjectModal from '@/components/layout/NewProjectModal';
import { Button } from '@/components/ui/button';
import { AgentSectionProvider } from '../../context/agentSection';
import { SkillCreateDialog } from '../agent-skills/SkillCreateDialog';
import { ToolConfigDialog } from '../agent-tools/ToolConfigDialog';
import { TeamAiAgentSheet } from '../ai-agents/TeamAiAgentSheet';
import CapabilitiesAgentGrid from './CapabilitiesAgentGrid';
import CapabilitiesLibraryTab from './CapabilitiesLibraryTab';
import CapabilitiesProjectMatrix from './CapabilitiesProjectMatrix';
import TeamCapabilitiesSummaryStrip from './TeamCapabilitiesSummaryStrip';

type CapabilitiesTab = 'projects' | 'agents' | 'library';

export default function TeamCapabilitiesSection({ teamId }: { teamId: number }) {
  const t = useTranslations('teams');
  const router = useRouter();
  const team = useTeam(teamId);
  const { data: teamDetail } = useTeamQuery(teamId);
  const permissions = teamDetail?.permissions;

  const canCreateProject = team != null && team.role !== 'member';
  const canReadAgents = permissions?.ai_agents.read ?? false;
  const canEditAgents = permissions?.ai_agents.edit ?? false;
  const canCreateAgent = permissions?.ai_agents.create ?? false;
  const canReadSkills = permissions?.agent_skills.read ?? false;
  const canCreateSkill = permissions?.agent_skills.create ?? false;
  const canReadTools = permissions?.agent_tools.read ?? false;
  const canCreateTool = permissions?.agent_tools.create ?? false;

  const companyQuery = useCompanySettingsQuery();
  const projectsQuery = useTeamProjectOptionsQuery(teamId);
  const agentsQuery = useAiAgentsQuery(canReadAgents ? teamId : null);
  const skillsQuery = useSkillOptionsQuery(canReadSkills ? teamId : null);
  const toolsQuery = useConfiguredToolOptionsQuery(canReadTools ? teamId : null);
  const catalogQuery = useIntegrationCatalogQuery(canCreateTool ? teamId : null);

  const [activeTab, setActiveTab] = useState<CapabilitiesTab>('projects');
  const [search, setSearch] = useState('');
  const [editingAgentId, setEditingAgentId] = useState<number | null>(null);
  const [creatingAgent, setCreatingAgent] = useState(false);
  const [creatingSkill, setCreatingSkill] = useState(false);
  const [creatingTool, setCreatingTool] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  if (!team || !permissions) {
    return (
      <SectionPageView
        title={t('sections.capabilities.title')}
        description={t('sections.capabilities.description')}
        wide
      >
        <ListSkeleton rows={4} rowClassName="h-14" />
      </SectionPageView>
    );
  }

  const projects = projectsQuery.data ?? [];
  const agents = agentsQuery.data ?? [];
  const skills = skillsQuery.data ?? [];
  const tools = toolsQuery.data ?? [];
  const mcpProjectCount = team.mcpEnabled
    ? projects.filter((p) => p.mcpEnabled).length
    : 0;
  const editingAgent =
    editingAgentId != null ? (agents.find((a) => a.id === editingAgentId) ?? null) : null;

  const tabs: { id: CapabilitiesTab; label: string }[] = [
    { id: 'projects', label: t('capabilities.tabs.byProject') },
    { id: 'agents', label: t('capabilities.tabs.byAgent') },
    { id: 'library', label: t('capabilities.tabs.library') },
  ];

  const headerActions =
    canCreateProject || canCreateAgent || canCreateSkill || canCreateTool ? (
      <div className="flex flex-wrap items-center gap-1.5">
        {canCreateProject && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={() => setCreatingProject(true)}
          >
            <Plus className="size-3.5" />
            {t('panel.newProject')}
          </Button>
        )}
        {canCreateAgent && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={() => setCreatingAgent(true)}
          >
            <Plus className="size-3.5" />
            {t('agents.newAgent')}
          </Button>
        )}
        {canCreateSkill && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={() => setCreatingSkill(true)}
          >
            <Plus className="size-3.5" />
            {t('skills.newSkill')}
          </Button>
        )}
        {canCreateTool && (
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setCreatingTool(true)}
          >
            <Plus className="size-3.5" />
            {t('tools.add')}
          </Button>
        )}
      </div>
    ) : undefined;

  return (
    <SectionPageView
      title={t('sections.capabilities.title')}
      description={t('sections.capabilities.description')}
      wide
      actions={headerActions}
    >
      <div className="space-y-6">
        <TeamCapabilitiesSummaryStrip
          team={team}
          company={companyQuery.data}
          agents={agents}
          mcpProjectCount={mcpProjectCount}
          onNavigate={navigateFeatureInstant}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label={t('sections.capabilities.title')}
            className="inline-flex flex-wrap items-center gap-1 rounded-full bg-muted/60 p-1"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  data-testid={`capabilities-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex h-8 items-center rounded-full px-3.5 text-xs font-semibold transition-colors',
                    isActive
                      ? 'bg-foreground text-background shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('capabilities.searchPlaceholder')}
            className="w-full sm:w-72"
          />
        </div>

        {activeTab === 'projects' && (
          <CapabilitiesProjectMatrix
            projects={projects}
            agents={agents}
            teamMcpEnabled={team.mcpEnabled}
            search={search}
            canReadAgents={canReadAgents}
            canEditAgents={canEditAgents}
            onSelectAgent={(agent) => setEditingAgentId(agent.id)}
            onOpenMcp={() => navigateFeatureInstant(teamSectionPath(team.ref, 'mcp'))}
          />
        )}

        {activeTab === 'agents' && (
          <CapabilitiesAgentGrid
            agents={agents}
            canReadAgents={canReadAgents}
            canEditAgents={canEditAgents}
            search={search}
            onSelectAgent={(agent) => setEditingAgentId(agent.id)}
          />
        )}

        {activeTab === 'library' && (
          <CapabilitiesLibraryTab
            teamRef={team.ref}
            skills={skills}
            tools={tools}
            canReadSkills={canReadSkills}
            canReadTools={canReadTools}
            canCreateSkill={canCreateSkill}
            canCreateTool={canCreateTool}
            search={search}
            onCreateSkill={() => setCreatingSkill(true)}
            onCreateTool={() => setCreatingTool(true)}
            onNavigate={navigateFeatureInstant}
          />
        )}
      </div>

      {canReadAgents && (creatingAgent || editingAgent != null) && (
        <AgentSectionProvider teamId={teamId} permissions={permissions.ai_agents}>
          <TeamAiAgentSheet
            open
            agent={editingAgent}
            onClose={() => {
              setCreatingAgent(false);
              setEditingAgentId(null);
            }}
          />
        </AgentSectionProvider>
      )}

      {creatingSkill && (
        <SkillCreateDialog
          teamId={teamId}
          teamName={team.name}
          onClose={() => setCreatingSkill(false)}
        />
      )}

      {creatingTool && (
        <ToolConfigDialog
          teamId={teamId}
          teamName={team.name}
          catalog={catalogQuery.data ?? []}
          onClose={() => setCreatingTool(false)}
        />
      )}

      {creatingProject && (
        <NewProjectModal
          teamId={teamId}
          onClose={() => setCreatingProject(false)}
          onCreated={(ref) => {
            setCreatingProject(false);
            router.push(projectPath(ref));
          }}
        />
      )}
    </SectionPageView>
  );
}
