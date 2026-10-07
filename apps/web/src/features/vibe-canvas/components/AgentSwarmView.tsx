'use client';

import * as React from 'react';
import {
  Bot,
  Play,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Loader2,
  RefreshCw,
  FolderSync,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { VibeAgent, VibeTask } from '../types';

interface AgentSwarmViewProps {
  agents: VibeAgent[];
  tasks: VibeTask[];
  onRefreshTasks: () => void;
  onRefreshAgents: () => void;
  apiBaseUrl: string;
}

export default function AgentSwarmView({
  agents,
  tasks,
  onRefreshTasks,
  onRefreshAgents,
  apiBaseUrl,
}: AgentSwarmViewProps) {
  const [dispatchLoading, setDispatchLoading] = React.useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = React.useState<VibeAgent | null>(null);
  const [agentInstruction, setAgentInstruction] = React.useState('');
  const [triageResults, setTriageResults] = React.useState<any | null>(null);
  const [triageLoading, setTriageLoading] = React.useState(false);

  // HITL Governance Sign-Off Modal State
  const [hitlTask, setHitlTask] = React.useState<VibeTask | null>(null);
  const [approverId, setApproverId] = React.useState('thanb');
  const [approvalReason, setApprovalReason] = React.useState('Verified architecture alignment and test evidence.');
  const [governanceError, setGovernanceError] = React.useState<string | null>(null);

  // Categorize tasks by column
  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const hitlTasks = tasks.filter((t) => t.status === 'AWAITING_HITL');
  const doneTasks = tasks.filter((t) => t.status === 'COMPLETED' || (t.status as string) === 'DONE');

  // Trigger task transition (e.g., Start Task -> IN_PROGRESS with physical agent dispatch)
  const handleStartTask = async (task: VibeTask) => {
    setDispatchLoading(task.id);
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/task/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: task.id, target_status: 'IN_PROGRESS' }),
      });
      if (res.ok) {
        onRefreshTasks();
        onRefreshAgents();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to start task');
      }
    } catch (err) {
      console.error('Task transition failed:', err);
    } finally {
      setDispatchLoading(null);
    }
  };

  // Complete task
  const handleCompleteTask = async (task: VibeTask) => {
    setDispatchLoading(task.id);
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/task/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: task.id, target_status: 'DONE' }),
      });
      if (res.ok) {
        onRefreshTasks();
        onRefreshAgents();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to complete task');
      }
    } catch (err) {
      console.error('Task transition failed:', err);
    } finally {
      setDispatchLoading(null);
    }
  };

  // Escalate to HITL
  const handleEscalateToHitl = async (task: VibeTask) => {
    setDispatchLoading(task.id);
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/task/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: task.id, target_status: 'AWAITING_HITL' }),
      });
      if (res.ok) {
        onRefreshTasks();
        onRefreshAgents();
      }
    } catch (err) {
      console.error('Escalation failed:', err);
    } finally {
      setDispatchLoading(null);
    }
  };

  // Execute HITL Approval
  const handleApproveGovernance = async () => {
    if (!hitlTask) return;
    setGovernanceError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/vibe/governance/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: hitlTask.id,
          approver_id: approverId.trim(),
          decision: 'APPROVE',
          reason: approvalReason.trim(),
        }),
      });
      if (res.ok) {
        setHitlTask(null);
        onRefreshTasks();
        onRefreshAgents();
      } else {
        const err = await res.json();
        setGovernanceError(err.error || 'Governance approval rejected');
      }
    } catch (err) {
      setGovernanceError('Network or server error during sign-off');
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
          agent_id: selectedAgent.id,
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
      {/* SECTION 1: AGENT SWARM FLEET (5 AOP AGENTS) */}
      <div className="shrink-0 border-b border-border bg-muted/15 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="size-4.5 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Autonomous Agent Swarm Fleet (AOP Core)
            </h3>
            <Badge variant="outline" className="text-[10px] font-mono">
              {agents.length} Registered
            </Badge>
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
              title="Refresh Swarm & Tasks"
            >
              <RefreshCw className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* 5 Agent Cards */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-5">
          {agents.map((agent) => {
            const isRunning = agent.status === 'RUNNING';
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`cursor-pointer rounded-lg border p-2.5 transition-all ${
                  selectedAgent?.id === agent.id
                    ? 'border-primary bg-primary/5 shadow-2xs'
                    : 'border-border bg-card hover:border-border/80 hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-xs font-semibold text-foreground">
                    {agent.name}
                  </span>
                  <Badge
                    variant={isRunning ? 'default' : 'secondary'}
                    className={`text-[9px] px-1.5 py-0 font-mono ${
                      isRunning ? 'bg-emerald-500 text-white animate-pulse' : ''
                    }`}
                  >
                    {agent.status}
                  </Badge>
                </div>
                <div className="mt-1 truncate text-[11px] text-muted-foreground">
                  {agent.role}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {agent.capabilities?.slice(0, 2).map((cap) => (
                    <span
                      key={cap}
                      className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
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
            className="h-6 text-[11px] px-2 text-amber-800 dark:text-amber-200"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* SECTION 2: 4-COLUMN GOVERNANCE KANBAN BOARD */}
      <div className="flex flex-1 gap-3 overflow-x-auto p-4">
        {/* COLUMN 1: TO DO */}
        <div className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/20">
          <div className="flex items-center justify-between border-b border-border p-3">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                To Do
              </span>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {todoTasks.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {todoTasks.map((t) => (
              <Card key={t.id} className="border-border bg-card p-3 shadow-2xs">
                <div className="flex items-start justify-between gap-1">
                  <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                    {t.id}
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {t.priority}
                  </Badge>
                </div>
                <div className="mt-1 text-xs font-medium text-foreground">{t.title}</div>
                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2">
                  <span className="text-[10px] text-muted-foreground truncate">
                    @{t.assigned_agent || 'lead-architect'}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleStartTask(t)}
                    disabled={dispatchLoading === t.id}
                    className="h-6 gap-1 px-2 text-[10px]"
                  >
                    {dispatchLoading === t.id ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Play className="size-3" />
                    )}
                    Start
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* COLUMN 2: IN PROGRESS (Physical Autonomous Execution) */}
        <div className="flex w-72 shrink-0 flex-col rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between border-b border-primary/20 p-3">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-primary animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                In Progress
              </span>
            </div>
            <Badge className="text-[10px] bg-primary text-primary-foreground">
              {inProgressTasks.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {inProgressTasks.map((t) => (
              <Card key={t.id} className="border-primary/30 bg-card p-3 shadow-xs">
                <div className="flex items-start justify-between gap-1">
                  <span className="font-mono text-[10px] text-primary font-semibold">
                    {t.id}
                  </span>
                  <Badge variant="default" className="text-[9px] px-1 py-0 bg-emerald-500 text-white">
                    Executing
                  </Badge>
                </div>
                <div className="mt-1 text-xs font-medium text-foreground">{t.title}</div>
                <div className="mt-2 rounded bg-muted/60 px-2 py-1 text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                  <Bot className="size-3 text-primary" />
                  <span>Agent dispatched: @{t.assigned_agent || 'lead-architect'}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-1.5 border-t border-border/40 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEscalateToHitl(t)}
                    disabled={dispatchLoading === t.id}
                    className="h-6 px-1.5 text-[10px] text-amber-600 dark:text-amber-400"
                  >
                    Escalate HITL
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleCompleteTask(t)}
                    disabled={dispatchLoading === t.id}
                    className="h-6 gap-1 px-2 text-[10px]"
                  >
                    <CheckCircle2 className="size-3" />
                    Complete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* COLUMN 3: AWAITING HITL (Tier 2 Governance Gate) */}
        <div className="flex w-72 shrink-0 flex-col rounded-lg border border-amber-500/40 bg-amber-500/5">
          <div className="flex items-center justify-between border-b border-amber-500/20 p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-amber-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Awaiting HITL
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-300">
              {hitlTasks.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {hitlTasks.map((t) => (
              <Card key={t.id} className="border-amber-500/30 bg-card p-3 shadow-xs">
                <div className="flex items-start justify-between gap-1">
                  <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    {t.id}
                  </span>
                  <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[9px] px-1 py-0">
                    Tier 2 Gate
                  </Badge>
                </div>
                <div className="mt-1 text-xs font-medium text-foreground">{t.title}</div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Requires executive sign-off from Human Node (`thanb`). Approver must differ from executor (SoD).
                </div>
                <div className="mt-3 border-t border-border/40 pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setHitlTask(t);
                      setGovernanceError(null);
                    }}
                    className="w-full h-6 gap-1 text-[10px] bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <ShieldCheck className="size-3" />
                    Sign-Off (thanb)
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* COLUMN 4: COMPLETED */}
        <div className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/20">
          <div className="flex items-center justify-between border-b border-border p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Completed
              </span>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {doneTasks.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {doneTasks.map((t) => (
              <Card key={t.id} className="border-border bg-card/60 p-3 opacity-80">
                <div className="flex items-start justify-between gap-1">
                  <span className="font-mono text-[10px] text-muted-foreground line-through">
                    {t.id}
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 text-emerald-600 dark:text-emerald-400">
                    Verified ✓✓
                  </Badge>
                </div>
                <div className="mt-1 text-xs font-medium text-muted-foreground line-through">
                  {t.title}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* HITL GOVERNANCE SIGN-OFF DIALOG */}
      {hitlTask && (
        <Dialog open={true} onOpenChange={() => setHitlTask(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-amber-500" />
                <DialogTitle className="text-base font-semibold">
                  Tier 2 Executive Sign-Off
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Enforcing Segregation of Duties (Gate GW-SOD-01: approver ≠ executor).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-md border border-border bg-muted/30 p-2.5">
                <div className="font-semibold text-foreground">{hitlTask.title}</div>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                  Task ID: {hitlTask.id} · Priority: {hitlTask.priority}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Approver Actor ID (SSOT: thanb)
                </label>
                <Input
                  value={approverId}
                  onChange={(e) => setApproverId(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Approval Rationale & Audit Evidence
                </label>
                <Input
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              {governanceError && (
                <div className="rounded-md bg-destructive/15 border border-destructive/30 p-2 text-xs text-destructive">
                  {governanceError}
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setHitlTask(null)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleApproveGovernance} className="text-xs bg-amber-600 hover:bg-amber-700 text-white">
                Authorize & Close Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
                Role: {selectedAgent.role}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleDispatchAgent} className="space-y-3 py-2 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">
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
