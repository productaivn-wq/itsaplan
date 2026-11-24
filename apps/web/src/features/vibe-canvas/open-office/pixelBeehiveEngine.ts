// 16-Bit Pixel-Art Beehive & Worker-Bee Colony Canvas + Sprite Engine
// Renders on the 960x560 (12:7) pixelated stage reusing /open-office/atlas.png props with PX=2 procedural fallbacks.

import {
  LIMEZU_SPR,
  LIMEZU_STAGE_H,
  LIMEZU_STAGE_W,
} from './limezuAtlasEngine';
import { BEEHIVE_CELL_LAYOUT, type BeehiveHexCellSpec } from './openOfficeConstants';

export type PixelBeeRole =
  | 'queen'
  | 'guard'
  | 'worker_active'
  | 'worker_standby'
  | 'subagent_active'
  | 'subagent_standby';

export interface PixelRectSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  opacity?: number;
}

export interface PixelBeehiveStageOptions {
  selectedCanonicalZone: string | null;
  workingCountByRoom: Record<string, number>;
  atlas: HTMLImageElement | null;
  cellLayout?: Record<string, BeehiveHexCellSpec>;
  queenRoomId?: string;
}

interface RoomVisualTheme {
  floorLight: string;
  floorMid: string;
  combLine: string;
  banner: string;
  props: ReadonlyArray<keyof typeof LIMEZU_SPR>;
  fallbackKind: 'royal' | 'servers' | 'qa' | 'atrium' | 'vault' | 'boardroom' | 'library' | 'commerce';
}

const PX = 2;
const SQRT3_OVER_2 = 0.8660254037844386;

const PALETTE = {
  outlineDark: '#1B1924',
  shadowDeep: '#141013',
  grassDark: '#2D5A34',
  grassMid: '#397040',
  grassLight: '#4A8E51',
  flowerGold: '#FBBF24',
  flowerPink: '#F472B6',
  flowerSky: '#38BDF8',
  trunkDark: '#4A2C18',
  trunkMid: '#6B4226',
  canopyDark: '#255B34',
  canopyMid: '#368249',
  canopyLight: '#63B76B',
  timberDark: '#5C3415',
  timberMid: '#8B5A2B',
  timberLight: '#B97A3E',
  hiveBg: '#221912',
  hiveMortar: '#2F2217',
  hiveMortarHi: '#3B2B1D',
  bridgeBorder: '#45270D',
  bridgeWood: '#92400E',
  bridgeRunner: '#D97706',
  lanternGlow: '#F59E0B',
  lanternCore: '#FEF08A',
  waxShadow: '#92400E',
  waxMid: '#D97706',
  waxGold: '#F59E0B',
  waxTop: '#FDE68A',
  royalRim: '#EAB308',
  royalHi: '#FEF08A',
  selectRim: '#38BDF8',
  selectHi: '#BAE6FD',
  honeyFill: '#F59E0B',
  honeyGlint: '#FEF08A',
  propWoodDark: '#6B3E1C',
  propWoodMid: '#A16207',
  propWoodLight: '#CA8A04',
  propMetalDark: '#334155',
  propMetalLight: '#64748B',
  propScreen: '#38BDF8',
  propGreen: '#10B981',
} as const;

const ROOM_THEMES: Record<string, RoomVisualTheme> = {
  exec_hq: {
    floorLight: '#FEF9C3',
    floorMid: '#FEF08A',
    combLine: '#EAB308',
    banner: '#D97706',
    props: ['desk_v20', 'globe'],
    fallbackKind: 'royal',
  },
  ba_tester: {
    floorLight: '#E0F2FE',
    floorMid: '#BAE6FD',
    combLine: '#7DD3FC',
    banner: '#0284C7',
    props: ['desk_v19', 'books_pile'],
    fallbackKind: 'qa',
  },
  central_lobby: {
    floorLight: '#FEF3C7',
    floorMid: '#FDE68A',
    combLine: '#F59E0B',
    banner: '#B45309',
    props: ['kiosk', 'plant_round'],
    fallbackKind: 'atrium',
  },
  ai_dev: {
    floorLight: '#DBEAFE',
    floorMid: '#BFDBFE',
    combLine: '#93C5FD',
    banner: '#2563EB',
    props: ['servers', 'desk_v22'],
    fallbackKind: 'servers',
  },
  hr_admin: {
    floorLight: '#F3E8FF',
    floorMid: '#E9D5FF',
    combLine: '#D8B4FE',
    banner: '#7C3AED',
    props: ['server_cab', 'cooler'],
    fallbackKind: 'vault',
  },
  meeting_room: {
    floorLight: '#FFE4E6',
    floorMid: '#FECDD3',
    combLine: '#FDA4AF',
    banner: '#E11D48',
    props: ['table_sq2', 'glassboard'],
    fallbackKind: 'boardroom',
  },
  training_hub: {
    floorLight: '#DCFCE7',
    floorMid: '#BBF7D0',
    combLine: '#86EFAC',
    banner: '#16A34A',
    props: ['shelf_wide1', 'blackboard'],
    fallbackKind: 'library',
  },
  business_ops: {
    floorLight: '#CCFBF1',
    floorMid: '#99F6E4',
    combLine: '#5EEAD4',
    banner: '#0D9488',
    props: ['desk_v24', 'worldmap'],
    fallbackKind: 'commerce',
  },
  sop_generic_7p: {
    floorLight: '#FEF9C3',
    floorMid: '#FEF08A',
    combLine: '#EAB308',
    banner: '#D97706',
    props: ['desk_v20', 'globe'],
    fallbackKind: 'royal',
  },
  sop_sec_audit_01: {
    floorLight: '#E0F2FE',
    floorMid: '#BAE6FD',
    combLine: '#7DD3FC',
    banner: '#0284C7',
    props: ['desk_v19', 'books_pile'],
    fallbackKind: 'qa',
  },
  sop_operations_01: {
    floorLight: '#FEF3C7',
    floorMid: '#FDE68A',
    combLine: '#F59E0B',
    banner: '#B45309',
    props: ['kiosk', 'plant_round'],
    fallbackKind: 'atrium',
  },
  sop_coding_01: {
    floorLight: '#DBEAFE',
    floorMid: '#BFDBFE',
    combLine: '#93C5FD',
    banner: '#2563EB',
    props: ['servers', 'desk_v22'],
    fallbackKind: 'servers',
  },
  sop_legal_01: {
    floorLight: '#F3E8FF',
    floorMid: '#E9D5FF',
    combLine: '#D8B4FE',
    banner: '#7C3AED',
    props: ['server_cab', 'cooler'],
    fallbackKind: 'vault',
  },
  sop_strategy_01: {
    floorLight: '#FFE4E6',
    floorMid: '#FECDD3',
    combLine: '#FDA4AF',
    banner: '#E11D48',
    props: ['table_sq2', 'glassboard'],
    fallbackKind: 'boardroom',
  },
  sop_research_01: {
    floorLight: '#DCFCE7',
    floorMid: '#BBF7D0',
    combLine: '#86EFAC',
    banner: '#16A34A',
    props: ['shelf_wide1', 'blackboard'],
    fallbackKind: 'library',
  },
  sop_analytics_01: {
    floorLight: '#CCFBF1',
    floorMid: '#99F6E4',
    combLine: '#5EEAD4',
    banner: '#0D9488',
    props: ['desk_v24', 'worldmap'],
    fallbackKind: 'commerce',
  },
};

const SLOT_THEME_ALIAS: Record<string, string> = {
  sanh: 'sop_generic_7p',
  soan: 'sop_sec_audit_01',
  dieu: 'sop_strategy_01',
  trinh: 'sop_coding_01',
  tracuu: 'sop_research_01',
  hop: 'sop_analytics_01',
  thugian: 'sop_legal_01',
  morong: 'sop_operations_01',
};

const CYCLIC_ROOM_THEMES: ReadonlyArray<RoomVisualTheme> = [
  ROOM_THEMES.sop_sec_audit_01,
  ROOM_THEMES.sop_strategy_01,
  ROOM_THEMES.sop_coding_01,
  ROOM_THEMES.sop_generic_7p,
  ROOM_THEMES.sop_research_01,
  ROOM_THEMES.sop_analytics_01,
  ROOM_THEMES.sop_legal_01,
  ROOM_THEMES.sop_operations_01,
];

function resolveRoomVisualTheme(canonicalId: string, idx: number): RoomVisualTheme {
  const aliased = SLOT_THEME_ALIAS[canonicalId] || canonicalId;
  return ROOM_THEMES[aliased] || CYCLIC_ROOM_THEMES[idx % CYCLIC_ROOM_THEMES.length];
}

function snap2(v: number): number {
  return Math.round(v / PX) * PX;
}

function pxRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
): void {
  const sx = snap2(x);
  const sy = snap2(y);
  const sw = Math.max(PX, snap2(w));
  const sh = Math.max(PX, snap2(h));
  ctx.fillStyle = fill;
  ctx.fillRect(sx, sy, sw, sh);
}

/**
 * Scanline-fills a flat-top pixel hexagon snapped to 2px blocks so diagonal edges
 * render crisp 16-bit stair steps rather than anti-aliased vector slopes.
 */
function paintSteppedHex(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  colorForRow: (dyNorm: number, isTopBand: boolean, isBottomBand: boolean) => string,
): void {
  const halfH = radius * SQRT3_OVER_2;
  const yStart = snap2(cy - halfH);
  const yEnd = snap2(cy + halfH);

  for (let y = yStart; y <= yEnd; y += PX) {
    const dy = Math.abs(y - cy);
    if (dy > halfH) continue;
    const dyNorm = dy / halfH;
    const halfW = radius * (1 - 0.5 * dyNorm);
    const xL = snap2(cx - halfW);
    const xR = snap2(cx + halfW);
    const spanW = xR - xL;
    if (spanW < PX) continue;
    const isTopBand = y <= yStart + 6;
    const isBottomBand = y >= yEnd - 6;
    ctx.fillStyle = colorForRow(dyNorm, isTopBand, isBottomBand);
    ctx.fillRect(xL, y, spanW, PX);
  }
}

function paintPixelTree(ctx: CanvasRenderingContext2D, cx: number, topY: number): void {
  // 1px dark outline + 3-tone leafy pixel canopy + trunk
  pxRect(ctx, cx - 4, topY + 26, 8, 12, PALETTE.outlineDark);
  pxRect(ctx, cx - 2, topY + 26, 4, 10, PALETTE.trunkDark);
  pxRect(ctx, cx - 2, topY + 26, 2, 8, PALETTE.trunkMid);

  pxRect(ctx, cx - 12, topY + 6, 24, 20, PALETTE.outlineDark);
  pxRect(ctx, cx - 8, topY + 2, 16, 26, PALETTE.outlineDark);
  pxRect(ctx, cx - 10, topY + 8, 20, 16, PALETTE.canopyDark);
  pxRect(ctx, cx - 8, topY + 4, 16, 18, PALETTE.canopyMid);
  pxRect(ctx, cx - 6, topY + 6, 10, 10, PALETTE.canopyLight);
  pxRect(ctx, cx + 2, topY + 12, 4, 4, PALETTE.canopyLight);
}

function paintApiaryMeadowAndFrame(ctx: CanvasRenderingContext2D): void {
  // Outer 16-bit meadow borders on left and right sides
  pxRect(ctx, 0, 0, LIMEZU_STAGE_W, LIMEZU_STAGE_H, PALETTE.grassMid);

  for (let gx = 0; gx < 64; gx += 16) {
    for (let gy = 0; gy < LIMEZU_STAGE_H; gy += 16) {
      const alt = ((gx + gy) / 16) % 2 === 0;
      pxRect(ctx, gx, gy, 16, 16, alt ? PALETTE.grassMid : PALETTE.grassDark);
      if ((gx * 3 + gy) % 32 === 0) {
        pxRect(ctx, gx + 4, gy + 6, 4, 2, PALETTE.grassLight);
      }
    }
  }
  for (let gx = 896; gx < LIMEZU_STAGE_W; gx += 16) {
    for (let gy = 0; gy < LIMEZU_STAGE_H; gy += 16) {
      const alt = ((gx + gy) / 16) % 2 === 0;
      pxRect(ctx, gx, gy, 16, 16, alt ? PALETTE.grassMid : PALETTE.grassDark);
      if ((gx + gy * 3) % 32 === 0) {
        pxRect(ctx, gx + 6, gy + 4, 4, 2, PALETTE.grassLight);
      }
    }
  }

  // Pixel meadow trees down left & right perimeter (matches Gather office meadow border)
  const treeYCoords = [44, 174, 304, 434];
  treeYCoords.forEach((ty, idx) => {
    paintPixelTree(ctx, 30, ty);
    paintPixelTree(ctx, 930, ty);
    // Tiny wildflowers between trees
    const flowerColor =
      idx % 3 === 0 ? PALETTE.flowerGold : idx % 3 === 1 ? PALETTE.flowerPink : PALETTE.flowerSky;
    pxRect(ctx, 16, ty + 48, 4, 4, flowerColor);
    pxRect(ctx, 940, ty + 44, 4, 4, flowerColor);
    pxRect(ctx, 46, ty + 18, 2, 2, PALETTE.lanternCore);
    pxRect(ctx, 912, ty + 20, 2, 2, PALETTE.lanternCore);
  });

  // Timber Beehive outer casing (x: 62..898, y: 8..552)
  pxRect(ctx, 62, 8, 836, 544, PALETTE.outlineDark);
  pxRect(ctx, 64, 10, 832, 540, PALETTE.timberDark);
  pxRect(ctx, 66, 12, 828, 536, PALETTE.timberMid);
  pxRect(ctx, 68, 12, 824, 4, PALETTE.timberLight);
  pxRect(ctx, 72, 18, 816, 524, PALETTE.outlineDark);

  // Dark beeswax micro-comb background inside the hive frame
  pxRect(ctx, 74, 20, 812, 520, PALETTE.hiveBg);
  for (let row = 0; row < 28; row += 1) {
    const by = 22 + row * 18;
    const offset = row % 2 === 0 ? 0 : 12;
    for (let bx = 76 + offset; bx < 874; bx += 24) {
      pxRect(ctx, bx, by, 14, 2, PALETTE.hiveMortar);
      pxRect(ctx, bx - 2, by + 2, 2, 6, PALETTE.hiveMortar);
      pxRect(ctx, bx + 14, by + 2, 2, 6, PALETTE.hiveMortar);
      pxRect(ctx, bx, by + 8, 14, 2, row % 4 === 0 ? PALETTE.hiveMortarHi : PALETTE.hiveMortar);
    }
  }
}

function paintSteppedBridges(
  ctx: CanvasRenderingContext2D,
  activeLayout: Record<string, BeehiveHexCellSpec>,
  queenRoomId: string,
): void {
  const queenCell =
    activeLayout[queenRoomId] ||
    Object.values(activeLayout).find((c) => c.tier === 'queen') ||
    Object.values(activeLayout)[0];
  if (!queenCell) return;

  for (const [id, cell] of Object.entries(activeLayout)) {
    if (id === queenCell.canonicalId || id === queenRoomId) continue;
    const dx = cell.cx - queenCell.cx;
    const dy = cell.cy - queenCell.cy;
    const steps = 26;
    for (let i = 3; i <= steps - 3; i += 1) {
      const t = i / steps;
      const px = snap2(queenCell.cx + dx * t);
      const py = snap2(queenCell.cy + dy * t);
      pxRect(ctx, px - 5, py - 5, 10, 10, PALETTE.bridgeBorder);
      pxRect(ctx, px - 3, py - 3, 6, 6, PALETTE.bridgeWood);
      if (i % 2 === 0) {
        pxRect(ctx, px - 1, py - 1, 2, 2, PALETTE.bridgeRunner);
      }
    }
    // Glowing pixel honey lantern at bridge midpoint
    const mx = snap2((queenCell.cx + cell.cx) / 2);
    const my = snap2((queenCell.cy + cell.cy) / 2);
    pxRect(ctx, mx - 4, my - 4, 8, 8, PALETTE.outlineDark);
    pxRect(ctx, mx - 3, my - 3, 6, 6, PALETTE.lanternGlow);
    pxRect(ctx, mx - 1, my - 1, 2, 2, PALETTE.lanternCore);
  }
}

function paintProceduralRoomProps(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  kind: RoomVisualTheme['fallbackKind'],
): void {
  // Top-left & bottom-right compact 16-bit furniture pixels so center bee slots stay crisp & readable
  if (kind === 'royal') {
    // Pixel Royal Desk & Honey Lamp
    pxRect(ctx, cx - 50, cy - 26, 26, 14, PALETTE.outlineDark);
    pxRect(ctx, cx - 48, cy - 24, 22, 10, PALETTE.propWoodMid);
    pxRect(ctx, cx - 46, cy - 24, 18, 4, PALETTE.propWoodLight);
    pxRect(ctx, cx - 32, cy - 28, 6, 6, PALETTE.lanternCore);
    // Golden Honey Throne Cushion bottom-right
    pxRect(ctx, cx + 28, cy + 12, 16, 14, PALETTE.outlineDark);
    pxRect(ctx, cx + 30, cy + 14, 12, 10, PALETTE.waxGold);
    pxRect(ctx, cx + 32, cy + 16, 8, 4, PALETTE.waxTop);
    return;
  }

  if (kind === 'servers' || kind === 'vault') {
    // Dual Pixel Server / Vault Racks with blinking LED pixels
    pxRect(ctx, cx - 46, cy - 26, 16, 24, PALETTE.outlineDark);
    pxRect(ctx, cx - 44, cy - 24, 12, 20, PALETTE.propMetalDark);
    pxRect(ctx, cx - 42, cy - 20, 8, 2, PALETTE.propMetalLight);
    pxRect(ctx, cx - 42, cy - 14, 8, 2, PALETTE.propMetalLight);
    pxRect(ctx, cx - 42, cy - 22, 2, 2, PALETTE.propGreen);
    pxRect(ctx, cx - 38, cy - 16, 2, 2, PALETTE.propScreen);
    // Pixel terminal desk right side
    pxRect(ctx, cx + 28, cy - 24, 18, 12, PALETTE.outlineDark);
    pxRect(ctx, cx + 30, cy - 22, 14, 8, PALETTE.propWoodDark);
    pxRect(ctx, cx + 32, cy - 24, 8, 6, PALETTE.propScreen);
    return;
  }

  if (kind === 'library' || kind === 'qa') {
    // Pixel Bookshelf / Blackboard
    pxRect(ctx, cx - 46, cy - 26, 24, 16, PALETTE.outlineDark);
    pxRect(ctx, cx - 44, cy - 24, 20, 12, PALETTE.propWoodDark);
    pxRect(ctx, cx - 42, cy - 22, 4, 4, PALETTE.flowerGold);
    pxRect(ctx, cx - 36, cy - 22, 4, 4, PALETTE.flowerSky);
    pxRect(ctx, cx - 30, cy - 22, 4, 4, PALETTE.flowerPink);
    pxRect(ctx, cx + 28, cy + 12, 16, 12, PALETTE.outlineDark);
    pxRect(ctx, cx + 30, cy + 14, 12, 8, PALETTE.propScreen);
    return;
  }

  // Default cozy pixel desk + honey vat
  pxRect(ctx, cx - 44, cy - 24, 20, 12, PALETTE.outlineDark);
  pxRect(ctx, cx - 42, cy - 22, 16, 8, PALETTE.propWoodMid);
  pxRect(ctx, cx - 36, cy - 24, 6, 4, PALETTE.propScreen);

  pxRect(ctx, cx + 28, cy + 12, 14, 14, PALETTE.outlineDark);
  pxRect(ctx, cx + 30, cy + 14, 10, 10, PALETTE.honeyFill);
  pxRect(ctx, cx + 32, cy + 14, 6, 4, PALETTE.honeyGlint);
}

function paintRoomWorkstations(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  theme: RoomVisualTheme,
  atlas: HTMLImageElement | null,
): void {
  const canBlitAtlas =
    atlas !== null &&
    atlas.complete &&
    atlas.naturalWidth > 0 &&
    typeof ctx.drawImage === 'function';

  if (canBlitAtlas) {
    const offsets: ReadonlyArray<{ dx: number; dy: number; maxH: number }> = [
      { dx: -52, dy: -28, maxH: 26 },
      { dx: 24, dy: 8, maxH: 24 },
    ];
    theme.props.forEach((propKey, idx) => {
      const spr = LIMEZU_SPR[propKey];
      const off = offsets[idx % offsets.length];
      if (!spr) return;
      const [sx, sy, sw, sh] = spr;
      const scale = off.maxH / Math.max(1, sh);
      const dw = Math.max(12, Math.round((sw * scale) / PX) * PX);
      const dh = Math.max(12, Math.round((sh * scale) / PX) * PX);
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(atlas, sx, sy, sw, sh, snap2(cx + off.dx), snap2(cy + off.dy), dw, dh);
      ctx.restore();
    });
    return;
  }

  paintProceduralRoomProps(ctx, cx, cy, theme.fallbackKind);
}

/**
 * Paints the complete 960x560 16-bit Pixel-Art Beehive Colony background canvas.
 */
export function paintPixelBeehiveStage(
  ctx: CanvasRenderingContext2D,
  options: PixelBeehiveStageOptions,
): void {
  ctx.imageSmoothingEnabled = false;

  // 1. Exterior 16-bit meadow & wooden hive frame
  paintApiaryMeadowAndFrame(ctx);

  const activeLayout =
    options.cellLayout && Object.keys(options.cellLayout).length > 0
      ? options.cellLayout
      : BEEHIVE_CELL_LAYOUT;
  const resolvedQueenId =
    (options.queenRoomId && activeLayout[options.queenRoomId] ? options.queenRoomId : undefined) ||
    Object.entries(activeLayout).find(([, c]) => c.tier === 'queen')?.[0] ||
    Object.keys(activeLayout)[0] ||
    'sop_generic_7p';

  // 2. Stepped pixel bridges between Queen spine chamber & specialist chambers
  paintSteppedBridges(ctx, activeLayout, resolvedQueenId);

  // 3. Stepped Pixel Honeycomb Chambers (dynamic N >= 1)
  Object.entries(activeLayout).forEach(([canonicalId, cell], cellIdx) => {
    const theme = resolveRoomVisualTheme(canonicalId, cellIdx);
    const isQueen = cell.tier === 'queen';
    const isSelected = options.selectedCanonicalZone === canonicalId;
    const workingCount = Math.max(0, options.workingCountByRoom[canonicalId] || 0);

    // Drop shadow (+4, +4)
    paintSteppedHex(ctx, cell.cx + 4, cell.cy + 4, cell.radius + 2, () => PALETTE.shadowDeep);

    // Outer 1px-stepped dark border
    paintSteppedHex(ctx, cell.cx, cell.cy, cell.radius + 2, () => PALETTE.outlineDark);

    // 3-tone beveled beeswax / selection rim
    paintSteppedHex(ctx, cell.cx, cell.cy, cell.radius, (_dyNorm, isTopBand, isBottomBand) => {
      if (isSelected) return isBottomBand ? '#0284C7' : isTopBand ? PALETTE.selectHi : PALETTE.selectRim;
      if (isQueen) return isBottomBand ? PALETTE.waxShadow : isTopBand ? PALETTE.royalHi : PALETTE.royalRim;
      if (isTopBand) return PALETTE.waxTop;
      if (isBottomBand) return PALETTE.waxShadow;
      return PALETTE.waxGold;
    });

    // Dark inner trim ring
    paintSteppedHex(ctx, cell.cx, cell.cy, cell.radius - 6, () => PALETTE.outlineDark);

    // Warm dithered interior wax floor
    const innerR = cell.radius - 8;
    const halfInnerH = innerR * SQRT3_OVER_2;
    const y0 = snap2(cell.cy - halfInnerH);
    const y1 = snap2(cell.cy + halfInnerH);
    for (let y = y0; y <= y1; y += PX) {
      const dy = Math.abs(y - cell.cy);
      if (dy > halfInnerH) continue;
      const halfW = innerR * (1 - 0.5 * (dy / halfInnerH));
      const xL = snap2(cell.cx - halfW);
      const xR = snap2(cell.cx + halfW);
      const spanW = xR - xL;
      if (spanW < PX) continue;
      const isBand = y <= y0 + 18 || y >= y1 - 16;
      const color = isBand
        ? theme.floorMid
        : ((y - y0) / PX) % 6 === 0
          ? theme.floorMid
          : theme.floorLight;
      ctx.fillStyle = color;
      ctx.fillRect(xL, y, spanW, PX);
    }

    // Subtle interior pixel comb mortar accents + honey deposits for working bees
    for (let hx = -30; hx <= 30; hx += 20) {
      pxRect(ctx, cell.cx + hx, cell.cy - 10, 10, 2, theme.combLine);
      pxRect(ctx, cell.cx + hx - 4, cell.cy + 12, 10, 2, theme.combLine);
    }
    const honeyCells = Math.min(4, workingCount + (isQueen ? 1 : 0));
    for (let h = 0; h < honeyCells; h += 1) {
      const ox = cell.cx - 46 + h * 12;
      const oy = cell.cy + 34;
      pxRect(ctx, ox, oy, 8, 6, PALETTE.outlineDark);
      pxRect(ctx, ox + 1, oy + 1, 6, 4, PALETTE.honeyFill);
      pxRect(ctx, ox + 2, oy + 2, 2, 2, PALETTE.honeyGlint);
    }

    // Top-band colored pixel trim strip behind plaque & 16-bit atlas/procedural furniture props
    pxRect(ctx, cell.cx - 34, cell.cy - innerR * SQRT3_OVER_2 + 4, 68, 4, theme.banner);
    paintRoomWorkstations(ctx, cell.cx, cell.cy, theme, options.atlas);
  });
}

/**
 * Generates crisp 28x28 16-bit pixel rects for Queen, Guard, Active/Standby Agent, and Cyber-Scout Subagent bees.
 * Rendered via SVG <rect> blocks with shapeRendering="crispEdges" (0 smooth ellipses).
 */
export function buildPixelBeeRects(
  role: PixelBeeRole,
  wingFrame: 0 | 1,
  isSelected: boolean,
): PixelRectSpec[] {
  const rects: PixelRectSpec[] = [];
  const push = (x: number, y: number, w: number, h: number, fill: string, opacity?: number) => {
    rects.push(opacity !== undefined ? { x, y, w, h, fill, opacity } : { x, y, w, h, fill });
  };

  // Selection 16-bit RPG bracket corners
  if (isSelected) {
    const sel = '#38BDF8';
    push(0, 0, 4, 1, sel);
    push(0, 1, 1, 3, sel);
    push(24, 0, 4, 1, sel);
    push(27, 1, 1, 3, sel);
    push(0, 27, 4, 1, sel);
    push(0, 24, 1, 3, sel);
    push(24, 27, 4, 1, sel);
    push(27, 24, 1, 3, sel);
  }

  const isSubagent = role === 'subagent_active' || role === 'subagent_standby';
  if (isSubagent) {
    const isSubStandby = role === 'subagent_standby';
    // Compact ground shadow
    push(9, 24, 10, 2, '#181A27', 0.25);

    // High-speed translucent pixel scout wings
    if (isSubStandby) {
      push(6, 12, 3, 4, '#1B1924');
      push(19, 12, 3, 4, '#1B1924');
      push(7, 13, 1, 2, '#CBD5E1');
      push(20, 13, 1, 2, '#CBD5E1');
    } else if (wingFrame === 0) {
      push(3, 7, 6, 6, '#1B1924');
      push(19, 7, 6, 6, '#1B1924');
      push(4, 8, 4, 4, '#CFFAFE');
      push(20, 8, 4, 4, '#CFFAFE');
      push(5, 9, 2, 2, '#FFFFFF');
      push(21, 9, 2, 2, '#FFFFFF');
    } else {
      push(2, 10, 7, 5, '#1B1924');
      push(19, 10, 7, 5, '#1B1924');
      push(3, 11, 5, 3, '#A5F3FC');
      push(20, 11, 5, 3, '#A5F3FC');
      push(4, 11, 3, 1, '#FFFFFF');
      push(21, 11, 3, 1, '#FFFFFF');
    }

    // Twin relay antennae with purple/cyan glowing sensor tips
    push(10, 5, 1, 2, '#1B1924');
    push(9, 4, 1, 1, '#1B1924');
    push(8, 3, 2, 2, isSubStandby ? '#94A3B8' : '#22D3EE');
    push(17, 5, 1, 2, '#1B1924');
    push(18, 4, 1, 1, '#1B1924');
    push(18, 3, 2, 2, isSubStandby ? '#94A3B8' : '#A855F7');

    // Compact Scout Bee Head + Cyan Cyber-Visor
    push(10, 6, 8, 1, '#1B1924');
    push(9, 7, 10, 7, '#1B1924');
    push(10, 7, 8, 6, '#FEF08A');
    push(10, 9, 8, 2, isSubStandby ? '#64748B' : '#06B6D4');
    push(11, 9, 2, 1, '#FFFFFF');
    push(16, 9, 1, 1, '#FFFFFF');
    push(10, 12, 2, 1, '#FCA5A5');
    push(16, 12, 2, 1, '#FCA5A5');

    // Nimble Teal & Honey Striped Scout Body
    push(8, 14, 12, 8, '#1B1924');
    push(9, 14, 10, 2, isSubStandby ? '#94A3B8' : '#2DD4BF');
    push(9, 16, 10, 2, isSubStandby ? '#CBD5E1' : '#FACC15');
    push(9, 18, 10, 1, '#1B1924');
    push(9, 19, 10, 2, isSubStandby ? '#64748B' : '#14B8A6');
    push(10, 22, 2, 2, '#1B1924');
    push(16, 22, 2, 2, '#1B1924');
    push(13, 22, 2, 2, '#1B1924');

    return rects;
  }

  // Ground pixel shadow
  push(8, 25, 12, 2, '#181A27', 0.28);

  // Translucent 16-bit fluttering wings
  const isStandby = role === 'worker_standby';
  if (isStandby) {
    push(5, 11, 4, 4, '#1B1924');
    push(19, 11, 4, 4, '#1B1924');
    push(6, 12, 2, 2, '#E2E8F0');
    push(20, 12, 2, 2, '#E2E8F0');
  } else if (wingFrame === 0) {
    // Wings UP
    push(2, 6, 7, 7, '#1B1924');
    push(19, 6, 7, 7, '#1B1924');
    push(3, 7, 5, 5, '#BAE6FD');
    push(20, 7, 5, 5, '#BAE6FD');
    push(4, 8, 3, 2, '#FFFFFF');
    push(21, 8, 3, 2, '#FFFFFF');
  } else {
    // Wings FLUTTER WIDE
    push(1, 9, 8, 7, '#1B1924');
    push(19, 9, 8, 7, '#1B1924');
    push(2, 10, 6, 5, '#E0F2FE');
    push(20, 10, 6, 5, '#E0F2FE');
    push(3, 11, 4, 2, '#FFFFFF');
    push(21, 11, 4, 2, '#FFFFFF');
  }

  // Pixel antennae + colored sensor tips
  const tipColor =
    role === 'queen'
      ? '#FACC15'
      : role === 'guard'
        ? '#38BDF8'
        : role === 'worker_active'
          ? '#34D399'
          : '#94A3B8';
  push(10, 4, 1, 2, '#1B1924');
  push(9, 3, 1, 1, '#1B1924');
  push(7, 2, 2, 2, tipColor);
  push(17, 4, 1, 2, '#1B1924');
  push(18, 3, 1, 1, '#1B1924');
  push(19, 2, 2, 2, tipColor);

  // Queen 5-point Pixel Crown
  if (role === 'queen') {
    push(9, 1, 2, 2, '#FACC15');
    push(13, 0, 2, 3, '#FACC15');
    push(17, 1, 2, 2, '#FACC15');
    push(9, 3, 10, 2, '#D97706');
    push(13, 3, 2, 1, '#EF4444');
  }

  // Rounded Chibi Bee Head Outline + Warm Honey Face
  push(9, 5, 10, 1, '#1B1924');
  push(8, 6, 12, 8, '#1B1924');
  push(9, 6, 10, 7, '#FDE68A');
  push(10, 6, 8, 2, '#FEF08A');
  push(9, 12, 10, 1, '#FBBF24');

  // Expressive Gather 16-bit Eyes + Catchlights + Blush
  push(10, 8, 2, 3, '#1B1924');
  push(16, 8, 2, 3, '#1B1924');
  push(10, 8, 1, 1, '#FFFFFF');
  push(16, 8, 1, 1, '#FFFFFF');
  push(9, 11, 2, 1, '#FCA5A5');
  push(17, 11, 2, 1, '#FCA5A5');

  // Worker Active: Gather Signature Orange Over-Ear Focus Headphones
  if (role === 'worker_active') {
    push(9, 4, 10, 1, '#E07A22');
    push(6, 7, 2, 5, '#1B1924');
    push(20, 7, 2, 5, '#1B1924');
    push(6, 8, 2, 3, '#F28B30');
    push(20, 8, 2, 3, '#F28B30');
  }

  // Guard Bee (QA / SoD HITL): Pixel Glasses
  if (role === 'guard') {
    push(9, 8, 4, 1, '#334155');
    push(15, 8, 4, 1, '#334155');
    push(13, 9, 2, 1, '#334155');
  }

  // Striped Plump Bee Abdomen + Tiny Feet + Stinger
  push(7, 14, 14, 9, '#1B1924');
  push(8, 23, 12, 1, '#1B1924');
  push(8, 14, 12, 2, role === 'queen' ? '#7C3AED' : '#FEF08A');
  push(8, 16, 12, 2, isStandby ? '#CBD5E1' : '#FBBF24');
  push(8, 18, 12, 1, '#1B1924');
  push(8, 19, 12, 2, isStandby ? '#94A3B8' : '#F59E0B');
  push(8, 21, 12, 1, '#1B1924');
  push(9, 22, 10, 1, isStandby ? '#64748B' : '#D97706');
  // Feet & tiny stinger tip
  push(10, 23, 2, 2, '#1B1924');
  push(16, 23, 2, 2, '#1B1924');
  push(13, 24, 2, 1, '#1B1924');

  // Guard Bee: Held 16-bit HITL Shield Emblem
  if (role === 'guard') {
    push(21, 13, 6, 7, '#1B1924');
    push(22, 14, 4, 5, '#0284C7');
    push(23, 14, 2, 5, '#FACC15');
    push(22, 16, 4, 1, '#FACC15');
  }

  return rects;
}
