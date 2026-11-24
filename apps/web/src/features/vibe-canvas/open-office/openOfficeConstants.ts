import * as React from 'react';
import type {
  OpenOfficeContract,
  OpenOfficeDepartmentDossier,
  OpenOfficeStation,
  OpenOfficeZone,
  OpenOfficeZoneHexCell,
} from '../types';

export type OpenOfficeLens = 'blueprint' | 'bees' | 'fleet' | 'swarm';
export type OpenOfficeLocale = 'vi' | 'en';

export function normalizeSopZoneKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export const CANONICAL_ZONE_ALIAS_MAP: Record<string, string> = {
  // Canonical SOPRegistry zone keys
  sop_generic_7p: 'sop_generic_7p',
  sop_coding_01: 'sop_coding_01',
  sop_sec_audit_01: 'sop_sec_audit_01',
  sop_research_01: 'sop_research_01',
  sop_analytics_01: 'sop_analytics_01',
  sop_strategy_01: 'sop_strategy_01',
  sop_legal_01: 'sop_legal_01',
  sop_operations_01: 'sop_operations_01',
  // Legacy corporate & fixture zone aliases -> SOP keys
  'zone-ba-test': 'sop_sec_audit_01',
  ba_tester: 'sop_sec_audit_01',
  'zone-exec': 'sop_generic_7p',
  exec_hq: 'sop_generic_7p',
  'zone-ai-dev': 'sop_coding_01',
  ai_dev: 'sop_coding_01',
  'zone-hcns': 'sop_legal_01',
  hr_admin: 'sop_legal_01',
  hr_ops: 'sop_legal_01',
  'zone-commons': 'sop_generic_7p',
  central_lobby: 'sop_generic_7p',
  'zone-meeting': 'sop_strategy_01',
  meeting_room: 'sop_strategy_01',
  war_room: 'sop_strategy_01',
  'zone-training': 'sop_research_01',
  training_hub: 'sop_research_01',
  academy: 'sop_research_01',
  'zone-business': 'sop_analytics_01',
  business_ops: 'sop_analytics_01',
  commercial: 'sop_analytics_01',
};

export function resolveCanonicalZoneId(
  rawZoneId?: string | null,
  activeZones?: Array<{ id: string; sop_id?: string; is_spine?: boolean }>,
): string {
  const spineId =
    activeZones?.find((z) => z.is_spine)?.id ||
    activeZones?.[0]?.id ||
    'sop_generic_7p';
  const trimmed = String(rawZoneId || '').trim();
  if (!trimmed) return spineId;

  if (activeZones && activeZones.length > 0) {
    const exactMatch = activeZones.find(
      (z) =>
        z.id === trimmed ||
        (z.sop_id && z.sop_id.toLowerCase() === trimmed.toLowerCase()) ||
        normalizeSopZoneKey(z.id) === normalizeSopZoneKey(trimmed),
    );
    if (exactMatch) return exactMatch.id;
  }

  const low = trimmed.toLowerCase();
  if (CANONICAL_ZONE_ALIAS_MAP[trimmed]) return CANONICAL_ZONE_ALIAS_MAP[trimmed];
  if (CANONICAL_ZONE_ALIAS_MAP[low]) return CANONICAL_ZONE_ALIAS_MAP[low];

  const normalized = normalizeSopZoneKey(trimmed);
  if (CANONICAL_ZONE_ALIAS_MAP[normalized]) return CANONICAL_ZONE_ALIAS_MAP[normalized];
  if (normalized.startsWith('sop_')) return normalized;

  return spineId;
}

export interface ArchitecturalRoomSpec {
  canonicalId: string;
  defaultZoneId: string;
  sopId: string;
  ucCode: string;
  colSpanClass: string;
  order: number;
  viTitle: string;
  enTitle: string;
  viSubtitle: string;
  enSubtitle: string;
  primarySkills: string[];
  visualSlot: string;
  isSpine: boolean;
  /** Bounds in percentage (0..100) of 960x560 stage for collision-free pixel grid */
  stagePctRect: { x: number; y: number; w: number; h: number };
  hexCell?: OpenOfficeZoneHexCell;
}

const DEFAULT_VISUAL_SLOT_CYCLE = [
  'soan',
  'dieu',
  'trinh',
  'sanh',
  'tracuu',
  'hop',
  'thugian',
  'morong',
] as const;

export const ARCHITECTURAL_ROOM_SPECS: Record<string, ArchitecturalRoomSpec> = {
  sop_sec_audit_01: {
    canonicalId: 'sop_sec_audit_01',
    defaultZoneId: 'sop_sec_audit_01',
    sopId: 'SOP-SEC-AUDIT-01',
    ucCode: 'SOP-SEC-AUDIT-01',
    colSpanClass: 'xl:col-span-4',
    order: 1,
    viTitle: 'Kiểm Toán Bảo Mật & QA',
    enTitle: 'Security Audit & QualityGate',
    viSubtitle: 'Kiểm toán bảo mật SAST, Chroma/REA & kiểm định EAI >= 0.98',
    enSubtitle: 'Zero-Trust SAST, Epistemic Hygiene & QualityGate',
    primarySkills: ['ChomSkill', 'QualityGate', 'PermissionMatrix', 'EngineeringForensicsKit'],
    visualSlot: 'soan',
    isSpine: false,
    stagePctRect: { x: 0, y: 0, w: 33, h: 35 },
  },
  sop_strategy_01: {
    canonicalId: 'sop_strategy_01',
    defaultZoneId: 'sop_strategy_01',
    sopId: 'SOP-STRATEGY-01',
    ucCode: 'SOP-STRATEGY-01',
    colSpanClass: 'xl:col-span-4',
    order: 2,
    viTitle: 'Chiến Lược & Kiến Trúc',
    enTitle: 'Strategy & Product Arch',
    viSubtitle: 'Chiến lược 7 chân trời, BMC, OKR & kiến trúc 6-phase IPO',
    enSubtitle: '7-Horizon Strategy, BMC, OKR & Product Architecture',
    primarySkills: ['StrategyToolkit', 'ProductArchitectureKit', 'BPMNArchitect'],
    visualSlot: 'dieu',
    isSpine: false,
    stagePctRect: { x: 33, y: 0, w: 33, h: 35 },
  },
  sop_coding_01: {
    canonicalId: 'sop_coding_01',
    defaultZoneId: 'sop_coding_01',
    sopId: 'SOP-CODING-01',
    ucCode: 'SOP-CODING-01',
    colSpanClass: 'xl:col-span-4',
    order: 3,
    viTitle: 'Kỹ Thuật Phần Mềm & TDD',
    enTitle: 'Software Engineering & TDD',
    viSubtitle: 'Đặc tả UTOP, nhánh worktree cô lập & Iron Law of TDD',
    enSubtitle: 'UTOP Specs, Isolated Worktrees & Iron Law of TDD',
    primarySkills: ['UCBDDManager', 'QualityGate', 'UIUXProMax', 'TaskManager'],
    visualSlot: 'trinh',
    isSpine: false,
    stagePctRect: { x: 66, y: 0, w: 34, h: 35 },
  },
  sop_generic_7p: {
    canonicalId: 'sop_generic_7p',
    defaultZoneId: 'sop_generic_7p',
    sopId: 'SOP-GENERIC-7P',
    ucCode: 'SOP-GENERIC-7P',
    colSpanClass: 'xl:col-span-12',
    order: 4,
    viTitle: 'Điều Phối & Vibe Working',
    enTitle: 'Core Spine & Vibe Working',
    viSubtitle: 'Trục vòng đời 7 pha tổng quát, điều phối đa tác nhân & cổng SoD',
    enSubtitle: 'Universal 7-Phase Spine, Multi-Agent Dispatch & SoD',
    primarySkills: ['TaskManager', 'DocumentOrganizer', 'WeKnora', 'QualityGate'],
    visualSlot: 'sanh',
    isSpine: true,
    stagePctRect: { x: 0, y: 35, w: 100, h: 30 },
  },
  sop_research_01: {
    canonicalId: 'sop_research_01',
    defaultZoneId: 'sop_research_01',
    sopId: 'SOP-RESEARCH-01',
    ucCode: 'SOP-RESEARCH-01',
    colSpanClass: 'xl:col-span-3',
    order: 5,
    viTitle: 'Nghiên Cứu & Thị Trường',
    enTitle: 'Deep Research & Market Intel',
    viSubtitle: 'Nghiên cứu chuyên sâu, thẩm định trích dẫn & bộ nhớ WeKnora',
    enSubtitle: 'Deep Research, Citation Audit & WeKnora Memory',
    primarySkills: ['ResearchSkill', 'MarketResearchKit', 'WeKnora', 'DocumentCraft'],
    visualSlot: 'tracuu',
    isSpine: false,
    stagePctRect: { x: 0, y: 65, w: 25, h: 35 },
  },
  sop_analytics_01: {
    canonicalId: 'sop_analytics_01',
    defaultZoneId: 'sop_analytics_01',
    sopId: 'SOP-ANALYTICS-01',
    ucCode: 'SOP-ANALYTICS-01',
    colSpanClass: 'xl:col-span-3',
    order: 6,
    viTitle: 'Phân Tích Dữ Liệu & BI',
    enTitle: 'Data & Business Analytics',
    viSubtitle: 'Phân tích dữ liệu 5 tầng, KPI, EVM & trực quan hóa Highcharts',
    enSubtitle: '5-Tier Data & 3-Tier Business Analytics Intelligence',
    primarySkills: ['DataAnalysisKit', 'BusinessAnalyticsKit', 'DocumentCraft'],
    visualSlot: 'hop',
    isSpine: false,
    stagePctRect: { x: 25, y: 65, w: 25, h: 35 },
  },
  sop_legal_01: {
    canonicalId: 'sop_legal_01',
    defaultZoneId: 'sop_legal_01',
    sopId: 'SOP-LEGAL-01',
    ucCode: 'SOP-LEGAL-01',
    colSpanClass: 'xl:col-span-3',
    order: 7,
    viTitle: 'Pháp Lý & Tuân Thủ',
    enTitle: 'Legal Ops & Compliance',
    viSubtitle: 'Rà soát NDA, hợp đồng, Nghị định 13/GDPR & ma trận phân quyền',
    enSubtitle: 'NDA Triage, Contract Redlines & Decree 13 / GDPR',
    primarySkills: ['LegalOpsKit', 'PermissionMatrix', 'QualityGate'],
    visualSlot: 'thugian',
    isSpine: false,
    stagePctRect: { x: 50, y: 65, w: 25, h: 35 },
  },
  sop_operations_01: {
    canonicalId: 'sop_operations_01',
    defaultZoneId: 'sop_operations_01',
    sopId: 'SOP-OPERATIONS-01',
    ucCode: 'SOP-OPERATIONS-01',
    colSpanClass: 'xl:col-span-3',
    order: 8,
    viTitle: 'Vận Hành, Đa Kênh & DR',
    enTitle: 'Operations, Comms & DR',
    viSubtitle: 'Điều phối đa kênh OmniCommunication, 5 vùng MECE & Tri-Sync DR',
    enSubtitle: 'Omnichannel Comms, 5-Zone MECE & Tri-Sync DR',
    primarySkills: ['OmniCommunication', 'DocumentOrganizer', 'DisasterRecoveryKit'],
    visualSlot: 'morong',
    isSpine: false,
    stagePctRect: { x: 75, y: 65, w: 25, h: 35 },
  },
};

export function buildDynamicRoomSpecs(
  zones?: OpenOfficeZone[],
  departments?: OpenOfficeDepartmentDossier[],
): ArchitecturalRoomSpec[] {
  const deptByKey = new Map<string, OpenOfficeDepartmentDossier>();
  for (const d of departments || []) {
    const key = resolveCanonicalZoneId(d.zone_id || d.id, zones);
    deptByKey.set(key, d);
    if (d.zone_id) deptByKey.set(d.zone_id, d);
    if (d.id) deptByKey.set(d.id, d);
  }

  const sourceList: Array<{ z?: OpenOfficeZone; d?: OpenOfficeDepartmentDossier; rawId: string }> =
    zones && zones.length > 0
      ? zones.map((z) => {
          const cid = resolveCanonicalZoneId(z.id, zones);
          return { z, d: deptByKey.get(z.id) || deptByKey.get(cid), rawId: z.id };
        })
      : departments && departments.length > 0
        ? departments.map((d) => ({ d, rawId: d.zone_id || d.id || 'sop_generic_7p' }))
        : Object.values(ARCHITECTURAL_ROOM_SPECS).map((spec) => ({ rawId: spec.canonicalId }));

  const seen = new Set<string>();
  const specs: ArchitecturalRoomSpec[] = [];

  sourceList.forEach((entry, idx) => {
    const canonicalId = resolveCanonicalZoneId(entry.rawId, zones);
    if (seen.has(canonicalId)) return;
    seen.add(canonicalId);

    const staticSpec = ARCHITECTURAL_ROOM_SPECS[canonicalId];
    const z = entry.z;
    const d = entry.d;
    const sopId =
      z?.sop_id ||
      d?.sop_id ||
      z?.use_case_id ||
      z?.uc_id ||
      d?.uc_id ||
      staticSpec?.sopId ||
      canonicalId.toUpperCase().replace(/_/g, '-');
    const isSpine = Boolean(z?.is_spine ?? d?.is_spine ?? staticSpec?.isSpine ?? canonicalId === 'sop_generic_7p');
    const validGrid =
      z?.grid && Number.isFinite(z.grid.w) && z.grid.w > 0 && Number.isFinite(z.grid.h) && z.grid.h > 0
        ? z.grid
        : staticSpec?.stagePctRect || { x: 0, y: 0, w: 25, h: 35 };

    specs.push({
      canonicalId,
      defaultZoneId: z?.id || d?.zone_id || staticSpec?.defaultZoneId || canonicalId,
      sopId,
      ucCode: z?.uc_id || d?.uc_id || sopId,
      colSpanClass: isSpine ? 'xl:col-span-12' : 'xl:col-span-3',
      order: Number(z?.order ?? d?.order ?? staticSpec?.order ?? idx + 1),
      viTitle: z?.name || d?.name || staticSpec?.viTitle || sopId,
      enTitle: z?.en_name || d?.en_name || staticSpec?.enTitle || z?.name || d?.name || sopId,
      viSubtitle: z?.subtitle || d?.mission || d?.subtitle || staticSpec?.viSubtitle || sopId,
      enSubtitle:
        z?.en_subtitle ||
        d?.en_subtitle ||
        staticSpec?.enSubtitle ||
        z?.subtitle ||
        d?.mission ||
        sopId,
      primarySkills:
        (z?.primary_skills && z.primary_skills.length > 0 ? z.primary_skills : undefined) ||
        (d?.primary_skills && d.primary_skills.length > 0 ? d.primary_skills : undefined) ||
        staticSpec?.primarySkills ||
        [],
      visualSlot:
        z?.visual_slot ||
        d?.visual_slot ||
        staticSpec?.visualSlot ||
        DEFAULT_VISUAL_SLOT_CYCLE[idx % DEFAULT_VISUAL_SLOT_CYCLE.length],
      isSpine,
      stagePctRect: validGrid,
      hexCell: z?.hex_cell || staticSpec?.hexCell,
    });
  });

  // Compute collision-free fallback grid rects if any spec came without valid bounds
  const missingGrid = specs.some(
    (s) => !zones?.find((z) => resolveCanonicalZoneId(z.id, zones) === s.canonicalId)?.grid?.w,
  );
  if (missingGrid && specs.length > 0) {
    const n = specs.length;
    if (n === 1) {
      specs[0].stagePctRect = { x: 0, y: 0, w: 100, h: 100 };
    } else if (!zones || zones.length === 0) {
      const spine = specs.find((s) => s.isSpine) || specs[0];
      const others = specs.filter((s) => s !== spine);
      const topCount = Math.floor(others.length / 2);
      const top = others.slice(0, topCount);
      const bot = others.slice(topCount);
      const assignRow = (items: ArchitecturalRoomSpec[], y: number, h: number) => {
        if (items.length === 0) return;
        const baseW = Math.floor(100 / items.length);
        const rem = 100 - baseW * items.length;
        let cx = 0;
        items.forEach((it, i) => {
          const w = baseW + (i < rem ? 1 : 0);
          it.stagePctRect = { x: cx, y, w, h };
          cx += w;
        });
      };
      assignRow(top, 0, 35);
      spine.stagePctRect = { x: 0, y: 35, w: 100, h: 30 };
      assignRow(bot, 65, 35);
    }
  }

  return specs.sort((a, b) => a.order - b.order);
}

/**
 * Computes a collision-free percentage coordinate (0..100) inside a room's interior
 * for `totalInRoom` concurrent agents so 1..24+ agents never stack on the same pixel.
 */
export function computeCollisionFreeRoomPct(
  canonicalRoomId: string,
  indexInRoom: number,
  totalInRoom: number,
  customSpec?: ArchitecturalRoomSpec,
): { x: number; y: number } {
  const spec =
    customSpec ||
    ARCHITECTURAL_ROOM_SPECS[canonicalRoomId] ||
    ARCHITECTURAL_ROOM_SPECS.sop_generic_7p;
  const { x, y, w, h } = spec.stagePctRect;
  const safeTotal = Math.max(1, totalInRoom);
  const cols = Math.max(1, Math.ceil(Math.sqrt(safeTotal * (w / Math.max(12, h)))));
  const rows = Math.max(1, Math.ceil(safeTotal / cols));
  const col = indexInRoom % cols;
  const row = Math.floor(indexInRoom / cols);

  const padX = Math.min(4.2, w * 0.16);
  const topHeaderClearance = Math.min(6.5, h * 0.28);
  const bottomPad = Math.min(3.5, h * 0.14);

  const usableW = Math.max(4, w - padX * 2);
  const usableH = Math.max(4, h - topHeaderClearance - bottomPad);

  const pctX =
    cols === 1
      ? x + w / 2
      : x + padX + (col / (cols - 1)) * usableW;
  const pctY =
    rows === 1
      ? y + topHeaderClearance + usableH / 2
      : y + topHeaderClearance + (row / (rows - 1)) * usableH;

  return {
    x: Number(pctX.toFixed(2)),
    y: Number(pctY.toFixed(2)),
  };
}

export function isStationActivelyWorking(st: OpenOfficeStation): boolean {
  return (
    st.status === 'WORKING' ||
    st.status === 'COLLABORATING' ||
    Boolean(st.live_telemetry?.is_live_executing)
  );
}

export function computeAgentTokenUtilization(
  station: OpenOfficeStation,
  contracts: OpenOfficeContract[],
): { usedTokens: number; budgetTokens: number; pct: number } {
  const linked = contracts.filter(
    (c) =>
      c.lead_agent_id === station.agent_id ||
      (station.agent_id ? c.support_agent_ids?.includes(station.agent_id) : false) ||
      station.active_contract_ids?.includes(c.id),
  );
  if (linked.length === 0) {
    const fallbackUsed = station.live_telemetry?.step_index
      ? station.live_telemetry.step_index * 320
      : 0;
    const fallbackBudget = 8000;
    return {
      usedTokens: fallbackUsed,
      budgetTokens: fallbackBudget,
      pct: Math.min(100, Math.round((fallbackUsed / fallbackBudget) * 100)),
    };
  }
  const budgetTokens = Math.max(
    1000,
    linked.reduce((acc, c) => acc + (Number(c.estimated_tokens) || 4000), 0),
  );
  const usedTokens = linked.reduce(
    (acc, c) =>
      acc +
      (Number(c.actual_tokens) ||
        (c.status === 'IN_PROGRESS' ? Math.round((Number(c.estimated_tokens) || 4000) * 0.45) : 0)),
    0,
  );
  return {
    usedTokens,
    budgetTokens,
    pct: Math.min(100, Math.round((usedTokens / budgetTokens) * 100)),
  };
}

export type LiveAgentStage = 'review' | 'working' | 'standby' | 'idle';

export type DetailedAgentStage =
  | 'review'
  | 'returned'
  | 'running'
  | 'result'
  | 'accepted'
  | 'waiting'
  | 'done'
  | 'idle';

export const DETAILED_STAGE_META: Record<
  DetailedAgentStage,
  { vi: string; en: string; dotClass: string; badgeClass: string; canvasTextClass: string }
> = {
  review: {
    vi: '🧾 Chờ duyệt',
    en: '🧾 Needs Review',
    dotClass: 'bg-amber-500',
    badgeClass: 'border-amber-500/40 bg-amber-500/12 text-amber-800 dark:text-amber-200',
    canvasTextClass: 'text-amber-300',
  },
  returned: {
    vi: '↩ Bị trả — đang sửa',
    en: '↩ Returned for Rework',
    dotClass: 'bg-rose-500',
    badgeClass: 'border-rose-500/40 bg-rose-500/12 text-rose-800 dark:text-rose-200',
    canvasTextClass: 'text-rose-300',
  },
  running: {
    vi: '🔨 Đang chạy',
    en: '🔨 Running',
    dotClass: 'bg-emerald-500',
    badgeClass: 'border-emerald-500/40 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200',
    canvasTextClass: 'text-sky-300',
  },
  result: {
    vi: '📄 Có kết quả',
    en: '📄 Result Ready',
    dotClass: 'bg-teal-500',
    badgeClass: 'border-teal-500/40 bg-teal-500/12 text-teal-800 dark:text-teal-200',
    canvasTextClass: 'text-emerald-300',
  },
  accepted: {
    vi: '📥 Đã nhận',
    en: '📥 Accepted',
    dotClass: 'bg-sky-500',
    badgeClass: 'border-sky-500/40 bg-sky-500/12 text-sky-800 dark:text-sky-200',
    canvasTextClass: 'text-sky-300',
  },
  waiting: {
    vi: '⏳ Chờ nhận',
    en: '⏳ Queued',
    dotClass: 'bg-slate-400',
    badgeClass: 'border-border bg-muted/50 text-muted-foreground',
    canvasTextClass: 'text-slate-300',
  },
  done: {
    vi: '✅ Đã duyệt',
    en: '✅ Approved',
    dotClass: 'bg-emerald-600',
    badgeClass: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
    canvasTextClass: 'text-emerald-300',
  },
  idle: {
    vi: '☕ Sẵn sàng',
    en: '☕ Ready',
    dotClass: 'bg-slate-400',
    badgeClass: 'border-border bg-muted/40 text-muted-foreground',
    canvasTextClass: 'text-slate-300',
  },
};

const DETAILED_STAGE_RANK: Record<DetailedAgentStage, number> = {
  review: 0,
  returned: 1,
  running: 2,
  result: 3,
  accepted: 4,
  waiting: 5,
  done: 6,
  idle: 7,
};

export function resolveContractDetailedStage(c: OpenOfficeContract): DetailedAgentStage {
  const st = String(c.status || '').toUpperCase();
  if (st === 'DONE' || st === 'APPROVED') return 'done';
  if (st === 'AWAITING_HITL' || st === 'REVIEW') return 'review';
  if (st === 'RETURNED_FOR_REWORK' || ((c.current_run_number ?? 1) > 1 && st === 'IN_PROGRESS')) {
    return 'returned';
  }
  if (st === 'EVIDENCE_SUBMITTED') return 'result';
  if (st === 'IN_PROGRESS' || st === 'RUNNING') return 'running';
  if (st === 'ACCEPTED' || st === 'ASSIGNED') return 'accepted';
  if (st === 'QUEUED' || st === 'PENDING' || st === 'TODO' || st === 'WAIT') return 'waiting';
  return 'accepted';
}

export interface AgentWorkloadStageSummary {
  activeCount: number;
  isOverloaded: boolean;
  stage: LiveAgentStage;
  stageLabel: string;
  detailedStage: DetailedAgentStage;
  detailedStageLabel: string;
  primaryContract: OpenOfficeContract | null;
  whereText: string;
}

export function computeAgentWorkloadAndStage(
  station: OpenOfficeStation,
  contracts: OpenOfficeContract[],
  locale: OpenOfficeLocale = 'vi',
  zones?: OpenOfficeZone[],
): AgentWorkloadStageSummary {
  const agentId = station.agent_id || '';
  const relatedContracts = contracts.filter(
    (c) =>
      c.lead_agent_id === agentId ||
      (agentId ? (c.support_agent_ids || []).includes(agentId) : false) ||
      station.active_contract_ids?.includes(c.id),
  );
  const activeContracts = relatedContracts.filter((c) => c.status !== 'DONE');
  const activeCount = Math.max(
    activeContracts.length,
    station.active_contract_ids?.length || 0,
  );
  const isOverloaded = activeCount >= 3;

  let primaryContract: OpenOfficeContract | null = null;
  let contractStage: DetailedAgentStage | null = null;
  for (const c of relatedContracts) {
    const st = resolveContractDetailedStage(c);
    if (!contractStage || DETAILED_STAGE_RANK[st] < DETAILED_STAGE_RANK[contractStage]) {
      contractStage = st;
      primaryContract = c;
    }
  }

  const hasReview =
    station.status === 'AWAITING_HITL' ||
    activeContracts.some((c) => c.status === 'AWAITING_HITL');
  const isWork = isStationActivelyWorking(station);
  const isStandby =
    station.status === 'STANDBY' ||
    station.status === 'QUEUED' ||
    activeContracts.length > 0;

  let stage: LiveAgentStage = 'idle';
  if (hasReview) stage = 'review';
  else if (isWork) stage = 'working';
  else if (isStandby) stage = 'standby';

  let detailedStage: DetailedAgentStage = contractStage ?? 'idle';
  if (station.status === 'AWAITING_HITL') {
    detailedStage = 'review';
  } else if (isWork && (detailedStage === 'idle' || detailedStage === 'waiting' || detailedStage === 'done')) {
    detailedStage = 'running';
  } else if (isStandby && detailedStage === 'idle') {
    detailedStage = 'waiting';
  }

  const canonicalRoom = resolveCanonicalZoneId(station.zone_id, zones);
  const matchedZone = zones?.find((z) => resolveCanonicalZoneId(z.id, zones) === canonicalRoom);
  const roomSpec = ARCHITECTURAL_ROOM_SPECS[canonicalRoom];
  const roomName =
    station.zone_name ||
    (locale === 'en'
      ? matchedZone?.en_name || roomSpec?.enTitle || matchedZone?.name
      : matchedZone?.name || roomSpec?.viTitle) ||
    'Văn phòng';
  const projTag =
    primaryContract?.project_key || station.active_project_keys?.[0] || null;
  const whereText = projTag ? `${roomName} · [${projTag}]` : roomName;

  const stageLabelMap: Record<OpenOfficeLocale, Record<LiveAgentStage, string>> = {
    vi: {
      review: 'Chờ duyệt',
      working: 'Đang chạy',
      standby: 'Trực ban',
      idle: 'Sẵn sàng',
    },
    en: {
      review: 'Needs Review',
      working: 'Running',
      standby: 'Standby',
      idle: 'Ready',
    },
  };

  return {
    activeCount,
    isOverloaded,
    stage,
    stageLabel: stageLabelMap[locale][stage],
    detailedStage,
    detailedStageLabel: DETAILED_STAGE_META[detailedStage][locale],
    primaryContract,
    whereText,
  };
}

export interface OfficePositionDef {
  id: string;
  name: string;
  duties: string[];
  output: string;
}

export interface OfficeDeptSetupItem {
  key: string;
  mission: string;
  duties: string[];
  output: string;
  positions: OfficePositionDef[];
}

export type OfficeDeptSetupState = Record<string, OfficeDeptSetupItem>;

export interface OfficeSeatAssignment {
  deptKey: string;
  positionId: string;
  title: string;
  botLabel?: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeKind?: 'human' | 'agent';
}

export type OfficeSeatAssignmentState = Record<string, OfficeSeatAssignment>;

const DEFAULT_POSITION_TEMPLATES: Record<
  string,
  { output: string; positions: Array<{ name: string; duties: string[]; output: string }> }
> = {
  sop_sec_audit_01: {
    output: 'Hồ sơ kiểm toán bảo mật SAST & bộ kiểm thử 0 FAIL',
    positions: [
      {
        name: 'Kiến trúc Đặc tả UTOP & Bằng chứng',
        duties: ['Chuyển hóa yêu cầu thành SPEC & Acceptance Criteria', 'Xác minh chuỗi băm REA ev_<sha256>'],
        output: 'SPEC & BDD Checklist đạt chuẩn',
      },
      {
        name: 'Kỹ sư Kiểm định QualityGate & SAST',
        duties: ['Chạy kiểm thử độc lập, SAST & Layer 0', 'Chặn phát hành khi có lỗ hổng hoặc hồi quy'],
        output: 'Biên bản kiểm định EAI >= 0.98 (0 FAIL)',
      },
    ],
  },
  sop_generic_7p: {
    output: 'Quyết định điều phối 7 pha & phê duyệt SoD minh bạch',
    positions: [
      {
        name: 'Điều phối 7 Pha & Kahn DAG',
        duties: ['Phân rã mục tiêu thành hợp đồng rõ tiêu chí', 'Cân bằng tải tác tử & kiểm soát thời lượng thực thi'],
        output: 'Kế hoạch & hợp đồng giao việc chuẩn',
      },
      {
        name: 'Kiểm soát Nghiệm thu Độc lập (SoD)',
        duties: ['Đối soát bằng chứng trước khi phê duyệt độc lập', 'Đúc kết bài học Phase 7 Crystallize'],
        output: 'Phiếu nghiệm thu hoặc trả lại kèm lý do',
      },
    ],
  },
  sop_coding_01: {
    output: 'Mã nguồn sạch lint + test xanh toàn bộ trên worktree cô lập',
    positions: [
      {
        name: 'Kỹ sư Lõi & Iron Law of TDD',
        duties: ['Phát triển tính năng fail-first TDD trong .worktrees', 'Tối ưu hiệu năng & kiến trúc mô-đun'],
        output: 'Pull Request kèm bằng chứng test pass',
      },
      {
        name: 'Chuyên gia Giao diện & Trải nghiệm',
        duties: ['Hoàn thiện UI/UX theo Design System & Layer 0', 'Đảm bảo khả năng truy cập & đa thiết bị'],
        output: 'Giao diện đạt WCAG 2.1 AA',
      },
    ],
  },
  sop_legal_01: {
    output: 'Hồ sơ rà soát pháp lý, Nghị định 13/GDPR & ma trận phân quyền',
    positions: [
      {
        name: 'Chuyên gia Rà soát Pháp lý & NDA',
        duties: ['Phân loại rủi ro hợp đồng 3 màu & rà soát redline', 'Kiểm tra tuân thủ Nghị định 13 & GDPR'],
        output: 'Báo cáo tuân thủ & đề xuất redline',
      },
      {
        name: 'Quản trị Phân quyền & SecretVault',
        duties: ['Giám sát RBAC, giới hạn tự trị & nhật ký kiểm toán', 'Bảo vệ khóa bí mật theo PermissionMatrix'],
        output: 'Báo cáo tuân thủ quyền truy cập',
      },
    ],
  },
  sop_operations_01: {
    output: 'Vận hành đa kênh thông suốt & sao lưu Tri-Sync AES-256-GCM',
    positions: [
      {
        name: 'Điều phối Đa kênh OmniCommunication',
        duties: ['Tiếp nhận & đồng bộ tin nhắn Zalo/Viber/Email/Calendar', 'Phân luồng tác vụ khẩn không dùng trình duyệt'],
        output: 'Nhật ký điều phối đa kênh chuẩn P=1',
      },
      {
        name: 'Kỹ sư Lưu trữ & Phục hồi Thảm họa',
        duties: ['Phân loại 5 vùng MECE (00_INBOX..40_ARCHIVE)', 'Kiểm thử khôi phục sao lưu Tri-Sync DR'],
        output: 'Bản sao lưu đã kiểm khôi phục (TRI)',
      },
    ],
  },
  sop_strategy_01: {
    output: 'Chiến lược 7 chân trời, BMC, OST & kiến trúc IPO thống nhất',
    positions: [
      {
        name: 'Kiến trúc sư Chiến lược 7-Horizon',
        duties: ['Xây dựng Business Model Canvas & Opportunity Solution Tree', 'Đánh giá phương án theo ma trận MECE'],
        output: 'Hồ sơ chiến lược 7H & OKR',
      },
      {
        name: 'Kiến trúc sư Sản phẩm 6-Phase IPO',
        duties: ['Thiết kế mô hình quy trình BPMN 2.0 & hợp đồng IPO', 'Đánh giá rủi ro Pre-mortem đa chiều'],
        output: 'Bản thiết kế kiến trúc & biên bản Kara',
      },
    ],
  },
  sop_research_01: {
    output: 'Kho tri thức 5 ngăn & báo cáo nghiên cứu có kiểm chứng trích dẫn',
    positions: [
      {
        name: 'Nhà Nghiên cứu & Kiểm chứng Trích dẫn',
        duties: ['Thu thập dữ liệu thị trường & kiểm tra độ chính xác nguồn dẫn', 'Lập báo cáo nghiên cứu chuyên sâu'],
        output: 'Hồ sơ nghiên cứu có trích dẫn kiểm chứng',
      },
      {
        name: 'Thủ thư Tri thức WeKnora',
        duties: ['Chuẩn hóa bài học Rework & lưu trữ bộ nhớ 5 ngăn', 'Cập nhật quy chuẩn phòng tránh lặp lỗi'],
        output: 'Thẻ bài học đúc kết & bộ nhớ WeKnora',
      },
    ],
  },
  sop_analytics_01: {
    output: 'Báo cáo BI 5 tầng, EVM, trực quan Highcharts & tối ưu FinOps',
    positions: [
      {
        name: 'Chuyên gia Phân tích Dữ liệu & BI',
        duties: ['Phân tích chẩn đoán 5 tầng, Ishikawa 6M & AHP MCDA', 'Dựng biểu đồ Highcharts kiểm chứng số liệu'],
        output: 'Bảng phân tích BI & dashboard KPI',
      },
      {
        name: 'Kiểm soát Tài chính FinOps',
        duties: ['Theo dõi ngân sách token & biên lợi nhuận (>=70%)', 'Cảnh báo vượt ngưỡng chi phí BPE FinOps'],
        output: 'Bảng cân đối hiệu quả vận hành',
      },
    ],
  },
};

export function buildDefaultDeptSetup(
  departments?: OpenOfficeDepartmentDossier[],
  zones?: OpenOfficeZone[],
): OfficeDeptSetupState {
  const specs = buildDynamicRoomSpecs(zones, departments);
  const out: OfficeDeptSetupState = {};
  for (const spec of specs) {
    const tpl = DEFAULT_POSITION_TEMPLATES[spec.canonicalId];
    const skillsText =
      spec.primarySkills.length > 0 ? spec.primarySkills.slice(0, 4).join(', ') : spec.sopId;
    const defaultPositions = tpl
      ? tpl.positions
      : [
          {
            name: `Chủ trì ${spec.viTitle} (${spec.sopId})`,
            duties: [
              `Thực thi quy trình ${spec.sopId}: ${spec.viSubtitle}`,
              `Vận hành kỹ năng chính: ${skillsText}`,
            ],
            output: `Hồ sơ bàn giao chuẩn ${spec.sopId}`,
          },
          {
            name: `Kiểm định Chất lượng ${spec.sopId}`,
            duties: [
              `Kiểm tra 1:1 tiêu chí nghiệm thu cho ${spec.sopId}`,
              'Xác minh bằng chứng đạt chuẩn trước khi phê duyệt độc lập',
            ],
            output: 'Biên bản kiểm định 0 FAIL',
          },
        ];

    out[spec.canonicalId] = {
      key: spec.canonicalId,
      mission: spec.viSubtitle,
      duties: [spec.viSubtitle, ...(skillsText ? [`Kỹ năng SOP: ${skillsText}`] : [])],
      output: tpl?.output || `Đầu ra chuẩn hóa ${spec.sopId} (EAI >= 0.98)`,
      positions: defaultPositions.map((p, idx) => ({
        id: `pos-${spec.canonicalId}-${idx + 1}`,
        name: p.name,
        duties: p.duties,
        output: p.output,
      })),
    };
  }
  return out;
}

export function buildInitialSeatAssignments(
  stations: OpenOfficeStation[],
  deptSetup: OfficeDeptSetupState,
  zones?: OpenOfficeZone[],
): OfficeSeatAssignmentState {
  const out: OfficeSeatAssignmentState = {};
  const usedPosIds = new Set<string>();
  for (const st of stations) {
    const deptKey = resolveCanonicalZoneId(st.zone_id, zones);
    const positions = deptSetup[deptKey]?.positions || [];
    const freePos = positions.find((p) => !usedPosIds.has(p.id)) || positions[0];
    if (freePos) {
      usedPosIds.add(freePos.id);
      out[st.seat_id] = {
        deptKey,
        positionId: freePos.id,
        title: freePos.name,
      };
    } else {
      out[st.seat_id] = {
        deptKey,
        positionId: '',
        title: st.role,
      };
    }
  }
  return out;
}

export const OPEN_OFFICE_DICTIONARY = {
  vi: {
    tabFloorplan: 'Văn phòng mở',
    tabContracts: 'Hợp đồng',
    tabTelemetry: 'Thống kê',
    tabGovernance: 'Quản trị',
    allProjects: 'Tất cả dự án',
    dispatchCta: '+ Giao việc',
    workItemsBtn: 'Hạng mục',
    lensBlueprint: 'Bản vẽ SOP',
    lensBees: 'Tổ ong AI',
    lensFleet: 'Ma trận Đội ngũ',
    lensSwarm: 'Đồ thị Hợp đồng',
    lensHintVector: 'Sơ đồ phòng ban SOP · Chọn phòng hoặc AI để kiểm tra & giao việc',
    lensHintBees: 'Tổ ong AI · Quan sát Ong Chúa & Ong Thợ thực thi theo các ô SOP lục giác',
    lensHintIso: 'Ma trận đội ngũ · Theo dõi mục chờ duyệt, đang chạy & trực ban',
    lensHintLive: 'Đồ thị hợp đồng · Luồng cộng tác Chủ trì – Hỗ trợ xác thực',
    tabHintContracts: 'Hợp đồng & Cổng nghiệm thu độc lập',
    tabHintTelemetry: 'Thống kê hiệu suất & nhật ký sự kiện bất biến',
    tabHintGovernance: 'Chính sách tự trị, phòng ban SOP & ma trận phân quyền',
    submodePixel: 'Văn phòng 2D',
    submodeBees: 'Đàn ong AI',
    beehiveHeading: 'Tổ ong Tự trị & Đường bay Cộng tác',
    beehiveSubheading: 'Ong Chúa, Agent chủ trì & Ong Phụ (Subagent) đang chạy thực tuyến trên các ô SOP lục giác',
    beehiveCombMode: 'Tổ ong Lục giác',
    beehiveTreeMode: 'Cây Đàn ong',
    beehiveQueenLabel: 'Ong Chúa',
    beehiveWorkerLabel: 'Ong Agent',
    beehiveSubagentLabel: 'Ong Phụ (Subagent)',
    beehiveGuardLabel: 'Ong Gác Cổng',
    beehiveFlightsCard: 'Đường bay Cộng tác',
    beehiveGuardCard: 'Cổng Ong Gác (Duyệt độc lập)',
    beehiveContractsCard: 'Hợp đồng Đàn ong',
    beehiveNoFlights: 'Chưa có đường bay Chủ trì -> Hỗ trợ đang chạy.',
    beehiveNoGuard: 'Không có hồ sơ chờ Ong Gác Cổng duyệt.',
    hitlPillPrefix: 'Cần duyệt',
    quickReviewTitle: 'Xem nhanh & Phê duyệt sản phẩm bàn giao',
    quickReviewVerifyLabel: 'Tôi xác nhận đã kiểm tra đầu ra & bằng chứng thực thi đạt chuẩn nghiệm thu',
    quickReviewApprove: 'Phê duyệt hoàn tất',
    quickReviewRework: 'Yêu cầu làm lại',
    quickReviewClose: 'Thu gọn',
    fleetHitlLane: 'Chờ bạn phê duyệt',
    fleetWorkingLane: 'Đang thực thi trực tuyến',
    fleetIdleLane: 'Trực ban sẵn sàng',
    dagHeading: 'Đồ thị Nhân quả Hợp đồng & Cộng tác Đa Agent',
    dagSubheading: 'Chỉ hiển thị các liên kết Chủ trì -> Hỗ trợ có hợp đồng xác thực (0 liên kết giả lập)',
    dagNoActiveContracts: 'Chưa có hợp đồng đa Agent đang chạy cho bộ lọc hiện tại.',
    loungeCompanions: 'Trợ lý Sảnh Chung',
    stageOptions: 'Tùy chọn sàn',
    deptEditGovernance: 'Cấu hình phòng & Phân quyền',
    cmdPaletteTrigger: 'Tìm nhanh · Ctrl+K',
    effectsToggle: 'Hiệu ứng',
    fitView: 'Vừa khung',
    overloadTag: 'Quá tải',
    contractSheetSubtitle: 'Hợp đồng việc — tiêu chí chốt từ lúc giao',
    subtabMap: 'Sơ đồ văn phòng',
    subtabDept: 'Phòng ban & vị trí',
    subtabSetup: 'Setup việc cho nhân viên',
    modeSimple: 'Đơn giản',
    modeFull: 'Đầy đủ',
    liveTeamHeading: 'ĐỘI NGŨ TRỰC TIẾP',
    pendingQueueHeading: 'CHỜ CHẠY',
    stageFeedHeading: 'AI ĐANG Ở ĐÂU',
    bulkDispatchHeading: 'GIAO HÀNG LOẠT',
    copySlipLabel: 'Chép phiếu',
    fullscreenEvidenceLabel: 'Đọc toàn màn',
    criteriaProgressLabel: 'tiêu chí đã đối soát',
    inspectorDrawerOpenCta: 'Chi tiết nhân sự AI',
    inspectorDrawerFallbackDesc: 'Theo dõi hoạt động trực tiếp của nhân sự AI, chỉ dẫn nhanh hoặc giao việc mới.',
  },
  en: {
    tabFloorplan: 'Open Office',
    tabContracts: 'Contracts',
    tabTelemetry: 'Analytics',
    tabGovernance: 'Governance',
    allProjects: 'All projects',
    dispatchCta: '+ Dispatch',
    workItemsBtn: 'Work Items',
    lensBlueprint: 'SOP Blueprint',
    lensBees: 'Beehive',
    lensFleet: 'Fleet Matrix',
    lensSwarm: 'Contract DAG',
    lensHintVector: 'SOP department floorplan · Select a room or agent to inspect & dispatch',
    lensHintBees: 'Beehive Colony · Watch Queen & Worker bees execute live across SOP honeycomb chambers',
    lensHintIso: 'Fleet matrix · Track pending reviews, active & standby agents',
    lensHintLive: 'Contract DAG · Verified lead-to-support execution edges',
    tabHintContracts: 'Contracts & Independent Review',
    tabHintTelemetry: 'Telemetry KPIs & immutable append-only event audit',
    tabHintGovernance: 'Autonomy policy, SOP departments & RBAC permission matrix',
    submodePixel: '2D Pixel Office',
    submodeBees: 'Bee Colony',
    beehiveHeading: 'Autonomous Beehive Colony & Foraging Flights',
    beehiveSubheading: 'Queen, Main Agents & Spawned Subagents executing live across SOP hexagonal chambers',
    beehiveCombMode: 'Honeycomb Stage',
    beehiveTreeMode: 'Colony Tree',
    beehiveQueenLabel: 'Queen Bee',
    beehiveWorkerLabel: 'Agent Bees',
    beehiveSubagentLabel: 'Subagent Bees',
    beehiveGuardLabel: 'Guard Bees',
    beehiveFlightsCard: 'Active Foraging Flights',
    beehiveGuardCard: 'Guard-Bee Gate (Independent Review)',
    beehiveContractsCard: 'Active Colony Contracts',
    beehiveNoFlights: 'No active Lead -> Support foraging flights.',
    beehiveNoGuard: 'No deliverables awaiting Guard-Bee review.',
    hitlPillPrefix: 'Needs Review',
    quickReviewTitle: 'Quick Deliverable Review & Sign-Off',
    quickReviewVerifyLabel: 'I verify deliverables and execution evidence satisfy acceptance criteria',
    quickReviewApprove: 'Approve & Close',
    quickReviewRework: 'Return for Rework',
    quickReviewClose: 'Collapse',
    fleetHitlLane: 'Awaiting Your Review',
    fleetWorkingLane: 'Active Execution',
    fleetIdleLane: 'Standby Capacity',
    dagHeading: 'Verified Contract & Swarm Causal DAG',
    dagSubheading: 'Renders strictly verified Lead -> Support contract edges (0 synthetic beams)',
    dagNoActiveContracts: 'No active multi-agent contracts match the current project filter.',
    loungeCompanions: 'Atrium Companions',
    stageOptions: 'Stage Options',
    deptEditGovernance: 'Configure Room & RBAC',
    cmdPaletteTrigger: 'Quick Jump · Ctrl+K',
    effectsToggle: 'Effects',
    fitView: 'Fit',
    overloadTag: 'Overloaded',
    contractSheetSubtitle: 'Work contract — acceptance criteria locked upfront',
    subtabMap: 'Floorplan',
    subtabDept: 'Departments & Seats',
    subtabSetup: 'Staff Work Setup',
    modeSimple: 'Simple',
    modeFull: 'Full',
    liveTeamHeading: 'LIVE TEAM',
    pendingQueueHeading: 'EXECUTION QUEUE',
    stageFeedHeading: 'WHO IS WHERE',
    bulkDispatchHeading: 'BULK DISPATCH',
    copySlipLabel: 'Copy Slip',
    fullscreenEvidenceLabel: 'Fullscreen Reader',
    criteriaProgressLabel: 'criteria verified',
    inspectorDrawerOpenCta: 'Agent Details',
    inspectorDrawerFallbackDesc: 'Inspect live agent activity, steer execution, or dispatch a quick work contract.',
  },
} as const;

export function useOpenOfficeLocale(): OpenOfficeLocale {
  const [locale, setLocale] = React.useState<OpenOfficeLocale>('vi');
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const syncLocale = () => {
      const htmlLang = document.documentElement.lang?.toLowerCase() || '';
      setLocale(htmlLang.startsWith('en') ? 'en' : 'vi');
    };
    syncLocale();
    const ObserverCtor =
      typeof MutationObserver !== 'undefined'
        ? MutationObserver
        : typeof window !== 'undefined'
          ? (window as unknown as { MutationObserver?: new (cb: MutationCallback) => MutationObserver }).MutationObserver
          : undefined;
    if (!ObserverCtor) return;
    const observer = new ObserverCtor(() => {
      syncLocale();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    });
    return () => observer.disconnect();
  }, []);
  return locale;
}

export function normalizeZonesWithArchitecturalSpecs(
  zones: OpenOfficeZone[],
  departments?: OpenOfficeDepartmentDossier[],
): Array<
  OpenOfficeZone & {
    canonicalId: string;
    spec: ArchitecturalRoomSpec;
  }
> {
  const dynamicSpecs = buildDynamicRoomSpecs(zones, departments);
  const specByCanonical = new Map<string, ArchitecturalRoomSpec>();
  for (const sp of dynamicSpecs) {
    specByCanonical.set(sp.canonicalId, sp);
  }

  const mapped = zones.map((z) => {
    const canonicalId = resolveCanonicalZoneId(z.id, zones);
    const spec =
      specByCanonical.get(canonicalId) ||
      ARCHITECTURAL_ROOM_SPECS[canonicalId] ||
      ARCHITECTURAL_ROOM_SPECS.sop_generic_7p;
    return {
      ...z,
      canonicalId,
      spec,
    };
  });

  if (mapped.length === 0) {
    return dynamicSpecs.map((spec) => ({
      id: spec.defaultZoneId,
      sop_id: spec.sopId,
      uc_id: spec.ucCode,
      use_case_id: spec.sopId,
      name: spec.viTitle,
      en_name: spec.enTitle,
      subtitle: spec.viSubtitle,
      en_subtitle: spec.enSubtitle,
      primary_skills: spec.primarySkills,
      visual_slot: spec.visualSlot,
      is_spine: spec.isSpine,
      order: spec.order,
      accent: 'border-border',
      grid: spec.stagePctRect,
      hex_cell: spec.hexCell,
      canonicalId: spec.canonicalId,
      spec,
    }));
  }

  return mapped.sort((a, b) => a.spec.order - b.spec.order);
}

export interface BeehiveHexCellSpec {
  canonicalId: string;
  cx: number;
  cy: number;
  radius: number;
  tier: 'queen' | 'specialist';
}

export const BEEHIVE_CELL_LAYOUT: Record<string, BeehiveHexCellSpec> = {
  sop_sec_audit_01: { canonicalId: 'sop_sec_audit_01', cx: 236, cy: 104, radius: 84, tier: 'specialist' },
  sop_strategy_01: { canonicalId: 'sop_strategy_01', cx: 480, cy: 104, radius: 84, tier: 'specialist' },
  sop_coding_01: { canonicalId: 'sop_coding_01', cx: 724, cy: 104, radius: 84, tier: 'specialist' },
  sop_legal_01: { canonicalId: 'sop_legal_01', cx: 176, cy: 280, radius: 84, tier: 'specialist' },
  sop_generic_7p: { canonicalId: 'sop_generic_7p', cx: 480, cy: 280, radius: 92, tier: 'queen' },
  sop_operations_01: { canonicalId: 'sop_operations_01', cx: 784, cy: 280, radius: 84, tier: 'specialist' },
  sop_research_01: { canonicalId: 'sop_research_01', cx: 316, cy: 456, radius: 84, tier: 'specialist' },
  sop_analytics_01: { canonicalId: 'sop_analytics_01', cx: 644, cy: 456, radius: 84, tier: 'specialist' },
};

const VERIFIED_RING_COORDS_7: ReadonlyArray<{ cx: number; cy: number }> = [
  { cx: 236, cy: 104 },
  { cx: 480, cy: 104 },
  { cx: 724, cy: 104 },
  { cx: 176, cy: 280 },
  { cx: 784, cy: 280 },
  { cx: 316, cy: 456 },
  { cx: 644, cy: 456 },
];

export function computeDynamicBeehiveLayout(
  rooms: Array<{
    canonicalId: string;
    isSpine?: boolean;
    hexCell?: OpenOfficeZoneHexCell;
  }>,
): Record<string, BeehiveHexCellSpec> {
  if (!rooms || rooms.length === 0) {
    return { ...BEEHIVE_CELL_LAYOUT };
  }

  // If every room already has valid backend coordinates AND none overlap on exact same cx/cy, honor them.
  const allProvidedValid = rooms.every(
    (r) =>
      r.hexCell &&
      Number.isFinite(r.hexCell.cx) &&
      Number.isFinite(r.hexCell.cy) &&
      Number.isFinite(r.hexCell.radius) &&
      r.hexCell.radius >= 24,
  );
  if (allProvidedValid) {
    const out: Record<string, BeehiveHexCellSpec> = {};
    for (const r of rooms) {
      const hc = r.hexCell!;
      out[r.canonicalId] = {
        canonicalId: r.canonicalId,
        cx: hc.cx,
        cy: hc.cy,
        radius: hc.radius,
        tier: r.isSpine || hc.tier === 'queen' ? 'queen' : 'specialist',
      };
    }
    return out;
  }

  const out: Record<string, BeehiveHexCellSpec> = {};
  const n = rooms.length;
  const queenRoom =
    rooms.find((r) => r.isSpine || r.canonicalId === 'sop_generic_7p') || rooms[0];

  if (n === 1) {
    out[queenRoom.canonicalId] = {
      canonicalId: queenRoom.canonicalId,
      cx: 480,
      cy: 280,
      radius: 96,
      tier: 'queen',
    };
    return out;
  }

  const queenRadius = n <= 9 ? 92 : Math.max(62, 92 - (n - 9) * 4);
  out[queenRoom.canonicalId] = {
    canonicalId: queenRoom.canonicalId,
    cx: 480,
    cy: 280,
    radius: queenRadius,
    tier: 'queen',
  };

  const specialists = rooms.filter((r) => r.canonicalId !== queenRoom.canonicalId);
  const m = specialists.length;
  if (n === 8 && m === VERIFIED_RING_COORDS_7.length) {
    specialists.forEach((r, idx) => {
      const coord = VERIFIED_RING_COORDS_7[idx];
      out[r.canonicalId] = {
        canonicalId: r.canonicalId,
        cx: coord.cx,
        cy: coord.cy,
        radius: 84,
        tier: 'specialist',
      };
    });
    return out;
  }

  const specRadius = Math.max(54, Math.min(84, Math.floor(500 / Math.max(4, m))));
  const rx = 310;
  const ry = 180;
  specialists.forEach((r, idx) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * idx) / m;
    out[r.canonicalId] = {
      canonicalId: r.canonicalId,
      cx: Math.round(480 + rx * Math.cos(angle)),
      cy: Math.round(280 + ry * Math.sin(angle)),
      radius: specRadius,
      tier: 'specialist',
    };
  });

  return out;
}

/**
 * Computes collision-free coordinates for a worker/queen bee inside a hexagonal cell
 * across 1..24+ concurrent agents without NaN/Infinity on adversarial bounds.
 */
export function computeBeeSlotInHexCell(
  center: { cx: number; cy: number },
  hexRadius: number,
  indexInCell: number,
  totalInCell: number,
): { x: number; y: number } {
  const safeRadius = Math.max(24, Number.isFinite(hexRadius) ? hexRadius : 80);
  const safeTotal = Math.max(1, Math.floor(Number.isFinite(totalInCell) ? totalInCell : 1));
  const rawIdx = Number.isFinite(indexInCell) ? Math.floor(indexInCell) : 0;
  const safeIdx = Math.max(0, Math.min(safeTotal - 1, rawIdx));

  if (safeTotal === 1) {
    return {
      x: Number(center.cx.toFixed(2)),
      y: Number((center.cy + 2).toFixed(2)),
    };
  }

  if (safeTotal === 2) {
    const dx = (safeIdx === 0 ? -1 : 1) * safeRadius * 0.38;
    return {
      x: Number((center.cx + dx).toFixed(2)),
      y: Number((center.cy + 2).toFixed(2)),
    };
  }

  if (safeTotal === 3) {
    const triOffsets: ReadonlyArray<{ dx: number; dy: number }> = [
      { dx: -safeRadius * 0.45, dy: -10 },
      { dx: safeRadius * 0.45, dy: -10 },
      { dx: 0, dy: 22 },
    ];
    const off = triOffsets[safeIdx] || triOffsets[0];
    return {
      x: Number((center.cx + off.dx).toFixed(2)),
      y: Number((center.cy + off.dy).toFixed(2)),
    };
  }

  if (safeTotal === 4) {
    const angle = Math.PI / 4 + safeIdx * (Math.PI / 2);
    const rx = safeRadius * 0.50;
    const ry = safeRadius * 0.30;
    return {
      x: Number((center.cx + Math.cos(angle) * rx).toFixed(2)),
      y: Number((center.cy + Math.sin(angle) * ry).toFixed(2)),
    };
  }

  if (safeTotal <= 8) {
    if (safeIdx === 0) {
      return {
        x: Number(center.cx.toFixed(2)),
        y: Number((center.cy - 2).toFixed(2)),
      };
    }
    const ringCount = safeTotal - 1;
    const angle =
      -Math.PI / 2 + Math.PI / ringCount + ((safeIdx - 1) / ringCount) * Math.PI * 2;
    const rx = safeRadius * 0.62;
    const ry = safeRadius * 0.44;
    return {
      x: Number((center.cx + Math.cos(angle) * rx).toFixed(2)),
      y: Number((center.cy + Math.sin(angle) * ry).toFixed(2)),
    };
  }

  if (safeTotal > 8 && safeIdx === 0) {
    return {
      x: Number(center.cx.toFixed(2)),
      y: Number(center.cy.toFixed(2)),
    };
  }

  const innerCapacity = 5;
  if (safeIdx <= innerCapacity) {
    const angle =
      -Math.PI / 2 + Math.PI / innerCapacity + ((safeIdx - 1) / innerCapacity) * Math.PI * 2;
    const rx = safeRadius * 0.36;
    const ry = safeRadius * 0.28;
    return {
      x: Number((center.cx + Math.cos(angle) * rx).toFixed(2)),
      y: Number((center.cy + Math.sin(angle) * ry).toFixed(2)),
    };
  }

  const outerCount = Math.max(1, safeTotal - 1 - innerCapacity);
  const outerIdx = safeIdx - 1 - innerCapacity;
  const angle = -Math.PI / 2 + Math.PI / outerCount + (outerIdx / outerCount) * Math.PI * 2;
  const rx = safeRadius * 0.64;
  const ry = safeRadius * 0.5;
  return {
    x: Number((center.cx + Math.cos(angle) * rx).toFixed(2)),
    y: Number((center.cy + Math.sin(angle) * ry).toFixed(2)),
  };
}

export type SopRoomThemeDomain =
  | 'SPINE'
  | 'SEC_QA'
  | 'STRATEGY'
  | 'CODING'
  | 'RESEARCH'
  | 'ANALYTICS'
  | 'LEGAL'
  | 'OPERATIONS'
  | 'STUDIO'
  | 'FINANCE'
  | 'CUSTOM';

export function resolveSopThemeDomain(input: {
  canonicalId: string;
  sopId?: string;
  primarySkills?: string[];
  isSpine?: boolean;
}): SopRoomThemeDomain {
  const cid = String(input.canonicalId || '').toLowerCase();
  const sop = String(input.sopId || '').toUpperCase();
  const skills = (input.primarySkills || []).map((s) => s.toLowerCase());
  const hasSkill = (...needles: string[]) =>
    skills.some((sk) => needles.some((n) => sk.includes(n)));

  if (input.isSpine || cid === 'sop_generic_7p' || sop === 'SOP-GENERIC-7P') {
    return 'SPINE';
  }
  if (hasSkill('canhstudio', 'hyperframes', 'media-use', 'video', 'film') || sop.includes('STUDIO')) {
    return 'STUDIO';
  }
  if (hasSkill('misa', 'accounting', 'hkd', 'einvoice', 'finops') || sop.includes('FIN') || sop.includes('MISA')) {
    return 'FINANCE';
  }
  if (sop.includes('SEC') || cid.includes('sec_audit') || hasSkill('chomskill', 'engineeringforensics', 'security')) {
    return 'SEC_QA';
  }
  if (sop.includes('STRATEGY') || cid.includes('strategy') || hasSkill('strategytoolkit', 'productarchitecture', 'bpmn')) {
    return 'STRATEGY';
  }
  if (sop.includes('CODING') || cid.includes('coding') || hasSkill('ucbdd', 'gitsync', 'uiuxpromax')) {
    return 'CODING';
  }
  if (sop.includes('RESEARCH') || cid.includes('research') || hasSkill('researchskill', 'marketresearch', 'weknora')) {
    return 'RESEARCH';
  }
  if (sop.includes('ANALYTICS') || cid.includes('analytics') || hasSkill('dataanalysis', 'businessanalytics', 'versatica')) {
    return 'ANALYTICS';
  }
  if (sop.includes('LEGAL') || cid.includes('legal') || hasSkill('legalops', 'permissionmatrix', 'nda')) {
    return 'LEGAL';
  }
  if (sop.includes('OPERATIONS') || cid.includes('operations') || hasSkill('omnicommunication', 'disasterrecovery', 'alertmaster')) {
    return 'OPERATIONS';
  }
  return 'CUSTOM';
}

export interface DynamicDoorwaySpec {
  id: string;
  roomCanonicalId: string;
  label: string;
  x: number;
  band: number;
  roomPoint: readonly [number, number];
  spinePoint: readonly [number, number];
}

export interface DynamicTileRoomSpec {
  canonicalId: string;
  sopId: string;
  name: string;
  enName: string;
  subtitle: string;
  primarySkills: string[];
  isSpine: boolean;
  visualSlot: string;
  themeDomain: SopRoomThemeDomain;
  accent: string;
  tileRect: readonly [number, number, number, number];
  pctRect: { x: number; y: number; w: number; h: number };
  seatCapacity: number;
  deskAnchors: Array<{ x: number; y: number }>;
  patrolWaypoints: Array<{ x: number; y: number }>;
  doorId: string | null;
}

export interface DynamicPixelFloorplanSpec {
  rooms: DynamicTileRoomSpec[];
  spineRoom: DynamicTileRoomSpec;
  doors: DynamicDoorwaySpec[];
  verticalWalls: Array<{
    x: number;
    y0: number;
    y1: number;
    gaps: Array<[number, number]>;
  }>;
  isClassicEightLayout: boolean;
  roomCount: number;
  signature: string;
}

const CLASSIC_TILE_RECTS: Record<string, readonly [number, number, number, number]> = {
  sop_sec_audit_01: [0, 0, 7, 5],
  sop_strategy_01: [7, 0, 17, 5],
  sop_coding_01: [17, 0, 24, 5],
  sop_generic_7p: [0, 5, 24, 9],
  sop_research_01: [0, 9, 6, 14],
  sop_analytics_01: [6, 9, 12, 14],
  sop_legal_01: [12, 9, 18, 14],
  sop_operations_01: [18, 9, 24, 14],
};

const CLASSIC_DOORS: ReadonlyArray<DynamicDoorwaySpec> = [
  { id: 'D1', roomCanonicalId: 'sop_sec_audit_01', label: 'SOP-SEC-AUDIT-01 ↔ Spine', x: 3, band: 5, roomPoint: [3.5, 4.55], spinePoint: [3.5, 6.6] },
  { id: 'D2', roomCanonicalId: 'sop_strategy_01', label: 'SOP-STRATEGY-01 ↔ Spine', x: 11, band: 5, roomPoint: [11.5, 4.55], spinePoint: [11.35, 6.6] },
  { id: 'D3', roomCanonicalId: 'sop_coding_01', label: 'SOP-CODING-01 ↔ Spine', x: 20, band: 5, roomPoint: [20.5, 4.55], spinePoint: [20.5, 6.6] },
  { id: 'D4', roomCanonicalId: 'sop_research_01', label: 'SOP-RESEARCH-01 ↔ Spine', x: 4, band: 9, roomPoint: [4.9, 11.5], spinePoint: [4.5, 8.55] },
  { id: 'D5', roomCanonicalId: 'sop_analytics_01', label: 'SOP-ANALYTICS-01 ↔ Spine', x: 11, band: 9, roomPoint: [11.5, 10.65], spinePoint: [11.5, 8.55] },
  { id: 'D6', roomCanonicalId: 'sop_legal_01', label: 'SOP-LEGAL-01 ↔ Spine', x: 16, band: 9, roomPoint: [16.5, 10.65], spinePoint: [16.5, 8.55] },
  { id: 'D7', roomCanonicalId: 'sop_operations_01', label: 'SOP-OPERATIONS-01 ↔ Spine', x: 21, band: 9, roomPoint: [21.6, 10.7], spinePoint: [21.5, 8.55] },
];

const CLASSIC_PCT_ANCHORS: Record<string, { desks: Array<{ x: number; y: number }>; patrol: Array<{ x: number; y: number }> }> = {
  sop_sec_audit_01: {
    desks: [{ x: 7.1, y: 19.6 }, { x: 15.0, y: 19.6 }, { x: 22.9, y: 19.6 }, { x: 9.2, y: 33.9 }, { x: 17.9, y: 33.9 }],
    patrol: [{ x: 14.6, y: 25.0 }, { x: 19.6, y: 25.0 }],
  },
  sop_strategy_01: {
    desks: [{ x: 50.0, y: 19.0 }, { x: 35.8, y: 33.9 }, { x: 64.2, y: 33.9 }],
    patrol: [{ x: 48.9, y: 23.9 }, { x: 50.0, y: 26.0 }],
  },
  sop_coding_01: {
    desks: [{ x: 77.9, y: 19.6 }, { x: 85.8, y: 19.6 }, { x: 93.8, y: 19.6 }, { x: 77.9, y: 33.9 }, { x: 93.8, y: 33.9 }],
    patrol: [{ x: 73.1, y: 25.0 }, { x: 81.9, y: 20.4 }],
  },
  sop_generic_7p: {
    desks: [{ x: 37.1, y: 60.0 }, { x: 70.4, y: 60.0 }, { x: 16.3, y: 52.9 }, { x: 90.0, y: 60.0 }, { x: 47.9, y: 60.4 }],
    patrol: [{ x: 42.5, y: 61.1 }, { x: 57.5, y: 61.1 }],
  },
  sop_research_01: {
    desks: [{ x: 7.1, y: 92.1 }, { x: 15.0, y: 92.1 }, { x: 4.6, y: 84.3 }],
    patrol: [{ x: 16.0, y: 82.5 }, { x: 14.8, y: 92.5 }],
  },
  sop_analytics_01: {
    desks: [{ x: 34.2, y: 75.7 }, { x: 37.5, y: 89.3 }, { x: 40.8, y: 75.7 }],
    patrol: [{ x: 45.4, y: 87.9 }, { x: 47.9, y: 76.1 }],
  },
  sop_legal_01: {
    desks: [{ x: 57.9, y: 88.9 }, { x: 66.3, y: 88.9 }, { x: 71.7, y: 95.7 }],
    patrol: [{ x: 70.4, y: 85.0 }, { x: 66.9, y: 89.6 }],
  },
  sop_operations_01: {
    desks: [{ x: 95.4, y: 87.1 }, { x: 85.4, y: 91.4 }, { x: 94.2, y: 91.4 }],
    patrol: [{ x: 88.8, y: 82.1 }, { x: 89.8, y: 92.5 }],
  },
};

function computeRoomDeskAnchorsPct(
  tileRect: readonly [number, number, number, number],
  seatCount: number,
  isSpine: boolean,
): { desks: Array<{ x: number; y: number }>; patrol: Array<{ x: number; y: number }> } {
  const [x0, y0, x1, y1] = tileRect;
  const tileW = Math.max(2, x1 - x0);
  const tileH = Math.max(2, y1 - y0);
  const safeCount = Math.max(1, Math.min(6, seatCount));

  const padX = tileW <= 3.5 ? 0.55 : 1.05;
  const minX = x0 + padX;
  const maxX = x1 - padX;
  const topSafeY = y0 === 0 ? y0 + 2.3 : y0 + 1.85;
  const botSafeY = y1 - 0.55;
  const cols = safeCount <= 2 ? safeCount : safeCount <= 4 ? Math.min(safeCount, Math.max(2, Math.floor(tileW / 2))) : 3;
  const rows = Math.ceil(safeCount / Math.max(1, cols));

  const desks: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < safeCount; i++) {
    const colIdx = i % cols;
    const rowIdx = Math.floor(i / cols);
    const colFrac = cols === 1 ? 0.5 : (colIdx + 0.5) / cols;
    const rowFrac = rows === 1 ? (isSpine ? 0.68 : 0.45) : (rowIdx + 0.35) / Math.max(1, rows);
    const tx = minX + colFrac * Math.max(0.5, maxX - minX);
    const ty = topSafeY + rowFrac * Math.max(0.4, botSafeY - topSafeY);
    desks.push({
      x: Number(((tx / 24) * 100).toFixed(1)),
      y: Number(((ty / 14) * 100).toFixed(1)),
    });
  }

  const cxPct = Number((((x0 + tileW * 0.48) / 24) * 100).toFixed(1));
  const cxPct2 = Number((((x0 + tileW * 0.56) / 24) * 100).toFixed(1));
  const cyPct = Number((((y0 + tileH * 0.62) / 14) * 100).toFixed(1));
  return {
    desks,
    patrol: [
      { x: cxPct, y: cyPct },
      { x: cxPct2, y: cyPct },
    ],
  };
}

/**
 * Computes a collision-free 24x14 tile-grid floorplan for arbitrary N >= 1 active SOPs,
 * preserving classic 8-room D1..D7 coordinates while procedurally tiling non-8 or custom sets.
 */
export function computeDynamicPixelFloorplan(
  zones?: OpenOfficeZone[],
  departments?: OpenOfficeDepartmentDossier[],
  seatCountsByRoom?: Record<string, number>,
): DynamicPixelFloorplanSpec {
  const specs = buildDynamicRoomSpecs(zones, departments);
  const classicSpecialistIds = new Set([
    'sop_sec_audit_01',
    'sop_strategy_01',
    'sop_coding_01',
    'sop_research_01',
    'sop_analytics_01',
    'sop_legal_01',
    'sop_operations_01',
  ]);
  const isClassicEightLayout =
    specs.length === 8 &&
    specs.some((s) => s.canonicalId === 'sop_generic_7p') &&
    specs.filter((s) => s.canonicalId !== 'sop_generic_7p').every((s) => classicSpecialistIds.has(s.canonicalId));

  const spineSpec = specs.find((s) => s.isSpine || s.canonicalId === 'sop_generic_7p') || specs[0];
  const specialists = specs.filter((s) => s.canonicalId !== spineSpec.canonicalId);
  const M = specialists.length;

  const toPctRect = (tr: readonly [number, number, number, number]) => ({
    x: Number(((tr[0] / 24) * 100).toFixed(2)),
    y: Number(((tr[1] / 14) * 100).toFixed(2)),
    w: Number((((tr[2] - tr[0]) / 24) * 100).toFixed(2)),
    h: Number((((tr[3] - tr[1]) / 14) * 100).toFixed(2)),
  });

  const maxDesksForWidth = (tileW: number) =>
    tileW >= 12 ? 6 : tileW >= 6 ? 4 : tileW >= 3 ? 3 : 2;

  const buildRoomSpec = (
    spec: ArchitecturalRoomSpec,
    tileRect: readonly [number, number, number, number],
    doorId: string | null,
  ): DynamicTileRoomSpec => {
    const tileW = Math.max(1, tileRect[2] - tileRect[0]);
    const requested = seatCountsByRoom?.[spec.canonicalId];
    const defaultSeats = spec.isSpine ? 4 : 3;
    const seatCapacity = Math.max(
      1,
      Math.min(maxDesksForWidth(tileW), typeof requested === 'number' && Number.isFinite(requested) ? requested : defaultSeats),
    );
    const themeDomain = resolveSopThemeDomain({
      canonicalId: spec.canonicalId,
      sopId: spec.sopId,
      primarySkills: spec.primarySkills,
      isSpine: spec.isSpine,
    });
    const classicAnchors = isClassicEightLayout ? CLASSIC_PCT_ANCHORS[spec.canonicalId] : undefined;
    const proceduralAnchors = computeRoomDeskAnchorsPct(tileRect, seatCapacity, spec.isSpine);
    const desks =
      classicAnchors && seatCapacity <= classicAnchors.desks.length
        ? classicAnchors.desks
        : proceduralAnchors.desks;
    const patrol = classicAnchors ? classicAnchors.patrol : proceduralAnchors.patrol;

    return {
      canonicalId: spec.canonicalId,
      sopId: spec.sopId,
      name: spec.viTitle,
      enName: spec.enTitle,
      subtitle: spec.viSubtitle,
      primarySkills: spec.primarySkills,
      isSpine: spec.isSpine,
      visualSlot: spec.visualSlot,
      themeDomain,
      accent: spec.canonicalId === spineSpec.canonicalId ? 'border-amber-500/30' : 'border-border',
      tileRect,
      pctRect: toPctRect(tileRect),
      seatCapacity,
      deskAnchors: desks,
      patrolWaypoints: patrol,
      doorId,
    };
  };

  if (specs.length === 1) {
    const solo = buildRoomSpec(spineSpec, [0, 0, 24, 14], null);
    return {
      rooms: [solo],
      spineRoom: solo,
      doors: [],
      verticalWalls: [],
      isClassicEightLayout: false,
      roomCount: 1,
      signature: `${solo.canonicalId}:${solo.sopId}:${solo.seatCapacity}:${solo.themeDomain}`,
    };
  }

  if (isClassicEightLayout) {
    const rooms = specs.map((sp) => {
      const tr = CLASSIC_TILE_RECTS[sp.canonicalId] || [0, 5, 24, 9];
      const door = CLASSIC_DOORS.find((d) => d.roomCanonicalId === sp.canonicalId);
      return buildRoomSpec(sp, tr, door ? door.id : null);
    });
    const spineRoom = rooms.find((r) => r.canonicalId === spineSpec.canonicalId) || rooms[0];
    const doors = CLASSIC_DOORS.map((d) => {
      const rm = rooms.find((r) => r.canonicalId === d.roomCanonicalId);
      return rm ? { ...d, label: `${rm.sopId} ↔ Spine` } : d;
    });
    const verticalWalls = [
      { x: 7, y0: 0, y1: 5, gaps: [[2.2, 0.9]] as Array<[number, number]> },
      { x: 17, y0: 0, y1: 5, gaps: [[2.2, 0.9]] as Array<[number, number]> },
      { x: 6, y0: 9, y1: 14, gaps: [[11.2, 0.9]] as Array<[number, number]> },
      { x: 12, y0: 9, y1: 14, gaps: [[11.2, 0.9]] as Array<[number, number]> },
      { x: 18, y0: 9, y1: 14, gaps: [[11.2, 0.9]] as Array<[number, number]> },
    ];
    return {
      rooms,
      spineRoom,
      doors,
      verticalWalls,
      isClassicEightLayout: true,
      roomCount: rooms.length,
      signature: rooms
        .map((r) => `${r.canonicalId}:${r.sopId}:${r.seatCapacity}:${r.themeDomain}:${r.tileRect.join(',')}`)
        .join('|'),
    };
  }

  const topCount = M === 1 ? 1 : Math.floor(M / 2);
  const botCount = M - topCount;
  const spineTileRect: readonly [number, number, number, number] =
    botCount === 0 ? [0, 5, 24, 14] : [0, 5, 24, 9];

  const topSpecs = specialists.slice(0, topCount);
  const botSpecs = specialists.slice(topCount);

  const doors: DynamicDoorwaySpec[] = [];
  const verticalWalls: Array<{ x: number; y0: number; y1: number; gaps: Array<[number, number]> }> = [];
  const builtMap = new Map<string, DynamicTileRoomSpec>();
  let doorSeq = 1;

  topSpecs.forEach((sp, i) => {
    const x0 = Math.round((24 * i) / topCount);
    const x1 = Math.round((24 * (i + 1)) / topCount);
    const doorX = Math.max(x0 + 1, Math.min(x1 - 2, Math.floor((x0 + x1) / 2)));
    const doorId = `D${doorSeq++}`;
    doors.push({
      id: doorId,
      roomCanonicalId: sp.canonicalId,
      label: `${sp.sopId} ↔ Spine`,
      x: doorX,
      band: 5,
      roomPoint: [Number((doorX + 0.5).toFixed(2)), 4.55],
      spinePoint: [Number((doorX + 0.5).toFixed(2)), 6.6],
    });
    if (i < topCount - 1) {
      verticalWalls.push({ x: x1, y0: 0, y1: 5, gaps: [[2.2, 0.9]] });
    }
    builtMap.set(sp.canonicalId, buildRoomSpec(sp, [x0, 0, x1, 5], doorId));
  });

  builtMap.set(spineSpec.canonicalId, buildRoomSpec(spineSpec, spineTileRect, null));

  botSpecs.forEach((sp, i) => {
    const x0 = Math.round((24 * i) / botCount);
    const x1 = Math.round((24 * (i + 1)) / botCount);
    const doorX = Math.max(x0 + 1, Math.min(x1 - 2, Math.floor((x0 + x1) / 2)));
    const doorId = `D${doorSeq++}`;
    doors.push({
      id: doorId,
      roomCanonicalId: sp.canonicalId,
      label: `${sp.sopId} ↔ Spine`,
      x: doorX,
      band: 9,
      roomPoint: [Number((doorX + 0.5).toFixed(2)), 10.65],
      spinePoint: [Number((doorX + 0.5).toFixed(2)), 8.55],
    });
    if (i < botCount - 1) {
      verticalWalls.push({ x: x1, y0: 9, y1: 14, gaps: [[11.2, 0.9]] });
    }
    builtMap.set(sp.canonicalId, buildRoomSpec(sp, [x0, 9, x1, 14], doorId));
  });

  const rooms = specs.map((sp) => builtMap.get(sp.canonicalId)!);
  const spineRoom = builtMap.get(spineSpec.canonicalId)!;
  return {
    rooms,
    spineRoom,
    doors,
    verticalWalls,
    isClassicEightLayout: false,
    roomCount: rooms.length,
    signature: rooms
      .map((r) => `${r.canonicalId}:${r.sopId}:${r.seatCapacity}:${r.themeDomain}:${r.tileRect.join(',')}`)
      .join('|'),
  };
}
