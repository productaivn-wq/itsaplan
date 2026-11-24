import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import {
  ARCHITECTURAL_ROOM_SPECS,
  BEEHIVE_CELL_LAYOUT,
  computeBeeSlotInHexCell,
  computeDynamicBeehiveLayout,
  resolveCanonicalZoneId,
} from '../open-office/openOfficeConstants';
import BeehiveColonyLens from '../open-office/BeehiveColonyLens';
import {
  buildPixelBeeRects,
  paintPixelBeehiveStage,
} from '../open-office/pixelBeehiveEngine';
import type {
  OpenOfficeColonyBee,
  OpenOfficeContract,
  OpenOfficeStation,
  OpenOfficeZone,
} from '../types';

const TEST_ZONES: OpenOfficeZone[] = Object.values(ARCHITECTURAL_ROOM_SPECS).map((spec) => ({
  id: spec.canonicalId,
  sop_id: spec.sopId,
  uc_id: spec.ucCode,
  name: spec.viTitle,
  subtitle: spec.viSubtitle,
  is_spine: spec.isSpine,
  order: spec.order,
  visual_slot: spec.visualSlot,
  primary_skills: spec.primarySkills,
  grid: spec.stagePctRect,
  accent: 'border-border',
}));

const TEST_STATIONS: OpenOfficeStation[] = [
  {
    seat_id: 'seat-exec-queen',
    seat_type: 'FIXED',
    zone_id: 'sop_generic_7p',
    zone_name: 'Điều Phối & Vibe Working',
    coords: { x: 50, y: 20 },
    agent_id: 'agt-orchestrator',
    username: '@orchestrator',
    agent_name: 'Queen Orchestrator',
    role: 'Strategic Coordinator',
    account_label: 'AGT-P1',
    status: 'WORKING',
    activity_bubble: 'Điều phối đàn ong theo SOPRegistry',
    active_contract_ids: ['CTR-BEE-01'],
    capabilities: ['AOP', 'KahnDAG'],
    active_project_keys: ['PM'],
    live_telemetry: {
      is_live_executing: true,
      active_tool: 'run_kahn_dag',
      action_label: 'run_kahn_dag · step 2',
      step_index: 2,
    },
  },
  {
    seat_id: 'seat-dev-bee',
    seat_type: 'FIXED',
    zone_id: 'sop_coding_01',
    zone_name: 'Kỹ Thuật Phần Mềm & TDD',
    coords: { x: 80, y: 20 },
    agent_id: 'agt-codex',
    username: '@codex',
    agent_name: 'Coder Bee',
    role: 'Core Engineer',
    account_label: 'AGT-P2',
    status: 'WORKING',
    activity_bubble: 'Đang viết code TypeScript',
    active_contract_ids: ['CTR-BEE-01'],
    capabilities: ['TypeScript', 'React'],
    active_project_keys: ['PM'],
    doing_now: {
      summary: 'Triển khai BeehiveColonyLens',
      step_index: 3,
      total_steps: 5,
    },
  },
  {
    seat_id: 'seat-qa-guard',
    seat_type: 'FIXED',
    zone_id: 'sop_sec_audit_01',
    zone_name: 'Kiểm Toán Bảo Mật & QA',
    coords: { x: 15, y: 20 },
    agent_id: 'agt-qualitygate',
    username: '@qualitygate',
    agent_name: 'Guard Bee QA',
    role: 'QualityGate Auditor',
    account_label: 'AGT-DET',
    status: 'AWAITING_HITL',
    activity_bubble: 'Chờ duyệt cổng GW-SOD-01',
    active_contract_ids: ['CTR-BEE-HITL'],
    capabilities: ['QualityGate', 'SoD'],
    active_project_keys: ['PM'],
  },
  {
    seat_id: 'seat-research-idle',
    seat_type: 'FIXED',
    zone_id: 'sop_research_01',
    zone_name: 'Nghiên Cứu & Thị Trường',
    coords: { x: 20, y: 80 },
    agent_id: 'agt-research',
    username: '@research',
    agent_name: 'Scout Bee',
    role: 'WeKnora Researcher',
    account_label: 'AGT-P3',
    status: 'IDLE',
    activity_bubble: 'Sẵn sàng thu thập tri thức',
    active_contract_ids: [],
    capabilities: ['WeKnora'],
    active_project_keys: ['MHR'],
  },
  {
    seat_id: 'seat-lobby-bee',
    seat_type: 'FIXED',
    zone_id: 'unknown_zone_xyz',
    zone_name: 'Điều Phối & Vibe Working',
    coords: { x: 50, y: 50 },
    agent_id: 'agt-antigravity',
    username: '@antigravity',
    agent_name: 'Atrium Bee',
    role: 'Triage Router',
    account_label: 'AGT-P1',
    status: 'ACTIVE',
    activity_bubble: 'Trực ban tại sảnh',
    active_contract_ids: [],
    capabilities: ['Routing'],
    active_project_keys: ['PM'],
  },
];

const TEST_CONTRACTS: OpenOfficeContract[] = [
  {
    id: 'CTR-BEE-01',
    project_key: 'PM',
    title: 'Phối hợp xây dựng Tổ ong AI',
    domain: 'AI Engineering',
    lead_agent_id: 'agt-orchestrator',
    lead_agent_name: 'Queen Orchestrator',
    support_agent_ids: ['agt-codex'],
    status: 'IN_PROGRESS',
    estimated_minutes: 25,
    estimated_tokens: 4500,
  },
  {
    id: 'CTR-BEE-HITL',
    project_key: 'PM',
    title: 'Nghiệm thu cổng chất lượng GW-SOD-01',
    domain: 'QualityGate',
    lead_agent_id: 'agt-qualitygate',
    lead_agent_name: 'Guard Bee QA',
    support_agent_ids: [],
    status: 'AWAITING_HITL',
    estimated_minutes: 10,
    estimated_tokens: 2000,
  },
  {
    id: 'CTR-BEE-DONE',
    project_key: 'PM',
    title: 'Hợp đồng đã hoàn tất (không vẽ đường bay)',
    domain: 'Archive',
    lead_agent_id: 'agt-orchestrator',
    lead_agent_name: 'Queen Orchestrator',
    support_agent_ids: ['agt-research'],
    status: 'DONE',
    estimated_minutes: 15,
    estimated_tokens: 1800,
  },
];

describe('BeehiveColonyLens Geometry & Colony Visualization Tests (53.ACT.603)', () => {
  let dom: JSDOM;
  let root: Root;
  let originalGlobals: Map<string, PropertyDescriptor | undefined>;

  const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 35)));

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
      Element: dom.window.Element,
      HTMLElement: dom.window.HTMLElement,
      HTMLButtonElement: dom.window.HTMLButtonElement,
      SVGElement: dom.window.SVGElement,
      Event: dom.window.Event,
      MouseEvent: dom.window.MouseEvent,
      KeyboardEvent: dom.window.KeyboardEvent,
      IS_REACT_ACT_ENVIRONMENT: true,
    };
    originalGlobals = new Map(
      Object.keys(globals).map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]),
    );
    for (const [k, v] of Object.entries(globals)) {
      Object.defineProperty(globalThis, k, { configurable: true, value: v });
    }
    root = createRoot(dom.window.document.getElementById('root')!);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    dom.window.close();
    for (const [k, desc] of originalGlobals.entries()) {
      if (desc) Object.defineProperty(globalThis, k, desc);
      else delete (globalThis as any)[k];
    }
  });

  it('TC-603-01 & TC-603-02 & TC-603-08 & TC-603-09: computes non-overlapping 8 hex cells and bounded bee slots', () => {
    const canonicalIds = Object.keys(ARCHITECTURAL_ROOM_SPECS);
    assert.equal(canonicalIds.length, 8);
    for (const id of canonicalIds) {
      assert.ok(BEEHIVE_CELL_LAYOUT[id], `BEEHIVE_CELL_LAYOUT must include ${id}`);
    }

    const centers = canonicalIds.map((id) => BEEHIVE_CELL_LAYOUT[id]);
    for (let i = 0; i < centers.length; i++) {
      for (let j = i + 1; j < centers.length; j++) {
        const dist = Math.hypot(centers[i].cx - centers[j].cx, centers[i].cy - centers[j].cy);
        assert.ok(dist >= 140, `Hex cells ${i} and ${j} too close (${dist.toFixed(1)}px)`);
      }
    }

    const slots = Array.from({ length: 8 }, (_, idx) =>
      computeBeeSlotInHexCell({ cx: 480, cy: 270 }, 92, idx, 8),
    );
    for (let i = 0; i < slots.length; i++) {
      const radial = Math.hypot(slots[i].x - 480, slots[i].y - 270);
      assert.ok(radial <= 92 * 0.75, `Slot ${i} exceeds hex safe inner radius`);
      for (let j = i + 1; j < slots.length; j++) {
        const d = Math.hypot(slots[i].x - slots[j].x, slots[i].y - slots[j].y);
        assert.ok(d >= 18, `Bee slots ${i} and ${j} overlap (${d.toFixed(1)}px)`);
      }
    }

    // 2-bee room slots sit side-by-side in the horizontal center band, clear of the top plaque
    const twoSlot0 = computeBeeSlotInHexCell({ cx: 724, cy: 104 }, 80, 0, 2);
    const twoSlot1 = computeBeeSlotInHexCell({ cx: 724, cy: 104 }, 80, 1, 2);
    assert.ok(Math.abs(twoSlot0.x - twoSlot1.x) >= 48, '2-bee room slots must separate horizontally');
    assert.ok(Math.abs(twoSlot0.y - 104) <= 10 && Math.abs(twoSlot1.y - 104) <= 10);
    assert.ok(twoSlot0.y > 48 && twoSlot1.y > 48, '2-bee slots must stay below top rim plaque');

    // Adversarial boundary: negative index and zero total
    const clamped = computeBeeSlotInHexCell({ cx: 480, cy: 270 }, 92, -3, 0);
    assert.ok(Number.isFinite(clamped.x) && Number.isFinite(clamped.y));
    assert.ok(Math.hypot(clamped.x - 480, clamped.y - 270) <= 92);

    // Adversarial unknown zone fallback
    assert.equal(resolveCanonicalZoneId('unknown_zone_xyz'), 'sop_generic_7p');
  });

  it('TC-603-03 & TC-603-04: renders 8 hex cells, bee nodes, verified flights, and Guard-Bee HITL callbacks', async () => {
    let selectedSeat = '';
    let selectedZone = '';
    let reviewedContract = '';

    await act(async () => {
      root.render(
        <BeehiveColonyLens
          zones={TEST_ZONES}
          stations={TEST_STATIONS}
          contracts={TEST_CONTRACTS}
          needsMyAction={[TEST_CONTRACTS[1]]}
          selectedStationId="seat-exec-queen"
          selectedZoneId={null}
          selectedProjectFilter="ALL"
          isMotionActive={true}
          locale="vi"
          onSelectStation={(s) => {
            selectedSeat = s;
          }}
          onSelectZone={(z) => {
            selectedZone = z;
          }}
          onOpenQuickReview={(cid) => {
            reviewedContract = cid;
          }}
          onQuickAssign={() => {}}
        />,
      );
    });
    await settle();

    const lens = dom.window.document.querySelector('[data-testid="open-office-beehive-lens"]');
    assert.ok(lens, 'open-office-beehive-lens must mount');

    const cells = dom.window.document.querySelectorAll('[data-testid^="beehive-cell-"]');
    assert.equal(cells.length, 8, 'All 8 canonical honeycomb cells must render');

    const bees = dom.window.document.querySelectorAll('[data-testid^="bee-node-"]');
    assert.equal(bees.length, TEST_STATIONS.length, 'Each station must render one bee node');

    const activeFlights = dom.window.document.querySelectorAll('[data-testid^="beehive-flight-"]');
    assert.equal(activeFlights.length, 1, 'Only active non-DONE Lead->Support flight CTR-BEE-01 must render');
    assert.ok(
      dom.window.document.querySelector('[data-testid="beehive-flight-CTR-BEE-01"]'),
      'CTR-BEE-01 flight path must exist',
    );
    assert.equal(
      dom.window.document.querySelector('[data-testid="beehive-flight-CTR-BEE-DONE"]'),
      null,
      'DONE contract must never emit synthetic flight line',
    );

    const devBee = dom.window.document.querySelector<HTMLElement>('[data-testid="bee-node-seat-dev-bee"]');
    assert.ok(devBee);
    await act(async () => {
      devBee.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
    await settle();
    assert.equal(selectedSeat, 'seat-dev-bee');

    const aiCell = dom.window.document.querySelector<HTMLElement>('[data-testid="beehive-cell-sop_coding_01"]');
    assert.ok(aiCell);
    await act(async () => {
      aiCell.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
    await settle();
    assert.equal(selectedZone, 'sop_coding_01');

    const reviewBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-beehive-review-CTR-BEE-HITL"]',
    );
    assert.ok(reviewBtn, 'Guard-Bee HITL quick review button must render');
    await act(async () => {
      reviewBtn.click();
    });
    await settle();
    assert.equal(reviewedContract, 'CTR-BEE-HITL');
  });

  it('TC-603-10 & TC-603-11: emits zero flight lines when contracts are empty/DONE or filtered out', async () => {
    await act(async () => {
      root.render(
        <BeehiveColonyLens
          zones={TEST_ZONES}
          stations={TEST_STATIONS}
          contracts={TEST_CONTRACTS}
          needsMyAction={[]}
          selectedStationId={null}
          selectedZoneId={null}
          selectedProjectFilter="MHR"
          isMotionActive={false}
          locale="en"
          onSelectStation={() => {}}
          onSelectZone={() => {}}
          onOpenQuickReview={() => {}}
          onQuickAssign={() => {}}
        />,
      );
    });
    await settle();

    assert.equal(
      dom.window.document.querySelectorAll('[data-testid^="beehive-flight-"]').length,
      0,
      'Project filter MHR must exclude PM-only foraging flights',
    );

    await act(async () => {
      root.render(
        <BeehiveColonyLens
          zones={TEST_ZONES}
          stations={TEST_STATIONS}
          contracts={[TEST_CONTRACTS[2]]}
          needsMyAction={[]}
          selectedStationId={null}
          selectedZoneId={null}
          selectedProjectFilter="ALL"
          isMotionActive={false}
          locale="en"
          onSelectStation={() => {}}
          onSelectZone={() => {}}
          onOpenQuickReview={() => {}}
          onQuickAssign={() => {}}
        />,
      );
    });
    await settle();

    assert.equal(
      dom.window.document.querySelectorAll('[data-testid^="beehive-flight-"]').length,
      0,
      'DONE-only contracts must emit 0 foraging flight paths',
    );
  });

  it('TC-603-05: toggles between Honeycomb SVG Stage and embedded Colony AgentTree', async () => {
    await act(async () => {
      root.render(
        <BeehiveColonyLens
          zones={TEST_ZONES}
          stations={TEST_STATIONS}
          contracts={TEST_CONTRACTS}
          needsMyAction={[TEST_CONTRACTS[1]]}
          selectedStationId="seat-exec-queen"
          selectedZoneId={null}
          selectedProjectFilter="ALL"
          isMotionActive={true}
          locale="vi"
          onSelectStation={() => {}}
          onSelectZone={() => {}}
          onOpenQuickReview={() => {}}
          onQuickAssign={() => {}}
        />,
      );
    });
    await settle();

    assert.ok(dom.window.document.querySelector('[data-testid="beehive-svg-stage"]'));
    assert.equal(dom.window.document.querySelector('[data-testid="beehive-agent-tree"]'), null);

    const treeBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-beehive-view-tree"]',
    );
    assert.ok(treeBtn, 'Tree mode toggle button must exist');
    await act(async () => {
      treeBtn.click();
    });
    await settle();

    const treeContainer = dom.window.document.querySelector('[data-testid="beehive-agent-tree"]');
    assert.ok(treeContainer, 'Embedded Colony AgentTree must mount');
    assert.ok(treeContainer.textContent?.includes('Queen Orchestrator'));

    const combBtn = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="btn-beehive-view-comb"]',
    );
    assert.ok(combBtn);
    await act(async () => {
      combBtn.click();
    });
    await settle();

    assert.ok(dom.window.document.querySelector('[data-testid="beehive-svg-stage"]'));
  });

  it('TC-603-13 & TC-603-14: renders 960x560 pixelated canvas, atlas + procedural pixel props, and crisp 16-bit pixel bee sprites with zero vector ellipses', async () => {
    await act(async () => {
      root.render(
        <BeehiveColonyLens
          zones={TEST_ZONES}
          stations={TEST_STATIONS}
          contracts={TEST_CONTRACTS}
          needsMyAction={[TEST_CONTRACTS[1]]}
          selectedStationId="seat-exec-queen"
          selectedZoneId="sop_generic_7p"
          selectedProjectFilter="ALL"
          isMotionActive={true}
          locale="vi"
          onSelectStation={() => {}}
          onSelectZone={() => {}}
          onOpenQuickReview={() => {}}
          onQuickAssign={() => {}}
        />,
      );
    });
    await settle();

    const pixelCanvas = dom.window.document.querySelector<HTMLCanvasElement>(
      '[data-testid="beehive-pixel-canvas"]',
    );
    assert.ok(pixelCanvas, 'beehive-pixel-canvas must render on stage');
    assert.equal(pixelCanvas.width, 960);
    assert.equal(pixelCanvas.height, 560);
    assert.equal(pixelCanvas.style.imageRendering, 'pixelated');

    const ellipses = dom.window.document.querySelectorAll(
      '[data-testid="open-office-beehive-lens"] ellipse',
    );
    assert.equal(ellipses.length, 0, '16-bit Beehive lens must contain zero vector <ellipse> shapes');

    for (const st of TEST_STATIONS) {
      const sprite = dom.window.document.querySelector<SVGElement>(
        `[data-testid="pixel-bee-sprite-${st.seat_id}"]`,
      );
      assert.ok(sprite, `Expected pixel-bee-sprite-${st.seat_id} to render`);
      assert.equal(sprite.getAttribute('shape-rendering'), 'crispEdges');
      const rects = sprite.querySelectorAll('rect');
      assert.ok(
        rects.length >= 18,
        `Expected >= 18 crisp pixel rects for ${st.seat_id}, got ${rects.length}`,
      );
    }

    const queenFrame0 = JSON.stringify(buildPixelBeeRects('queen', 0, true));
    const queenFrame1 = JSON.stringify(buildPixelBeeRects('queen', 1, true));
    assert.notEqual(queenFrame0, queenFrame1, 'Wing flap frames 0 and 1 must produce distinct pixel rects');

    let fillRectCalls = 0;
    let drawImageCalls = 0;
    const mockCtx: any = {
      imageSmoothingEnabled: true,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1,
      fillRect: () => {
        fillRectCalls += 1;
      },
      clearRect: () => {},
      drawImage: () => {
        drawImageCalls += 1;
      },
      save: () => {},
      restore: () => {},
    };

    paintPixelBeehiveStage(mockCtx as CanvasRenderingContext2D, {
      selectedCanonicalZone: 'sop_generic_7p',
      workingCountByRoom: { sop_generic_7p: 1, sop_coding_01: 1 },
      atlas: null,
    });
    assert.equal(mockCtx.imageSmoothingEnabled, false, 'Canvas smoothing must be disabled for 16-bit crisp pixels');
    assert.ok(fillRectCalls >= 250, `Expected >= 250 pixel fillRect calls in offline mode, got ${fillRectCalls}`);
    assert.equal(drawImageCalls, 0, 'Offline fallback must not call drawImage when atlas is null');

    fillRectCalls = 0;
    drawImageCalls = 0;
    const fakeAtlas = { complete: true, naturalWidth: 1024 } as HTMLImageElement;
    paintPixelBeehiveStage(mockCtx as CanvasRenderingContext2D, {
      selectedCanonicalZone: 'sop_generic_7p',
      workingCountByRoom: { sop_generic_7p: 1, sop_coding_01: 1 },
      atlas: fakeAtlas,
    });
    assert.ok(drawImageCalls >= 8, `Expected >= 8 LIMEZU_SPR atlas props blitted across 8 chambers, got ${drawImageCalls}`);
  });

  it('TC-603-15 & TC-603-16: renders both Main Agents and Spawned Subagents with parent->subagent tethers, cyber-scout sprites, and 3-level AgentTree', async () => {
    const colonyBees: OpenOfficeColonyBee[] = [
      {
        bee_id: 'main-live-agy',
        seat_id: 'seat-dev-bee',
        conversation_id: 'conv-main-1',
        parent_bee_id: 'seat-exec-queen',
        tier: 'agent',
        agent_id: '@agy-live',
        username: 'agy·live',
        display_name: 'Antigravity Session',
        role: 'Main Agent · edit_file',
        zone_id: 'sop_coding_01',
        status: 'WORKING',
        active_tool: 'edit_file',
        action_label: 'Refactor beehive canvas',
        project_key: 'PM',
      },
      {
        bee_id: 'sub-research-1',
        seat_id: 'seat-research-idle',
        conversation_id: 'conv-sub-1',
        parent_bee_id: 'main-live-agy',
        parent_conv_id: 'conv-main-1',
        tier: 'subagent',
        agent_id: '@sub-1',
        username: '↳sub·r1',
        display_name: 'Codebase Scout Bee',
        role: 'Subagent Scout · read_file',
        zone_id: 'sop_research_01',
        status: 'WORKING',
        active_tool: 'read_file',
        action_label: 'Scan WeKnora symbols',
        project_key: 'PM',
      },
      {
        bee_id: 'sub-qa-2',
        seat_id: 'seat-qa-guard',
        conversation_id: 'conv-sub-2',
        parent_bee_id: 'seat-dev-bee',
        tier: 'subagent',
        agent_id: '@sub-2',
        username: '↳sub·qa2',
        display_name: 'Verification Runner Bee',
        role: 'Subagent Scout · run_command',
        zone_id: 'sop_sec_audit_01',
        status: 'WORKING',
        active_tool: 'run_command',
        action_label: 'Run bun test',
        project_key: 'PM',
      },
      {
        // Adversarial orphan subagent: missing parent and unknown zone_id
        bee_id: 'sub-orphan-3',
        seat_id: null,
        conversation_id: 'conv-sub-orphan',
        parent_bee_id: 'nonexistent-parent-999',
        tier: 'subagent',
        agent_id: '@sub-orphan',
        username: '↳sub·orp',
        display_name: 'Orphan Scout Bee',
        role: 'Subagent Scout · idle',
        zone_id: 'unknown_xyz',
        status: 'IDLE',
        project_key: 'PM',
      },
    ];

    let selectedSeat = '';
    await act(async () => {
      root.render(
        <BeehiveColonyLens
          zones={TEST_ZONES}
          stations={TEST_STATIONS}
          colonyBees={colonyBees}
          contracts={TEST_CONTRACTS}
          needsMyAction={[TEST_CONTRACTS[1]]}
          selectedStationId="seat-exec-queen"
          selectedZoneId={null}
          selectedProjectFilter="ALL"
          isMotionActive={true}
          locale="en"
          onSelectStation={(s) => {
            selectedSeat = s;
          }}
          onSelectZone={() => {}}
          onOpenQuickReview={() => {}}
          onQuickAssign={() => {}}
        />,
      );
    });
    await settle();

    const subCountBadge = dom.window.document.querySelector('[data-testid="beehive-subagent-count"]');
    assert.ok(subCountBadge, 'beehive-subagent-count badge must render');
    assert.ok(subCountBadge.textContent?.includes('3'), `Expected 3 subagents in badge, got ${subCountBadge.textContent}`);

    // Both Main Agents and all 3 Spawned Subagents must render as crisp pixel bees
    for (const extraBee of ['main-live-agy', 'sub-research-1', 'sub-qa-2', 'sub-orphan-3']) {
      const node = dom.window.document.querySelector(`[data-testid="bee-node-${extraBee}"]`);
      assert.ok(node, `Expected bee-node-${extraBee} to render`);
      const sprite = dom.window.document.querySelector(`[data-testid="pixel-bee-sprite-${extraBee}"]`);
      assert.ok(sprite, `Expected pixel-bee-sprite-${extraBee} to render`);
    }

    // Linked subagents must emit valid Parent -> Subagent tether paths (with zero NaN)
    const link1 = dom.window.document.querySelector<SVGPathElement>('[data-testid="beehive-subagent-link-sub-research-1"]');
    const link2 = dom.window.document.querySelector<SVGPathElement>('[data-testid="beehive-subagent-link-sub-qa-2"]');
    assert.ok(link1 && link2, 'Expected parent->subagent tether paths for linked subagents');
    assert.ok(!String(link1.getAttribute('d')).includes('NaN'));
    assert.ok(!String(link2.getAttribute('d')).includes('NaN'));

    // Orphan subagent without matching parent must not crash or emit broken NaN link
    const orphanLink = dom.window.document.querySelector('[data-testid="beehive-subagent-link-sub-orphan-3"]');
    assert.equal(orphanLink, null);

    // Clicking a subagent selects its resolved room/parent station cleanly
    const subResearchNode = dom.window.document.querySelector<HTMLElement>('[data-testid="bee-node-sub-research-1"]');
    assert.ok(subResearchNode);
    await act(async () => {
      subResearchNode.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
    await settle();
    assert.equal(selectedSeat, 'seat-research-idle');

    // Toggle to Colony Tree and verify subagent nests inside the tree hierarchy
    const treeBtn = dom.window.document.querySelector<HTMLButtonElement>('[data-testid="btn-beehive-view-tree"]');
    assert.ok(treeBtn);
    await act(async () => {
      treeBtn.click();
    });
    await settle();
    const treeEl = dom.window.document.querySelector('[data-testid="beehive-agent-tree"]');
    assert.ok(treeEl?.textContent?.includes('Codebase Scout Bee'), 'Subagent must appear inside Colony AgentTree');
  });

  it('computes non-overlapping dynamic beehive layouts for N = 5 and N = 10 SOP rooms', () => {
    for (const N of [5, 10]) {
      const rooms = [
        { canonicalId: 'sop_generic_7p', isSpine: true },
        ...Array.from({ length: N - 1 }, (_, i) => ({
          canonicalId: `sop_dyn_${i + 1}`,
          isSpine: false,
        })),
      ];
      const layout = computeDynamicBeehiveLayout(rooms);
      const keys = Object.keys(layout);
      assert.equal(keys.length, N, `Expected ${N} cells for N=${N}`);

      const queen = layout['sop_generic_7p'];
      assert.ok(queen, 'Queen cell sop_generic_7p must exist');
      assert.equal(queen.cx, 480);
      assert.equal(queen.cy, 280);
      assert.equal(queen.tier, 'queen');

      const cells = Object.values(layout);
      for (const c of cells) {
        assert.ok(
          c.cx > 0 && c.cx < 960 && c.cy > 0 && c.cy < 560 && c.radius >= 50,
          `Cell ${c.canonicalId} out of bounds or radius < 50: ${JSON.stringify(c)}`,
        );
      }
      for (let i = 0; i < cells.length; i += 1) {
        for (let j = i + 1; j < cells.length; j += 1) {
          const a = cells[i];
          const b = cells[j];
          const dist = Math.hypot(a.cx - b.cx, a.cy - b.cy);
          const minDist = Math.min(a.radius, b.radius) * 1.35;
          assert.ok(
            dist >= minDist,
            `Overlap between ${a.canonicalId} and ${b.canonicalId} for N=${N}: dist=${dist} < ${minDist}`,
          );
        }
      }
    }
  });
});
