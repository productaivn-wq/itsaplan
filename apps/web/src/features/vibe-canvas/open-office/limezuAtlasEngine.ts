// Clean-room TypeScript port of Phong Lam Viec Mo (LimeZu Modern Interiors) 2D spatial engine
// Tile grid: 24 x 14 tiles at LIMEZU_TILE_PX = 40px => intrinsic 960 x 560 stage (exact 12:7 ratio).

import type {
  DynamicPixelFloorplanSpec,
  DynamicTileRoomSpec,
  SopRoomThemeDomain,
} from './openOfficeConstants';

import { FSC, LIMEZU_ATLAS_URL, LIMEZU_STAGE_H, LIMEZU_STAGE_W, PX_RATIO, TILE, type SpriteDirection } from './limezuTypes';
export * from './limezuTypes';
export * from './limezuNavigation';
export * from './limezuDoors';
export * from './limezuPets';

// ============================================================================
// SINGLETON ATLAS IMAGE LOADER (SSR & JSDOM SAFE)
// ============================================================================

let sharedAtlasImg: HTMLImageElement | null = null;
let atlasLoaded = false;
const atlasSubscribers = new Set<() => void>();

function isUnitTestDom(): boolean {
  if (typeof navigator === 'undefined') return true;
  return /jsdom|HappyDOM/i.test(navigator.userAgent || '');
}

function ensureAtlasRequested(): void {
  if (typeof window === 'undefined' || typeof Image === 'undefined' || isUnitTestDom()) {
    return;
  }
  if (sharedAtlasImg) return;
  try {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (img.naturalWidth > 0) {
        atlasLoaded = true;
        atlasSubscribers.forEach((cb) => {
          try {
            cb();
          } catch {
            // Isolate subscriber errors
          }
        });
      }
    };
    img.onerror = () => {
      atlasLoaded = false;
    };
    img.src = LIMEZU_ATLAS_URL;
    if (img.complete && img.naturalWidth > 0) {
      atlasLoaded = true;
    }
    sharedAtlasImg = img;
  } catch {
    sharedAtlasImg = null;
  }
}

export function getLimeZuAtlasImage(): HTMLImageElement | null {
  ensureAtlasRequested();
  if (sharedAtlasImg && (atlasLoaded || (sharedAtlasImg.complete && sharedAtlasImg.naturalWidth > 0))) {
    atlasLoaded = true;
    return sharedAtlasImg;
  }
  return null;
}

export function subscribeLimeZuAtlas(cb: () => void): () => void {
  atlasSubscribers.add(cb);
  ensureAtlasRequested();
  if (atlasLoaded) {
    cb();
  }
  return () => {
    atlasSubscribers.delete(cb);
  };
}

// ============================================================================
// SPRITE ATLAS TABLES (LIMEZU MODERN INTERIORS)
// ============================================================================

export const LIMEZU_SPR: Record<string, readonly [number, number, number, number]> = {
  sofa_v_gray: [0, 0, 44, 116],
  rug_purple: [46, 0, 112, 116],
  shelf_wide2: [160, 0, 96, 98],
  shelf_wide3: [258, 0, 96, 98],
  shelf_long: [356, 0, 142, 98],
  shelf_long2: [500, 0, 142, 98],
  lamp_floor_w: [644, 0, 32, 96],
  stove1: [678, 0, 64, 96],
  screen_big: [744, 0, 64, 96],
  desk_v19: [810, 0, 64, 80],
  desk_v20: [876, 0, 64, 80],
  desk_v21: [942, 0, 64, 80],
  desk_v22: [0, 118, 64, 80],
  desk_v23: [66, 118, 64, 80],
  desk_v24: [132, 118, 64, 80],
  desk_v25: [198, 118, 64, 80],
  desk_v26: [264, 118, 64, 80],
  plant_round: [330, 118, 64, 80],
  plant_tall: [396, 118, 32, 80],
  plant_big: [430, 118, 64, 80],
  plant_shelf: [496, 118, 32, 80],
  lamp_floor_b: [530, 118, 32, 80],
  lamp_floor_b2: [564, 118, 32, 80],
  lamp_floor_r: [598, 118, 32, 80],
  cabinet_frames: [632, 118, 64, 80],
  shelf_wide1: [698, 118, 96, 80],
  rug_red: [796, 118, 120, 80],
  rug_blue: [0, 200, 120, 80],
  servers: [122, 200, 128, 76],
  server_cab: [252, 200, 44, 76],
  fireplace: [298, 200, 60, 74],
  table_sq1: [360, 200, 76, 74],
  table_sq2: [438, 200, 76, 74],
  table_sq3: [516, 200, 76, 74],
  shelfB1: [594, 200, 64, 68],
  shelfB2: [660, 200, 64, 68],
  shelfB3: [726, 200, 64, 68],
  wall_white: [792, 200, 32, 64],
  wall_gray: [826, 200, 32, 64],
  wall_cream: [860, 200, 32, 64],
  wall_diamond: [894, 200, 32, 64],
  wall_wood: [928, 200, 32, 64],
  wall_stone: [962, 200, 32, 64],
  wall_pink: [0, 282, 32, 64],
  plant_palm: [34, 282, 64, 64],
  plant_s1: [100, 282, 32, 64],
  plant_s2: [134, 282, 32, 64],
  shelf_small: [168, 282, 32, 64],
  sideboard1: [202, 282, 64, 64],
  sideboard2: [268, 282, 64, 64],
  sideboard3: [334, 282, 64, 64],
  sideboard_lamp: [400, 282, 64, 64],
  sideboard_books: [466, 282, 64, 64],
  cooler: [532, 282, 32, 64],
  cooler2: [566, 282, 32, 64],
  kiosk: [600, 282, 32, 64],
  infocab: [634, 282, 32, 64],
  extinguisher: [668, 282, 32, 64],
  mirror1: [702, 282, 40, 64],
  table_items: [744, 282, 64, 64],
  door1: [810, 282, 64, 64],
  door2: [876, 282, 64, 64],
  plant_p2: [942, 282, 44, 60],
  plant_m2: [0, 348, 44, 60],
  rug_round_pink: [46, 348, 66, 60],
  rug_round_brown: [114, 348, 66, 60],
  plant_p3: [182, 348, 28, 58],
  plant_m1: [212, 348, 28, 58],
  rug_gray: [242, 348, 82, 56],
  cabinet3: [326, 348, 96, 56],
  cabinet2: [424, 348, 96, 56],
  glassboard: [522, 348, 88, 54],
  plant_m4: [612, 348, 32, 50],
  teachdesk3: [646, 348, 56, 50],
  bench_long: [704, 348, 64, 48],
  bench_long2: [770, 348, 64, 48],
  lamp_tab_r: [836, 348, 32, 48],
  lamp_tab_b: [870, 348, 32, 48],
  lamp_tab_w: [904, 348, 32, 48],
  lamp_tab_r2: [938, 348, 32, 48],
  podium: [972, 348, 32, 48],
  podium2: [0, 410, 32, 48],
  podium3: [34, 410, 32, 48],
  books_pile: [68, 410, 40, 48],
  dresser1: [110, 410, 58, 48],
  dresser2: [170, 410, 58, 48],
  shelf_wall1: [230, 410, 64, 48],
  shelf_wall3: [296, 410, 64, 48],
  plant_p1: [362, 410, 28, 46],
  sidebd1: [392, 410, 54, 46],
  blackboard: [448, 410, 56, 46],
  books_pile2: [506, 410, 56, 46],
  logpile: [564, 410, 28, 44],
  sofa_h_white: [594, 410, 116, 44],
  sofa_h_tan: [712, 410, 116, 44],
  sofa_h_gray: [830, 410, 116, 44],
  teachdesk2: [948, 410, 56, 44],
  chair_top1: [0, 460, 24, 44],
  chair_top2: [26, 460, 24, 44],
  sidebd2: [52, 460, 50, 42],
  globe: [104, 460, 26, 42],
  credenza: [132, 460, 108, 42],
  window1: [242, 460, 50, 40],
  window2: [294, 460, 50, 40],
  window3: [346, 460, 50, 40],
  tv: [398, 460, 58, 40],
  tv2: [458, 460, 58, 40],
  plant_m3: [518, 460, 30, 38],
  server1: [550, 460, 32, 38],
  worldmap: [584, 460, 64, 38],
  tools: [650, 460, 24, 34],
  fl_soan0: [676, 460, 32, 32],
  fl_soan1: [710, 460, 32, 32],
  fl_soan2: [744, 460, 32, 32],
  fl_soan3: [778, 460, 32, 32],
  fl_soan4: [812, 460, 32, 32],
  fl_soan5: [846, 460, 32, 32],
  fl_dieu0: [880, 460, 32, 32],
  fl_dieu1: [914, 460, 32, 32],
  fl_dieu2: [948, 460, 32, 32],
  fl_dieu3: [982, 460, 32, 32],
  fl_dieu4: [0, 506, 32, 32],
  fl_dieu5: [34, 506, 32, 32],
  fl_trinh0: [68, 506, 32, 32],
  fl_trinh1: [102, 506, 32, 32],
  fl_trinh2: [136, 506, 32, 32],
  fl_trinh3: [170, 506, 32, 32],
  fl_trinh4: [204, 506, 32, 32],
  fl_trinh5: [238, 506, 32, 32],
  fl_sanh0: [272, 506, 32, 32],
  fl_sanh1: [306, 506, 32, 32],
  fl_sanh2: [340, 506, 32, 32],
  fl_sanh3: [374, 506, 32, 32],
  fl_sanh4: [408, 506, 32, 32],
  fl_sanh5: [442, 506, 32, 32],
  fl_mint0: [476, 506, 32, 32],
  fl_mint1: [510, 506, 32, 32],
  fl_mint2: [544, 506, 32, 32],
  fl_mint3: [578, 506, 32, 32],
  fl_mint4: [612, 506, 32, 32],
  fl_mint5: [646, 506, 32, 32],
  fl_path0: [680, 506, 32, 32],
  fl_path1: [714, 506, 32, 32],
  fl_path2: [748, 506, 32, 32],
  fl_path3: [782, 506, 32, 32],
  fl_path4: [816, 506, 32, 32],
  fl_path5: [850, 506, 32, 32],
  fl_tracuu0: [884, 506, 32, 32],
  fl_tracuu1: [918, 506, 32, 32],
  fl_tracuu2: [952, 506, 32, 32],
  fl_tracuu3: [986, 506, 32, 32],
  fl_tracuu4: [0, 540, 32, 32],
  fl_tracuu5: [34, 540, 32, 32],
  fl_hop0: [68, 540, 32, 32],
  fl_hop1: [102, 540, 32, 32],
  fl_hop2: [136, 540, 32, 32],
  fl_hop3: [170, 540, 32, 32],
  fl_hop4: [204, 540, 32, 32],
  fl_hop5: [238, 540, 32, 32],
  fl_thugian0: [272, 540, 32, 32],
  fl_thugian1: [306, 540, 32, 32],
  fl_thugian2: [340, 540, 32, 32],
  fl_thugian3: [374, 540, 32, 32],
  fl_thugian4: [408, 540, 32, 32],
  fl_thugian5: [442, 540, 32, 32],
  fl_morong0: [476, 540, 32, 32],
  fl_morong1: [510, 540, 32, 32],
  fl_morong2: [544, 540, 32, 32],
  fl_morong3: [578, 540, 32, 32],
  fl_morong4: [612, 540, 32, 32],
  fl_morong5: [646, 540, 32, 32],
  backpack: [680, 540, 48, 32],
  vase1: [730, 540, 30, 32],
  vase2: [762, 540, 30, 32],
  rug_wood: [794, 540, 64, 32],
  rug_teal: [860, 540, 32, 32],
  rug_red_s: [894, 540, 32, 32],
  frame_art1: [928, 540, 26, 30],
  frame_land: [956, 540, 26, 30],
  frame_flame: [984, 540, 26, 30],
  frame_fruit: [0, 574, 26, 30],
  frame_monster: [28, 574, 26, 30],
  board_dark: [56, 574, 44, 30],
  crate: [102, 574, 26, 28],
  chair_w1: [130, 574, 28, 28],
  chair_w2: [160, 574, 28, 28],
  chair_w3: [190, 574, 28, 28],
  chair_w4: [220, 574, 28, 28],
  pinboard: [250, 574, 52, 26],
  phone_type: [304, 574, 30, 26],
  paper_doc: [336, 574, 20, 22],
  sofa_tan2: [8, 620, 93, 74],
  bar_counter: [0, 1616, 192, 30],
  bar_stool: [200, 1616, 24, 34],
  bottles1: [232, 1616, 30, 36],
  bottles2: [270, 1616, 30, 26],
  bottles3: [308, 1616, 17, 36],
  bottle_blu: [333, 1616, 10, 20],
  bottle_grn: [351, 1616, 10, 20],
  table_round: [369, 1616, 48, 48],
};

export const LIMEZU_CHARSPR: Record<string, readonly [number, number]> = {
  xuka: [0, 1224],
  gpt: [0, 776],
  gemini: [0, 840],
  gamma: [0, 904],
  perp: [0, 968],
  genspark: [0, 1032],
  x7: [0, 1096],
  x8: [0, 1160],
  x9: [0, 712],
  x10: [0, 1288],
  x11: [0, 1352],
  x12: [0, 1416],
  x13: [0, 1480],
  x14: [0, 1544],
};

const CHAR_KEYS = Object.keys(LIMEZU_CHARSPR);
const DIR_INDEX: Record<SpriteDirection, number> = {
  right: 0,
  up: 1,
  left: 2,
  down: 3,
};

function deterministicStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function resolveLimeZuCharKey(seed: string): string {
  const low = (seed || '').toLowerCase();
  if (low.includes('orchestrator') || low.includes('genesis') || low.includes('xuka')) return 'xuka';
  if (low.includes('antigravity') || low.includes('gemini') || low.includes('agy')) return 'gemini';
  if (low.includes('claude') || low.includes('gpt')) return 'gpt';
  if (low.includes('muse') || low.includes('design') || low.includes('gamma')) return 'gamma';
  if (low.includes('research') || low.includes('perp')) return 'perp';
  if (low.includes('qualitygate') || low.includes('quality') || low.includes('tester') || low.includes('genspark')) {
    return 'genspark';
  }
  if (low.includes('codex')) return 'x14';
  return CHAR_KEYS[deterministicStringHash(low) % CHAR_KEYS.length] || 'xuka';
}

export function blitLimeZuCharacterFrame(
  ctx: CanvasRenderingContext2D,
  charKey: string,
  dir: SpriteDirection,
  moving: boolean,
  walkFrame: number,
  destW: number,
  destH: number,
  portraitOnly = false,
): boolean {
  const img = getLimeZuAtlasImage();
  if (!img) return false;
  const base = LIMEZU_CHARSPR[charKey] || LIMEZU_CHARSPR.xuka;
  const d = DIR_INDEX[dir] ?? 3;
  const col = moving ? 4 + d * 6 + ((Math.abs(walkFrame) || 0) % 6) : d;
  const sx = base[0] + col * 32;
  const sy = base[1];
  ctx.imageSmoothingEnabled = false;
  if (portraitOnly) {
    // Character head + upper shoulders live in y=14..48 of each 32x64 frame
    ctx.drawImage(img, sx, sy + 14, 32, 34, 0, 0, destW, destH);
  } else {
    // Full-body silhouette lives in y=16..64 (exact 32x48 -> 2:3 ratio)
    ctx.drawImage(img, sx, sy + 16, 32, 48, 0, 0, destW, destH);
  }
  return true;
}

// ============================================================================
// FLOORPLAN PAINTER (EXACT 24 x 14 TILE PORT AT TILE = 40px -> 960 x 560)
// ============================================================================

let cachedFloorSignature = '';
let cachedFloorCanvas: HTMLCanvasElement | null = null;

function rnd(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

interface DrawItem {
  k: number;
  fn: () => void;
}

export interface DynamicLimeZuFloorOptions {
  floorplan?: DynamicPixelFloorplanSpec;
  workingCountByRoom?: Record<string, number>;
  hitlCountByRoom?: Record<string, number>;
  selectedCanonicalZone?: string | null;
}

const DOMAIN_TILE_STYLE: Record<SopRoomThemeDomain, { floor: string; wall: string; rug: string; tint: string }> = {
  SPINE: { floor: 'fl_sanh', wall: 'wall_diamond', rug: 'rug_red', tint: '#F59E0B' },
  SEC_QA: { floor: 'fl_soan', wall: 'wall_white', rug: 'rug_red', tint: '#10B981' },
  STRATEGY: { floor: 'fl_dieu', wall: 'wall_gray', rug: 'rug_purple', tint: '#6366F1' },
  CODING: { floor: 'fl_trinh', wall: 'wall_wood', rug: 'rug_teal', tint: '#8B5CF6' },
  RESEARCH: { floor: 'fl_tracuu', wall: 'wall_cream', rug: 'rug_round_brown', tint: '#06B6D4' },
  ANALYTICS: { floor: 'fl_hop', wall: 'wall_white', rug: 'rug_blue', tint: '#F43F5E' },
  LEGAL: { floor: 'fl_thugian', wall: 'wall_pink', rug: 'rug_round_pink', tint: '#A855F7' },
  OPERATIONS: { floor: 'fl_morong', wall: 'wall_stone', rug: 'rug_gray', tint: '#14B8A6' },
  STUDIO: { floor: 'fl_mint', wall: 'wall_wood', rug: 'rug_purple', tint: '#EC4899' },
  FINANCE: { floor: 'fl_dieu', wall: 'wall_cream', rug: 'rug_blue', tint: '#EAB308' },
  CUSTOM: { floor: 'fl_mint', wall: 'wall_gray', rug: 'rug_teal', tint: '#38BDF8' },
};

function buildFloorplanDrawList(
  cx: CanvasRenderingContext2D,
  atlasImg: HTMLImageElement,
  roomLabelOverrides?: Record<string, string>,
  drawRoomSigns = false,
  dynamicOptions?: DynamicLimeZuFloorOptions,
): DrawItem[] {
  const items: DrawItem[] = [];
  const add = (k: number, fn: () => void) => items.push({ k, fn });

  const F = (x: number, y: number, w: number, h: number, c: string) => {
    cx.fillStyle = c;
    cx.fillRect(
      Math.round(x * TILE),
      Math.round(y * TILE),
      Math.max(1, Math.round(w * TILE)),
      Math.max(1, Math.round(h * TILE)),
    );
  };
  const CC = (cxX: number, cyY: number, r: number, c: string) => {
    cx.fillStyle = c;
    cx.beginPath();
    cx.arc(cxX * TILE, cyY * TILE, r * PX_RATIO, 0, Math.PI * 2);
    cx.fill();
  };
  const TXc = (x: number, y: number, str: string, size: number, c: string, bold = true) => {
    cx.fillStyle = c;
    const scaledPx = Math.max(9, Math.round(size * PX_RATIO * 10) / 10);
    cx.font = `${bold ? '800 ' : ''}${scaledPx}px "IBM Plex Sans", "Baloo 2", "Be Vietnam Pro", Arial, sans-serif`;
    cx.textAlign = 'center';
    cx.fillText(str, x * TILE, y * TILE);
  };
  const LN = (pts: ReadonlyArray<readonly [number, number]>, c: string, w: number) => {
    cx.strokeStyle = c;
    cx.lineWidth = w * PX_RATIO;
    cx.beginPath();
    cx.moveTo(pts[0][0] * TILE, pts[0][1] * TILE);
    for (let i = 1; i < pts.length; i++) cx.lineTo(pts[i][0] * TILE, pts[i][1] * TILE);
    cx.stroke();
  };
  const speck = (x: number, y: number, w: number, h: number, cols: string[], n: number, seed: number) => {
    for (let i = 0; i < n; i++) {
      const sx = x + rnd(seed + i * 3.7, seed + i) * w;
      const sy = y + rnd(seed + i, seed + i * 2.3) * h;
      F(sx, sy, 0.08, 0.08, cols[i % cols.length]);
    }
  };
  const shadow = (x: number, y: number, w: number, h: number) => {
    F(x + 0.07, y + 0.09, w, h, 'rgba(46,26,10,.20)');
  };
  const bev = (x: number, y: number, w: number, h: number, base: string) => {
    F(x, y, w, h, base);
    F(x, y, w, 0.045, 'rgba(255,255,255,.28)');
    F(x, y, 0.045, h, 'rgba(255,255,255,.16)');
    F(x, y + h - 0.045, w, 0.045, 'rgba(0,0,0,.22)');
    F(x + w - 0.045, y, 0.045, h, 'rgba(0,0,0,.14)');
  };
  const IMG = (name: string, dx: number, dy: number, dw: number, dh: number) => {
    const s = LIMEZU_SPR[name];
    if (!s) return;
    cx.drawImage(
      atlasImg,
      s[0],
      s[1],
      s[2],
      s[3],
      Math.round(dx),
      Math.round(dy),
      Math.max(1, Math.round(dw)),
      Math.max(1, Math.round(dh)),
    );
  };
  const IMGF = (name: string, dx: number, dy: number, dw: number, dh: number) => {
    const s = LIMEZU_SPR[name];
    if (!s) return;
    cx.save();
    cx.translate(0, Math.round(2 * dy + dh));
    cx.scale(1, -1);
    cx.drawImage(
      atlasImg,
      s[0],
      s[1],
      s[2],
      s[3],
      Math.round(dx),
      Math.round(dy),
      Math.max(1, Math.round(dw)),
      Math.max(1, Math.round(dh)),
    );
    cx.restore();
  };
  const P = (name: string, cxT: number, botT: number, sc?: number | null, key?: number) => {
    const s = LIMEZU_SPR[name];
    if (!s) return;
    const scale = sc != null ? sc * PX_RATIO : FSC;
    const w = s[2] * scale;
    const h = s[3] * scale;
    add(key == null ? botT : key, () => IMG(name, cxT * TILE - w / 2, botT * TILE - h, w, h));
  };
  const PF = (name: string, cxT: number, botT: number, sc?: number | null, key?: number) => {
    const s = LIMEZU_SPR[name];
    if (!s) return;
    const scale = sc != null ? sc * PX_RATIO : FSC;
    const w = s[2] * scale;
    const h = s[3] * scale;
    add(key == null ? botT : key, () => IMGF(name, cxT * TILE - w / 2, botT * TILE - h, w, h));
  };
  const PT = (name: string, x: number, y: number, sc?: number) => {
    const s = LIMEZU_SPR[name];
    if (!s) return;
    const scale = sc != null ? sc * PX_RATIO : FSC;
    const w = s[2] * scale;
    const h = s[3] * scale;
    add(y + h / TILE, () => IMG(name, x * TILE, y * TILE, w, h));
  };
  const PTW = (name: string, x: number, y: number, wTiles: number) => {
    const s = LIMEZU_SPR[name];
    if (!s) return;
    const w = wTiles * TILE;
    const h = (w * s[3]) / s[2];
    add(y + h / TILE, () => IMG(name, x * TILE, y * TILE, w, h));
  };
  const RUG = (name: string, x: number, y: number, wTiles: number) => {
    const s = LIMEZU_SPR[name];
    if (!s) return;
    const w = wTiles * TILE;
    const h = (w * s[3]) / s[2];
    add(0.2, () => IMG(name, x * TILE, y * TILE, w, h));
  };
  const LAPTOP = (cxT: number, botT: number, facing: 'N' | 'S', key: number) => {
    add(key, () => {
      const w = 0.6;
      const x = cxT - w / 2;
      const scrH = 0.3;
      const baseH = 0.17;
      const y = botT - scrH - baseH;
      if (facing === 'S') {
        F(x + 0.03, y, w - 0.06, baseH, '#9AA3AD');
        F(x + 0.07, y + 0.035, w - 0.14, baseH - 0.07, '#6E7780');
        F(x, y + baseH, w, scrH, '#23272E');
        F(x + 0.045, y + baseH + 0.04, w - 0.09, scrH - 0.075, '#7FB2F0');
        F(x + 0.075, y + baseH + 0.075, w - 0.28, 0.028, 'rgba(255,255,255,.75)');
        F(x + 0.075, y + baseH + 0.125, w - 0.2, 0.028, 'rgba(255,255,255,.45)');
      } else {
        F(x, y, w, scrH, '#2B2F36');
        F(x, y, w, 0.045, '#3A4048');
        CC(cxT, y + 0.17, 2.2, '#8A93A0');
        F(x + 0.03, y + scrH, w - 0.06, baseH, '#AEB6BF');
        F(x + 0.07, y + scrH + 0.035, w - 0.14, baseH - 0.07, '#79828C');
      }
    });
  };
  const CONFPHONE = (cxT: number, cyT: number, key: number) => {
    add(key, () => {
      F(cxT - 0.16, cyT - 0.09, 0.32, 0.18, '#23272E');
      F(cxT - 0.16, cyT - 0.09, 0.32, 0.045, '#3A4048');
      CC(cxT, cyT, 2.6, '#43D17C');
      CC(cxT - 0.09, cyT, 1.4, '#8A93A0');
      CC(cxT + 0.09, cyT, 1.4, '#8A93A0');
    });
  };
  const FLOOR = (x: number, y: number, w: number, h: number, set: string, seed: number) => {
    add(0.1, () => {
      for (let ix = 0; ix < w; ix++) {
        for (let iy = 0; iy < h; iy++) {
          const idx = Math.floor(rnd(seed + ix * 3.17, iy * 7.71 + seed) * 6);
          IMG(`${set}${idx}`, (x + ix) * TILE, (y + iy) * TILE, TILE, TILE);
        }
      }
    });
  };
  const FLOORFIX = (x: number, y: number, w: number, h: number, set: string) => {
    add(0.1, () => {
      for (let ix = 0; ix < w; ix++) {
        for (let iy = 0; iy < h; iy++) {
          const idx = ((x + ix) % 3) * 2 + ((y + iy) % 2);
          IMG(`${set}${idx}`, (x + ix) * TILE, (y + iy) * TILE, TILE, TILE);
        }
      }
    });
  };
  const BANDSEG = (x0: number, x1: number, y: number, wname: string, gaps?: Array<[number, number]>) => {
    add(0.15, () => {
      const bandH = Math.round(1.44 * TILE);
      for (let px = x0 * TILE; px < x1 * TILE - 1; px += TILE) {
        const cxx = px / TILE + 0.5;
        let skip = false;
        (gaps || []).forEach((g) => {
          if (cxx > g[0] && cxx < g[0] + g[1]) skip = true;
        });
        if (!skip) IMG(wname, px, y * TILE, TILE, bandH);
      }
      F(x0, y + 1.44, x1 - x0, 0.07, 'rgba(60,35,15,.30)');
    });
  };
  const clockT = (x: number, y: number) => {
    add(0.25, () => {
      CC(x, y, 13, '#3E2C1E');
      CC(x, y, 11, '#FFF7E6');
      LN([[x, y], [x, y - 0.13]], '#3E2C1E', 1.8);
      LN([[x, y], [x + 0.1, y + 0.04]], '#B91C1C', 1.8);
      CC(x, y, 1.8, '#3E2C1E');
    });
  };

  const dynamicFp = dynamicOptions?.floorplan;
  const workingCounts = dynamicOptions?.workingCountByRoom || {};
  const hitlCounts = dynamicOptions?.hitlCountByRoom || {};
  const selectedCanon = dynamicOptions?.selectedCanonicalZone || null;

  const paintRoomStateAndSopOverlays = (rooms: DynamicTileRoomSpec[]) => {
    add(0.145, () => {
      for (const rm of rooms) {
        const [rx0, ry0, rx1, ry1] = rm.tileRect;
        const rw = rx1 - rx0;
        const rh = ry1 - ry0;
        const activeCnt = workingCounts[rm.canonicalId] || 0;
        const hitlCnt = hitlCounts[rm.canonicalId] || 0;
        const isSel = selectedCanon === rm.canonicalId;
        const domainInfo = DOMAIN_TILE_STYLE[rm.themeDomain] || DOMAIN_TILE_STYLE.CUSTOM;

        // Domain pixel corner badge + active/HITL glow trim inside room boundary (SOP badge rendered cleanly in SVG overlay)
        F(rx0 + 0.22, ry1 - 0.44, 0.22, 0.22, domainInfo.tint);
        if (activeCnt > 0 || hitlCnt > 0 || isSel) {
          const borderCol = isSel
            ? 'rgba(56,189,248,0.65)'
            : hitlCnt > 0
              ? 'rgba(245,158,11,0.58)'
              : 'rgba(16,185,129,0.55)';
          const fillTint = isSel
            ? 'rgba(56,189,248,0.06)'
            : hitlCnt > 0
              ? 'rgba(245,158,11,0.06)'
              : 'rgba(16,185,129,0.05)';
          F(rx0 + 0.16, ry0 + (ry0 === 0 ? 1.48 : 0.16), rw - 0.32, rh - (ry0 === 0 ? 1.64 : 0.32), fillTint);
          F(rx0 + 0.16, ry1 - 0.14, rw - 0.32, 0.08, borderCol);
        }
      }
    });
  };

  if (dynamicFp) {
    // ================= PROCEDURAL N-SOP TILE ARCHITECTURE =================
    const renderDomainProps = (rm: DynamicTileRoomSpec) => {
      const [rx0, ry0, rx1, ry1] = rm.tileRect;
      const rw = rx1 - rx0;
      const cxMid = rx0 + rw * 0.5;
      const wallY = ry0 === 0 ? 0.32 : ry0 + 0.32;
      const shelfY = ry0 === 0 ? 1.05 : ry0 + 0.65;

      switch (rm.themeDomain) {
        case 'SEC_QA':
          if (rw >= 4) PTW('window1', rx0 + 0.4, wallY, 0.85);
          PT('server_cab', Math.max(rx0 + 0.25, rx1 - 1.15), shelfY);
          P('extinguisher', rx0 + 0.55, ry1 - 0.12);
          break;
        case 'STRATEGY':
          PTW('tv', cxMid - 0.55, wallY, 1.05);
          if (rw >= 6) PTW('worldmap', rx0 + 0.45, wallY, 1.0);
          P('sideboard1', cxMid, ry0 + 2.15);
          break;
        case 'CODING':
          PTW('blackboard', rx0 + 0.35, wallY, 1.05);
          if (rw >= 4) PT('servers', Math.max(rx0 + 0.3, rx1 - 2.3), shelfY);
          P('plant_round', rx1 - 0.55, ry1 - 0.12);
          break;
        case 'RESEARCH':
          PT('shelf_long', rx0 + 0.25, shelfY);
          P('globe', Math.max(rx0 + 0.6, rx1 - 0.8), ry0 + 2.15);
          break;
        case 'ANALYTICS':
          PTW('glassboard', cxMid - 0.55, wallY, 1.05);
          CONFPHONE(cxMid, ry0 + 2.85, ry0 + 2.9);
          break;
        case 'LEGAL':
          PT('cabinet2', rx0 + 0.3, shelfY);
          P('sideboard_books', Math.max(rx0 + 0.5, rx1 - 0.9), ry1 - 0.1);
          break;
        case 'OPERATIONS':
          P('kiosk', rx0 + 0.65, shelfY + 0.85);
          P('cooler', Math.max(rx0 + 0.7, rx1 - 0.7), shelfY + 0.85);
          break;
        case 'STUDIO':
          PTW('screen_big', cxMid - 0.55, wallY, 1.05);
          P('lamp_floor_r', rx0 + 0.5, ry1 - 0.18);
          P('sofa_tan2', Math.max(rx0 + 0.8, rx1 - 1.0), ry1 - 0.25, 0.52);
          break;
        case 'FINANCE':
          PT('cabinet3', rx0 + 0.3, shelfY);
          P('paper_doc', cxMid, ry0 + 2.65, null, ry0 + 2.75);
          break;
        default:
          PTW('pinboard', cxMid - 0.5, wallY, 0.95);
          P('plant_m2', rx1 - 0.6, ry1 - 0.12);
          break;
      }
    };

    const specialistRooms = dynamicFp.rooms.filter((r) => !r.isSpine && r.canonicalId !== dynamicFp.spineRoom.canonicalId);
    const spine = dynamicFp.spineRoom;
    const [sx0, sy0, sx1, sy1] = spine.tileRect;
    FLOOR(sx0, sy0, sx1 - sx0, sy1 - sy0, 'fl_sanh', 41);

    // Central medallion in spine
    if (sx1 - sx0 >= 8 && sy1 - sy0 >= 3) {
      const mx = sx0 + (sx1 - sx0) * 0.48;
      const my = sy0 + (sy1 - sy0) * 0.55;
      add(0.12, () => {
        CC(mx, my, 36, '#B49B6B');
        CC(mx, my, 28, '#D3BE93');
        LN([[mx, my - 0.25], [mx + 0.25, my], [mx, my + 0.25], [mx - 0.25, my], [mx, my - 0.25]], '#8A6F47', 2.2);
        CC(mx, my, 4, '#8A6F47');
      });
      RUG('rug_red', sx0 + 3.2, sy0 + 1.1, 2.2);
      P('sofa_tan2', sx0 + 4.3, sy0 + 1.9, 0.55);
      P('plant_p2', sx0 + 0.65, sy1 - 0.25);
      P('plant_p2', sx1 - 0.65, sy1 - 0.25);
    }

    specialistRooms.forEach((rm, idx) => {
      const [rx0, ry0, rx1, ry1] = rm.tileRect;
      const rw = rx1 - rx0;
      const rh = ry1 - ry0;
      const style = DOMAIN_TILE_STYLE[rm.themeDomain] || DOMAIN_TILE_STYLE.CUSTOM;

      FLOOR(rx0, ry0, rw, rh, style.floor, 17 + idx * 13);
      if (ry0 === 0) {
        BANDSEG(rx0, rx1, 0, style.wall);
      }

      if (rw >= 3.5) {
        RUG(style.rug, rx0 + rw * 0.22, ry0 + rh * 0.42, Math.min(2.4, rw * 0.55));
      }

      renderDomainProps(rm);

      // Dynamic workstation count matching room.seatCapacity
      const deskSprites = ['desk_v19', 'desk_v21', 'desk_v22', 'desk_v24', 'desk_v25', 'desk_v26'];
      const chairSprites = ['chair_w1', 'chair_w2', 'chair_w3', 'chair_w4'];
      const deskCols = Math.max(1, Math.min(3, rm.seatCapacity));
      for (let di = 0; di < Math.min(rm.seatCapacity, 6); di++) {
        const col = di % deskCols;
        const row = Math.floor(di / deskCols);
        const dx = rx0 + ((col + 0.5) / deskCols) * Math.max(2, rw - 0.8) + 0.4;
        const dy = ry0 + (row === 0 ? 2.65 : 4.25);
        if (dy < ry1 - 0.25 && dx > rx0 + 0.5 && dx < rx1 - 0.5) {
          P(deskSprites[(idx + di) % deskSprites.length]!, dx, dy);
          P(chairSprites[(idx + di) % chairSprites.length]!, dx, Math.min(ry1 - 0.08, dy + 0.42));
          LAPTOP(dx, dy - 0.06, 'N', dy + 0.02);
        }
      }
    });

    // Dynamic horizontal wall bands with exact doorway gaps
    const topDoors = dynamicFp.doors.filter((d) => d.band === 5).map((d) => [d.x + 0.55, 0.9] as [number, number]);
    if (topDoors.length > 0) {
      BANDSEG(0, 24, 5, 'wall_diamond', topDoors);
    }
    const botRooms = specialistRooms.filter((r) => r.tileRect[1] === 9);
    for (const br of botRooms) {
      const door = dynamicFp.doors.find((d) => d.roomCanonicalId === br.canonicalId);
      const style = DOMAIN_TILE_STYLE[br.themeDomain] || DOMAIN_TILE_STYLE.CUSTOM;
      BANDSEG(br.tileRect[0], br.tileRect[2], 9, style.wall, door ? [[door.x + 0.55, 0.9]] : undefined);
    }

    // Outer boundary & interior vertical divider walls
    add(90, () => {
      const WC = '#4A3423';
      const WH = '#6E4F30';
      const vw = (x: number, y0: number, y1: number, gaps?: Array<[number, number]>) => {
        F(x - 0.09, y0, 0.18, y1 - y0, WC);
        F(x - 0.09, y0, 0.05, y1 - y0, WH);
        (gaps || []).forEach((g) => {
          F(x - 0.09, g[0], 0.18, g[1], '#D9C6A5');
          F(x - 0.04, g[0], 0.03, g[1], 'rgba(120,90,50,.4)');
        });
      };
      F(0, 0, 24, 0.14, WC);
      F(0, 13.86, 24, 0.14, WC);
      F(0, 13.86, 24, 0.05, WH);
      F(0, 0, 0.14, 14, WC);
      F(23.86, 0, 0.14, 14, WC);
      for (const wall of dynamicFp.verticalWalls) {
        vw(wall.x, wall.y0, wall.y1, wall.gaps);
      }
    });

    // Dynamic door frames at every computed doorway
    const DOORF_DYN = (x: number, yBand: number) => {
      add(yBand + 1.44, () => {
        cx.drawImage(
          atlasImg,
          820,
          282,
          44,
          64,
          Math.round(x * TILE),
          Math.round(yBand * TILE),
          TILE,
          Math.round(1.44 * TILE),
        );
      });
    };
    dynamicFp.doors.forEach((d) => DOORF_DYN(d.x, d.band));

    // Dynamic Spine floor title
    add(0.14, () => {
      const spineTxt = (roomLabelOverrides?.[spine.canonicalId] || spine.name || 'CORE SPINE').toUpperCase();
      TXc(sx0 + (sx1 - sx0) * 0.48, sy1 - 0.38, spineTxt, 15, '#6B4E2E', true);
    });

    paintRoomStateAndSopOverlays(dynamicFp.rooms);
    return items;
  }

  // ================= FLOORS =================
  FLOOR(0, 0, 7, 5, 'fl_soan', 11);
  FLOOR(7, 0, 10, 5, 'fl_dieu', 23);
  FLOOR(17, 0, 7, 5, 'fl_trinh', 37);
  FLOOR(0, 5, 24, 4, 'fl_sanh', 41);
  FLOORFIX(0, 5, 6, 4, 'fl_mint');
  FLOORFIX(18, 5, 6, 4, 'fl_mint');
  FLOOR(11, 5, 2, 4, 'fl_sanh', 53);
  FLOOR(10, 6, 4, 2, 'fl_sanh', 59);
  FLOOR(0, 9, 6, 5, 'fl_tracuu', 61);
  FLOOR(6, 9, 6, 5, 'fl_hop', 67);
  FLOOR(12, 9, 6, 5, 'fl_thugian', 71);
  FLOOR(18, 9, 6, 5, 'fl_morong', 73);

  // ================= WALL BANDS =================
  BANDSEG(0, 7, 0, 'wall_white');
  BANDSEG(7, 17, 0, 'wall_gray');
  BANDSEG(17, 24, 0, 'wall_wood');
  BANDSEG(0, 24, 5, 'wall_diamond', [[3.1, 0.9], [11, 1.5], [20.1, 0.9]]);
  BANDSEG(0, 6, 9, 'wall_cream', [[4.1, 0.9]]);
  BANDSEG(6, 12, 9, 'wall_white', [[11, 1.5]]);
  BANDSEG(12, 18, 9, 'wall_pink', [[15.9, 0.9]]);
  BANDSEG(18, 24, 9, 'wall_stone', [[20.8, 0.9]]);

  // ================= BA-TESTER (0-7, 0-5) =================
  RUG('rug_red', 2.15, 3.2, 2.2);
  PTW('window1', 1.2, 0.3, 0.85);
  PTW('window2', 4.35, 0.3, 0.85);
  PTW('frame_art1', 0.28, 0.32, 0.5);
  PTW('pinboard', 2.75, 0.32, 1.05);
  clockT(6.3, 0.65);
  P('desk_v19', 1.7, 2.45);
  P('desk_v21', 3.6, 2.45);
  P('desk_v22', 5.5, 2.45);
  P('chair_w1', 1.7, 2.92);
  P('chair_w2', 3.6, 2.92);
  P('chair_w3', 5.5, 2.92);
  P('desk_v24', 2.2, 4.55);
  P('desk_v25', 4.3, 4.55);
  P('paper_doc', 3.6, 2.32, null, 2.44);
  P('paper_doc', 2.2, 4.42, null, 4.54);
  P('books_pile', 4.3, 4.38, null, 4.53);
  P('chair_w4', 2.2, 4.98);
  P('chair_w1', 4.3, 4.98);
  PT('shelf_small', 0.15, 3.3);
  P('plant_round', 6.35, 4.95);

  // ================= PHÒNG ĐIỀU HÀNH (7-17, 0-5) =================
  PTW('tv', 10.15, 0.3, 1.05);
  PTW('tv2', 11.45, 0.3, 1.05);
  PTW('tv', 12.75, 0.3, 1.05);
  PTW('pinboard', 15.05, 0.3, 1.0);
  clockT(14.55, 0.65);
  P('sideboard1', 11.35, 2.35);
  P('sideboard_lamp', 12.62, 2.35);
  P('desk_v20', 8.6, 4.6);
  P('chair_w2', 8.6, 5.0);
  P('desk_v26', 15.4, 4.6);
  P('chair_w1', 15.4, 5.0);
  P('plant_big', 16.35, 4.95);
  PT('server_cab', 16.08, 0.95);

  // ================= PHÒNG AI-DEV (17-24, 0-5) =================
  PTW('blackboard', 17.3, 0.35, 1.1);
  PTW('pinboard', 21.35, 0.32, 1.0);
  P('desk_v21', 18.7, 2.45);
  P('desk_v23', 20.6, 2.45);
  P('desk_v25', 22.5, 2.45);
  P('chair_w1', 18.7, 2.92);
  P('chair_w2', 20.6, 2.92);
  P('chair_w3', 22.5, 2.92);
  P('desk_v20', 18.7, 4.55);
  P('desk_v26', 22.5, 4.55);
  PT('server1', 18.98, 4.06, 0.62);
  P('chair_w4', 18.7, 5.02);
  P('chair_w1', 22.5, 5.02);
  PT('server_cab', 23.12, 0.78);
  PT('server_cab', 23.12, 2.18);
  PT('server_cab', 23.12, 3.58);
  P('plant_s2', 17.55, 4.95);
  P('extinguisher', 17.5, 2.05);

  // ================= ĐẠI SẢNH CHUNG (0-24, 5-9) =================
  PTW('cabinet_frames', 4.95, 5.25, 0.95);
  PTW('worldmap', 14.35, 5.3, 1.2);
  add(0.12, () => {
    CC(11.5, 7.3, 52, '#A98F5F');
    CC(11.5, 7.3, 47, '#C9B489');
    CC(11.5, 7.3, 36, '#B49B6B');
    CC(11.5, 7.3, 30, '#D3BE93');
    speck(11.22, 7.02, 0.56, 0.56, ['rgba(169,143,95,.5)', 'rgba(125,99,63,.35)'], 12, 77);
    LN([[11.5, 7.0], [11.8, 7.3], [11.5, 7.6], [11.2, 7.3], [11.5, 7.0]], '#8A6F47', 2.5);
    CC(11.5, 7.3, 4, '#8A6F47');
    CC(12.28, 7.3, 3, '#7D8C5C');
    CC(10.72, 7.3, 3, '#7D8C5C');
    CC(11.5, 6.52, 3, '#A98F5F');
    CC(11.5, 8.08, 3, '#A98F5F');
    CC(12.05, 6.75, 3, '#A98F5F');
    CC(10.95, 6.75, 3, '#A98F5F');
    CC(12.05, 7.85, 3, '#7D8C5C');
    CC(10.95, 7.85, 3, '#7D8C5C');
  });

  const labelLobby = (
    roomLabelOverrides?.sop_generic_7p ||
    roomLabelOverrides?.sanh ||
    roomLabelOverrides?.central_lobby ||
    'ĐIỀU PHỐI & VIBE WORKING'
  ).toUpperCase();
  const labelExec = (
    roomLabelOverrides?.sop_strategy_01 ||
    roomLabelOverrides?.dieu ||
    roomLabelOverrides?.exec_hq ||
    'CHIẾN LƯỢC & KIẾN TRÚC'
  ).toUpperCase();
  const FLOORTX = (cxT: number, baseT: number, str: string, size: number, main: string, hi: string) => {
    TXc(cxT + 0.02, baseT + 0.02, str, size, hi);
    TXc(cxT, baseT, str, size, main);
  };
  add(0.14, () => {
    FLOORTX(11.5, 8.62, labelLobby, 16, '#6B4E2E', 'rgba(255,248,230,.55)');
    FLOORTX(12, 3.08, labelExec, labelExec.length > 18 ? 21 : 27, '#7C5A33', 'rgba(255,240,210,.45)');
  });

  const speckM = (
    x: number,
    y: number,
    w: number,
    h: number,
    cols: string[],
    n: number,
    seed: number,
    bx: number,
    mirror: boolean,
  ) => {
    for (let i = 0; i < n; i++) {
      let sx = x + rnd(seed + i * 3.7, seed + i) * w;
      const sy = y + rnd(seed + i, seed + i * 2.3) * h;
      if (mirror) sx = bx + (1.3 - (sx - bx) - 0.08);
      F(sx, sy, 0.08, 0.08, cols[i % cols.length]);
    }
  };
  const flowerBed19 = (bx: number, by: number, mirror: boolean) => {
    add(7.9, () => {
      shadow(bx + 0.03, by + 0.06, 1.3, 1.1);
      bev(bx, by, 1.3, 1.1, '#7D6353');
      F(bx + 0.1, by + 0.1, 1.1, 0.9, '#4A3524');
      speckM(bx + 0.12, by + 0.12, 1.06, 0.86, ['rgba(30,20,12,.35)', 'rgba(120,90,60,.30)'], 12, 61, bx, mirror);
      const blobs: Array<[number, number, number, string]> = [
        [0.3, 0.36, 8, '#4E7A3A'],
        [1.0, 0.34, 7, '#5C8A44'],
        [0.32, 0.78, 9, '#557F3E'],
        [1.02, 0.8, 8, '#4E7A3A'],
        [0.66, 1.02, 7, '#5C8A44'],
      ];
      blobs.forEach((b) => {
        const ox = mirror ? 1.3 - b[0] : b[0];
        CC(bx + ox, by + b[1], b[2], b[3]);
      });
      IMG('plant_m3', (bx + 0.65) * TILE - 11, Math.round((by - 0.06) * TILE), 22, 28);
      speckM(bx + 0.16, by + 0.16, 1.0, 0.82, ['#E86A92', '#F2B134', '#F5F0E6', '#E4572E'], 9, 92, bx, mirror);
    });
  };
  flowerBed19(8.75, 6.75, false);
  flowerBed19(12.95, 6.75, true);
  P('lamp_floor_r', 7.95, 7.42);
  P('dresser1', 1.6, 7.6);
  P('chair_top2', 1.6, 7.05);
  P('chair_top1', 1.6, 8.5);
  RUG('rug_round_brown', 0.55, 7.0, 1.6);
  P('plant_p2', 0.55, 8.92);
  RUG('rug_red', 5.15, 6.5, 2.7);
  P('sofa_tan2', 6.5, 7.22);
  P('table_sq2', 6.5, 8.08, 0.55);
  PF('chair_top1', 5.72, 8.34);
  PF('chair_top2', 7.28, 8.34);
  add(6.05, () => {
    F(21.25, 5.94, 2.2, 0.09, '#6E4F30');
    F(21.25, 5.9, 2.2, 0.045, '#A98F5F');
  });
  P('bottles1', 21.85, 5.94, null, 6.1);
  P('bottle_grn', 22.75, 5.94, null, 6.1);
  add(6.6, () => {
    F(16.05, 6.62, 3.53, 0.07, '#8A5A33');
    F(21.1, 6.62, 2.8, 0.07, '#8A5A33');
  });
  PT('bar_counter', 16.05, 6.68);
  P('bottles2', 16.75, 6.82, null, 7.3);
  P('bottle_grn', 19.05, 6.82, null, 7.3);
  P('bar_stool', 16.5, 7.78);
  P('bar_stool', 17.35, 7.78);
  P('bar_stool', 18.2, 7.78);
  P('bar_stool', 19.05, 7.78);
  P('plant_tall', 15.75, 7.9);
  PTW('bar_counter', 21.1, 6.68, 2.8);
  P('bottles2', 21.8, 6.82, null, 7.3);
  P('bottle_blu', 23.15, 6.82, null, 7.3);
  P('bar_stool', 21.7, 7.78);
  P('bar_stool', 23.35, 7.78);
  RUG('rug_round_brown', 21.68, 7.5, 1.3);
  P('table_round', 22.35, 8.36);
  P('bar_stool', 21.5, 8.34);
  P('bar_stool', 23.2, 8.34);
  P('lamp_floor_w', 23.55, 7.35);
  P('plant_p2', 23.45, 8.92);

  // ================= ĐÀO TẠO (0-6, 9-14) =================
  PT('shelf_long', 0.22, 9.5);
  PT('shelfB1', 2.95, 9.62);
  PT('shelfB2', 4.8, 9.62);
  P('globe', 5.5, 11.02);
  P('table_sq2', 2.6, 12.55);
  P('books_pile2', 2.45, 12.3, null, 12.62);
  P('chair_top1', 1.62, 12.5);
  P('chair_top2', 3.58, 12.5);
  P('blackboard', 4.6, 13.92);
  P('plant_m2', 0.55, 13.95);

  // ================= PHÒNG HỌP (6-12, 9-14) =================
  RUG('rug_blue', 7.55, 10.3, 2.9);
  PTW('blackboard', 7.35, 9.3, 1.05);
  P('plant_m3', 6.4, 10.35);
  PT('table_sq1', 7.6, 10.55);
  PT('table_sq2', 9.02, 10.55);
  P('paper_doc', 9.0, 11.05, null, 11.95);
  P('chair_w1', 8.2, 10.5);
  P('chair_w2', 9.0, 10.5);
  P('chair_w1', 9.8, 10.5);
  P('chair_top1', 8.2, 12.42);
  P('chair_top2', 9.0, 12.42);
  P('chair_top1', 9.8, 12.42);
  LAPTOP(8.2, 11.5, 'N', 11.93);
  LAPTOP(9.8, 11.5, 'N', 11.93);
  LAPTOP(9.0, 11.86, 'S', 11.93);
  CONFPHONE(9.0, 11.3, 11.94);
  P('cooler', 9.3, 13.92);
  P('blackboard', 11.0, 13.92);
  PT('shelfB2', 6.2, 12.68);

  // ================= HCNS (12-18, 9-14) =================
  PT('dresser1', 12.3, 9.62);
  PT('dresser2', 13.42, 9.62);
  PT('shelf_small', 17.3, 9.55);
  PTW('tv2', 14.63, 9.28, 1.15);
  P('desk_v20', 13.9, 12.2);
  P('chair_w2', 13.9, 12.67);
  P('desk_v21', 15.9, 12.2);
  P('chair_w4', 15.9, 12.67);
  P('paper_doc', 13.9, 12.05, null, 12.19);
  P('sidebd1', 12.75, 13.95);
  P('lamp_tab_b', 12.75, 13.32, null, 14.0);
  P('sideboard_books', 14.5, 13.95);
  P('table_sq1', 17.2, 13.6);
  P('chair_top1', 17.2, 13.95);

  // ================= KINH DOANH (18-24, 9-14) =================
  PT('cabinet2', 18.12, 9.62);
  P('desk_v25', 22.9, 12.0);
  P('chair_w1', 22.9, 12.47);
  P('paper_doc', 22.9, 11.87, null, 11.99);
  P('desk_v24', 20.5, 13.85);
  P('chair_top1', 20.5, 12.6);
  P('books_pile2', 20.5, 13.8, null, 13.84);
  P('desk_v26', 22.6, 13.85);
  P('chair_top2', 22.6, 12.6);
  P('paper_doc', 22.6, 13.72, null, 13.84);
  P('extinguisher', 23.55, 13.9);
  RUG('rug_red', 18.35, 12.55, 1.5);
  P('sofa_tan2', 19.0, 13.5, 0.58);

  // ================= DIVIDERS + OUTER FRAME =================
  add(90, () => {
    const WC = '#4A3423';
    const WH = '#6E4F30';
    const vw = (x: number, y0: number, y1: number, gaps?: Array<[number, number]>) => {
      F(x - 0.09, y0, 0.18, y1 - y0, WC);
      F(x - 0.09, y0, 0.05, y1 - y0, WH);
      (gaps || []).forEach((g) => {
        F(x - 0.09, g[0], 0.18, g[1], '#D9C6A5');
        F(x - 0.04, g[0], 0.03, g[1], 'rgba(120,90,50,.4)');
      });
    };
    F(0, 0, 24, 0.14, WC);
    F(0, 13.86, 24, 0.14, WC);
    F(0, 13.86, 24, 0.05, WH);
    F(0, 0, 0.14, 14, WC);
    F(23.86, 0, 0.14, 14, WC);
    vw(7, 0, 5, [[2.2, 0.9]]);
    vw(17, 0, 5, [[2.2, 0.9]]);
    vw(6, 9, 14, [[11.2, 0.9]]);
    vw(12, 9, 14, [[11.2, 0.9]]);
    vw(18, 9, 14, [[11.2, 0.9]]);
  });

  // 7 wooden doors (static base frames; animated overlay draws over these when triggered)
  const DOORF = (x: number, yBand: number) => {
    add(yBand + 1.44, () => {
      cx.drawImage(
        atlasImg,
        820,
        282,
        44,
        64,
        Math.round(x * TILE),
        Math.round(yBand * TILE),
        TILE,
        Math.round(1.44 * TILE),
      );
    });
  };
  DOORF(3, 5);
  DOORF(11, 5);
  DOORF(20, 5);
  DOORF(4, 9);
  DOORF(11, 9);
  DOORF(16, 9);
  DOORF(21, 9);

  add(90.5, () => {
    [
      [7, 2.2],
      [7, 3.1],
      [17, 2.2],
      [17, 3.1],
      [6, 11.2],
      [6, 12.1],
      [12, 11.2],
      [12, 12.1],
      [18, 11.2],
      [18, 12.1],
    ].forEach((p) => F(p[0] - 0.13, p[1] - 0.07, 0.26, 0.13, '#4A3423'));
  });

  // Brass-riveted dark wood wall plaques for the 6 outer rooms (optional; suppressed when HTML plaques render)
  if (drawRoomSigns) {
    add(97, () => {
      const SIGN = (cxT: number, cyT: number, baseW: number, label: string, fs: number) => {
        const txt = label.trim().toUpperCase();
        const w = Math.max(baseW, Math.min(3.4, txt.length * 0.21 + 0.55));
        const h = 0.62;
        const x0 = cxT - w / 2;
        const y0 = cyT - h / 2;
        F(x0 + 0.045, y0 + 0.055, w, h, 'rgba(46,26,10,.30)');
        F(x0, y0, w, h, '#503A26');
        F(x0, y0, w, 0.045, '#A98F5F');
        F(x0, y0 + h - 0.045, w, 0.045, '#A98F5F');
        F(x0, y0, 0.045, h, '#A98F5F');
        F(x0 + w - 0.045, y0, 0.045, h, '#A98F5F');
        CC(cxT - w / 2 + 0.16, y0 + 0.13, 2.2, '#D8C9A3');
        CC(cxT + w / 2 - 0.16, y0 + 0.13, 2.2, '#D8C9A3');
        TXc(cxT, cyT + 0.13, txt, txt.length > 14 ? fs * 0.82 : fs, '#F8F1DE');
      };
      SIGN(1.18, 5.34, 2.0, roomLabelOverrides?.sop_sec_audit_01 || roomLabelOverrides?.soan || roomLabelOverrides?.ba_tester || 'KIỂM TOÁN & QA', 13);
      SIGN(18.18, 5.34, 2.0, roomLabelOverrides?.sop_coding_01 || roomLabelOverrides?.trinh || roomLabelOverrides?.ai_dev || 'KỸ THUẬT & TDD', 13);
      SIGN(1.28, 9.36, 2.2, roomLabelOverrides?.sop_research_01 || roomLabelOverrides?.tracuu || roomLabelOverrides?.academy || 'NGHIÊN CỨU', 12.5);
      SIGN(9.7, 9.36, 2.4, roomLabelOverrides?.sop_analytics_01 || roomLabelOverrides?.hop || roomLabelOverrides?.war_room || 'PHÂN TÍCH & BI', 12.5);
      SIGN(13.13, 9.36, 1.9, roomLabelOverrides?.sop_legal_01 || roomLabelOverrides?.thugian || roomLabelOverrides?.hr_ops || 'PHÁP LÝ', 13);
      SIGN(19.48, 9.36, 2.6, roomLabelOverrides?.sop_operations_01 || roomLabelOverrides?.morong || roomLabelOverrides?.commercial || 'VẬN HÀNH & DR', 12.5);
    });
  }

  return items;
}

export function paintLimeZuOfficeFloorplan(
  ctx: CanvasRenderingContext2D,
  atlasImg: HTMLImageElement,
  roomLabelOverrides?: Record<string, string>,
  drawRoomSigns = false,
  dynamicOptions?: DynamicLimeZuFloorOptions,
): void {
  const fpSig = dynamicOptions?.floorplan?.signature || 'classic';
  const workSig = dynamicOptions?.workingCountByRoom
    ? JSON.stringify(dynamicOptions.workingCountByRoom)
    : '';
  const hitlSig = dynamicOptions?.hitlCountByRoom
    ? JSON.stringify(dynamicOptions.hitlCountByRoom)
    : '';
  const selSig = dynamicOptions?.selectedCanonicalZone || '';
  const sig = `${JSON.stringify(roomLabelOverrides || {})}|signs=${drawRoomSigns ? 1 : 0}|fp=${fpSig}|w=${workSig}|h=${hitlSig}|s=${selSig}`;
  if (typeof document !== 'undefined') {
    if (!cachedFloorCanvas || cachedFloorSignature !== sig) {
      const offscreen = document.createElement('canvas');
      offscreen.width = LIMEZU_STAGE_W;
      offscreen.height = LIMEZU_STAGE_H;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        offCtx.imageSmoothingEnabled = false;
        const items = buildFloorplanDrawList(offCtx, atlasImg, roomLabelOverrides, drawRoomSigns, dynamicOptions);
        items.sort((a, b) => a.k - b.k);
        items.forEach((it) => it.fn());
        cachedFloorCanvas = offscreen;
        cachedFloorSignature = sig;
      }
    }
    if (cachedFloorCanvas) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(cachedFloorCanvas, 0, 0);
      return;
    }
  }
  ctx.imageSmoothingEnabled = false;
  const items = buildFloorplanDrawList(ctx, atlasImg, roomLabelOverrides, drawRoomSigns, dynamicOptions);
  items.sort((a, b) => a.k - b.k);
  items.forEach((it) => it.fn());
}

