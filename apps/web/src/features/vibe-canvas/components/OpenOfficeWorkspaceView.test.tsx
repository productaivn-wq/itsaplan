import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import {
  AppRouterContext,
  type AppRouterInstance,
} from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { ShellCtx, type ShellContext } from '@/context/shellContext';

const dummyRouter: AppRouterInstance = {
  back: () => {},
  forward: () => {},
  refresh: () => {},
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  bfcacheId: 'test',
};

const MOCK_STATE = {
  office_title: 'ACCORD Open Office Workspace',
  active_agent_count: 6,
  reserve_seat_count: 0,
  projects: [
    {
      id: 1,
      team_ref: 'thanb',
      key: 'PM',
      name: 'Quản trị Dự án Toàn năng',
      open_issue_count: 8,
      pending_run_count: 2,
      active_schedule_count: 3,
      active_agent_usernames: ['@antigravity', '@orchestrator', '@qualitygate', '@codex'],
    },
    {
      id: 2,
      team_ref: 'thanb',
      key: 'MHR',
      name: 'Misa HR Nhân sự',
      open_issue_count: 5,
      pending_run_count: 1,
      active_schedule_count: 1,
      active_agent_usernames: ['@research', '@claude'],
    },
  ],
  departments: [
    {
      zone_id: 'sop_generic_7p',
      sop_id: 'SOP-GENERIC-7P',
      uc_id: 'SOP-GENERIC-7P',
      is_spine: true,
      name: 'Phòng Điều Hành 7P',
      primary_skills: ['TaskManager', 'DocumentOrganizer'],
      mission: 'Quản trị chiến lược cấp cao, giám sát tiến độ OKR & phê duyệt các cổng HITL quan trọng.',
      primary_cta_label: 'Giao việc Điều hành & Chiến lược',
      default_template_id: 'tpl-qa-gate',
      recommended_agent_ids: ['agt-orchestrator', 'agt-antigravity'],
      active_agent_names: ['Orchestrator Agent'],
      active_project_keys: ['PM', 'MHR'],
      kpis: [
        { label: 'Tỷ lệ duyệt SoD', value: '100%' },
        { label: 'Hợp đồng hoạt động', value: 3 },
      ],
      featured_items: [
        {
          issue_id: 499,
          sequence_number: 499,
          identifier: 'PM-499',
          project_key: 'PM',
          team_ref: 'thanb',
          title: 'Nghiệm thu Cổng phê duyệt HITL & SoD',
          status: 'AWAITING_HITL',
        },
      ],
      module_portals: [],
    },
    {
      zone_id: 'sop_coding_01',
      sop_id: 'SOP-CODING-01',
      uc_id: 'SOP-CODING-01',
      is_spine: false,
      name: 'Lập Trình & UTOP TDD',
      primary_skills: ['UCBDDManager', 'QualityGate'],
      mission: 'Lập trình tính năng lõi, xây dựng agentic harness và tối ưu hóa hiệu năng hệ thống.',
      primary_cta_label: 'Giao việc Phát triển tính năng',
      default_template_id: 'tpl-code-feature',
      recommended_agent_ids: ['agt-antigravity', 'agt-codex'],
      active_agent_names: ['Antigravity Agent', 'Codex Agent'],
      active_project_keys: ['PM'],
      kpis: [
        { label: 'PRs hoàn thành', value: 34 },
        { label: 'Lint Errors', value: 0 },
      ],
      featured_items: [
        {
          issue_id: 500,
          sequence_number: 500,
          identifier: 'PM-500',
          project_key: 'PM',
          team_ref: 'thanb',
          title: 'OpenOffice Multi-Project Filter & 4-Tab Inspector',
          status: 'IN_PROGRESS',
        },
      ],
      module_portals: [],
    },
  ],
  zones: [
    { id: 'sop_sec_audit_01', sop_id: 'SOP-SEC-AUDIT-01', uc_id: 'SOP-SEC-AUDIT-01', visual_slot: 'soan', is_spine: false, order: 1, primary_skills: ['QualityGate', 'LegalOpsKit'], name: 'Kiểm Toán & Bảo Mật', subtitle: 'QualityGate & Sec Audit', grid: { x: 2, y: 3, w: 22, h: 44 }, accent: 'border-sky-500/30' },
    { id: 'sop_strategy_01', sop_id: 'SOP-STRATEGY-01', uc_id: 'SOP-STRATEGY-01', visual_slot: 'dieu', is_spine: false, order: 2, primary_skills: ['StrategyToolkit', 'ProductArchitectureKit'], name: 'Chiến Lược & Kiến Trúc', subtitle: 'Strategy & 7H Framing', grid: { x: 26, y: 3, w: 22, h: 44 }, accent: 'border-emerald-500/30' },
    { id: 'sop_coding_01', sop_id: 'SOP-CODING-01', uc_id: 'SOP-CODING-01', visual_slot: 'trinh', is_spine: false, order: 3, primary_skills: ['UCBDDManager', 'QualityGate'], name: 'Lập Trình & UTOP TDD', subtitle: 'AOP Core & Swarm Engine', grid: { x: 50, y: 3, w: 23, h: 44 }, accent: 'border-indigo-500/30' },
    { id: 'sop_generic_7p', sop_id: 'SOP-GENERIC-7P', uc_id: 'SOP-GENERIC-7P', visual_slot: 'sanh', is_spine: true, order: 4, primary_skills: ['TaskManager', 'DocumentOrganizer'], name: 'Phòng Điều Hành 7P', subtitle: 'Universal 7-Phase Spine', grid: { x: 75, y: 3, w: 23, h: 44 }, accent: 'border-amber-500/30' },
    { id: 'sop_research_01', sop_id: 'SOP-RESEARCH-01', uc_id: 'SOP-RESEARCH-01', visual_slot: 'tracuu', is_spine: false, order: 5, primary_skills: ['WeKnora', 'ResearchSkill'], name: 'Nghiên Cứu & Tri Thức', subtitle: 'Knowledge & WeKnora', grid: { x: 2, y: 51, w: 22, h: 44 }, accent: 'border-cyan-500/30' },
    { id: 'sop_analytics_01', sop_id: 'SOP-ANALYTICS-01', uc_id: 'SOP-ANALYTICS-01', visual_slot: 'hop', is_spine: false, order: 6, primary_skills: ['DataAnalysisKit', 'BusinessAnalyticsKit'], name: 'Phân Tích & Dữ Liệu', subtitle: 'HITL Review & Decision', grid: { x: 26, y: 51, w: 22, h: 44 }, accent: 'border-rose-500/30' },
    { id: 'sop_legal_01', sop_id: 'SOP-LEGAL-01', uc_id: 'SOP-LEGAL-01', visual_slot: 'thugian', is_spine: false, order: 7, primary_skills: ['LegalOpsKit', 'PermissionMatrix'], name: 'Pháp Chế & Tuân Thủ', subtitle: 'Compliance & Policy', grid: { x: 50, y: 51, w: 23, h: 44 }, accent: 'border-purple-500/30' },
    { id: 'sop_operations_01', sop_id: 'SOP-OPERATIONS-01', uc_id: 'SOP-OPERATIONS-01', visual_slot: 'morong', is_spine: false, order: 8, primary_skills: ['OmniCommunication', 'DisasterRecoveryKit'], name: 'Vận Hành & Tự Động Hóa', subtitle: 'Operations & Registry', grid: { x: 75, y: 51, w: 23, h: 44 }, accent: 'border-teal-500/30' },
  ],
  stations: [
    {
      seat_id: 'seat-agy',
      seat_type: 'FIXED',
      zone_id: 'sop_generic_7p',
      zone_name: 'Phòng Điều Hành 7P',
      coords: { x: 26, y: 55 },
      agent_id: 'agt-antigravity',
      itsaplan_agent_id: 101,
      username: '@antigravity',
      agent_name: 'Antigravity Agent',
      role: 'AOP Core & Swarm Engine',
      account_label: 'AGT-P1',
      status: 'ACTIVE',
      activity_bubble: 'Sẵn sàng điều phối và giải quyết công việc tự trị',
      active_contract_ids: ['CTR-2026-002'],
      capabilities: ['AOP', 'Swarm', 'AST-Diff'],
      active_project_keys: ['PM'],
      room_reason: 'Trực chỉ huy tại sảnh điều hành',
      doing_now: {
        summary: 'Biên soạn gói giao việc Open Office và điều phối Swarm đa dự án',
        current_step: 'Đồng bộ hóa trạng thái văn phòng với backend',
        step_index: 2,
        total_steps: 4,
        active_item: {
          issue_id: 500,
          sequence_number: 500,
          identifier: 'PM-500',
          project_key: 'PM',
          team_ref: 'thanb',
          title: 'OpenOffice Multi-Project Filter & 4-Tab Inspector',
          status: 'IN_PROGRESS',
        },
        recent_activities: ['Khai báo bộ lọc đa dự án toàn công ty'],
      },
      going_to_do_next: {
        next_steps: ['Kiểm tra cổng chất lượng GW-SOD-01 với QualityGate'],
        queued_items: [
          {
            issue_id: 501,
            sequence_number: 501,
            identifier: 'PM-501',
            project_key: 'PM',
            team_ref: 'thanb',
            title: 'Đóng gói bundle phát hành văn phòng số',
            status: 'QUEUED',
          },
        ],
        upcoming_schedules: [],
      },
      memory_digest: {
        completed_runs_total: 42,
        rework_count: 2,
        first_pass_pct: 95.2,
        lessons: [
          {
            lesson_id: 'les-01',
            contract_id: 'CTR-2026-001',
            run_number: 1,
            agent_id: 'agt-antigravity',
            project_key: 'PM',
            room_id: 'sop_generic_7p',
            feedback_reason: 'Thiếu kiểm tra context bên ngoài Shell',
            crystallized_rule: 'Luôn bọc useShell trong safe helper để tránh crash test',
            created_at: '2026-11-09T08:00:00Z',
          },
        ],
      },
    },
    {
      seat_id: 'seat-orch',
      seat_type: 'FIXED',
      zone_id: 'sop_generic_7p',
      zone_name: 'Phòng Điều Hành 7P',
      coords: { x: 50, y: 55 },
      agent_id: 'agt-orchestrator',
      itsaplan_agent_id: 103,
      username: '@orchestrator',
      agent_name: 'Orchestrator Agent',
      role: 'Portfolio & Wave Decomposition',
      account_label: 'AGT-ORCH',
      status: 'ACTIVE',
      activity_bubble: 'Phân rã sóng Kahn DAG',
      active_contract_ids: ['CTR-2026-001'],
      capabilities: ['KahnDAG', 'WavePlan'],
      active_project_keys: ['PM'],
    },
  ],
  mascots: [
    {
      id: 'mascot-cau-vang',
      name: 'Cậu Vàng',
      species: 'dog',
      zone_id: 'sop_generic_7p',
      coords: { x: 86, y: 20 },
      bubble: 'Gâu gâu! Văn phòng hôm nay năng suất tuyệt vời!',
    },
    {
      id: 'mascot-tieu-thu',
      name: 'Tiểu Thư',
      species: 'cat',
      zone_id: 'sop_coding_01',
      coords: { x: 62, y: 38 },
      bubble: 'Meo meo... Code sạch không một lỗi lint!',
    },
  ],
  contracts: [
    {
      id: 'CTR-2026-001',
      project_key: 'PM',
      team_ref: 'thanb',
      issue_id: 499,
      issue_identifier: 'PM-499',
      title: 'Nghiệm thu Cổng phê duyệt HITL & SoD',
      summary: 'Kiểm tra quy tắc GW-SOD-01',
      template_id: 'tpl-qa-gate',
      domain: 'GOV',
      lead_agent_id: 'agt-orchestrator',
      lead_agent_name: 'Orchestrator Agent',
      input_scope: 'Quy trình kiểm thử HITL',
      output_format: 'Báo cáo chữ ký số',
      acceptance_criteria: ['Tiêu chí 1: Đối soát SoD'],
      forbidden_actions: ['Không tự duyệt'],
      confidence_pct: 99,
      estimated_minutes: 15,
      estimated_tokens: 2500,
      actual_minutes: 12,
      actual_tokens: 2310,
      priority: 'URGENT',
      status: 'AWAITING_HITL',
      created_at: '2026-11-09T08:30:00Z',
      updated_at: '2026-11-09T09:10:00Z',
    },
  ],
  needs_my_action: [
    {
      id: 'CTR-2026-001',
      project_key: 'PM',
      title: 'Nghiệm thu Cổng phê duyệt HITL & SoD',
      domain: 'GOV',
      lead_agent_id: 'agt-orchestrator',
      status: 'AWAITING_HITL',
    },
  ],
  templates: [
    {
      id: 'tpl-code-feature',
      name: 'Phát triển tính năng (SOP-CODING-01)',
      domain: 'DEV',
      default_input_scope: 'Module frontend/backend có đặc tả UTOP',
      default_output_format: 'PR TypeScript/Python đạt 0 FAIL',
      default_acceptance_criteria: ['Đạt chuẩn Layer 0 Design tokens', '100% test case MinTC vượt qua'],
      default_forbidden_actions: ['Không chỉnh sửa ngoài write-set'],
      default_estimated_minutes: 30,
      default_estimated_tokens: 6000,
    },
  ],
  analytics: {
    total_contracts: 1,
    status_counts: { AWAITING_HITL: 1 },
    priority_counts: { URGENT: 1 },
    needs_my_action_count: 1,
    total_runs: 2,
    rework_run_count: 1,
    total_events: 5,
    event_type_counts: { CONTRACT_CREATED: 1, REVIEW_REQUESTED: 1 },
    agent_workload: { 'Orchestrator Agent': 1 },
    domain_progress: { GOV: 100 },
    recent_events: [
      {
        event_id: 'ev_test_1',
        contract_id: 'CTR-2026-001',
        event_type: 'EVIDENCE_SUBMITTED',
        actor_id: 'agt-orchestrator',
        sha256_hash: '9a72dfb14ec0e2418e95088bd3708bf6ef9d7c4a161492b451c048bcde824b2a',
        timestamp: '2026-11-09T09:10:00Z',
      },
    ],
    event_log_reconciled: true,
  },
};

const MOCK_DETAIL = {
  contract: MOCK_STATE.contracts[0],
  runs: [
    {
      run_id: 'run-01',
      contract_id: 'CTR-2026-001',
      run_number: 1,
      status: 'RETURNED_FOR_REWORK',
      actor_id: 'agt-orchestrator',
      actor_name: 'Orchestrator Agent',
      evidence_summary: 'Bản nộp đợt 1',
      return_reason: 'Thiếu kiểm thử biên cho Layer 0',
      created_at: '2026-11-09T08:35:00Z',
    },
    {
      run_id: 'run-02',
      contract_id: 'CTR-2026-001',
      run_number: 2,
      status: 'SUCCESS',
      actor_id: 'agt-orchestrator',
      actor_name: 'Orchestrator Agent',
      evidence_summary: 'Bản nộp đợt 2 bổ sung test case đầy đủ',
      created_at: '2026-11-09T08:50:00Z',
    },
  ],
  events: [
    {
      event_id: 'ev-01',
      contract_id: 'CTR-2026-001',
      event_type: 'CONTRACT_CREATED',
      actor_id: 'hum-phuong-vo',
      sha256_hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
      timestamp: '2026-11-09T08:30:00Z',
    },
  ],
  is_chain_valid: true,
  committed_vs_actual: {
    estimated_minutes: 15,
    actual_minutes: 12,
    delta_minutes: -3,
    estimated_tokens: 2500,
    actual_tokens: 2310,
    delta_tokens: -190,
    confidence_pct: 99,
  },
};

type FetchCallBody = {
  agent_id?: string;
  auto_draft_criteria?: boolean;
  acceptance_criteria?: unknown[];
  decision?: string;
  acceptance_verified?: boolean;
  support_agent_ids?: string[];
  contract_id?: string;
  approver_id?: unknown;
  name?: string;
  assignments?: Record<string, { positionId?: string }>;
  [key: string]: unknown;
};

let dom: JSDOM;
let root: Root;
let originalGlobals: Map<string, PropertyDescriptor | undefined>;
let fetchCalls: Array<{ url: string; method: string; body?: FetchCallBody }> = [];

const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));

beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>', {
    url: 'https://itsaplan.test',
    pretendToBeVisual: true,
  });
  const htmlElemProto = dom.window.HTMLElement.prototype as unknown as {
    attachEvent?: () => void;
    detachEvent?: () => void;
  };
  htmlElemProto.attachEvent ??= () => {};
  htmlElemProto.detachEvent ??= () => {};

  const globals = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    Node: dom.window.Node,
    Element: dom.window.Element,
    HTMLElement: dom.window.HTMLElement,
    HTMLInputElement: dom.window.HTMLInputElement,
    HTMLSelectElement: dom.window.HTMLSelectElement,
    HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
    HTMLButtonElement: dom.window.HTMLButtonElement,
    Event: dom.window.Event,
    InputEvent: dom.window.InputEvent,
    MouseEvent: dom.window.MouseEvent,
    KeyboardEvent: dom.window.KeyboardEvent,
    CustomEvent: dom.window.CustomEvent,
    IS_REACT_ACT_ENVIRONMENT: true,
  };

  originalGlobals = new Map(
    Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );

  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }

  fetchCalls = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method || 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    fetchCalls.push({ url, method, body });

    if (url.includes('/api/vibe/open-office/state')) {
      return new Response(JSON.stringify(MOCK_STATE), { status: 200 });
    }
    if (url.includes('/api/vibe/open-office/governance')) {
      return new Response(JSON.stringify(method === 'POST' ? { ok: true } : {}), { status: 200 });
    }
    if (url.includes('/api/vibe/open-office/dept-positions') && method === 'POST') {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (url.includes('/api/vibe/open-office/seat-assignments') && method === 'POST') {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (url.includes('/api/vibe/open-office/contracts') && method === 'POST') {
      const createdContract = {
        ...MOCK_STATE.contracts[0],
        id: 'CTR-POST-NEW-01',
        title: body?.title || 'Hợp đồng mới được tạo',
        status: 'IN_PROGRESS',
      };
      return new Response(
        JSON.stringify({
          contract: createdContract,
          runs: [],
          events: [],
          is_chain_valid: true,
          committed_vs_actual: {
            estimated_minutes: 30,
            actual_minutes: 0,
            delta_minutes: -30,
            estimated_tokens: 5000,
            actual_tokens: 0,
            delta_tokens: -5000,
            confidence_pct: 95,
          },
        }),
        { status: 200 },
      );
    }
    if (url.includes('/api/vibe/open-office/contract')) {
      return new Response(JSON.stringify(MOCK_DETAIL), { status: 200 });
    }
    if (url.includes('/api/vibe/open-office/steer') && method === 'POST') {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (url.includes('/api/vibe/open-office/review') && method === 'POST') {
      const reviewedContract = {
        ...MOCK_STATE.contracts[0],
        status: body?.decision === 'APPROVE' ? 'DONE' : 'RETURNED_FOR_REWORK',
      };
      return new Response(
        JSON.stringify({
          ...MOCK_DETAIL,
          contract: reviewedContract,
        }),
        { status: 200 },
      );
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as typeof fetch;

  const container = dom.window.document.getElementById('root')!;
  root = createRoot(container);
});

afterEach(async () => {
  if (root) {
    await act(async () => {
      root.unmount();
    });
  }
  if (dom) {
    dom.window.close();
  }
  for (const [key, descriptor] of originalGlobals.entries()) {
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor);
    } else {
      Reflect.deleteProperty(globalThis, key);
    }
  }
});

describe('OpenOfficeWorkspaceView (ACCORD v3.3.0 / UC-010..UC-018)', () => {
  it('renders the 8 Open Office zones and mascots safely outside ShellCtx', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');

    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    // Verify all 8 canonical SOP zones are rendered in DOM
    const canonicalZoneIds = [
      'sop_sec_audit_01',
      'sop_strategy_01',
      'sop_coding_01',
      'sop_generic_7p',
      'sop_research_01',
      'sop_analytics_01',
      'sop_legal_01',
      'sop_operations_01',
    ];
    for (const zId of canonicalZoneIds) {
      const zoneEl = dom.window.document.querySelector(`[data-testid="zone-${zId}"]`);
      assert.ok(zoneEl, `Zone ${zId} must be rendered`);
    }

    // Verify Mascots Cậu Vàng and Tiểu Thư
    const mascotDog = dom.window.document.querySelector('[data-testid="mascot-mascot-cau-vang"]');
    const mascotCat = dom.window.document.querySelector('[data-testid="mascot-mascot-tieu-thu"]');
    assert.ok(mascotDog, 'Mascot Cậu Vàng must be rendered');
    assert.ok(mascotCat, 'Mascot Tiểu Thư must be rendered');
    assert.match(mascotDog.textContent || '', /Cậu Vàng/);
    assert.match(mascotCat.textContent || '', /Tiểu Thư/);
  });

  it('filters by project and displays per-agent [PROJECT_KEY] badges', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');

    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const selectFilter = dom.window.document.querySelector<HTMLSelectElement>(
      '[data-testid="select-open-office-project-filter"]',
    );
    assert.ok(selectFilter, 'Project filter selector must exist in floorplan toolbar');
    assert.ok(selectFilter.options.length >= 2, 'Should list ALL and project options');

    // Change filter to PM
    await act(async () => {
      selectFilter.value = 'PM';
      selectFilter.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
    await settle();

    // Verify fetch was dispatched with project_key query
    const stateCall = fetchCalls.find(
      (c) => c.url.includes('/api/vibe/open-office/state') && c.url.includes('project_key=PM'),
    );
    assert.ok(stateCall, 'State should be requested with project_key=PM');

    // Verify [PM] project badge on inspected agent
    const badgePM = dom.window.document.querySelector('[data-testid="badge-agent-project-PM"]');
    assert.ok(badgePM, 'Agent should display [PM] badge');
  });

  it('inspects Agent with 4 progressive tabs (Now, Next, Memory, Modules) and quick steer', async () => {
    let openedIssueId: number | null = null;
    let chattedAgentId: number | null = null;

    const mockShell: ShellContext = {
      project: { id: 1, team_ref: 'thanb', key: 'PM', name: 'Quản trị Dự án Toàn năng' } as unknown as ShellContext['project'],
      filteredProject: null,
      views: [],
      editor: {} as unknown as ShellContext['editor'],
      customFields: [],
      onOpenIssue: (id: number) => {
        openedIssueId = id;
      },
      onAddIssue: () => {},
      onChatWithAgent: (agentId: number) => {
        chattedAgentId = agentId;
      },
      onOpenWeKnoraChat: () => {},
    };

    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');

    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <ShellCtx.Provider value={mockShell}>
            <OpenOfficeWorkspaceView apiBaseUrl="" />
          </ShellCtx.Provider>
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    // Verify Agent Live Inspector is visible
    const inspector = dom.window.document.querySelector('[data-testid="agent-live-inspector"]');
    assert.ok(inspector, 'Agent Live Inspector must be rendered');

    // TAB 1: Now - Check active work item & Quick Steer
    const tabNow = dom.window.document.querySelector<HTMLButtonElement>('[data-testid="inspector-tab-now"]');
    assert.ok(tabNow, 'Tab Now must exist');

    const linkIssue = dom.window.document.querySelector<HTMLElement>('[data-testid="link-active-issue"]');
    assert.ok(linkIssue, 'Active work item link must exist in Tab Now');
    await act(async () => {
      linkIssue.click();
    });
    assert.equal(openedIssueId, 500, 'Clicking active work item should call shellCtx.onOpenIssue');

    // Quick Steer message dispatch
    const steerInput = dom.window.document.querySelector<HTMLInputElement>(
      '[data-testid="input-agent-quick-steer"]',
    );
    const steerBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-agent-quick-steer"]',
    );
    assert.ok(steerInput, 'Quick steer input must exist');
    assert.ok(steerBtn, 'Quick steer button must exist');

    await act(async () => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        dom.window.HTMLInputElement.prototype,
        'value',
      )?.set;
      nativeSetter?.call(steerInput, 'Ưu tiên tối ưu hóa bundle');
      steerInput.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      steerInput.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
    await act(async () => {
      steerBtn.click();
    });
    await settle();

    const steerCall = fetchCalls.find((c) => c.url.includes('/api/vibe/open-office/steer'));
    assert.ok(steerCall, 'POST /api/vibe/open-office/steer must be called');
    assert.equal(steerCall.body?.agent_id, 'agt-antigravity');

    // TAB 2: Next
    const tabNext = dom.window.document.querySelector<HTMLButtonElement>('[data-testid="inspector-tab-next"]');
    assert.ok(tabNext, 'Tab Next must exist');
    await act(async () => {
      tabNext.click();
    });
    await settle();
    const btnAssignMore = dom.window.document.querySelector('[data-testid="btn-assign-to-agent"]');
    assert.ok(btnAssignMore, 'Button assign more to agent must exist in Tab Next');

    // TAB 3: Memory
    const tabMemory = dom.window.document.querySelector<HTMLButtonElement>('[data-testid="inspector-tab-memory"]');
    assert.ok(tabMemory, 'Tab Memory must exist');
    await act(async () => {
      tabMemory.click();
    });
    await settle();
    assert.match(dom.window.document.body.textContent || '', /Fix mõm/);

    // TAB 4: Modules
    const tabModules = dom.window.document.querySelector<HTMLButtonElement>('[data-testid="inspector-tab-modules"]');
    assert.ok(tabModules, 'Tab Modules must exist');
    await act(async () => {
      tabModules.click();
    });
    await settle();

    const btnAgentChat = dom.window.document.querySelector<HTMLButtonElement>('[data-testid="portal-agent-chat"]');
    assert.ok(btnAgentChat, 'Portal Agent Chat button must exist');
    await act(async () => {
      btnAgentChat.click();
    });
    assert.equal(chattedAgentId, 101, 'Portal agent chat should call shellCtx.onChatWithAgent');
  });

  it('inspects Department UC-011..UC-018 Dossier & Cross-Module Portals', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');

    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    // Click Department Quick Pill for exec_hq
    const pillExec = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="dept-pill-sop_generic_7p"]',
    );
    assert.ok(pillExec, 'Department pill for sop_generic_7p must exist');
    await act(async () => {
      pillExec.click();
    });
    await settle();

    // Verify Department Live Inspector is visible
    const deptInspector = dom.window.document.querySelector('[data-testid="department-live-inspector"]');
    assert.ok(deptInspector, 'Department Live Inspector must be rendered');
    assert.match(deptInspector.textContent || '', /SOP-GENERIC-7P/);
    assert.match(deptInspector.textContent || '', /Điều Hành 7P/);

    // Primary CTA button
    const primaryCta = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-dept-primary-cta"]',
    );
    assert.ok(primaryCta, 'Department Primary CTA button must exist');
    await act(async () => {
      primaryCta.click();
    });
    await settle();
  });

  it('handles 1-Card Task Delegation with Auto-Draft & backward compatibility', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');

    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    // Title input
    const titleInput = dom.window.document.querySelector<HTMLInputElement>(
      '[data-testid="input-contract-title"]',
    );
    assert.ok(titleInput, 'Contract title input must exist in 1-Card view');

    // Compatibility next buttons
    const btnNext1 = dom.window.document.querySelector<HTMLButtonElement>('[data-testid="btn-step1-next"]');
    const btnNext2 = dom.window.document.querySelector<HTMLButtonElement>('[data-testid="btn-step2-next"]');
    assert.ok(btnNext1, 'btn-step1-next must exist for backward compatibility');
    assert.ok(btnNext2, 'btn-step2-next must exist for backward compatibility');

    // Submit contract CTA
    const btnSubmit = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-submit-open-office-contract"]',
    );
    assert.ok(btnSubmit, 'Submit contract button must exist');
    await act(async () => {
      btnSubmit.click();
    });
    await settle();

    // Verify POST dispatch with auto_draft_criteria
    const postCall = fetchCalls.find(
      (c) => c.url.includes('/api/vibe/open-office/contracts') && c.method === 'POST',
    );
    assert.ok(postCall, 'POST /api/vibe/open-office/contracts must be called');
    assert.equal(postCall.body?.auto_draft_criteria, true);
    assert.ok((postCall.body?.acceptance_criteria?.length ?? 0) >= 1);
  });

  it('displays Needs-My-Action strip, TaskRun rework lineage, and submits review', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');

    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    // Switch to Contracts Tab
    const contractsTab = dom.window.document.querySelector<HTMLElement>(
      '[data-testid="tab-open-office-contracts"]',
    );
    await act(async () => {
      contractsTab?.click();
    });
    await settle();

    // Verify "Hộp Cần tôi xử lý" (Needs My Action) queue strip
    const needsStrip = dom.window.document.querySelector(
      '[data-testid="needs-my-action-strip"]',
    );
    assert.ok(needsStrip, 'Needs My Action strip must be visible');
    assert.match(needsStrip.textContent || '', /Hộp Cần tôi xử lý/);

    // Verify TaskRun Rework Lineage in Inspector
    const reworkText = dom.window.document.body.textContent || '';
    assert.match(reworkText, /Lượt chạy #1/);
    assert.match(reworkText, /Thiếu kiểm thử biên cho Layer 0/);

    // In AWAITING_HITL review panel, test approval guard (acceptance_verified required)
    const checkVerified = dom.window.document.querySelector<HTMLInputElement>(
      '[data-testid="checkbox-acceptance-verified"]',
    );
    const btnApprove = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-approve-review"]',
    );
    assert.ok(checkVerified, 'Checkbox acceptance verified must exist');
    assert.ok(btnApprove, 'Approve review button must exist');
    assert.equal(btnApprove.disabled, true, 'Approve must be disabled until verified checkbox is checked');

    // Click checkbox to toggle
    await act(async () => {
      checkVerified.click();
    });
    await settle();
    assert.equal(btnApprove.disabled, false, 'Approve must be enabled once verified is checked');

    // Click Approve
    await act(async () => {
      btnApprove.click();
    });
    await settle();

    // Verify POST /api/vibe/open-office/review call
    const reviewCall = fetchCalls.find(
      (c) => c.url.includes('/api/vibe/open-office/review') && c.method === 'POST',
    );
    assert.ok(reviewCall, 'POST /api/vibe/open-office/review must be called');
    assert.equal(reviewCall.body?.decision, 'APPROVE');
    assert.equal(reviewCall.body?.acceptance_verified, true);
  });

  it('renders Gather.town Chrome: Bottom ActionBar, Simplified Radar toggle, MiniMap & People Sidebar', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');

    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const actionBar = dom.window.document.querySelector('[data-testid="gather-bottom-action-bar"]');
    assert.ok(actionBar, 'Gather floating bottom ActionBar dock must exist');

    const minimap = dom.window.document.querySelector('[data-testid="gather-minimap-overlay"]');
    assert.ok(minimap, 'Gather live corner MiniMap must exist by default');

    const peopleSidebar = dom.window.document.querySelector('[data-testid="gather-people-sidebar"]');
    assert.ok(peopleSidebar, 'Gather collapsible People & Spaces sidebar must exist');

    assert.equal(
      dom.window.document.querySelector('[data-testid="gather-view-mode-toggle"]'),
      null,
      'Chế độ Radar toggle must not be rendered',
    );
    assert.equal(
      dom.window.document.querySelector('[data-testid="gather-simplified-radar"]'),
      null,
      'Simplified Radar stage must not be rendered',
    );
  });

  it('blocks fake DONE status and renders open-office-error-banner on GW-SOD-01 HTTP 403 rejection (53.ACT.504)', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      fetchCalls.push({ url, method, body });
      if (url.includes('/api/vibe/open-office/state')) {
        return new Response(JSON.stringify(MOCK_STATE), { status: 200 });
      }
      if (url.includes('/api/vibe/open-office/contract') && method === 'GET') {
        return new Response(JSON.stringify(MOCK_DETAIL), { status: 200 });
      }
      if (url.includes('/api/vibe/open-office/review') && method === 'POST') {
        return new Response(
          JSON.stringify({
            error: 'GW-SOD-01 Violation: approver_id cannot equal lead_agent_id',
          }),
          { status: 403 },
        );
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const contractsTab = dom.window.document.querySelector<HTMLElement>(
      '[data-testid="tab-open-office-contracts"]',
    );
    await act(async () => {
      contractsTab?.click();
    });
    await settle();

    const checkVerified = dom.window.document.querySelector<HTMLInputElement>(
      '[data-testid="checkbox-acceptance-verified"]',
    );
    const btnApprove = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-approve-review"]',
    );
    assert.ok(checkVerified && btnApprove);

    await act(async () => {
      checkVerified.click();
    });
    await settle();

    await act(async () => {
      btnApprove.click();
    });
    await settle();

    const errorBanner = dom.window.document.querySelector('[data-testid="open-office-error-banner"]');
    assert.ok(errorBanner, 'HTTP 403 SoD violation MUST render open-office-error-banner');
    assert.match(errorBanner.textContent || '', /GW-SOD-01 Violation/);

    // Ensure contract CTR-2026-001 is still AWAITING_HITL and NOT fake DONE
    const checkStillPresent = dom.window.document.querySelector(
      '[data-testid="checkbox-acceptance-verified"]',
    );
    assert.ok(
      checkStillPresent,
      'Rejected review must keep contract in AWAITING_HITL instead of optimistically setting DONE',
    );
  });

  it('normalizes nested backend analytics dicts with zero NaN strings (53.ACT.504)', async () => {
    const nestedBackendState = {
      ...MOCK_STATE,
      analytics: {
        total_contracts: 4,
        total_events: 12,
        event_log_reconciled: true,
        status_counts: { IN_PROGRESS: 2, AWAITING_HITL: 1, DONE: 1 },
        priority_counts: { HIGH: 3, MEDIUM: 1 },
        agent_workload: {
          '@antigravity': { total: 3, done: 1, active: 2 },
          '@research': { total: 1, done: 0, active: 1 },
        },
        domain_progress: {
          Engineering: { total: 3, done: 1, completion_pct: 33.3 },
          Research: { total: 1, done: 0, completion_pct: 0 },
        },
      },
    };
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/vibe/open-office/state')) {
        return new Response(JSON.stringify(nestedBackendState), { status: 200 });
      }
      if (url.includes('/api/vibe/open-office/contract')) {
        return new Response(JSON.stringify(MOCK_DETAIL), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const analyticsTab = dom.window.document.querySelector<HTMLElement>(
      '[data-testid="tab-open-office-analytics"]',
    );
    await act(async () => {
      analyticsTab?.click();
    });
    await settle();

    const fullText = dom.window.document.body.textContent || '';
    assert.ok(!fullText.includes('NaN'), `Analytics view must never render NaN, got: ${fullText}`);
    assert.match(fullText, /33\.3%/, 'Should render nested completion_pct 33.3%');
    assert.match(fullText, /3 hợp đồng/, 'Should render nested agent workload total 3 hợp đồng');
  });

  it('supports toggling support_agent_ids, preserves zero memory counters, and strictly isolates project filters (53.ACT.504)', async () => {
    const multiAgentState = {
      ...MOCK_STATE,
      stations: [
        {
          ...MOCK_STATE.stations[0],
          seat_id: 'seat-agy',
          agent_id: 'agt-antigravity',
          agent_name: 'Antigravity Agent',
          active_project_keys: ['PM'],
          queued_project_keys: [],
          active_contract_ids: ['CTR-PM-ACTIVE'],
          memory_digest: {
            completed_runs_total: 0,
            rework_count: 0,
            first_pass_pct: 0,
            lessons: [],
          },
        },
        {
          ...MOCK_STATE.stations[0],
          seat_id: 'seat-res',
          agent_id: 'agt-research',
          username: '@research',
          agent_name: 'Research Agent',
          active_project_keys: ['MHR'],
          queued_project_keys: ['MHR'],
          active_contract_ids: [],
          memory_digest: {
            completed_runs_total: 5,
            rework_count: 0,
            first_pass_pct: 100,
            lessons: [],
          },
        },
      ],
    };

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      fetchCalls.push({ url, method, body });
      if (url.includes('/api/vibe/open-office/state')) {
        return new Response(JSON.stringify(multiAgentState), { status: 200 });
      }
      if (url.includes('/api/vibe/open-office/contracts') && method === 'POST') {
        return new Response(
          JSON.stringify({
            ...MOCK_DETAIL,
            contract: { ...MOCK_STATE.contracts[0], id: 'CTR-MULTI-01', status: 'IN_PROGRESS' },
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify(MOCK_DETAIL), { status: 200 });
    }) as typeof fetch;

    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    // 1. Check Memory tab renders 0 instead of falsy || 24 / 1 / 96
    const memoryTab = dom.window.document.querySelector<HTMLElement>(
      '[data-testid="inspector-tab-memory"]',
    );
    await act(async () => {
      memoryTab?.click();
    });
    await settle();
    const inspectorEl = dom.window.document.querySelector('[data-testid="agent-live-inspector"]');
    const inspectorText = inspectorEl?.textContent || '';
    assert.ok(
      !inspectorText.includes('24') && !inspectorText.includes('96%'),
      `Zero memory counters must not fall back to 24 or 96%, got: ${inspectorText}`,
    );

    // 2. Toggle support agent Research Agent via data-testid="btn-toggle-support-agt-research"
    const btnSupport = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-toggle-support-agt-research"]',
    );
    assert.ok(btnSupport, 'Support agent toggle button btn-toggle-support-agt-research must exist');
    await act(async () => {
      btnSupport.click();
    });
    await settle();

    const btnSubmit = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-submit-open-office-contract"]',
    );
    await act(async () => {
      btnSubmit?.click();
    });
    await settle();

    const postCall = fetchCalls.find(
      (c) => c.url.includes('/api/vibe/open-office/contracts') && c.method === 'POST',
    );
    assert.ok(postCall, 'POST /api/vibe/open-office/contracts must be called');
    assert.deepEqual(postCall.body?.support_agent_ids, ['agt-research']);

    // 3. Filter by project MHR and ensure PM-only Antigravity station is NOT leaked via active_contract_ids
    const selectFilter = dom.window.document.querySelector<HTMLSelectElement>(
      '[data-testid="select-open-office-project-filter"]',
    );
    await act(async () => {
      if (selectFilter) {
        selectFilter.value = 'MHR';
        selectFilter.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      }
    });
    await settle();

    const leakedPmStation = dom.window.document.querySelector('[data-testid="station-seat-agy"]');
    const validMhrStation = dom.window.document.querySelector('[data-testid="station-seat-res"]');
    assert.equal(leakedPmStation, null, 'PM-only agent must not leak into MHR filter via active_contract_ids');
    assert.ok(validMhrStation, 'MHR agent station must remain visible when MHR project is selected');
  });

  it('switches across Tri-Lens Command Cockpit (Blueprint, Fleet Matrix, Causal Swarm DAG) with verified contract edges (Option C)', async () => {
    const triLensState = {
      ...MOCK_STATE,
      contracts: [
        {
          ...MOCK_STATE.contracts[0],
          id: 'CTR-SWARM-01',
          title: 'Tri-Lens Sovereign Architecture Upgrade',
          project_key: 'PM',
          lead_agent_id: 'agt-antigravity',
          support_agent_ids: ['agt-codex'],
          status: 'IN_PROGRESS',
        },
        ...MOCK_STATE.needs_my_action,
      ],
      stations: [
        ...MOCK_STATE.stations,
        {
          ...MOCK_STATE.stations[0],
          seat_id: 'seat-codex',
          agent_id: 'agt-codex',
          username: '@codex',
          agent_name: 'Codex Agent',
          zone_id: 'sop_coding_01',
          status: 'WORKING',
          active_project_keys: ['PM'],
          active_contract_ids: ['CTR-SWARM-01'],
        },
        {
          ...MOCK_STATE.stations[1],
          seat_id: 'seat-solo-idle',
          agent_id: 'agt-solo',
          username: '@solo',
          agent_name: 'Solo Idle Agent',
          zone_id: 'sop_generic_7p',
          status: 'IDLE',
          active_project_keys: ['MHR'],
          active_contract_ids: [],
        },
      ],
    };

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/vibe/open-office/state')) {
        return new Response(JSON.stringify(triLensState), { status: 200 });
      }
      return new Response(JSON.stringify(MOCK_DETAIL), { status: 200 });
    }) as typeof fetch;

    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const lensSwitcher = dom.window.document.querySelector('[data-testid="lens-switcher"]');
    assert.ok(lensSwitcher, 'Tri-Lens switcher must be mounted in cockpit header');
    assert.ok(
      dom.window.document.querySelector('[data-testid="open-office-blueprint-lens"]'),
      'Architectural Blueprint lens must be the default active spatial lens',
    );

    // Switch to Lens 2: Fleet Matrix
    const btnFleet = dom.window.document.querySelector<HTMLButtonElement>('[data-testid="btn-lens-fleet"]');
    assert.ok(btnFleet, 'Fleet Matrix lens trigger must exist');
    await act(async () => {
      btnFleet.click();
    });
    await settle();

    const fleetMatrix = dom.window.document.querySelector('[data-testid="open-office-fleet-matrix"]');
    assert.ok(fleetMatrix, 'Fleet Matrix lens must render high-density swimlanes');
    assert.ok(
      fleetMatrix.textContent?.includes('Antigravity Agent') &&
        fleetMatrix.textContent?.includes('Codex Agent'),
      'Fleet Matrix must surface active agents across projects',
    );

    // Switch to Lens 3: Causal Swarm & Contract DAG
    const btnSwarm = dom.window.document.querySelector<HTMLButtonElement>('[data-testid="btn-lens-swarm"]');
    assert.ok(btnSwarm, 'Causal Swarm DAG lens trigger must exist');
    await act(async () => {
      btnSwarm.click();
    });
    await settle();

    const causalDag = dom.window.document.querySelector('[data-testid="open-office-causal-dag"]');
    assert.ok(causalDag, 'Causal Swarm DAG lens must mount');
    const verifiedEdge = dom.window.document.querySelector(
      '[data-testid="dag-edge-CTR-SWARM-01-agt-codex"]',
    );
    const fakeSoloEdge = dom.window.document.querySelector(
      '[data-testid="dag-edge-CTR-SWARM-01-agt-solo"]',
    );
    assert.ok(verifiedEdge, 'Verified lead -> support contract edge must render');
    assert.equal(fakeSoloEdge, null, 'Unrelated solo idle station must NOT receive fake star-topology edge');
  });

  it('scales to 12 concurrent stations in a single room with zero coordinate collisions (Option C)', async () => {
    const crowdedStations = Array.from({ length: 12 }, (_, idx) => ({
      ...MOCK_STATE.stations[0],
      seat_id: `seat-crowd-${idx + 1}`,
      agent_id: `agt-crowd-${idx + 1}`,
      username: `@agent${idx + 1}`,
      agent_name: `Agent Unit ${idx + 1}`,
      zone_id: 'sop_coding_01',
      status: idx % 3 === 0 ? ('WORKING' as const) : ('IDLE' as const),
      active_project_keys: ['PM'],
    }));

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/vibe/open-office/state')) {
        return new Response(
          JSON.stringify({ ...MOCK_STATE, active_agent_count: 12, stations: crowdedStations }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify(MOCK_DETAIL), { status: 200 });
    }) as typeof fetch;

    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const blueprintCards = dom.window.document.querySelectorAll('[data-testid^="station-seat-crowd-"]');
    assert.equal(blueprintCards.length, 12, 'All 12 concurrent room stations must render without truncation');

    // Toggle to classic 16-bit Pixel sub-mode and verify 12 distinct non-stacked anchor coordinates
    const btnPixelSubmode = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-blueprint-submode-pixel"]',
    );
    assert.ok(btnPixelSubmode, 'Pixel sub-mode toggle must remain available for Gather compatibility');
    await act(async () => {
      btnPixelSubmode.click();
    });
    await settle();

    const pixelNodes = Array.from(
      dom.window.document.querySelectorAll<HTMLElement>('[data-testid^="station-seat-crowd-"]'),
    );
    assert.equal(pixelNodes.length, 12);
    const coordSet = new Set(
      pixelNodes.map((el) => `${el.style.left || el.dataset.gridSlot}|${el.style.top || ''}`),
    );
    assert.equal(
      coordSet.size,
      12,
      `Expected 12 unique room coordinates without sprite stacking, got ${coordSet.size}`,
    );
  });

  it('submits inline session-bound GW-SOD-01 HITL review from cockpit header in <= 2 clicks (Option C)', async () => {
    const fetchCalls: Array<{ url: string; method: string; body?: FetchCallBody }> = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      fetchCalls.push({ url, method, body });
      if (url.includes('/api/vibe/open-office/state')) {
        return new Response(JSON.stringify(MOCK_STATE), { status: 200 });
      }
      if (url.includes('/api/vibe/open-office/review') && method === 'POST') {
        return new Response(
          JSON.stringify({
            ...MOCK_DETAIL,
            contract: { ...MOCK_DETAIL.contract, status: 'DONE' },
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify(MOCK_DETAIL), { status: 200 });
    }) as typeof fetch;

    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const hitlHeaderPill = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-header-hitl-pill"]',
    );
    assert.ok(hitlHeaderPill, 'Cockpit header must surface 1-click HITL review pill when needs_my_action > 0');
    await act(async () => {
      hitlHeaderPill.click();
    });
    await settle();

    const quickDrawer = dom.window.document.querySelector('[data-testid="sovereign-hitl-quick-drawer"]');
    assert.ok(quickDrawer, 'Inline Sovereign HITL Quick Drawer must open without leaving spatial cockpit');
    assert.ok(quickDrawer.textContent?.includes('CTR-2026-001'), 'Quick Drawer must display pending HITL contract');

    const btnQuickApprove = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-quick-hitl-approve"]',
    );
    const chkQuickVerify = dom.window.document.querySelector<HTMLInputElement>(
      '[data-testid="checkbox-quick-hitl-verified"]',
    );
    assert.ok(btnQuickApprove && chkQuickVerify, 'Quick HITL verification controls must exist');
    assert.equal(btnQuickApprove.disabled, true, 'Approve must be fail-closed until acceptance checkbox is checked');

    await act(async () => {
      chkQuickVerify.click();
    });
    await settle();
    assert.equal(btnQuickApprove.disabled, false);

    await act(async () => {
      btnQuickApprove.click();
    });
    await settle();

    const reviewPost = fetchCalls.find(
      (c) => c.url.includes('/api/vibe/open-office/review') && c.method === 'POST',
    );
    assert.ok(reviewPost, 'Inline Quick Drawer must dispatch POST /api/vibe/open-office/review');
    assert.equal(reviewPost.body?.contract_id, 'CTR-2026-001');
    assert.equal(reviewPost.body?.decision, 'APPROVE');
    assert.equal(reviewPost.body?.acceptance_verified, true);
    assert.ok(
      typeof reviewPost.body?.approver_id === 'string' && reviewPost.body.approver_id.length > 0,
      'Session-bound approver_id must be auto-populated without manual input',
    );
  });

  it('enforces zero Goodhart waivers (data-allow-truncate / data-allow-overlap) and zero sr-only interactive traps (Option C)', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const truncateWaivers = dom.window.document.querySelectorAll('[data-allow-truncate]');
    const overlapWaivers = dom.window.document.querySelectorAll('[data-allow-overlap]');
    const srOnlyInteractiveTraps = dom.window.document.querySelectorAll(
      '.sr-only button, .sr-only input, .sr-only select, .sr-only textarea',
    );

    assert.equal(
      truncateWaivers.length,
      0,
      `Expected 0 data-allow-truncate waivers, found ${truncateWaivers.length}`,
    );
    assert.equal(
      overlapWaivers.length,
      0,
      `Expected 0 data-allow-overlap waivers, found ${overlapWaivers.length}`,
    );
    assert.equal(
      srOnlyInteractiveTraps.length,
      0,
      `Expected 0 sr-only interactive focus traps, found ${srOnlyInteractiveTraps.length}`,
    );
  });

  it('declutters bottom Gather bar by collapsing secondary nostalgia toggles behind stage-options trigger while preserving Gather test contracts', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const actionBar = dom.window.document.querySelector('[data-testid="gather-bottom-action-bar"]');
    assert.ok(actionBar, 'Bottom bar must still exist');
    assert.ok(
      !actionBar.textContent?.includes('Tâm điểm phòng') &&
        !actionBar.textContent?.includes('Bản đồ thu nhỏ') &&
        !actionBar.textContent?.includes('Thú cưng'),
      'Secondary nostalgia toggles must be collapsed by default (and Tâm điểm phòng removed)',
    );

    const toggleStageOptions = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-toggle-stage-options"]',
    );
    assert.ok(toggleStageOptions, 'Compact stage-options trigger must exist');

    await act(async () => {
      toggleStageOptions.click();
    });
    await settle();

    assert.ok(
      !actionBar.textContent?.includes('Tâm điểm phòng') &&
        actionBar.textContent?.includes('Bản đồ thu nhỏ') &&
        actionBar.textContent?.includes('Thú cưng'),
      'Secondary stage controls must expand cleanly on demand without Tâm điểm phòng',
    );
  });

  it('manages Company Policy, 8 Departments (UC-011..UC-018), Roles, and Authorization Matrix from unified Governance tab', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const govTab = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="tab-open-office-governance"]',
    );
    assert.ok(govTab, 'Top bar must expose unified Org & Governance tab');

    await act(async () => {
      govTab.click();
    });
    await settle();

    const govPanel = dom.window.document.querySelector('[data-testid="open-office-governance-panel"]');
    assert.ok(govPanel, 'Unified Governance Hub panel must render');
    assert.ok(
      dom.window.document.querySelector('[data-testid="gov-company-policy-card"]'),
      'Company & Constitutional Autonomy Policy card must render',
    );
    assert.ok(
      dom.window.document.querySelector('[data-testid="gov-departments-editor"]'),
      '8-Department UC-011..UC-018 live editor must render',
    );
    assert.ok(
      dom.window.document.querySelector('[data-testid="gov-roles-roster"]'),
      'HUM / DET / AGT unified roles roster must render',
    );
    const matrixEl = dom.window.document.querySelector('[data-testid="gov-authorization-matrix"]');
    assert.ok(matrixEl, '24-Resource x CRUD + Constitutional Gate Authorization Matrix must render');
    assert.ok(matrixEl.textContent?.includes('GW-SOD-01'), 'Matrix must surface GW-SOD-01 constitutional rule');

    // Edit Phòng Điều Hành (exec_hq) live and persist
    const deptSelectBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-gov-select-dept-sop_generic_7p"]',
    );
    assert.ok(deptSelectBtn, 'Department selector for sop_generic_7p must exist');
    await act(async () => {
      deptSelectBtn.click();
    });
    await settle();

    const nameInput = dom.window.document.querySelector<HTMLInputElement>(
      '[data-testid="input-gov-dept-name"]',
    );
    const missionInput = dom.window.document.querySelector<HTMLInputElement>(
      '[data-testid="input-gov-dept-mission"]',
    );
    const saveDeptBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-save-gov-department"]',
    );
    assert.ok(nameInput && missionInput && saveDeptBtn, 'Department live editor inputs & save button must exist');

    await act(async () => {
      const nativeValueSetter = Object.getOwnPropertyDescriptor(
        dom.window.HTMLInputElement.prototype,
        'value',
      )?.set;
      nativeValueSetter?.call(nameInput, 'Phòng Điều Hành Chủ Quyền');
      nameInput.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      nativeValueSetter?.call(missionInput, 'Điều hành OKR & SoD tức thời');
      missionInput.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
    await settle();

    await act(async () => {
      saveDeptBtn.click();
    });
    await settle();

    const deptPost = fetchCalls.find(
      (c) => c.url.includes('/api/vibe/open-office/departments') && c.method === 'POST',
    );
    assert.ok(deptPost, 'Saving department must dispatch POST /api/vibe/open-office/departments');
    assert.equal(deptPost.body?.name, 'Phòng Điều Hành Chủ Quyền');

    // Switch back to floorplan and verify live room title updated immediately
    const floorTab = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="tab-open-office-floorplan"]',
    );
    await act(async () => {
      floorTab?.click();
    });
    await settle();

    const blueprintGrid = dom.window.document.querySelector('[data-testid="open-office-blueprint-lens"]');
    assert.ok(
      blueprintGrid?.textContent?.includes('Phòng Điều Hành Chủ Quyền'),
      'Saved department rename must reflect immediately in the live Blueprint floorplan',
    );
  });

  it('defaults to 2D LimeZu Pixel Office with 7 doors and omits Architectural Grid / Radar toggles', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const lens = dom.window.document.querySelector('[data-testid="open-office-blueprint-lens"]');
    const canvasStage = dom.window.document.querySelector('[data-testid="pixel-office-canvas"]');
    const doorOverlay = dom.window.document.querySelector('[data-testid="limezu-door-canvas"]');
    const stageStrip = dom.window.document.querySelector('[data-testid="open-office-stage-strip"]');
    assert.ok(lens, 'Default view must wrap pixel office inside open-office-blueprint-lens');
    assert.ok(canvasStage, 'Default mount must render 2D pixel office canvas');
    assert.ok(doorOverlay, 'Default 2D stage must render limezu-door-canvas overlay');
    assert.ok(stageStrip, 'Default 2D stage must render open-office-stage-strip bar');

    const zones = [
      'sop_sec_audit_01',
      'sop_strategy_01',
      'sop_coding_01',
      'sop_generic_7p',
      'sop_research_01',
      'sop_analytics_01',
      'sop_legal_01',
      'sop_operations_01',
    ];
    for (const z of zones) {
      assert.ok(
        dom.window.document.querySelector(`[data-testid="zone-${z}"]`),
        `Canonical zone ${z} must render on default LimeZu stage`,
      );
    }
    const mascots = dom.window.document.querySelectorAll('[data-testid^="mascot-"]');
    assert.ok(mascots.length >= 2, `Expected >= 2 living mascots, got ${mascots.length}`);

    const btnPixel = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-blueprint-submode-pixel"]',
    );
    assert.ok(btnPixel, '2D Pixel Office submode button must exist');
    assert.equal(
      dom.window.document.querySelector('[data-testid="btn-blueprint-submode-vector"]'),
      null,
      'Architectural Grid button must not be rendered',
    );
    assert.equal(
      dom.window.document.querySelector('[data-testid="gather-view-mode-toggle"]'),
      null,
      'Chế độ Radar toggle button must not be rendered',
    );
  });

  it('routes cross-room agents via Dijkstra avoiding furniture and prevents ghost door opening', async () => {
    const {
      routeLimeZuTiles,
      createLimeZuDoors,
      doorTriggered,
      LIMEZU_FURN,
      segClear,
    } = await import('../open-office/limezuAtlasEngine');

    assert.ok(LIMEZU_FURN.sanh.length > 0, 'Lobby furniture collider table must be populated');
    const fullPath = routeLimeZuTiles(11.75, 3.35, 18.7, 2.55);
    assert.ok(fullPath.length >= 3, `Expected multi-waypoint cross-room route, got ${fullPath.length}`);

    const pts: Array<[number, number]> = [[11.75, 3.35], ...fullPath];
    const hasInteriorDoorwaySd2 = pts.some(
      ([x, y]) => x >= 16.4 && x <= 17.6 && y >= 2.0 && y <= 3.6,
    );
    assert.ok(hasInteriorDoorwaySd2, 'Exec HQ -> AI-Dev shortest route must traverse interior SD2 doorway');

    const crossLobbyPath = routeLimeZuTiles(11.75, 3.35, 21.6, 10.7);
    assert.ok(
      crossLobbyPath.length >= 4,
      `Expected multi-waypoint cross-lobby route, got ${crossLobbyPath.length}`,
    );
    const lobbyPts: Array<[number, number]> = [[11.75, 3.35], ...crossLobbyPath];
    const hasD2Doorway = lobbyPts.some(([x, y]) => x >= 11 && x <= 12.2 && y >= 4.4 && y <= 6.8);
    const hasD7Doorway = lobbyPts.some(([x, y]) => x >= 21 && x <= 22.2 && y >= 8.4 && y <= 11.0);
    assert.ok(hasD2Doorway && hasD7Doorway, 'Cross-lobby route must traverse D2 and D7 doorways');

    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      if (ax >= 7 && ax < 17 && ay < 5 && bx >= 7 && bx < 17 && by < 5) {
        assert.equal(
          segClear('dieu', ax, ay, bx, by),
          true,
          `Exec HQ segment (${ax},${ay})->(${bx},${by}) must avoid LIMEZU_FURN.dieu colliders`,
        );
      }
      if (ax >= 17 && ay < 5 && bx >= 17 && by < 5) {
        assert.equal(
          segClear('trinh', ax, ay, bx, by),
          true,
          `AI-Dev segment (${ax},${ay})->(${bx},${by}) must avoid LIMEZU_FURN.trinh colliders`,
        );
      }
    }

    for (let i = 1; i < lobbyPts.length; i++) {
      const [ax, ay] = lobbyPts[i - 1];
      const [bx, by] = lobbyPts[i];
      if (ay >= 6.4 && ay <= 9.1 && by >= 6.4 && by <= 9.1) {
        assert.equal(
          segClear('sanh', ax, ay, bx, by),
          true,
          `Lobby segment (${ax},${ay})->(${bx},${by}) must avoid all LIMEZU_FURN.sanh colliders`,
        );
      }
    }

    const doors = createLimeZuDoors();
    const d2 = doors.find((d) => d.id === 'D2');
    assert.ok(d2, 'Door D2 (Điều hành <-> Đại sảnh) must exist');

    const lobbyPassBy = doorTriggered(d2, {
      x: 11.75,
      y: 8.55,
      moving: true,
      kind: 'char',
      pathTiles: [[13.5, 8.55]],
    });
    assert.equal(lobbyPassBy, false, 'Walking along lobby corridor y=8.55 must NOT ghost-open D2');

    const doorwayCross = doorTriggered(d2, {
      x: 11.5,
      y: 4.55,
      moving: true,
      kind: 'char',
      pathTiles: [[11.5, 6.6]],
    });
    assert.equal(doorwayCross, true, 'Crossing through D2 doorway must open D2');
  });

  it('supports V42 Vietnamese Command Palette search and routes HITL items through GW-SOD-01 drawer', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const cmdBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-open-office-cmdk"]',
    );
    assert.ok(cmdBtn, 'Header must expose V42 command palette trigger button');

    await act(async () => {
      cmdBtn.click();
    });
    await settle();

    const palette = dom.window.document.querySelector('[data-testid="open-office-command-palette"]');
    assert.ok(palette, 'Command palette modal must open on trigger click');

    const searchInput = dom.window.document.querySelector<HTMLInputElement>(
      '[data-testid="input-cmdk-search"]',
    );
    assert.ok(searchInput, 'Command palette search input must render');

    await act(async () => {
      const nativeValueSetter = Object.getOwnPropertyDescriptor(
        dom.window.HTMLInputElement.prototype,
        'value',
      )?.set;
      nativeValueSetter?.call(searchInput, 'dieu hanh');
      searchInput.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
    await settle();

    const execDeptCmdItem = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="cmdk-item-dept-sop_generic_7p"]',
    );
    assert.ok(execDeptCmdItem, 'Diacritic-insensitive search "dieu hanh" must match Phòng Điều Hành');

    await act(async () => {
      execDeptCmdItem.click();
    });
    await settle();

    assert.equal(
      dom.window.document.querySelector('[data-testid="open-office-command-palette"]'),
      null,
      'Selecting a palette result must close the palette',
    );
    assert.ok(
      dom.window.document.body.textContent?.includes('Phòng Điều Hành 7P'),
      'Selecting department command must focus Phòng Điều Hành inspector context',
    );

    // Re-open palette and click pending HITL item — must open Sovereign HITL drawer without bypassing GW-SOD-01
    await act(async () => {
      cmdBtn.click();
    });
    await settle();

    const hitlItem = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid^="cmdk-item-hitl-"]',
    );
    assert.ok(hitlItem, 'Pending HITL contract must appear in command palette Bucket 0');

    await act(async () => {
      hitlItem.click();
    });
    await settle();

    assert.ok(
      dom.window.document.querySelector('[data-testid="sovereign-hitl-quick-drawer"]'),
      'Selecting HITL item from command palette must open GW-SOD-01 quick drawer',
    );
    assert.equal(
      fetchCalls.filter((c) => c.url.includes('/api/vibe/open-office/review') && c.method === 'POST')
        .length,
      0,
      'Opening HITL item via Command Palette must NEVER auto-approve without human sign-off',
    );
  });

  it('supports V62 Segmented Sub-Tabs: Dept Positions, Seat Assignment Board, and Staff Setup jump back to map', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');

    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const subDeptTab = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="tab-sub-dept"]',
    );
    assert.ok(subDeptTab, 'Segmented sub-tab tab-sub-dept must render');

    await act(async () => {
      subDeptTab.click();
    });
    await settle();

    const addPosBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-add-position-sop_coding_01"]',
    );
    assert.ok(addPosBtn, 'btn-add-position-sop_coding_01 must render in Dept & Positions sub-tab');

    await act(async () => {
      addPosBtn.click();
    });
    await settle();

    const seatBoard = dom.window.document.querySelector('[data-testid="office-seat-board"]');
    assert.ok(seatBoard, 'office-seat-board must render in Dept & Positions sub-tab');

    const candidateSelects = seatBoard.querySelectorAll<HTMLSelectElement>(
      '[data-testid^="select-seat-candidate-"]',
    );
    const targetSelect = candidateSelects[candidateSelects.length - 1];
    assert.ok(targetSelect, 'Newly added position must show select-seat-candidate-* dropdown');
    const posId = targetSelect.getAttribute('data-testid')?.replace('select-seat-candidate-', '') || '';
    const candidateSeatValue = targetSelect.options[1]?.value;
    assert.ok(candidateSeatValue, 'Seat candidate dropdown must list available AI stations');

    await act(async () => {
      targetSelect.value = candidateSeatValue;
      targetSelect.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
    await settle();

    const assignSeatBtn = seatBoard.querySelector<HTMLButtonElement>(
      `[data-testid="btn-assign-seat-${posId}"]`,
    );
    assert.ok(assignSeatBtn && !assignSeatBtn.disabled, 'btn-assign-seat-* must become enabled');

    await act(async () => {
      assignSeatBtn.click();
    });
    await settle();

    assert.equal(
      seatBoard.querySelector(`[data-testid="select-seat-candidate-${posId}"]`),
      null,
      'Assigning a candidate must occupy the seat on office-seat-board',
    );

    const subSetupTab = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="tab-sub-setup"]',
    );
    assert.ok(subSetupTab, 'Segmented sub-tab tab-sub-setup must render');

    await act(async () => {
      subSetupTab.click();
    });
    await settle();

    const setupAssignBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid^="btn-setup-assign-"]',
    );
    assert.ok(setupAssignBtn, 'Staff setup card must render btn-setup-assign-*');

    await act(async () => {
      setupAssignBtn.click();
    });
    await settle();

    assert.equal(
      dom.window.document.querySelector('[data-testid="office-seat-board"]'),
      null,
      'Clicking btn-setup-assign-* must jump back from setup/dept views to map',
    );
    assert.ok(
      dom.window.document.querySelector('[data-testid="gather-bottom-action-bar"]'),
      'Jumping back to map must show the map floorplan workspace',
    );
  });

  it('toggles V51 Simple/Full office mode cleanly and shows/hides advanced controls', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');

    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const modeBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-toggle-office-mode"]',
    );
    assert.ok(modeBtn, 'btn-toggle-office-mode must exist');
    assert.ok(
      dom.window.document.querySelector('[data-testid="lens-switcher"]'),
      'Full mode must show lens-switcher',
    );
    assert.ok(
      dom.window.document.querySelector('[data-testid="office-bulk-dispatch-panel"]'),
      'Full mode must show office-bulk-dispatch-panel',
    );
    assert.equal(
      dom.window.document.querySelector('[data-testid^="tpl-chip-"]'),
      null,
      'Full mode uses template dropdown instead of tpl-chip-* buttons',
    );

    await act(async () => {
      modeBtn.click();
    });
    await settle();

    assert.equal(
      dom.window.document.querySelector('[data-testid="lens-switcher"]'),
      null,
      'Simple mode must hide lens-switcher',
    );
    assert.equal(
      dom.window.document.querySelector('[data-testid="office-bulk-dispatch-panel"]'),
      null,
      'Simple mode must hide office-bulk-dispatch-panel',
    );
    assert.ok(
      dom.window.document.querySelector('[data-testid^="tpl-chip-"]'),
      'Simple mode must show visual tpl-chip-* selector',
    );

    await act(async () => {
      modeBtn.click();
    });
    await settle();

    assert.ok(
      dom.window.document.querySelector('[data-testid="lens-switcher"]'),
      'Restoring Full mode must show lens-switcher again',
    );
    assert.ok(
      dom.window.document.querySelector('[data-testid="office-bulk-dispatch-panel"]'),
      'Restoring Full mode must show office-bulk-dispatch-panel again',
    );
  });

  it('validates V48 Bulk Dispatch Dry-Run with 0 POSTs before confirming batch creation', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');

    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const textarea = dom.window.document.querySelector<HTMLTextAreaElement>(
      '[data-testid="textarea-bulk-titles"]',
    );
    const dryRunBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-bulk-dry-run"]',
    );
    const confirmBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-bulk-confirm"]',
    );
    assert.ok(textarea && dryRunBtn && confirmBtn, 'Bulk dispatch controls must render');

    const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
      dom.window.HTMLTextAreaElement.prototype,
      'value',
    )?.set;

    await act(async () => {
      textarea.dispatchEvent(new dom.window.Event('focusin', { bubbles: true }));
      nativeTextareaSetter?.call(
        textarea,
        'Rà soát báo cáo tuần 44\nĐối chiếu số liệu tháng 10',
      );
      textarea.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      textarea.dispatchEvent(new dom.window.KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
    });
    await settle();

    await act(async () => {
      dryRunBtn.click();
    });
    await settle();

    const previewList = dom.window.document.querySelector('[data-testid="bulk-preview-list"]');
    assert.ok(previewList, 'Clicking btn-bulk-dry-run must render bulk-preview-list');
    assert.match(previewList.textContent || '', /Rà soát báo cáo tuần 44/);
    assert.match(previewList.textContent || '', /Đối chiếu số liệu tháng 10/);
    assert.equal(
      fetchCalls.filter((c) => c.url.includes('/api/vibe/open-office/contracts') && c.method === 'POST')
        .length,
      0,
      'Dry-run preview must fire 0 POST /api/vibe/open-office/contracts calls',
    );

    await act(async () => {
      confirmBtn.click();
    });
    await settle();

    const postCalls = fetchCalls.filter(
      (c) => c.url.includes('/api/vibe/open-office/contracts') && c.method === 'POST',
    );
    assert.equal(
      postCalls.length,
      2,
      'Confirming bulk dispatch must POST each valid item to /api/vibe/open-office/contracts',
    );
  });

  it('toggles bulk dispatch accordion and syncs seat assignment changes to backend', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');

    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const toggleBulkBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-toggle-bulk-dispatch"]',
    );
    assert.ok(toggleBulkBtn, 'btn-toggle-bulk-dispatch must render in Full mode');
    assert.equal(
      toggleBulkBtn.getAttribute('aria-expanded'),
      'false',
      'btn-toggle-bulk-dispatch must start with aria-expanded="false"',
    );

    await act(async () => {
      toggleBulkBtn.click();
    });
    await settle();

    assert.equal(
      toggleBulkBtn.getAttribute('aria-expanded'),
      'true',
      'Clicking btn-toggle-bulk-dispatch must set aria-expanded="true"',
    );

    const subDeptTab = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="tab-sub-dept"]',
    );
    assert.ok(subDeptTab, 'tab-sub-dept must render');

    await act(async () => {
      subDeptTab.click();
    });
    await settle();

    const addPosBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-add-position-sop_coding_01"]',
    );
    assert.ok(addPosBtn, 'btn-add-position-sop_coding_01 must render in Phòng ban & vị trí');

    await act(async () => {
      addPosBtn.click();
    });
    await settle();

    const seatBoard = dom.window.document.querySelector('[data-testid="office-seat-board"]');
    assert.ok(seatBoard, 'office-seat-board must render');

    const candidateSelects = seatBoard.querySelectorAll<HTMLSelectElement>(
      '[data-testid^="select-seat-candidate-"]',
    );
    const targetSelect = candidateSelects[candidateSelects.length - 1];
    assert.ok(targetSelect, 'Added position must render select-seat-candidate-* dropdown');
    const posId = targetSelect.getAttribute('data-testid')?.replace('select-seat-candidate-', '') || '';
    const candidateSeatValue = targetSelect.options[1]?.value;
    assert.ok(candidateSeatValue, 'Seat candidate dropdown must include an AI station');

    await act(async () => {
      targetSelect.value = candidateSeatValue;
      targetSelect.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
    await settle();

    const assignSeatBtn = seatBoard.querySelector<HTMLButtonElement>(
      `[data-testid="btn-assign-seat-${posId}"]`,
    );
    assert.ok(assignSeatBtn && !assignSeatBtn.disabled, 'btn-assign-seat-* must be enabled');

    await act(async () => {
      assignSeatBtn.click();
    });
    await settle();

    const seatAssignCall = fetchCalls.find(
      (c) => c.url.includes('/api/vibe/open-office/seat-assignments') && c.method === 'POST',
    );
    assert.ok(
      seatAssignCall,
      'Assigning a seat in Phòng ban & vị trí must trigger POST /api/vibe/open-office/seat-assignments',
    );
    assert.equal(
      seatAssignCall.body?.assignments?.[candidateSeatValue]?.positionId,
      posId,
      'Seat assignment POST payload must contain the assigned positionId',
    );
  });

  it('supports V45/V61 Contracts tab checklist sync, slip copy, and EvidenceFullscreenReader font zoom', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');

    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const contractsTab = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="tab-open-office-contracts"]',
    );
    assert.ok(contractsTab, 'Contracts tab trigger must render');

    await act(async () => {
      contractsTab.click();
    });
    await settle();

    const checklist = dom.window.document.querySelector('[data-testid="criteria-checklist"]');
    const progress = dom.window.document.querySelector('[data-testid="criteria-progress"]');
    const tick0 = dom.window.document.querySelector<HTMLInputElement>(
      '[data-testid="criteria-tick-0"]',
    );
    const acceptCheckbox = dom.window.document.querySelector<HTMLInputElement>(
      '[data-testid="checkbox-acceptance-verified"]',
    );
    assert.ok(checklist && progress && tick0 && acceptCheckbox);
    assert.match(progress.textContent || '', /0\/1/);
    assert.equal(acceptCheckbox.checked, false);

    await act(async () => {
      tick0.click();
    });
    await settle();

    assert.match(progress.textContent || '', /1\/1/);
    assert.equal(
      acceptCheckbox.checked,
      true,
      'Checking all criteria on AWAITING_HITL contract must sync checkbox-acceptance-verified',
    );

    const copyBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-copy-contract-slip"]',
    );
    assert.ok(copyBtn, 'btn-copy-contract-slip must render in contract header');

    await act(async () => {
      copyBtn.click();
    });
    await settle();

    const copyNotice = dom.window.document.querySelector('[data-testid="copied-slip-notice"]');
    assert.ok(copyNotice, 'Clicking btn-copy-contract-slip must show copied-slip-notice');
    assert.match(copyNotice.textContent || '', /CTR-2026-001/);

    const readerBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-open-evidence-reader"]',
    );
    assert.ok(readerBtn, 'btn-open-evidence-reader must render in contract header');

    await act(async () => {
      readerBtn.click();
    });
    await settle();

    const reader = dom.window.document.querySelector('[data-testid="evidence-fullscreen-reader"]');
    const fontLabel = dom.window.document.querySelector('[data-testid="reader-font-size-label"]');
    const incBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-reader-font-inc"]',
    );
    const decBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-reader-font-dec"]',
    );
    assert.ok(reader && fontLabel && incBtn && decBtn, 'EvidenceFullscreenReader controls must render');
    assert.equal(fontLabel.textContent?.trim(), '19px');

    await act(async () => {
      incBtn.click();
    });
    await settle();
    assert.equal(fontLabel.textContent?.trim(), '22px');

    await act(async () => {
      decBtn.click();
    });
    await settle();
    assert.equal(fontLabel.textContent?.trim(), '19px');
  });

  it('TC-603-06 & TC-603-07 & TC-603-12: switches cleanly to Beehive Colony stage via Lens Switcher, Stage Bar (Full + Simple), and Ctrl+K Palette', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');

    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    // Default still mounts Blueprint/Pixel
    assert.ok(
      dom.window.document.querySelector('[data-testid="open-office-blueprint-lens"]'),
      'Default view must remain open-office-blueprint-lens',
    );

    // 1. Top Lens Switcher entry point
    const btnLensBees = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-lens-bees"]',
    );
    assert.ok(btnLensBees, 'btn-lens-bees must exist in top lens-switcher');
    await act(async () => {
      btnLensBees.click();
    });
    await settle();

    assert.ok(
      dom.window.document.querySelector('[data-testid="open-office-beehive-lens"]'),
      'Clicking btn-lens-bees must mount open-office-beehive-lens',
    );
    const lensHint = dom.window.document.querySelector('[data-testid="open-office-lens-hint"]');
    assert.match(lensHint?.textContent || '', /Tổ ong|Beehive/i);

    // Return to Pixel via Stage Bar
    const btnPixel = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-blueprint-submode-pixel"]',
    );
    assert.ok(btnPixel);
    await act(async () => {
      btnPixel.click();
    });
    await settle();
    assert.ok(
      dom.window.document.querySelector('[data-testid="open-office-blueprint-lens"]'),
      'Clicking btn-blueprint-submode-pixel must return to open-office-blueprint-lens',
    );

    // 2. Floorplan Stage Bar entry point in Simple mode (lens-switcher hidden)
    const modeBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-toggle-office-mode"]',
    );
    assert.ok(modeBtn);
    await act(async () => {
      modeBtn.click();
    });
    await settle();
    assert.equal(
      dom.window.document.querySelector('[data-testid="lens-switcher"]'),
      null,
      'Simple mode must still hide lens-switcher',
    );

    const btnStageBees = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-stage-submode-bees"]',
    );
    assert.ok(btnStageBees, 'btn-stage-submode-bees must exist in gather-bottom-action-bar');
    await act(async () => {
      btnStageBees.click();
    });
    await settle();
    assert.ok(
      dom.window.document.querySelector('[data-testid="open-office-beehive-lens"]'),
      'Stage Bar Bees toggle must activate Beehive stage even in Simple mode',
    );

    // Restore Full mode and return to Blueprint before testing Ctrl+K
    await act(async () => {
      modeBtn.click();
    });
    await settle();
    const btnPixelReturn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-blueprint-submode-pixel"]',
    );
    assert.ok(btnPixelReturn);
    await act(async () => {
      btnPixelReturn.click();
    });
    await settle();

    // 3. Ctrl+K Command Palette entry point
    const cmdkBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-open-office-cmdk"]',
    );
    assert.ok(cmdkBtn);
    await act(async () => {
      cmdkBtn.click();
    });
    await settle();

    assert.equal(
      dom.window.document.querySelector('[data-testid="cmdk-item-view-vector-blueprint"]'),
      null,
      'Command Palette must not list removed Architectural 8-Room Grid command',
    );
    assert.equal(
      dom.window.document.querySelector('[data-testid="cmdk-item-view-radar"]'),
      null,
      'Command Palette must not list removed Tactical Radar Mode command',
    );

    const searchInput = dom.window.document.querySelector<HTMLInputElement>(
      '[data-testid="input-cmdk-search"]',
    );
    assert.ok(searchInput);
    const nativeSetter = Object.getOwnPropertyDescriptor(
      dom.window.HTMLInputElement.prototype,
      'value',
    )?.set;
    await act(async () => {
      nativeSetter?.call(searchInput, 'bees');
      searchInput.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
    await settle();

    const cmdkBees = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="cmdk-item-view-bees"]',
    );
    assert.ok(cmdkBees, 'Command Palette must list cmdk-item-view-bees when searching bees');
    await act(async () => {
      cmdkBees.click();
    });
    await settle();

    assert.ok(
      dom.window.document.querySelector('[data-testid="open-office-beehive-lens"]'),
      'Command Palette cmdk-item-view-bees must activate open-office-beehive-lens',
    );
  });

  it('renders custom dynamic SOP zones, setup cards, and governance entries from API state', async () => {
    const customState = {
      ...MOCK_STATE,
      zones: [
        ...MOCK_STATE.zones,
        {
          id: 'sop_custom_99',
          sop_id: 'SOP-CUSTOM-99',
          uc_id: 'SOP-CUSTOM-99',
          name: 'Custom Studio SOP',
          subtitle: 'AI Film Pipeline',
          primary_skills: ['CanhStudioHarness'],
          visual_slot: 'morong',
          is_spine: false,
          order: 9,
          grid: { x: 2, y: 51, w: 22, h: 44 },
          accent: 'border-amber-500/30',
        },
      ],
      departments: [
        ...MOCK_STATE.departments,
        {
          ...MOCK_STATE.departments[1],
          zone_id: 'sop_custom_99',
          sop_id: 'SOP-CUSTOM-99',
          uc_id: 'SOP-CUSTOM-99',
          name: 'Custom Studio SOP',
          primary_skills: ['CanhStudioHarness'],
        },
      ],
    };

    const prevFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/vibe/open-office/state')) {
        return new Response(JSON.stringify(customState), { status: 200 });
      }
      return prevFetch(input, init);
    }) as typeof fetch;

    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    // 1. Floorplan renders [data-testid="zone-sop_custom_99"]
    const customZone = dom.window.document.querySelector('[data-testid="zone-sop_custom_99"]');
    assert.ok(customZone, 'Floorplan must render custom dynamic SOP zone sop_custom_99');

    // 2. Dept & Positions sub-tab renders [data-testid="dept-setup-card-sop_custom_99"] with SOP-CUSTOM-99 & CanhStudioHarness
    const subDeptTab = dom.window.document.querySelector<HTMLButtonElement>('[data-testid="tab-sub-dept"]');
    assert.ok(subDeptTab, 'tab-sub-dept must exist');
    await act(async () => {
      subDeptTab.click();
    });
    await settle();

    const customSetupCard = dom.window.document.querySelector('[data-testid="dept-setup-card-sop_custom_99"]');
    assert.ok(customSetupCard, 'Dept & Positions must render dept-setup-card-sop_custom_99');
    assert.ok(
      customSetupCard.textContent?.includes('SOP-CUSTOM-99'),
      'Custom setup card must display SOP-CUSTOM-99',
    );
    assert.ok(
      customSetupCard.textContent?.includes('CanhStudioHarness'),
      'Custom setup card must display CanhStudioHarness primary skill',
    );

    // 3. Governance tab renders [data-testid="btn-gov-select-dept-sop_custom_99"]
    const govTab = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="tab-open-office-governance"]',
    );
    assert.ok(govTab, 'tab-open-office-governance must exist');
    await act(async () => {
      govTab.click();
    });
    await settle();

    const customGovBtn = dom.window.document.querySelector(
      '[data-testid="btn-gov-select-dept-sop_custom_99"]',
    );
    assert.ok(customGovBtn, 'Governance panel must render btn-gov-select-dept-sop_custom_99');
  });

  it('computes procedural N-SOP 24x14 tile floorplans, domain themes, dynamic doors, and wall-safe paths for N = 5, 8, and 10 SOPs', async () => {
    const { computeDynamicPixelFloorplan, resolveSopThemeDomain } = await import(
      '../open-office/openOfficeConstants'
    );
    const { createDynamicLimeZuDoors, routeDynamicLimeZuPixels } = await import(
      '../open-office/limezuAtlasEngine'
    );

    assert.equal(
      resolveSopThemeDomain({
        canonicalId: 'sop_studio_01',
        sopId: 'SOP-STUDIO-01',
        primarySkills: ['CanhStudioHarness'],
      }),
      'STUDIO',
    );
    assert.equal(
      resolveSopThemeDomain({
        canonicalId: 'sop_fin_01',
        sopId: 'SOP-FIN-01',
        primarySkills: ['MisaHarness'],
      }),
      'FINANCE',
    );
    assert.equal(
      resolveSopThemeDomain({
        canonicalId: 'sop_sec_audit_01',
        sopId: 'SOP-SEC-AUDIT-01',
      }),
      'SEC_QA',
    );
    assert.equal(
      resolveSopThemeDomain({
        canonicalId: 'sop_coding_01',
        sopId: 'SOP-CODING-01',
      }),
      'CODING',
    );
    assert.equal(
      resolveSopThemeDomain({
        canonicalId: 'sop_generic_7p',
        sopId: 'SOP-GENERIC-7P',
        isSpine: true,
      }),
      'SPINE',
    );

    const makeZone = (
      id: string,
      sopId: string,
      order: number,
      primarySkills: string[],
      isSpine = false,
    ) => ({
      id,
      sop_id: sopId,
      uc_id: sopId,
      name: sopId,
      subtitle: sopId,
      primary_skills: primarySkills,
      is_spine: isSpine,
      order,
      grid: { x: 2, y: 3, w: 22, h: 44 },
    });

    const fiveZones = [
      makeZone('sop_generic_7p', 'SOP-GENERIC-7P', 1, ['TaskManager'], true),
      makeZone('sop_coding_01', 'SOP-CODING-01', 2, ['UCBDDManager']),
      makeZone('sop_sec_audit_01', 'SOP-SEC-AUDIT-01', 3, ['QualityGate']),
      makeZone('sop_studio_99', 'SOP-STUDIO-99', 4, ['CanhStudioHarness']),
      makeZone('sop_fin_99', 'SOP-FIN-99', 5, ['MisaHarness']),
    ];

    const tenZones = [
      ...MOCK_STATE.zones,
      makeZone('sop_studio_99', 'SOP-STUDIO-99', 9, ['CanhStudioHarness']),
      makeZone('sop_fin_99', 'SOP-FIN-99', 10, ['MisaHarness']),
    ];

    const assertValidFloorplan = (
      fp: ReturnType<typeof computeDynamicPixelFloorplan>,
      expectedN: number,
    ) => {
      assert.equal(fp.roomCount, expectedN);
      assert.equal(fp.rooms.length, expectedN);
      assert.equal(fp.doors.length, expectedN - 1);
      assert.equal(createDynamicLimeZuDoors(fp).length, expectedN - 1);

      let totalArea = 0;
      for (const r of fp.rooms) {
        const [x0, y0, x1, y1] = r.tileRect;
        assert.ok(x0 >= 0 && x0 < x1 && x1 <= 24, `Invalid X tileRect for ${r.canonicalId}`);
        assert.ok(y0 >= 0 && y0 < y1 && y1 <= 14, `Invalid Y tileRect for ${r.canonicalId}`);
        totalArea += (x1 - x0) * (y1 - y0);
      }
      assert.equal(totalArea, 24 * 14, `Total floor area for N=${expectedN} must cover 24x14 tiles`);

      // Pairwise non-overlap across all rooms
      for (let i = 0; i < fp.rooms.length; i++) {
        for (let j = i + 1; j < fp.rooms.length; j++) {
          const [ax0, ay0, ax1, ay1] = fp.rooms[i].tileRect;
          const [bx0, by0, bx1, by1] = fp.rooms[j].tileRect;
          const overlapX = Math.min(ax1, bx1) - Math.max(ax0, bx0);
          const overlapY = Math.min(ay1, by1) - Math.max(ay0, by0);
          assert.ok(
            overlapX <= 0 || overlapY <= 0,
            `Rooms ${fp.rooms[i].canonicalId} and ${fp.rooms[j].canonicalId} must not overlap`,
          );
        }
      }

      // Wall-safe multi-point routing between two distinct specialist rooms
      const specialists = fp.rooms.filter((r) => !r.isSpine);
      assert.ok(specialists.length >= 2);
      const rA = specialists[0];
      const rB = specialists[specialists.length - 1];
      const ax = ((rA.tileRect[0] + rA.tileRect[2]) / 2) * 40;
      const ay = ((rA.tileRect[1] + rA.tileRect[3]) / 2) * 40;
      const bx = ((rB.tileRect[0] + rB.tileRect[2]) / 2) * 40;
      const by = ((rB.tileRect[1] + rB.tileRect[3]) / 2) * 40;
      const pts = routeDynamicLimeZuPixels(ax, ay, bx, by, fp);
      assert.ok(pts.length >= 2, `Expected multi-point path for N=${expectedN}, got ${pts.length}`);
      for (const p of pts) {
        assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), 'Route points must be finite');
      }
    };

    const fp5 = computeDynamicPixelFloorplan(fiveZones as never);
    assert.equal(fp5.isClassicEightLayout, false);
    assert.equal(
      fp5.rooms.find((r) => r.canonicalId === 'sop_studio_99')?.themeDomain,
      'STUDIO',
    );
    assertValidFloorplan(fp5, 5);

    const fp8 = computeDynamicPixelFloorplan(MOCK_STATE.zones as never, MOCK_STATE.departments as never);
    assert.equal(fp8.isClassicEightLayout, true);
    assertValidFloorplan(fp8, 8);

    const fp10 = computeDynamicPixelFloorplan(tenZones as never, MOCK_STATE.departments as never, {
      sop_generic_7p: 6,
      sop_studio_99: 4,
    });
    assert.equal(fp10.isClassicEightLayout, false);
    assert.equal(fp10.spineRoom.seatCapacity, 6);
    assert.equal(fp10.spineRoom.deskAnchors.length, 6);
    assertValidFloorplan(fp10, 10);
  });

  it('renders dynamic 8-bit contract flights, subagent tethers, SOP badges, and tool bursts on PixelOfficeCanvas', async () => {
    const richState = {
      ...MOCK_STATE,
      zones: [
        ...MOCK_STATE.zones,
        {
          id: 'sop_custom_99',
          sop_id: 'SOP-CUSTOM-99',
          uc_id: 'SOP-CUSTOM-99',
          name: 'Custom Studio SOP',
          subtitle: 'AI Film Pipeline',
          primary_skills: ['CanhStudioHarness'],
          visual_slot: 'morong',
          is_spine: false,
          order: 9,
          grid: { x: 2, y: 51, w: 22, h: 44 },
          accent: 'border-amber-500/30',
        },
      ],
      departments: [
        ...MOCK_STATE.departments,
        {
          ...MOCK_STATE.departments[1],
          zone_id: 'sop_custom_99',
          sop_id: 'SOP-CUSTOM-99',
          uc_id: 'SOP-CUSTOM-99',
          name: 'Custom Studio SOP',
          primary_skills: ['CanhStudioHarness'],
        },
      ],
      stations: [
        {
          ...MOCK_STATE.stations[0],
          status: 'WORKING',
          live_telemetry: {
            is_live_executing: true,
            active_tool: 'edit_file',
            action_label: 'Editing PixelOfficeCanvas',
          },
        },
        MOCK_STATE.stations[1],
      ],
      contracts: [
        ...MOCK_STATE.contracts,
        {
          id: 'CTR-2026-888',
          project_key: 'PM',
          team_ref: 'thanb',
          title: 'Active Lead to Support Contract',
          domain: 'DEV',
          lead_agent_id: 'agt-antigravity',
          support_agent_ids: ['agt-orchestrator'],
          status: 'IN_PROGRESS',
        },
        {
          id: 'CTR-2026-DONE-999',
          project_key: 'PM',
          team_ref: 'thanb',
          title: 'Completed Contract Should Not Emit Flight',
          domain: 'DEV',
          lead_agent_id: 'agt-antigravity',
          support_agent_ids: ['agt-orchestrator'],
          status: 'DONE',
        },
      ],
      colony_bees: [
        {
          bee_id: 'sub-scout-99',
          seat_id: 'seat-agy',
          parent_bee_id: 'seat-agy',
          tier: 'subagent',
          agent_id: 'agt-scout-99',
          username: '@scout99',
          display_name: 'Scout 99',
          role: 'AST Scout',
          zone_id: 'sop_custom_99',
          status: 'WORKING',
          active_tool: 'read_file',
          project_key: 'PM',
        },
      ],
    };

    const prevFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/vibe/open-office/state')) {
        return new Response(JSON.stringify(richState), { status: 200 });
      }
      return prevFetch(input, init);
    }) as typeof fetch;

    try {
      const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
      await act(async () => {
        root.render(
          <AppRouterContext.Provider value={dummyRouter}>
            <OpenOfficeWorkspaceView apiBaseUrl="" />
          </AppRouterContext.Provider>,
        );
      });
      await settle();

      const doc = dom.window.document;
      const customSopBadge = doc.querySelector('[data-testid="pixel-room-sop-sop_custom_99"]');
      assert.ok(customSopBadge, 'Must render pixel-room-sop-sop_custom_99');
      assert.ok(
        customSopBadge.textContent?.includes('SOP-CUSTOM-99'),
        'Custom SOP badge must display SOP-CUSTOM-99',
      );

      assert.ok(
        doc.querySelector('[data-testid^="pixel-room-status-"]'),
        'Must render pixel-room-status-* badge for active/HITL rooms',
      );

      assert.ok(
        doc.querySelector('[data-testid^="pixel-contract-flight-CTR-2026-"]'),
        'Must render active contract flight stream',
      );
      assert.equal(
        doc.querySelector('[data-testid^="pixel-contract-flight-CTR-2026-DONE-999"]'),
        null,
        'DONE contract must emit 0 flight paths',
      );

      const subNode = doc.querySelector('[data-testid="pixel-subagent-node-sub-scout-99"]');
      assert.ok(subNode, 'Must render pixel-subagent-node-sub-scout-99');

      const subLink = doc.querySelector('[data-testid="pixel-subagent-link-sub-scout-99"]');
      assert.ok(subLink, 'Must render pixel-subagent-link-sub-scout-99');
      const linkPath = subLink.getAttribute('d') || '';
      assert.ok(linkPath.length > 0 && !linkPath.includes('NaN'), `Subagent tether path invalid: ${linkPath}`);

      const toolBurst = doc.querySelector('[data-testid^="pixel-tool-burst-"]');
      assert.ok(toolBurst, 'Must render pixel-tool-burst-* for working station');
      assert.ok(
        toolBurst.textContent?.includes('edit_file'),
        'Tool burst micro-pill must show edit_file',
      );
    } finally {
      globalThis.fetch = prevFetch;
    }
  });

  it('renders Cycle & Initiative sync ribbon when cycles/initiatives are hydrated and passes cycle_id on filter change', async () => {
    const syncedState = {
      ...MOCK_STATE,
      cycles: [
        {
          id: 701,
          project_key: 'PM',
          name: 'Cycle 03 (2026-W47)',
          start_date: '2026-11-16T00:00:00Z',
          end_date: '2026-11-22T23:59:59Z',
          is_active: true,
          total_issues: 10,
          completed_issues: 4,
          in_progress_issues: 3,
        },
      ],
      initiatives: [
        {
          id: 801,
          project_key: 'PM',
          title: 'H1-1 Unified Operations Hub',
          status: 'active',
          total_issues: 10,
          completed_issues: 4,
          in_progress_issues: 3,
        },
      ],
      active_cycle: {
        id: 701,
        project_key: 'PM',
        name: 'Cycle 03 (2026-W47)',
        start_date: '2026-11-16T00:00:00Z',
        end_date: '2026-11-22T23:59:59Z',
        is_active: true,
        total_issues: 10,
        completed_issues: 4,
        in_progress_issues: 3,
      },
    };

    const prevFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      fetchCalls.push({ url, method: init?.method || 'GET' });
      if (url.includes('/api/vibe/open-office/state')) {
        return new Response(JSON.stringify(syncedState), { status: 200 });
      }
      return prevFetch(input, init);
    }) as typeof fetch;

    try {
      const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
      await act(async () => {
        root.render(
          <AppRouterContext.Provider value={dummyRouter}>
            <OpenOfficeWorkspaceView apiBaseUrl="" />
          </AppRouterContext.Provider>,
        );
      });
      await settle();

      const doc = dom.window.document;
      const syncBar = doc.querySelector('[data-testid="open-office-cycle-initiative-bar"]');
      assert.ok(syncBar, 'Must render open-office-cycle-initiative-bar');

      const cycleSel = doc.querySelector(
        '[data-testid="select-open-office-cycle-filter"]',
      ) as HTMLSelectElement | null;
      const initSel = doc.querySelector(
        '[data-testid="select-open-office-initiative-filter"]',
      ) as HTMLSelectElement | null;
      assert.ok(cycleSel, 'Must render cycle filter select');
      assert.ok(initSel, 'Must render initiative filter select');
      assert.ok(cycleSel.textContent?.includes('Cycle 03 (2026-W47)'));
      assert.ok(initSel.textContent?.includes('H1-1 Unified Operations Hub'));

      await act(async () => {
        cycleSel.value = '701';
        cycleSel.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      });
      await settle();

      assert.ok(
        fetchCalls.some((c) => c.url.includes('/api/vibe/open-office/state') && c.url.includes('cycle_id=701')),
        'Changing cycle filter must fetch Open Office state with cycle_id=701',
      );
    } finally {
      globalThis.fetch = prevFetch;
    }
  });

  it('guides users through the 3-step Contract Composer without losing state', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const doc = dom.window.document;
    const toggleBtn = doc.querySelector<HTMLButtonElement>(
      '[data-testid="btn-toggle-advanced-composer"]',
    );
    assert.ok(toggleBtn, 'btn-toggle-advanced-composer must exist');

    await act(async () => {
      toggleBtn.click();
    });
    await settle();

    const stepper = doc.querySelector('[data-testid="contract-composer-stepper"]');
    assert.ok(stepper, 'GuidedStepper contract-composer-stepper must render');

    const step1 = stepper.querySelector<HTMLElement>('[data-step-id="step-1"]');
    const step2 = stepper.querySelector<HTMLElement>('[data-step-id="step-2"]');
    const step3 = stepper.querySelector<HTMLElement>('[data-step-id="step-3"]');
    assert.ok(step1 && step2 && step3, 'All 3 guided steps must be mounted');

    assert.equal(step1.classList.contains('hidden'), false, 'step-1 must be visible initially');
    assert.equal(step2.classList.contains('hidden'), true, 'step-2 must be hidden initially');
    assert.equal(step3.classList.contains('hidden'), true, 'step-3 must be hidden initially');

    const btnStep1Next = doc.querySelector<HTMLButtonElement>('[data-testid="btn-step1-next"]');
    assert.ok(btnStep1Next, 'btn-step1-next must exist');
    await act(async () => {
      btnStep1Next.click();
    });
    await settle();

    assert.equal(step1.classList.contains('hidden'), true, 'step-1 must hide after clicking btn-step1-next');
    assert.equal(step2.classList.contains('hidden'), false, 'step-2 must reveal after clicking btn-step1-next');
    assert.equal(step3.classList.contains('hidden'), true, 'step-3 must remain hidden on step-2');

    const btnStep2Next = doc.querySelector<HTMLButtonElement>('[data-testid="btn-step2-next"]');
    assert.ok(btnStep2Next, 'btn-step2-next must exist');
    await act(async () => {
      btnStep2Next.click();
    });
    await settle();

    assert.equal(step1.classList.contains('hidden'), true, 'step-1 must remain hidden on step-3');
    assert.equal(step2.classList.contains('hidden'), true, 'step-2 must hide after clicking btn-step2-next');
    assert.equal(step3.classList.contains('hidden'), false, 'step-3 must reveal after clicking btn-step2-next');
  });

  it('navigates across the 4 focused Governance tabs showing only 1 active panel at a time', async () => {
    const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={dummyRouter}>
          <OpenOfficeWorkspaceView apiBaseUrl="" />
        </AppRouterContext.Provider>,
      );
    });
    await settle();

    const doc = dom.window.document;
    const govTab = doc.querySelector<HTMLButtonElement>('[data-testid="tab-open-office-governance"]');
    assert.ok(govTab, 'tab-open-office-governance must exist');

    await act(async () => {
      govTab.click();
    });
    await settle();

    const policyPanel = doc
      .querySelector('[data-testid="gov-company-policy-card"]')
      ?.closest<HTMLElement>('[role="tabpanel"]');
    const deptsPanel = doc
      .querySelector('[data-testid="gov-departments-editor"]')
      ?.closest<HTMLElement>('[role="tabpanel"]');
    const rolesPanel = doc
      .querySelector('[data-testid="gov-roles-roster"]')
      ?.closest<HTMLElement>('[role="tabpanel"]');
    const matrixPanel = doc
      .querySelector('[data-testid="gov-authorization-matrix"]')
      ?.closest<HTMLElement>('[role="tabpanel"]');

    assert.ok(
      policyPanel && deptsPanel && rolesPanel && matrixPanel,
      'All 4 governance sections must be wrapped in role="tabpanel" containers',
    );

    assert.equal(policyPanel.classList.contains('hidden'), false, 'Policy panel must be visible by default');
    assert.equal(deptsPanel.classList.contains('hidden'), true, 'Departments panel must be hidden initially');
    assert.equal(rolesPanel.classList.contains('hidden'), true, 'Roles panel must be hidden initially');
    assert.equal(matrixPanel.classList.contains('hidden'), true, 'Matrix panel must be hidden initially');

    const tabDepartments = doc.querySelector<HTMLButtonElement>('[data-testid="gov-tab-departments"]');
    const tabRoles = doc.querySelector<HTMLButtonElement>('[data-testid="gov-tab-roles"]');
    const tabMatrix = doc.querySelector<HTMLButtonElement>('[data-testid="gov-tab-matrix"]');
    assert.ok(tabDepartments && tabRoles && tabMatrix, 'Focused governance tab buttons must exist');

    await act(async () => {
      tabDepartments.click();
    });
    await settle();
    assert.equal(policyPanel.classList.contains('hidden'), true);
    assert.equal(deptsPanel.classList.contains('hidden'), false);
    assert.equal(rolesPanel.classList.contains('hidden'), true);
    assert.equal(matrixPanel.classList.contains('hidden'), true);

    await act(async () => {
      tabRoles.click();
    });
    await settle();
    assert.equal(policyPanel.classList.contains('hidden'), true);
    assert.equal(deptsPanel.classList.contains('hidden'), true);
    assert.equal(rolesPanel.classList.contains('hidden'), false);
    assert.equal(matrixPanel.classList.contains('hidden'), true);

    await act(async () => {
      tabMatrix.click();
    });
    await settle();
    assert.equal(policyPanel.classList.contains('hidden'), true);
    assert.equal(deptsPanel.classList.contains('hidden'), true);
    assert.equal(rolesPanel.classList.contains('hidden'), true);
    assert.equal(matrixPanel.classList.contains('hidden'), false);
  });

  it('renders agent & department details in a right-side Sheet drawer on small screens and restores inline rail on desktop', async () => {
    const extraGlobals: Record<string, unknown> = {
      NodeFilter: dom.window.NodeFilter,
      MutationObserver: dom.window.MutationObserver,
      getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
      requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
      cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
    };
    const savedExtra = new Map(
      Object.keys(extraGlobals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
    );
    for (const [key, value] of Object.entries(extraGlobals)) {
      Object.defineProperty(globalThis, key, { configurable: true, value });
    }

    let isSmallScreen = true;
    const changeListeners = new Set<(e: MediaQueryListEvent) => void>();
    const setSmallScreen = async (next: boolean) => {
      isSmallScreen = next;
      const evt = { matches: next, media: '(max-width: 1279px)' } as MediaQueryListEvent;
      await act(async () => {
        for (const cb of changeListeners) cb(evt);
      });
      await settle();
    };

    Object.defineProperty(dom.window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        get matches() {
          return query.includes('max-width: 1279px') ? isSmallScreen : false;
        },
        media: query,
        onchange: null,
        addEventListener: (_type: string, cb: (e: MediaQueryListEvent) => void) => {
          changeListeners.add(cb);
        },
        removeEventListener: (_type: string, cb: (e: MediaQueryListEvent) => void) => {
          changeListeners.delete(cb);
        },
        addListener: (cb: (e: MediaQueryListEvent) => void) => {
          changeListeners.add(cb);
        },
        removeListener: (cb: (e: MediaQueryListEvent) => void) => {
          changeListeners.delete(cb);
        },
        dispatchEvent: () => true,
      }),
    });

    try {
      let openedIssueId: number | null = null;
      const mockShell: ShellContext = {
        project: {
          id: 1,
          team_ref: 'thanb',
          key: 'PM',
          name: 'Quản trị Dự án Toàn năng',
        } as unknown as ShellContext['project'],
        filteredProject: null,
        views: [],
        editor: {} as unknown as ShellContext['editor'],
        customFields: [],
        onOpenIssue: (id: number) => {
          openedIssueId = id;
        },
        onAddIssue: () => {},
        onChatWithAgent: () => {},
        onOpenWeKnoraChat: () => {},
      };

      const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
      await act(async () => {
        root.render(
          <AppRouterContext.Provider value={dummyRouter}>
            <ShellCtx.Provider value={mockShell}>
              <OpenOfficeWorkspaceView apiBaseUrl="" />
            </ShellCtx.Provider>
          </AppRouterContext.Provider>,
        );
      });
      await settle();

      const doc = dom.window.document;

      // 1. Initial small-screen render: inline rail is absent, drawer is closed, trigger button exists
      assert.equal(
        doc.querySelector('[data-testid="open-office-inspector-inline-rail"]'),
        null,
        'Inline inspector rail must not render stacked below floorplan on small screens',
      );
      assert.equal(
        doc.querySelector('[data-testid="open-office-inspector-drawer"]'),
        null,
        'Inspector drawer must be closed initially on small screens',
      );
      const openDrawerBtn = doc.querySelector<HTMLButtonElement>(
        '[data-testid="btn-open-inspector-drawer"]',
      );
      assert.ok(openDrawerBtn, 'Drawer trigger button must exist on small screens');

      // 2. Clicking an agent card inside gather-people-sidebar opens the right drawer
      const liveStrip = doc.querySelector('[data-testid="gather-people-sidebar"]');
      assert.ok(liveStrip, 'Live team strip must exist');
      const agentCards = liveStrip.querySelectorAll<HTMLElement>('[role="button"]');
      assert.ok(agentCards.length > 0, 'Live team strip must render clickable agent cards');

      await act(async () => {
        agentCards[0].click();
      });
      await settle();

      const drawerAfterAgent = doc.querySelector('[data-testid="open-office-inspector-drawer"]');
      assert.ok(drawerAfterAgent, 'Clicking agent card must open right-side inspector drawer');
      assert.equal(drawerAfterAgent.getAttribute('role'), 'dialog');
      assert.ok(
        drawerAfterAgent.querySelector('[data-testid="agent-live-inspector"]'),
        'Agent live inspector must render inside drawer',
      );
      assert.ok(
        drawerAfterAgent.querySelector('[data-testid="card-contract-composer"]'),
        'Quick contract composer must render inside drawer',
      );
      assert.ok(
        drawerAfterAgent.querySelector('[data-testid="pending-execution-queue"]'),
        'Pending execution queue must render inside drawer',
      );

      // 3. Clicking the drawer close button closes the drawer
      const closeBtn = Array.from(drawerAfterAgent.querySelectorAll<HTMLButtonElement>('button')).find(
        (btn) => btn.textContent?.trim() === 'Close',
      );
      assert.ok(closeBtn, 'Sheet close button must exist inside inspector drawer');
      await act(async () => {
        closeBtn.click();
      });
      await settle();
      assert.equal(
        doc.querySelector('[data-testid="open-office-inspector-drawer"]'),
        null,
        'Clicking Sheet close button must close inspector drawer',
      );

      // 4. Clicking a room zone opens the drawer in department mode
      const zoneEl = doc.querySelector<HTMLElement>('[data-testid="zone-sop_generic_7p"]');
      assert.ok(zoneEl, 'Room zone sop_generic_7p must exist');
      await act(async () => {
        zoneEl.click();
      });
      await settle();

      const drawerAfterZone = doc.querySelector('[data-testid="open-office-inspector-drawer"]');
      assert.ok(drawerAfterZone, 'Clicking room zone must open inspector drawer');
      assert.ok(
        drawerAfterZone.querySelector('[data-testid="department-live-inspector"]'),
        'Department live inspector must render inside drawer after selecting a zone',
      );

      const closeBtn2 = Array.from(drawerAfterZone.querySelectorAll<HTMLButtonElement>('button')).find(
        (btn) => btn.textContent?.trim() === 'Close',
      );
      assert.ok(closeBtn2);
      await act(async () => {
        closeBtn2.click();
      });
      await settle();
      assert.equal(doc.querySelector('[data-testid="open-office-inspector-drawer"]'), null);

      // 5. Clicking btn-quick-assign-focus re-opens the drawer with input-contract-title
      const quickAssignBtn = doc.querySelector<HTMLButtonElement>(
        '[data-testid="btn-quick-assign-focus"]',
      );
      assert.ok(quickAssignBtn, 'btn-quick-assign-focus must exist');
      await act(async () => {
        quickAssignBtn.click();
      });
      await act(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 90));
      });

      const drawerAfterQuickAssign = doc.querySelector('[data-testid="open-office-inspector-drawer"]');
      assert.ok(drawerAfterQuickAssign, 'btn-quick-assign-focus must re-open inspector drawer');
      assert.ok(
        drawerAfterQuickAssign.querySelector('[data-testid="input-contract-title"]'),
        'input-contract-title must be mounted inside drawer after quick assign focus',
      );

      // 6. Clicking link-active-issue in agent mode invokes onOpenIssue and closes the drawer
      const agentModeBtn = drawerAfterQuickAssign.querySelector<HTMLButtonElement>(
        '[data-testid="btn-inspect-agent-mode"]',
      );
      assert.ok(agentModeBtn, 'btn-inspect-agent-mode must exist inside drawer');
      await act(async () => {
        agentModeBtn.click();
      });
      await settle();

      const activeIssueLink = doc.querySelector<HTMLButtonElement>('[data-testid="link-active-issue"]');
      assert.ok(activeIssueLink, 'link-active-issue must exist in agent mode inside drawer');
      await act(async () => {
        activeIssueLink.click();
      });
      await settle();

      assert.equal(openedIssueId, 500, 'Clicking link-active-issue must invoke shellCtx.onOpenIssue');
      assert.equal(
        doc.querySelector('[data-testid="open-office-inspector-drawer"]'),
        null,
        'Opening active issue must close inspector drawer',
      );

      // Re-open drawer via trigger button, then resize to desktop
      await act(async () => {
        doc.querySelector<HTMLButtonElement>('[data-testid="btn-open-inspector-drawer"]')?.click();
      });
      await settle();
      assert.ok(doc.querySelector('[data-testid="open-office-inspector-drawer"]'));

      // 7. Resize to desktop (>= 1280px) closes drawer and restores inline rail
      await setSmallScreen(false);
      assert.equal(
        doc.querySelector('[data-testid="open-office-inspector-drawer"]'),
        null,
        'Resizing to desktop must close drawer',
      );
      const inlineRail = doc.querySelector('[data-testid="open-office-inspector-inline-rail"]');
      assert.ok(inlineRail, 'Inline inspector rail must be restored on desktop');
      assert.ok(
        inlineRail.querySelector('[data-testid="agent-live-inspector"]'),
        'Agent live inspector must render inside inline rail on desktop',
      );
    } finally {
      for (const [key, descriptor] of savedExtra.entries()) {
        if (descriptor) {
          Object.defineProperty(globalThis, key, descriptor);
        } else {
          Reflect.deleteProperty(globalThis, key);
        }
      }
    }
  });

  it('deduplicates room working counts, renders extra live sessions, uses clean tool bursts, and shows concurrent sessions in inspector', async () => {
    const telemetryState = {
      ...MOCK_STATE,
      contracts: [],
      needs_my_action: [],
      live_sessions_count: 2,
      pending_run_count: 3,
      stations: [
        {
          ...MOCK_STATE.stations[0],
          seat_id: 'seat-agy',
          zone_id: 'sop_coding_01',
          status: 'WORKING',
          tool_badge: 'run_command',
          doing_now: {
            summary: 'Auditing Pixel Office state',
            current_step: 'Đang xử lý hàng đợi tự động rất dài không được cắt thành tool burst',
            step_index: 42,
            total_steps: 42,
          },
          live_telemetry: {
            is_live_executing: true,
            active_tool: 'run_command',
            action_label: 'Check PG runs',
            focus_text: 'Auditing Pixel Office state',
            session_id: 'sess-primary-001',
            concurrent_count: 2,
            concurrent_sessions: [
              {
                session_id: 'sess-primary-001',
                active_tool: 'run_command',
                focus_text: 'Auditing Pixel Office state',
                age_sec: 2,
              },
              {
                session_id: 'sess-extra-002',
                active_tool: 'read_file',
                focus_text: 'Reading research docs',
                age_sec: 5,
              },
            ],
          },
        },
        {
          ...MOCK_STATE.stations[1],
          seat_id: 'seat-codex',
          zone_id: 'sop_coding_01',
          status: 'STANDBY',
          tool_badge: 'code',
          doing_now: {
            summary: 'Chờ chạy (1 lượt): [WKN] Rebuild',
            current_step: 'Đang chờ hàng đợi tự động (1 lượt chạy)',
          },
          live_telemetry: undefined,
        },
      ],
      colony_bees: [
        {
          bee_id: 'seat-agy',
          seat_id: 'seat-agy',
          conversation_id: 'sess-primary-001',
          tier: 'agent',
          agent_id: '@antigravity',
          username: 'antigravity',
          display_name: 'Antigravity',
          role: 'Engineer',
          zone_id: 'sop_coding_01',
          status: 'WORKING',
          project_key: 'PM',
        },
        {
          bee_id: 'live-sess-ext',
          seat_id: 'seat-agy',
          parent_bee_id: 'seat-agy',
          conversation_id: 'sess-extra-002',
          tier: 'agent',
          agent_id: '@antigravity-sess',
          username: 'antigravity·sess',
          display_name: 'Reading research docs',
          role: 'Live Session · read_file',
          zone_id: 'sop_research_01',
          status: 'WORKING',
          active_tool: 'read_file',
          project_key: 'PM',
        },
      ],
    };

    const prevFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/vibe/open-office/state')) {
        return new Response(JSON.stringify(telemetryState), { status: 200 });
      }
      return prevFetch(input, init);
    }) as typeof fetch;

    try {
      const { default: OpenOfficeWorkspaceView } = await import('./OpenOfficeWorkspaceView');
      await act(async () => {
        root.render(
          <AppRouterContext.Provider value={dummyRouter}>
            <OpenOfficeWorkspaceView apiBaseUrl="" />
          </AppRouterContext.Provider>,
        );
      });
      await settle();

      const doc = dom.window.document;
      const codingRoomBadge = doc.querySelector('[data-testid="pixel-room-status-sop_coding_01"]');
      assert.ok(codingRoomBadge, 'sop_coding_01 status badge must render');
      assert.equal(
        codingRoomBadge.textContent?.trim(),
        '⚡1',
        'Canonical station in colony_bees must NOT be double-counted',
      );

      const researchRoomBadge = doc.querySelector('[data-testid="pixel-room-status-sop_research_01"]');
      assert.ok(researchRoomBadge, 'Extra live session room must render status badge');
      assert.equal(researchRoomBadge.textContent?.trim(), '⚡1');

      const extraLiveNode = doc.querySelector('[data-testid="pixel-live-session-node-live-sess-ext"]');
      assert.ok(extraLiveNode, 'Extra concurrent live session node must render on stage');

      const toolBurst = doc.querySelector('[data-testid="pixel-tool-burst-seat-agy"]');
      assert.ok(toolBurst, 'Tool burst must render for working station');
      assert.ok(toolBurst.textContent?.includes('run_command'));
      assert.ok(!toolBurst.textContent?.includes('Đang xử lý'));

      const concBadge = doc.querySelector('[data-testid="badge-concurrent-seat-agy"]');
      assert.ok(concBadge && concBadge.textContent?.includes('×2'));

      const concList = doc.querySelector('[data-testid="inspector-concurrent-sessions"]');
      assert.ok(concList, 'Inspector must show concurrent live sessions list');

      // Select STANDBY station and verify accurate heading (not "Đang thực hiện")
      const standbyStation = doc.querySelector<HTMLElement>('[data-testid="station-seat-codex"]');
      assert.ok(standbyStation);
      await act(async () => {
        standbyStation.click();
      });
      await settle();
      const inspectorText = doc.querySelector('[data-testid="agent-live-inspector"]')?.textContent || '';
      assert.ok(inspectorText.includes('Trực lịch · Chờ chạy'), `Expected STANDBY heading, got: ${inspectorText}`);
    } finally {
      globalThis.fetch = prevFetch;
    }
  });
});
