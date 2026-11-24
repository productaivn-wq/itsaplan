'use client';

// UNIFIED_WORK_ITEMS_SWARM_DEDUP_362:
// Duplicate 4-column Task Kanban board stripped from AgentSwarmView.tsx.
// All work items, Kanban columns, and Tier 2 HITL Governance sign-off are routed
// to the single canonical Hạng mục công việc (WorkItemsPage.tsx) feature.
// Integrated with AffectUI AgentTree (Tree | Grid layout toggle).

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  Bot,
  Building2,
  CheckCircle2,
  Clock,
  FolderSync,
  GitFork,
  LayoutGrid,
  Loader2,
  RefreshCw,
  ShieldCheck,
  SquareKanban,
  Zap,
} from 'lucide-react';
import { useShellRoute } from '@/hooks/useShellRoute';
import { projectPath } from '@/utils/paths';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AgentTree,
  buildAgentTreeFromVibeAgents,
  resolveTreeAgentAction,
  type AgentTreeResolveAction,
  type TreeAgent,
} from '@/components/ui/agent-tree';
import type { VibeAgent, VibeTask } from '../types';

interface AgentSwarmViewProps {
  agents: VibeAgent[];
  tasks: VibeTask[];
  onRefreshTasks: () => void;
  onRefreshAgents: () => void;
  onOpenOffice?: () => void;
  apiBaseUrl: string;
}

export default function AgentSwarmView({
  agents,
  tasks,
  onRefreshTasks,
  onRefreshAgents,
  onOpenOffice,
  apiBaseUrl,
}: AgentSwarmViewProps) {
  const router = useRouter();
  const { projectKey } = useShellRoute();
  const [selectedAgent, setSelectedAgent] = React.useState<VibeAgent | null>(null);
  const [agentInstruction, setAgentInstruction] = React.useState('');
  const [triageResults, setTriageResults] = React.useState<any | null>(null);
  const [triageLoading, setTriageLoading] = React.useState(false);

  // Layout toggle: 'tree' | 'grid' (defaults to 'tree')
  const [viewLayout, setViewLayout] = React.useState<'tree' | 'grid'>('tree');
  const [treeRoot, setTreeRoot] = React.useState<TreeAgent | null>(null);
  const [treeBeside, setTreeBeside] = React.useState<TreeAgent | undefined>(undefined);

  React.useEffect(() => {
    const { root, beside } = buildAgentTreeFromVibeAgents(agents, tasks);
    setTreeRoot(root);
    setTreeBeside(beside);
  }, [agents, tasks]);

  const handleResolveTreeAction = (agent: TreeAgent, action: AgentTreeResolveAction) => {
    if (treeRoot) {
      const updated = resolveTreeAgentAction(treeRoot, agent.id, action);
      setTreeRoot(updated);
    }
  };

  const normalizeStatus = (s?: string) => String(s || '').toUpperCase();
  const todoCount = tasks.filter((t) => normalizeStatus(t.status) === 'TODO').length;
  const inProgressCount = tasks.filter((t) => normalizeStatus(t.status) === 'IN_PROGRESS').length;
  const hitlCount = tasks.filter((t) => normalizeStatus(t.status) === 'AWAITING_HITL').length;
  const doneCount = tasks.filter((t) => {
    const st = normalizeStatus(t.status);
    return st === 'COMPLETED' || st === 'DONE';
  }).length;

  const handleOpenWorkItems = () => {
    if (projectKey) {
      router.push(projectPath(projectKey));
    }
  };

  // Autonomous Custodian Triage Execution
  const handleRunTriage = async () => {
    setTriageLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/custodian/triage`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setTriageResults(data);
      }
    } catch (err) {
      console.error('Triage failed:', err);
    } finally {
      setTriageLoading(false);
    }
  };

  // Dispatch direct instruction to agent
  const handleDispatchAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !agentInstruction.trim()) return;

    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/agent/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: (selectedAgent as any).agent_id || selectedAgent.id,
          instruction: agentInstruction.trim(),
        }),
      });
      if (res.ok) {
        setAgentInstruction('');
        setSelectedAgent(null);
        onRefreshAgents();
      }
    } catch (err) {
      console.error('Dispatch failed:', err);
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* SECTION 1: AGENT SWARM FLEET (AOP CORE) */}
      <div className="shrink-0 border-b border-border bg-muted/15 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bot className="size-4.5 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Autonomous Agent Swarm Fleet (AOP Core)
            </h3>
            <Badge variant="outline" className="text-xs font-mono">
              {agents.length} Registered
            </Badge>

            {/* Tree vs Grid View Toggle Buttons */}
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 ml-2">
              <Button
                type="button"
                size="sm"
                variant={viewLayout === 'tree' ? 'default' : 'ghost'}
                onClick={() => setViewLayout('tree')}
                data-testid="btn-swarm-view-tree"
                className="h-7 gap-1 px-2 text-xs"
              >
                <GitFork className="size-3" />
                <span>Tree</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewLayout === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewLayout('grid')}
                data-testid="btn-swarm-view-grid"
                className="h-7 gap-1 px-2 text-xs"
              >
                <LayoutGrid className="size-3" />
                <span>Grid</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunTriage}
              disabled={triageLoading}
              className="h-7 text-xs gap-1.5"
            >
              {triageLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FolderSync className="size-3.5 text-amber-500" />
              )}
              Run Inbox Triage
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onRefreshTasks();
                onRefreshAgents();
              }}
              className="size-7"
              title="Refresh Agent Fleet"
            >
              <RefreshCw className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Tree View Mode */}
        {viewLayout === 'tree' && treeRoot && (
          <div className="rounded-xl border border-border bg-card/60 p-4 shadow-2xs">
            <AgentTree
              root={treeRoot}
              beside={treeBeside}
              onResolve={handleResolveTreeAction}
              onSelect={(ag) => {
                const found = agents.find(
                  (a) => (a.id || (a as any).agent_id || a.name) === ag.id
                );
                if (found) setSelectedAgent(found);
              }}
            />
          </div>
        )}

        {/* Fleet Grid Cards Mode */}
        {viewLayout === 'grid' && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
            {agents.map((agent) => {
              const a = agent as any;
              const agentKey = agent.id || a.agent_id || agent.name;
              const isRunning = agent.status === 'RUNNING';
              const isSelected = (selectedAgent?.id || (selectedAgent as any)?.agent_id) === agentKey;
              return (
                <div
                  key={agentKey}
                  onClick={() => setSelectedAgent(agent)}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-2xs'
                      : 'border-border bg-card hover:border-border/80 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-xs font-semibold text-foreground">
                        {agent.name}
                      </span>
                      {a.username && (
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          @{a.username}
                        </span>
                      )}
                    </div>
                    <Badge
                      variant={isRunning ? 'default' : 'secondary'}
                      className={`text-xs px-1.5 py-0 font-mono ${
                        isRunning ? 'bg-emerald-500 text-white animate-pulse' : ''
                      }`}
                    >
                      {agent.status}
                    </Badge>
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {agent.role || agent.archetype}
                  </div>
                  {(a.node || a.spatiotemporal_scope || a.model) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {a.node && (
                        <Badge variant="outline" className="px-1.5 py-0 font-mono text-xs">
                          {a.node}
                        </Badge>
                      )}
                      {a.spatiotemporal_scope && (
                        <Badge variant="secondary" className="px-1.5 py-0 font-mono text-xs">
                          {a.spatiotemporal_scope}
                        </Badge>
                      )}
                      {a.model && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">
                          {a.model}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {agent.capabilities?.slice(0, 3).map((cap) => (
                      <span
                        key={cap}
                        className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custodian Triage Alert Banner if any */}
      {triageResults && (
        <div className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Zap className="size-4 text-amber-500 shrink-0" />
            <span>
              <strong>Inbox Triage Completed:</strong> {triageResults.pending_count} pending assets routed to MECE zones.
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTriageResults(null)}
            className="h-6 text-xs px-2 text-amber-800 dark:text-amber-200"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* UNIFIED WORK ITEMS BRIDGE (Replaces duplicate 4-column Task Kanban board) */}
      <div className="p-4">
        <Card
          data-testid="swarm-work-items-bridge"
          className="flex flex-col gap-3 border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-3"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <SquareKanban className="size-4 text-primary" />
              <span>Hạng mục công việc &amp; Phê duyệt HITL (Unified Work Items SSOT)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Bảng Kanban công việc đã được hợp nhất hoàn toàn vào <strong>Hạng mục công việc</strong> để tránh trùng lặp. Mọi tác vụ nhóm, việc cần làm AI và phê duyệt độc lập 2 bước được quản lý tập trung tại một nơi duy nhất.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="secondary" className="gap-1 text-xs">
                <Clock className="size-3" />
                To Do: {todoCount}
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs border-primary/40 text-primary">
                <Zap className="size-3" />
                In Progress: {inProgressCount}
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs border-amber-500/40 text-amber-600 dark:text-amber-300">
                <ShieldCheck className="size-3" />
                Chờ phê duyệt: {hitlCount}
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                Completed: {doneCount}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenOffice && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onOpenOffice}
                data-testid="btn-open-open-office"
                className="shrink-0 gap-1.5 text-xs"
              >
                <Building2 className="size-3.5" />
                <span>Mở Phòng làm việc mở</span>
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleOpenWorkItems}
              data-testid="btn-open-canonical-work-items"
              className="shrink-0 gap-1.5 text-xs"
            >
              <SquareKanban className="size-3.5" />
              <span>Mở Hạng mục công việc</span>
              <ArrowUpRight className="size-3.5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* DISPATCH DIRECT INSTRUCTION MODAL */}
      {selectedAgent && (
        <Dialog open={true} onOpenChange={() => setSelectedAgent(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Bot className="size-5 text-primary" />
                <DialogTitle className="text-base font-semibold">
                  Dispatch Agent: {selectedAgent.name}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Role: {selectedAgent.role || selectedAgent.archetype}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleDispatchAgent} className="space-y-3 py-2 text-xs">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Instruction Payload
                </label>
                <Input
                  value={agentInstruction}
                  onChange={(e) => setAgentInstruction(e.target.value)}
                  placeholder="e.g. Audit test coverage for sprint deliverables..."
                  className="mt-1 text-xs"
                />
              </div>

              <DialogFooter className="flex gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setSelectedAgent(null)} className="text-xs">
                  Cancel
                </Button>
                <Button size="sm" type="submit" disabled={!agentInstruction.trim()} className="text-xs">
                  Dispatch Agent
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
