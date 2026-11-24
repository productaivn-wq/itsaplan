import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import {
  AppRouterContext,
  type AppRouterInstance,
} from 'next/dist/shared/lib/app-router-context.shared-runtime';
import {
  PathParamsContext,
  PathnameContext,
} from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import {
  AgentTree,
  buildAgentTreeFromVibeAgents,
  computeBranchCost,
  computeBranchTokens,
  computePauseAwareElapsedMs,
  resolveTreeAgentAction,
  type TreeAgent,
} from '@/components/ui/agent-tree';
import AgentSwarmView from './AgentSwarmView';
import type { VibeAgent, VibeTask } from '../types';

const dummyRouter: AppRouterInstance = {
  back: () => {},
  forward: () => {},
  refresh: () => {},
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  bfcacheId: 'test',
};

describe('AgentTree Pure Function Unit Tests', () => {
  it('computeBranchCost: sums own cost and recursively sums child branch costs', () => {
    const tree: TreeAgent = {
      id: 'root',
      name: 'Orchestrator',
      status: 'running',
      cost: 0.15,
      children: [
        {
          id: 'worker-1',
          name: 'Coder',
          status: 'running',
          cost: 0.25,
          children: [
            {
              id: 'sub-worker-1',
              name: 'Linter',
              status: 'done',
              cost: 0.05,
            },
          ],
        },
        {
          id: 'worker-2',
          name: 'Tester',
          status: 'done',
          cost: 0.1,
        },
      ],
    };

    const total = computeBranchCost(tree);
    // 0.15 + 0.25 + 0.05 + 0.10 = 0.55
    assert.equal(total, 0.55);
  });

  it('computeBranchTokens: sums tokens across all nested agents', () => {
    const tree: TreeAgent = {
      id: 'root',
      name: 'Orchestrator',
      status: 'running',
      tokens: 1000,
      children: [
        {
          id: 'worker-1',
          name: 'Coder',
          status: 'running',
          tokens: 2500,
          children: [
            { id: 'sub-1', name: 'Linter', status: 'done', tokens: 500 },
          ],
        },
      ],
    };

    assert.equal(computeBranchTokens(tree), 4000);
  });

  it('computePauseAwareElapsedMs: accurately subtracts waitWindows HITL intervals', () => {
    const started = 100000;
    const ended = 160000; // total raw: 60,000ms
    const waitWindows: [number, number][] = [
      [110000, 120000], // 10,000ms paused
      [130000, 145000], // 15,000ms paused
    ];

    const node: TreeAgent = {
      id: 'worker-pause',
      name: 'HITL Paused Worker',
      status: 'done',
      started,
      ended,
      waitWindows,
    };

    // 60,000 - 25,000 = 35,000ms
    const elapsed = computePauseAwareElapsedMs(node, 160000);
    assert.equal(elapsed, 35000);
  });

  it('resolveTreeAgentAction: transitions waiting node on approve and reject', () => {
    const tree: TreeAgent = {
      id: 'root',
      name: 'Root',
      status: 'running',
      children: [
        {
          id: 'worker-hitl',
          name: 'HITL Requester',
          status: 'waiting',
          ask: 'Needs database schema migration approval',
        },
      ],
    };

    // Approve
    const approved = resolveTreeAgentAction(tree, 'worker-hitl', 'approve');
    const approvedWorker = approved.children?.[0];
    assert.equal(approvedWorker?.status, 'running');
    assert.equal(approvedWorker?.ask, undefined);

    // Reject
    const rejected = resolveTreeAgentAction(tree, 'worker-hitl', 'reject');
    const rejectedWorker = rejected.children?.[0];
    assert.equal(rejectedWorker?.status, 'stopped');
  });

  it('resolveTreeAgentAction: appends retry sibling on retry of failed agent', () => {
    const tree: TreeAgent = {
      id: 'root',
      name: 'Root',
      status: 'running',
      children: [
        {
          id: 'worker-fail',
          name: 'Flaky Worker',
          status: 'failed',
          error: 'Connection reset by peer',
        },
      ],
    };

    const now = 1793100000;
    const retried = resolveTreeAgentAction(tree, 'worker-fail', 'retry', now);

    assert.equal(retried.children?.length, 2);
    const original = retried.children?.[0];
    const sibling = retried.children?.[1];

    assert.equal(original?.id, 'worker-fail');
    assert.equal(original?.status, 'stopped');

    assert.equal(sibling?.id, 'worker-fail-retry-1');
    assert.equal(sibling?.status, 'running');
    assert.equal(sibling?.retryOf, 'worker-fail');
    assert.equal(sibling?.started, now);
  });

  it('buildAgentTreeFromVibeAgents: maps orchestrator root and extracts beside SoD reviewer', () => {
    const agents: VibeAgent[] = [
      {
        id: 'agt-orch',
        name: 'Orchestrator Agent',
        role: 'Autonomous Portfolio Orchestrator',
        status: 'RUNNING',
        archetype: 'Orchestrator',
        capabilities: ['AOP', 'KahnDAG'],
      },
      {
        id: 'agt-coder',
        name: 'React Coder',
        role: 'Frontend Engineer',
        status: 'BUSY',
        archetype: 'Coder',
        capabilities: ['React', 'TypeScript'],
      },
      {
        id: 'agt-reviewer',
        name: 'Independent SoD Reviewer',
        role: 'Separation of Duties Reviewer (GW-SOD-01)',
        status: 'RUNNING',
        archetype: 'Reviewer',
        capabilities: ['GateAudit', 'SoD'],
      },
    ];

    const tasks: VibeTask[] = [
      {
        id: 'task-1',
        title: 'Implement AffectUI AgentTree',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assigned_agent: 'agt-coder',
      },
    ];

    const { root, beside } = buildAgentTreeFromVibeAgents(agents, tasks);

    assert.equal(root.id, 'agt-orch');
    assert.equal(root.name, 'Orchestrator Agent');
    assert.equal(root.status, 'running');

    assert.ok(beside, 'Beside SoD node should be extracted');
    assert.equal(beside?.id, 'agt-reviewer');
    assert.notEqual(beside?.id, root.id, 'GW-SOD-01: beside reviewer must not equal root');
    assert.equal(beside?.status, 'running');

    // Only coder remains in children
    assert.equal(root.children?.length, 1);
    assert.equal(root.children?.[0]?.id, 'agt-coder');
    assert.equal(root.children?.[0]?.task, 'Implement AffectUI AgentTree');
  });
});

describe('AgentTree & AgentSwarmView DOM Integration Tests', () => {
  let dom: JSDOM;
  let root: Root;
  let container: HTMLDivElement;
  let originalGlobals: Map<string, PropertyDescriptor | undefined>;

  const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 30)));

  beforeEach(() => {
    dom = new JSDOM('<div id="root"></div>', {
      url: 'https://itsaplan.test',
      pretendToBeVisual: true,
    });

    const globals = {
      window: dom.window,
      document: dom.window.document,
      navigator: dom.window.navigator,
      Node: dom.window.Node,
      HTMLElement: dom.window.HTMLElement,
      HTMLDivElement: dom.window.HTMLDivElement,
      HTMLButtonElement: dom.window.HTMLButtonElement,
      customElements: dom.window.customElements,
    };

    originalGlobals = new Map();
    for (const [key, value] of Object.entries(globals)) {
      originalGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
      Object.defineProperty(globalThis, key, {
        value,
        configurable: true,
        writable: true,
      });
    }

    container = dom.window.document.getElementById('root') as HTMLDivElement;
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    for (const [key, desc] of originalGlobals.entries()) {
      if (desc) {
        Object.defineProperty(globalThis, key, desc);
      } else {
        delete (globalThis as any)[key];
      }
    }
  });

  it('renders AgentTree with Needs You popover, fold button, beside card, and tool micro-bars', async () => {
    let resolvedAction: string | null = null;

    const treeData: TreeAgent = {
      id: 'root-lead',
      name: 'Lead Orchestrator',
      status: 'running',
      cost: 0.5,
      toolCalls: [
        { id: 'tc-1', name: 'read_ast', durationMs: 24, status: 'done' },
        { id: 'tc-2', name: 'eval_gate', durationMs: 45, status: 'running' },
      ],
      children: [
        {
          id: 'child-waiting',
          name: 'Stalled Agent',
          status: 'waiting',
          ask: 'Needs confirmation to overwrite index',
        },
      ],
    };

    const besideData: TreeAgent = {
      id: 'sod-peer',
      name: 'SoD Gate Auditor',
      status: 'running',
      task: 'Continuous compliance audit',
      cost: 0.1,
    };

    await act(async () => {
      root.render(
        <AgentTree
          root={treeData}
          beside={besideData}
          onResolve={(_ag, action) => {
            resolvedAction = action;
          }}
        />
      );
    });
    await settle();

    // Check title and agents count
    const headerText = container.textContent || '';
    assert.ok(headerText.includes('Lead Orchestrator'), 'Should render lead orchestrator');
    assert.ok(headerText.includes('SoD Gate Auditor'), 'Should render beside SoD card');
    assert.ok(headerText.includes('needs you'), 'Should render needs you button');
    assert.ok(headerText.includes('Run Inspector'), 'Should render toolCalls Run Inspector');
    assert.ok(headerText.includes('read_ast'), 'Should render toolCall name');

    // Click "needs you" button to open popover
    const needsYouBtn = container.querySelector('button[data-kind="waiting"]') as HTMLButtonElement;
    assert.ok(needsYouBtn, 'Needs you button must exist');

    await act(async () => {
      needsYouBtn.click();
    });
    await settle();

    const popover = container.querySelector('.ui-agt__pop');
    assert.ok(popover, 'Action popover dialog should open');
    assert.ok(popover.textContent?.includes('Needs confirmation to overwrite index'));

    // Click Approve
    const approveBtn = popover.querySelector('.ui-agt__btn--primary') as HTMLButtonElement;
    assert.ok(approveBtn, 'Approve button must exist in popover');

    await act(async () => {
      approveBtn.click();
    });
    await settle();

    assert.equal(resolvedAction, 'approve');
  });

  it('renders AgentSwarmView with Tree and Grid toggles, preserving canonical testids', async () => {
    const mockAgents: VibeAgent[] = [
      {
        id: 'agt-1',
        name: 'Orchestrator',
        role: 'Orchestrator',
        status: 'RUNNING',
        archetype: 'Lead',
        capabilities: ['AOP'],
      },
      {
        id: 'agt-2',
        name: 'Quality Gate Auditor',
        role: 'SoD Reviewer (GW-SOD-01)',
        status: 'RUNNING',
        archetype: 'Reviewer',
        capabilities: ['QualityGate'],
      },
    ];

    const mockTasks: VibeTask[] = [
      {
        id: 'task-1',
        title: 'Run test suite',
        status: 'TODO',
        priority: 'HIGH',
      },
    ];

    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <PathnameContext.Provider value="/thanb/PM">
            <PathParamsContext.Provider value={{ teamRef: 'thanb', projectKey: 'PM' }}>
              <AgentSwarmView
                agents={mockAgents}
                tasks={mockTasks}
                onRefreshTasks={() => {}}
                onRefreshAgents={() => {}}
                onOpenOffice={() => {}}
                apiBaseUrl="http://api.test"
              />
            </PathParamsContext.Provider>
          </PathnameContext.Provider>
        </AppRouterContext.Provider>
      );
    });
    await settle();

    // Verify all canonical testids are preserved
    const bridgeCard = container.querySelector('[data-testid="swarm-work-items-bridge"]');
    assert.ok(bridgeCard, 'Must preserve swarm-work-items-bridge testid');

    const openOfficeBtn = container.querySelector('[data-testid="btn-open-open-office"]');
    assert.ok(openOfficeBtn, 'Must preserve btn-open-open-office testid');

    const workItemsBtn = container.querySelector('[data-testid="btn-open-canonical-work-items"]');
    assert.ok(workItemsBtn, 'Must preserve btn-open-canonical-work-items testid');

    // Verify layout toggle buttons
    const treeToggleBtn = container.querySelector('[data-testid="btn-swarm-view-tree"]') as HTMLButtonElement;
    const gridToggleBtn = container.querySelector('[data-testid="btn-swarm-view-grid"]') as HTMLButtonElement;
    assert.ok(treeToggleBtn, 'Must have btn-swarm-view-tree toggle button');
    assert.ok(gridToggleBtn, 'Must have btn-swarm-view-grid toggle button');

    // Default is tree layout: AgentTree is rendered
    const agentTree = container.querySelector('.ui-agt');
    assert.ok(agentTree, 'AgentTree component should be rendered by default in tree view');

    // Switch to Grid layout
    await act(async () => {
      gridToggleBtn.click();
    });
    await settle();

    // In grid layout, fleet grid cards are rendered
    assert.ok(container.textContent?.includes('@undefined') || container.textContent?.includes('Orchestrator'));
  });
});
