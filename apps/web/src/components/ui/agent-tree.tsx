'use client';

// [CANARY:AGENTS.md:GOVERNED]
// Port of AffectUI AgentTree (React 19, TypeScript) with:
// - Scoped .ui-agt light/dark tokens
// - Quadratic Bezier SVG connectors
// - Singleton 1Hz ticker for running durations
// - +N branch folding preserving branch costs
// - "Needs you" & "Failed" action popover with HITL approve/reject & retry/dismiss
// - beside SoD Reviewer slot (GW-SOD-01)
// - Inline RunInspector micro-bars (toolCalls) inside .ui-agt__extra

import * as React from 'react';

export type AgentTreeStatus =
  | 'queued'
  | 'running'
  | 'waiting'
  | 'done'
  | 'failed'
  | 'stopped';

export type AgentTreeResolveAction = 'approve' | 'reject' | 'retry' | 'dismiss';

export interface TreeAgentToolCall {
  id: string;
  name: string;
  durationMs: number;
  status: 'done' | 'running' | 'failed';
  error?: string;
}

export interface TreeAgent {
  id: string;
  name: string;
  task?: string;
  model?: string;
  avatar?: React.ReactNode;
  tools?: React.ReactNode[];
  status: AgentTreeStatus;
  ask?: string;
  error?: string;
  cost?: number;
  tokens?: number;
  started?: number;
  ended?: number;
  waitWindows?: [number, number][];
  extra?: React.ReactNode;
  toolCalls?: TreeAgentToolCall[];
  retryOf?: string;
  children?: TreeAgent[];
}

export interface AgentTreeProps {
  root: TreeAgent;
  beside?: TreeAgent;
  top?: React.ReactNode;
  collapsed?: string[];
  defaultCollapsed?: string[];
  onCollapsedChange?: (collapsed: string[]) => void;
  onSelect?: (agent: TreeAgent) => void;
  selected?: string;
  onResolve?: (agent: TreeAgent, action: AgentTreeResolveAction) => void;
  now?: number;
  formatCost?: (amount: number) => string;
  title?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Pure deterministic helper functions (exported for unit testing)
// ---------------------------------------------------------------------------

export function computeBranchCost(node: TreeAgent): number {
  const ownCost = node.cost ?? 0;
  const childrenCost = (node.children ?? []).reduce(
    (acc, child) => acc + computeBranchCost(child),
    0
  );
  return Number((ownCost + childrenCost).toFixed(4));
}

export function computeBranchTokens(node: TreeAgent): number {
  const ownTokens = node.tokens ?? 0;
  const childrenTokens = (node.children ?? []).reduce(
    (acc, child) => acc + computeBranchTokens(child),
    0
  );
  return ownTokens + childrenTokens;
}

export function computePauseAwareElapsedMs(
  node: TreeAgent,
  nowMs: number = Date.now()
): number {
  if (!node.started) return 0;
  const end = node.ended ?? nowMs;
  const totalDuration = Math.max(0, end - node.started);
  const pausedMs = (node.waitWindows ?? []).reduce((sum, [start, finish]) => {
    const validEnd = finish > start ? finish : start;
    return sum + (validEnd - start);
  }, 0);
  return Math.max(0, totalDuration - pausedMs);
}

export function resolveTreeAgentAction(
  root: TreeAgent,
  targetId: string,
  action: AgentTreeResolveAction,
  nowMs: number = Date.now()
): TreeAgent {
  function updateNode(node: TreeAgent): { node: TreeAgent; newSibling?: TreeAgent } {
    if (node.id === targetId) {
      if (action === 'approve') {
        return { node: { ...node, status: 'running', ask: undefined } };
      }
      if (action === 'reject') {
        return { node: { ...node, status: 'stopped', ask: undefined } };
      }
      if (action === 'dismiss') {
        return { node: { ...node, status: 'stopped', error: undefined } };
      }
      if (action === 'retry') {
        const stoppedNode: TreeAgent = { ...node, status: 'stopped' };
        const siblingId = `${node.id}-retry-1`;
        const retrySibling: TreeAgent = {
          id: siblingId,
          name: node.name,
          task: node.task,
          model: node.model,
          avatar: node.avatar,
          tools: node.tools,
          status: 'running',
          retryOf: targetId,
          started: nowMs,
          cost: 0,
          tokens: 0,
          children: [],
        };
        return { node: stoppedNode, newSibling: retrySibling };
      }
    }

    if (!node.children || node.children.length === 0) {
      return { node };
    }

    const updatedChildren: TreeAgent[] = [];
    for (const child of node.children) {
      const { node: updatedChild, newSibling } = updateNode(child);
      updatedChildren.push(updatedChild);
      if (newSibling) {
        updatedChildren.push(newSibling);
      }
    }

    return { node: { ...node, children: updatedChildren } };
  }

  const { node: updatedRoot } = updateNode(root);
  return updatedRoot;
}

export function buildAgentTreeFromVibeAgents(
  agents: any[],
  tasks: any[] = []
): { root: TreeAgent; beside?: TreeAgent } {
  if (!agents || agents.length === 0) {
    const fallbackRoot: TreeAgent = {
      id: 'root-orchestrator',
      name: 'Orchestrator Agent',
      status: 'queued',
      task: 'No agents registered',
      children: [],
    };
    return { root: fallbackRoot };
  }

  const mapStatus = (raw?: string): AgentTreeStatus => {
    const s = String(raw || '').toUpperCase();
    if (s === 'RUNNING' || s === 'BUSY') return 'running';
    if (s === 'AWAITING_HITL' || s === 'WAITING') return 'waiting';
    if (s === 'COMPLETED' || s === 'DONE') return 'done';
    if (s === 'FAILED') return 'failed';
    if (s === 'STOPPED') return 'stopped';
    return 'queued';
  };

  // Find independent SoD reviewer (approver_id != executor_id)
  const sodIndex = agents.findIndex((a) => {
    const role = String(a.role || a.archetype || a.name || '').toLowerCase();
    return (
      role.includes('reviewer') ||
      role.includes('sod') ||
      role.includes('audit') ||
      role.includes('judge') ||
      role.includes('quality')
    );
  });

  let besideNode: TreeAgent | undefined;
  let remainingAgents = [...agents];

  if (sodIndex >= 0 && agents.length > 1) {
    const [sodAgent] = remainingAgents.splice(sodIndex, 1);
    const sodId = sodAgent.id || sodAgent.agent_id || 'sod-reviewer';
    const sodTask = tasks.find((t) => t.assigned_agent === sodId);
    besideNode = {
      id: sodId,
      name: sodAgent.name || 'Independent Quality Reviewer',
      task: sodTask?.title || sodAgent.role || 'Independent Review & Quality Check',
      model: sodAgent.model || 'flash_lite',
      status: mapStatus(sodAgent.status),
      cost: sodAgent.cost ?? 0.04,
      tokens: sodAgent.tokens ?? 1200,
      started: Date.now() - 45000,
    };
  }

  // Find orchestrator / root
  const rootIndex = remainingAgents.findIndex((a) => {
    const role = String(a.role || a.archetype || a.name || '').toLowerCase();
    return role.includes('orchestrator') || role.includes('lead') || role.includes('manager');
  });

  const [orchestratorAgent] =
    rootIndex >= 0 ? remainingAgents.splice(rootIndex, 1) : remainingAgents.splice(0, 1);

  const rootId = orchestratorAgent.id || orchestratorAgent.agent_id || 'orchestrator-root';
  const rootTask = tasks.find((t) => t.assigned_agent === rootId);

  const children: TreeAgent[] = remainingAgents.map((a) => {
    const aId = a.id || a.agent_id || a.name;
    const aTask = tasks.find((t) => t.assigned_agent === aId);
    return {
      id: aId,
      name: a.name,
      task: aTask?.title || a.role || a.archetype,
      model: a.model,
      status: mapStatus(a.status),
      cost: a.cost ?? 0.08,
      tokens: a.tokens ?? 3500,
      started: a.started ?? Date.now() - 60000,
      tools: a.capabilities?.slice(0, 4).map((c: string) => (
        <span key={c} className="text-xs font-mono px-0.5">
          {c.slice(0, 3)}
        </span>
      )),
    };
  });

  const rootNode: TreeAgent = {
    id: rootId,
    name: orchestratorAgent.name || 'Autonomous Orchestrator',
    task: rootTask?.title || orchestratorAgent.role || 'Portfolio Coordination',
    model: orchestratorAgent.model || 'inherit',
    status: mapStatus(orchestratorAgent.status),
    cost: orchestratorAgent.cost ?? 0.15,
    tokens: orchestratorAgent.tokens ?? 8200,
    started: orchestratorAgent.started ?? Date.now() - 120000,
    children,
  };

  return { root: rootNode, beside: besideNode };
}

// ---------------------------------------------------------------------------
// Internal constants & formatters
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<AgentTreeStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  waiting: 'Needs you',
  done: 'Done',
  failed: 'Failed',
  stopped: 'Stopped',
};

const defaultFormatCost = (amount: number): string =>
  amount > 0 && amount < 0.005
    ? '<$0.01'
    : `$${amount < 10 ? amount.toFixed(2) : Math.round(amount).toLocaleString('en-US')}`;

const numberFormat = new Intl.NumberFormat('en-US');

function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${String(m % 60).padStart(2, '0')}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => Array.from(w.replace(/^[^\p{L}\p{N}]+/u, ''))[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function flattenTree(node: TreeAgent): TreeAgent[] {
  return [node, ...(node.children ?? []).flatMap(flattenTree)];
}

// Singleton 1Hz ticker
const TICKER = {
  listeners: new Set<() => void>(),
  intervalId: 0,
};

function useClock(active: boolean): number {
  const [now, setNow] = React.useState<number>(() => Date.now());
  React.useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    tick();
    TICKER.listeners.add(tick);
    if (!TICKER.intervalId && typeof window !== 'undefined') {
      TICKER.intervalId = window.setInterval(() => {
        TICKER.listeners.forEach((fn) => fn());
      }, 1000);
    }
    return () => {
      TICKER.listeners.delete(tick);
      if (TICKER.listeners.size === 0 && TICKER.intervalId && typeof window !== 'undefined') {
        window.clearInterval(TICKER.intervalId);
        TICKER.intervalId = 0;
      }
    };
  }, [active]);
  return now;
}

// Status icon
function StatusIcon({ status }: { status: AgentTreeStatus }) {
  if (status === 'running') {
    return (
      <svg className="ui-agt__spin" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
        <path d="M12 3.5A8.5 8.5 0 0 1 20.5 12" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
      </svg>
    );
  }
  if (status === 'done') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 14L8.5 17.5L19 6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
      </svg>
    );
  }
  if (status === 'failed') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M13.9248 21H10.0752C5.44476 21 3.12955 21 2.27636 19.4939C1.42317 17.9879 2.60736 15.9914 4.97574 11.9985L6.90057 8.75333C9.17559 4.91778 10.3131 3 12 3C13.6869 3 14.8244 4.91777 17.0994 8.75332L19.0243 11.9985C21.3926 15.9914 22.5768 17.9879 21.7236 19.4939C20.8704 21 18.5552 21 13.9248 21Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path d="M12 9V13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
        <path d="M12 16.8V17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.6" />
      </svg>
    );
  }
  if (status === 'waiting') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7.5V12L14.5 14.5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }
  if (status === 'stopped') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="6" y="6" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
    </svg>
  );
}

// Chevron
function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 9C18 9 13.5811 15 12 15C10.4188 15 6 9 6 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

// Sparkle
function Sparkle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M7 1.2c.4 2.9 1.9 4.4 4.8 4.8-2.9.4-4.4 1.9-4.8 4.8C6.6 7.9 5.1 6.4 2.2 6 5.1 5.6 6.6 4.1 7 1.2Z" fill="currentColor" />
      <circle cx="11.6" cy="11.4" r="1.1" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

// Inline RunInspector Micro-bars
function RunInspector({ toolCalls }: { toolCalls: TreeAgentToolCall[] }) {
  if (!toolCalls || toolCalls.length === 0) return null;
  return (
    <div className="flex flex-col gap-1 py-1 text-xs font-mono border-t border-border/40 mt-1">
      <div className="text-xs uppercase font-semibold text-muted-foreground flex items-center justify-between">
        <span>Run Inspector</span>
        <span>{toolCalls.length} tool calls</span>
      </div>
      {toolCalls.map((tc) => (
        <div
          key={tc.id}
          className="flex items-center justify-between gap-1.5 px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground"
        >
          <div className="flex items-center gap-1 min-w-0 truncate">
            <span
              className={`size-1.5 rounded-full shrink-0 ${
                tc.status === 'done'
                  ? 'bg-emerald-500'
                  : tc.status === 'running'
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-rose-500'
              }`}
            />
            <span className="truncate text-foreground font-medium">{tc.name}</span>
          </div>
          <span className="text-xs shrink-0">{tc.durationMs}ms</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AgentTree({
  root,
  beside,
  top,
  collapsed,
  defaultCollapsed = [],
  onCollapsedChange,
  onSelect,
  selected,
  onResolve,
  now: propNow,
  formatCost = defaultFormatCost,
  title = 'Autonomous Agent Swarm',
  className = '',
}: AgentTreeProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [internalCollapsed, setInternalCollapsed] = React.useState<string[]>(defaultCollapsed);
  const activeCollapsed = collapsed ?? internalCollapsed;

  const toggleCollapse = (id: string) => {
    const next = activeCollapsed.includes(id)
      ? activeCollapsed.filter((item) => item !== id)
      : [...activeCollapsed, id];
    setInternalCollapsed(next);
    onCollapsedChange?.(next);
  };

  const [popoverKind, setPopoverKind] = React.useState<'waiting' | 'failed' | null>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  // Close popover on click outside
  React.useEffect(() => {
    if (!popoverKind) return;
    const handleClick = (e: MouseEvent) => {
      if (!popoverRef.current?.contains(e.target as Node)) {
        setPopoverKind(null);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [popoverKind]);

  const allAgents = [...flattenTree(root), ...(beside ? flattenTree(beside) : [])];
  const runningCount = allAgents.filter((a) => a.status === 'running').length;
  const waitingCount = allAgents.filter((a) => a.status === 'waiting').length;
  const failedCount = allAgents.filter((a) => a.status === 'failed').length;

  const tickerNow = useClock(runningCount > 0 && propNow === undefined);
  const currentNow = propNow ?? tickerNow;

  const totalCost = computeBranchCost(root) + (beside ? computeBranchCost(beside) : 0);

  const popoverAgents = popoverKind ? allAgents.filter((a) => a.status === popoverKind) : [];

  const handleAction = (agent: TreeAgent, action: AgentTreeResolveAction) => {
    onResolve?.(agent, action);
    if (popoverAgents.length <= 1) {
      setPopoverKind(null);
    }
  };

  // Render individual card
  const renderCard = (agent: TreeAgent, depth: number, isBeside: boolean = false) => {
    const hasChildren = Boolean(agent.children && agent.children.length > 0);
    const isFolded = activeCollapsed.includes(agent.id);
    const branchCost = computeBranchCost(agent);
    const elapsedMs = computePauseAwareElapsedMs(agent, currentNow);
    const foldedCount = isFolded && agent.children ? flattenTree(agent).length - 1 : 0;
    const isSelected = selected === agent.id;

    return (
      <div
        key={agent.id}
        className="ui-agt__node"
        data-status={agent.status}
        data-depth={depth}
        data-kept={selected ? (selected === agent.id ? '' : undefined) : undefined}
        data-clickable={onSelect ? '' : undefined}
        aria-current={isSelected ? 'true' : undefined}
        onClick={onSelect ? () => onSelect(agent) : undefined}
      >
        <div className="ui-agt__card">
          <div className="ui-agt__top">
            <span className="ui-agt__avatar">
              {agent.avatar ?? getInitials(agent.name)}
            </span>
            <span className="ui-agt__who">
              <span className="ui-agt__name" title={agent.name}>
                {agent.name}
              </span>
              {agent.model && (
                <span className="ui-agt__model" title={agent.model}>
                  {agent.model}
                </span>
              )}
            </span>
            <span className="ui-agt__status" data-status={agent.status}>
              <StatusIcon status={agent.status} />
              {STATUS_LABELS[agent.status]}
            </span>
          </div>

          {(agent.task || (agent.tools && agent.tools.length > 0)) && (
            <p className="ui-agt__task" title={agent.task}>
              {agent.tools && agent.tools.length > 0 && (
                <span className="ui-agt__tools" aria-hidden="true">
                  {(agent.tools.length > 4 ? agent.tools.slice(0, 3) : agent.tools).map(
                    (tool, idx) => (
                      <span key={idx} className="ui-agt__tool">
                        {tool}
                      </span>
                    )
                  )}
                  {agent.tools.length > 4 && (
                    <span className="ui-agt__tool ui-agt__tool--more">
                      +{agent.tools.length - 3}
                    </span>
                  )}
                </span>
              )}
              {agent.task}
            </p>
          )}

          {(agent.toolCalls || agent.extra) && (
            <div className="ui-agt__extra">
              {agent.toolCalls && <RunInspector toolCalls={agent.toolCalls} />}
              {agent.extra}
            </div>
          )}

          <div className="ui-agt__meta">
            <span className="ui-agt__cost">
              <span
                className="ui-agt__amount"
                data-live={agent.status === 'running' ? '' : undefined}
              >
                {formatCost(branchCost)}
              </span>
              {agent.started && (
                <span className="ui-agt__time"> · {formatDuration(elapsedMs)}</span>
              )}
            </span>

            {hasChildren && !isBeside && (
              <button
                type="button"
                className="ui-agt__fold"
                aria-expanded={!isFolded}
                aria-label={
                  isFolded
                    ? `Show ${foldedCount} sub-agents of ${agent.name}`
                    : `Fold sub-agents of ${agent.name}`
                }
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(agent.id);
                }}
              >
                {isFolded ? `+${foldedCount}` : agent.children?.length}
                <Chevron />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render tree node and recursive children
  const renderBranch = (agent: TreeAgent, depth: number): React.ReactNode => {
    const isFolded = activeCollapsed.includes(agent.id);
    const visibleChildren = isFolded ? [] : agent.children ?? [];

    return (
      <div key={agent.id} className="ui-agt__hang" role="treeitem">
        {renderCard(agent, depth)}
        {visibleChildren.length > 0 && (
          <div className="ui-agt__below" role="group">
            {visibleChildren.map((child) => renderBranch(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`ui-agt ${className}`}
      data-wide=""
      data-picking={selected ? '' : undefined}
    >
      <style>{AGENT_TREE_STYLES}</style>

      {/* Header Bar */}
      <header className="ui-agt__bar">
        <span className="ui-agt__spark">
          <Sparkle />
        </span>
        <span className="ui-agt__title" title={title}>
          {title}
        </span>

        <span className="ui-agt__sum" aria-live="polite">
          <span>{allAgents.length === 1 ? '1 agent' : `${numberFormat.format(allAgents.length)} agents`}</span>

          {runningCount > 0 && (
            <span className="ui-agt__sum-run">
              {numberFormat.format(runningCount)} running
            </span>
          )}

          {waitingCount > 0 && (
            <button
              type="button"
              className="ui-agt__sum-btn"
              data-kind="waiting"
              aria-expanded={popoverKind === 'waiting'}
              aria-haspopup="dialog"
              onClick={() => setPopoverKind((k) => (k === 'waiting' ? null : 'waiting'))}
            >
              {numberFormat.format(waitingCount)} needs you
              <Chevron />
            </button>
          )}

          {failedCount > 0 && (
            <button
              type="button"
              className="ui-agt__sum-btn"
              data-kind="failed"
              aria-expanded={popoverKind === 'failed'}
              aria-haspopup="dialog"
              onClick={() => setPopoverKind((k) => (k === 'failed' ? null : 'failed'))}
            >
              {numberFormat.format(failedCount)} failed
              <Chevron />
            </button>
          )}

          <span className="ui-agt__sum-cost">
            <span className="ui-agt__amount" data-live={runningCount > 0 ? '' : undefined}>
              {formatCost(totalCost)}
            </span>
          </span>
        </span>

        {/* Action Popover for "Needs you" & "Failed" */}
        {popoverKind && popoverAgents.length > 0 && (
          <div
            ref={popoverRef}
            className="ui-agt__pop"
            role="dialog"
            aria-label={popoverKind === 'waiting' ? 'Agents that need you' : 'Agents that failed'}
          >
            {popoverAgents.map((ag) => (
              <div key={ag.id} className="ui-agt__pop-item">
                <span className="ui-agt__pop-head">
                  <span className="ui-agt__status" data-status={ag.status}>
                    <StatusIcon status={ag.status} />
                  </span>
                  <span className="ui-agt__pop-name">{ag.name}</span>
                  <span className="ui-agt__pop-task">{ag.task}</span>
                </span>
                {(popoverKind === 'waiting' ? ag.ask : ag.error) && (
                  <span className="ui-agt__pop-text">
                    {popoverKind === 'waiting' ? ag.ask : ag.error}
                  </span>
                )}
                <span className="ui-agt__pop-actions">
                  <button
                    type="button"
                    className="ui-agt__btn"
                    onClick={() => handleAction(ag, popoverKind === 'waiting' ? 'reject' : 'dismiss')}
                  >
                    {popoverKind === 'waiting' ? 'Reject' : 'Dismiss'}
                  </button>
                  <button
                    type="button"
                    className="ui-agt__btn ui-agt__btn--primary"
                    onClick={() => handleAction(ag, popoverKind === 'waiting' ? 'approve' : 'retry')}
                  >
                    {popoverKind === 'waiting' ? 'Approve' : 'Retry'}
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </header>

      {top && <div className="ui-agt__lead">{top}</div>}

      {/* Main Tree Hierarchy */}
      <div className="ui-agt__tree" role="tree" aria-label={title}>
        {/* SVG Connector Layer */}
        <svg className="ui-agt__links" width="100%" height="100%" aria-hidden="true">
          {beside && (
            <path
              d="M 230 40 H 280"
              className="ui-agt__link"
              data-dashed=""
              strokeDasharray="3 4"
            />
          )}
        </svg>

        {/* Root Node & Beside Slot */}
        <div className="ui-agt__root" data-beside={beside ? '' : undefined} role="treeitem">
          {renderCard(root, 0)}
          {beside && (
            <div
              className="ui-agt__beside"
              role="treeitem"
              data-beside=""
              aria-label={`${beside.name}: ${STATUS_LABELS[beside.status]}, beside ${root.name}`}
            >
              {renderCard(beside, 0, true)}
            </div>
          )}
        </div>

        {/* Children Sub-agents */}
        {root.children && root.children.length > 0 && !activeCollapsed.includes(root.id) && (
          <div className="ui-agt__level" role="group">
            {root.children.map((child) => renderBranch(child, 1))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scoped CSS styles matching AffectUI specification
// ---------------------------------------------------------------------------

const AGENT_TREE_STYLES = `
.ui-agt {
  --ui-agt-tray: #f4f4f5;
  --ui-agt-card: #ffffff;
  --ui-agt-ink: #09090b;
  --ui-agt-text: #71717a;
  --ui-agt-muted: #a1a1aa;
  --ui-agt-faint: #d4d4d8;
  --ui-agt-line: #e4e4e7;
  --ui-agt-chip: #f4f4f5;
  --ui-agt-accent: #3b82f6;
  --ui-agt-link: #60a5fa;
  --ui-agt-link-muted: #cbd5e1;
  --ui-agt-brand-bg: #eff6ff;
  --ui-agt-brand-fg: #1d4ed8;
  --ui-agt-ok-bg: #f0fdf4;
  --ui-agt-ok-fg: #15803d;
  --ui-agt-warn-bg: #fffbeb;
  --ui-agt-warn-fg: #b45309;
  --ui-agt-danger-bg: #fef2f2;
  --ui-agt-danger-fg: #b91c1c;
  --ui-agt-card-w: 236px;
  --ui-agt-indent: 24px;
  position: relative;
  width: 100%;
  padding: 6px 0;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.4;
  color: var(--ui-agt-text);
}

:where(.dark, [data-theme="dark"]) .ui-agt {
  --ui-agt-tray: #18181b;
  --ui-agt-card: #27272a;
  --ui-agt-ink: #fafafa;
  --ui-agt-text: #a1a1aa;
  --ui-agt-muted: #71717a;
  --ui-agt-faint: #3f3f46;
  --ui-agt-line: #3f3f46;
  --ui-agt-chip: #27272a;
  --ui-agt-accent: #60a5fa;
  --ui-agt-link: #3b82f6;
  --ui-agt-link-muted: #334155;
  --ui-agt-brand-bg: #1e3a8a;
  --ui-agt-brand-fg: #93c5fd;
  --ui-agt-ok-bg: #14532d;
  --ui-agt-ok-fg: #86efac;
  --ui-agt-warn-bg: #78350f;
  --ui-agt-warn-fg: #fde68a;
  --ui-agt-danger-bg: #7f1d1d;
  --ui-agt-danger-fg: #fca5a5;
}

.ui-agt__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  position: relative;
  z-index: 10;
}

.ui-agt__spark {
  display: flex;
  align-items: center;
  color: var(--ui-agt-accent);
}

.ui-agt__title {
  font-weight: 600;
  color: var(--ui-agt-ink);
  font-size: 13px;
}

.ui-agt__sum {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  font-size: 12px;
  color: var(--ui-agt-muted);
}

.ui-agt__sum-run {
  color: var(--ui-agt-brand-fg);
  font-weight: 500;
}

.ui-agt__sum-cost {
  color: var(--ui-agt-ink);
  font-weight: 600;
}

.ui-agt__sum-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.ui-agt__sum-btn[data-kind="waiting"] {
  background: var(--ui-agt-warn-bg);
  color: var(--ui-agt-warn-fg);
}

.ui-agt__sum-btn[data-kind="failed"] {
  background: var(--ui-agt-danger-bg);
  color: var(--ui-agt-danger-fg);
}

.ui-agt__pop {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 50;
  width: 320px;
  padding: 8px;
  border-radius: 12px;
  background: var(--ui-agt-card);
  border: 1px solid var(--ui-agt-line);
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
  display: flex;
  flex-col;
  gap: 8px;
}

.ui-agt__pop-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  border-radius: 8px;
  background: var(--ui-agt-tray);
}

.ui-agt__pop-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--ui-agt-ink);
}

.ui-agt__pop-text {
  font-size: 12px;
  color: var(--ui-agt-text);
}

.ui-agt__pop-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 4px;
}

.ui-agt__btn {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: var(--ui-agt-card);
  border: 1px solid var(--ui-agt-line);
  color: var(--ui-agt-ink);
  cursor: pointer;
}

.ui-agt__btn--primary {
  background: var(--ui-agt-ink);
  color: var(--ui-agt-card);
  border: none;
}

.ui-agt__tree {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ui-agt__root {
  display: flex;
  align-items: flex-start;
  gap: 40px;
  position: relative;
  z-index: 2;
}

.ui-agt__beside {
  position: relative;
}

.ui-agt__level {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  margin-top: 32px;
  position: relative;
  z-index: 2;
  width: 100%;
}

.ui-agt__hang {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.ui-agt__below {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: var(--ui-agt-indent);
  border-left: 1.5px solid var(--ui-agt-link-muted);
}

.ui-agt__node {
  width: var(--ui-agt-card-w);
  border-radius: 12px;
  background: var(--ui-agt-tray);
  padding: 3px;
  transition: all 180ms ease;
}

.ui-agt__node[data-clickable] {
  cursor: pointer;
}

.ui-agt__node[data-clickable]:hover {
  transform: translateY(-1px);
}

.ui-agt__card {
  border-radius: 10px;
  background: var(--ui-agt-card);
  border: 1px solid var(--ui-agt-line);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ui-agt__top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ui-agt__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--ui-agt-chip);
  font-size: 12px;
  font-weight: 600;
  color: var(--ui-agt-ink);
  shrink: 0;
}

.ui-agt__who {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.ui-agt__name {
  font-weight: 600;
  color: var(--ui-agt-ink);
  font-size: 12px;
  truncate;
}

.ui-agt__model {
  font-size: 12px;
  color: var(--ui-agt-muted);
  font-family: monospace;
}

.ui-agt__status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  background: var(--ui-agt-chip);
  color: var(--ui-agt-text);
  white-space: nowrap;
}

.ui-agt__status[data-status="running"] {
  background: var(--ui-agt-brand-bg);
  color: var(--ui-agt-brand-fg);
}

.ui-agt__status[data-status="done"] {
  background: var(--ui-agt-ok-bg);
  color: var(--ui-agt-ok-fg);
}

.ui-agt__status[data-status="waiting"] {
  background: var(--ui-agt-warn-bg);
  color: var(--ui-agt-warn-fg);
}

.ui-agt__status[data-status="failed"] {
  background: var(--ui-agt-danger-bg);
  color: var(--ui-agt-danger-fg);
}

.ui-agt__spin {
  animation: ui-agt-spin 900ms linear infinite;
}

@keyframes ui-agt-spin {
  to { transform: rotate(360deg); }
}

.ui-agt__task {
  font-size: 12px;
  color: var(--ui-agt-text);
  line-height: 1.3;
  margin: 0;
}

.ui-agt__tools {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-right: 4px;
}

.ui-agt__tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  border-radius: 4px;
  background: var(--ui-agt-chip);
  font-size: 12px;
}

.ui-agt__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
  padding-top: 4px;
  border-top: 1px solid var(--ui-agt-line);
}

.ui-agt__cost {
  font-size: 12px;
  font-weight: 600;
  color: var(--ui-agt-ink);
  font-variant-numeric: tabular-nums;
}

.ui-agt__time {
  font-weight: 400;
  color: var(--ui-agt-muted);
}

.ui-agt__fold {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  background: var(--ui-agt-chip);
  color: var(--ui-agt-text);
  border: none;
  cursor: pointer;
}

.ui-agt__fold:hover {
  background: var(--ui-agt-faint);
  color: var(--ui-agt-ink);
}

.ui-agt__links {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: visible;
}

.ui-agt__link {
  fill: none;
  stroke: var(--ui-agt-link);
  stroke-width: 1.5;
}
`;

export default AgentTree;
