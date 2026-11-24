import { TILE, type LimeZuRoomKey } from './limezuTypes';

// ============================================================================
// DIJKSTRA WAYPOINT GRAPH & FURNITURE OBSTACLE AVOIDANCE
// ============================================================================

export const LIMEZU_ZONES: Record<LimeZuRoomKey, readonly [number, number, number, number]> = {
  soan: [0, 0, 7, 5],
  dieu: [7, 0, 17, 5],
  trinh: [17, 0, 24, 5],
  sanh: [0, 5, 24, 9],
  tracuu: [0, 9, 6, 14],
  hop: [6, 9, 12, 14],
  thugian: [12, 9, 18, 14],
  morong: [18, 9, 24, 14],
};

export function limeZuZoneOf(x: number, y: number): LimeZuRoomKey {
  const keys = Object.keys(LIMEZU_ZONES) as LimeZuRoomKey[];
  for (const z of keys) {
    const r = LIMEZU_ZONES[z];
    if (x >= r[0] && x < r[2] && y >= r[1] && y < r[3]) return z;
  }
  return 'sanh';
}

export const LIMEZU_WN: Record<string, readonly [number, number]> = {
  C_soan: [4.7, 3.5],
  C_dieu: [11.75, 3.35],
  C_trinh: [17.55, 3.5],
  C_tracuu: [3.85, 11.55],
  C_hop: [10.9, 12.3],
  C_thugian: [16.9, 11.9],
  C_morong: [21.3, 11.5],
  S_in: [3.5, 4.55],
  S_out: [3.5, 6.6],
  D_in: [11.5, 4.55],
  D_out: [11.35, 6.6],
  T_in: [20.5, 4.55],
  T_out: [20.5, 6.6],
  TC_in: [4.9, 11.5],
  H_in: [11.5, 10.65],
  TG_in: [16.5, 10.65],
  MR_in: [21.6, 10.7],
  W_tc: [3.55, 12.95],
  W_hc: [16.05, 12.55],
  L_w: [3.5, 8.55],
  L_tc: [4.5, 8.55],
  L_fw: [10.2, 8.55],
  L_mid: [11.5, 8.55],
  L_fe: [13.8, 8.55],
  L_tg: [16.5, 8.55],
  L_tr: [20.5, 8.55],
  L_mr: [21.5, 8.55],
  SD1w: [6.55, 2.65],
  SD1e: [7.45, 2.65],
  SD2w: [16.55, 2.65],
  SD2e: [17.45, 2.65],
  SD3w: [5.5, 11.75],
  SD3e: [6.5, 11.75],
  SD4w: [11.5, 11.75],
  SD4e: [12.55, 11.75],
  SD5w: [17.5, 11.75],
  SD5e: [18.55, 11.75],
  S_mid: [3.5, 3.5],
  M_sw: [18.35, 13.7],
  TG_w: [13.1, 10.62],
  A_w: [17.9, 2.85],
  A_m: [19.65, 2.78],
  A_s: [19.65, 4.55],
  T_sw: [1.05, 12.9],
  M_lane: [21.55, 12.19],
  M_gap: [21.55, 13.72],
};

const LIMEZU_WZONE: Record<string, LimeZuRoomKey> = {
  C_soan: 'soan',
  S_in: 'soan',
  SD1w: 'soan',
  S_mid: 'soan',
  C_dieu: 'dieu',
  D_in: 'dieu',
  SD1e: 'dieu',
  SD2w: 'dieu',
  C_trinh: 'trinh',
  T_in: 'trinh',
  SD2e: 'trinh',
  A_w: 'trinh',
  A_m: 'trinh',
  A_s: 'trinh',
  C_tracuu: 'tracuu',
  TC_in: 'tracuu',
  SD3w: 'tracuu',
  W_tc: 'tracuu',
  T_sw: 'tracuu',
  C_hop: 'hop',
  H_in: 'hop',
  SD3e: 'hop',
  SD4w: 'hop',
  C_thugian: 'thugian',
  TG_in: 'thugian',
  SD4e: 'thugian',
  SD5w: 'thugian',
  W_hc: 'thugian',
  TG_w: 'thugian',
  C_morong: 'morong',
  MR_in: 'morong',
  SD5e: 'morong',
  M_sw: 'morong',
  M_lane: 'morong',
  M_gap: 'morong',
  S_out: 'sanh',
  D_out: 'sanh',
  T_out: 'sanh',
  L_w: 'sanh',
  L_tc: 'sanh',
  L_fw: 'sanh',
  L_mid: 'sanh',
  L_fe: 'sanh',
  L_tg: 'sanh',
  L_tr: 'sanh',
  L_mr: 'sanh',
};

const LIMEZU_WEDGES: ReadonlyArray<readonly [string, string]> = [
  ['S_in', 'S_mid'],
  ['S_mid', 'C_soan'],
  ['C_soan', 'SD1w'],
  ['C_dieu', 'D_in'],
  ['C_dieu', 'SD1e'],
  ['C_dieu', 'SD2w'],
  ['C_trinh', 'A_w'],
  ['A_w', 'A_m'],
  ['A_m', 'A_s'],
  ['A_s', 'T_in'],
  ['C_trinh', 'SD2e'],
  ['C_tracuu', 'TC_in'],
  ['C_tracuu', 'SD3w'],
  ['C_tracuu', 'W_tc'],
  ['W_tc', 'TC_in'],
  ['W_tc', 'T_sw'],
  ['C_hop', 'H_in'],
  ['C_hop', 'SD3e'],
  ['C_hop', 'SD4w'],
  ['C_thugian', 'TG_in'],
  ['TG_in', 'TG_w'],
  ['TG_w', 'SD4e'],
  ['C_thugian', 'SD5w'],
  ['W_hc', 'C_thugian'],
  ['C_morong', 'MR_in'],
  ['SD5e', 'M_sw'],
  ['C_morong', 'SD5e'],
  ['C_morong', 'M_lane'],
  ['M_lane', 'M_gap'],
  ['S_in', 'S_out'],
  ['D_in', 'D_out'],
  ['T_in', 'T_out'],
  ['TC_in', 'L_tc'],
  ['H_in', 'L_mid'],
  ['TG_in', 'L_tg'],
  ['MR_in', 'L_mr'],
  ['SD1w', 'SD1e'],
  ['SD2w', 'SD2e'],
  ['SD3w', 'SD3e'],
  ['SD4w', 'SD4e'],
  ['SD5w', 'SD5e'],
  ['S_out', 'L_w'],
  ['L_w', 'L_tc'],
  ['L_tc', 'L_fw'],
  ['L_fw', 'L_mid'],
  ['L_mid', 'L_fe'],
  ['L_fe', 'L_tg'],
  ['L_tg', 'L_tr'],
  ['L_tr', 'L_mr'],
  ['T_out', 'L_tr'],
  ['D_out', 'L_mid'],
  ['D_out', 'L_fe'],
];

const WADJ: Record<string, string[]> = {};
for (const [a, b] of LIMEZU_WEDGES) {
  (WADJ[a] = WADJ[a] || []).push(b);
  (WADJ[b] = WADJ[b] || []).push(a);
}

export const LIMEZU_FURN: Record<LimeZuRoomKey, ReadonlyArray<readonly [number, number, number, number]>> = {
  soan: [
    [1.11, 0.98, 2.29, 2.45],
    [3.01, 0.98, 4.19, 2.45],
    [4.91, 0.98, 6.09, 2.45],
    [1.61, 3.73, 2.79, 4.55],
    [3.71, 3.73, 4.89, 4.55],
    [5.76, 3.48, 6.94, 4.95],
    [0.15, 3.3, 0.74, 4.48],
  ],
  dieu: [
    [10.76, 1.17, 11.94, 2.35],
    [12.03, 1.17, 13.21, 2.35],
    [8.01, 3.13, 9.19, 4.6],
    [14.81, 3.13, 15.99, 4.6],
    [15.76, 3.48, 16.94, 4.95],
    [16.08, 0.95, 16.89, 2.35],
  ],
  trinh: [
    [18.11, 0.98, 19.29, 2.45],
    [20.01, 0.98, 21.19, 2.45],
    [21.91, 0.98, 23.09, 2.45],
    [18.11, 3.08, 19.29, 4.55],
    [21.91, 3.08, 23.09, 4.55],
    [23.12, 0.78, 23.93, 2.18],
    [23.12, 2.18, 23.93, 3.58],
    [23.12, 3.58, 23.93, 4.98],
  ],
  tracuu: [
    [0.22, 9.5, 2.83, 11.3],
    [2.95, 9.62, 4.13, 10.87],
    [4.8, 9.62, 5.98, 10.87],
    [1.9, 11.19, 3.3, 12.55],
    [5.38, 10.6, 5.62, 11.02],
    [4.08, 13.07, 5.12, 13.92],
  ],
  hop: [
    [7.6, 10.55, 9.0, 11.91],
    [9.02, 10.55, 10.42, 11.91],
    [6.2, 12.68, 7.38, 13.93],
    [10.48, 13.07, 11.52, 13.92],
    [9.0, 12.74, 9.6, 13.92],
  ],
  thugian: [
    [12.3, 9.62, 14.49, 10.5],
    [17.3, 9.55, 17.89, 10.73],
    [13.31, 10.73, 14.49, 12.2],
    [15.31, 10.73, 16.49, 12.2],
    [12.48, 12.94, 13.02, 13.95],
    [13.91, 12.77, 15.09, 13.95],
    [16.5, 12.24, 17.9, 13.6],
  ],
  morong: [
    [18.12, 9.62, 19.89, 10.65],
    [22.31, 10.53, 23.49, 12.0],
    [19.91, 12.38, 21.09, 13.85],
    [22.01, 12.38, 23.19, 13.85],
    [18.46, 12.64, 19.54, 13.5],
  ],
  sanh: [
    [8.75, 6.75, 10.05, 7.85],
    [12.95, 6.75, 14.25, 7.85],
    [15.45, 6.43, 16.05, 7.9],
    [7.66, 5.95, 8.24, 7.42],
    [1.06, 6.72, 2.14, 7.6],
    [5.64, 5.86, 7.36, 7.22],
    [6.08, 7.27, 6.92, 8.08],
    [5.5, 7.53, 5.94, 8.34],
    [7.06, 7.53, 7.5, 8.34],
    [16.05, 6.62, 19.58, 7.8],
    [21.1, 6.62, 23.9, 7.8],
    [21.3, 7.42, 23.45, 8.38],
  ],
};

export function segClear(zone: LimeZuRoomKey, x0: number, y0: number, x1: number, y1: number): boolean {
  const rects = LIMEZU_FURN[zone] || [];
  const steps = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.05));
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const y = y0 + ((y1 - y0) * i) / steps;
    for (let j = 0; j < rects.length; j++) {
      const r = rects[j];
      if (x > r[0] + 0.05 && x < r[2] - 0.05 && y > r[1] + 0.05 && y < r[3] - 0.05) {
        return false;
      }
    }
  }
  return true;
}

function attachNodes(zone: LimeZuRoomKey): string[] {
  const out: string[] = [];
  for (const k of Object.keys(LIMEZU_WN)) {
    if (LIMEZU_WZONE[k] === zone) out.push(k);
  }
  return out;
}

function wpath(a: string, b: string): string[] | null {
  if (a === b) return [a];
  const dist: Record<string, number> = { [a]: 0 };
  const prev: Record<string, string> = {};
  const seen = new Set<string>();
  const q: string[] = [a];
  while (q.length) {
    let bi = 0;
    for (let i = 1; i < q.length; i++) {
      const di = dist[q[i]] ?? 1e18;
      const dbi = dist[q[bi]] ?? 1e18;
      if (di < dbi) bi = i;
    }
    const u = q.splice(bi, 1)[0];
    if (seen.has(u)) continue;
    seen.add(u);
    if (u === b) break;
    const nb = WADJ[u] || [];
    for (const v of nb) {
      const nd = (dist[u] ?? 0) + Math.hypot(LIMEZU_WN[u][0] - LIMEZU_WN[v][0], LIMEZU_WN[u][1] - LIMEZU_WN[v][1]);
      if (dist[v] === undefined || nd < dist[v]) {
        dist[v] = nd;
        prev[v] = u;
        if (!seen.has(v)) q.push(v);
      }
    }
  }
  if (dist[b] === undefined) return null;
  const path: string[] = [b];
  let cur = b;
  while (cur !== a) {
    cur = prev[cur];
    path.unshift(cur);
  }
  return path;
}

export function routeLimeZuTiles(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Array<[number, number]> {
  const z0 = limeZuZoneOf(x0, y0);
  const z1 = limeZuZoneOf(x1, y1);
  if (z0 === z1 && segClear(z0, x0, y0, x1, y1)) return [[x1, y1]];
  const cand0 = attachNodes(z0);
  const cand1 = attachNodes(z1);
  let best: Array<[number, number]> | null = null;
  let bestLen = 1e18;
  for (const a0 of cand0) {
    const p0 = LIMEZU_WN[a0];
    if (!segClear(z0, x0, y0, p0[0], p0[1])) continue;
    for (const a1 of cand1) {
      const p1 = LIMEZU_WN[a1];
      if (!segClear(z1, p1[0], p1[1], x1, y1)) continue;
      const gp = wpath(a0, a1);
      if (!gp) continue;
      const pts: Array<[number, number]> = [[x0, y0]];
      gp.forEach((k) => pts.push([LIMEZU_WN[k][0], LIMEZU_WN[k][1]]));
      pts.push([x1, y1]);
      let len = Math.hypot(p0[0] - x0, p0[1] - y0);
      for (let t = 1; t < pts.length; t++) {
        len += Math.hypot(pts[t][0] - pts[t - 1][0], pts[t][1] - pts[t - 1][1]);
      }
      if (len < bestLen) {
        bestLen = len;
        best = pts;
      }
    }
  }
  if (best) return best.slice(1);
  const f0 = z0 === 'sanh' ? 'L_mid' : `C_${z0}`;
  const f1 = z1 === 'sanh' ? 'L_mid' : `C_${z1}`;
  const gp2 = wpath(f0, f1) || [f0, f1];
  const pts2: Array<[number, number]> = [];
  gp2.forEach((k) => {
    if (LIMEZU_WN[k]) pts2.push([LIMEZU_WN[k][0], LIMEZU_WN[k][1]]);
  });
  pts2.push([x1, y1]);
  return pts2;
}

export function routeLimeZuPixels(
  x0Px: number,
  y0Px: number,
  x1Px: number,
  y1Px: number,
): Array<{ x: number; y: number }> {
  const tilePts = routeLimeZuTiles(x0Px / TILE, y0Px / TILE, x1Px / TILE, y1Px / TILE);
  return tilePts.map(([tx, ty]) => ({
    x: Math.round(tx * TILE),
    y: Math.round(ty * TILE),
  }));
}

export function routeLimeZuLen(x0: number, y0: number, x1: number, y1: number): number {
  const pts = routeLimeZuTiles(x0, y0, x1, y1);
  let total = 0;
  let px = x0;
  let py = y0;
  for (const [qx, qy] of pts) {
    total += Math.hypot(qx - px, qy - py);
    px = qx;
    py = qy;
  }
  return total;
}

export const LIMEZU_PET_SPOTS: ReadonlyArray<readonly [number, number]> = [
  'L_w',
  'L_tc',
  'L_fw',
  'L_mid',
  'L_fe',
  'L_tg',
  'L_tr',
  'L_mr',
  'S_out',
  'D_out',
  'T_out',
  'C_soan',
  'C_dieu',
  'C_trinh',
  'C_tracuu',
  'C_hop',
  'C_thugian',
  'C_morong',
]
  .map((k) => LIMEZU_WN[k])
  .filter((v): v is readonly [number, number] => Boolean(v));

const BASE_LIMEZU_ANCHORS: Record<LimeZuRoomKey, ReadonlyArray<{ x: number; y: number }>> = {
  soan: [
    { x: 1.7, y: 2.75 },
    { x: 3.6, y: 2.75 },
    { x: 5.5, y: 2.75 },
    { x: 2.2, y: 4.75 },
    { x: 4.3, y: 4.75 },
  ],
  dieu: [
    { x: 12.0, y: 2.55 },
    { x: 8.6, y: 4.75 },
    { x: 15.4, y: 4.75 },
  ],
  trinh: [
    { x: 18.7, y: 2.75 },
    { x: 20.6, y: 2.75 },
    { x: 22.5, y: 2.75 },
    { x: 18.7, y: 4.75 },
    { x: 22.5, y: 4.75 },
  ],
  sanh: [
    { x: 8.9, y: 8.4 },
    { x: 16.9, y: 8.4 },
    { x: 3.9, y: 7.4 },
    { x: 21.6, y: 8.4 },
    { x: 11.5, y: 8.45 },
  ],
  tracuu: [
    { x: 1.7, y: 12.9 },
    { x: 3.6, y: 12.9 },
    { x: 1.1, y: 11.8 },
  ],
  hop: [
    { x: 8.2, y: 10.6 },
    { x: 9.0, y: 12.5 },
    { x: 9.8, y: 10.6 },
  ],
  thugian: [
    { x: 13.9, y: 12.45 },
    { x: 15.9, y: 12.45 },
    { x: 17.2, y: 13.4 },
  ],
  morong: [
    { x: 22.9, y: 12.2 },
    { x: 20.5, y: 12.8 },
    { x: 22.6, y: 12.8 },
  ],
};

export const LIMEZU_ROOM_ANCHORS: Record<string, ReadonlyArray<{ x: number; y: number }>> = {
  // Canonical SOPRegistry zone keys
  sop_sec_audit_01: BASE_LIMEZU_ANCHORS.soan,
  sop_strategy_01: BASE_LIMEZU_ANCHORS.dieu,
  sop_coding_01: BASE_LIMEZU_ANCHORS.trinh,
  sop_generic_7p: BASE_LIMEZU_ANCHORS.sanh,
  sop_research_01: BASE_LIMEZU_ANCHORS.tracuu,
  sop_analytics_01: BASE_LIMEZU_ANCHORS.hop,
  sop_legal_01: BASE_LIMEZU_ANCHORS.thugian,
  sop_operations_01: BASE_LIMEZU_ANCHORS.morong,
  // Direct LimeZu visual slot keys
  soan: BASE_LIMEZU_ANCHORS.soan,
  dieu: BASE_LIMEZU_ANCHORS.dieu,
  trinh: BASE_LIMEZU_ANCHORS.trinh,
  sanh: BASE_LIMEZU_ANCHORS.sanh,
  tracuu: BASE_LIMEZU_ANCHORS.tracuu,
  hop: BASE_LIMEZU_ANCHORS.hop,
  thugian: BASE_LIMEZU_ANCHORS.thugian,
  morong: BASE_LIMEZU_ANCHORS.morong,
  // Legacy aliases
  ba_tester: BASE_LIMEZU_ANCHORS.soan,
  exec_hq: BASE_LIMEZU_ANCHORS.dieu,
  ai_dev: BASE_LIMEZU_ANCHORS.trinh,
  central_lobby: BASE_LIMEZU_ANCHORS.sanh,
  academy: BASE_LIMEZU_ANCHORS.tracuu,
  war_room: BASE_LIMEZU_ANCHORS.hop,
  hr_ops: BASE_LIMEZU_ANCHORS.thugian,
  commercial: BASE_LIMEZU_ANCHORS.morong,
};

