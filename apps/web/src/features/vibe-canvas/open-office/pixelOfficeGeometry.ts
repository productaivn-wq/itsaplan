export const STAGE_W = 960;
export const STAGE_H = 560;

export interface CanonicalRoom {
  id: string;
  name: string;
  subtitle: string;
  kind: 'pod' | 'lounge' | 'suite';
  x: number;
  y: number;
  w: number;
  h: number;
  accent: string;
  deskAnchors: Array<{ x: number; y: number }>;
  patrolWaypoints: Array<{ x: number; y: number }>;
}

export const CANONICAL_ROOMS: Record<string, CanonicalRoom> = {
  sop_sec_audit_01: {
    id: 'sop_sec_audit_01',
    name: 'Kiểm Toán Bảo Mật & QA',
    subtitle: 'SAST & QualityGate',
    kind: 'pod',
    x: 0,
    y: 0,
    w: 29.1,
    h: 35.7,
    accent: 'border-emerald-500/30',
    deskAnchors: [
      { x: 7.1, y: 19.6 },
      { x: 15.0, y: 19.6 },
      { x: 22.9, y: 19.6 },
      { x: 9.2, y: 33.9 },
      { x: 17.9, y: 33.9 },
    ],
    patrolWaypoints: [
      { x: 14.6, y: 25.0 },
      { x: 19.6, y: 25.0 },
    ],
  },
  sop_strategy_01: {
    id: 'sop_strategy_01',
    name: 'Chiến Lược & Kiến Trúc',
    subtitle: '7H Strategy & IPO',
    kind: 'suite',
    x: 29.2,
    y: 0,
    w: 41.6,
    h: 35.7,
    accent: 'border-indigo-500/30',
    deskAnchors: [
      { x: 50.0, y: 19.0 },
      { x: 35.8, y: 33.9 },
      { x: 64.2, y: 33.9 },
    ],
    patrolWaypoints: [
      { x: 48.9, y: 23.9 },
      { x: 50.0, y: 26.0 },
    ],
  },
  sop_coding_01: {
    id: 'sop_coding_01',
    name: 'Kỹ Thuật Phần Mềm & TDD',
    subtitle: 'Quy chuẩn & kiểm thử tự động',
    kind: 'pod',
    x: 70.9,
    y: 0,
    w: 29.1,
    h: 35.7,
    accent: 'border-violet-500/30',
    deskAnchors: [
      { x: 77.9, y: 19.6 },
      { x: 85.8, y: 19.6 },
      { x: 93.8, y: 19.6 },
      { x: 77.9, y: 33.9 },
      { x: 93.8, y: 33.9 },
    ],
    patrolWaypoints: [
      { x: 73.1, y: 25.0 },
      { x: 81.9, y: 20.4 },
    ],
  },
  sop_generic_7p: {
    id: 'sop_generic_7p',
    name: 'Điều Phối & Vibe Working',
    subtitle: 'Core 7-Phase Spine',
    kind: 'lounge',
    x: 0,
    y: 35.7,
    w: 100,
    h: 28.6,
    accent: 'border-amber-500/30',
    deskAnchors: [
      { x: 37.1, y: 60.0 },
      { x: 70.4, y: 60.0 },
      { x: 16.3, y: 52.9 },
      { x: 90.0, y: 60.0 },
      { x: 47.9, y: 60.4 },
    ],
    patrolWaypoints: [
      { x: 42.5, y: 61.1 },
      { x: 57.5, y: 61.1 },
    ],
  },
  sop_research_01: {
    id: 'sop_research_01',
    name: 'Nghiên Cứu & Thị Trường',
    subtitle: 'Citations & WeKnora',
    kind: 'suite',
    x: 0,
    y: 64.3,
    w: 25,
    h: 35.7,
    accent: 'border-cyan-500/30',
    deskAnchors: [
      { x: 7.1, y: 92.1 },
      { x: 15.0, y: 92.1 },
      { x: 4.6, y: 84.3 },
    ],
    patrolWaypoints: [
      { x: 16.0, y: 82.5 },
      { x: 14.8, y: 92.5 },
    ],
  },
  sop_analytics_01: {
    id: 'sop_analytics_01',
    name: 'Phân Tích Dữ Liệu & BI',
    subtitle: '5-Tier BI & FinOps',
    kind: 'suite',
    x: 25,
    y: 64.3,
    w: 25,
    h: 35.7,
    accent: 'border-rose-500/30',
    deskAnchors: [
      { x: 34.2, y: 75.7 },
      { x: 37.5, y: 89.3 },
      { x: 40.8, y: 75.7 },
    ],
    patrolWaypoints: [
      { x: 45.4, y: 87.9 },
      { x: 47.9, y: 76.1 },
    ],
  },
  sop_legal_01: {
    id: 'sop_legal_01',
    name: 'Pháp Lý & Tuân Thủ',
    subtitle: 'NDA, GDPR & RBAC',
    kind: 'suite',
    x: 50,
    y: 64.3,
    w: 25,
    h: 35.7,
    accent: 'border-purple-500/30',
    deskAnchors: [
      { x: 57.9, y: 88.9 },
      { x: 66.3, y: 88.9 },
      { x: 71.7, y: 95.7 },
    ],
    patrolWaypoints: [
      { x: 70.4, y: 85.0 },
      { x: 66.9, y: 89.6 },
    ],
  },
  sop_operations_01: {
    id: 'sop_operations_01',
    name: 'Vận Hành, Đa Kênh & DR',
    subtitle: 'OmniChat, MECE & DR',
    kind: 'suite',
    x: 75,
    y: 64.3,
    w: 25,
    h: 35.7,
    accent: 'border-teal-500/30',
    deskAnchors: [
      { x: 95.4, y: 87.1 },
      { x: 85.4, y: 91.4 },
      { x: 94.2, y: 91.4 },
    ],
    patrolWaypoints: [
      { x: 88.8, y: 82.1 },
      { x: 89.8, y: 92.5 },
    ],
  },
};

export const SLOT_TO_CANONICAL_ROOM: Record<string, CanonicalRoom> = {
  soan: CANONICAL_ROOMS.sop_sec_audit_01,
  dieu: CANONICAL_ROOMS.sop_strategy_01,
  trinh: CANONICAL_ROOMS.sop_coding_01,
  sanh: CANONICAL_ROOMS.sop_generic_7p,
  tracuu: CANONICAL_ROOMS.sop_research_01,
  hop: CANONICAL_ROOMS.sop_analytics_01,
  thugian: CANONICAL_ROOMS.sop_legal_01,
  morong: CANONICAL_ROOMS.sop_operations_01,
};

export const ZONE_ALIAS_MAP: Record<string, string> = {
  // Canonical SOPRegistry zone keys
  sop_generic_7p: 'sop_generic_7p',
  sop_coding_01: 'sop_coding_01',
  sop_sec_audit_01: 'sop_sec_audit_01',
  sop_research_01: 'sop_research_01',
  sop_analytics_01: 'sop_analytics_01',
  sop_strategy_01: 'sop_strategy_01',
  sop_legal_01: 'sop_legal_01',
  sop_operations_01: 'sop_operations_01',
  // Legacy corporate & fixture zone aliases
  'zone-ba-test': 'sop_sec_audit_01',
  'zone-ba': 'sop_sec_audit_01',
  ba_tester: 'sop_sec_audit_01',
  'ba-test': 'sop_sec_audit_01',
  'zone-exec': 'sop_generic_7p',
  exec_hq: 'sop_generic_7p',
  exec: 'sop_generic_7p',
  'zone-ai-dev': 'sop_coding_01',
  ai_dev: 'sop_coding_01',
  'ai-dev': 'sop_coding_01',
  'zone-commons': 'sop_generic_7p',
  central_lobby: 'sop_generic_7p',
  commons: 'sop_generic_7p',
  'zone-training': 'sop_research_01',
  academy: 'sop_research_01',
  training: 'sop_research_01',
  training_hub: 'sop_research_01',
  'zone-meeting': 'sop_strategy_01',
  war_room: 'sop_strategy_01',
  meeting: 'sop_strategy_01',
  meeting_room: 'sop_strategy_01',
  'zone-hcns': 'sop_legal_01',
  hr_ops: 'sop_legal_01',
  hcns: 'sop_legal_01',
  hr_admin: 'sop_legal_01',
  'zone-business': 'sop_analytics_01',
  commercial: 'sop_analytics_01',
  business: 'sop_analytics_01',
  business_ops: 'sop_analytics_01',
};

export interface Point2D {
  x: number;
  y: number;
}

export interface RoomDoorway {
  x: number;
  roomY: number;
  lobbyY: number;
}

export const ROOM_DOORWAYS: Record<string, RoomDoorway> = {
  // Canonical SOP keys
  sop_sec_audit_01: { x: 184, roomY: 168, lobbyY: 202 },
  sop_strategy_01: { x: 492, roomY: 176, lobbyY: 202 },
  sop_coding_01: { x: 816, roomY: 168, lobbyY: 202 },
  sop_generic_7p: { x: 478, roomY: 282, lobbyY: 282 },
  sop_research_01: { x: 165, roomY: 410, lobbyY: 362 },
  sop_analytics_01: { x: 388, roomY: 410, lobbyY: 362 },
  sop_legal_01: { x: 618, roomY: 410, lobbyY: 362 },
  sop_operations_01: { x: 840, roomY: 410, lobbyY: 362 },
  // Direct LimeZu visual slots
  soan: { x: 184, roomY: 168, lobbyY: 202 },
  dieu: { x: 492, roomY: 176, lobbyY: 202 },
  trinh: { x: 816, roomY: 168, lobbyY: 202 },
  sanh: { x: 478, roomY: 282, lobbyY: 282 },
  tracuu: { x: 165, roomY: 410, lobbyY: 362 },
  hop: { x: 388, roomY: 410, lobbyY: 362 },
  thugian: { x: 618, roomY: 410, lobbyY: 362 },
  morong: { x: 840, roomY: 410, lobbyY: 362 },
};

export function computeCorridorPath(
  _currentPos: Point2D,
  currentRoom: string,
  targetRoom: string,
  targetPos: Point2D,
): Point2D[] {
  if (currentRoom === targetRoom) {
    return [targetPos];
  }
  const curDw = ROOM_DOORWAYS[currentRoom] || ROOM_DOORWAYS.sop_generic_7p;
  const tgtDw = ROOM_DOORWAYS[targetRoom] || ROOM_DOORWAYS.sop_generic_7p;
  const path: Point2D[] = [];

  if (currentRoom !== 'sop_generic_7p' && currentRoom !== 'central_lobby') {
    path.push({ x: curDw.x, y: curDw.roomY });
    path.push({ x: curDw.x, y: curDw.lobbyY });
  }
  if (targetRoom !== 'sop_generic_7p' && targetRoom !== 'central_lobby') {
    path.push({ x: tgtDw.x, y: tgtDw.lobbyY });
    path.push({ x: tgtDw.x, y: tgtDw.roomY });
  }
  path.push(targetPos);
  return path;
}

export function formatAgentHandle(name: string, agentId?: string | null): string {
  const low = `${name} ${agentId || ''}`.toLowerCase();
  if (low.includes('muse')) return '@muse';
  if (low.includes('antigravity') || low.includes('gemini') || low.includes('agy')) return '@antigravity';
  if (low.includes('research')) return '@research';
  if (low.includes('orchestrator') || low.includes('genesis')) return '@orchestrator';
  if (low.includes('qualitygate') || low.includes('quality') || low.includes('tester') || low.includes('sast')) return '@qualitygate';
  if (low.includes('claude')) return '@claude';
  if (low.includes('codex')) return '@codex';
  return name.replace(/\s+Agent$/i, '').trim() || name;
}

export function getDeskToolBadge(
  toolBadge?: string,
  role?: string,
  status?: string,
): { icon: string; title: string } {
  const tb = (toolBadge || '').toLowerCase();
  const r = (role || '').toLowerCase();
  if (tb === 'design' || r.includes('design') || r.includes('creative') || r.includes('ui/ux') || r.includes('muse')) {
    return { icon: '✦', title: 'design' };
  }
  if (tb === 'code' || r.includes('code') || r.includes('dev') || r.includes('engineer')) {
    return { icon: '💻', title: 'code' };
  }
  if (tb === 'search' || r.includes('search') || r.includes('research')) {
    return { icon: '🔎', title: 'search' };
  }
  if (tb === 'doc' || r.includes('doc') || r.includes('orchestrator')) {
    return { icon: '📋', title: 'doc' };
  }
  if (tb === 'review' || r.includes('quality') || r.includes('audit')) {
    return { icon: '🛡️', title: 'review' };
  }
  if (tb === 'idle' || status === 'IDLE') {
    return { icon: '☕', title: 'idle' };
  }
  return { icon: '🎧', title: 'focus' };
}

export function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

