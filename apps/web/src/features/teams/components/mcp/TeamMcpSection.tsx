'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Link2, Minus, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { useTeam, useTeamProjectOptionsQuery, useUpdateTeamMcp } from '@/services/teams.service';
import {
  createTeamMcpConnection,
  deleteTeamMcpConnection,
  listTeamMcpConnections,
} from '@/lib/api/endpoints/agents';
import { getProjectDefaults, updateProjectDefaults } from '@/lib/api/endpoints/settings';
import SectionPageView from '@/components/common/page/SectionPageView';
import ListSkeleton from '@/components/common/skeleton/ListSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import McpConnectionGuide from '@/features/mcp/components/McpConnectionGuide';

function McpStatus({ on }: { on: boolean }) {
  const t = useTranslations('teams.mcp');
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {on ? <Check className="size-4 text-green-500" /> : <Minus className="size-4" />}
      {t(on ? 'statusOn' : 'statusOff')}
    </span>
  );
}

// The team's MCP settings: inbound MCP server access toggle plus outbound SSRF-guarded
// external MCP tool connectors managed for the team's AI agents.
export default function TeamMcpSection({ teamId }: { teamId: number }) {
  const t = useTranslations('teams.mcp');
  const qc = useQueryClient();
  const team = useTeam(teamId);
  const { data: projects } = useTeamProjectOptionsQuery(teamId);
  const update = useUpdateTeamMcp(teamId);

  const canManage = team != null && team.role !== 'member';
  const enabled = team?.mcpEnabled ?? false;
  const busy = update.isPending;

  const [connName, setConnName] = useState('');
  const [connUrl, setConnUrl] = useState('');
  const [connTransport, setConnTransport] = useState<'streamable-http' | 'sse'>('streamable-http');
  const [connError, setConnError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  const projectDefaultsQuery = useQuery({
    queryKey: ['settings', 'project-defaults'],
    queryFn: () => getProjectDefaults(),
  });

  const projectDefaultsMutation = useMutation({
    mutationFn: (mcpEnabled: boolean) => updateProjectDefaults({ mcpEnabled }),
    onSuccess: (next) => {
      qc.setQueryData(['settings', 'project-defaults'], next);
    },
  });

  const enabledCount = useMemo(
    () => (projects ?? []).filter((p) => p.mcpEnabled).length,
    [projects],
  );

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (projects ?? []).filter((p) => {
      if (statusFilter === 'enabled' && !p.mcpEnabled) return false;
      if (statusFilter === 'disabled' && p.mcpEnabled) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q);
    });
  }, [projects, search, statusFilter]);

  function handleBulkToggle(targetProjects: NonNullable<typeof projects>, nextEnabled: boolean) {
    const delta = targetProjects
      .filter((p) => p.mcpEnabled !== nextEnabled)
      .map((p) => ({ projectId: p.id, enabled: nextEnabled }));
    if (delta.length > 0) update.mutate({ projects: delta });
  }

  const connectionsQuery = useQuery({
    queryKey: ['team-mcp-connections', teamId],
    queryFn: () => listTeamMcpConnections(teamId),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      createTeamMcpConnection(teamId, {
        name: connName.trim(),
        endpointUrl: connUrl.trim(),
        transport: connTransport,
      }),
    onSuccess: () => {
      setConnName('');
      setConnUrl('');
      setConnError(null);
      void qc.invalidateQueries({ queryKey: ['team-mcp-connections', teamId] });
    },
    onError: (err) => {
      setConnError(err instanceof Error ? err.message : 'Unable to register MCP connector');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (connectionId: number) => deleteTeamMcpConnection(teamId, connectionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['team-mcp-connections', teamId] });
    },
  });

  function handleAddConnection(e: FormEvent) {
    e.preventDefault();
    if (!connName.trim() || !connUrl.trim()) return;
    setConnError(null);
    addMutation.mutate();
  }

  return (
    <SectionPageView title={t('title')} description={t('description')}>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-6 rounded-lg bg-muted/40 px-4 py-3.5">
          <div className="space-y-0.5">
            <span className="text-sm font-medium">{t('access')}</span>
            <p className="text-sm text-muted-foreground">
              {canManage ? t('accessHint') : t('managerOnly')}
            </p>
          </div>
          {canManage ? (
            <Switch
              checked={enabled}
              disabled={busy}
              onCheckedChange={(value) => update.mutate({ enabled: value })}
              aria-label={t('toggleAria')}
            />
          ) : (
            <McpStatus on={enabled} />
          )}
        </div>

        <div className="flex items-center justify-between gap-6 rounded-lg border border-border/70 bg-card px-4 py-3.5">
          <div className="space-y-0.5">
            <span className="text-sm font-medium">{t('defaultNewProject')}</span>
            <p className="text-sm text-muted-foreground">{t('defaultNewProjectHint')}</p>
          </div>
          {canManage ? (
            <Switch
              data-testid="instance-mcp-default-toggle"
              checked={projectDefaultsQuery.data?.mcpEnabled ?? false}
              disabled={projectDefaultsQuery.isLoading || projectDefaultsMutation.isPending}
              onCheckedChange={(value) => projectDefaultsMutation.mutate(value)}
              aria-label={t('defaultNewProjectAria')}
            />
          ) : (
            <McpStatus on={projectDefaultsQuery.data?.mcpEnabled ?? false} />
          )}
        </div>

        <section
          data-testid="outbound-mcp-connectors"
          className="space-y-4 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <Link2 className="size-4 text-primary" />
              <span className="text-sm font-medium">External Tool Connectors (Outbound MCP)</span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-500" /> HTTPS &amp; Private-IP SSRF Guarded
            </span>
          </div>

          {canManage && (
            <form onSubmit={handleAddConnection} className="grid grid-cols-1 gap-2 sm:grid-cols-12">
              <Input
                value={connName}
                onChange={(e) => setConnName(e.target.value)}
                placeholder="Connector name (e.g. GitHub Docs)"
                className="sm:col-span-3"
                required
              />
              <Input
                value={connUrl}
                onChange={(e) => setConnUrl(e.target.value)}
                placeholder="https://mcp.example.com/mcp"
                className="sm:col-span-5"
                type="url"
                required
              />
              <select
                value={connTransport}
                onChange={(e) =>
                  setConnTransport(e.target.value === 'sse' ? 'sse' : 'streamable-http')
                }
                aria-label="MCP transport"
                className="h-9 rounded-md border border-input bg-background px-2 text-xs sm:col-span-3"
              >
                <option value="streamable-http">Streamable HTTP</option>
                <option value="sse">SSE</option>
              </select>
              <Button
                type="submit"
                size="sm"
                className="sm:col-span-1"
                disabled={addMutation.isPending}
                title="Add MCP connector"
              >
                <Plus className="size-4" />
              </Button>
            </form>
          )}

          {connError && <p className="text-xs text-destructive">{connError}</p>}

          {connectionsQuery.isLoading ? (
            <ListSkeleton rows={2} rowClassName="h-10" />
          ) : (connectionsQuery.data?.length ?? 0) === 0 ? (
            <p className="text-xs text-muted-foreground">
              No outbound MCP servers connected yet. Register public HTTPS MCP endpoints for internal cloud agents.
            </p>
          ) : (
            <ul className="space-y-2">
              {connectionsQuery.data?.map((conn) => (
                <li
                  key={conn.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <span>{conn.name}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs uppercase text-muted-foreground">
                        {conn.transport}
                      </span>
                    </div>
                    <div className="truncate font-mono text-xs text-muted-foreground">
                      {conn.endpointUrl}
                    </div>
                  </div>
                  {canManage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeMutation.mutate(conn.id)}
                      disabled={removeMutation.isPending}
                      title="Delete MCP connector"
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {enabled && (
          <>
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                <span className="text-xs font-medium text-muted-foreground">{t('projects')}</span>
                {projects && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {t('summaryRatio', { enabled: enabledCount, total: projects.length })}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{t('projectsHint')}</p>

              {projects && projects.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="relative min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('searchPlaceholder')}
                      className="ps-8"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['all', 'enabled', 'disabled'] as const).map((mode) => (
                      <Button
                        key={mode}
                        type="button"
                        size="sm"
                        variant={statusFilter === mode ? 'default' : 'outline'}
                        onClick={() => setStatusFilter(mode)}
                      >
                        {t(
                          mode === 'all'
                            ? 'filterAll'
                            : mode === 'enabled'
                              ? 'filterEnabled'
                              : 'filterDisabled',
                        )}
                      </Button>
                    ))}
                    {canManage && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy || enabledCount === 0}
                          onClick={() => handleBulkToggle(projects, false)}
                        >
                          {t('disableAll')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy || filteredProjects.every((p) => p.mcpEnabled)}
                          onClick={() => handleBulkToggle(filteredProjects, true)}
                        >
                          {t('enableFiltered')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {!projects ? (
                <ListSkeleton rows={3} rowClassName="h-11" />
              ) : projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noProjects')}</p>
              ) : filteredProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('noMatches', { query: search.trim() })}
                </p>
              ) : (
                <ul className="space-y-1">
                  {filteredProjects.map((project) => (
                    <li
                      key={project.id}
                      className="flex items-center justify-between gap-4 rounded-md px-3 py-2 hover:bg-accent/50"
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-medium">{project.name}</span>
                        <span className="ms-2 font-mono text-xs text-muted-foreground">
                          {project.key}
                        </span>
                      </div>
                      {canManage ? (
                        <Switch
                          checked={project.mcpEnabled}
                          disabled={busy}
                          onCheckedChange={(value) =>
                            update.mutate({ projects: [{ projectId: project.id, enabled: value }] })
                          }
                          aria-label={t('projectToggleAria', { project: project.name })}
                        />
                      ) : (
                        <McpStatus on={project.mcpEnabled} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <McpConnectionGuide />
          </>
        )}
      </div>
    </SectionPageView>
  );
}
